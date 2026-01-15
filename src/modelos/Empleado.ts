export class Empleado {
  constructor(
    public id: string,
    public nombre: string,
    public apellido: string,
    public cost_center: string // String, ej. "sales_team", "core_engineering"
  ) {}
}
