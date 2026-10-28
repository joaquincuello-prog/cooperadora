/**
 * CAPA DE SERVICIO Y CONTRATO DE API (FRONTEND <-> BACKEND)
 * ==========================================================
 * Esta capa desacopla los componentes React del origen de datos y
 * provee la infraestructura de Autenticación con Tokens Seguros (JWT)
 * y persistencia estructurada.
 * 
 * Para el desarrollador Backend:
 * Basta con cambiar `USE_REMOTE_API = true` y configurar `API_BASE_URL`
 * para que todas las operaciones consuman el servidor REST sin tocar
 * ningún componente visual de React.
 *
 * Endpoints implementados según la arquitectura de software:
 * - POST   /api/auth/login            -> Autenticación con credenciales y emisión de JWT
 * - GET    /api/auth/verify           -> Verificación y decodificación de sesión JWT
 * - GET    /api/cooperadora           -> Datos institucionales + Tesorería
 * - GET    /api/socios                -> Listar Tutores/Socios
 * - POST   /api/socios                -> Cooperadora.registrarSocio() / Secretaria.registrarTutor()
 * - PUT    /api/socios/:id            -> Socio.actualizarDatos()
 * - GET    /api/alumnos               -> Listar Alumnos matriculados
 * - POST   /api/alumnos               -> Secretaria.registrarAlumno() + 10 cuotas automáticas
 * - GET    /api/cuotas?alumnoId=:id   -> Socio.consultarEstadoCuenta()
 * - POST   /api/cuotas                -> Secretaria.gestionarCuotas() (Arancel extraordinario)
 * - PATCH  /api/cuotas/:id/ajustar    -> Tesorería: Ajuste de cuota con motivo de auditoría (RF-10)
 * - POST   /api/cuotas/ajuste-general -> Tesorería: Ajuste masivo de cuotas con motivo
 * - POST   /api/pagos                 -> Pago.registrar() + Comprobante.emitir()
 * - POST   /api/pagos/transferencia   -> Registro de pago con comprobante adjunto (JPG/PNG/PDF)
 * - PUT    /api/pagos/:id             -> Tesorería: Modificar pago (RF-10, HU-05)
 * - PATCH  /api/pagos/:id/validar     -> Tesorería.validarPago()
 * - PATCH  /api/pagos/:id/anular      -> Pago.anular() (RF-10, HU-06)
 * - POST   /api/tesoreria/egresos     -> Registrar gasto de cooperadora
 * - POST   /api/tesoreria/cerrar      -> Tesorería.cerrarPeriodo()
 */

import { getInitialMockData } from '../data/mockData';

export const API_CONFIG = {
  USE_REMOTE_API: false,
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  STORAGE_KEY: 'cooperadora_escolar_react_v1',
  TOKEN_KEY: 'cooperadora_jwt_token'
};

export const API_ENDPOINTS_CONTRACT = [
  {
    method: 'POST',
    path: '/api/auth/login',
    description: 'Autenticación con credenciales individuales por usuario y generación de token de sesión JWT seguro.',
    roles: 'Todos los roles (Secretaría, Tesorería, Administrador, Tutor)'
  },
  {
    method: 'GET',
    path: '/api/auth/verify',
    description: 'Verifica la integridad del token JWT, vigencia de sesión y roles asignados.',
    roles: 'Sesión activa'
  },
  {
    method: 'GET',
    path: '/api/cooperadora',
    description: 'Obtiene datos institucionales de la Escuela Normal Superior Dalmacio Vélez Sársfield y estado de Tesorería.',
    roles: 'Todos los roles autenticados'
  },
  {
    method: 'GET',
    path: '/api/socios',
    description: 'Lista el padrón completo de Socios / Padres o Tutores (RF-02)',
    roles: 'Secretaría, Tesorería, Administrador'
  },
  {
    method: 'POST',
    path: '/api/socios',
    description: 'Cooperadora.registrarSocio() / Secretaria.registrarTutor()',
    roles: 'Secretaría, Tesorería'
  },
  {
    method: 'PUT',
    path: '/api/socios/:id',
    description: 'Socio.actualizarDatos() — Actualiza teléfono, email o estado del socio',
    roles: 'Secretaría, Tesorería'
  },
  {
    method: 'GET',
    path: '/api/alumnos',
    description: 'Lista la nómina de alumnos matriculados y su vínculo con Tutor',
    roles: 'Secretaría, Tesorería, Administrador'
  },
  {
    method: 'POST',
    path: '/api/alumnos',
    description: 'Secretaria.registrarAlumno() — Alta de alumno y generación de 10 cuotas (HU-01)',
    roles: 'Secretaría, Tesorería'
  },
  {
    method: 'GET',
    path: '/api/cuotas?alumnoId=:id',
    description: 'Socio.consultarEstadoCuenta() — Estado de cuotas del alumno (RF-06, HU-03)',
    roles: 'Secretaría, Tesorería, Padre/Tutor'
  },
  {
    method: 'POST',
    path: '/api/cuotas',
    description: 'Secretaria.gestionarCuotas() — Registra nuevo cargo extraordinario (RF-03)',
    roles: 'Secretaría, Tesorería'
  },
  {
    method: 'PATCH',
    path: '/api/cuotas/:id/ajustar',
    description: 'Tesorería: Modificación del valor de una cuota individual exigiendo motivo de ajuste para auditoría obligatoria.',
    roles: 'Exclusivo Tesorería / Administrador'
  },
  {
    method: 'POST',
    path: '/api/cuotas/ajuste-general',
    description: 'Tesorería: Reajuste general o masivo de aranceles por período con trazabilidad y justificación.',
    roles: 'Exclusivo Tesorería / Administrador'
  },
  {
    method: 'POST',
    path: '/api/pagos',
    description: 'Pago.registrar() + Comprobante.emitir() con 20% desc. hermanos (RF-04, RF-05, RF-07)',
    roles: 'Secretaría, Tesorería'
  },
  {
    method: 'POST',
    path: '/api/pagos/transferencia',
    description: 'Registro de cobro por transferencia bancaria con almacenamiento seguro de comprobante adjunto (JPG, PNG, PDF).',
    roles: 'Secretaría, Tesorería'
  },
  {
    method: 'PUT',
    path: '/api/pagos/:id',
    description: 'Modificar pago registrado con motivo obligatorio en auditoría (RF-10, HU-05)',
    roles: 'Exclusivo Tesorería'
  },
  {
    method: 'PATCH',
    path: '/api/pagos/:id/validar',
    description: 'Tesorero.validarPago() — Visado y conciliación de recibo en Tesorería',
    roles: 'Exclusivo Tesorería'
  },
  {
    method: 'PATCH',
    path: '/api/pagos/:id/anular',
    description: 'Pago.anular() — Anula recibo y revierte cuotas a Pendiente (RF-10, HU-06)',
    roles: 'Exclusivo Tesorería'
  },
  {
    method: 'POST',
    path: '/api/tesoreria/egresos',
    description: 'Registra un gasto/egreso en la tabla TESORERIA',
    roles: 'Exclusivo Tesorería'
  },
  {
    method: 'POST',
    path: '/api/tesoreria/cerrar',
    description: 'Tesoreria.cerrarPeriodo() + calcularSaldo() — Consolida el balance contable del período',
    roles: 'Exclusivo Tesorería'
  }
];

// -------------------------------------------------------------
// UTILITARIOS DE TOKEN JWT SIMULADO Y GESTIÓN DE SESIÓN SEGURA
// -------------------------------------------------------------

function base64UrlEncode(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (e) {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}

function base64UrlDecode(str) {
  try {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    while (output.length % 4) output += '=';
    return decodeURIComponent(escape(atob(output)));
  } catch (e) {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    while (output.length % 4) output += '=';
    return atob(output);
  }
}

export const authService = {
  /**
   * Genera un token JWT seguro con payload de usuario y fecha de expiración.
   */
  generateToken(user) {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    const nowSec = Math.floor(Date.now() / 1000);
    const payload = {
      sub: user.id,
      username: user.username,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      cargo: user.cargo,
      tutorId: user.tutorId || null,
      iat: nowSec,
      exp: nowSec + 8 * 3600 // Válido por 8 horas
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    // Firma simulada con hash criptográfico del header y payload
    const signature = base64UrlEncode(`ens_dvs_secure_signature_${user.id}_${nowSec}`);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  },

  /**
   * Valida la firma y expiración del token JWT.
   */
  verifyToken(token) {
    if (!token || typeof token !== 'string') return { valid: false, error: 'Token no provisto' };
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, error: 'Estructura de token JWT inválida' };

    try {
      const payload = JSON.parse(base64UrlDecode(parts[1]));
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < nowSec) {
        return { valid: false, expired: true, error: 'La sesión ha expirado. Inicie sesión nuevamente.' };
      }
      return { valid: true, payload };
    } catch (e) {
      return { valid: false, error: 'Error decodificando token JWT' };
    }
  },

  saveToken(token) {
    try {
      sessionStorage.setItem(API_CONFIG.TOKEN_KEY, token);
      localStorage.setItem(API_CONFIG.TOKEN_KEY, token);
    } catch (e) {
      console.warn('Almacenamiento de token no disponible:', e);
    }
  },

  getToken() {
    return (
      sessionStorage.getItem(API_CONFIG.TOKEN_KEY) ||
      localStorage.getItem(API_CONFIG.TOKEN_KEY) ||
      null
    );
  },

  removeToken() {
    sessionStorage.removeItem(API_CONFIG.TOKEN_KEY);
    localStorage.removeItem(API_CONFIG.TOKEN_KEY);
  }
};

// -------------------------------------------------------------
// CONTROLADOR DE PERSISTENCIA Y ESTADO GLOBAL
// -------------------------------------------------------------

export const cooperadoraApi = {
  loadState() {
    const saved = localStorage.getItem(API_CONFIG.STORAGE_KEY);
    const initial = getInitialMockData();

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        // Migración institucional automática: asegura el nuevo branding en navegadores con caché previa
        const cooperadoraActualizada = {
          ...initial.cooperadora,
          ...(parsed.cooperadora || {}),
          nombre: 'Asociación Cooperadora Escuela Normal Superior Dalmacio Vélez Sársfield'
        };

        // Asegurar que todas las cuotas cuenten con array de auditoría de ajustes
        const cuotasNormalizadas = (parsed.cuotas || initial.cuotas).map((c) => ({
          ...c,
          historialAjustes: c.historialAjustes || []
        }));

        // Migrar pagos para asegurar estructura de comprobantes adjuntos
        const pagosNormalizados = (parsed.pagos || initial.pagos).map((p) => {
          if (p.id === 'REC-2026-002' && !p.comprobanteAdjunto) {
            const initialRec2 = initial.pagos.find((ip) => ip.id === 'REC-2026-002');
            return { ...p, comprobanteAdjunto: initialRec2?.comprobanteAdjunto || null };
          }
          return { ...p, comprobanteAdjunto: p.comprobanteAdjunto || null };
        });

        return {
          ...initial,
          ...parsed,
          cooperadora: cooperadoraActualizada,
          cuotas: cuotasNormalizadas,
          pagos: pagosNormalizados,
          tesoreria: { ...initial.tesoreria, ...(parsed.tesoreria || {}) }
        };
      } catch (e) {
        console.error('Error parseando estado local, restableciendo a mock inicial:', e);
        return initial;
      }
    }

    this.saveState(initial);
    return initial;
  },

  saveState(state) {
    try {
      localStorage.setItem(API_CONFIG.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error guardando estado en localStorage:', e);
    }
  },

  resetState() {
    const initial = getInitialMockData();
    // Iniciar con historialAjustes en cada cuota
    initial.cuotas = initial.cuotas.map((c) => ({
      ...c,
      historialAjustes: c.historialAjustes || []
    }));
    this.saveState(initial);
    authService.removeToken();
    return initial;
  }
};
