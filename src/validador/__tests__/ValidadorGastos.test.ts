import { ValidadorGastos } from "../ValidadorGastos";
import { ReglaLimiteCategoriaComida } from "../../aplicacion/reglas/ReglaLimiteCategoriaComida";
import { ReglaCentroCostoComida } from "../../aplicacion/reglas/ReglaCentroCostoComida";
import { ReglaAntiguedadGasto } from "../../aplicacion/reglas/ReglaAntiguedadGasto";
import { IGasto } from "../../interfaces/IGasto";
import { IEmpleado } from "../../interfaces/IEmpleado";
import { EstadoValidacion } from "../../modelos/EstadoValidacion";
import { ClienteTasaCambioMock } from "../../infraestructura/tasa_cambio/ClienteTasaCambioMock";

describe("ValidadorGastos", () => {
  const clienteTasaCambioMock = new ClienteTasaCambioMock();
  const contexto = {
    clienteTasaCambio: clienteTasaCambioMock,
    monedaBase: "USD",
  };

  const reglas = [
    new ReglaLimiteCategoriaComida(),
    new ReglaCentroCostoComida(),
    new ReglaAntiguedadGasto(),
  ];

  const validador = new ValidadorGastos(reglas, contexto);

  describe("Resolución de estado final - Prioridad 1: RECHAZADO", () => {
    it("debe retornar RECHAZADO si cualquier regla gatilla RECHAZADO (antigüedad > 60 días)", async () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 100); // > 60 días

      const gasto: IGasto = {
        id: "g_001",
        monto: 50,
        moneda: "USD",
        fecha: fecha.toISOString().split("T")[0],
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_001",
        nombre: "Test",
        apellido: "User",
        centroCosto: "sales_team",
      };

      const resultado = await validador.validar(gasto, empleado);
      expect(resultado.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado.alertas.some((a) => a.codigo === "LIMITE_ANTIGUEDAD")).toBe(true);
    });

    it("debe retornar RECHAZADO cuando core_engineering reporta food", async () => {
      const gasto: IGasto = {
        id: "g_002",
        monto: 50,
        moneda: "USD",
        fecha: new Date().toISOString().split("T")[0],
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_002",
        nombre: "Engineer",
        apellido: "Dev",
        centroCosto: "core_engineering",
      };

      const resultado = await validador.validar(gasto, empleado);
      expect(resultado.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado.alertas.some((a) => a.codigo === "POLITICA_CENTRO_COSTO")).toBe(true);
    });

    it("debe retornar RECHAZADO cuando food excede 150 USD", async () => {
      const gasto: IGasto = {
        id: "g_002b",
        monto: 200,
        moneda: "USD",
        fecha: new Date().toISOString().split("T")[0],
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_002b",
        nombre: "Test",
        apellido: "User",
        centroCosto: "sales_team",
      };

      const resultado = await validador.validar(gasto, empleado);
      expect(resultado.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado.alertas.some((a) => a.codigo === "LIMITE_FOOD")).toBe(true);
    });

    it("debe retornar RECHAZADO cuando múltiples reglas gatillan RECHAZADO (prioriza RECHAZADO)", async () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 100); // > 60 días

      const gasto: IGasto = {
        id: "g_002c",
        monto: 200, // También excede límite food
        moneda: "USD",
        fecha: fecha.toISOString().split("T")[0],
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_002c",
        nombre: "Test",
        apellido: "User",
        centroCosto: "sales_team",
      };

      const resultado = await validador.validar(gasto, empleado);
      expect(resultado.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado.alertas.length).toBeGreaterThan(1);
      expect(resultado.alertas.some((a) => a.codigo === "LIMITE_ANTIGUEDAD")).toBe(true);
      expect(resultado.alertas.some((a) => a.codigo === "LIMITE_FOOD")).toBe(true);
    });
  });

  describe("Resolución de estado final - Prioridad 2: PENDIENTE", () => {
    it("debe retornar PENDIENTE si ninguna es RECHAZADO y al menos una es PENDIENTE (antigüedad 31-60 días)", async () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 45); // Entre 31-60 días

      const gasto: IGasto = {
        id: "g_003",
        monto: 50,
        moneda: "USD",
        fecha: fecha.toISOString().split("T")[0],
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_003",
        nombre: "Test",
        apellido: "User",
        centroCosto: "sales_team",
      };

      const resultado = await validador.validar(gasto, empleado);
      expect(resultado.estado).toBe(EstadoValidacion.PENDIENTE);
      expect(resultado.alertas.some((a) => a.codigo === "LIMITE_ANTIGUEDAD")).toBe(true);
    });

    it("debe retornar PENDIENTE cuando food está entre 100-150 USD", async () => {
      const gasto: IGasto = {
        id: "g_004",
        monto: 120,
        moneda: "USD",
        fecha: new Date().toISOString().split("T")[0],
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_004",
        nombre: "Test",
        apellido: "User",
        centroCosto: "sales_team",
      };

      const resultado = await validador.validar(gasto, empleado);
      expect(resultado.estado).toBe(EstadoValidacion.PENDIENTE);
      expect(resultado.alertas.some((a) => a.codigo === "LIMITE_FOOD")).toBe(true);
    });

    it("debe retornar PENDIENTE cuando food está en 100 USD (límite exacto)", async () => {
      const gasto: IGasto = {
        id: "g_004b",
        monto: 100,
        moneda: "USD",
        fecha: new Date().toISOString().split("T")[0],
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_004b",
        nombre: "Test",
        apellido: "User",
        centroCosto: "sales_team",
      };

      const resultado = await validador.validar(gasto, empleado);
      expect(resultado.estado).toBe(EstadoValidacion.APROBADO); // 100 es aprobado, no pendiente
      expect(resultado.alertas).toHaveLength(0);
    });

    it("debe retornar PENDIENTE cuando food está en 150 USD (límite exacto)", async () => {
      const gasto: IGasto = {
        id: "g_004c",
        monto: 150,
        moneda: "USD",
        fecha: new Date().toISOString().split("T")[0],
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_004c",
        nombre: "Test",
        apellido: "User",
        centroCosto: "sales_team",
      };

      const resultado = await validador.validar(gasto, empleado);
      expect(resultado.estado).toBe(EstadoValidacion.PENDIENTE);
      expect(resultado.alertas.some((a) => a.codigo === "LIMITE_FOOD")).toBe(true);
    });

    it("debe retornar PENDIENTE cuando múltiples reglas gatillan PENDIENTE", async () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 45); // PENDIENTE por antigüedad

      const gasto: IGasto = {
        id: "g_004d",
        monto: 120, // También PENDIENTE por límite food
        moneda: "USD",
        fecha: fecha.toISOString().split("T")[0],
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_004d",
        nombre: "Test",
        apellido: "User",
        centroCosto: "sales_team",
      };

      const resultado = await validador.validar(gasto, empleado);
      expect(resultado.estado).toBe(EstadoValidacion.PENDIENTE);
      expect(resultado.alertas.length).toBeGreaterThan(1);
      expect(resultado.alertas.some((a) => a.codigo === "LIMITE_ANTIGUEDAD")).toBe(true);
      expect(resultado.alertas.some((a) => a.codigo === "LIMITE_FOOD")).toBe(true);
    });
  });

  describe("Resolución de estado final - Prioridad 3: APROBADO", () => {
    it("debe retornar APROBADO si ninguna es RECHAZADO ni PENDIENTE", async () => {
      const gasto: IGasto = {
        id: "g_005",
        monto: 50,
        moneda: "USD",
        fecha: new Date().toISOString().split("T")[0],
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_005",
        nombre: "Test",
        apellido: "User",
        centroCosto: "sales_team",
      };

      const resultado = await validador.validar(gasto, empleado);
      expect(resultado.estado).toBe(EstadoValidacion.APROBADO);
      expect(resultado.alertas).toHaveLength(0);
    });

    it("debe retornar APROBADO para gastos food de 100 USD (límite exacto)", async () => {
      const gasto: IGasto = {
        id: "g_005b",
        monto: 100,
        moneda: "USD",
        fecha: new Date().toISOString().split("T")[0],
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_005b",
        nombre: "Test",
        apellido: "User",
        centroCosto: "sales_team",
      };

      const resultado = await validador.validar(gasto, empleado);
      expect(resultado.estado).toBe(EstadoValidacion.APROBADO);
      expect(resultado.alertas).toHaveLength(0);
    });

    it("debe retornar APROBADO para gastos no-food recientes", async () => {
      const gasto: IGasto = {
        id: "g_005c",
        monto: 200,
        moneda: "USD",
        fecha: new Date().toISOString().split("T")[0],
        categoria: "transport",
      };

      const empleado: IEmpleado = {
        id: "e_005c",
        nombre: "Test",
        apellido: "User",
        centroCosto: "sales_team",
      };

      const resultado = await validador.validar(gasto, empleado);
      expect(resultado.estado).toBe(EstadoValidacion.APROBADO);
      expect(resultado.alertas).toHaveLength(0);
    });

    it("debe retornar APROBADO para gastos software de core_engineering recientes", async () => {
      const gasto: IGasto = {
        id: "g_005d",
        monto: 500,
        moneda: "USD",
        fecha: new Date().toISOString().split("T")[0],
        categoria: "software",
      };

      const empleado: IEmpleado = {
        id: "e_005d",
        nombre: "Engineer",
        apellido: "Dev",
        centroCosto: "core_engineering",
      };

      const resultado = await validador.validar(gasto, empleado);
      expect(resultado.estado).toBe(EstadoValidacion.APROBADO);
      expect(resultado.alertas).toHaveLength(0);
    });
  });

  describe("Resolución de estado final - Por defecto: PENDIENTE", () => {
    it("debe retornar PENDIENTE si no aplica ninguna regla (gasto muy antiguo sin otras reglas)", async () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 100); // > 60 días

      const gasto: IGasto = {
        id: "g_006",
        monto: 50,
        moneda: "USD",
        fecha: fecha.toISOString().split("T")[0],
        categoria: "other",
      };

      const empleado: IEmpleado = {
        id: "e_006",
        nombre: "Test",
        apellido: "User",
        centroCosto: "sales_team",
      };

      const resultado = await validador.validar(gasto, empleado);
      // ReglaAntiguedadGasto aplica y retorna RECHAZADO
      expect(resultado.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado.alertas.some((a) => a.codigo === "LIMITE_ANTIGUEDAD")).toBe(true);
    });

    it("debe retornar PENDIENTE cuando todas las reglas retornan null (caso teórico)", async () => {
      const gasto: IGasto = {
        id: "g_006b",
        monto: 50,
        moneda: "USD",
        fecha: new Date().toISOString().split("T")[0],
        categoria: "other",
      };

      const empleado: IEmpleado = {
        id: "e_006b",
        nombre: "Test",
        apellido: "User",
        centroCosto: "sales_team",
      };

      // Crear un validador sin reglas para probar el caso por defecto
      const validadorVacio = new ValidadorGastos([], contexto);
      const resultado = await validadorVacio.validar(gasto, empleado);
      expect(resultado.estado).toBe(EstadoValidacion.PENDIENTE);
      expect(resultado.alertas).toHaveLength(0);
    });
  });

  describe("Múltiples alertas", () => {
    it("debe combinar alertas de múltiples reglas PENDIENTE", async () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 45); // PENDIENTE por antigüedad

      const gasto: IGasto = {
        id: "g_007",
        monto: 120,
        moneda: "USD",
        fecha: fecha.toISOString().split("T")[0],
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_007",
        nombre: "Test",
        apellido: "User",
        centroCosto: "sales_team",
      };

      const resultado = await validador.validar(gasto, empleado);
      expect(resultado.estado).toBe(EstadoValidacion.PENDIENTE);
      expect(resultado.alertas.length).toBeGreaterThan(1);
      expect(resultado.alertas.some((a) => a.codigo === "LIMITE_ANTIGUEDAD")).toBe(true);
      expect(resultado.alertas.some((a) => a.codigo === "LIMITE_FOOD")).toBe(true);
    });

    it("debe combinar alertas de múltiples reglas RECHAZADO", async () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 100); // RECHAZADO por antigüedad

      const gasto: IGasto = {
        id: "g_007b",
        monto: 200, // También RECHAZADO por límite food
        moneda: "USD",
        fecha: fecha.toISOString().split("T")[0],
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_007b",
        nombre: "Test",
        apellido: "User",
        centroCosto: "sales_team",
      };

      const resultado = await validador.validar(gasto, empleado);
      expect(resultado.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado.alertas.length).toBeGreaterThan(1);
      expect(resultado.alertas.some((a) => a.codigo === "LIMITE_ANTIGUEDAD")).toBe(true);
      expect(resultado.alertas.some((a) => a.codigo === "LIMITE_FOOD")).toBe(true);
    });

    it("debe combinar alertas cuando core_engineering reporta food antiguo", async () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 45); // PENDIENTE por antigüedad

      const gasto: IGasto = {
        id: "g_007c",
        monto: 50,
        moneda: "USD",
        fecha: fecha.toISOString().split("T")[0],
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_007c",
        nombre: "Engineer",
        apellido: "Dev",
        centroCosto: "core_engineering",
      };

      const resultado = await validador.validar(gasto, empleado);
      expect(resultado.estado).toBe(EstadoValidacion.RECHAZADO); // RECHAZADO tiene prioridad
      expect(resultado.alertas.some((a) => a.codigo === "POLITICA_CENTRO_COSTO")).toBe(true);
      expect(resultado.alertas.some((a) => a.codigo === "LIMITE_ANTIGUEDAD")).toBe(true);
    });
  });
});
