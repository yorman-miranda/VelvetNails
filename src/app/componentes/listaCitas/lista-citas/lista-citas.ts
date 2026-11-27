// import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { Cita, CitaService } from '../../../service/cita/cita.service';

// interface CupoDisponible {
//   hora: number;
//   duracion: 2 | 3;
// }

// interface CitasDelDia {
//   key: string;
//   etiqueta: string;
//   citas: Cita[];
// }

// @Component({
//   imports: [FormsModule],
//   selector: 'app-lista-citas',
//   styleUrl: './lista-citas.css',
//   templateUrl: './lista-citas.html',
// })
// export class ListaCitas implements OnInit {
//   private citaService = inject(CitaService);

//   @Input() vista: 'cliente' | 'admin' = 'cliente';
//   @Input() permiteAgendar = false;
//   @Input() diasCerrados: string[] = [];
//   @Output() diasCerradosChange = new EventEmitter<string[]>();
//   @Output() solicitarAgendar = new EventEmitter<{ fecha: string; hora: number; duracion: 2 | 3 }>();

//   readonly citas = signal<Cita[]>([]);
//   readonly cargando = signal(true);
//   readonly errorCarga = signal('');
//   readonly errorAsistencia = signal('');
//   readonly actualizandoId = signal<number | null>(null);

//   readonly fechaMinima = this.hoyIso();
//   fechaSeleccionada = this.fechaMinima;
//   fechaCierre = '';
//   duracionSeleccionada: 2 | 3 = 2;

//   get esDiaCerrado(): boolean {
//     return this.diasCerrados.includes(this.fechaSeleccionada);
//   }

//   get citasSeleccionadas(): Cita[] {
//     return this.citas()
//       .filter((cita) => this.fechaDeCita(cita) === this.fechaSeleccionada)
//       .sort((a, b) => a.horaCita - b.horaCita);
//   }

//   get cuposDisponibles(): CupoDisponible[] {
//     if (!this.fechaSeleccionada || this.fechaSeleccionada < this.fechaMinima || this.esDiaCerrado) {
//       return [];
//     }

//     const citas = this.citasSeleccionadas;
//     const cupos: CupoDisponible[] = [];
//     const duracion = this.duracionSeleccionada;
//     const ultimaHoraInicio = 17 - duracion;
//     const yaHayCitaLarga = citas.some((cita) => cita.tiempoCita === 3);

//     for (let hora = 8; hora <= ultimaHoraInicio; hora += 1) {
//       if (this.fechaSeleccionada === this.fechaMinima && hora <= new Date().getHours()) {
//         continue;
//       }

//       if (duracion === 3 && (yaHayCitaLarga || (hora !== 8 && hora + 3 !== 17))) {
//         continue;
//       }

//       const seCruzaConOtraCita = citas.some((cita) =>
//         hora < cita.horaCita + cita.tiempoCita &&
//         cita.horaCita < hora + duracion
//       );

//       if (!seCruzaConOtraCita) {
//         cupos.push({ hora, duracion });
//       }
//     }

//     return cupos;
//   }

//   readonly agenda = () => {
//     const ordenadas = [...this.citas()].sort((a, b) =>
//       a.anio - b.anio ||
//       a.mes - b.mes ||
//       a.dia - b.dia ||
//       a.horaCita - b.horaCita
//     );
//     const grupos = new Map<string, CitasDelDia>();

//     for (const cita of ordenadas) {
//       const key = this.fechaDeCita(cita);
//       let grupo = grupos.get(key);
//       if (!grupo) {
//         grupo = {
//           key,
//           etiqueta: this.etiquetaFecha(key),
//           citas: [],
//         };
//         grupos.set(key, grupo);
//       }
//       grupo.citas.push(cita);
//     }

//     return [...grupos.values()];
//   };

//   ngOnInit(): void {
//     this.cargarCitas();
//   }

//   cargarCitas(): void {
//     this.cargando.set(true);
//     this.errorCarga.set('');
//     this.citaService.obtenerTodos().subscribe({
//       next: (citas) => {
//         this.citas.set(citas);
//         this.cargando.set(false);
//       },
//       error: () => {
//         this.errorCarga.set('No se pudieron cargar las citas. Inténtalo nuevamente.');
//         this.cargando.set(false);
//       },
//     });
//   }

//   cambiarDuracion(duracion: string): void {
//     this.duracionSeleccionada = duracion === '3' ? 3 : 2;
//   }

//   agendarCupo(cupo: CupoDisponible): void {
//     this.solicitarAgendar.emit({
//       fecha: this.fechaSeleccionada,
//       hora: cupo.hora,
//       duracion: cupo.duracion,
//     });
//   }

//   cerrarDia(): void {
//     if (!this.fechaCierre || this.diasCerrados.includes(this.fechaCierre)) {
//       return;
//     }

//     this.emitirDiasCerrados([...this.diasCerrados, this.fechaCierre].sort());
//     this.fechaCierre = '';
//   }

//   abrirDia(fecha: string): void {
//     this.emitirDiasCerrados(this.diasCerrados.filter((dia) => dia !== fecha));
//   }

//   marcarAsistencia(cita: Cita): void {
//     if (this.actualizandoId() !== null) {
//       return;
//     }

//     this.actualizandoId.set(cita.idCita);
//     this.errorAsistencia.set('');
//     this.citaService.actualizarAsistencia(cita.idCita, !cita.asistio).subscribe({
//       next: (citaActualizada) => {
//         this.citas.update((citas) =>
//           citas.map((actual) => actual.idCita === citaActualizada.idCita ? citaActualizada : actual)
//         );
//         this.actualizandoId.set(null);
//       },
//       error: () => {
//         this.errorAsistencia.set('No se pudo actualizar la asistencia. Inténtalo nuevamente.');
//         this.actualizandoId.set(null);
//       },
//     });
//   }

//   formatearFecha(fecha: string): string {
//     return this.etiquetaFecha(fecha);
//   }

//   private emitirDiasCerrados(dias: string[]): void {
//     this.diasCerradosChange.emit(dias);
//   }

//   private fechaDeCita(cita: Cita): string {
//     return `${cita.anio}-${String(cita.mes).padStart(2, '0')}-${String(cita.dia).padStart(2, '0')}`;
//   }

//   private etiquetaFecha(fecha: string): string {
//     const [anio, mes, dia] = fecha.split('-').map(Number);
//     return new Intl.DateTimeFormat('es', {
//       weekday: 'long',
//       day: 'numeric',
//       month: 'long',
//       year: 'numeric',
//     }).format(new Date(anio, mes - 1, dia));
//   }

//   private hoyIso(): string {
//     const hoy = new Date();
//     return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
//   }
// }

import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  NgZone,
  OnInit,
  Output,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Cita, CitaService, EstadoCita, HorarioAtencion } from '../../../service/cita/cita.service';
import { formatearHora as formatearHora12 } from '../../../utilidades/formato-hora';

interface CupoDisponible {
  fecha: string;
  hora: number;
  duracion: 2 | 3;
}

interface DiaSemana {
  fecha: string;      // YYYY-MM-DD
  etiqueta: string;   // "lun 12"
  esHoy: boolean;
  esCerrado: boolean;
}

interface CitaCalendario extends Cita {
  fila: number;       // índice de hora (0 = 8:00)
  span: number;       // cuántas horas ocupa
  columna: number;    // 0 = lunes ... 6 = domingo
}

interface DiaCalendarioMovil extends DiaSemana {
  citas: CitaCalendario[];
}

@Component({
  imports: [FormsModule],
  selector: 'app-lista-citas',
  styleUrl: './lista-citas.css',
  templateUrl: './lista-citas.html',
})
export class ListaCitas implements OnInit {
  private citaService = inject(CitaService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  readonly formatearHora = formatearHora12;

  @Input() vista: 'cliente' | 'admin' = 'cliente';
  @Input() modoAdmin: 'citas' | 'calendario' = 'citas';
  @Input() permiteAgendar = false;
  @Input() diasCerrados: string[] = [];
  @Input() horariosPorDia: Record<string, HorarioAtencion> = {};
  @Output() solicitarAgendar = new EventEmitter<{ fecha: string; hora: number; duracion: 2 | 3 }>();

  readonly citas = signal<Cita[]>([]);
  readonly cargando = signal(true);
  readonly errorCarga = signal('');
  readonly errorAsistencia = signal('');
  readonly errorPago = signal('');
  readonly actualizandoId = signal<number | null>(null);
  readonly filtroEstado = signal<'PENDIENTE_PAGO' | 'CONFIRMADA'>('PENDIENTE_PAGO');
  readonly citaCalendarioSeleccionada = signal<Cita | null>(null);
  private readonly relojActualizado = signal(Date.now());

  get fechaMinima(): string {
    this.relojActualizado();
    return this.hoyIso();
  }

  get fechaMinimaCupos(): string {
    return this.sumarDias(this.fechaMinima, 1);
  }

  fechaSeleccionada = this.fechaMinima;
  duracionSeleccionada: 2 | 3 = 2;
  citaEnEdicion: Cita | null = null;
  fechaEdicion = '';
  horaEdicion = 8;
  duracionEdicion: 2 | 3 = 2;
  readonly horasEdicion = Array.from({ length: 12 }, (_, i) => 8 + i);

  /** Lunes de la semana mostrada (YYYY-MM-DD) */
  readonly semanaInicio = signal<string>(this.lunesDeLaSemana(this.hoyIso()));

  readonly horas: number[] = Array.from({ length: 12 }, (_, i) => 8 + i); // 8..19

  // ---------- Navegación de semanas ----------
  semanaAnterior(): void {
    this.semanaInicio.set(this.sumarDias(this.semanaInicio(), -7));
    this.citaCalendarioSeleccionada.set(null);
  }

  semanaSiguiente(): void {
    this.semanaInicio.set(this.sumarDias(this.semanaInicio(), 7));
    this.citaCalendarioSeleccionada.set(null);
  }

  irASemanaActual(): void {
    this.semanaInicio.set(this.lunesDeLaSemana(this.hoyIso()));
    this.citaCalendarioSeleccionada.set(null);
  }

  seleccionarFecha(fecha: string): void {
    this.fechaSeleccionada = fecha;
  }

  get diasSemana(): DiaSemana[] {
    const inicio = this.semanaInicio();
    return Array.from({ length: 7 }, (_, i) => {
      const fecha = this.sumarDias(inicio, i);
      const [anio, mes, dia] = fecha.split('-').map(Number);
      const d = new Date(anio, mes - 1, dia);
      const etiqueta = new Intl.DateTimeFormat('es', {
        weekday: 'short',
        day: 'numeric',
      }).format(d);
      return {
        fecha,
        etiqueta,
        esHoy: fecha === this.hoyIso(),
        esCerrado: this.diasCerrados.includes(fecha),
      };
    });
  }

  get rangoSemana(): string {
    const dias = this.diasSemana;
    if (dias.length === 0) return '';
    return `${this.etiquetaFechaCorta(dias[0].fecha)} – ${this.etiquetaFechaCorta(dias[6].fecha)}`;
  }

  // ---------- Citas en formato calendario ----------
  get citasCalendario(): CitaCalendario[] {
    const dias = this.diasSemana;
    const mapa = new Map(dias.map((d, i) => [d.fecha, i]));
    return this.citas()
      .filter((cita) => cita.estadoCita !== 'RECHAZADA')
      .map((cita) => {
        const fecha = this.fechaDeCita(cita);
        const columna = mapa.get(fecha);
        if (columna === undefined) return null;
        return {
          ...cita,
          columna,
          fila: cita.horaCita - 8,
          span: cita.tiempoCita,
        } as CitaCalendario;
      })
      .filter((c): c is CitaCalendario => c !== null);
  }

  get agendaMovil(): DiaCalendarioMovil[] {
    const citas = this.citasCalendario;
    return this.diasSemana
      .map((dia) => ({
        ...dia,
        citas: citas.filter((cita) => this.fechaDeCita(cita) === dia.fecha),
      }))
      .filter((dia) => dia.citas.length > 0);
  }

  seleccionarCitaCalendario(cita: Cita): void {
    this.citaCalendarioSeleccionada.set(cita);
  }

  // ---------- Resto de la lógica existente ----------
  get esDiaCerrado(): boolean {
    return this.diasCerrados.includes(this.fechaSeleccionada);
  }

  get citasSeleccionadas(): Cita[] {
    return this.citas()
      .filter((cita) =>
        this.fechaDeCita(cita) === this.fechaSeleccionada &&
        cita.estadoCita !== 'RECHAZADA'
      )
      .sort((a, b) => a.horaCita - b.horaCita);
  }

  get citasAdminFiltradas(): Cita[] {
    return this.citas()
      .filter((cita) => this.estadoCitaDe(cita) === this.filtroEstado())
      .sort((a, b) =>
        this.fechaDeCita(a).localeCompare(this.fechaDeCita(b)) ||
        a.horaCita - b.horaCita
      );
  }

  cantidadCitas(estado: 'PENDIENTE_PAGO' | 'CONFIRMADA'): number {
    return this.citas().filter((cita) => this.estadoCitaDe(cita) === estado).length;
  }

  get cuposDisponibles(): CupoDisponible[] {
    return this.cuposDisponiblesPara(this.fechaSeleccionada);
  }

  cuposDisponiblesPara(fecha: string): CupoDisponible[] {
    const fechaMinimaCupos = this.vista === 'cliente'
      ? this.fechaMinimaCupos
      : this.fechaMinima;
    if (!fecha || fecha < fechaMinimaCupos || this.diasCerrados.includes(fecha)) {
      return [];
    }
    const citas = this.citas().filter((cita) =>
      this.fechaDeCita(cita) === fecha &&
      cita.estadoCita !== 'RECHAZADA'
    );
    const cupos: CupoDisponible[] = [];
    const duracion = this.duracionSeleccionada;
    const horario = this.horariosPorDia[fecha] ?? { horaInicio: 8, horaFin: 19 };
    const ultimaHoraInicio = horario.horaFin - duracion;
    if (citas.length >= 5) return [];
    const yaHayCitaLarga = citas.some((cita) => cita.tiempoCita === 3);

    for (let hora = horario.horaInicio; hora <= ultimaHoraInicio; hora += 1) {
      if (duracion === 3 && (yaHayCitaLarga || (hora !== 8 && hora !== 16))) continue;
      const seCruza = citas.some(
        (cita) => hora < cita.horaCita + cita.tiempoCita && cita.horaCita < hora + duracion
      );
      const cupo = { fecha, hora, duracion };
      if (!seCruza && (this.vista !== 'cliente' || this.esCupoAgendable(cupo))) {
        cupos.push(cupo);
      }
    }
    return cupos;
  }

  esCupoAgendable(cupo: CupoDisponible): boolean {
    this.relojActualizado();
    const [anio, mes, dia] = cupo.fecha.split('-').map(Number);
    const inicio = new Date(anio, mes - 1, dia, cupo.hora);
    return inicio.getTime() >= Date.now() + 24 * 60 * 60 * 1000;
  }

  ngOnInit(): void {
    if (this.vista === 'cliente' && isPlatformBrowser(this.platformId)) {
      this.iniciarActualizacionReloj();
    }
    if (this.vista === 'cliente' && this.permiteAgendar) {
      this.fechaSeleccionada = this.fechaMinima;
    }
    this.cargarCitas();
  }

  cargarCitas(): void {
    this.cargando.set(true);
    this.errorCarga.set('');
    this.citaService.obtenerTodos().subscribe({
      next: (citas) => {
        this.citas.set(citas);
        this.cargando.set(false);
      },
      error: () => {
        this.errorCarga.set('No se pudieron cargar las citas. Inténtalo nuevamente.');
        this.cargando.set(false);
      },
    });
  }

  cambiarDuracion(duracion: string): void {
    this.duracionSeleccionada = duracion === '3' ? 3 : 2;
  }

  get horasEdicionDisponibles(): number[] {
    if (!this.citaEnEdicion || !this.fechaEdicionValida) return [];

    const horario = this.horariosPorDia[this.fechaEdicion] ?? { horaInicio: 8, horaFin: 19 };
    const citasDelDia = this.citas().filter((cita) =>
      cita.idCita !== this.citaEnEdicion?.idCita &&
      cita.estadoCita !== 'RECHAZADA' &&
      this.fechaDeCita(cita) === this.fechaEdicion
    );
    if (citasDelDia.length >= 5) return [];
    const yaHayCitaLarga = citasDelDia.some((cita) => cita.tiempoCita === 3);
    const disponibles: number[] = [];

    for (let hora = horario.horaInicio; hora + this.duracionEdicion <= horario.horaFin; hora++) {
      if (this.duracionEdicion === 3 &&
          (yaHayCitaLarga ||
           (hora !== 8 && hora !== 16))) {
        continue;
      }
      if (!this.tieneAnticipacionSuficiente(this.fechaEdicion, hora)) continue;

      const seCruza = citasDelDia.some((cita) =>
        hora < cita.horaCita + cita.tiempoCita &&
        cita.horaCita < hora + this.duracionEdicion
      );
      if (!seCruza) disponibles.push(hora);
    }
    return disponibles;
  }

  get fechaEdicionValida(): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.fechaEdicion) ||
        this.fechaEdicion < this.fechaMinima ||
        this.diasCerrados.includes(this.fechaEdicion)) {
      return false;
    }
    const [anio, mes, dia] = this.fechaEdicion.split('-').map(Number);
    const calendario = new Date(anio, mes - 1, dia);
    return calendario.getFullYear() === anio &&
      calendario.getMonth() === mes - 1 &&
      calendario.getDate() === dia;
  }

  get modificacionInvalida(): boolean {
    return !this.citaEnEdicion ||
      !this.fechaEdicionValida ||
      !this.horasEdicionDisponibles.includes(this.horaEdicion);
  }

  iniciarEdicion(cita: Cita): void {
    this.citaEnEdicion = cita;
    this.fechaEdicion = this.fechaDeCita(cita);
    this.horaEdicion = cita.horaCita;
    this.duracionEdicion = cita.tiempoCita === 3 ? 3 : 2;
  }

  cancelarEdicion(): void {
    this.citaEnEdicion = null;
    this.fechaEdicion = '';
    this.horaEdicion = 8;
    this.duracionEdicion = 2;
  }

  ajustarHoraEdicion(): void {
    if (!this.horasEdicionDisponibles.includes(this.horaEdicion)) {
      this.horaEdicion = this.horasEdicionDisponibles[0] ?? 8;
    }
  }

  cambiarDuracionEdicion(duracion: 2 | 3): void {
    this.duracionEdicion = duracion;
    this.ajustarHoraEdicion();
  }

  guardarEdicion(): void {
    if (this.modificacionInvalida || this.actualizandoId() !== null) return;
    const cita = this.citaEnEdicion;
    if (!cita) return;

    const [anio, mes, dia] = this.fechaEdicion.split('-').map(Number);
    this.actualizandoId.set(cita.idCita);
    this.errorPago.set('');
    this.citaService.updateCita(cita.idCita, {
      dia,
      mes,
      anio,
      horaCita: this.horaEdicion,
      tiempoCita: this.duracionEdicion,
      idCliente: cita.cliente.idCliente,
    }).subscribe({
      next: (actualizada) => {
        this.citas.update((citas) =>
          citas.map((actual) => actual.idCita === actualizada.idCita ? actualizada : actual)
        );
        this.actualizandoId.set(null);
        this.cancelarEdicion();
      },
      error: () => {
        this.errorPago.set('No se pudo modificar la cita. Verifica el horario e intenta nuevamente.');
        this.actualizandoId.set(null);
      },
    });
  }

  agendarCupo(cupo: CupoDisponible): void {
    if (this.vista === 'cliente' && !this.esCupoAgendable(cupo)) return;
    this.solicitarAgendar.emit({
      fecha: cupo.fecha,
      hora: cupo.hora,
      duracion: cupo.duracion,
    });
  }

  marcarAsistencia(cita: Cita): void {
    if (this.actualizandoId() !== null) return;
    this.actualizandoId.set(cita.idCita);
    this.errorAsistencia.set('');
    this.citaService.actualizarAsistencia(cita.idCita, !cita.asistio).subscribe({
      next: (citaActualizada) => {
        this.citas.update((citas) =>
          citas.map((actual) =>
            actual.idCita === citaActualizada.idCita ? citaActualizada : actual
          )
        );
        if (this.citaCalendarioSeleccionada()?.idCita === citaActualizada.idCita) {
          this.citaCalendarioSeleccionada.set(citaActualizada);
        }
        this.actualizandoId.set(null);
      },
      error: () => {
        this.errorAsistencia.set('No se pudo actualizar la asistencia. Inténtalo nuevamente.');
        this.actualizandoId.set(null);
      },
    });
  }

  estadoCitaDe(cita: Cita): EstadoCita {
    return cita.estadoCita ?? 'PENDIENTE_PAGO';
  }

  actualizarEstadoCita(cita: Cita, estadoCita: EstadoCita): void {
    if (this.actualizandoId() !== null) return;

    this.actualizandoId.set(cita.idCita);
    this.errorPago.set('');
    if (estadoCita === 'RECHAZADA') {
      this.citaService.deleteCita(cita.idCita).subscribe({
        next: () => {
          this.citas.update((citas) => citas.filter((actual) => actual.idCita !== cita.idCita));
          if (this.citaCalendarioSeleccionada()?.idCita === cita.idCita) {
            this.citaCalendarioSeleccionada.set(null);
          }
          this.actualizandoId.set(null);
        },
        error: () => {
          this.errorPago.set('No se pudo eliminar la cita. Inténtalo nuevamente.');
          this.actualizandoId.set(null);
        },
      });
      return;
    }

    this.citaService.actualizarEstado(cita.idCita, estadoCita).subscribe({
      next: (citaActualizada) => {
        if (citaActualizada.estadoCita !== estadoCita) {
          this.errorPago.set('El servidor no confirmó el nuevo estado de la cita.');
          this.actualizandoId.set(null);
          return;
        }

        this.citas.update((citas) =>
          citas.map((actual) =>
            actual.idCita === citaActualizada.idCita ? citaActualizada : actual
          )
        );
        this.actualizandoId.set(null);
      },
      error: () => {
        this.errorPago.set('No se pudo actualizar el estado de la cita. Inténtalo nuevamente.');
        this.actualizandoId.set(null);
      },
    });
  }

  // ---------- Utilidades de fecha ----------
  formatearFecha(fecha: string): string {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    return new Intl.DateTimeFormat('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(anio, mes - 1, dia));
  }

  formatearHoraCompacta(hora: number): string {
    return `${hora % 12 || 12}${hora < 12 ? 'a' : 'p'}`;
  }

  private tieneAnticipacionSuficiente(fecha: string, hora: number): boolean {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    return new Date(anio, mes - 1, dia, hora).getTime() - Date.now() >= 24 * 60 * 60 * 1000;
  }

  private etiquetaFechaCorta(fecha: string): string {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    return new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'short',
    }).format(new Date(anio, mes - 1, dia));
  }

  private fechaDeCita(cita: Cita): string {
    return `${cita.anio}-${String(cita.mes).padStart(2, '0')}-${String(cita.dia).padStart(2, '0')}`;
  }

  private hoyIso(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  }

  private iniciarActualizacionReloj(): void {
    this.zone.runOutsideAngular(() => {
      const timer = setInterval(() => {
        this.zone.run(() => this.relojActualizado.set(Date.now()));
      }, 1000);
      this.destroyRef.onDestroy(() => clearInterval(timer));
    });
  }

  private lunesDeLaSemana(fecha: string): string {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const d = new Date(anio, mes - 1, dia);
    const diaSemana = (d.getDay() + 6) % 7; // 0 = lunes
    d.setDate(d.getDate() - diaSemana);
    return this.isoDeFecha(d);
  }

  private sumarDias(fecha: string, dias: number): string {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const d = new Date(anio, mes - 1, dia);
    d.setDate(d.getDate() + dias);
    return this.isoDeFecha(d);
  }

  private isoDeFecha(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

}

