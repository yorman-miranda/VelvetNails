import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { Cita, CitaService } from '../../../service/cita/cita.service';
import { ListaCitas } from './lista-citas';

describe('ListaCitas', () => {
  let component: ListaCitas;
  let fixture: ComponentFixture<ListaCitas>;
  const citaPendiente: Cita = {
    idCita: 1,
    dia: 10,
    mes: 5,
    anio: 2027,
    horaCita: 10,
    tiempoCita: 2,
    estadoCita: 'PENDIENTE_PAGO',
    cliente: {
      idCliente: 12,
      nombre: 'Ana',
      apellido: 'Lopez',
      documento: '123',
      telefono: '555123',
    },
  };
  const citaService = {
    obtenerTodos: vi.fn().mockReturnValue(of([])),
    actualizarAsistencia: vi.fn((id: number, asistio: boolean) => of({
      ...citaPendiente,
      idCita: id,
      asistio,
    })),
    actualizarEstado: vi.fn((id: number, estadoCita: Cita['estadoCita']) => of({
      ...citaPendiente,
      idCita: id,
      estadoCita,
    })),
    deleteCita: vi.fn().mockReturnValue(of(undefined)),
  };

  beforeEach(async () => {
    citaService.obtenerTodos.mockClear();
    citaService.actualizarAsistencia.mockClear();
    citaService.actualizarEstado.mockClear();
    citaService.deleteCita.mockClear();
    await TestBed.configureTestingModule({
      imports: [ListaCitas],
      providers: [{ provide: CitaService, useValue: citaService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaCitas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('offers slots within the selected date-specific hours', () => {
    const fecha = fechaFutura();
    component.fechaSeleccionada = fecha;
    component.horariosPorDia = { [fecha]: { horaInicio: 10, horaFin: 15 } };
    component.duracionSeleccionada = 2;

    expect(component.cuposDisponibles.map((cupo) => cupo.hora)).toEqual([10, 11, 12, 13]);
  });

  it('does not offer booking slots today or tomorrow', () => {
    component.permiteAgendar = true;
    component.fechaSeleccionada = fechaEnDias(0);
    expect(component.cuposDisponibles).toEqual([]);

    component.fechaSeleccionada = fechaEnDias(1);
    expect(component.cuposDisponibles).toEqual([]);

    component.fechaSeleccionada = fechaEnDias(2);
    expect(component.cuposDisponibles.length).toBeGreaterThan(0);
  });

  it('offers three-hour slots only at 08:00 or 16:00', () => {
    const fecha = fechaFutura();
    component.fechaSeleccionada = fecha;
    component.duracionSeleccionada = 3;

    expect(component.cuposDisponibles.map((cupo) => cupo.hora)).toEqual([8, 16]);
  });

  it('does not offer another three-hour slot when one is already booked', () => {
    const fecha = fechaFutura();
    component.fechaSeleccionada = fecha;
    component.duracionSeleccionada = 3;
    component.citas.set([{
      ...citaPendiente,
      dia: Number(fecha.slice(8, 10)),
      mes: Number(fecha.slice(5, 7)),
      anio: Number(fecha.slice(0, 4)),
      horaCita: 8,
      tiempoCita: 3,
    }]);

    expect(component.cuposDisponibles).toEqual([]);
  });

  it('confirms payment by persisting the appointment status', () => {
    component.citas.set([citaPendiente]);

    component.actualizarEstadoCita(citaPendiente, 'CONFIRMADA');

    expect(citaService.actualizarEstado).toHaveBeenCalledWith(1, 'CONFIRMADA');
    expect(component.citas()[0].estadoCita).toBe('CONFIRMADA');
  });

  it('deletes rejected appointments and removes them from the calendar', () => {
    component.citas.set([citaPendiente]);
    component.modoAdmin = 'calendario';
    component.citaCalendarioSeleccionada.set(citaPendiente);

    component.actualizarEstadoCita(citaPendiente, 'RECHAZADA');

    expect(citaService.deleteCita).toHaveBeenCalledWith(1);
    expect(citaService.actualizarEstado).not.toHaveBeenCalled();
    expect(component.citas()).toEqual([]);
    expect(component.citasCalendario).toEqual([]);
    expect(component.citaCalendarioSeleccionada()).toBeNull();
  });

  it('separates pending and confirmed appointments in the admin view', () => {
    const citaConfirmada: Cita = {
      ...citaPendiente,
      idCita: 2,
      estadoCita: 'CONFIRMADA',
    };
    component.vista = 'admin';
    component.citas.set([citaPendiente, citaConfirmada]);
    fixture.detectChanges();

    expect(component.citasAdminFiltradas).toEqual([citaPendiente]);
    expect(component.cantidadCitas('PENDIENTE_PAGO')).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Confirmar pago');
    expect(fixture.nativeElement.textContent).toContain('Rechazar cita');

    component.filtroEstado.set('CONFIRMADA');
    fixture.detectChanges();

    expect(component.citasAdminFiltradas).toEqual([citaConfirmada]);
    expect(fixture.nativeElement.textContent).toContain('Volver a pendiente');
  });

  it('shows appointment details and attendance controls from the admin calendar', () => {
    const [anio, mes, dia] = component.diasSemana[2].fecha.split('-').map(Number);
    const citaSemana: Cita = { ...citaPendiente, anio, mes, dia };
    component.vista = 'admin';
    component.modoAdmin = 'calendario';
    component.citas.set([citaSemana]);
    fixture.detectChanges();

    const evento = fixture.nativeElement.querySelector('.evento-cita-admin') as HTMLButtonElement;
    expect(evento).not.toBeNull();
    expect(evento.textContent).toContain('10:00');
    expect(evento.textContent).not.toContain('Ana');
    evento.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Información de la cita');
    expect(fixture.nativeElement.textContent).toContain('123');
    expect(fixture.nativeElement.textContent).toContain('Marcar como asistió');

    component.marcarAsistencia(citaSemana);

    expect(citaService.actualizarAsistencia).toHaveBeenCalledWith(citaSemana.idCita, true);
    expect(component.citaCalendarioSeleccionada()?.asistio).toBe(true);

    const cerrar = fixture.nativeElement.querySelector('.cerrar-detalle-cita') as HTMLButtonElement;
    cerrar.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders occupied appointments across their full duration', () => {
    const [anio, mes, dia] = component.diasSemana[2].fecha.split('-').map(Number);
    component.citas.set([{
      ...citaPendiente,
      dia,
      mes,
      anio,
      horaCita: 8,
      tiempoCita: 2,
    }]);
    fixture.detectChanges();

    const evento = fixture.nativeElement.querySelector('.cita-calendario.ocupada') as HTMLElement;
    expect(evento).not.toBeNull();
    expect(evento.style.gridRow).toBe('2 / span 2');
    expect(evento.textContent).toContain('Ocupado · 2 h');
  });

  it('releases rejected appointments from public availability', () => {
    const fecha = fechaFutura();
    component.fechaSeleccionada = fecha;
    component.citas.set([{
      idCita: 1,
      dia: Number(fecha.slice(8, 10)),
      mes: Number(fecha.slice(5, 7)),
      anio: Number(fecha.slice(0, 4)),
      horaCita: 10,
      tiempoCita: 2,
      estadoCita: 'RECHAZADA',
      cliente: {
        idCliente: 12,
        nombre: 'Ana',
        apellido: 'Lopez',
        documento: '123',
        telefono: '555123',
      },
    }]);

    expect(component.citasSeleccionadas).toEqual([]);
    expect(component.cuposDisponibles.map((cupo) => cupo.hora)).toContain(10);
  });

  it('keeps pending appointments blocked from public availability', () => {
    const fecha = fechaFutura();
    component.fechaSeleccionada = fecha;
    component.citas.set([{
      ...citaPendiente,
      dia: Number(fecha.slice(8, 10)),
      mes: Number(fecha.slice(5, 7)),
      anio: Number(fecha.slice(0, 4)),
    }]);

    expect(component.cuposDisponibles.map((cupo) => cupo.hora)).not.toContain(10);
  });

  function fechaFutura(): string {
    return fechaEnDias(2);
  }

  function fechaEnDias(dias: number): string {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + dias);
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  }
});
