import { IReglaCentroCosto } from "./IReglaCentroCosto";

export interface IPolitica {
  monedaBase: string;

  limiteAntiguedad: {
    diasPendiente: number;
    diasRechazado: number;
  };

  limitesPorCategoria: {
    [categoria: string]: {
      aprobadoHasta: number;
      pendienteHasta: number;
    };
  };

  reglasCentroCosto: IReglaCentroCosto[];
}
