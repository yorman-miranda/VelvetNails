import { HttpClient, HttpParams } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { environment } from '../../enviroment/enviroment';
import { Cliente } from '../cliente/cliente.service';

export interface Cita{
  idCita: number;
  dia: number;
  mes: number;
  anio: number;
  horaCita: number;
  tiempoCita: number;
  asistio?: boolean;
  estadoCita: EstadoCita;
  cliente: Cliente;
}

export type EstadoCita = 'PENDIENTE_PAGO' | 'CONFIRMADA' | 'RECHAZADA';

export interface HorarioAtencion {
  horaInicio: number;
  horaFin: number;
}

export interface CrearCitaRequest {
  dia: number;
  mes: number;
  anio: number;
  horaCita: number;
  tiempoCita: 2 | 3;
  idCliente: number;
}

export interface ActualizarCitaRequest {
  dia: number;
  mes: number;
  anio: number;
  horaCita: number;
  tiempoCita: 2 | 3;
  idCliente: number;
}

  // cliente: {
  //     idCliente:number
  //     nombre:string
  //     apellido:string
  //     documento:string
  //     telefono:string
  // }



@Service()
export class CitaService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/cita`;


  getCita(id:number){
    return this.http.get<Cita>(`${this.baseUrl}/${id}`)
  }

  updateCita(id: number, cita: ActualizarCitaRequest) {
    return this.http.put<Cita>(`${this.baseUrl}/${id}`, cita);
  }

  actualizarAsistencia(id: number, asistio: boolean) {
    const params = new HttpParams().set('asistio', asistio);
    return this.http.patch<Cita>(`${this.baseUrl}/${id}/asistencia`, null, { params });
  }

  actualizarEstado(id: number, estadoCita: EstadoCita) {
    return this.http.patch<Cita>(`${this.baseUrl}/${id}/estado`, { estadoCita });
  }

  deleteCita(id:number){
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  obtenerTodos(){
    return this.http.get<Cita[]>(`${this.baseUrl}`);
  }

  crearCita(cita: CrearCitaRequest){
    return this.http.post<Cita>(`${this.baseUrl}/CrearCita`,cita);
  }

  obtenerCitaPorCliente(id:number){
    const params = new HttpParams().set('id',id)
    return this.http.get<Cita[]>(`${this.baseUrl}/idCliente`,{params})
  }

  obtenerCitasDelDia(fecha:Date){
    const params = new HttpParams()
      .set('dia', fecha.getDate())
      .set('mes', fecha.getMonth() + 1)
      .set('anio', fecha.getFullYear());
    return this.http.get<Cita[]>(`${this.baseUrl}/fecha`, { params });
  }



}
