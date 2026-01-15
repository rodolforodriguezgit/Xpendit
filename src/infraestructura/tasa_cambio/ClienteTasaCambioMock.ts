import { IClienteTasaCambio } from "../../interfaces/IClienteTasaCambio";

/**
 * Mock del ClienteTasaCambio para desarrollo y testing
 * Devuelve tasas de cambio simuladas sin hacer llamadas a la API
 */
export class ClienteTasaCambioMock implements IClienteTasaCambio {
  // Tasas de cambio simuladas (1 USD = X moneda)
  private tasasMock: Record<string, number> = {
    USD: 1,
    CLP: 950,  // 1 USD = 950 CLP
    MXN: 20,   // 1 USD = 20 MXN
    EUR: 0.85, // 1 USD = 0.85 EUR
  };

  async obtenerTasa(fecha: string, moneda: string): Promise<number> {
    // Simular un pequeño delay para hacerlo más realista
    await new Promise(resolve => setTimeout(resolve, 10));

    const tasa = this.tasasMock[moneda];
    if (!tasa) {
      // Si la moneda no está en el mock, asumir 1:1 con USD
      console.warn(`Moneda ${moneda} no encontrada en mock, usando tasa 1`);
      return 1;
    }

    return tasa;
  }
}
