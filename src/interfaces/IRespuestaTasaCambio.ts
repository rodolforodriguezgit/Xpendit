/**
 * Respuesta de la API de Open Exchange Rates
 * La API devuelve 'rates' pero internamente usamos 'tasas' para consistencia
 */
export interface IRespuestaTasaCambio {
  disclaimer?: string;
  license?: string;
  timestamp?: number;
  base?: string;
  rates: Record<string, number>; // Campo real de la API
  tasas?: Record<string, number>; // Campo mapeado para uso interno
}
