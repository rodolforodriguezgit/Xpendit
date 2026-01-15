export interface IClienteTasaCambio {
  obtenerTasa(fecha: string, moneda: string): Promise<number>;
}
