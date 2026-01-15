import { ClienteTasaCambio } from "../ClienteTasaCambio";

// Mock de node-fetch usando jest.mock antes de importar
const mockFetch = jest.fn();

// Mock debe estar antes de cualquier import que use fetch
jest.mock("node-fetch", () => {
  return {
    __esModule: true,
    default: jest.fn((...args: any[]) => mockFetch(...args)),
  };
});

describe("ClienteTasaCambio", () => {
  const apiKey = "test-api-key-123";
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Constructor y configuración", () => {
    it("debe crear instancia con API key y caché habilitado por defecto", () => {
      const cliente = new ClienteTasaCambio(apiKey);
      expect(cliente.obtenerTamanoCache()).toBe(0);
    });

    it("debe crear instancia con caché deshabilitado", () => {
      const cliente = new ClienteTasaCambio(apiKey, false);
      expect(cliente.obtenerTamanoCache()).toBe(0);
    });
  });

  describe("obtenerTasa - Fechas históricas", () => {
    it("debe obtener tasa para fecha histórica y guardar en caché", async () => {
      const fecha = "2025-10-20";
      const moneda = "CLP";
      const tasaEsperada = 950;

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          disclaimer: "test",
          license: "test",
          timestamp: 1234567890,
          base: "USD",
          rates: {
            CLP: tasaEsperada,
            MXN: 20,
            EUR: 0.85,
          },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const cliente = new ClienteTasaCambio(apiKey, true);
      const tasa = await cliente.obtenerTasa(fecha, moneda);

      expect(tasa).toBe(tasaEsperada);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://openexchangerates.org/api/historical/${fecha}.json?app_id=${apiKey}`
      );
      expect(cliente.obtenerTamanoCache()).toBe(1);
    });

    it("debe usar caché cuando la fecha ya fue consultada", async () => {
      const fecha = "2025-10-20";
      const moneda = "CLP";
      const tasaEsperada = 950;

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: {
            CLP: tasaEsperada,
          },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const cliente = new ClienteTasaCambio(apiKey, true);
      
      // Primera llamada
      const tasa1 = await cliente.obtenerTasa(fecha, moneda);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Segunda llamada - debe usar caché
      const tasa2 = await cliente.obtenerTasa(fecha, moneda);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No debe llamar de nuevo
      expect(tasa1).toBe(tasaEsperada);
      expect(tasa2).toBe(tasaEsperada);
    });

    it("debe no usar caché cuando está deshabilitado", async () => {
      const fecha = "2025-10-20";
      const moneda = "CLP";
      const tasaEsperada = 950;

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: {
            CLP: tasaEsperada,
          },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const cliente = new ClienteTasaCambio(apiKey, false);
      
      // Primera llamada
      await cliente.obtenerTasa(fecha, moneda);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Segunda llamada - debe llamar de nuevo porque no hay caché
      await cliente.obtenerTasa(fecha, moneda);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(cliente.obtenerTamanoCache()).toBe(0);
    });
  });

  describe("obtenerTasa - Fecha actual (latest.json)", () => {
    it("debe usar endpoint latest.json para fecha de hoy", async () => {
      const hoy = new Date().toISOString().split("T")[0];
      const moneda = "EUR";
      const tasaEsperada = 0.85;

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: {
            EUR: tasaEsperada,
          },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const cliente = new ClienteTasaCambio(apiKey);
      const tasa = await cliente.obtenerTasa(hoy, moneda);

      expect(tasa).toBe(tasaEsperada);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://openexchangerates.org/api/latest.json?app_id=${apiKey}`
      );
    });
  });

  describe("Manejo de errores", () => {
    it("debe lanzar error cuando la respuesta HTTP no es exitosa", async () => {
      const fecha = "2025-10-20";
      const moneda = "CLP";

      const mockResponse = {
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const cliente = new ClienteTasaCambio(apiKey);
      
      await expect(cliente.obtenerTasa(fecha, moneda)).rejects.toThrow(
        "Error al obtener tasa de cambio: 401 Unauthorized"
      );
    });

    it("debe lanzar error cuando la respuesta no tiene campo rates", async () => {
      const fecha = "2025-10-20";
      const moneda = "CLP";

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          disclaimer: "test",
          // Sin campo rates
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const cliente = new ClienteTasaCambio(apiKey);
      
      await expect(cliente.obtenerTasa(fecha, moneda)).rejects.toThrow(
        "Respuesta de API inválida para la fecha 2025-10-20. Se esperaba el campo 'rates'"
      );
    });

    it("debe lanzar error cuando la moneda no está en la respuesta", async () => {
      const fecha = "2025-10-20";
      const moneda = "XYZ"; // Moneda inexistente

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: {
            CLP: 950,
            MXN: 20,
          },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const cliente = new ClienteTasaCambio(apiKey);
      
      await expect(cliente.obtenerTasa(fecha, moneda)).rejects.toThrow(
        "Moneda XYZ no encontrada en la respuesta de la API para la fecha 2025-10-20"
      );
    });

    it("debe lanzar error cuando la moneda no está en el caché", async () => {
      const fecha = "2025-10-20";
      const moneda = "XYZ";

      // Primero guardamos en caché con una moneda diferente
      const mockResponse1 = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: {
            CLP: 950,
          },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse1 as any);

      const cliente = new ClienteTasaCambio(apiKey, true);
      await cliente.obtenerTasa(fecha, "CLP");

      // Ahora intentamos obtener una moneda que no está en caché
      await expect(cliente.obtenerTasa(fecha, moneda)).rejects.toThrow(
        "Moneda XYZ no encontrada en la respuesta de la API para la fecha 2025-10-20"
      );
    });
  });

  describe("Gestión de caché", () => {
    it("debe limpiar todo el caché", async () => {
      const fecha = "2025-10-20";
      const moneda = "CLP";

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: {
            CLP: 950,
          },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const cliente = new ClienteTasaCambio(apiKey, true);
      await cliente.obtenerTasa(fecha, moneda);
      
      expect(cliente.obtenerTamanoCache()).toBe(1);
      
      cliente.limpiarCache();
      expect(cliente.obtenerTamanoCache()).toBe(0);
    });

    it("debe limpiar caché de una fecha específica", async () => {
      const fecha1 = "2025-10-20";
      const fecha2 = "2025-10-21";
      const moneda = "CLP";

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: {
            CLP: 950,
          },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const cliente = new ClienteTasaCambio(apiKey, true);
      await cliente.obtenerTasa(fecha1, moneda);
      await cliente.obtenerTasa(fecha2, moneda);
      
      expect(cliente.obtenerTamanoCache()).toBe(2);
      
      cliente.limpiarCacheFecha(fecha1);
      expect(cliente.obtenerTamanoCache()).toBe(1);
      
      // La fecha2 debe seguir en caché
      const tasa = await cliente.obtenerTasa(fecha2, moneda);
      expect(tasa).toBe(950);
      expect(mockFetch).toHaveBeenCalledTimes(2); // No debe llamar de nuevo
    });

    it("debe obtener tamaño del caché correctamente", async () => {
      const cliente = new ClienteTasaCambio(apiKey, true);
      expect(cliente.obtenerTamanoCache()).toBe(0);

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: {
            CLP: 950,
          },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      await cliente.obtenerTasa("2025-10-20", "CLP");
      expect(cliente.obtenerTamanoCache()).toBe(1);

      await cliente.obtenerTasa("2025-10-21", "CLP");
      expect(cliente.obtenerTamanoCache()).toBe(2);
    });
  });

  describe("Múltiples monedas", () => {
    it("debe obtener diferentes monedas de la misma fecha desde caché", async () => {
      const fecha = "2025-10-20";

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          rates: {
            CLP: 950,
            MXN: 20,
            EUR: 0.85,
          },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const cliente = new ClienteTasaCambio(apiKey, true);
      
      const tasaCLP = await cliente.obtenerTasa(fecha, "CLP");
      const tasaMXN = await cliente.obtenerTasa(fecha, "MXN");
      const tasaEUR = await cliente.obtenerTasa(fecha, "EUR");

      expect(tasaCLP).toBe(950);
      expect(tasaMXN).toBe(20);
      expect(tasaEUR).toBe(0.85);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Solo una llamada HTTP
    });
  });
});
