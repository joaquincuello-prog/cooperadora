/**
 * CAPA DE SERVICIO Y CONTRATO DE API (FRONTEND <-> BACKEND)
 * ==========================================================
 * Esta capa desacopla los componentes React del origen de datos.
 * 
 * Para el desarrollador Backend:
 * Basta con cambiar `USE_REMOTE_API = true` y configurar `API_BASE_URL`
 * para que todas las operaciones consuman el servidor REST sin tocar
 * ningún componente visual de React.
 *
 * Endpoints esperados en el Backend según el DER (diagramaentidadrelacioncooperadora.drawio):
 * - POST   /api/auth/login            -> Usuario.iniciarSesion()
 * - GET    /api/cooperadora           -> Datos institucionales + Tesorería
 * - GET    /api/socios                -> Listar Tutores/Socios
 * - POST   /api/socios                -> Cooperadora.registrarSocio() / Secretaria.registrarTutor()
 * - PUT    /api/socios/:id            -> Socio.actualizarDatos()
 * - GET    /api/alumnos               -> Listar Alumnos
 * - POST   /api/alumnos               -> Secretaria.registrarAlumno()
 * - PUT    /api/alumnos/:id           -> Actualizar Alumno
 * - GET    /api/cuotas?alumnoId=:id   -> Socio.consultarEstadoCuenta()
 * - POST   /api/cuotas                -> Secretaria.gestionarCuotas()
 * - POST   /api/pagos                 -> Pago.registrar() + Comprobante.emitir()
 * - PUT    /api/pagos/:id             -> Tesorero: Modificar pago (RF-10, HU-05)
 * - PATCH  /api/pagos/:id/validar     -> Tesorero.validarPago()
 * - PATCH  /api/pagos/:id/anular      -> Pago.anular() (RF-10, HU-06)
 * - POST   /api/tesoreria/egresos     -> Registrar gasto de cooperadora
 * - POST   /api/tesoreria/cerrar      -> Tesoreria.cerrarPeriodo()
 */

import { getInitialMockData } from '../data/mockData';

export const API_CONFIG = {
  USE_REMOTE_API: false,
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  STORAGE_KEY: 'cooperadora_escolar_react_v1'
};

export const API_ENDPOINTS_CONTRACT = [
  {
    method: 'POST',
    path: '/api/auth/login',
    description: 'Usuario.iniciarSesion() — Autenticación por rol (RNF-01, RF-09)',
    roles: 'Secretaría, Tesorero, Director, Padre/Tutor'
  },
  {
    method: 'GET',
    path: '/api/cooperadora',
    description: 'Obtiene datos institucionales de Cooperadora y estado de Tesorería',
    roles: 'Todos los roles autenticados'
  },
  {
    method: 'GET',
    path: '/api/socios',
    description: 'Lista el padrón completo de Socios / Padres o Tutores (RF-02)',
    roles: 'Secretaría, Tesorero, Director'
  },
  {
    method: 'POST',
    path: '/api/socios',
    description: 'Cooperadora.registrarSocio() / Secretaria.registrarTutor()',
    roles: 'Secretaría, Tesorero'
  },
  {
    method: 'PUT',
    path: '/api/socios/:id',
    description: 'Socio.actualizarDatos() — Actualiza teléfono, email o estado del socio',
    roles: 'Secretaría, Tesorero'
  },
  {
    method: 'GET',
    path: '/api/alumnos',
    description: 'Lista la nómina de alumnos matriculados y su vínculo con Tutor',
    roles: 'Secretaría, Tesorero, Director'
  },
  {
    method: 'POST',
    path: '/api/alumnos',
    description: 'Secretaria.registrarAlumno() — Alta de alumno y generación de 10 cuotas (HU-01)',
    roles: 'Secretaría, Tesorero'
  },
  {
    method: 'GET',
    path: '/api/cuotas?alumnoId=:id',
    description: 'Socio.consultarEstadoCuenta() — Estado de cuotas del alumno (RF-06, HU-03)',
    roles: 'Secretaría, Tesorero, Padre/Tutor'
  },
  {
    method: 'POST',
    path: '/api/cuotas',
    description: 'Secretaria.gestionarCuotas() / Cuota.gestionar() — Registra nueva cuota (RF-03)',
    roles: 'Secretaría, Tesorero'
  },
  {
    method: 'POST',
    path: '/api/pagos',
    description: 'Pago.registrar() + Comprobante.emitir() con 20% desc. hermanos (RF-04, RF-05, RF-07)',
    roles: 'Secretaría, Tesorero'
  },
  {
    method: 'PUT',
    path: '/api/pagos/:id',
    description: 'Modificar pago registrado con motivo obligatorio en auditoría (RF-10, HU-05)',
    roles: 'Exclusivo Tesorero'
  },
  {
    method: 'PATCH',
    path: '/api/pagos/:id/validar',
    description: 'Tesorero.validarPago() — Visado y conciliación de recibo en Tesorería',
    roles: 'Exclusivo Tesorero'
  },
  {
    method: 'PATCH',
    path: '/api/pagos/:id/anular',
    description: 'Pago.anular() — Anula recibo y revierte cuotas a Pendiente (RF-10, HU-06)',
    roles: 'Exclusivo Tesorero'
  },
  {
    method: 'POST',
    path: '/api/tesoreria/egresos',
    description: 'Registra un gasto/egreso en la tabla TESORERIA',
    roles: 'Exclusivo Tesorero'
  },
  {
    method: 'POST',
    path: '/api/tesoreria/cerrar',
    description: 'Tesoreria.cerrarPeriodo() + calcularSaldo() — Consolida el balance mensual',
    roles: 'Exclusivo Tesorero'
  }
];

export const cooperadoraApi = {
  loadState() {
    const saved = localStorage.getItem(API_CONFIG.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Asegurar compatibilidad si faltan claves nuevas
        const initial = getInitialMockData();
        return {
          ...initial,
          ...parsed,
          cooperadora: { ...initial.cooperadora, ...(parsed.cooperadora || {}) },
          tesoreria: { ...initial.tesoreria, ...(parsed.tesoreria || {}) }
        };
      } catch (e) {
        console.error('Error parseando estado local, usando mock inicial:', e);
        return getInitialMockData();
      }
    }
    const initial = getInitialMockData();
    this.saveState(initial);
    return initial;
  },

  saveState(state) {
    localStorage.setItem(API_CONFIG.STORAGE_KEY, JSON.stringify(state));
  },

  resetState() {
    const initial = getInitialMockData();
    this.saveState(initial);
    return initial;
  }
};
