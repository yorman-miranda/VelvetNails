import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Cita, CitaService } from '../../service/cita/cita.service';
import { Cliente, ClienteService } from '../../service/cliente/cliente.service';
import { ModificarCita } from './modificar-cita';

describe('ModificarCita', () => {
  let component: ModificarCita;
  let fixture: ComponentFixture<ModificarCita>;
  const cliente: Cliente = {
    idCliente: 12,
    nombre: 'Ana',
    apellido: 'Lopez',
    documento: '123',
    telefono: '555123',
  };
  const cita: Cita = {
    idCita: 5,
    dia: 15,
    mes: 5,
    anio: 2030,
    horaCita: 10,
    tiempoCita: 2,
    estadoCita: 'CONFIRMADA',
    cliente,
  };
  const clienteService = {
    buscarCitasPorDocumento: vi.fn().mockReturnValue(of([{ cliente, citas: [cita] }])),
    buscarCitasPorTelefono: vi.fn().mockReturnValue(of([{ cliente, citas: [cita] }])),
  };
  const citaService = {
    obtenerCitaPorCliente: vi.fn().mockReturnValue(of([cita])),
    updateCita: vi.fn().mockReturnValue(of(cita)),
  };

  beforeEach(async () => {
    clienteService.buscarCitasPorDocumento.mockClear();
    clienteService.buscarCitasPorTelefono.mockClear();
    citaService.obtenerCitaPorCliente.mockClear();
    citaService.updateCita.mockClear();
    await TestBed.configureTestingModule({
      imports: [ModificarCita],
      providers: [
        { provide: ClienteService, useValue: clienteService },
        { provide: CitaService, useValue: citaService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ModificarCita);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('searches by document and loads the client appointments', () => {
    component.terminoBusqueda = cliente.documento;
    component.buscar();

    expect(clienteService.buscarCitasPorDocumento).toHaveBeenCalledWith('123');
    expect(citaService.obtenerCitaPorCliente).not.toHaveBeenCalled();
    expect(component.citas).toEqual([cita]);
  });

  it('clears the loading state and reports a failed search', () => {
    clienteService.buscarCitasPorDocumento.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );
    component.terminoBusqueda = 'no-encontrado';

    component.buscar();
    fixture.detectChanges();

    expect(component.buscando).toBe(false);
    expect(component.mensajeError).toContain('No encontramos un cliente');
    expect(fixture.nativeElement.textContent).not.toContain('Buscando...');
  });

  it('offers start hours from 08:00 through 19:00', () => {
    expect(component.horas).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  });

  it('supports phone searches with multiple matching clients', () => {
    const secondClient = { ...cliente, idCliente: 13, documento: '456' };
    clienteService.buscarCitasPorTelefono.mockReturnValueOnce(of([
      { cliente, citas: [cita] },
      { cliente: secondClient, citas: [] },
    ]));
    component.tipoBusqueda = 'telefono';
    component.terminoBusqueda = cliente.telefono;
    component.buscar();

    expect(clienteService.buscarCitasPorTelefono).toHaveBeenCalledWith('555123');
    expect(component.clientesEncontrados).toEqual([cliente, secondClient]);
    expect(citaService.obtenerCitaPorCliente).not.toHaveBeenCalled();

    component.seleccionarCliente(secondClient);
    expect(citaService.obtenerCitaPorCliente).not.toHaveBeenCalled();
    expect(component.citas).toEqual([]);
  });

  it('allows changes only at least 24 hours before the appointment', () => {
    const start = new Date(Date.now() + 30 * 60 * 60 * 1000);
    const modifiable = {
      ...cita,
      anio: start.getFullYear(),
      mes: start.getMonth() + 1,
      dia: start.getDate(),
      horaCita: start.getHours(),
    };
    const tooSoon = {
      ...modifiable,
      anio: new Date(Date.now() + 23 * 60 * 60 * 1000).getFullYear(),
      mes: new Date(Date.now() + 23 * 60 * 60 * 1000).getMonth() + 1,
      dia: new Date(Date.now() + 23 * 60 * 60 * 1000).getDate(),
      horaCita: new Date(Date.now() + 23 * 60 * 60 * 1000).getHours(),
    };

    expect(component.esModificable(modifiable)).toBe(true);
    expect(component.esModificable(tooSoon)).toBe(false);
    expect(component.motivoNoModificable(tooSoon)).toContain('menos de 24 horas');
  });

  it('does not allow modifying an appointment that has already passed', () => {
    const past = new Date(Date.now() - 60 * 60 * 1000);
    const citaPasada = {
      ...cita,
      anio: past.getFullYear(),
      mes: past.getMonth() + 1,
      dia: past.getDate(),
      horaCita: past.getHours(),
    };

    expect(component.esModificable(citaPasada)).toBe(false);
    expect(component.motivoNoModificable(citaPasada)).toBe('La cita ya pasó y no se puede modificar.');
  });

  it('sends the updated appointment data to the backend', () => {
    const start = new Date(Date.now() + 96 * 60 * 60 * 1000);
    const futura = {
      ...cita,
      anio: start.getFullYear(),
      mes: start.getMonth() + 1,
      dia: start.getDate(),
      horaCita: 10,
    };
    component.clienteSeleccionado = cliente;
    component.citas = [futura];
    component.editar(futura);

    component.guardarCambios();

    expect(citaService.updateCita).toHaveBeenCalledWith(futura.idCita, {
      dia: futura.dia,
      mes: futura.mes,
      anio: futura.anio,
      horaCita: futura.horaCita,
      tiempoCita: futura.tiempoCita,
      idCliente: cliente.idCliente,
    });
  });
});
