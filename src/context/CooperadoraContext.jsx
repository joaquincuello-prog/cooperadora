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
  const [state, setState] = useState(() => cooperadoraApi.loadState());
  const [activeTab, setActiveTab] = useState('recepcion');
  const [selectedCuotaIds, setSelectedCuotaIds] = useState([]);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cooperadora_theme_pref') || 'light';
  });
  const [toast, setToast] = useState(null);

  // Sesión segura basada en Tokens JWT
  const [sessionToken, setSessionToken] = useState(() => authService.getToken());

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
  const setRole = (role) => {
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
    } else if (role === 'tutor') {
      setActiveTab('portalTutor');
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

  const iniciarSesion = (usernameOrEmail, password) => {
    const input = (usernameOrEmail || '').trim().toLowerCase();
    const found = USUARIOS_SISTEMA.find(
      (u) =>
        (u.username.toLowerCase() === input || u.email.toLowerCase() === input) &&
        (u.password === password || u.passwordHash === password)
    );

    if (!found) {
      return { ok: false, error: 'Credenciales inválidas. Verifique su usuario/correo institucional y contraseña.' };
    }

    // Generar y almacenar token JWT seguro
    const token = authService.generateToken(found);
    authService.saveToken(token);
    setSessionToken(token);

    setState((prev) => ({
      ...prev,
      role: found.rol,
      currentUser: found,
      selectedTutorPortalId: found.tutorId || prev.selectedTutorPortalId,
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

  const cerrarSesion = () => {
    const user = state.currentUser;
    authService.removeToken();
    setSessionToken(null);
    setState((prev) => ({
      ...prev,
      auditLogs: [
        createAuditEntry(
          user?.cargo || 'Usuario',
          'CIERRE_SESION_JWT',
          `Cierre de sesión de ${user?.nombre || 'usuario'} (${user?.email || '-'}). Token revocado.`
        ),
        ...prev.auditLogs
      ]
    }));
    showToast('Sesión finalizada correctamente.', 'info');
    setIsLoginModalOpen(true);
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
  const ajustarCuotasGeneral = ({ periodo, nuevoMonto, motivoAjuste }) => {
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

    const cuotasFiltradas = state.cuotas.filter((c) => {
      const matchPeriodo = periodo === 'todos_pendientes' || c.periodo === periodo;
      return matchPeriodo && c.estado !== 'pagada';
    });

    if (cuotasFiltradas.length === 0) {
      showToast('No se encontraron cuotas pendientes para aplicar el ajuste general.', 'warning');
      return { ok: false, error: 'Sin cuotas a modificar' };
    }

    const fechaHora = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const usuarioResponsable = state.currentUser?.cargo || `${state.currentUser?.nombre} (Tesorería)`;

    setState((prev) => ({
      ...prev,
      cuotas: prev.cuotas.map((c) => {
        const matchPeriodo = periodo === 'todos_pendientes' || c.periodo === periodo;
        if (!matchPeriodo || c.estado === 'pagada') return c;

        const ajusteObj = {
          id: `AJU-GEN-${Date.now().toString().slice(-6)}`,
          fecha: fechaHora,
          usuario: usuarioResponsable,
          montoAnterior: c.monto,
          montoNuevo: montoNum,
          motivo: `[Ajuste General: ${periodo}] ${motivoAjuste.trim()}`
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
          `Reajuste arancelario general ejecutado sobre ${cuotasFiltradas.length} cuotas pendientes (${periodo}). Nuevo valor fijado: $${montoNum.toLocaleString('es-AR')}. Motivo: "${motivoAjuste.trim()}".`
        ),
        ...prev.auditLogs
      ]
    }));

    showToast(`Ajuste general aplicado con éxito a ${cuotasFiltradas.length} cuotas.`, 'success');
    return { ok: true, cuotasAfectadas: cuotasFiltradas.length };
  };

  // 5. Secretaria.registrarAlumno() + Cooperadora.registrarSocio()
  const registrarAlumno = ({ alumnoData, tutorMode, tutorExistenteId, nuevoTutorData }) => {
    let targetTutorId = tutorExistenteId;
    let nuevosTutores = [...state.tutores];

    if (tutorMode === 'nuevo') {
      targetTutorId = `tut-${state.tutores.length + 1}`;
      const nuevoTutor = {
        id: targetTutorId,
        cooperadoraId: 1,
        nombre: nuevoTutorData.nombre.trim(),
        apellido: nuevoTutorData.apellido.trim(),
        dni: nuevoTutorData.dni.trim(),
        telefono: nuevoTutorData.telefono?.trim() || 'S/D',
        email: nuevoTutorData.email?.trim() || 'S/D',
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
      curso: alumnoData.curso,
      division: alumnoData.division,
      turno: alumnoData.turno,
      tutorId: targetTutorId
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
    const isEdit = Boolean(tutorData.id);
    if (isEdit) {
      setState((prev) => ({
        ...prev,
        tutores: prev.tutores.map((t) =>
          t.id === tutorData.id ? { ...t, ...tutorData } : t
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
    } else {
      const newId = `tut-${state.tutores.length + 1}`;
      const nuevoSocio = {
        id: newId,
        cooperadoraId: 1,
        nombre: tutorData.nombre.trim(),
        apellido: tutorData.apellido.trim(),
        dni: tutorData.dni.trim(),
        telefono: tutorData.telefono?.trim() || 'S/D',
        email: tutorData.email?.trim() || 'S/D',
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
    }
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

  // 9. Tesorería: Anular Pago revirtiendo cuotas
  const anularPago = ({ id, motivo }) => {
    if (state.role !== 'tesorero' && state.role !== 'admin') {
      showToast('Acceso denegado: Solo Tesorería puede anular pagos.', 'warning');
      return false;
    }

    const pago = state.pagos.find((p) => p.id === id);
    if (!pago) return false;

    setState((prev) => ({
      ...prev,
      pagos: prev.pagos.map((p) =>
        p.id === id ? { ...p, estado: 'anulado', motivoAnulacion: motivo } : p
      ),
      cuotas: prev.cuotas.map((c) =>
        pago.cuotaIds.includes(c.id)
          ? { ...c, estado: 'pendiente', pagoId: null }
          : c
      ),
      auditLogs: [
        createAuditEntry(
          'Tesorería',
          'PAGO_ANULADO',
          `Recibo ${id} ANULADO. Cuotas revertidas a Pendiente. Motivo obligatorio: "${motivo}".`
        ),
        ...prev.auditLogs
      ]
    }));

    showToast(`Recibo ${id} anulado. Cuotas revertidas a Pendientes.`, 'warning');
    return true;
  };

  // 10. Tesorero.validarPago()
  const validarPagoTesoreria = (pagoId) => {
    if (state.role !== 'tesorero' && state.role !== 'admin') {
      showToast('Solo Tesorería puede visar asientos contables.', 'warning');
      return;
    }
    setState((prev) => ({
      ...prev,
      pagos: prev.pagos.map((p) =>
        p.id === pagoId ? { ...p, validadoTesoreria: true } : p
      ),
      auditLogs: [
        createAuditEntry(
          'Tesorería',
          'PAGO_VALIDADO',
          `Recibo ${pagoId} visado y conciliado en Tesorería.`
        ),
        ...prev.auditLogs
      ]
    }));
    showToast(`Recibo ${pagoId} validado por Tesorería.`, 'success');
  };

  // 11. Tesoreria: Registrar Egreso y cerrarPeriodo()
  const registrarEgresoTesoreria = ({ concepto, categoria, importe, comprobante, fecha }) => {
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
          `Registro de gasto ${nuevoEgreso.id} por $${nuevoEgreso.importe.toLocaleString('es-AR')} (${nuevoEgreso.concepto}).`
        ),
        ...prev.auditLogs
      ]
    }));
    showToast(`Egreso ${nuevoEgreso.id} asentado en Tesorería.`, 'success');
  };

  const cerrarPeriodoTesoreria = (nombrePeriodo) => {
    if (state.role !== 'tesorero' && state.role !== 'admin') {
      showToast('Solo Tesorería está autorizada a cerrar períodos contables.', 'warning');
      return;
    }
    const ingresosValidos = state.pagos
      .filter((p) => p.estado !== 'anulado')
      .reduce((acc, p) => acc + p.montoTotal, 0);
    const egresosTotales = (state.tesoreria.egresos || []).reduce(
      (acc, e) => acc + e.importe,
      0
    );
    const saldoInicial = state.tesoreria.saldoInicial || 0;
    const saldoFinal = saldoInicial + ingresosValidos - egresosTotales;

    const nuevoCierre = {
      id: `CIE-${Date.now().toString().slice(-5)}`,
      periodo: nombrePeriodo || state.tesoreria.periodoActual,
      fechaCierre:
        new Date().toISOString().split('T')[0] +
        ' ' +
        new Date().toTimeString().split(' ')[0].slice(0, 5),
      saldoInicial,
      ingresos: ingresosValidos,
      egresos: egresosTotales,
      saldoFinal,
      responsable: state.currentUser?.nombre || 'Marta Rodríguez (Tesorera)'
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
          `Cierre contable "${nuevoCierre.periodo}" consolidado. Saldo final en caja: $${saldoFinal.toLocaleString('es-AR')}.`
        ),
        ...prev.auditLogs
      ]
    }));

    showToast(`Período "${nuevoCierre.periodo}" cerrado y balance consolidado.`, 'success');
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
        guardarTutor,
        registrarNuevaCuota,
        modificarPago,
        anularPago,
        validarPagoTesoreria,
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
