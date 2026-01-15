import { ReglaAntiguedadGasto } from "../ReglaAntiguedadGasto";
import { IGasto } from "../../../interfaces/IGasto";
import { IEmpleado } from "../../../interfaces/IEmpleado";
import { EstadoValidacion } from "../../../modelos/EstadoValidacion";

describe("ReglaAntiguedadGasto", () => {
  const regla = new ReglaAntiguedadGasto();
  const empleado: IEmpleado = {
    id: "e_001",
    nombre: "Test",
    apellido: "User",
    centroCosto: "sales_team",
  };

  describe("Gastos aprobados (≤ 30 días)", () => {
    it("debe retornar APROBADO para gastos de 0 días", () => {
      const hoy = new Date().toISOString().split("T")[0];
      const gasto: IGasto = {
        id: "g_001",
        monto: 100,
        moneda: "USD",
        fecha: hoy,
        categoria: "food",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.APROBADO);
      expect(resultado?.alertas).toHaveLength(0);
    });

    it("debe retornar APROBADO para gastos de 15 días", () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 15);
      const gasto: IGasto = {
        id: "g_001b",
        monto: 100,
        moneda: "USD",
        fecha: fecha.toISOString().split("T")[0],
        categoria: "food",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.APROBADO);
      expect(resultado?.alertas).toHaveLength(0);
    });

    it("debe retornar APROBADO para gastos de 29 días (límite inferior)", () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 29);
      const gasto: IGasto = {
        id: "g_001c",
        monto: 100,
        moneda: "USD",
        fecha: fecha.toISOString().split("T")[0],
        categoria: "food",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.APROBADO);
      expect(resultado?.alertas).toHaveLength(0);
    });

    it("debe retornar APROBADO para gastos de 30 días (límite exacto)", () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 30);
      const gasto: IGasto = {
        id: "g_002",
        monto: 100,
        moneda: "USD",
        fecha: fecha.toISOString().split("T")[0],
        categoria: "food",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.APROBADO);
      expect(resultado?.alertas).toHaveLength(0);
    });
  });

  describe("Gastos pendientes (31-60 días)", () => {
    it("debe retornar PENDIENTE para gastos de 31 días (límite inferior)", () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 31);
      const gasto: IGasto = {
        id: "g_003",
        monto: 100,
        moneda: "USD",
        fecha: fecha.toISOString().split("T")[0],
        categoria: "food",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.PENDIENTE);
      expect(resultado?.alertas).toHaveLength(1);
      expect(resultado?.alertas[0].codigo).toBe("LIMITE_ANTIGUEDAD");
      expect(resultado?.alertas[0].mensaje).toContain("30 días");
    });

    it("debe retornar PENDIENTE para gastos de 45 días (medio del rango)", () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 45);
      const gasto: IGasto = {
        id: "g_003b",
        monto: 100,
        moneda: "USD",
        fecha: fecha.toISOString().split("T")[0],
        categoria: "food",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.PENDIENTE);
      expect(resultado?.alertas).toHaveLength(1);
      expect(resultado?.alertas[0].codigo).toBe("LIMITE_ANTIGUEDAD");
    });

    it("debe retornar PENDIENTE para gastos de 59 días (límite superior)", () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 59);
      const gasto: IGasto = {
        id: "g_003c",
        monto: 100,
        moneda: "USD",
        fecha: fecha.toISOString().split("T")[0],
        categoria: "food",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.PENDIENTE);
      expect(resultado?.alertas).toHaveLength(1);
    });

    it("debe retornar PENDIENTE para gastos de 60 días (límite exacto)", () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 60);
      const gasto: IGasto = {
        id: "g_004",
        monto: 100,
        moneda: "USD",
        fecha: fecha.toISOString().split("T")[0],
        categoria: "food",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.PENDIENTE);
      expect(resultado?.alertas).toHaveLength(1);
      expect(resultado?.alertas[0].codigo).toBe("LIMITE_ANTIGUEDAD");
    });
  });

  describe("Gastos rechazados (> 60 días)", () => {
    it("debe retornar RECHAZADO para gastos de 61 días (límite inferior)", () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 61);
      const gasto: IGasto = {
        id: "g_005",
        monto: 100,
        moneda: "USD",
        fecha: fecha.toISOString().split("T")[0],
        categoria: "food",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado?.alertas).toHaveLength(1);
      expect(resultado?.alertas[0].codigo).toBe("LIMITE_ANTIGUEDAD");
      expect(resultado?.alertas[0].mensaje).toContain("60 días");
    });

    it("debe retornar RECHAZADO para gastos de 90 días", () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 90);
      const gasto: IGasto = {
        id: "g_005b",
        monto: 100,
        moneda: "USD",
        fecha: fecha.toISOString().split("T")[0],
        categoria: "food",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado?.alertas).toHaveLength(1);
      expect(resultado?.alertas[0].codigo).toBe("LIMITE_ANTIGUEDAD");
    });

    it("debe retornar RECHAZADO para gastos muy antiguos (100 días)", () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 100);
      const gasto: IGasto = {
        id: "g_006",
        monto: 100,
        moneda: "USD",
        fecha: fecha.toISOString().split("T")[0],
        categoria: "food",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado?.alertas).toHaveLength(1);
      expect(resultado?.alertas[0].codigo).toBe("LIMITE_ANTIGUEDAD");
    });

    it("debe retornar RECHAZADO para gastos extremadamente antiguos (365 días)", () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 365);
      const gasto: IGasto = {
        id: "g_006b",
        monto: 100,
        moneda: "USD",
        fecha: fecha.toISOString().split("T")[0],
        categoria: "food",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado?.alertas).toHaveLength(1);
    });
  });
});
