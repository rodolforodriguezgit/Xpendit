import { CategoriaGasto } from "./CategoriaGasto";

export class Gasto {
  constructor(
    public id: string,
    public monto: number,
    public moneda: string,
    public fecha: string, // String ISO, ej. "2025-10-20"
    public categoria: CategoriaGasto // String, ej. "food", "transport", "software"
  ) {}
}
