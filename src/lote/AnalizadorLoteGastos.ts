import * as fs from "fs";
import * as path from "path";
import { IGasto } from "../interfaces/IGasto";
import { IEmpleado } from "../interfaces/IEmpleado";
import { ValidadorGastos } from "../validador/ValidadorGastos";
import { EstadoValidacion } from "../modelos/EstadoValidacion";
import { IResultadoLote } from "../interfaces/IResultadoLote";
import { IResultadoValidacion } from "../interfaces/IResultadoValidacion";

export class AnalizadorLoteGastos {
  constructor(private validador: ValidadorGastos) {}

  async analizar(rutaArchivoCSV: string): Promise<IResultadoLote> {
    const contenido = fs.readFileSync(path.resolve(rutaArchivoCSV), "utf-8");
    const lineas = contenido.split("\n").slice(1); // skip header

    const vistos = new Set<string>();

    let aprobados = 0;
    let pendientes = 0;
    let rechazados = 0;
    const anomalias: string[] = [];
    const resultados: IResultadoValidacion[] = []; // Almacenar resultados estructurados

    for (const linea of lineas) {
      if (!linea.trim()) continue;

      // Formato del CSV: gasto_id,empleado_id,empleado_nombre,empleado_apellido,empleado_cost_center,categoria,monto,moneda,fecha
      const partes = linea.split(",");
      const [
        id,
        empleadoId,
        nombre,
        apellido,
        centroCosto,
        categoria,
        monto,
        moneda,
        fecha,
      ] = partes;

      const gasto: IGasto = {
        id: id.trim(),
        monto: Number(monto.trim()),
        moneda: moneda.trim(),
        fecha: fecha.trim(),
        categoria: categoria.trim() as any,
      };

      const empleado: IEmpleado = {
        id: empleadoId.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        centroCosto: centroCosto.trim() as any,
      };

      // 🔴 Anomalía: duplicado exacto (verificar antes de agregar)
      const claveDuplicado = `${gasto.monto}-${gasto.moneda}-${gasto.fecha}`;
      const esDuplicado = vistos.has(claveDuplicado);
      if (!esDuplicado) {
        vistos.add(claveDuplicado);
      }

      const resultado = await this.validador.validar(gasto, empleado);

      // Agregar alertas de anomalías al resultado estructurado
      if (gasto.monto < 0) {
        anomalias.push(`Monto negativo en gasto ${gasto.id}`);
        resultado.alertas.push({
          codigo: "MONTO_NEGATIVO",
          mensaje: `Monto negativo en gasto ${gasto.id}`,
        });
      }

      if (esDuplicado) {
        anomalias.push(`Duplicado detectado en gasto ${gasto.id}`);
        resultado.alertas.push({
          codigo: "DUPLICADO",
          mensaje: `Duplicado detectado en gasto ${gasto.id}`,
        });
      }

      // Almacenar el resultado estructurado
      resultados.push(resultado);

      // Contar por estado
      switch (resultado.estado) {
        case EstadoValidacion.APROBADO:
          aprobados++;
          break;
        case EstadoValidacion.PENDIENTE:
          pendientes++;
          break;
        case EstadoValidacion.RECHAZADO:
          rechazados++;
          break;
      }
    }

    return {
      aprobados,
      pendientes,
      rechazados,
      anomalias,
      resultados, // Incluir resultados estructurados
    };
  }
}
