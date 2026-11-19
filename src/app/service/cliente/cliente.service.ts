import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../enviroment/enviroments.prod';
import { Observable } from 'rxjs';
import type { Cita } from '../cita/cita.service';

export interface Cliente{
  idCliente: number
  nombre: string
  apellido: string
  documento:string
  telefono: string
}

export interface ClienteCreate{
  nombre: string
  apellido: string
  documento:string
  telefono: string
}

export interface ClienteCitas {
  cliente: Cliente;
  citas: Cita[];
}



@Service()
export class ClienteService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/cliente`


  getCliente(id:number): Observable<Cliente>{
    return this.http.get<Cliente>(`${this.baseUrl}`)
  }

  updateCliente(id: number, cliente:Cliente): Observable<Cliente>{
    return this.http.put<Cliente>(`${this.baseUrl}/${id}`,cliente)
  }

  delete(id:number){
    return this.http.delete(`${this.baseUrl}/${id}`)
  }

  getClientes(): Observable<Cliente[]>{
    return this.http.get<Cliente[]>(`${this.baseUrl}`);
  }

  createCliente(cliente: ClienteCreate){
    return this.http.post<Cliente>(`${this.baseUrl}`, cliente);
  }

  buscarPorDocumento(documento: string): Observable<Cliente>{
    const params = new HttpParams().set('documento', documento)
    return this.http.get<Cliente>(`${this.baseUrl}/buscar`,{params});
  }

  buscarPorTelefono(telefono:string){
    const params = new HttpParams().set('telefono', telefono)
    return this.http.get<Cliente[]>(`${this.baseUrl}/buscar/telefono`, {params})
  }

  buscarCitasPorDocumento(documento: string): Observable<ClienteCitas[]> {
    const params = new HttpParams().set('documento', documento);
    return this.http.get<ClienteCitas[]>(`${this.baseUrl}/buscar/citas`, {params});
  }

  buscarCitasPorTelefono(telefono: string): Observable<ClienteCitas[]> {
    const params = new HttpParams().set('telefono', telefono);
    return this.http.get<ClienteCitas[]>(`${this.baseUrl}/buscar/citas`, {params});
  }

  buscarPorNombre(nombre: string){
    const params = new HttpParams().set("nombre", nombre)
    return this.http.get<Cliente[]>(`${this.baseUrl}/buscar/nombre`,{params})
  }
}
