# Motor de Reglas de Validación de Gastos

Sistema de validación de gastos empresariales con motor de reglas configurable, integración con API de tasas de cambio y análisis de lotes.

## 📋 Descripción

Este proyecto implementa un motor de reglas para validar gastos empresariales según políticas configuradas. El sistema puede:

- Validar gastos según reglas de antigüedad, límites por categoría y políticas de centro de costo
- Convertir automáticamente monedas a USD usando la API de Open Exchange Rates
- Procesar lotes de gastos desde archivos CSV
- Detectar anomalías (duplicados, montos negativos)
- Optimizar llamadas a la API mediante caché configurable

## 🚀 Instrucciones de Instalación

### Requisitos Previos

- **Node.js** (v16 o superior)
- **npm** (incluido con Node.js)

### Pasos de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/rodolforodriguezgit/Xpendit.git
   cd Xpendit
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

   Este comando instalará todas las dependencias necesarias definidas en `package.json`, incluyendo:
   - `dotenv`: Para gestión de variables de entorno
   - `node-fetch`: Para llamadas HTTP a la API
   - `typescript`, `ts-node`: Para ejecutar TypeScript
   - `jest`, `ts-jest`: Para testing

## ⚙️ Instrucciones de Configuración

### Configurar la API Key de Open Exchange Rates

Para usar la API real de tasas de cambio, necesitas configurar tu API key a través de un archivo `.env`.

1. **Crear el archivo `.env` en la raíz del proyecto:**
   ```bash
   # En Windows (PowerShell)
   New-Item .env
   
   # En Linux/Mac
   touch .env
   ```

2. **Obtener tu API Key:**
   - Visita [Open Exchange Rates](https://openexchangerates.org/api)
   - Regístrate para obtener una API key gratuita
   - Copia tu API key

3. **Configurar las variables en el archivo `.env`:**
   ```env
   # API Key de Open Exchange Rates
   OPENEXCHANGERATES_API_KEY=tu_api_key_aqui
   
   # Forzar uso del mock (útil para desarrollo y testing)
   # Si está en "true", usará ClienteTasaCambioMock en lugar de la API real
   USE_MOCK=false
   
   # Habilitar/deshabilitar caché de tasas de cambio
   # Por defecto está habilitado (true). Establece "false" para deshabilitar
   USE_CACHE=true
   ```

4. **Ejemplo completo de archivo `.env`:**
   ```env
   OPENEXCHANGERATES_API_KEY=0d42535f54e148c5bae2dbe6e14eedf9
   USE_MOCK=false
   USE_CACHE=true
   ```

## 🧪 Instrucciones para Ejecutar las Pruebas Unitarias

Para ejecutar todas las pruebas unitarias:

```bash
npm test
```

Los tests cubren exhaustivamente:

- ✅ **Regla de Antigüedad** (`ReglaAntiguedadGasto`): Prueba todos los estados (APROBADO, PENDIENTE, RECHAZADO) con casos límite
- ✅ **Regla de Límite Food** (`ReglaLimiteCategoriaComida`): Prueba límites de montos y conversión de monedas
- ✅ **Regla de Centro de Costo** (`ReglaCentroCostoComida`): Prueba políticas de centro de costo
- ✅ **Validador Completo** (`ValidadorGastos`): Prueba la resolución de estados y combinación de reglas


## 🏃 Instrucciones para Ejecutar el Analizador de Lotes

Para ejecutar el analizador de lotes y procesar el archivo CSV:

```bash
npm run dev
```

Este comando ejecutará `ts-node src/index.ts` y procesará el archivo `data/gastos_historicos.csv`.

### Qué hace el analizador:

1. Lee el archivo CSV de gastos históricos
2. Valida cada gasto según las reglas configuradas
3. Convierte monedas a USD usando la API de Open Exchange Rates
4. Detecta anomalías (duplicados, montos negativos)
5. Genera un resumen de resultados
6. Guarda los resultados en un archivo JSON en `results/analisis_[timestamp].json`

### Formato del CSV

El archivo CSV debe tener el siguiente formato:

```csv
gasto_id,empleado_id,empleado_nombre,empleado_apellido,empleado_cost_center,categoria,monto,moneda,fecha
g_001,e_002,Bruno,Soto,sales_team,food,50,USD,2025-10-20
g_002,e_003,Maria,Garcia,core_engineering,software,200,USD,2025-10-21
```

### Salida del Analizador

El programa mostrará en consola:

- Resumen de gastos aprobados, pendientes y rechazados
- Detalle de cada gasto con su estado y alertas
- Lista de anomalías detectadas
- Ruta del archivo JSON generado

Ejemplo de salida:

```
✅ Usando ClienteTasaCambio con API real de Open Exchange Rates (caché: habilitado)

🔍 Analizando gastos históricos...

📊 Resultados del análisis:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Aprobados:    15
⏳ Pendientes:   20
❌ Rechazados:   15
🔴 Anomalías:    5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 Resultados guardados en: results/analisis_2026-01-15T20-19-35-783Z.json
```

## 🔧 Reglas de Validación

### 1. Regla de Antigüedad

- **≤ 30 días**: ✅ APROBADO
- **31-60 días**: ⏳ PENDIENTE (requiere revisión)
- **> 60 días**: ❌ RECHAZADO

### 2. Regla de Límite Food

- **≤ 100 USD**: ✅ APROBADO
- **100-150 USD**: ⏳ PENDIENTE (requiere revisión)
- **> 150 USD**: ❌ RECHAZADO

*Nota: Los montos se convierten automáticamente a USD antes de comparar*

### 3. Regla de Centro de Costo

- **core_engineering + food**: ❌ RECHAZADO (prohibido)

### Resolución de Estado Final

1. Si cualquier regla es **RECHAZADO** → Estado final: **RECHAZADO**
2. Si ninguna es RECHAZADO y al menos una es **PENDIENTE** → Estado final: **PENDIENTE**
3. Si ninguna es RECHAZADO ni PENDIENTE y al menos una es **APROBADO** → Estado final: **APROBADO**
4. Si no aplica ninguna regla → Estado final: **PENDIENTE** (por defecto)

## 📁 Estructura del Proyecto

```
xpendit-regla-motor/
├── src/
│   ├── aplicacion/
│   │   └── reglas/          # Reglas de validación
│   │       └── __tests__/    # Tests de reglas
│   ├── infraestructura/
│   │   └── tasa_cambio/     # Cliente de API de tasas de cambio
│   ├── interfaces/           # Interfaces y tipos
│   ├── modelos/              # Modelos de dominio
│   ├── lote/                 # Analizador de lotes
│   ├── validador/            # Validador principal
│   │   └── __tests__/        # Tests del validador
│   └── index.ts              # Punto de entrada
├── data/
│   └── gastos_historicos.csv # Archivo CSV de entrada
├── results/                  # Resultados JSON generados
├── .env                      # Variables de entorno (no se sube al repo)
├── .env.example              # Plantilla de variables de entorno
├── jest.config.js
├── tsconfig.json
└── package.json
```

## 🛠️ Tecnologías Utilizadas

- **TypeScript**: Lenguaje principal
- **Node.js**: Runtime
- **Jest**: Framework de testing
- **ts-jest**: Transpilador para Jest
- **node-fetch**: Cliente HTTP para llamadas a API
- **dotenv**: Gestión de variables de entorno

## 📝 Licencia

ISC

## 👤 Autor: rodolfo rodriguez


