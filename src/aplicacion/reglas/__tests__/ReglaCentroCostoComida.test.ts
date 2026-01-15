import { ReglaCentroCostoComida } from "../ReglaCentroCostoComida";
import { IGasto } from "../../../interfaces/IGasto";
import { IEmpleado } from "../../../interfaces/IEmpleado";
import { EstadoValidacion } from "../../../modelos/EstadoValidacion";

describe("ReglaCentroCostoComida", () => {
  const regla = new ReglaCentroCostoComida();

  describe("Gastos permitidos (retorna null)", () => {
    it("debe retornar null para gastos food de sales_team", () => {
      const gasto: IGasto = {
        id: "g_001",
        monto: 100,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_001",
        nombre: "Test",
        apellido: "User",
        centroCosto: "sales_team",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).toBeNull();
    });

    it("debe retornar null para gastos food de otros cost centers", () => {
      const gasto: IGasto = {
        id: "g_001b",
        monto: 100,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_001b",
        nombre: "Test",
        apellido: "User",
        centroCosto: "marketing",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).toBeNull();
    });

    it("debe retornar null para gastos transport de core_engineering", () => {
      const gasto: IGasto = {
        id: "g_002a",
        monto: 100,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "transport",
      };

      const empleado: IEmpleado = {
        id: "e_002a",
        nombre: "Engineer",
        apellido: "Dev",
        centroCosto: "core_engineering",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).toBeNull();
    });

    it("debe retornar null para gastos software de core_engineering", () => {
      const gasto: IGasto = {
        id: "g_002",
        monto: 100,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "software",
      };

      const empleado: IEmpleado = {
        id: "e_002",
        nombre: "Engineer",
        apellido: "Dev",
        centroCosto: "core_engineering",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).toBeNull();
    });

    it("debe retornar null para gastos other de core_engineering", () => {
      const gasto: IGasto = {
        id: "g_002b",
        monto: 100,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "other",
      };

      const empleado: IEmpleado = {
        id: "e_002b",
        nombre: "Engineer",
        apellido: "Dev",
        centroCosto: "core_engineering",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).toBeNull();
    });
  });

  describe("Gastos rechazados (core_engineering + food)", () => {
    it("debe retornar RECHAZADO para gastos food pequeños de core_engineering (1 USD)", () => {
      const gasto: IGasto = {
        id: "g_003a",
        monto: 1,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_003a",
        nombre: "Engineer",
        apellido: "Dev",
        centroCosto: "core_engineering",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado?.alertas).toHaveLength(1);
      expect(resultado?.alertas[0].codigo).toBe("POLITICA_CENTRO_COSTO");
      expect(resultado?.alertas[0].mensaje).toContain("Core Engineering");
    });

    it("debe retornar RECHAZADO para gastos food pequeños de core_engineering (10 USD)", () => {
      const gasto: IGasto = {
        id: "g_004",
        monto: 10,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_004",
        nombre: "Engineer",
        apellido: "Dev",
        centroCosto: "core_engineering",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado?.alertas).toHaveLength(1);
      expect(resultado?.alertas[0].codigo).toBe("POLITICA_CENTRO_COSTO");
    });

    it("debe retornar RECHAZADO para gastos food de core_engineering (50 USD)", () => {
      const gasto: IGasto = {
        id: "g_003",
        monto: 50,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_003",
        nombre: "Engineer",
        apellido: "Dev",
        centroCosto: "core_engineering",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado?.alertas).toHaveLength(1);
      expect(resultado?.alertas[0].codigo).toBe("POLITICA_CENTRO_COSTO");
      expect(resultado?.alertas[0].mensaje).toContain("Core Engineering");
      expect(resultado?.alertas[0].mensaje).toContain("food");
    });

    it("debe retornar RECHAZADO para gastos food grandes de core_engineering (200 USD)", () => {
      const gasto: IGasto = {
        id: "g_003b",
        monto: 200,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const empleado: IEmpleado = {
        id: "e_003b",
        nombre: "Engineer",
        apellido: "Dev",
        centroCosto: "core_engineering",
      };

      const resultado = regla.evaluar(gasto, empleado);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado?.alertas).toHaveLength(1);
      expect(resultado?.alertas[0].codigo).toBe("POLITICA_CENTRO_COSTO");
    });
  });
});
