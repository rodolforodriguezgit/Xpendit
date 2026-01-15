import { EstadoValidacion } from "../modelos/EstadoValidacion";

export interface IAlerta {
  codigo: string;
  mensaje: string;
}

export interface IResultadoValidacion {
  gastoId: string;
  estado: EstadoValidacion;
  alertas: IAlerta[];
}
