import { IGasto } from "./IGasto";
import { IEmpleado } from "./IEmpleado";
import { IResultadoValidacion } from "./IResultadoValidacion";
import { IClienteTasaCambio } from "./IClienteTasaCambio";

export interface IContextoRegla {
  clienteTasaCambio?: IClienteTasaCambio;
  monedaBase?: string; // Moneda base, por defecto "USD"
}

export interface IRegla {
  evaluar(
    gasto: IGasto,
    empleado: IEmpleado,
    contexto?: IContextoRegla
  ): IResultadoValidacion | null | Promise<IResultadoValidacion | null>;
}
