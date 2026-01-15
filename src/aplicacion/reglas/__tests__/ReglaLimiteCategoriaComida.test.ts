import { ReglaLimiteCategoriaComida } from "../ReglaLimiteCategoriaComida";
import { IGasto } from "../../../interfaces/IGasto";
import { IEmpleado } from "../../../interfaces/IEmpleado";
import { EstadoValidacion } from "../../../modelos/EstadoValidacion";
import { ClienteTasaCambioMock } from "../../../infraestructura/tasa_cambio/ClienteTasaCambioMock";

describe("ReglaLimiteCategoriaComida", () => {
  const regla = new ReglaLimiteCategoriaComida();
  const empleado: IEmpleado = {
    id: "e_001",
    nombre: "Test",
    apellido: "User",
    centroCosto: "sales_team",
  };
  const clienteTasaCambioMock = new ClienteTasaCambioMock();
  const contexto = {
    clienteTasaCambio: clienteTasaCambioMock,
    monedaBase: "USD",
  };

  describe("Gastos no food", () => {
    it("debe retornar null para gastos que no son food", async () => {
      const gasto: IGasto = {
        id: "g_001",
        monto: 200,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "transport",
      };

      const resultado = await regla.evaluar(gasto, empleado, contexto);
      expect(resultado).toBeNull();
    });
  });

  describe("Gastos food aprobados (≤ 100 USD)", () => {
    it("debe retornar APROBADO para gastos food de 0 USD", async () => {
      const gasto: IGasto = {
        id: "g_002a",
        monto: 0,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const resultado = await regla.evaluar(gasto, empleado, contexto);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.APROBADO);
      expect(resultado?.alertas).toHaveLength(0);
    });

    it("debe retornar APROBADO para gastos food de 50 USD", async () => {
      const gasto: IGasto = {
        id: "g_003",
        monto: 50,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const resultado = await regla.evaluar(gasto, empleado, contexto);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.APROBADO);
      expect(resultado?.alertas).toHaveLength(0);
    });

    it("debe retornar APROBADO para gastos food de 99 USD (límite inferior)", async () => {
      const gasto: IGasto = {
        id: "g_002b",
        monto: 99,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const resultado = await regla.evaluar(gasto, empleado, contexto);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.APROBADO);
      expect(resultado?.alertas).toHaveLength(0);
    });

    it("debe retornar APROBADO para gastos food de 100 USD (límite exacto)", async () => {
      const gasto: IGasto = {
        id: "g_002",
        monto: 100,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const resultado = await regla.evaluar(gasto, empleado, contexto);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.APROBADO);
      expect(resultado?.alertas).toHaveLength(0);
    });

    it("debe convertir CLP a USD y aprobar si ≤ 100 USD", async () => {
      // 95000 CLP = 100 USD (950 CLP = 1 USD)
      const gasto: IGasto = {
        id: "g_004",
        monto: 95000,
        moneda: "CLP",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const resultado = await regla.evaluar(gasto, empleado, contexto);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.APROBADO);
      expect(resultado?.alertas).toHaveLength(0);
    });

    it("debe convertir MXN a USD y aprobar si ≤ 100 USD", async () => {
      // 2000 MXN = 100 USD (20 MXN = 1 USD)
      const gasto: IGasto = {
        id: "g_004b",
        monto: 2000,
        moneda: "MXN",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const resultado = await regla.evaluar(gasto, empleado, contexto);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.APROBADO);
      expect(resultado?.alertas).toHaveLength(0);
    });
  });

  describe("Gastos food pendientes (100 < monto ≤ 150 USD)", () => {
    it("debe retornar PENDIENTE para gastos food de 101 USD (límite inferior)", async () => {
      const gasto: IGasto = {
        id: "g_005a",
        monto: 101,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const resultado = await regla.evaluar(gasto, empleado, contexto);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.PENDIENTE);
      expect(resultado?.alertas).toHaveLength(1);
      expect(resultado?.alertas[0].codigo).toBe("LIMITE_FOOD");
    });

    it("debe retornar PENDIENTE para gastos food de 120 USD", async () => {
      const gasto: IGasto = {
        id: "g_005",
        monto: 120,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const resultado = await regla.evaluar(gasto, empleado, contexto);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.PENDIENTE);
      expect(resultado?.alertas).toHaveLength(1);
      expect(resultado?.alertas[0].codigo).toBe("LIMITE_FOOD");
    });

    it("debe retornar PENDIENTE para gastos food de 149 USD (límite superior)", async () => {
      const gasto: IGasto = {
        id: "g_005b",
        monto: 149,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const resultado = await regla.evaluar(gasto, empleado, contexto);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.PENDIENTE);
      expect(resultado?.alertas).toHaveLength(1);
      expect(resultado?.alertas[0].codigo).toBe("LIMITE_FOOD");
    });

    it("debe retornar PENDIENTE para gastos food de 150 USD (límite exacto)", async () => {
      const gasto: IGasto = {
        id: "g_006",
        monto: 150,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const resultado = await regla.evaluar(gasto, empleado, contexto);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.PENDIENTE);
      expect(resultado?.alertas).toHaveLength(1);
      expect(resultado?.alertas[0].codigo).toBe("LIMITE_FOOD");
    });

    it("debe convertir MXN a USD y marcar como PENDIENTE", async () => {
      // 3000 MXN = 150 USD (20 MXN = 1 USD)
      const gasto: IGasto = {
        id: "g_007",
        monto: 3000,
        moneda: "MXN",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const resultado = await regla.evaluar(gasto, empleado, contexto);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.PENDIENTE);
      expect(resultado?.alertas).toHaveLength(1);
    });

    it("debe convertir CLP a USD y marcar como PENDIENTE", async () => {
      // 142500 CLP = 150 USD (950 CLP = 1 USD)
      const gasto: IGasto = {
        id: "g_007b",
        monto: 142500,
        moneda: "CLP",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const resultado = await regla.evaluar(gasto, empleado, contexto);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.PENDIENTE);
      expect(resultado?.alertas).toHaveLength(1);
    });
  });

  describe("Gastos food rechazados (> 150 USD)", () => {
    it("debe retornar RECHAZADO para gastos food de 151 USD (límite inferior)", async () => {
      const gasto: IGasto = {
        id: "g_008a",
        monto: 151,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const resultado = await regla.evaluar(gasto, empleado, contexto);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado?.alertas).toHaveLength(1);
      expect(resultado?.alertas[0].codigo).toBe("LIMITE_FOOD");
      expect(resultado?.alertas[0].mensaje).toContain("excede el límite");
    });

    it("debe retornar RECHAZADO para gastos food de 160 USD", async () => {
      const gasto: IGasto = {
        id: "g_008",
        monto: 160,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const resultado = await regla.evaluar(gasto, empleado, contexto);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado?.alertas).toHaveLength(1);
      expect(resultado?.alertas[0].codigo).toBe("LIMITE_FOOD");
      expect(resultado?.alertas[0].mensaje).toContain("excede el límite");
    });

    it("debe retornar RECHAZADO para gastos food de 200 USD", async () => {
      const gasto: IGasto = {
        id: "g_008b",
        monto: 200,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const resultado = await regla.evaluar(gasto, empleado, contexto);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado?.alertas).toHaveLength(1);
      expect(resultado?.alertas[0].codigo).toBe("LIMITE_FOOD");
    });

    it("debe retornar RECHAZADO para gastos food de 1000 USD (caso extremo)", async () => {
      const gasto: IGasto = {
        id: "g_008c",
        monto: 1000,
        moneda: "USD",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const resultado = await regla.evaluar(gasto, empleado, contexto);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado?.alertas).toHaveLength(1);
    });

    it("debe convertir CLP a USD y rechazar si > 150 USD", async () => {
      // 200000 CLP = ~210 USD (950 CLP = 1 USD)
      const gasto: IGasto = {
        id: "g_009",
        monto: 200000,
        moneda: "CLP",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const resultado = await regla.evaluar(gasto, empleado, contexto);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado?.alertas).toHaveLength(1);
      expect(resultado?.alertas[0].codigo).toBe("LIMITE_FOOD");
    });

    it("debe convertir MXN a USD y rechazar si > 150 USD", async () => {
      // 4000 MXN = 200 USD (20 MXN = 1 USD)
      const gasto: IGasto = {
        id: "g_009b",
        monto: 4000,
        moneda: "MXN",
        fecha: "2025-10-20",
        categoria: "food",
      };

      const resultado = await regla.evaluar(gasto, empleado, contexto);
      expect(resultado).not.toBeNull();
      expect(resultado?.estado).toBe(EstadoValidacion.RECHAZADO);
      expect(resultado?.alertas).toHaveLength(1);
    });
  });
});
