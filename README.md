# Sistema de Gestión para la Cooperadora Escolar — E.E.S. N° 14 (Frontend React)

Aplicación web **Frontend en React + Vite** desarrollada a partir del Estudio Integral de Ingeniería de Software (**Módulos 1 al 4**, Diagramas de Clases UML, Diagrama Entidad-Relación DER y los 4 Diagramas de Casos de Uso).

---

## 🚀 Cómo ejecutar el proyecto localmente

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Compilar para producción:
   ```bash
   npm run build
   ```

---

## 🏗️ Arquitectura del Frontend (Preparada para conectar con Backend)

Siguiendo la división de tareas del equipo, este repositorio contiene **únicamente el Frontend en React**, desacoplado de la base de datos mediante una capa de servicios lista para conectarse a una API REST:

- [`src/services/cooperadoraApi.js`](src/services/cooperadoraApi.js): Capa de servicio y contrato de endpoints REST (`API_ENDPOINTS_CONTRACT`). Actualmente persiste en `localStorage` para permitir pruebas completas sin servidor, y documenta cada ruta (`GET`, `POST`, `PUT`, `PATCH`) para que el desarrollador Backend solo deba reemplazar las funciones por llamadas `fetch` o `axios`.
- [`src/data/mockData.js`](src/data/mockData.js): Semilla de datos iniciales coherente con los diagramas (`Cooperadora`, `Tesoreria`, `Tutores/Socios`, `Alumnos`, `Cuotas`, `Pagos/Comprobantes`, `Usuarios` de los 4 roles y `ESTUDIO_PROYECTO` con los Módulos 1 a 4).
- [`src/context/CooperadoraContext.jsx`](src/context/CooperadoraContext.jsx): Implementación de todos los métodos de los Diagramas de Clases (`registrarCobro`, `registrarAlumno`, `guardarTutor`/`actualizarDatos`, `registrarNuevaCuota`/`gestionarCuotas`, `modificarPago`, `anularPago`, `validarPagoTesoreria`, `registrarEgresoTesoreria`, `cerrarPeriodoTesoreria`, `exportBackupJSON`, `exportPadronCSV`).

---

## 👥 Los 4 Roles Interactivos (Casos de Uso UML)

1. **Secretaría (`DIAGRAMA DE USOS-ROL SECRETARIA.drawio`)**:
   - Registrar Alumno (`RF-01`, `HU-01`) y asociar Padre/Tutor (`RF-02`).
   - Registrar Cuota / Gestionar cargos (`RF-03`).
   - Consultar Estado de Cuenta (`RF-06`, `HU-03`).
   - Registrar Pago (`Efectivo` / `Transferencia`, `RF-04`, `HU-02`) con cálculo automático del **20% de descuento por hermanos (`RF-05`)** y opción de `calcularRecargo()`.
   - Emitir e imprimir Comprobante de Pago numerado con el escudo oficial de la E.E.S. N° 14 (`RF-07`, `HU-04`).
2. **Tesorero (`DIAGRAMA DE USOS-ROL TESORERO`)**:
   - Validar pagos (`Tesorero.validarPago()`).
   - Modificar pagos con motivo obligatorio (`RF-10`, `HU-05`).
   - Anular pagos revirtiendo cuotas a estado pendiente (`RF-10`, `HU-06`, `Pago.anular()`).
   - Registrar egresos de caja y ejecutar el cierre contable del período (`Tesoreria.calcularSaldo()`, `Tesoreria.cerrarPeriodo()`).
   - Auditar la bitácora inmutable de eventos (`RNF-02`).
3. **Director (`DIAGRAMA DE USOS-ROL DIRECTOR.drawio`)**:
   - Acceso de solo lectura gerencial (`RF-09`) al tablero de reportes financieros, morosidad y recaudación por período (`RF-08`, `HU-09`).
4. **Padre / Tutor (`Diagrama de Caso de Uso PADRE / TUTOR`)**:
   - Portal de autogestión familiar para consultar el estado de cuenta de sus hijos (`Socio.consultarEstadoCuenta()`) y **Obtener Comprobante de Pago** (`HU-08`).
