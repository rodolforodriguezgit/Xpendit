import { CategoriaGasto } from "../modelos/CategoriaGasto";

export interface IGasto {
  id: string;
  monto: number;
  moneda: string;     
  fecha: string;          
  categoria: CategoriaGasto;
}
