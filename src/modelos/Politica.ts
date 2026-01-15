export interface LimiteAntiguedad {
  pendiente_dias: number;
  rechazado_dias: number;
}

export interface LimiteCategoria {
  aprobado_hasta: number;
  pendiente_hasta: number;
}

export interface ReglaCentroCosto {
  cost_center: string;
  categoria_prohibida: string;
}

export class Politica {
  constructor(
    public moneda_base: string,
    public limite_antiguedad: LimiteAntiguedad,
    public limites_por_categoria: { [categoria: string]: LimiteCategoria },
    public reglas_centro_costo: ReglaCentroCosto[]
  ) {}
}
