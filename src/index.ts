import "dotenv/config";

import * as path from "path";
import * as fs from "fs";
import { AnalizadorLoteGastos } from "./lote/AnalizadorLoteGastos";
import { ValidadorGastos } from "./validador/ValidadorGastos";
import { ReglaLimiteCategoriaComida } from "./aplicacion/reglas/ReglaLimiteCategoriaComida";
import { ReglaCentroCostoComida } from "./aplicacion/reglas/ReglaCentroCostoComida";
import { ReglaAntiguedadGasto } from "./aplicacion/reglas/ReglaAntiguedadGasto";
import { EstadoValidacion } from "./modelos/EstadoValidacion";
import { ClienteTasaCambio } from "./infraestructura/tasa_cambio/ClienteTasaCambio";
import { ClienteTasaCambioMock } from "./infraestructura/tasa_cambio/ClienteTasaCambioMock";

// Obtener API key de variables de entorno desde .env
const apiKey = process.env.OPENEXCHANGERATES_API_KEY;
const usarMock = process.env.USE_MOCK === "true";
const cacheHabilitado = process.env.USE_CACHE !== "false"; // Por defecto true, se desactiva con "false"

// Validar que exista la API key si no se usa mock
if (!usarMock && !apiKey) {
  console.error("❌ Error: OPENEXCHANGERATES_API_KEY no está definida en el archivo .env");
  console.error("   Por favor, agrega tu API key en el archivo .env o establece USE_MOCK=true");
  process.exit(1);
}

// Crear cliente de tasas de cambio (real o mock)
const clienteTasaCambio = usarMock
  ? new ClienteTasaCambioMock()
  : new ClienteTasaCambio(apiKey!, cacheHabilitado);

if (usarMock) {
  console.log("⚠️  Usando ClienteTasaCambioMock (sin llamadas a API real)\n");
} else {
  const estadoCache = cacheHabilitado ? "habilitado" : "deshabilitado";
  console.log(`✅ Usando ClienteTasaCambio con API real de Open Exchange Rates (caché: ${estadoCache})\n`);
}

// Inicializar las reglas
const reglas = [
  new ReglaLimiteCategoriaComida(),
  new ReglaCentroCostoComida(),
  new ReglaAntiguedadGasto(),
];

// Crear el validador con las reglas y contexto
const validador = new ValidadorGastos(reglas, {
  clienteTasaCambio,
  monedaBase: "USD",
});

// Crear el analizador de lote
const analizador = new AnalizadorLoteGastos(validador);

// Ruta al archivo CSV
const rutaArchivoCSV = path.join(__dirname, "..", "data", "gastos_historicos.csv");

// Ejecutar el análisis
async function main() {
  console.log("🔍 Analizando gastos históricos...\n");
  const resultado = await analizador.analizar(rutaArchivoCSV);

  // Mostrar resultados
  console.log("📊 Resultados del análisis:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Aprobados:    ${resultado.aprobados}`);
  console.log(`⏳ Pendientes:   ${resultado.pendientes}`);
  console.log(`❌ Rechazados:   ${resultado.rechazados}`);
  console.log(`🔴 Anomalías:    ${resultado.anomalias.length}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Mostrar resultados estructurados por gasto
  console.log("📋 Resultados estructurados por gasto:\n");
  resultado.resultados.forEach((resultadoValidacion, index) => {
    const emojiEstado = 
      resultadoValidacion.estado === EstadoValidacion.APROBADO ? "✅" :
      resultadoValidacion.estado === EstadoValidacion.PENDIENTE ? "⏳" : "❌";
    
    console.log(`${index + 1}. Gasto ${resultadoValidacion.gastoId} - ${emojiEstado} ${resultadoValidacion.estado}`);
    
    if (resultadoValidacion.alertas.length > 0) {
      console.log("   Alertas:");
      resultadoValidacion.alertas.forEach(alerta => {
        console.log(`      • [${alerta.codigo}] ${alerta.mensaje}`);
      });
    } else {
      console.log("   Sin alertas");
    }
    console.log();
  });

  // Mostrar anomalías si hay
  if (resultado.anomalias.length > 0) {
    console.log("⚠️  Resumen de anomalías:");
    resultado.anomalias.forEach((anomalia, index) => {
      console.log(`   ${index + 1}. ${anomalia}`);
    });
    console.log();
  }

  console.log("✅ Análisis completado!");

  // Guardar resultados en archivo JSON
  const directorioResultados = path.join(__dirname, "..", "results");
  
  // Crear carpeta results si no existe
  if (!fs.existsSync(directorioResultados)) {
    fs.mkdirSync(directorioResultados, { recursive: true });
  }

  // Generar nombre de archivo con timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const archivoSalida = path.join(directorioResultados, `analisis_${timestamp}.json`);

  // Preparar datos para JSON
  const salidaJSON = {
    fechaAnalisis: new Date().toISOString(),
    resumen: {
      aprobados: resultado.aprobados,
      pendientes: resultado.pendientes,
      rechazados: resultado.rechazados,
      totalGastos: resultado.resultados.length,
      totalAnomalias: resultado.anomalias.length,
    },
    resultados: resultado.resultados.map(r => ({
      gastoId: r.gastoId,
      estado: r.estado,
      alertas: r.alertas,
    })),
    anomalias: resultado.anomalias,
    estadisticas: {
      porEstado: {
        aprobados: resultado.aprobados,
        pendientes: resultado.pendientes,
        rechazados: resultado.rechazados,
      },
      porTipoAnomalia: {
        duplicados: resultado.anomalias.filter(a => a.includes("Duplicado")).length,
        montosNegativos: resultado.anomalias.filter(a => a.includes("Monto negativo")).length,
      },
    },
  };

  // Guardar archivo JSON
  fs.writeFileSync(archivoSalida, JSON.stringify(salidaJSON, null, 2), "utf-8");
  console.log(`\n💾 Resultados guardados en: ${archivoSalida}`);
}

main().catch(console.error);
