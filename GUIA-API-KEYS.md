# 🔑 Guía para Obtener API Keys

Esta guía te ayudará a obtener todas las claves necesarias para que la aplicación funcione completamente.

## 1. Google OAuth (Login con Google)

### Paso 1: Ir a Google Cloud Console
1. Ve a: https://console.cloud.google.com/
2. Inicia sesión con tu cuenta de Google

### Paso 2: Crear un nuevo proyecto
1. Haz clic en el selector de proyectos (arriba a la izquierda)
2. Clic en "Nuevo Proyecto"
3. Nombre: "Sistema Climatización" (o el que prefieras)
4. Clic en "Crear"

### Paso 3: Habilitar la API de Google+
1. Ve a "APIs y Servicios" → "Biblioteca"
2. Busca "Google+ API"
3. Clic en "Habilitar"

### Paso 4: Crear credenciales OAuth
1. Ve a "APIs y Servicios" → "Credenciales"
2. Clic en "Crear credenciales" → "ID de cliente de OAuth 2.0"
3. Si te pide configurar la pantalla de consentimiento:
   - Tipo: Externo
   - Nombre de la app: "Sistema Climatización"
   - Correo de soporte: tu correo
   - Guardar y continuar
4. En "Tipo de aplicación": Selecciona "Aplicación web"
5. Nombre: "Cliente Web"
6. URIs de redirección autorizados:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
7. Orígenes de JavaScript autorizados:
   ```
   http://localhost:5173
   http://localhost:3000
   ```
8. Clic en "Crear"

### Paso 5: Copiar las credenciales
- **ID de cliente**: Copia este valor → va en `GOOGLE_CLIENT_ID`
- **Secreto del cliente**: Copia este valor → va en `GOOGLE_CLIENT_SECRET`

### Configurar en tu proyecto:
```env
# backend/.env
GOOGLE_CLIENT_ID="tu-id-de-cliente.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-secreto-del-cliente"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"

# frontend/.env
VITE_GOOGLE_CLIENT_ID="tu-id-de-cliente.apps.googleusercontent.com"
```

---

## 2. OpenWeather API (API del Clima)

### Paso 1: Crear cuenta
1. Ve a: https://openweathermap.org/
2. Clic en "Sign Up" (arriba a la derecha)
3. Completa el formulario de registro
4. Verifica tu correo electrónico

### Paso 2: Obtener API Key
1. Inicia sesión
2. Ve a tu perfil → "API keys"
3. Copia la "Default API key" (ya viene creada)
4. O crea una nueva con el nombre "Climatización App"

### Paso 3: Probar la API
Espera unos 10-15 minutos después de crear la cuenta (activación de la key).

Prueba en el navegador:
```
https://api.openweathermap.org/data/2.5/weather?q=Santiago,cl&appid=TU_API_KEY&units=metric&lang=es
```

### Configurar en tu proyecto:
```env
# backend/.env
OPENWEATHER_API_KEY="tu_api_key_aqui"
```

**Nota**: La versión gratuita permite:
- 1,000 llamadas por día
- Datos actuales del clima
- Pronóstico de 5 días

---

## 3. OpenAI API (Inteligencia Artificial)

### Opción A: OpenAI (Recomendada)

#### Paso 1: Crear cuenta
1. Ve a: https://platform.openai.com/
2. Clic en "Sign up"
3. Completa el registro

#### Paso 2: Agregar método de pago
⚠️ **Importante**: OpenAI requiere un método de pago, pero ofrece $5 de crédito gratis para nuevos usuarios.

1. Ve a "Settings" → "Billing"
2. Agrega una tarjeta de crédito
3. Los primeros $5 son gratis (suficiente para el proyecto)

#### Paso 3: Crear API Key
1. Ve a "API keys" en el menú lateral
2. Clic en "Create new secret key"
3. Nombre: "Climatización App"
4. **¡IMPORTANTE!** Copia la key inmediatamente (solo se muestra una vez)

#### Paso 4: Configurar límites de gasto (opcional pero recomendado)
1. Ve a "Settings" → "Billing" → "Usage limits"
2. Establece un límite mensual (ej: $5 USD)
3. Activa alertas por email

#### Configurar en tu proyecto:
```env
# backend/.env
OPENAI_API_KEY="sk-proj-..."
```

**Costos aproximados**:
- GPT-3.5-turbo: ~$0.002 por 1,000 tokens
- Para este proyecto: menos de $1 USD en total

---

### Opción B: Google Gemini (Alternativa Gratuita)

Si prefieres no usar tarjeta de crédito, puedes usar Gemini de Google:

#### Paso 1: Crear cuenta
1. Ve a: https://makersuite.google.com/app/apikey
2. Inicia sesión con tu cuenta de Google

#### Paso 2: Obtener API Key
1. Clic en "Get API Key"
2. Selecciona un proyecto o crea uno nuevo
3. Copia la API Key

#### Configurar en tu proyecto:
```env
# backend/.env
GEMINI_API_KEY="tu_api_key_de_gemini"
```

**Ventajas de Gemini**:
- ✅ Totalmente gratuito
- ✅ 60 solicitudes por minuto
- ✅ No requiere tarjeta de crédito

**Nota**: Si usas Gemini, tendrás que modificar ligeramente el código de integración (te ayudo cuando llegues a ese paso).

---

## 4. JWT Secret (Autenticación Local)

Este no necesita registro, simplemente genera una cadena aleatoria segura.

### Opción 1: Generar online
1. Ve a: https://randomkeygen.com/
2. Copia alguna de las "Fort Knox Passwords"

### Opción 2: Generar en terminal
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Configurar en tu proyecto:
```env
# backend/.env
JWT_SECRET="tu_cadena_super_secreta_aleatoria_aqui"
```

---

## 📋 Checklist Final de API Keys

Antes de continuar al Día 2, asegúrate de tener:

- [ ] ✅ `GOOGLE_CLIENT_ID` (OAuth)
- [ ] ✅ `GOOGLE_CLIENT_SECRET` (OAuth)
- [ ] ✅ `OPENWEATHER_API_KEY` (API del clima)
- [ ] ✅ `OPENAI_API_KEY` o `GEMINI_API_KEY` (IA)
- [ ] ✅ `JWT_SECRET` (generado aleatoriamente)

---

## 🔒 Seguridad

### ⚠️ NUNCA hagas lo siguiente:

1. ❌ Subir archivos `.env` a GitHub
2. ❌ Compartir tus API keys públicamente
3. ❌ Hardcodear las keys en el código

### ✅ Buenas prácticas:

1. ✅ Usa archivos `.env` (ya están en .gitignore)
2. ✅ Comparte solo `.env.example` sin valores reales
3. ✅ Regenera keys si accidentalmente las expones
4. ✅ Usa variables de entorno en producción

---

## 🆘 Problemas Comunes

### "Invalid API key" en OpenWeather
- Espera 10-15 minutos después de crear la cuenta
- Verifica que copiaste la key completa

### "Insufficient quota" en OpenAI
- Verifica que tengas crédito disponible
- Revisa los límites de uso en tu cuenta

### "Invalid client" en Google OAuth
- Verifica las URIs de redirección
- Asegúrate de haber habilitado la API de Google+

---

## 💡 Consejos

1. **Guarda tus keys en un lugar seguro** (gestor de contraseñas)
2. **Haz backup de tus .env** (pero no en Git)
3. **Activa alertas de uso** en OpenAI si la usas
4. **Empieza con Gemini** si no quieres usar tarjeta

---

## 🚀 ¿Listo?

Una vez que tengas todas las API keys configuradas en tus archivos `.env`, estarás listo para continuar con el **Día 2**: Backend Development.
