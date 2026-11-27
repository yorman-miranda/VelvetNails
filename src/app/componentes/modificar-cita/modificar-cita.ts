import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Cliente, ClienteService } from '../../service/cliente/cliente.service';
import { ActualizarCitaRequest, Cita, CitaService, HorarioAtencion } from '../../service/cita/cita.service';
import { finalize } from 'rxjs';
import { formatearHora as formatearHora12 } from '../../utilidades/formato-hora';

@Component({
  imports: [FormsModule],
  selector: 'app-modificar-cita',
  styleUrl: './modificar-cita.css',
  templateUrl: './modificar-cita.html',
})
export class ModificarCita {
  private readonly clienteService = inject(ClienteService);
  private readonly citaService = inject(CitaService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  readonly formatearHora = formatearHora12;

  @Input() diasCerrados: string[] = [];
  @Input() horariosPorDia: Record<string, HorarioAtencion> = {};
  @Output() cancelar = new EventEmitter<void>();

  readonly fechaMinima = this.hoyIso();
  readonly horas = Array.from({ length: 12 }, (_, indice) => indice + 8);
  get horasDisponibles(): number[] {
    if (!this.fechaValida(this.fecha)) return [];

    const horario = this.horariosPorDia[this.fecha] ?? { horaInicio: 8, horaFin: 19 };
    const citasDelDia = this.citas.filter((cita) =>
      cita.idCita !== this.citaSeleccionada?.idCita &&
      cita.estadoCita !== 'RECHAZADA' &&
      this.fechaDeCita(cita) === this.fecha
    );
    if (citasDelDia.length >= 5) return [];
    const yaHayCitaLarga = citasDelDia.some((cita) => cita.tiempoCita === 3);
    const disponibles: number[] = [];

    for (let hora = horario.horaInicio; hora + this.tiempoCita <= horario.horaFin; hora++) {
      if (this.tiempoCita === 3 && (yaHayCitaLarga || (hora !== 8 && hora !== 16))) continue;

      if (!this.tieneAnticipacionSuficiente(this.fecha, hora)) continue;

      const seCruza = citasDelDia.some((cita) =>
        hora < cita.horaCita + cita.tiempoCita &&
        cita.horaCita < hora + this.tiempoCita
      );
      if (!seCruza) disponibles.push(hora);
    }
    return disponibles;
  }
  tipoBusqueda: 'documento' | 'telefono' = 'documento';
  terminoBusqueda = '';
  clientesEncontrados: Cliente[] = [];
  private citasPorCliente = new Map<number, Cita[]>();
  clienteSeleccionado: Cliente | null = null;
  citas: Cita[] = [];
  citaSeleccionada: Cita | null = null;
  fecha = '';
  horaCita = 8;
  tiempoCita: 2 | 3 = 2;
  buscando = false;
  guardando = false;
  mensajeError = '';
  mensajeInfo = '';
  mensajeExito = '';

  get formularioInvalido(): boolean {
    if (!this.citaSeleccionada || !this.fechaValida(this.fecha)) return true;

    const horario = this.horariosPorDia[this.fecha] ?? { horaInicio: 8, horaFin: 19 };
    if (
      !Number.isInteger(this.horaCita) ||
      this.horaCita < horario.horaInicio ||
      this.horaCita + this.tiempoCita > horario.horaFin ||
      (this.tiempoCita !== 2 && this.tiempoCita !== 3) ||
      !this.tieneAnticipacionSuficiente(this.fecha, this.horaCita)
    ) {
      return true;
    }

    if (
      this.tiempoCita === 3 &&
      this.horaCita !== 8 &&
      this.horaCita !== 16
    ) {
      return true;
    }

    const citasDelDia = this.citas.filter((cita) =>
      cita.idCita !== this.citaSeleccionada?.idCita &&
      cita.estadoCita !== 'RECHAZADA' &&
      this.fechaDeCita(cita) === this.fecha
    );
    if (citasDelDia.length >= 5) return true;
    if (citasDelDia.some((cita) =>
      this.horaCita < cita.horaCita + cita.tiempoCita &&
      cita.horaCita < this.horaCita + this.tiempoCita
    )) {
      return true;
    }

    return this.tiempoCita === 3 && citasDelDia.some((cita) => cita.tiempoCita === 3);
  }

  buscar(): void {
    const termino = this.terminoBusqueda.trim();
    if (this.buscando || !termino) {
      this.mensajeError = 'Ingresa tu documento o teléfono para buscar.';
      return;
    }

    this.buscando = true;
    this.mensajeError = '';
    this.mensajeInfo = '';
    this.mensajeExito = '';
    this.clientesEncontrados = [];
    this.clienteSeleccionado = null;
    this.citas = [];
    this.citasPorCliente.clear();
    this.citaSeleccionada = null;

    const resultados$ = this.tipoBusqueda === 'documento'
      ? this.clienteService.buscarCitasPorDocumento(termino)
      : this.clienteService.buscarCitasPorTelefono(termino);

    resultados$.pipe(
      finalize(() => {
        this.buscando = false;
        this.changeDetectorRef.markForCheck();
      }),
    ).subscribe({
      next: (resultados) => {
        this.clientesEncontrados = resultados.map((resultado) => resultado.cliente);
        this.citasPorCliente = new Map(
          resultados.map((resultado): [number, Cita[]] =>
            [resultado.cliente.idCliente, resultado.citas]
          )
        );
        if (resultados.length === 0) {
          this.mensajeInfo = 'No encontramos clientes con ese dato.';
        } else if (resultados.length === 1) {
          this.seleccionarCliente(resultados[0].cliente);
        }
      },
      error: (error: unknown) => {
        this.buscando = false;
        this.mensajeError = error instanceof HttpErrorResponse && error.status === 404
          ? `No encontramos un cliente con ese ${this.tipoBusqueda === 'documento' ? 'documento' : 'teléfono'}.`
          : 'No se pudo realizar la búsqueda. Inténtalo nuevamente.';
      },
    });
  }

  seleccionarCliente(cliente: Cliente): void {
    this.clienteSeleccionado = cliente;
    this.mensajeError = '';
    this.mensajeInfo = '';
    this.citas = this.citasPorCliente.get(cliente.idCliente) ?? [];
    this.citaSeleccionada = null;
    this.citas = this.citas.filter((cita) => cita.estadoCita !== 'RECHAZADA');
    if (this.citas.length === 0) {
      this.mensajeInfo = 'Este cliente no tiene citas activas para modificar.';
    }
  }

  editar(cita: Cita): void {
    if (!this.esModificable(cita)) return;
    this.citaSeleccionada = cita;
    this.fecha = this.fechaDeCita(cita);
    this.horaCita = cita.horaCita;
    this.tiempoCita = cita.tiempoCita === 3 ? 3 : 2;
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  cambiarDuracion(duracion: 2 | 3): void {
    this.tiempoCita = duracion;
    if (!this.horasDisponibles.includes(this.horaCita)) {
      this.horaCita = this.horasDisponibles[0] ?? 8;
    }
  }

  ajustarHoraDisponible(): void {
    if (!this.horasDisponibles.includes(this.horaCita)) {
      this.horaCita = this.horasDisponibles[0] ?? 8;
    }
  }

  esModificable(cita: Cita): boolean {
    return cita.estadoCita !== 'RECHAZADA' &&
      this.inicioDeCita(cita) - Date.now() >= 24 * 60 * 60 * 1000;
  }

  motivoNoModificable(cita: Cita): string {
    return this.inicioDeCita(cita) <= Date.now()
      ? 'La cita ya pasó y no se puede modificar.'
      : 'No se puede modificar: faltan menos de 24 horas para la cita.';
  }

  guardarCambios(): void {
    if (
      this.guardando ||
      !this.citaSeleccionada ||
      !this.clienteSeleccionado ||
      this.formularioInvalido
    ) {
      this.mensajeError = 'Verifica que la fecha y el horario estén disponibles y que falten al menos 24 horas.';
      return;
    }

    const cita = this.citaSeleccionada;
    const request: ActualizarCitaRequest = {
      dia: Number(this.fecha.slice(8, 10)),
      mes: Number(this.fecha.slice(5, 7)),
      anio: Number(this.fecha.slice(0, 4)),
      horaCita: this.horaCita,
      tiempoCita: this.tiempoCita,
      idCliente: this.clienteSeleccionado.idCliente,
    };

    this.guardando = true;
    this.mensajeError = '';
    this.mensajeExito = '';
    this.citaService.updateCita(cita.idCita, request).pipe(
      finalize(() => {
        this.guardando = false;
        this.changeDetectorRef.markForCheck();
      }),
    ).subscribe({
      next: (actualizada) => {
        this.citas = this.citas.map((actual) =>
          actual.idCita === actualizada.idCita ? actualizada : actual
        );
        this.citaSeleccionada = null;
        this.mensajeExito = 'La cita se modificó correctamente.';
      },
      error: (error: unknown) => {
        this.mensajeError = error instanceof HttpErrorResponse &&
          typeof error.error === 'object' &&
          error.error !== null &&
          'message' in error.error &&
          typeof error.error.message === 'string'
          ? error.error.message
          : 'No se pudo modificar la cita. Verifica los datos y vuelve a intentarlo.';
      },
    });
  }

  private fechaValida(fecha: string): boolean {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
      fecha < this.fechaMinima ||
      this.diasCerrados.includes(fecha)
    ) {
      return false;
    }
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const calendario = new Date(anio, mes - 1, dia);
    return calendario.getFullYear() === anio &&
      calendario.getMonth() === mes - 1 &&
      calendario.getDate() === dia;
  }

  private tieneAnticipacionSuficiente(fecha: string, hora: number): boolean {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const inicio = new Date(anio, mes - 1, dia, hora);
    return inicio.getTime() - Date.now() >= 24 * 60 * 60 * 1000;
  }

  private fechaDeCita(cita: Cita): string {
    return `${cita.anio}-${String(cita.mes).padStart(2, '0')}-${String(cita.dia).padStart(2, '0')}`;
  }

  private inicioDeCita(cita: Cita): number {
    return new Date(cita.anio, cita.mes - 1, cita.dia, cita.horaCita).getTime();
  }

  private hoyIso(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  }
}
