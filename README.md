# Sistema de Gestión para la Cooperadora Escolar — Escuela Normal Superior Dalmacio Vélez Sársfield

Aplicación web Full Stack para la **Asociación Cooperadora de la Escuela Normal Superior Dalmacio Vélez Sársfield**, desarrollada con arquitectura moderna en **React 18 + Vite** y especificación de **API REST Backend en Node.js/Express + PostgreSQL / MySQL**.

---

## 🏛️ Requerimientos y Módulos Implementados

### 1. Branding e Identidad Institucional
- Denominación oficial actualizada en toda la interfaz (navbar, títulos, modales, tabla de cuotas, libro diario, membretes oficiales de recibos y exportación PDF/CSV): **"Escuela Normal Superior Dalmacio Vélez Sársfield"**.
- Identidad visual con escudo oficial, CUIT `30-71234567-9` y ciclo lectivo activo.

### 2. Módulo de Autenticación, Roles y Navegación (RBAC & JWT)
- **Autenticación con Tokens JWT Seguros**: Emisión de tokens de sesión con firma criptográfica y vigencia de 8 horas (`authService` / `sessionStorage`).
- **Credenciales Individuales por Usuario**:
  - **Secretaría**: `secretaria@ensdvs.edu.ar` (Usuario: `secretaria` • Clave: `Secre2026*DVS` o rápida `123`)
  - **Tesorería**: `tesoreria@ensdvs.edu.ar` (Usuario: `tesorero` • Clave: `Teso2026*DVS` o rápida `123`)
  - **Administrador**: `admin@ensdvs.edu.ar` (Usuario: `admin` • Clave: `Admin2026*DVS` o rápida `123`)
  - **Padre / Tutor**: `carlos.gomez@gmail.com` (Usuario: `tutor` • Clave: `Tutor2026*DVS` o rápida `123`)
- **Navegación Limpia y Visualización Condicional**:
  - Pestañas principales filtradas estrictamente según los permisos del rol activo (RBAC).
  - Menú colapsable desplegable de **Herramientas del Sistema** (Backups JSON, Restauración, CSV Excel, selector rápido de perfiles de prueba y reinicio demo) para no sobrecargar la vista principal.

### 3. Módulo de Tesorería: Ajuste de Cuotas y Auditoría Obligatoria
- **Modificación de Cuotas**: Posibilidad de reajustar aranceles de cuotas de forma **individual** por alumno o de forma **general / masiva** para cuotas pendientes.
- **Motivo de Ajuste Obligatorio**: Validación estricta del campo `motivo_ajuste` (justificación) antes de aplicar cualquier cambio de monto.
- **Trazabilidad y Bitácora Inmutable**: Registro automático de fecha, hora, usuario responsable, monto anterior, monto nuevo y motivo tanto en la entidad cuota (`historialAjustes`) como en la tabla global de auditoría fiscal (`auditLogs`).
- **Filtros Avanzados Predictivos**: Buscador predictivo en tiempo real por estudiante (nombre, apellido o DNI) en el Libro Diario de Cobros y en la Gestión de Cuentas Corrientes.

### 4. Módulo de Secretaría: Cobranzas y Comprobantes
- **Registro de Transferencias Bancarias**: Al asentar un pago con medio `Transferencia`, se habilita la subida de archivo digital de comprobante (formatos soportados: **JPG, PNG, PDF** con límite de 8 MB).
- **Almacenamiento Seguro y Persistente**: Vinculación del comprobante digital (metadatos, MIME type, tamaño y DataURL) al objeto del pago.
- **Previsualizador y Descarga de Comprobantes**: Componente modal [`ComprobanteAdjuntoModal`](src/components/ComprobanteAdjuntoModal.jsx) interactivo con visor embebido de documentos PDF y visor de imágenes con descarga directa de archivos con su nombre original.

---

## 🚀 Cómo ejecutar el proyecto localmente

### Frontend (React + Vite)
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Compilar para producción
npm run build
```

### Backend (Node.js + Express + SQL)
```bash
cd backend
npm install
npm start
```
El esquema relacional de base de datos se encuentra documentado en [`backend/schema.sql`](backend/schema.sql).
