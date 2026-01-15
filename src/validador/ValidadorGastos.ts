import { IRegla, IContextoRegla } from "../interfaces/IRegla";
import { IGasto } from "../interfaces/IGasto";
import { IEmpleado } from "../interfaces/IEmpleado";
import { IResultadoValidacion } from "../interfaces/IResultadoValidacion";
import { EstadoValidacion } from "../modelos/EstadoValidacion";

export class ValidadorGastos {
  constructor(
    private reglas: IRegla[],
    private contexto?: IContextoRegla
  ) {}

  async validar(gasto: IGasto, empleado: IEmpleado): Promise<IResultadoValidacion> {
    // Evaluar todas las reglas (pueden ser síncronas o asíncronas)
    const resultadosReglas = await Promise.all(
      this.reglas.map(regla => {
        const resultado = regla.evaluar(gasto, empleado, this.contexto);
        // Si es una promesa, esperarla; si no, convertir a promesa resuelta
        return Promise.resolve(resultado);
      })
    );

    const resultados = resultadosReglas.filter(Boolean) as IResultadoValidacion[];

    if (resultados.some(r => r.estado === EstadoValidacion.RECHAZADO)) {
      return this.combinar(gasto.id, EstadoValidacion.RECHAZADO, resultados);
    }

    if (resultados.some(r => r.estado === EstadoValidacion.PENDIENTE)) {
      return this.combinar(gasto.id, EstadoValidacion.PENDIENTE, resultados);
    }

    if (resultados.length > 0) {
      return this.combinar(gasto.id, EstadoValidacion.APROBADO, resultados);
    }

    return {
      gastoId: gasto.id,
      estado: EstadoValidacion.PENDIENTE,
      alertas: []
    };
  }

  private combinar(
    gastoId: string,
    estado: EstadoValidacion,
    resultados: IResultadoValidacion[]
  ): IResultadoValidacion {
    return {
      gastoId,
      estado,
      alertas: resultados.flatMap(r => r.alertas)
    };
  }
}
