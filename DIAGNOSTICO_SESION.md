# Diagnóstico y Solución para Problemas de Sesión

## Problema Identificado

El sitio pierde la vista de los datos de Supabase después de recargar la página, específicamente:
- No muestra log de usuario
- No muestra vista de cliente
- No carga datos de la tabla masajes

## Cambios Implementados

### 1. **Configuración Unificada de Supabase**
- Unificado la configuración en `src/lib/supabase-config.ts`
- Mejorado el manejo de persistencia de sesión
- Agregado logging detallado para debug

### 2. **Mejoras en el Hook de Autenticación**
- Agregado logging extensivo en `src/hooks/useAuth.ts`
- Mejorado el manejo de cambios de estado de autenticación
- Mejor gestión de errores

### 3. **Función ensureValidSession Mejorada**
- Agregado logging detallado en `src/utils/supabase/client.ts`
- Mejor manejo de refresco de tokens
- Verificación de expiración de sesión

### 4. **Panel de Debug**
- Agregado `DebugPanel` componente para monitoreo en tiempo real
- Disponible en todas las páginas (botón 🐛 en la esquina inferior derecha)
- Muestra estado de sesión, autenticación y localStorage

### 5. **Página de Prueba**
- Creada página `/test-connection` para verificar conectividad
- Prueba específica de carga de datos de masajes
- Diagnóstico completo del estado de la aplicación

## Instrucciones para Diagnosticar

### 1. **Verificar Variables de Entorno**
Asegúrate de que las siguientes variables estén configuradas:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
```

### 2. **Usar el Panel de Debug**
1. Abre la aplicación en el navegador
2. Busca el botón 🐛 en la esquina inferior derecha
3. Haz clic para abrir el panel de debug
4. Verifica:
   - **Session**: Debe mostrar información de sesión válida
   - **Auth State**: Debe mostrar usuario autenticado
   - **LocalStorage**: Debe contener tokens de Supabase

### 3. **Revisar Console del Navegador**
Abre las herramientas de desarrollador (F12) y revisa la consola para ver:
- Logs de `useAuth`
- Logs de `ensureValidSession`
- Logs de `getSessionClient`
- Logs de `getUserDetailsClient`
- Logs de las páginas (`HomePage`, `ProductosPage`)

### 4. **Probar la Página de Test**
Navega a `/test-connection` para:
- Verificar conectividad con Supabase
- Probar carga de datos de masajes
- Ver estado completo de la aplicación

## Posibles Causas del Problema

### 1. **Variables de Entorno**
- Variables de entorno no configuradas
- Variables de entorno incorrectas
- Variables de entorno no disponibles en el cliente

### 2. **Políticas de Seguridad de Supabase**
- Políticas RLS (Row Level Security) muy restrictivas
- Falta de permisos para usuarios anónimos
- Configuración incorrecta de políticas

### 3. **Problemas de Cookies/Session Storage**
- Cookies bloqueadas por el navegador
- Problemas con el almacenamiento local
- Configuración incorrecta del middleware

### 4. **Problemas de Red**
- Problemas de conectividad con Supabase
- Timeouts en las consultas
- Errores de CORS

## Soluciones Específicas

### 1. **Si las Variables de Entorno no están configuradas**
```bash
# Crear archivo .env.local en la raíz del proyecto
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
```

### 2. **Si hay problemas con las Políticas de Supabase**
Verificar que la tabla `masajes` tenga políticas que permitan lectura:
```sql
-- Política para permitir lectura de masajes a todos los usuarios
CREATE POLICY "Allow public read access" ON masajes
FOR SELECT USING (true);
```

### 3. **Si hay problemas de Cookies**
Verificar configuración del middleware en `src/utils/supabase/middleware.ts`

### 4. **Si hay problemas de Red**
- Verificar conectividad a Supabase
- Revisar logs de errores en la consola
- Probar con diferentes navegadores

## Comandos para Debug

### 1. **Limpiar Cache y Reconstruir**
```bash
# Limpiar cache de Next.js
rm -rf .next
npm run build
npm run dev
```

### 2. **Verificar Variables de Entorno**
```bash
# Verificar que las variables estén disponibles
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. **Probar Conectividad**
```bash
# Probar conectividad a Supabase
curl -I https://tu-proyecto.supabase.co
```

## Logs Esperados

### **Logs Normales (Sesión Válida)**
```
useAuth: Checking user session...
ensureValidSession: Starting session check...
ensureValidSession: Initial session check: exists
ensureValidSession: Session is valid
getSessionClient: Starting...
getSessionClient - Session: Existe
getUserDetailsClient: Starting...
getUserDetailsClient: Fetching user details for ID: xxx
getUserDetailsClient - Detalles del usuario: {...}
useAuth: User set successfully
```

### **Logs de Error (Sesión Inválida)**
```
useAuth: Checking user session...
ensureValidSession: Starting session check...
ensureValidSession: Initial session check: null
useAuth: No session found
```

## Próximos Pasos

1. **Ejecutar la aplicación** con los cambios implementados
2. **Revisar el panel de debug** para identificar el problema específico
3. **Revisar la consola del navegador** para ver los logs detallados
4. **Probar la página de test** en `/test-connection`
5. **Verificar las variables de entorno** están correctamente configuradas
6. **Revisar las políticas de Supabase** si es necesario

## Contacto para Soporte

Si el problema persiste después de implementar estos cambios, proporciona:
- Capturas de pantalla del panel de debug
- Logs de la consola del navegador
- Resultado de la página de test
- Configuración de variables de entorno (sin valores sensibles) 