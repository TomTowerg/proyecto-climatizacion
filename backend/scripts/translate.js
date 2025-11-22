/* UBICACIÓN: backend/scripts/translate.js
  USO: Desde la terminal de 'backend', ejecutar: node scripts/translate.js
*/

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileURLToPath } from 'url';

// 1. Configuración de Entorno (Busca el .env en la raíz de backend)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') }); 

// 2. CONFIGURACIÓN DE RUTAS (AJUSTADO)
// Antes: '../frontend...' 
// Ahora: '../../frontend...' (Salir de scripts, salir de backend, entrar a frontend)
const LOCALES_PATH = path.join(__dirname, '../../frontend/src/i18n/locales');
const SOURCE_LANG = 'es';
const TARGET_LANGS = ['en']; // Agrega 'pt', 'fr', 'de' aquí

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- (El resto de las funciones auxiliares se mantienen igual) ---

// Función para aplanar objetos JSON
const flattenObject = (obj, prefix = '') => {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k]))
      Object.assign(acc, flattenObject(obj[k], pre + k));
    else
      acc[pre + k] = obj[k];
    return acc;
  }, {});
};

// Función para des-aplanar
const unflattenObject = (data) => {
    const result = {};
    for (const i in data) {
        const keys = i.split('.');
        keys.reduce((acc, value, index) => {
            return acc[value] || (acc[value] = (isNaN(Number(keys[index + 1])) ? (keys.length - 1 === index ? data[i] : {}) : []));
        }, result);
    }
    return result;
};

async function translateMissingKeys(targetLang) {
    console.log(`\n🤖 Analizando traducciones para: ${targetLang.toUpperCase()}...`);
    console.log(`📁 Buscando en: ${LOCALES_PATH}`); // Log extra para verificar ruta
    
    const sourcePath = path.join(LOCALES_PATH, `${SOURCE_LANG}.json`);
    const targetPath = path.join(LOCALES_PATH, `${targetLang}.json`);

    // Verificar si existe el archivo fuente
    if (!fs.existsSync(sourcePath)) {
        console.error(`❌ No se encuentra el archivo base: ${sourcePath}`);
        console.error("Asegúrate de estar ejecutando esto desde la carpeta 'backend'");
        return;
    }

    const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    let targetData = {};
    
    if (fs.existsSync(targetPath)) {
        targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    }

    const flatSource = flattenObject(sourceData);
    const flatTarget = flattenObject(targetData);
    
    const missingKeys = {};
    let missingCount = 0;

    for (const key in flatSource) {
        if (!flatTarget.hasOwnProperty(key)) {
            missingKeys[key] = flatSource[key];
            missingCount++;
        }
    }

    if (missingCount === 0) {
        console.log(`✅ Todo actualizado para ${targetLang}.`);
        return;
    }

    console.log(`📝 Se encontraron ${missingCount} textos sin traducir.`);
    console.log(`🔄 Consultando a Gemini AI...`);

    const prompt = `
    Actúa como un experto traductor técnico de software de climatización (HVAC).
    Tu tarea es traducir el siguiente objeto JSON del Español (${SOURCE_LANG}) al Inglés (${targetLang}).
    
    REGLAS:
    1. Mantén estrictamente la estructura del JSON (claves).
    2. Usa terminología técnica precisa (ej: "Cotización" -> "Quote", "RUT" -> "National ID").
    3. Responde SOLO con el JSON válido.
    
    JSON A TRADUCIR:
    ${JSON.stringify(missingKeys, null, 2)}
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const translatedKeys = JSON.parse(text);
        const newFlatTarget = { ...flatTarget, ...translatedKeys };
        const newNestedTarget = unflattenObject(newFlatTarget);

        fs.writeFileSync(targetPath, JSON.stringify(newNestedTarget, null, 2));
        console.log(`✨ ${targetLang}.json actualizado exitosamente.`);

    } catch (error) {
        console.error(`❌ Error traduciendo a ${targetLang}:`, error.message);
    }
}

async function main() {
    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ Error: No se encontró GEMINI_API_KEY en las variables de entorno.");
        return;
    }
    for (const lang of TARGET_LANGS) {
        await translateMissingKeys(lang);
    }
}

main();