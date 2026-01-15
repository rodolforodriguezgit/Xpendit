import { IRegla, IContextoRegla } from "../../interfaces/IRegla";
import { IGasto } from "../../interfaces/IGasto";
import { IEmpleado } from "../../interfaces/IEmpleado";
import { IResultadoValidacion } from "../../interfaces/IResultadoValidacion";
import { EstadoValidacion } from "../../modelos/EstadoValidacion";

export class ReglaAntiguedadGasto implements IRegla {
  evaluar(
    gasto: IGasto,
    empleado: IEmpleado,
    contexto?: IContextoRegla
  ): IResultadoValidacion | null {
    const dias = this.calcularDias(gasto.fecha);

    if (dias <= 30) {
      return {
        gastoId: gasto.id,
        estado: EstadoValidacion.APROBADO,
        alertas: []
      };
    }

    if (dias <= 60) {
      return {
        gastoId: gasto.id,
        estado: EstadoValidacion.PENDIENTE,
        alertas: [{
          codigo: "LIMITE_ANTIGUEDAD",
          mensaje: "Gasto excede los 30 días. Requiere revisión."
        }]
      };
    }

    return {
      gastoId: gasto.id,
      estado: EstadoValidacion.RECHAZADO,
      alertas: [{
        codigo: "LIMITE_ANTIGUEDAD",
        mensaje: "Gasto excede los 60 días."
      }]
    };
  }

  private calcularDias(fecha: string): number {
    const diff = Date.now() - new Date(fecha).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}
