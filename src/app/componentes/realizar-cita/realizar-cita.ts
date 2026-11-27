import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, switchMap, throwError } from 'rxjs';
import { HorarioAtencion } from '../../service/cita/cita.service';
import { CitaService } from '../../service/cita/cita.service';
import { ClienteCreate, ClienteService } from '../../service/cliente/cliente.service';
import { formatearHora as formatearHora12 } from '../../utilidades/formato-hora';

@Component({
  imports: [FormsModule],
  selector: 'app-realizar-cita',
  styleUrl: './realizar-cita.css',
  templateUrl: './realizar-cita.html',
})
export class RealizarCita {
  private citaService = inject(CitaService);
  private clienteService = inject(ClienteService);
  readonly formatearHora = formatearHora12;

  @Input() fechaInicial = '';
  @Input() horaInicial = 8;
  @Input() duracionInicial: 2 | 3 = 2;
  @Input() diasCerrados: string[] = [];
  @Input() horariosPorDia: Record<string, HorarioAtencion> = {};
  @Output() citaCreada = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
  @Output() volverInicio = new EventEmitter<void>();

  readonly fechaMinima = this.fechaAgendableDesde();
  readonly horas = Array.from({ length: 12 }, (_, indice) => indice + 8);
  fecha = this.fechaMinima;
  horaCita = 8;
  tiempoCita: 2 | 3 = 2;
  enviando = false;
  mensajeError = '';
  mensajeExito = '';
  cliente: ClienteCreate = this.clienteVacio();

  ngOnInit(): void {
    this.fecha = this.fechaInicial || this.fechaMinima;
    this.horaCita = this.horaInicial;
    this.tiempoCita = this.duracionInicial;
  }

  get citaInvalida(): boolean {
    return !this.fechaValida(this.fecha) || !this.horarioValido();
  }

  get horasDisponibles(): number[] {
    const horario = this.horariosPorDia[this.fecha] ?? { horaInicio: 8, horaFin: 19 };
    return this.horas.filter((hora) =>
      hora >= horario.horaInicio &&
      hora + this.tiempoCita <= horario.horaFin &&
      (this.tiempoCita !== 3 || hora === 8 || hora === 16) &&
      this.cumpleAnticipacionMinima(this.fecha, hora)
    );
  }

  ajustarHoraDisponible(): void {
    if (!this.horasDisponibles.includes(this.horaCita)) {
      this.horaCita = this.horasDisponibles[0] ?? 8;
    }
  }

  crearCita(): void {
    const cliente: ClienteCreate = {
      nombre: this.cliente.nombre.trim(),
      apellido: this.cliente.apellido.trim(),
      documento: this.cliente.documento.trim(),
      telefono: this.cliente.telefono.trim(),
    };

    if (
      this.enviando ||
      this.citaInvalida ||
      Object.values(cliente).some((valor) => !valor)
    ) {
      this.mensajeError = 'Completa todos los datos y selecciona una fecha y horario disponibles.';
      return;
    }

    const [anio, mes, dia] = this.fecha.split('-').map(Number);
    this.enviando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.clienteService.buscarPorDocumento(cliente.documento).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return this.clienteService.createCliente(cliente);
        }
        return throwError(() => error);
      }),
      switchMap((cliente) => this.citaService.crearCita({
        dia,
        mes,
        anio,
        horaCita: this.horaCita,
        tiempoCita: this.tiempoCita,
        idCliente: cliente.idCliente,
      })),
    ).subscribe({
      next: () => {
        this.mensajeExito = 'La cita se agendó. El pago está pendiente de confirmación por el administrador.';
        this.enviando = false;
        this.cliente = this.clienteVacio();
        this.citaCreada.emit();
      },
      error: (error: unknown) => {
        this.mensajeError = this.mensajeErrorDelServidor(error) ??
          'No se pudo agendar la cita. Verifica los datos y que el cupo siga disponible.';
        this.enviando = false;
      },
    });
  }

  private mensajeErrorDelServidor(error: unknown): string | null {
    if (!(error instanceof HttpErrorResponse)) return null;

    const body: unknown = error.error;
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const message = body.message;
      if (typeof message === 'string' && message.trim()) return message;
    }

    return null;
  }

  private clienteVacio(): ClienteCreate {
    return {
      nombre: '',
      apellido: '',
      documento: '',
      telefono: '',
    };
  }

  private fechaAgendableDesde(): string {
    const fecha = new Date();
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  }

  cumpleAnticipacionMinima(fecha: string, hora: number): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const inicio = new Date(anio, mes - 1, dia, hora);
    return inicio.getTime() >= Date.now() + 24 * 60 * 60 * 1000;
  }

  private fechaValida(fecha: string): boolean {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
      fecha < this.fechaMinima ||
      this.diasCerrados.includes(fecha)
    ) return false;
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const fechaCalendario = new Date(anio, mes - 1, dia);
    return fechaCalendario.getFullYear() === anio &&
      fechaCalendario.getMonth() === mes - 1 &&
      fechaCalendario.getDate() === dia;
  }

  private horarioValido(): boolean {
    if (
      (this.tiempoCita !== 2 && this.tiempoCita !== 3)
    ) {
      return false;
    }

    return this.horasDisponibles.includes(this.horaCita);
  }
}
