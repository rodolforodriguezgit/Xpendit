import { IResultadoValidacion } from "./IResultadoValidacion";

export interface IResultadoLote {
  aprobados: number;
  pendientes: number;
  rechazados: number;
  anomalias: string[];
  resultados: IResultadoValidacion[]; // Resultados de validación estructurados por gasto
}
