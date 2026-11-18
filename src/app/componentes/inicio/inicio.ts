import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule],
  selector: 'app-inicio',
  styleUrl: './inicio.css',
  templateUrl: './inicio.html',
})
export class Inicio {
  @Input() errorLogin = '';
  @Output() agendar = new EventEmitter<void>();
  @Output() modificarCita = new EventEmitter<void>();
  @Output() verDisponibilidad = new EventEmitter<void>();
  @Output() iniciarSesion = new EventEmitter<string>();

  mostrarLogin = false;
  clave = '';
}
