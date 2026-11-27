import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CitaService } from '../../service/cita/cita.service';
import { ClienteService } from '../../service/cliente/cliente.service';
import { RealizarCita } from './realizar-cita';

describe('RealizarCita', () => {
  let component: RealizarCita;
  let fixture: ComponentFixture<RealizarCita>;
  const citaService = {
    crearCita: vi.fn().mockReturnValue(of({ idCita: 1 })),
  };
  const clienteService = {
    buscarPorDocumento: vi.fn().mockReturnValue(of({
      idCliente: 12,
      nombre: 'Ana',
      apellido: 'Lopez',
      documento: '123',
      telefono: '555123',
    })),
    createCliente: vi.fn(),
  };

  beforeEach(async () => {
    citaService.crearCita.mockReset();
    citaService.crearCita.mockReturnValue(of({ idCita: 1 }));
    clienteService.buscarPorDocumento.mockClear();
    await TestBed.configureTestingModule({
      imports: [RealizarCita],
      providers: [
        { provide: CitaService, useValue: citaService },
        { provide: ClienteService, useValue: clienteService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RealizarCita);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the required payment and WhatsApp contact details', () => {
    fixture.detectChanges();

    const aviso = fixture.nativeElement.querySelector('.aviso-pago') as HTMLElement;
    const contacto = aviso.querySelector('a') as HTMLAnchorElement;
    expect(aviso.textContent).toContain('$20.000 COP');
    expect(aviso.textContent).toContain('3113606853');
    expect(contacto.href).toBe('https://wa.me/573188873072');
  });

  it('emits the home navigation action from its return button', () => {
    const volverInicio = vi.fn();
    component.volverInicio.subscribe(volverInicio);
    fixture.detectChanges();

    const botones = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const boton = botones.find((element) => element.textContent?.includes('Volver al inicio'));
    expect(boton).toBeDefined();
    boton?.click();

    expect(volverInicio).toHaveBeenCalledOnce();
  });

  it('offers start hours from 08:00 through 19:00', () => {
    expect(component.horas).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  });

  it('only offers three-hour slots at 08:00 or 16:00', () => {
    component.tiempoCita = 3;
    component.fecha = fechaFutura();

    expect(component.horasDisponibles).toEqual([8, 16]);
  });

  it('requires at least 24 hours between now and the appointment start', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2030, 4, 19, 10, 0));
    try {
      component.fecha = '2030-05-19';
      component.horaCita = 8;
      expect(component.citaInvalida).toBe(true);

      component.fecha = '2030-05-20';
      component.horaCita = 9;
      expect(component.citaInvalida).toBe(true);
      expect(component.horasDisponibles).not.toContain(9);

      component.horaCita = 10;
      expect(component.citaInvalida).toBe(false);
      expect(component.horasDisponibles).toContain(10);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not submit blank or whitespace-only client data', () => {
    component.fecha = fechaFutura();
    component.cliente = {
      nombre: ' Ana ',
      apellido: ' López ',
      documento: '   ',
      telefono: '555123',
    };

    component.crearCita();

    expect(component.mensajeError).toContain('Completa todos los datos');
    expect(clienteService.buscarPorDocumento).not.toHaveBeenCalled();
    expect(citaService.crearCita).not.toHaveBeenCalled();
  });

  it('sends a trimmed booking with pending-payment status', () => {
    component.fecha = fechaFutura();
    component.cliente = {
      nombre: ' Ana ',
      apellido: ' López ',
      documento: ' 123 ',
      telefono: ' 555123 ',
    };

    component.crearCita();

    expect(clienteService.buscarPorDocumento).toHaveBeenCalledWith('123');
    expect(citaService.crearCita).toHaveBeenCalledWith({
      dia: Number(component.fecha.slice(8, 10)),
      mes: Number(component.fecha.slice(5, 7)),
      anio: Number(component.fecha.slice(0, 4)),
      horaCita: component.horaCita,
      tiempoCita: component.tiempoCita,
      idCliente: 12,
    });
  });

  it('shows the backend message when a booking fails', () => {
    citaService.crearCita.mockReturnValueOnce(throwError(() => new HttpErrorResponse({
      status: 400,
      error: {
        status: 400,
        error: 'Bad Request',
        message: 'Ese horario se cruza con otra cita',
      },
    })));
    component.fecha = fechaFutura();
    component.cliente = {
      nombre: 'Ana',
      apellido: 'Lopez',
      documento: '123',
      telefono: '555123',
    };

    component.crearCita();

    expect(component.mensajeError).toBe('Ese horario se cruza con otra cita');
    expect(component.enviando).toBe(false);
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
