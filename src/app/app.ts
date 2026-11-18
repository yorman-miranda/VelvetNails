import { isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { HorarioAtencion } from './service/cita/cita.service';
import { PanelAdministrador } from './componentes/panel-administrador/panel-administrador';
import { PanelCliente } from './componentes/panel-cliente/panel-cliente';
import { RealizarCita } from './componentes/realizar-cita/realizar-cita';
import { ModificarCita } from './componentes/modificar-cita/modificar-cita';
import { Inicio } from './componentes/inicio/inicio';

@Component({
  imports: [Inicio, PanelCliente, PanelAdministrador, RealizarCita, ModificarCita],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly claveAdmin = 'admin123';
  private readonly almacenamientoDiasCerrados = 'velvet-nails-dias-cerrados';
  private readonly almacenamientoHorarios = 'velvet-nails-horarios-por-dia';

  readonly vista = signal<'inicio' | 'disponibilidad' | 'administracion' | 'formulario' | 'modificar'>('inicio');
  readonly permiteAgendar = signal(false);
  readonly sesionAdmin = signal(false);
  readonly errorLogin = signal('');
  readonly errorAlmacenamiento = signal('');
  readonly mensajeReserva = signal('');
  readonly diasCerrados = signal<string[]>([]);
  readonly horariosPorDia = signal<Record<string, HorarioAtencion>>({});
  readonly fechaSeleccionada = signal('');
  readonly horaSeleccionada = signal(8);
  readonly duracionSeleccionada = signal<2 | 3>(2);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const guardados = localStorage.getItem(this.almacenamientoDiasCerrados);
      if (guardados) {
        const fechas: unknown = JSON.parse(guardados);
        if (Array.isArray(fechas) && fechas.every((fecha) => typeof fecha === 'string')) {
          this.diasCerrados.set([...new Set(fechas)].sort());
        } else {
          this.errorAlmacenamiento.set('No se pudieron leer los días cerrados guardados en este navegador.');
        }
      }

      const horariosGuardados = localStorage.getItem(this.almacenamientoHorarios);
      if (horariosGuardados) {
        const horarios: unknown = JSON.parse(horariosGuardados);
        if (this.esConfiguracionHorarios(horarios)) {
          this.horariosPorDia.set(horarios);
        } else {
          this.errorAlmacenamiento.set('No se pudieron leer los horarios guardados en este navegador.');
        }
      }
    } catch {
      this.errorAlmacenamiento.set('No se pudieron leer las opciones de agenda guardadas en este navegador.');
    }
  }

  abrirAgendar(): void {
    this.permiteAgendar.set(true);
    this.fechaSeleccionada.set('');
    this.horaSeleccionada.set(8);
    this.duracionSeleccionada.set(2);
    this.mensajeReserva.set('');
    this.vista.set('formulario');
  }

  abrirDisponibilidad(): void {
    this.permiteAgendar.set(false);
    this.vista.set('disponibilidad');
  }

  abrirModificarCita(): void {
    this.vista.set('modificar');
  }

  intentarInicioSesion(clave: string): void {
    if (clave !== this.claveAdmin) {
      this.errorLogin.set('La clave ingresada no es correcta.');
      return;
    }

    this.errorLogin.set('');
    this.sesionAdmin.set(true);
    this.vista.set('administracion');
  }

  cerrarSesion(): void {
    this.sesionAdmin.set(false);
    this.vista.set('inicio');
  }

  volverInicio(): void {
    this.vista.set('inicio');
  }

  guardarDiasCerrados(fechas: string[]): void {
    const ordenadas = [...new Set(fechas)].sort();
    this.diasCerrados.set(ordenadas);

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.setItem(this.almacenamientoDiasCerrados, JSON.stringify(ordenadas));
      this.errorAlmacenamiento.set('');
    } catch {
      this.errorAlmacenamiento.set('No se pudieron guardar los días cerrados en este navegador.');
    }
  }

  guardarHorariosPorDia(horarios: Record<string, HorarioAtencion>): void {
    this.horariosPorDia.set(horarios);

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.setItem(this.almacenamientoHorarios, JSON.stringify(horarios));
      this.errorAlmacenamiento.set('');
    } catch {
      this.errorAlmacenamiento.set('No se pudieron guardar los horarios en este navegador.');
    }
  }

  seleccionarCupo(cupo: { fecha: string; hora: number; duracion: 2 | 3 }): void {
    if (this.diasCerrados().includes(cupo.fecha)) {
      return;
    }
    const horario = this.horariosPorDia()[cupo.fecha] ?? { horaInicio: 8, horaFin: 17 };
    if (cupo.hora < horario.horaInicio || cupo.hora + cupo.duracion > horario.horaFin) {
      return;
    }
    this.mensajeReserva.set('');
    this.fechaSeleccionada.set(cupo.fecha);
    this.horaSeleccionada.set(cupo.hora);
    this.duracionSeleccionada.set(cupo.duracion);
    this.vista.set('formulario');
  }

  citaCreada(): void {
    this.mensajeReserva.set('La solicitud quedó pendiente de pago. El cupo se mantiene reservado hasta que el administrador la apruebe o rechace.');
    this.vista.set('disponibilidad');
  }

  cancelarReserva(): void {
    this.vista.set('disponibilidad');
  }

  private esConfiguracionHorarios(valor: unknown): valor is Record<string, HorarioAtencion> {
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return false;
    return Object.entries(valor).every(([fecha, horario]) =>
      /^\d{4}-\d{2}-\d{2}$/.test(fecha) && this.esHorarioAtencion(horario)
    );
  }

  private esHorarioAtencion(valor: unknown): valor is HorarioAtencion {
    if (
      !valor ||
      typeof valor !== 'object' ||
      !('horaInicio' in valor) ||
      !('horaFin' in valor)
    ) {
      return false;
    }

    const { horaInicio, horaFin } = valor;
    return typeof horaInicio === 'number' &&
        typeof horaFin === 'number' &&
        Number.isInteger(horaInicio) &&
        Number.isInteger(horaFin) &&
        horaInicio >= 8 &&
        horaFin <= 17 &&
        horaFin - horaInicio >= 2;
  }
}
