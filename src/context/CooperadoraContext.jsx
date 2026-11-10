import React, { createContext, useContext, useState, useEffect } from 'react';
import { cooperadoraApi, authService } from '../services/cooperadoraApi';
import {
  CUOTA_BASE,
  DESCUENTO_HERMANO_PCT,
  RECARGO_MORA_PCT,
  MESES_CICLO,
  USUARIOS_SISTEMA
} from '../data/mockData';

const CooperadoraContext = createContext(null);

export function CooperadoraProvider({ children }) {
  // Sesión segura basada en Tokens JWT
  const [sessionToken, setSessionToken] = useState(() => {
    const token = authService.getToken();
    if (token) {
      const res = authService.verifyToken(token);
      if (res.valid) return token;
      authService.removeToken();
    }
    return null;
  });

  const [state, setState] = useState(() => {
    const loaded = cooperadoraApi.loadState();
    const token = authService.getToken();
    if (token) {
      const res = authService.verifyToken(token);
      if (res.valid && res.payload) {
        const dynamicTutors = loaded.usuariosTutores || [];
        const matchingUser =
          dynamicTutors.find((u) => u.id === res.payload.sub) ||
          USUARIOS_SISTEMA.find((u) => u.id === res.payload.sub) || {
            id: res.payload.sub,
            username: res.payload.username,
            nombre: res.payload.nombre,
            email: res.payload.email,
            rol: res.payload.rol,
            cargo: res.payload.cargo,
            tutorId: res.payload.tutorId || null,
            requiereRegistro: res.payload.rol === 'tutor' && !res.payload.tutorId
          };
        return {
          ...loaded,
          role: matchingUser.rol,
          currentUser: matchingUser,
          selectedTutorPortalId: matchingUser.tutorId || null
        };
      }
    }
    // Sin sesión activa
    return {
      ...loaded,
      role: null,
      currentUser: null
    };
  });

  const [activeTab, setActiveTab] = useState(() => {
    const token = authService.getToken();
    if (token) {
      const res = authService.verifyToken(token);
      if (res.valid && res.payload) {
        if (res.payload.rol === 'tesorero') return 'tesoreria';
        if (res.payload.rol === 'admin' || res.payload.rol === 'director') return 'reportes';
        if (res.payload.rol === 'tutor') return 'portalTutor';
        return 'recepcion';
      }
    }
    return 'recepcion';
  });

  const [selectedCuotaIds, setSelectedCuotaIds] = useState([]);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cooperadora_theme_pref') || 'light';
  });
  const [toast, setToast] = useState(null);

  // Modales globales
  const [activeReciboId, setActiveReciboId] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [previewComprobante, setPreviewComprobante] = useState(null);

  // Sincronizar en localStorage cada vez que cambia state
  useEffect(() => {
    cooperadoraApi.saveState(state);
  }, [state]);

  // Verificar validez del Token JWT al montar
  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      const res = authService.verifyToken(token);
      if (res.valid) {
        setSessionToken(token);
      } else {
        authService.removeToken();
        setSessionToken(null);
        setState((prev) => ({ ...prev, currentUser: null, role: null }));
      }
    }
  }, []);

  // Aplicar tema oscuro/claro al HTML
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('cooperadora_theme_pref', theme);
  }, [theme]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((prev) => (prev && prev.message === message ? null : prev));
    }, 4000);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    showToast(`Modo ${next === 'dark' ? 'oscuro' : 'claro'} activado`, 'info');
  };

  const createAuditEntry = (usuario, accion, detalle) => {
    const now = new Date();
    const dateStr =
      now.toISOString().split('T')[0] +
      ' ' +
      now.toTimeString().split(' ')[0].slice(0, 5);
    return {
      timestamp: dateStr,
      usuario,
      accion,
      detalle
    };
  };

  // --- AUTENTICACIÓN, SESIONES SEGURAS CON JWT Y CONTROL DE ACCESO (RBAC) ---
  const normalizeDni = (val) => String(val || '').replace(/[.\-\s]/g, '').trim();

  const setRole = (role) => {
    if (role === 'tutor') {
      // Al cambiar al área de Padre/Tutor sin haberse registrado/identificado individualmente,
      // no se precarga información de ningún otro padre hasta que complete su registro o login personal.
      const guestTutorUser = {
        id: 'tutor-pending',
        username: 'tutor_sin_registrar',
        nombre: 'Padre / Tutor (Pendiente de Registro)',
        email: 'Sin sesión familiar vinculada',
        rol: 'tutor',
        cargo: 'Portal de Autogestión Familiar',
        tutorId: null,
        requiereRegistro: true
      };
      const token = authService.generateToken(guestTutorUser);
      authService.saveToken(token);
      setSessionToken(token);

      setState((prev) => ({
        ...prev,
        role: 'tutor',
        currentUser: guestTutorUser,
        selectedTutorPortalId: null
      }));
      setActiveTab('portalTutor');
      showToast('Área Padre / Tutor: Regístrese o valide sus datos para consultar a sus hijos.', 'info');
      return;
    }

    const matchingUser =
      USUARIOS_SISTEMA.find((u) => u.rol === role) || USUARIOS_SISTEMA[0];

    // Generar token JWT para la sesión con este rol
    const token = authService.generateToken(matchingUser);
    authService.saveToken(token);
    setSessionToken(token);

    setState((prev) => ({
      ...prev,
      role,
      currentUser: matchingUser
    }));

    // Redirección contextual según el Rol RBAC
    if ((role === 'director' || role === 'admin') && (activeTab === 'recepcion' || activeTab === 'tesoreria')) {
      setActiveTab('reportes');
    } else if (role === 'tesorero' && activeTab === 'portalTutor') {
      setActiveTab('tesoreria');
    } else if (role === 'secretaria' && (activeTab === 'tesoreria' || activeTab === 'portalTutor')) {
      setActiveTab('recepcion');
    }

    const roleNames = {
      secretaria: 'Secretaría Institucional',
      tesorero: 'Tesorería y Auditoría',
      director: 'Director Institucional',
      admin: 'Administrador General',
      tutor: 'Padre / Tutor (Socio)'
    };
    showToast(`Rol activo: ${roleNames[role] || role}`, 'info');
  };

  const iniciarSesion = (usernameOrEmailOrDni, password) => {
    const input = (usernameOrEmailOrDni || '').trim().toLowerCase();
    const inputDni = normalizeDni(usernameOrEmailOrDni);

    const usuariosDinamicos = state.usuariosTutores || [];
    const todosLosUsuarios = [...usuariosDinamicos, ...USUARIOS_SISTEMA];

    const found = todosLosUsuarios.find((u) => {
      const matchUsername = u.username && u.username.toLowerCase() === input;
      const matchEmail = u.email && u.email.toLowerCase() === input;
      const matchDni = u.dni && inputDni && normalizeDni(u.dni) === inputDni;
      const matchPass = u.password === password || u.passwordHash === password;
      return (matchUsername || matchEmail || matchDni) && matchPass;
    });

    if (!found) {
      return {
        ok: false,
        error: 'Credenciales inválidas o padre aún no registrado. Si ingresa por primera vez como Padre/Tutor, utilice la pestaña "Registrarme".'
      };
    }

    // Generar y almacenar token JWT seguro
    const token = authService.generateToken(found);
    authService.saveToken(token);
    setSessionToken(token);

    setState((prev) => ({
      ...prev,
      role: found.rol,
      currentUser: { ...found, requiereRegistro: false },
      selectedTutorPortalId: found.tutorId || null,
      auditLogs: [
        createAuditEntry(
          found.cargo,
          'INICIO_SESION_JWT',
          `Sesión segura JWT autenticada para ${found.nombre} (${found.email}). Rol: ${found.rol.toUpperCase()}.`
        ),
        ...prev.auditLogs
      ]
    }));

    if (found.rol === 'director' || found.rol === 'admin') setActiveTab('reportes');
    if (found.rol === 'tutor') setActiveTab('portalTutor');
    if (found.rol === 'secretaria') setActiveTab('recepcion');
    if (found.rol === 'tesorero') setActiveTab('tesoreria');

    setIsLoginModalOpen(false);
    showToast(`Bienvenido/a, ${found.nombre} (${found.cargo}) — Sesión JWT iniciada`, 'success');
    return { ok: true, user: found, token };
  };

  // Registro e identificación de Padre / Tutor validando vínculo en el Padrón Escolar
  const registrarCuentaTutor = ({
    nombre,
    apellido,
    dni,
    email,
    telefono,
    password,
    dniHijo
  }) => {
    const cleanNombre = (nombre || '').trim();
    const cleanApellido = (apellido || '').trim();
    const cleanDni = (dni || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanTel = (telefono || '').trim();
    const cleanPass = (password || '').trim();
    const normTutorDni = normalizeDni(cleanDni);
    const normHijoDni = normalizeDni(dniHijo);

    if (!cleanNombre || !cleanApellido || !normTutorDni || !cleanEmail || !cleanPass) {
      return {
        ok: false,
        error: 'Complete todos sus datos obligatorios (Nombre, Apellido, DNI, Correo y Contraseña).'
      };
    }

    // 1. Buscar si el DNI del Padre/Tutor ya existe en el Padrón de Socios/Tutores
    const existingTutor = state.tutores.find(
      (t) => normalizeDni(t.dni) === normTutorDni
    );

    // 2. Buscar si ingresó el DNI de su hijo/a en el Padrón de Alumnos
    const matchedAlumnoByDni = normHijoDni
      ? state.alumnos.find((a) => normalizeDni(a.dni) === normHijoDni)
      : null;

    if (!existingTutor && !matchedAlumnoByDni) {
      return {
        ok: false,
        error:
          'No se encontró su DNI en el padrón de tutores ni un alumno matriculado con el DNI de hijo/a indicado. Verifique su DNI o ingrese el DNI de su hijo/a matriculado/a para validar su vínculo.'
      };
    }

    // Si ambos existen, verificar que no pertenezcan a otra familia distinta, o vincular al alumno
    let targetTutorId = existingTutor ? existingTutor.id : `tut-${state.tutores.length + 1}`;
    let updatedTutores = [...state.tutores];
    let updatedAlumnos = [...state.alumnos];

    if (existingTutor) {
      updatedTutores = updatedTutores.map((t) =>
        t.id === existingTutor.id
          ? {
              ...t,
              nombre: cleanNombre,
              apellido: cleanApellido,
              email: cleanEmail,
              telefono: cleanTel || t.telefono,
              registradoPortal: true,
              estado: 'Activo'
            }
          : t
      );
      if (matchedAlumnoByDni && matchedAlumnoByDni.tutorId !== existingTutor.id) {
        updatedAlumnos = updatedAlumnos.map((a) =>
          a.id === matchedAlumnoByDni.id ? { ...a, tutorId: existingTutor.id } : a
        );
      }
    } else {
      const nuevoTutorObj = {
        id: targetTutorId,
        cooperadoraId: 1,
        nombre: cleanNombre,
        apellido: cleanApellido,
        dni: cleanDni,
        telefono: cleanTel || 'S/D',
        email: cleanEmail,
        fechaAlta: new Date().toISOString().split('T')[0],
        estado: 'Activo',
        registradoPortal: true
      };
      updatedTutores.push(nuevoTutorObj);

      if (matchedAlumnoByDni) {
        updatedAlumnos = updatedAlumnos.map((a) =>
          a.id === matchedAlumnoByDni.id ? { ...a, tutorId: targetTutorId } : a
        );
      }
    }

    const hijosVinculados = updatedAlumnos.filter((a) => a.tutorId === targetTutorId);

    const nuevoUsuarioTutor = {
      id: `usr-tut-${targetTutorId}`,
      username: normTutorDni,
      dni: cleanDni,
      password: cleanPass,
      passwordHash: cleanPass,
      nombre: `${cleanNombre} ${cleanApellido}`,
      email: cleanEmail,
      telefono: cleanTel || existingTutor?.telefono || 'S/D',
      rol: 'tutor',
      tutorId: targetTutorId,
      cargo: 'Padre / Tutor Registrado (Socio Cooperadora)',
      requiereRegistro: false
    };

    const token = authService.generateToken(nuevoUsuarioTutor);
    authService.saveToken(token);
    setSessionToken(token);

    setState((prev) => {
      const prevUsuariosTutores = (prev.usuariosTutores || []).filter(
        (u) => u.tutorId !== targetTutorId && normalizeDni(u.dni) !== normTutorDni
      );
      return {
        ...prev,
        role: 'tutor',
        currentUser: nuevoUsuarioTutor,
        selectedTutorPortalId: targetTutorId,
        tutores: updatedTutores,
        alumnos: updatedAlumnos,
        usuariosTutores: [nuevoUsuarioTutor, ...prevUsuariosTutores],
        auditLogs: [
          createAuditEntry(
            'Portal Autogestión Familiar',
            'REGISTRO_PADRE_TUTOR',
            `Alta y validación de cuenta digital para el Padre/Tutor ${cleanApellido}, ${cleanNombre} (DNI ${cleanDni}). Hijos vinculados en su cuenta exclusiva: ${hijosVinculados.map((h) => `${h.nombre} ${h.apellido}`).join(', ') || 'Ninguno'}.`
          ),
          ...prev.auditLogs
        ]
      };
    });

    setActiveTab('portalTutor');
    setIsLoginModalOpen(false);
    showToast(
      `¡Registro exitoso! Bienvenido/a ${cleanNombre} ${cleanApellido}. Se vincularon ${hijosVinculados.length} hijo(s) a su cuenta.`,
      'success'
    );

    return { ok: true, user: nuevoUsuarioTutor, tutorId: targetTutorId, hijos: hijosVinculados };
  };

  // Permite a un Padre/Tutor ya registrado vincular otro hijo por DNI si fue matriculado recientemente
  const vincularHijoPorDni = (dniHijo) => {
    const tutorId = state.currentUser?.tutorId;
    if (!tutorId) {
      return { ok: false, error: 'Debe estar registrado como Padre/Tutor para vincular un hijo.' };
    }
    const normDni = normalizeDni(dniHijo);
    if (!normDni) {
      return { ok: false, error: 'Ingrese el DNI del alumno.' };
    }
    const alumno = state.alumnos.find((a) => normalizeDni(a.dni) === normDni);
    if (!alumno) {
      return { ok: false, error: 'No se encontró ningún alumno matriculado con ese DNI en el padrón.' };
    }
    if (alumno.tutorId === tutorId) {
      return { ok: false, error: `${alumno.nombre} ${alumno.apellido} ya se encuentra vinculado a su cuenta.` };
    }

    setState((prev) => ({
      ...prev,
      alumnos: prev.alumnos.map((a) =>
        a.id === alumno.id ? { ...a, tutorId } : a
      ),
      auditLogs: [
        createAuditEntry(
          state.currentUser?.nombre || 'Padre / Tutor',
          'VINCULACION_HIJO_PORTAL',
          `El socio/tutor vinculó por DNI al alumno ${alumno.apellido}, ${alumno.nombre} (DNI ${alumno.dni}) a su grupo familiar.`
        ),
        ...prev.auditLogs
      ]
    }));

    showToast(`Alumno ${alumno.nombre} ${alumno.apellido} vinculado a su grupo familiar.`, 'success');
    return { ok: true, alumno };
  };

  // Permite volver a la pantalla de registro/identificación de Padre/Tutor sin exponer datos
  const cambiarCuentaTutorPortal = () => {
    const guestTutorUser = {
      id: 'tutor-pending',
      username: 'tutor_sin_registrar',
      nombre: 'Padre / Tutor (Pendiente de Registro)',
      email: 'Sin sesión familiar vinculada',
      rol: 'tutor',
      cargo: 'Portal de Autogestión Familiar',
      tutorId: null,
      requiereRegistro: true
    };
    const token = authService.generateToken(guestTutorUser);
    authService.saveToken(token);
    setSessionToken(token);

    setState((prev) => ({
      ...prev,
      role: 'tutor',
      currentUser: guestTutorUser,
      selectedTutorPortalId: null
    }));
    showToast('Sesión familiar cerrada. Ingrese o registre un Padre/Tutor para ver sus datos.', 'info');
  };

  const cerrarSesion = () => {
    const user = state.currentUser;
    authService.removeToken();
    setSessionToken(null);
    setState((prev) => ({
      ...prev,
      role: null,
      currentUser: null,
      auditLogs: [
        createAuditEntry(
          user?.cargo || 'Usuario',
          'CIERRE_SESION_JWT',
          `Cierre de sesión de ${user?.nombre || 'usuario'} (${user?.email || '-'}). Token revocado.`
        ),
        ...prev.auditLogs
      ]
    }));
    setIsLoginModalOpen(false);
    showToast('Sesión finalizada correctamente. Redirigiendo a la bienvenida.', 'info');
  };

  // --- SELECTORES Y REGLAS DE NEGOCIO ---
  const getStudent = (id) => state.alumnos.find((a) => a.id === id);
  const getTutor = (id) => state.tutores.find((t) => t.id === id);
  const getStudentCuotas = (studentId) =>
    state.cuotas
      .filter((c) => c.alumnoId === studentId)
      .sort((a, b) => (a.mesId || 99) - (b.mesId || 99));

  const getStudentSiblings = (studentId) => {
    const student = getStudent(studentId);
    if (!student) return [];
    return state.alumnos.filter(
      (a) => a.tutorId === student.tutorId && a.id !== student.id
    );
  };

  const hasSiblingDiscount = (studentId) =>
    getStudentSiblings(studentId).length > 0;

  const selectStudent = (studentId) => {
    setState((prev) => ({ ...prev, selectedStudentId: studentId }));
    setSelectedCuotaIds([]);
  };

  const toggleCuotaSelection = (cuotaId) => {
    setSelectedCuotaIds((prev) =>
      prev.includes(cuotaId)
        ? prev.filter((id) => id !== cuotaId)
        : [...prev, cuotaId]
    );
  };

  const selectAllPendingForStudent = (studentId) => {
    const cuotas = getStudentCuotas(studentId);
    const pendingIds = cuotas
      .filter((c) => c.estado === 'pendiente' || c.estado === 'vencida')
      .map((c) => c.id);
    setSelectedCuotaIds(pendingIds);
  };

  // --- MÉTODOS DE NEGOCIO Y CASOS DE USO ---

  // 1. Pago.registrar() + Comprobante.emitir() con soporte para transferencia y archivo adjunto
  const registrarCobro = ({
    studentId,
    cuotaIds,
    medio,
    comprobanteRef,
    fecha,
    aplicarRecargoMora = false,
    observaciones = '',
    comprobanteAdjunto = null
  }) => {
    if (state.role === 'director' || state.role === 'tutor') {
      showToast('Su rol actual es de consulta y no permite registrar cobros.', 'warning');
      return null;
    }

    const student = getStudent(studentId);
    if (!student || cuotaIds.length === 0) return null;

    const cuotasACobrar = state.cuotas.filter((c) => cuotaIds.includes(c.id));
    const subtotal = cuotasACobrar.reduce((acc, c) => acc + c.monto, 0);
    const aplicaDesc = hasSiblingDiscount(student.id);
    const discountAmount = aplicaDesc ? Math.round(subtotal * DESCUENTO_HERMANO_PCT) : 0;

    const montoVencidas = cuotasACobrar
      .filter((c) => c.estado === 'vencida')
      .reduce((acc, c) => acc + c.monto, 0);
    const recargoAmount = aplicarRecargoMora
      ? Math.round(montoVencidas * RECARGO_MORA_PCT)
      : 0;

    const total = subtotal - discountAmount + recargoAmount;
    const nextNum = state.pagos.length + 1;
    const reciboId = `REC-2026-${nextNum.toString().padStart(3, '0')}`;

    const conceptosNombres = cuotasACobrar.map((c) => {
      const baseName =
        c.concepto ||
        `Cuota ${MESES_CICLO.find((m) => m.id === c.mesId)?.nombre || ''} 2026`;
      return aplicaDesc ? `${baseName} (Hermano -20%)` : baseName;
    });

    const operadorLabel =
      state.role === 'tesorero'
        ? `Tesorería (${state.currentUser?.nombre || 'Marta Rodríguez'})`
        : `Secretaría (${state.currentUser?.nombre || 'Ana Martínez'})`;

    const nuevoPago = {
      id: reciboId,
      numeroComprobante: nextNum,
      fecha: fecha || new Date().toISOString().split('T')[0],
      alumnoId: student.id,
      tutorId: student.tutorId,
      conceptos: conceptosNombres,
      cuotaIds: cuotasACobrar.map((c) => c.id),
      montoSubtotal: subtotal,
      descuento: discountAmount,
      recargo: recargoAmount,
      montoTotal: total,
      medio,
      comprobante: comprobanteRef,
      comprobanteAdjunto: comprobanteAdjunto || null,
      operador: operadorLabel,
      estado: 'valido',
      validadoTesoreria: state.role === 'tesorero',
      observaciones:
        observaciones ||
        (aplicaDesc ? 'Bonificación automática 20% por hermanos aplicada.' : ''),
      historialEdiciones: []
    };

    setState((prev) => ({
      ...prev,
      cuotas: prev.cuotas.map((c) =>
        cuotaIds.includes(c.id)
          ? { ...c, estado: 'pagada', pagoId: reciboId }
          : c
      ),
      pagos: [nuevoPago, ...prev.pagos],
      auditLogs: [
        createAuditEntry(
          prev.role === 'tesorero' ? 'Tesorería' : 'Secretaría',
          'COBRO_REGISTRADO',
          `Emisión de recibo ${reciboId} para ${student.apellido}, ${student.nombre}. Importe: $${total.toLocaleString('es-AR')} (${medio} Ref: ${comprobanteRef}${comprobanteAdjunto ? ' con comprobante adjunto: ' + comprobanteAdjunto.nombre : ''}).`
        ),
        ...prev.auditLogs
      ]
    }));

    setSelectedCuotaIds([]);
    showToast(`Cobro registrado con éxito: ${reciboId}`, 'success');
    setActiveReciboId(reciboId);
    return nuevoPago;
  };

  // 2. Asociar o actualizar archivo de comprobante a un pago ya registrado
  const subirComprobantePago = ({ pagoId, comprobanteAdjunto }) => {
    setState((prev) => ({
      ...prev,
      pagos: prev.pagos.map((p) =>
        p.id === pagoId ? { ...p, comprobanteAdjunto } : p
      ),
      auditLogs: [
        createAuditEntry(
          state.currentUser?.cargo || 'Secretaría',
          'COMPROBANTE_TRANSFERENCIA_SUBIDO',
          `Comprobante digital "${comprobanteAdjunto.nombre}" vinculado de forma segura al recibo ${pagoId}.`
        ),
        ...prev.auditLogs
      ]
    }));
    showToast(`Comprobante adjuntado exitosamente al recibo ${pagoId}.`, 'success');
  };

  // 3. MÓDULO DE TESORERÍA: Ajuste de Cuotas con Justificación y Auditoría Obligatoria
  const ajustarCuota = ({ cuotaId, nuevoMonto, motivoAjuste }) => {
    const rolActual = state.role;
    if (rolActual !== 'tesorero' && rolActual !== 'admin') {
      showToast('Acceso denegado: Solo el rol de Tesorería o Administrador puede editar aranceles de cuotas.', 'warning');
      return { ok: false, error: 'Permisos insuficientes' };
    }

    if (!motivoAjuste || motivoAjuste.trim().length < 5) {
      showToast('El motivo de ajuste es obligatorio para auditoría (mínimo 5 caracteres).', 'warning');
      return { ok: false, error: 'Motivo de ajuste obligatorio' };
    }

    const montoNum = Number(nuevoMonto);
    if (isNaN(montoNum) || montoNum < 0) {
      showToast('Por favor ingrese un valor de cuota numérico válido.', 'warning');
      return { ok: false, error: 'Monto inválido' };
    }

    const cuotaTarget = state.cuotas.find((c) => c.id === cuotaId);
    if (!cuotaTarget) {
      showToast('No se encontró la cuota solicitada.', 'warning');
      return { ok: false, error: 'Cuota no encontrada' };
    }

    const alumno = getStudent(cuotaTarget.alumnoId);
    const alumnoNombre = alumno ? `${alumno.apellido}, ${alumno.nombre}` : cuotaTarget.alumnoId;
    const montoAnterior = cuotaTarget.monto;

    const ahora = new Date();
    const fechaHora = ahora.toISOString().replace('T', ' ').slice(0, 16);
    const usuarioResponsable = state.currentUser?.cargo || `${state.currentUser?.nombre} (Tesorería)`;

    const registroAjuste = {
      id: `AJU-${Date.now().toString().slice(-6)}`,
      fecha: fechaHora,
      usuario: usuarioResponsable,
      montoAnterior,
      montoNuevo: montoNum,
      motivo: motivoAjuste.trim()
    };

    setState((prev) => ({
      ...prev,
      cuotas: prev.cuotas.map((c) =>
        c.id === cuotaId
          ? {
              ...c,
              monto: montoNum,
              historialAjustes: [registroAjuste, ...(c.historialAjustes || [])]
            }
          : c
      ),
      auditLogs: [
        createAuditEntry(
          usuarioResponsable,
          'AJUSTE_CUOTA_AUDITORIA',
          `Cuota "${cuotaTarget.concepto || cuotaTarget.periodo}" reajustada de $${montoAnterior.toLocaleString('es-AR')} a $${montoNum.toLocaleString('es-AR')} para el alumno ${alumnoNombre}. Justificación obligatoria: "${motivoAjuste.trim()}".`
        ),
        ...prev.auditLogs
      ]
    }));

    showToast(`Cuota modificada a $${montoNum.toLocaleString('es-AR')}. Auditoría registrada con éxito.`, 'success');
    return { ok: true };
  };

  // 4. MÓDULO DE TESORERÍA: Reajuste general / masivo de cuotas con trazabilidad
  const ajustarCuotasGeneral = ({ periodos, periodo, nuevoMonto, motivoAjuste }) => {
    const rolActual = state.role;
    if (rolActual !== 'tesorero' && rolActual !== 'admin') {
      showToast('Acceso denegado: Solo Tesorería puede realizar reajustes generales de cuotas.', 'warning');
      return { ok: false, error: 'Permisos insuficientes' };
    }

    if (!motivoAjuste || motivoAjuste.trim().length < 5) {
      showToast('Debe ingresar un motivo obligatorio para el ajuste general de aranceles.', 'warning');
      return { ok: false, error: 'Motivo obligatorio' };
    }

    const montoNum = Number(nuevoMonto);
    if (isNaN(montoNum) || montoNum <= 0) {
      showToast('Ingrese un monto válido superior a cero.', 'warning');
      return { ok: false, error: 'Monto inválido' };
    }

    let periodosArray = [];
    if (Array.isArray(periodos) && periodos.length > 0) {
      periodosArray = periodos;
    } else if (periodo) {
      periodosArray = [periodo];
    } else {
      periodosArray = ['todos_pendientes'];
    }

    const esTodos = periodosArray.includes('todos_pendientes');

    const cuotasFiltradas = state.cuotas.filter((c) => {
      const matchPeriodo = esTodos || periodosArray.includes(c.periodo);
      return matchPeriodo && c.estado !== 'pagada';
    });

    if (cuotasFiltradas.length === 0) {
      showToast('No se encontraron cuotas pendientes para los meses seleccionados.', 'warning');
      return { ok: false, error: 'Sin cuotas a modificar' };
    }

    const fechaHora = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const usuarioResponsable = state.currentUser?.cargo || `${state.currentUser?.nombre} (Tesorería)`;
    const descripcionPeriodos = esTodos ? 'Todos los meses pendientes' : periodosArray.join(', ');

    setState((prev) => ({
      ...prev,
      cuotas: prev.cuotas.map((c) => {
        const matchPeriodo = esTodos || periodosArray.includes(c.periodo);
        if (!matchPeriodo || c.estado === 'pagada') return c;

        const ajusteObj = {
          id: `AJU-GEN-${Date.now().toString().slice(-6)}-${c.id.slice(-4)}`,
          fecha: fechaHora,
          usuario: usuarioResponsable,
          montoAnterior: c.monto,
          montoNuevo: montoNum,
          motivo: `[Ajuste General: ${c.periodo}] ${motivoAjuste.trim()}`
        };

        return {
          ...c,
          monto: montoNum,
          historialAjustes: [ajusteObj, ...(c.historialAjustes || [])]
        };
      }),
      auditLogs: [
        createAuditEntry(
          usuarioResponsable,
          'AJUSTE_GENERAL_ARANCELES',
          `Reajuste general sobre ${cuotasFiltradas.length} cuotas pendientes (${descripcionPeriodos}). Nuevo valor fijado: $${montoNum.toLocaleString('es-AR')}. Motivo: "${motivoAjuste.trim()}".`
        ),
        ...prev.auditLogs
      ]
    }));

    showToast(`Ajuste general aplicado con éxito a ${cuotasFiltradas.length} cuotas (${descripcionPeriodos}).`, 'success');
    return { ok: true, cuotasAfectadas: cuotasFiltradas.length };
  };

  // 5. Secretaria.registrarAlumno() + Cooperadora.registrarSocio()
  const registrarAlumno = ({ alumnoData, tutorMode, tutorExistenteId, nuevoTutorData }) => {
    let targetTutorId = tutorExistenteId;
    let nuevosTutores = [...state.tutores];

    if (tutorMode === 'nuevo') {
      if (
        !nuevoTutorData?.nombre?.trim() ||
        !nuevoTutorData?.apellido?.trim() ||
        !nuevoTutorData?.dni?.trim() ||
        !nuevoTutorData?.telefono?.trim() ||
        !nuevoTutorData?.email?.trim()
      ) {
        showToast('Todos los datos del nuevo tutor (Nombre, Apellido, DNI, Teléfono y Gmail/Correo) son obligatorios.', 'warning');
        return null;
      }
      targetTutorId = `tut-${state.tutores.length + 1}`;
      const nuevoTutor = {
        id: targetTutorId,
        cooperadoraId: 1,
        nombre: nuevoTutorData.nombre.trim(),
        apellido: nuevoTutorData.apellido.trim(),
        dni: nuevoTutorData.dni.trim(),
        telefono: nuevoTutorData.telefono.trim(),
        email: nuevoTutorData.email.trim(),
        fechaAlta: new Date().toISOString().split('T')[0],
        estado: 'Activo'
      };
      nuevosTutores.push(nuevoTutor);
    }

    const newAluId = `alu-${state.alumnos.length + 1}`;
    const nuevoAlumno = {
      id: newAluId,
      nombre: alumnoData.nombre.trim(),
      apellido: alumnoData.apellido.trim(),
      dni: alumnoData.dni.trim(),
      anioLectivo: alumnoData.anioLectivo || '2026',
      curso: alumnoData.curso,
      division: alumnoData.division,
      turno: alumnoData.turno,
      tutorId: targetTutorId,
      estado_matricula: 'Regular'
    };

    const nuevasCuotas = MESES_CICLO.map((mes) => ({
      id: `c-${newAluId}-${mes.id}`,
      alumnoId: newAluId,
      mesId: mes.id,
      concepto: `Cuota ${mes.nombre} 2026`,
      periodo: mes.periodo,
      vencimiento: mes.vencimiento,
      monto: CUOTA_BASE,
      estado: 'pendiente',
      pagoId: null,
      historialAjustes: []
    }));

    setState((prev) => ({
      ...prev,
      tutores: nuevosTutores,
      alumnos: [...prev.alumnos, nuevoAlumno],
      cuotas: [...prev.cuotas, ...nuevasCuotas],
      auditLogs: [
        createAuditEntry(
          prev.role === 'tesorero' ? 'Tesorería' : 'Secretaría',
          'MATRICULACION_ALUMNO',
          `Alta de alumno ${nuevoAlumno.apellido}, ${nuevoAlumno.nombre} (DNI ${nuevoAlumno.dni}, ${nuevoAlumno.curso} "${nuevoAlumno.division}") asociado al tutor ${targetTutorId}.`
        ),
        ...prev.auditLogs
      ]
    }));

    showToast(`Alumno matriculado: ${nuevoAlumno.nombre} ${nuevoAlumno.apellido}`, 'success');
    return nuevoAlumno;
  };

  // 6. Socio.actualizarDatos() y Alta independiente de Socio/Tutor
  const guardarTutor = (tutorData) => {
    if (
      !tutorData?.nombre?.trim() ||
      !tutorData?.apellido?.trim() ||
      !tutorData?.dni?.trim() ||
      !tutorData?.telefono?.trim() ||
      !tutorData?.email?.trim()
    ) {
      showToast('Complete todos los campos obligatorios del tutor: Nombre, Apellido, DNI, Teléfono y Gmail/Correo.', 'warning');
      return false;
    }

    const isEdit = Boolean(tutorData.id);
    if (isEdit) {
      setState((prev) => ({
        ...prev,
        tutores: prev.tutores.map((t) =>
          t.id === tutorData.id
            ? {
                ...t,
                ...tutorData,
                nombre: tutorData.nombre.trim(),
                apellido: tutorData.apellido.trim(),
                dni: tutorData.dni.trim(),
                telefono: tutorData.telefono.trim(),
                email: tutorData.email.trim()
              }
            : t
        ),
        auditLogs: [
          createAuditEntry(
            prev.role === 'tesorero' ? 'Tesorería' : 'Secretaría',
            'SOCIO_ACTUALIZADO',
            `Actualización de datos del tutor ${tutorData.apellido}, ${tutorData.nombre} (DNI ${tutorData.dni}).`
          ),
          ...prev.auditLogs
        ]
      }));
      showToast(`Datos del socio/tutor ${tutorData.apellido} actualizados.`, 'success');
      return true;
    } else {
      const newId = `tut-${state.tutores.length + 1}`;
      const nuevoSocio = {
        id: newId,
        cooperadoraId: 1,
        nombre: tutorData.nombre.trim(),
        apellido: tutorData.apellido.trim(),
        dni: tutorData.dni.trim(),
        telefono: tutorData.telefono.trim(),
        email: tutorData.email.trim(),
        fechaAlta: new Date().toISOString().split('T')[0],
        estado: tutorData.estado || 'Activo'
      };
      setState((prev) => ({
        ...prev,
        tutores: [...prev.tutores, nuevoSocio],
        auditLogs: [
          createAuditEntry(
            prev.role === 'tesorero' ? 'Tesorería' : 'Secretaría',
            'ALTA_SOCIO_TUTOR',
            `Alta de socio/tutor ${nuevoSocio.apellido}, ${nuevoSocio.nombre} (DNI ${nuevoSocio.dni}).`
          ),
          ...prev.auditLogs
        ]
      }));
      showToast(`Nuevo socio/tutor registrado: ${nuevoSocio.apellido}, ${nuevoSocio.nombre}`, 'success');
      return true;
    }
  };

  // 6b. Editar datos de legajo de estudiante
  const editarAlumno = ({ studentId, alumnoData }) => {
    const student = getStudent(studentId);
    if (!student) return false;

    setState((prev) => ({
      ...prev,
      alumnos: prev.alumnos.map((a) =>
        a.id === studentId
          ? {
              ...a,
              nombre: alumnoData.nombre.trim(),
              apellido: alumnoData.apellido.trim(),
              dni: alumnoData.dni.trim(),
              anioLectivo: alumnoData.anioLectivo || a.anioLectivo || '2026',
              curso: alumnoData.curso,
              division: alumnoData.division,
              turno: alumnoData.turno
            }
          : a
      ),
      auditLogs: [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          fecha: new Date().toISOString(),
          id_usuario: prev.currentUser?.id || 1,
          usuario: prev.currentUser?.cargo || (prev.role === 'tesorero' ? 'Tesorería' : 'Secretaría'),
          id_estudiante: studentId,
          accion: 'ALUMNO_ACTUALIZADO',
          motivo: 'Actualización de datos académicos o personales',
          estado_previo: student.estado_matricula || 'Regular',
          estado_nuevo: student.estado_matricula || 'Regular',
          detalle: `Actualización de legajo de ${student.apellido}, ${student.nombre} (DNI ${student.dni}). Curso: ${alumnoData.curso} "${alumnoData.division}" - Turno ${alumnoData.turno}.`
        },
        ...prev.auditLogs
      ]
    }));

    showToast(`Legajo de ${alumnoData.nombre} ${alumnoData.apellido} actualizado.`, 'success');
    return true;
  };

  // 6c. Gestionar Vínculo Familiar
  const cambiarTutorAlumno = ({ studentId, nuevoTutorId }) => {
    const student = getStudent(studentId);
    const tutorNuevo = getTutor(nuevoTutorId);
    if (!student || !tutorNuevo) return false;

    const tutorAnterior = getTutor(student.tutorId);

    setState((prev) => ({
      ...prev,
      alumnos: prev.alumnos.map((a) =>
        a.id === studentId ? { ...a, tutorId: nuevoTutorId } : a
      ),
      auditLogs: [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          fecha: new Date().toISOString(),
          id_usuario: prev.currentUser?.id || 1,
          usuario: prev.currentUser?.cargo || (prev.role === 'tesorero' ? 'Tesorería' : 'Secretaría'),
          id_estudiante: studentId,
          accion: 'VINCULO_FAMILIAR_ACTUALIZADO',
          motivo: 'Cambio o reasignación de socio tutor',
          estado_previo: student.estado_matricula || 'Regular',
          estado_nuevo: student.estado_matricula || 'Regular',
          detalle: `Reasignación familiar para ${student.apellido}, ${student.nombre}. Tutor previo: ${tutorAnterior ? `${tutorAnterior.apellido}, ${tutorAnterior.nombre}` : 'Sin tutor'} -> Nuevo Tutor: ${tutorNuevo.apellido}, ${tutorNuevo.nombre} (DNI ${tutorNuevo.dni}).`
        },
        ...prev.auditLogs
      ]
    }));

    showToast(`Vínculo familiar actualizado a ${tutorNuevo.apellido}, ${tutorNuevo.nombre}.`, 'success');
    return true;
  };

  // 6d. Solicitar Baja de Matrícula (Secretaría)
  const solicitarBajaMatricula = ({ studentId, motivo, observaciones, documentacionAdjunta }) => {
    const student = getStudent(studentId);
    if (!student) {
      showToast('No se encontró el legajo del estudiante.', 'warning');
      return { ok: false, error: 'Estudiante no encontrado' };
    }

    const cuotas = getStudentCuotas(studentId);
    const cuotasPendientes = cuotas.filter((c) => c.estado === 'pendiente' || c.estado === 'vencida');
    const totalDeuda = cuotasPendientes.reduce((acc, c) => acc + c.monto, 0);

    const prevEstado = student.estado_matricula || 'Regular';
    const nuevoEstado = 'BAJA_PENDIENTE_APROBACION';
    const fechaISO = new Date().toISOString();
    const dateFormatted = fechaISO.replace('T', ' ').slice(0, 16);
    const usuarioActual = state.currentUser || { id: 1, cargo: 'Secretaría Institucional', nombre: 'Secretaría' };

    const auditRecord = {
      id: `AUD-BAJA-${Date.now()}`,
      id_usuario: usuarioActual.id,
      id_estudiante: studentId,
      fecha: fechaISO,
      timestamp: dateFormatted,
      usuario: usuarioActual.cargo || usuarioActual.nombre,
      accion: 'SOLICITUD_BAJA_MATRICULA',
      motivo: (motivo || '').trim(),
      observaciones: (observaciones || '').trim(),
      documentacion: documentacionAdjunta || 'Sin archivo adjunto',
      estado_previo: prevEstado,
      estado_nuevo: nuevoEstado,
      cuotas_pendientes_count: cuotasPendientes.length,
      total_deuda: totalDeuda,
      detalle: `Solicitud de Baja de Matrícula para ${student.apellido}, ${student.nombre} (DNI ${student.dni}). Motivo: "${motivo}". Observaciones: "${observaciones || 'N/A'}". Estado: ${prevEstado} -> ${nuevoEstado}.${cuotasPendientes.length > 0 ? ` Registra ${cuotasPendientes.length} cuotas pendientes ($${totalDeuda.toLocaleString('es-AR')}) pendientes de resolución por Dirección.` : ' Sin deudas pendientes.'}`
    };

    setState((prev) => ({
      ...prev,
      alumnos: prev.alumnos.map((a) =>
        a.id === studentId ? { ...a, estado_matricula: nuevoEstado } : a
      ),
      auditLogs: [auditRecord, ...prev.auditLogs]
    }));

    showToast(`Solicitud de baja asentada para ${student.nombre} ${student.apellido}. Estado: ${nuevoEstado}.`, 'info');
    return {
      ok: true,
      nuevoEstado,
      cuotasPendientesCount: cuotasPendientes.length,
      totalDeuda,
      auditRecord
    };
  };

  // 6e. Aprobar / Efectivizar Baja de Matrícula (Dirección / Administración)
  const aprobarBajaMatricula = ({ studentId, resolucionDeuda = 'condonar', observaciones = '' }) => {
    const student = getStudent(studentId);
    if (!student) return { ok: false };

    const prevEstado = student.estado_matricula || 'BAJA_PENDIENTE_APROBACION';
    const nuevoEstado = 'Baja';
    const fechaISO = new Date().toISOString();
    const dateFormatted = fechaISO.replace('T', ' ').slice(0, 16);
    const usuarioActual = state.currentUser || { id: 3, cargo: 'Dirección / Rectoría', nombre: 'Dirección' };

    setState((prev) => ({
      ...prev,
      alumnos: prev.alumnos.map((a) =>
        a.id === studentId ? { ...a, estado_matricula: nuevoEstado } : a
      ),
      cuotas: resolucionDeuda === 'condonar'
        ? prev.cuotas.map((c) =>
            c.alumnoId === studentId && (c.estado === 'pendiente' || c.estado === 'vencida')
              ? { ...c, estado: 'eximida', concepto: `${c.concepto} (Condonada por Baja)` }
              : c
          )
        : prev.cuotas,
      auditLogs: [
        {
          id: `AUD-BAJA-CONF-${Date.now()}`,
          id_usuario: usuarioActual.id,
          id_estudiante: studentId,
          fecha: fechaISO,
          timestamp: dateFormatted,
          usuario: usuarioActual.cargo || usuarioActual.nombre,
          accion: 'BAJA_MATRICULA_APROBADA',
          motivo: `Aprobación de baja institucional. Resolución: ${resolucionDeuda === 'condonar' ? 'Condonación de deuda autorizada' : 'Deuda en gestión de cobranzas'}`,
          observaciones: observaciones || '',
          estado_previo: prevEstado,
          estado_nuevo: nuevoEstado,
          detalle: `Baja definitiva aprobada para ${student.apellido}, ${student.nombre}. Resolución: ${resolucionDeuda === 'condonar' ? 'Cuotas impagas eximidas / condonadas' : 'Deuda activa transferida a cobranza extrajudicial'}. Dictaminado por ${usuarioActual.cargo}.`
        },
        ...prev.auditLogs
      ]
    }));

    showToast(`Baja definitiva del legajo ${student.apellido}, ${student.nombre} aprobada.`, 'success');
    return { ok: true };
  };

  // 7. Secretaria.gestionarCuotas() — Cargo extraordinario
  const registrarNuevaCuota = ({ alumnoId, concepto, periodo, vencimiento, monto }) => {
    const targetAlumnos =
      alumnoId === 'todos'
        ? state.alumnos
        : state.alumnos.filter((a) => a.id === alumnoId);

    const timestampId = Date.now();
    const cuotasCreadas = targetAlumnos.map((alu, idx) => ({
      id: `c-extra-${alu.id}-${timestampId}-${idx}`,
      alumnoId: alu.id,
      mesId: 13,
      concepto: concepto.trim(),
      periodo: periodo || '2026-EXT',
      vencimiento: vencimiento || '30/06/2026',
      monto: Number(monto) || CUOTA_BASE,
      estado: 'pendiente',
      pagoId: null,
      historialAjustes: []
    }));

    setState((prev) => ({
      ...prev,
      cuotas: [...prev.cuotas, ...cuotasCreadas],
      auditLogs: [
        createAuditEntry(
          prev.role === 'tesorero' ? 'Tesorería' : 'Secretaría',
          'CUOTA_REGISTRADA',
          `Generación de cargo extraordinario "${concepto}" ($${Number(monto).toLocaleString('es-AR')}) para ${targetAlumnos.length} alumno(s).`
        ),
        ...prev.auditLogs
      ]
    }));

    showToast(`Cuota "${concepto}" registrada correctamente.`, 'success');
  };

  // 8. Tesorería: Modificar Pago con auditoría (RF-10, HU-05)
  const modificarPago = ({ id, nuevoImporte, nuevoMedio, nuevoComprobante, motivo }) => {
    if (state.role !== 'tesorero' && state.role !== 'admin') {
      showToast('Acceso denegado: Solo Tesorería puede modificar cobros registrados.', 'warning');
      return false;
    }

    const pagoActual = state.pagos.find((p) => p.id === id);
    if (!pagoActual) return false;

    const cambioAnterior = `Monto anterior: $${pagoActual.montoTotal}, Medio: ${pagoActual.medio}, Ref: ${pagoActual.comprobante}`;

    setState((prev) => ({
      ...prev,
      pagos: prev.pagos.map((p) =>
        p.id === id
          ? {
              ...p,
              montoTotal: Number(nuevoImporte),
              medio: nuevoMedio,
              comprobante: nuevoComprobante || p.comprobante,
              validadoTesoreria: true,
              historialEdiciones: [
                ...p.historialEdiciones,
                {
                  fecha: new Date().toISOString(),
                  motivo,
                  cambio: cambioAnterior
                }
              ]
            }
          : p
      ),
      auditLogs: [
        createAuditEntry(
          'Tesorería',
          'PAGO_RECTIFICADO',
          `Recibo ${id} modificado. Nuevo importe: $${Number(nuevoImporte).toLocaleString('es-AR')} (${nuevoMedio}). Motivo obligatorio: "${motivo}".`
        ),
        ...prev.auditLogs
      ]
    }));

    showToast(`Pago ${id} rectificado y auditado correctamente.`, 'info');
    return true;
  };

  // 9. Tesorería: Anular Pago mediante borrado lógico (estado = 'ANULADO'), audit_log y Reverso Contable
  const anularPago = ({ id, motivo, motivoCategoria, detalleAdicional }) => {
    if (state.role !== 'tesorero' && state.role !== 'admin') {
      showToast('Acceso denegado: Solo Tesorería puede anular recibos oficiales.', 'warning');
      return { ok: false, error: 'Permisos insuficientes' };
    }

    const pago = state.pagos.find((p) => p.id === id);
    if (!pago) return { ok: false, error: 'Recibo no encontrado' };

    const motivoFinal = motivoCategoria
      ? `${motivoCategoria}${detalleAdicional?.trim() ? ` — ${detalleAdicional.trim()}` : ''}`
      : (motivo || '').trim();

    if (!motivoFinal) {
      showToast('Debe seleccionar o indicar obligatoriamente un motivo de anulación.', 'warning');
      return { ok: false, error: 'Motivo obligatorio' };
    }

    const fechaISO = new Date().toISOString();
    const dateFormatted = fechaISO.replace('T', ' ').slice(0, 16);
    const operadorActual = state.currentUser?.cargo || `Tesorería (${state.currentUser?.nombre || 'Marta Rodríguez'})`;
    const reversoId = `REV-2026-${((state.tesoreria?.reversosContables?.length || 0) + 1).toString().padStart(3, '0')}`;

    const asientoReverso = {
      id: reversoId,
      pagoId: pago.id,
      alumnoId: pago.alumnoId,
      fecha: dateFormatted,
      medio: pago.medio,
      montoReverso: -Math.abs(pago.montoTotal),
      motivo: motivoFinal,
      operador: operadorActual,
      cuotasRevertidas: pago.cuotaIds
    };

    const auditEntry = {
      id: `AUD-ANU-${Date.now()}`,
      id_usuario: state.currentUser?.id || 2,
      id_estudiante: pago.alumnoId,
      recibo_id: pago.id,
      reverso_id: reversoId,
      fecha: fechaISO,
      timestamp: dateFormatted,
      usuario: operadorActual,
      accion: 'ANULACION_RECIBO_Y_REVERSO_CONTABLE',
      motivo: motivoFinal,
      estado_previo: pago.estado || 'valido',
      estado_nuevo: 'ANULADO',
      detalle: `Borrado lógico de recibo ${id} (estado = 'ANULADO'). Reverso contable emitido: ${reversoId} por -$${pago.montoTotal.toLocaleString('es-AR')} (${pago.medio}). ${pago.cuotaIds.length} cuota(s) revertida(s) a Pendiente. Motivo auditado: "${motivoFinal}".`
    };

    setState((prev) => ({
      ...prev,
      pagos: prev.pagos.map((p) =>
        p.id === id
          ? {
              ...p,
              estado: 'ANULADO',
              validadoTesoreria: false,
              motivoAnulacion: motivoFinal,
              fechaAnulacion: dateFormatted,
              anuladoPor: operadorActual,
              reversoContableId: reversoId,
              reversoContableMonto: -Math.abs(p.montoTotal)
            }
          : p
      ),
      cuotas: prev.cuotas.map((c) =>
        pago.cuotaIds.includes(c.id)
          ? { ...c, estado: 'pendiente', pagoId: null }
          : c
      ),
      tesoreria: {
        ...prev.tesoreria,
        reversosContables: [asientoReverso, ...(prev.tesoreria?.reversosContables || [])]
      },
      auditLogs: [auditEntry, ...prev.auditLogs]
    }));

    showToast(`Recibo ${id} ANULADO. Reverso contable ${reversoId} emitido y cuotas revertidas.`, 'warning');
    return { ok: true, reversoId, auditEntry };
  };

  // 10. Tesorero.validarPago() — Conciliación Bancaria e Imputación a Bancos / Caja
  const validarPagoTesoreria = (pagoId, observacionesConciliacion = '') => {
    if (state.role !== 'tesorero' && state.role !== 'admin') {
      showToast('Solo Tesorería puede visar y conciliar asientos contables.', 'warning');
      return { ok: false };
    }

    const pago = state.pagos.find((p) => p.id === pagoId);
    if (!pago) return { ok: false };

    const fechaISO = new Date().toISOString();
    const dateFormatted = fechaISO.replace('T', ' ').slice(0, 16);
    const operadorActual = state.currentUser?.cargo || `Tesorería (${state.currentUser?.nombre || 'Marta Rodríguez'})`;
    const destinoFondo = pago.medio === 'Efectivo' ? 'Efectivo en Caja Escolar' : 'Bancos / Cuentas Digitales';

    setState((prev) => ({
      ...prev,
      pagos: prev.pagos.map((p) =>
        p.id === pagoId
          ? {
              ...p,
              estado: 'valido',
              validadoTesoreria: true,
              fechaConciliacion: dateFormatted,
              conciliadoPor: operadorActual,
              observaciones: observacionesConciliacion
                ? `${p.observaciones ? p.observaciones + ' • ' : ''}[Conciliado: ${observacionesConciliacion}]`
                : p.observaciones
            }
          : p
      ),
      auditLogs: [
        {
          id: `AUD-CONC-${Date.now()}`,
          id_usuario: prev.currentUser?.id || 2,
          id_estudiante: pago.alumnoId,
          recibo_id: pagoId,
          fecha: fechaISO,
          timestamp: dateFormatted,
          usuario: operadorActual,
          accion: pago.medio === 'Efectivo' ? 'PAGO_VISADO_CAJA' : 'CONCILIACION_BANCARIA_APROBADA',
          motivo: observacionesConciliacion || 'Verificación exitosa de comprobante y extracto',
          estado_previo: 'Pend. Visado',
          estado_nuevo: 'Validado',
          detalle: `Recibo ${pagoId} ($${pago.montoTotal.toLocaleString('es-AR')} - ${pago.medio} Ref: ${pago.comprobante}) visado y conciliado en Tesorería. Fondos imputados a: ${destinoFondo}.`
        },
        ...prev.auditLogs
      ]
    }));

    showToast(`Recibo ${pagoId} conciliado e imputado a ${destinoFondo}.`, 'success');
    return { ok: true };
  };

  // 10b. Tesorería: Rechazar Comprobante Bancario en Modal Split-View
  const rechazarComprobanteTesoreria = ({ pagoId, motivoRechazo }) => {
    if (state.role !== 'tesorero' && state.role !== 'admin') {
      showToast('Solo Tesorería puede rechazar comprobantes bancarios.', 'warning');
      return { ok: false, error: 'Permisos insuficientes' };
    }

    if (!motivoRechazo || !motivoRechazo.trim()) {
      showToast('Debe indicar el motivo del rechazo del comprobante al usuario.', 'warning');
      return { ok: false, error: 'Motivo de rechazo obligatorio' };
    }

    return anularPago({
      id: pagoId,
      motivoCategoria: 'Transferencia no acreditada / Comprobante rechazado',
      detalleAdicional: motivoRechazo.trim()
    });
  };

  // 10c. Tesorería: Arqueo de Turno / Conteo Rápido de Billetes Físicos
  const registrarArqueoCaja = ({
    turno = 'Actual',
    conteoBilletes,
    otrosValores = 0,
    efectivoContado,
    efectivoEsperado,
    diferencia,
    observaciones = ''
  }) => {
    if (state.role !== 'tesorero' && state.role !== 'admin') {
      showToast('Solo Tesorería puede registrar actas de arqueo de caja.', 'warning');
      return { ok: false };
    }

    const fechaHora = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const nextNum = (state.tesoreria?.arqueos?.length || 0) + 1;
    const arqueoId = `ARQ-2026-${nextNum.toString().padStart(3, '0')}`;
    const estadoArqueo =
      diferencia === 0 ? 'CUADRADO' : diferencia < 0 ? 'FALTANTE' : 'SOBRANTE';
    const responsable = `${state.currentUser?.nombre || 'Marta Rodríguez'} (${state.currentUser?.cargo || 'Tesorería'})`;

    const nuevoArqueo = {
      id: arqueoId,
      fecha: fechaHora,
      turno,
      responsable,
      conteoBilletes,
      otrosValores: Number(otrosValores) || 0,
      efectivoEsperado: Number(efectivoEsperado),
      efectivoContado: Number(efectivoContado),
      diferencia: Number(diferencia),
      estado: estadoArqueo,
      observaciones: observaciones.trim() || `Arqueo de turno ${estadoArqueo}`
    };

    setState((prev) => ({
      ...prev,
      tesoreria: {
        ...prev.tesoreria,
        arqueos: [nuevoArqueo, ...(prev.tesoreria?.arqueos || [])]
      },
      auditLogs: [
        createAuditEntry(
          'Tesorería',
          'ARQUEO_CAJA_TURNO',
          `Acta de Arqueo ${arqueoId} (${estadoArqueo}). Efectivo esperado en sistema: $${Number(efectivoEsperado).toLocaleString('es-AR')} | Conteo físico de billetes: $${Number(efectivoContado).toLocaleString('es-AR')} | Diferencia: ${diferencia >= 0 ? '+' : ''}$${Number(diferencia).toLocaleString('es-AR')}.${observaciones ? ` Obs: "${observaciones.trim()}"` : ''}`
        ),
        ...prev.auditLogs
      ]
    }));

    showToast(
      `Arqueo ${arqueoId} registrado (${estadoArqueo}).`,
      diferencia === 0 ? 'success' : 'warning'
    );
    return { ok: true, arqueo: nuevoArqueo };
  };

  // 10d. Sincronizar Período Fiscal Activo
  const cambiarPeriodoFiscalTesoreria = (nuevoPeriodo) => {
    setState((prev) => ({
      ...prev,
      tesoreria: {
        ...prev.tesoreria,
        periodoActual: nuevoPeriodo
      }
    }));
  };

  // 11. Tesoreria: Registrar Egreso y cerrarPeriodo()
  const registrarEgresoTesoreria = ({ concepto, categoria, medioPago = 'Efectivo', importe, comprobante, fecha }) => {
    if (state.role !== 'tesorero' && state.role !== 'admin') {
      showToast('Solo Tesorería puede registrar egresos de caja.', 'warning');
      return;
    }
    const nextNum = (state.tesoreria.egresos?.length || 0) + 1;
    const nuevoEgreso = {
      id: `EGR-2026-${nextNum.toString().padStart(3, '0')}`,
      fecha: fecha || new Date().toISOString().split('T')[0],
      concepto: concepto.trim(),
      categoria: categoria || 'Mantenimiento',
      medioPago: medioPago || 'Efectivo',
      importe: Number(importe),
      comprobante: comprobante.trim() || 'S/C',
      autorizadoPor: `Tesorería (${state.currentUser?.nombre || 'Marta Rodríguez'})`
    };

    setState((prev) => ({
      ...prev,
      tesoreria: {
        ...prev.tesoreria,
        egresos: [nuevoEgreso, ...(prev.tesoreria.egresos || [])]
      },
      auditLogs: [
        createAuditEntry(
          'Tesorería',
          'EGRESO_REGISTRADO',
          `Registro de gasto ${nuevoEgreso.id} por $${nuevoEgreso.importe.toLocaleString('es-AR')} (${nuevoEgreso.medioPago} — ${nuevoEgreso.concepto}).`
        ),
        ...prev.auditLogs
      ]
    }));
    showToast(`Egreso ${nuevoEgreso.id} asentado en Tesorería (${nuevoEgreso.medioPago}).`, 'success');
  };

  const cerrarPeriodoTesoreria = (cierreData) => {
    if (state.role !== 'tesorero' && state.role !== 'admin') {
      showToast('Solo Tesorería está autorizada a cerrar períodos contables.', 'warning');
      return { ok: false, error: 'Permisos insuficientes' };
    }

    const isObject = typeof cierreData === 'object' && cierreData !== null;
    const nombrePeriodo = isObject ? (cierreData.periodo || state.tesoreria.periodoActual) : (cierreData || state.tesoreria.periodoActual);
    const observaciones = isObject ? (cierreData.observaciones || '') : '';

    const pagosValidos = state.pagos.filter((p) => String(p.estado || '').toUpperCase() !== 'ANULADO');
    const ingresosEfectivo = pagosValidos
      .filter((p) => p.medio === 'Efectivo')
      .reduce((acc, p) => acc + p.montoTotal, 0);
    const ingresosBanco = pagosValidos
      .filter((p) => p.medio !== 'Efectivo')
      .reduce((acc, p) => acc + p.montoTotal, 0);
    const ingresosValidos = ingresosEfectivo + ingresosBanco;

    const egresosList = state.tesoreria.egresos || [];
    const egresosEfectivo = egresosList
      .filter((e) => e.medioPago === 'Efectivo')
      .reduce((acc, e) => acc + e.importe, 0);
    const egresosBanco = egresosList
      .filter((e) => e.medioPago !== 'Efectivo')
      .reduce((acc, e) => acc + e.importe, 0);
    const egresosTotales = egresosEfectivo + egresosBanco;

    const saldoInicialEfectivo = state.tesoreria.saldoInicialEfectivo ?? 250000;
    const saldoInicialBanco = state.tesoreria.saldoInicialBanco ?? 680000;
    const saldoInicial = state.tesoreria.saldoInicial || (saldoInicialEfectivo + saldoInicialBanco);

    const saldoFinalEfectivo = saldoInicialEfectivo + ingresosEfectivo - egresosEfectivo;
    const saldoFinalBanco = saldoInicialBanco + ingresosBanco - egresosBanco;
    const saldoFinal = saldoFinalEfectivo + saldoFinalBanco;

    const fechaHora =
      new Date().toISOString().split('T')[0] +
      ' ' +
      new Date().toTimeString().split(' ')[0].slice(0, 5);
    const responsable = state.currentUser?.cargo || `${state.currentUser?.nombre || 'Marta Rodríguez'} (Tesorera)`;

    const nuevoCierre = {
      id: `CIE-${Date.now().toString().slice(-5)}`,
      periodo: nombrePeriodo,
      fechaCierre: fechaHora,
      saldoInicial,
      saldoInicialEfectivo,
      saldoInicialBanco,
      ingresos: ingresosValidos,
      ingresosEfectivo,
      ingresosBanco,
      egresos: egresosTotales,
      egresosEfectivo,
      egresosBanco,
      saldoFinal,
      saldoFinalEfectivo,
      saldoFinalBanco,
      observaciones: observaciones || 'Cierre contable ordinario asentado y certificado por Tesorería.',
      responsable,
      estado: 'Conciliado y Firmado'
    };

    setState((prev) => ({
      ...prev,
      tesoreria: {
        ...prev.tesoreria,
        cierresPeriodo: [nuevoCierre, ...(prev.tesoreria.cierresPeriodo || [])]
      },
      auditLogs: [
        createAuditEntry(
          'Tesorería',
          'CIERRE_PERIODO',
          `Cierre contable "${nuevoCierre.periodo}" consolidado. Efectivo en caja: $${saldoFinalEfectivo.toLocaleString('es-AR')}, Bancos/Digital: $${saldoFinalBanco.toLocaleString('es-AR')}. Saldo Final Total: $${saldoFinal.toLocaleString('es-AR')}.`
        ),
        ...prev.auditLogs
      ]
    }));
    showToast(`Cierre de período "${nuevoCierre.periodo}" asentado con éxito.`, 'success');
    return { ok: true, cierre: nuevoCierre };
  };

  // --- RESPALDOS Y EXPORTACIÓN CON IDENTIDAD INSTITUCIONAL ACTUALIZADA ---
  const exportBackupJSON = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_cooperadora_dalmacio_velez_sarsfield_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Copia de seguridad (Backup JSON) descargada con éxito.', 'success');
  };

  const importBackupJSON = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!imported.alumnos || !imported.tutores || !imported.pagos) {
          throw new Error('Formato de backup inválido');
        }
        setState(imported);
        showToast('Copia de seguridad restaurada correctamente.', 'success');
      } catch (err) {
        showToast('Error al importar el archivo JSON de respaldo.', 'warning');
      }
    };
    reader.readAsText(file);
  };

  const exportPadronCSV = () => {
    const headers = ['ID Alumno', 'Apellido', 'Nombre', 'DNI', 'Curso', 'Division', 'Turno', 'Tutor', 'DNI Tutor', 'Telefono Tutor', 'Hermanos', 'Cuotas Pagadas', 'Cuotas Pendientes/Vencidas'];
    const rows = state.alumnos.map((alu) => {
      const tutor = getTutor(alu.tutorId);
      const siblings = getStudentSiblings(alu.id);
      const cuotas = getStudentCuotas(alu.id);
      const pagadas = cuotas.filter((c) => c.estado === 'pagada').length;
      const impagas = cuotas.filter((c) => c.estado !== 'pagada').length;
      return [
        alu.id,
        `"${alu.apellido}"`,
        `"${alu.nombre}"`,
        alu.dni,
        `"${alu.curso}"`,
        alu.division,
        `"${alu.turno}"`,
        `"${tutor ? `${tutor.apellido}, ${tutor.nombre}` : 'Sin tutor'}"`,
        tutor ? tutor.dni : '-',
        tutor ? tutor.telefono : '-',
        siblings.length,
        pagadas,
        impagas
      ].join(',');
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `padron_cooperadora_dalmacio_velez_sarsfield_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Planilla CSV (Excel) del padrón exportada con éxito.', 'success');
  };

  const resetDemoData = () => {
    if (
      window.confirm(
        '¿Desea restablecer todos los datos a la demostración inicial institucional de la Escuela Normal Superior Dalmacio Vélez Sársfield? Se revertirán modificaciones locales.'
      )
    ) {
      const fresh = cooperadoraApi.resetState();
      setState(fresh);
      setSelectedCuotaIds([]);
      showToast('Datos institucionales restablecidos con éxito.', 'info');
    }
  };

  return (
    <CooperadoraContext.Provider
      value={{
        state,
        isAuthenticated: Boolean(sessionToken && state.currentUser),
        activeTab,
        setActiveTab,
        selectedCuotaIds,
        setSelectedCuotaIds,
        theme,
        toggleTheme,
        toast,
        showToast,
        sessionToken,
        activeReciboId,
        setActiveReciboId,
        isLoginModalOpen,
        setIsLoginModalOpen,
        previewComprobante,
        setPreviewComprobante,
        setRole,
        iniciarSesion,
        registrarCuentaTutor,
        vincularHijoPorDni,
        cambiarCuentaTutorPortal,
        cerrarSesion,
        getStudent,
        getTutor,
        getStudentCuotas,
        getStudentSiblings,
        hasSiblingDiscount,
        selectStudent,
        toggleCuotaSelection,
        selectAllPendingForStudent,
        registrarCobro,
        subirComprobantePago,
        ajustarCuota,
        ajustarCuotasGeneral,
        registrarAlumno,
        editarAlumno,
        cambiarTutorAlumno,
        solicitarBajaMatricula,
        aprobarBajaMatricula,
        guardarTutor,
        registrarNuevaCuota,
        modificarPago,
        anularPago,
        validarPagoTesoreria,
        rechazarComprobanteTesoreria,
        registrarArqueoCaja,
        cambiarPeriodoFiscalTesoreria,
        registrarEgresoTesoreria,
        cerrarPeriodoTesoreria,
        exportBackupJSON,
        importBackupJSON,
        exportPadronCSV,
        resetDemoData,
        setState
      }}
    >
      {children}
    </CooperadoraContext.Provider>
  );
}

export function useCooperadora() {
  const context = useContext(CooperadoraContext);
  if (!context) {
    throw new Error('useCooperadora debe utilizarse dentro de un CooperadoraProvider');
  }
  return context;
}
