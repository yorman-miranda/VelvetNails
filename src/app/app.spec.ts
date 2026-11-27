import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient()],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, frontend');
  });

  it('shows payment and WhatsApp contact details on the home screen', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const aviso = fixture.nativeElement.querySelector('.info-pago-inicio') as HTMLElement;
    expect(aviso.textContent).toContain('$20.000 COP');
    expect(aviso.textContent).toContain('3113606853');
    expect((aviso.querySelector('a') as HTMLAnchorElement).href)
      .toBe('https://wa.me/573188873072');
  });

  it('opens the client appointment form from the booking action', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.opcion.principal').click();
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-realizar-cita')).not.toBeNull();
    expect(compiled.querySelector('#titulo-cita')?.textContent).toContain('Solicita tu cita');
    expect(compiled.querySelector('#fecha')).not.toBeNull();
    expect(compiled.querySelector('#horaCita')).not.toBeNull();
    expect(compiled.querySelector('#tiempoCita')).not.toBeNull();
  });

  it('opens the booking form with the selected free slot from availability', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.abrirDisponibilidad();
    app.seleccionarCupo({ fecha: '2030-05-20', hora: 8, duracion: 2 });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(app.vista()).toBe('formulario');
    expect((fixture.nativeElement.querySelector('#fecha') as HTMLInputElement).value)
      .toBe('2030-05-20');
    expect((fixture.nativeElement.querySelector('#horaCita') as HTMLSelectElement)
      .selectedOptions[0].textContent).toContain('8:00');
  });

  it('opens appointment lookup from the modify action', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('Modificar cita'))?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-modificar-cita')).not.toBeNull();
  });
});
