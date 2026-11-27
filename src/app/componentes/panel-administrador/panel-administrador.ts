import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HorarioAtencion } from '../../service/cita/cita.service';
import { ListaCitas } from '../listaCitas/lista-citas/lista-citas';
import { formatearHora as formatearHora12 } from '../../utilidades/formato-hora';

@Component({
  imports: [FormsModule, ListaCitas],
  selector: 'app-panel-administrador',
  styleUrl: './panel-administrador.css',
  templateUrl: './panel-administrador.html',
})
export class PanelAdministrador implements OnInit {
  readonly formatearHora = formatearHora12;
  @Input() diasCerrados: string[] = [];
  @Input() horariosPorDia: Record<string, HorarioAtencion> = {};
  @Output() diasCerradosChange = new EventEmitter<string[]>();
  @Output() horariosPorDiaChange = new EventEmitter<Record<string, HorarioAtencion>>();

  readonly fechaMinima = this.hoyIso();
  readonly horas = Array.from({ length: 12 }, (_, indice) => indice + 8);
  fechaCierre = '';
  fechaHorario = this.fechaMinima;
  seccion: 'citas' | 'calendario' | 'horarios' | 'cierres' = 'citas';
  horaInicio = 8;
  horaFin = 19;

  ngOnInit(): void {
    this.cargarHorario(this.fechaHorario);
  }

  guardarHorario(): void {
    if (!this.fechaHorario || this.fechaHorario < this.fechaMinima || this.horaFin - this.horaInicio < 2) {
      return;
    }

    this.horariosPorDiaChange.emit({
      ...this.horariosPorDia,
      [this.fechaHorario]: { horaInicio: this.horaInicio, horaFin: this.horaFin },
    });
  }

  cargarHorario(fecha: string): void {
    const horario = this.horariosPorDia[fecha];
    this.horaInicio = horario?.horaInicio ?? 8;
    this.horaFin = horario?.horaFin ?? 19;
  }

  quitarHorario(fecha: string): void {
    const horarios = { ...this.horariosPorDia };
    delete horarios[fecha];
    this.horariosPorDiaChange.emit(horarios);
    this.cargarHorario(fecha);
  }

  cerrarDia(): void {
    if (!this.fechaCierre || this.fechaCerrado(this.fechaCierre)) return;
    this.diasCerradosChange.emit([...this.diasCerrados, this.fechaCierre].sort());
    this.fechaCierre = '';
  }

  abrirDia(fecha: string): void {
    this.diasCerradosChange.emit(this.diasCerrados.filter((dia) => dia !== fecha));
  }

  fechaCerrado(fecha: string): boolean {
    return this.diasCerrados.includes(fecha);
  }

  formatearFecha(fecha: string): string {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    return new Intl.DateTimeFormat('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(anio, mes - 1, dia));
  }

  get horarioInvalido(): boolean {
    return !this.fechaHorario ||
      this.fechaHorario < this.fechaMinima ||
      this.horaFin - this.horaInicio < 2;
  }

  private hoyIso(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  }
}
