# Motor de Reglas de Validación de Gastos

Sistema de validación de gastos empresariales con motor de reglas configurable, integración con API de tasas de cambio y análisis de lotes.

## 📋 Descripción

Este proyecto implementa un motor de reglas para validar gastos empresariales según políticas configuradas. El sistema puede:

- Validar gastos según reglas de antigüedad, límites por categoría y políticas de centro de costo
- Convertir automáticamente monedas a USD usando la API de Open Exchange Rates
- Procesar lotes de gastos desde archivos CSV
- Detectar anomalías (duplicados, montos negativos)
- Optimizar llamadas a la API mediante caché

## 🚀 Instalación

### Requisitos Previos

- Node.js (v16 o superior)
- npm o yarn

### Pasos de Instalación

1. Clonar el repositorio o descomprimir el archivo ZIP
2. Instalar dependencias:

```bash
npm install
```

## ⚙️ Configuración

### API Key de Open Exchange Rates

Para usar la API real de tasas de cambio, necesitas una API key de [Open Exchange Rates](https://openexchangerates.org/api).

**Opción 1: Variable de entorno (Recomendado)**

Crea un archivo `.env` en la raíz del proyecto:

```env
OPENEXCHANGERATES_API_KEY=tu_api_key_aqui
```

Luego instala `dotenv`:

```bash
npm install dotenv
```

Y agrega al inicio de `src/index.ts`:

```typescript
import 'dotenv/config';
```

**Opción 2: Sin API Key (Modo Mock)**

Si no proporcionas una API key, el sistema usará automáticamente un mock que simula tasas de cambio. Esto es útil para desarrollo y testing.

Para forzar el uso del mock, establece:

```env
USE_MOCK=true
```

### Estructura del CSV

El archivo CSV debe tener el siguiente formato:

```csv
gasto_id,empleado_id,empleado_nombre,empleado_apellido,empleado_cost_center,categoria,monto,moneda,fecha
g_001,e_002,Bruno,Soto,sales_team,food,50,USD,2025-10-20
```

## 🧪 Ejecutar Tests Unitarios

Para ejecutar todos los tests:

```bash
npm test
```

Para ejecutar tests con cobertura:

```bash
npm test -- --coverage
```

Los tests cubren:
- ✅ Regla de antigüedad (ExpenseAgeRule)
- ✅ Regla de límite de categoría food (FoodCategoryLimitRule)
- ✅ Regla de centro de costo (CostCenterFoodRule)
- ✅ Validador completo (ExpenseValidator)
- ✅ Conversión de monedas

## 🏃 Ejecutar el Analizador de Lotes

Para analizar el archivo CSV de gastos históricos:

```bash
npm run dev
```

O directamente:

```bash
npx ts-node src/index.ts
```

El programa procesará el archivo `data/gastos_historicos.csv` y mostrará:

1. **Resumen**: Contadores de gastos aprobados, pendientes y rechazados
2. **Resultados estructurados**: Detalle de cada gasto con estado y alertas
3. **Anomalías**: Lista de duplicados y montos negativos detectados

## 📁 Estructura del Proyecto

```
xpendit-regla-motor/
├── src/
│   ├── aplication/
│   │   └── rules/          # Reglas de validación
│   ├── batch/              # Analizador de lotes
│   ├── infrastructure/
│   │   └── exchange/      # Cliente de API de tasas de cambio
│   ├── interfaces/         # Interfaces y tipos
│   ├── models/             # Modelos de dominio
│   ├── validator/          # Validador principal
│   └── index.ts            # Punto de entrada
├── data/
│   └── gastos_historicos.csv
├── jest.config.js
├── tsconfig.json
└── package.json
```

## 🔧 Reglas de Validación

### 1. Regla de Antigüedad

- **≤ 30 días**: APROBADO
- **31-60 días**: PENDIENTE (requiere revisión)
- **> 60 días**: RECHAZADO

### 2. Regla de Límite Food

- **≤ 100 USD**: APROBADO
- **100-150 USD**: PENDIENTE (requiere revisión)
- **> 150 USD**: RECHAZADO

*Nota: Los montos se convierten automáticamente a USD antes de comparar*

### 3. Regla de Centro de Costo

- **core_engineering + food**: RECHAZADO (prohibido)

### Resolución de Estado Final

1. Si cualquier regla es **RECHAZADO** → Estado final: **RECHAZADO**
2. Si ninguna es RECHAZADO y al menos una es **PENDIENTE** → Estado final: **PENDIENTE**
3. Si ninguna es RECHAZADO ni PENDIENTE y al menos una es **APROBADO** → Estado final: **APROBADO**
4. Si no aplica ninguna regla → Estado final: **PENDIENTE** (por defecto)

## 🔍 Detección de Anomalías

El sistema detecta automáticamente:

1. **Duplicados Exactos**: Gastos con mismo monto, moneda y fecha
2. **Montos Negativos**: Gastos con valores negativos

## ⚡ Optimización de API

El sistema implementa un caché inteligente para evitar el problema N+1:

- **Antes**: 100 gastos con la misma fecha = 100 llamadas HTTP
- **Ahora**: 100 gastos con la misma fecha = 1 llamada HTTP (la primera vez)

El caché almacena la respuesta completa de la API por fecha, permitiendo reutilizar las tasas para múltiples gastos.

## 📊 Ejemplo de Salida

```
🔍 Analizando gastos históricos...

📊 Resultados del análisis:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Aprobados:    0
⏳ Pendientes:   0
❌ Rechazados:   50
🔴 Anomalías:    12
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Resultados estructurados por gasto:

1. Gasto g_001 - ❌ RECHAZADO
   Alertas:
      • [LIMITE_ANTIGUEDAD] Gasto excede los 60 días.
...
```

## 🛠️ Tecnologías Utilizadas

- **TypeScript**: Lenguaje principal
- **Node.js**: Runtime
- **Jest**: Framework de testing
- **ts-jest**: Transpilador para Jest
- **node-fetch**: Cliente HTTP para llamadas a API

## 📝 Licencia

ISC

## 👤 Autor

Desarrollado como parte de una prueba técnica.
