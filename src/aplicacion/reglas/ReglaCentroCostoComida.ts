import { IRegla, IContextoRegla } from "../../interfaces/IRegla";
import { IGasto } from "../../interfaces/IGasto";
import { IEmpleado } from "../../interfaces/IEmpleado";
import { IResultadoValidacion } from "../../interfaces/IResultadoValidacion";
import { EstadoValidacion } from "../../modelos/EstadoValidacion";

export class ReglaCentroCostoComida implements IRegla {
  evaluar(
    gasto: IGasto,
    empleado: IEmpleado,
    contexto?: IContextoRegla
  ): IResultadoValidacion | null {
    if (
      empleado.centroCosto === "core_engineering" &&
      gasto.categoria === "food"
    ) {
      return {
        gastoId: gasto.id,
        estado: EstadoValidacion.RECHAZADO,
        alertas: [{
          codigo: "POLITICA_CENTRO_COSTO",
          mensaje: "Core Engineering no puede reportar gastos food."
        }]
      };
    }

    return null;
  }
}
