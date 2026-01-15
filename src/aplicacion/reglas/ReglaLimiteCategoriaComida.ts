import { IRegla, IContextoRegla } from "../../interfaces/IRegla";
import { IGasto } from "../../interfaces/IGasto";
import { IEmpleado } from "../../interfaces/IEmpleado";
import { IResultadoValidacion } from "../../interfaces/IResultadoValidacion";
import { EstadoValidacion } from "../../modelos/EstadoValidacion";

export class ReglaLimiteCategoriaComida implements IRegla {
  async evaluar(
    gasto: IGasto,
    empleado: IEmpleado,
    contexto?: IContextoRegla
  ): Promise<IResultadoValidacion | null> {
    if (gasto.categoria !== "food") return null;

    // Convertir monto a USD si es necesario
    let montoEnUSD = gasto.monto;
    const monedaBase = contexto?.monedaBase || "USD";

    if (gasto.moneda !== monedaBase && contexto?.clienteTasaCambio) {
      try {
        // OpenExchangeRates devuelve tasas donde rates[currency] = cuántas unidades de esa moneda = 1 USD
        // Ejemplo: rates.CLP = 950 significa que 1 USD = 950 CLP
        // Para convertir 1000 CLP a USD: 1000 / 950 = 1.05 USD
        const tasa = await contexto.clienteTasaCambio.obtenerTasa(
          gasto.fecha,
          gasto.moneda
        );
        montoEnUSD = gasto.monto / tasa;
      } catch (error) {
        // Si falla la conversión, usar el monto original (fallback)
        // En producción, esto debería manejarse mejor
        console.warn(`Error convirtiendo ${gasto.moneda} a USD: ${error}`);
      }
    }

    // Límites en USD según la política
    if (montoEnUSD <= 100) {
      return {
        gastoId: gasto.id,
        estado: EstadoValidacion.APROBADO,
        alertas: []
      };
    }

    if (montoEnUSD <= 150) {
      return {
        gastoId: gasto.id,
        estado: EstadoValidacion.PENDIENTE,
        alertas: [{
          codigo: "LIMITE_FOOD",
          mensaje: "Gasto food requiere revisión."
        }]
      };
    }

    return {
      gastoId: gasto.id,
      estado: EstadoValidacion.RECHAZADO,
      alertas: [{
        codigo: "LIMITE_FOOD",
        mensaje: "Gasto food excede el límite permitido."
      }]
    };
  }
}
