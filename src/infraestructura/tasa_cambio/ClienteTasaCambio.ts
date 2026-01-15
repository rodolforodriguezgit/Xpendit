import fetch from "node-fetch";
import { IRespuestaTasaCambio } from "../../interfaces/IRespuestaTasaCambio";
import { IClienteTasaCambio } from "../../interfaces/IClienteTasaCambio";

export class ClienteTasaCambio implements IClienteTasaCambio {
  // Caché para almacenar respuestas completas por fecha
  // Clave: fecha (string), Valor: IRespuestaTasaCambio completo
  private cache = new Map<string, IRespuestaTasaCambio>();
  private cacheHabilitado: boolean;

  /**
   * @param apiKey API key de Open Exchange Rates
   * @param cacheHabilitado Si es true, usa caché para optimizar llamadas. Si es false, siempre hace llamadas a la API.
   */
  constructor(apiKey: string, cacheHabilitado: boolean = true) {
    this.apiKey = apiKey;
    this.cacheHabilitado = cacheHabilitado;
  }

  private apiKey: string;

  /**
   * Determina si una fecha es hoy
   */
  private esFechaHoy(fecha: string): boolean {
    const hoy = new Date().toISOString().split("T")[0];
    return fecha === hoy;
  }

  /**
   * Construye la URL del endpoint según si es fecha actual o histórica
   */
  private construirURL(fecha: string): string {
    const baseURL = "https://openexchangerates.org/api";
    
    if (this.esFechaHoy(fecha)) {
      // Para fechas de hoy, usar el endpoint latest.json
      return `${baseURL}/latest.json?app_id=${this.apiKey}`;
    } else {
      // Para fechas pasadas, usar el endpoint historical
      return `${baseURL}/historical/${fecha}.json?app_id=${this.apiKey}`;
    }
  }

  /**
   * Limpia todo el caché de tasas de cambio
   * Útil para pruebas o cuando necesitas forzar nuevas llamadas a la API
   */
  limpiarCache(): void {
    this.cache.clear();
  }

  /**
   * Limpia el caché de una fecha específica
   * @param fecha Fecha en formato ISO (YYYY-MM-DD)
   */
  limpiarCacheFecha(fecha: string): void {
    this.cache.delete(fecha);
  }

  /**
   * Obtiene el tamaño actual del caché (útil para debugging)
   */
  obtenerTamanoCache(): number {
    return this.cache.size;
  }

  async obtenerTasa(fecha: string, moneda: string): Promise<number> {
    // Verificar si el caché está habilitado y si ya tenemos esta fecha en caché
    if (this.cacheHabilitado && this.cache.has(fecha)) {
      const datosCache = this.cache.get(fecha)!;
      // Usar tasas si está mapeado, sino usar rates directamente
      const tasas = datosCache.tasas || datosCache.rates;
      if (!tasas || !tasas[moneda]) {
        throw new Error(`Moneda ${moneda} no encontrada en la respuesta de la API para la fecha ${fecha}`);
      }
      return tasas[moneda];
    }

    // Si no está en caché, hacer la llamada HTTP
    const url = this.construirURL(fecha);
    const response = await fetch(url);

    // Verificar que la respuesta sea exitosa
    if (!response.ok) {
      throw new Error(
        `Error al obtener tasa de cambio: ${response.status} ${response.statusText}. ` +
        `URL: ${url}`
      );
    }

    // La API devuelve: { disclaimer, license, timestamp, base, rates: { AED: 3.67, ... } }
    const data = (await response.json()) as IRespuestaTasaCambio;
    
    // Validar que la respuesta tenga la estructura esperada según la documentación de la API
    // La API siempre devuelve 'rates' con las tasas de cambio
    if (!data || !data.rates) {
      throw new Error(`Respuesta de API inválida para la fecha ${fecha}. Se esperaba el campo 'rates'`);
    }

    // Validar que la moneda solicitada esté disponible en rates
    if (!data.rates[moneda]) {
      throw new Error(`Moneda ${moneda} no encontrada en la respuesta de la API para la fecha ${fecha}`);
    }
    
    // Mapear 'rates' (de la API) a 'tasas' (uso interno) para consistencia
    // La API usa 'rates', pero internamente mantenemos 'tasas' para compatibilidad
    const dataMapeado: IRespuestaTasaCambio = {
      ...data,
      tasas: data.rates
    };
    
    // Guardar toda la respuesta en caché solo si el caché está habilitado
    // Esto permite que múltiples gastos de la misma fecha usen el caché
    if (this.cacheHabilitado) {
      this.cache.set(fecha, dataMapeado);
    }
    
    // Retornar la tasa desde 'rates' que es el campo real de la API
    return data.rates[moneda];
  }
}
