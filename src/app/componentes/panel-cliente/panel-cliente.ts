import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ListaCitas } from '../listaCitas/lista-citas/lista-citas';
import { HorarioAtencion } from '../../service/cita/cita.service';

@Component({
  imports: [ListaCitas],
  selector: 'app-panel-cliente',
  templateUrl: './panel-cliente.html',
})
export class PanelCliente {
  @Input() permiteAgendar = false;
  @Input() diasCerrados: string[] = [];
  @Input() horariosPorDia: Record<string, HorarioAtencion> = {};
  @Output() solicitarAgendar = new EventEmitter<{ fecha: string; hora: number; duracion: 2 | 3 }>();
}
