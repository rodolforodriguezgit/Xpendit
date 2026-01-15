import * as fs from "fs";
import * as path from "path";
import { AnalizadorLoteGastos } from "../AnalizadorLoteGastos";
import { ValidadorGastos } from "../../validador/ValidadorGastos";
import { EstadoValidacion } from "../../modelos/EstadoValidacion";
import { IGasto } from "../../interfaces/IGasto";
import { IEmpleado } from "../../interfaces/IEmpleado";

// Mock del validador
class ValidadorGastosMock extends ValidadorGastos {
  private resultadosMock: Map<string, any> = new Map();

  setResultadoMock(gastoId: string, resultado: any) {
    this.resultadosMock.set(gastoId, resultado);
  }

  async validar(gasto: IGasto, empleado: IEmpleado): Promise<any> {
    const resultado = this.resultadosMock.get(gasto.id);
    if (resultado) {
      return resultado;
    }
    // Por defecto, retornar aprobado
    return {
      gastoId: gasto.id,
      estado: EstadoValidacion.APROBADO,
      alertas: [],
    };
  }
}

describe("AnalizadorLoteGastos", () => {
  let analizador: AnalizadorLoteGastos;
  let validadorMock: ValidadorGastosMock;
  let archivoCSVTemporal: string;

  beforeEach(() => {
    validadorMock = new ValidadorGastosMock([], undefined);
    analizador = new AnalizadorLoteGastos(validadorMock);
    
    // Crear archivo CSV temporal
    archivoCSVTemporal = path.join(__dirname, "test_gastos.csv");
  });

  afterEach(() => {
    // Limpiar archivo temporal si existe
    if (fs.existsSync(archivoCSVTemporal)) {
      fs.unlinkSync(archivoCSVTemporal);
    }
  });

  describe("Análisis básico", () => {
    it("debe procesar un CSV con un gasto aprobado", async () => {
      const contenidoCSV = `gasto_id,empleado_id,empleado_nombre,empleado_apellido,empleado_cost_center,categoria,monto,moneda,fecha
g_001,e_001,Juan,Perez,sales_team,food,50,USD,2025-10-20`;

      fs.writeFileSync(archivoCSVTemporal, contenidoCSV, "utf-8");

      validadorMock.setResultadoMock("g_001", {
        gastoId: "g_001",
        estado: EstadoValidacion.APROBADO,
        alertas: [],
      });

      const resultado = await analizador.analizar(archivoCSVTemporal);

      expect(resultado.aprobados).toBe(1);
      expect(resultado.pendientes).toBe(0);
      expect(resultado.rechazados).toBe(0);
      expect(resultado.anomalias).toHaveLength(0);
      expect(resultado.resultados).toHaveLength(1);
      expect(resultado.resultados[0].gastoId).toBe("g_001");
      expect(resultado.resultados[0].estado).toBe(EstadoValidacion.APROBADO);
    });

    it("debe procesar múltiples gastos con diferentes estados", async () => {
      const contenidoCSV = `gasto_id,empleado_id,empleado_nombre,empleado_apellido,empleado_cost_center,categoria,monto,moneda,fecha
g_001,e_001,Juan,Perez,sales_team,food,50,USD,2025-10-20
g_002,e_002,Maria,Garcia,sales_team,food,120,USD,2025-10-21
g_003,e_003,Carlos,Lopez,core_engineering,food,30,USD,2025-10-22`;

      fs.writeFileSync(archivoCSVTemporal, contenidoCSV, "utf-8");

      validadorMock.setResultadoMock("g_001", {
        gastoId: "g_001",
        estado: EstadoValidacion.APROBADO,
        alertas: [],
      });

      validadorMock.setResultadoMock("g_002", {
        gastoId: "g_002",
        estado: EstadoValidacion.PENDIENTE,
        alertas: [{ codigo: "LIMITE_FOOD", mensaje: "Requiere revisión" }],
      });

      validadorMock.setResultadoMock("g_003", {
        gastoId: "g_003",
        estado: EstadoValidacion.RECHAZADO,
        alertas: [{ codigo: "POLITICA_CENTRO_COSTO", mensaje: "Prohibido" }],
      });

      const resultado = await analizador.analizar(archivoCSVTemporal);

      expect(resultado.aprobados).toBe(1);
      expect(resultado.pendientes).toBe(1);
      expect(resultado.rechazados).toBe(1);
      expect(resultado.resultados).toHaveLength(3);
    });

    it("debe ignorar líneas vacías", async () => {
      const contenidoCSV = `gasto_id,empleado_id,empleado_nombre,empleado_apellido,empleado_cost_center,categoria,monto,moneda,fecha
g_001,e_001,Juan,Perez,sales_team,food,50,USD,2025-10-20

g_002,e_002,Maria,Garcia,sales_team,food,120,USD,2025-10-21
`;

      fs.writeFileSync(archivoCSVTemporal, contenidoCSV, "utf-8");

      validadorMock.setResultadoMock("g_001", {
        gastoId: "g_001",
        estado: EstadoValidacion.APROBADO,
        alertas: [],
      });

      validadorMock.setResultadoMock("g_002", {
        gastoId: "g_002",
        estado: EstadoValidacion.APROBADO,
        alertas: [],
      });

      const resultado = await analizador.analizar(archivoCSVTemporal);

      expect(resultado.resultados).toHaveLength(2);
      expect(resultado.aprobados).toBe(2);
    });
  });

  describe("Detección de anomalías", () => {
    it("debe detectar montos negativos", async () => {
      const contenidoCSV = `gasto_id,empleado_id,empleado_nombre,empleado_apellido,empleado_cost_center,categoria,monto,moneda,fecha
g_001,e_001,Juan,Perez,sales_team,food,-50,USD,2025-10-20`;

      fs.writeFileSync(archivoCSVTemporal, contenidoCSV, "utf-8");

      validadorMock.setResultadoMock("g_001", {
        gastoId: "g_001",
        estado: EstadoValidacion.APROBADO,
        alertas: [],
      });

      const resultado = await analizador.analizar(archivoCSVTemporal);

      expect(resultado.anomalias).toHaveLength(1);
      expect(resultado.anomalias[0]).toContain("Monto negativo");
      expect(resultado.resultados[0].alertas.some(a => a.codigo === "MONTO_NEGATIVO")).toBe(true);
    });

    it("debe detectar duplicados exactos", async () => {
      const contenidoCSV = `gasto_id,empleado_id,empleado_nombre,empleado_apellido,empleado_cost_center,categoria,monto,moneda,fecha
g_001,e_001,Juan,Perez,sales_team,food,50,USD,2025-10-20
g_002,e_002,Maria,Garcia,sales_team,food,50,USD,2025-10-20`;

      fs.writeFileSync(archivoCSVTemporal, contenidoCSV, "utf-8");

      validadorMock.setResultadoMock("g_001", {
        gastoId: "g_001",
        estado: EstadoValidacion.APROBADO,
        alertas: [],
      });

      validadorMock.setResultadoMock("g_002", {
        gastoId: "g_002",
        estado: EstadoValidacion.APROBADO,
        alertas: [],
      });

      const resultado = await analizador.analizar(archivoCSVTemporal);

      expect(resultado.anomalias).toHaveLength(1);
      expect(resultado.anomalias[0]).toContain("Duplicado");
      expect(resultado.resultados[1].alertas.some(a => a.codigo === "DUPLICADO")).toBe(true);
    });

    it("debe detectar múltiples anomalías en el mismo gasto", async () => {
      const contenidoCSV = `gasto_id,empleado_id,empleado_nombre,empleado_apellido,empleado_cost_center,categoria,monto,moneda,fecha
g_001,e_001,Juan,Perez,sales_team,food,-50,USD,2025-10-20
g_002,e_002,Maria,Garcia,sales_team,food,-50,USD,2025-10-20`;

      fs.writeFileSync(archivoCSVTemporal, contenidoCSV, "utf-8");

      validadorMock.setResultadoMock("g_001", {
        gastoId: "g_001",
        estado: EstadoValidacion.APROBADO,
        alertas: [],
      });

      validadorMock.setResultadoMock("g_002", {
        gastoId: "g_002",
        estado: EstadoValidacion.APROBADO,
        alertas: [],
      });

      const resultado = await analizador.analizar(archivoCSVTemporal);

      // g_002 tiene monto negativo Y es duplicado
      expect(resultado.anomalias.length).toBeGreaterThanOrEqual(2);
      const alertasG002 = resultado.resultados[1].alertas;
      expect(alertasG002.some(a => a.codigo === "MONTO_NEGATIVO")).toBe(true);
      expect(alertasG002.some(a => a.codigo === "DUPLICADO")).toBe(true);
    });
  });

  describe("Conteo de estados", () => {
    it("debe contar correctamente todos los estados", async () => {
      const contenidoCSV = `gasto_id,empleado_id,empleado_nombre,empleado_apellido,empleado_cost_center,categoria,monto,moneda,fecha
g_001,e_001,Juan,Perez,sales_team,food,50,USD,2025-10-20
g_002,e_002,Maria,Garcia,sales_team,food,120,USD,2025-10-21
g_003,e_003,Carlos,Lopez,core_engineering,food,30,USD,2025-10-22
g_004,e_004,Ana,Martinez,sales_team,food,50,USD,2025-10-23
g_005,e_005,Luis,Rodriguez,sales_team,food,200,USD,2025-10-24`;

      fs.writeFileSync(archivoCSVTemporal, contenidoCSV, "utf-8");

      validadorMock.setResultadoMock("g_001", {
        gastoId: "g_001",
        estado: EstadoValidacion.APROBADO,
        alertas: [],
      });

      validadorMock.setResultadoMock("g_002", {
        gastoId: "g_002",
        estado: EstadoValidacion.PENDIENTE,
        alertas: [],
      });

      validadorMock.setResultadoMock("g_003", {
        gastoId: "g_003",
        estado: EstadoValidacion.RECHAZADO,
        alertas: [],
      });

      validadorMock.setResultadoMock("g_004", {
        gastoId: "g_004",
        estado: EstadoValidacion.APROBADO,
        alertas: [],
      });

      validadorMock.setResultadoMock("g_005", {
        gastoId: "g_005",
        estado: EstadoValidacion.RECHAZADO,
        alertas: [],
      });

      const resultado = await analizador.analizar(archivoCSVTemporal);

      expect(resultado.aprobados).toBe(2);
      expect(resultado.pendientes).toBe(1);
      expect(resultado.rechazados).toBe(2);
      expect(resultado.resultados).toHaveLength(5);
    });
  });

  describe("Procesamiento de datos del CSV", () => {
    it("debe procesar correctamente todos los campos del CSV", async () => {
      const contenidoCSV = `gasto_id,empleado_id,empleado_nombre,empleado_apellido,empleado_cost_center,categoria,monto,moneda,fecha
g_001,e_001,Juan,Perez,sales_team,food,50,USD,2025-10-20`;

      fs.writeFileSync(archivoCSVTemporal, contenidoCSV, "utf-8");

      validadorMock.setResultadoMock("g_001", {
        gastoId: "g_001",
        estado: EstadoValidacion.APROBADO,
        alertas: [],
      });

      const resultado = await analizador.analizar(archivoCSVTemporal);

      expect(resultado.resultados).toHaveLength(1);
      const gasto = resultado.resultados[0];
      expect(gasto.gastoId).toBe("g_001");
    });

    it("debe manejar espacios en blanco en los campos", async () => {
      const contenidoCSV = `gasto_id,empleado_id,empleado_nombre,empleado_apellido,empleado_cost_center,categoria,monto,moneda,fecha
g_001 , e_001 , Juan , Perez , sales_team , food , 50 , USD , 2025-10-20`;

      fs.writeFileSync(archivoCSVTemporal, contenidoCSV, "utf-8");

      validadorMock.setResultadoMock("g_001", {
        gastoId: "g_001",
        estado: EstadoValidacion.APROBADO,
        alertas: [],
      });

      const resultado = await analizador.analizar(archivoCSVTemporal);

      expect(resultado.resultados).toHaveLength(1);
      expect(resultado.aprobados).toBe(1);
    });
  });
});
