import React, { createContext, useContext, useState, useEffect } from 'react';
import { cooperadoraApi } from '../services/cooperadoraApi';
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

  // Modales globales
  const [activeReciboId, setActiveReciboId] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Sincronizar en localStorage cada vez que cambia state
  useEffect(() => {
    cooperadoraApi.saveState(state);
  }, [state]);

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

  // --- AUTENTICACIÓN Y CAMBIO DE ROL (RNF-01, RF-09) ---
  const setRole = (role) => {
    const matchingUser =
      USUARIOS_SISTEMA.find((u) => u.rol === role) || USUARIOS_SISTEMA[0];
    setState((prev) => ({
      ...prev,
      role,
      currentUser: matchingUser
    }));

    // Redirección inteligente según el Caso de Uso del Rol
    if (role === 'director' && (activeTab === 'recepcion' || activeTab === 'tesoreria')) {
      setActiveTab('reportes');
    } else if (role === 'tutor') {
      setActiveTab('portalTutor');
    }

    const roleNames = {
      secretaria: 'Secretaría (Operativo)',
      tesorero: 'Tesorero (Fiscal y Auditoría)',
      director: 'Director (Consulta de Reportes)',
      tutor: 'Padre / Tutor (Autogestión Familiar)'
    };
    showToast(`Rol activo: ${roleNames[role] || role}`, 'info');
  };

  const iniciarSesion = (username, password) => {
    const found = USUARIOS_SISTEMA.find(
      (u) =>
        (u.username.toLowerCase() === username.toLowerCase() ||
          u.email.toLowerCase() === username.toLowerCase()) &&
        u.password === password
    );
    if (!found) {
      return { ok: false, error: 'Credenciales inválidas. Verifique usuario y contraseña.' };
    }
    setState((prev) => ({
      ...prev,
      role: found.rol,
      currentUser: found,
      selectedTutorPortalId: found.tutorId || prev.selectedTutorPortalId,
      auditLogs: [
        createAuditEntry(found.cargo, 'INICIO_SESION', `Acceso autenticado de ${found.nombre} (${found.email}).`),
        ...prev.auditLogs
      ]
    }));
    if (found.rol === 'director') setActiveTab('reportes');
    if (found.rol === 'tutor') setActiveTab('portalTutor');
    if (found.rol === 'secretaria') setActiveTab('recepcion');
    if (found.rol === 'tesorero') setActiveTab('tesoreria');

    setIsLoginModalOpen(false);
    showToast(`Bienvenido/a, ${found.nombre} (${found.cargo})`, 'success');
    return { ok: true };
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

  // --- MÉTODOS DEL DIAGRAMA DE CLASES ---

  // 1. Pago.registrar() + Comprobante.emitir() (RF-04, RF-05, RF-07, HU-02, HU-04)
  const registrarCobro = ({
    studentId,
    cuotaIds,
    medio,
    comprobanteRef,
    fecha,
    aplicarRecargoMora = false,
    observaciones = ''
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

    // calcularRecargo() en clase Cuota si tiene cuotas vencidas y se activa
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
        ? `Tesorero (${state.currentUser?.nombre || 'Marta Rodríguez'})`
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
          prev.role === 'tesorero' ? 'Tesorero' : 'Secretaría',
          'COBRO_REGISTRADO',
          `Emisión de comprobante ${reciboId} a ${student.apellido}, ${student.nombre}. Total: $${total.toLocaleString('es-AR')} (${medio} Ref: ${comprobanteRef}).`
        ),
        ...prev.auditLogs
      ]
    }));

    setSelectedCuotaIds([]);
    showToast(`Cobro registrado con éxito: ${reciboId}`, 'success');
    setActiveReciboId(reciboId);
    return nuevoPago;
  };

  // 2. Secretaria.registrarAlumno() + Cooperadora.registrarSocio() (RF-01, RF-02, HU-01)
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
      pagoId: null
    }));

    setState((prev) => ({
      ...prev,
      tutores: nuevosTutores,
      alumnos: [...prev.alumnos, nuevoAlumno],
      cuotas: [...prev.cuotas, ...nuevasCuotas],
      auditLogs: [
        createAuditEntry(
          prev.role === 'tesorero' ? 'Tesorero' : 'Secretaría',
          'MATRICULACION_ALUMNO',
          `Alta de alumno ${nuevoAlumno.apellido}, ${nuevoAlumno.nombre} (DNI ${nuevoAlumno.dni}, ${nuevoAlumno.curso} "${nuevoAlumno.division}") asociado al socio/tutor ${targetTutorId}.`
        ),
        ...prev.auditLogs
      ]
    }));

    showToast(`Alumno matriculado: ${nuevoAlumno.nombre} ${nuevoAlumno.apellido}`, 'success');
    return nuevoAlumno;
  };

  // 3. Socio.actualizarDatos() y Alta independiente de Socio/Tutor (Diagrama de Clases: Socio)
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
            prev.role === 'tesorero' ? 'Tesorero' : 'Secretaría',
            'SOCIO_ACTUALIZADO',
            `Socio.actualizarDatos(): Se actualizaron datos del tutor ${tutorData.apellido}, ${tutorData.nombre} (DNI ${tutorData.dni}).`
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
            prev.role === 'tesorero' ? 'Tesorero' : 'Secretaría',
            'ALTA_SOCIO_TUTOR',
            `Cooperadora.registrarSocio(): Alta del socio/tutor ${nuevoSocio.apellido}, ${nuevoSocio.nombre} (DNI ${nuevoSocio.dni}).`
          ),
          ...prev.auditLogs
        ]
      }));
      showToast(`Nuevo socio/tutor registrado: ${nuevoSocio.apellido}, ${nuevoSocio.nombre}`, 'success');
    }
  };

  // 4. Secretaria.gestionarCuotas() / Cuota.gestionar() (RF-03, Caso de Uso C: Registrar cuota)
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
      pagoId: null
    }));

    setState((prev) => ({
      ...prev,
      cuotas: [...prev.cuotas, ...cuotasCreadas],
      auditLogs: [
        createAuditEntry(
          prev.role === 'tesorero' ? 'Tesorero' : 'Secretaría',
          'CUOTA_REGISTRADA',
          `Cuota.gestionar(): Se generó el cargo "${concepto}" ($${Number(monto).toLocaleString('es-AR')}) para ${targetAlumnos.length} alumno(s).`
        ),
        ...prev.auditLogs
      ]
    }));

    showToast(`Cuota "${concepto}" registrada correctamente.`, 'success');
  };

  // 5. Tesorero: Modificar Pago (RF-10, HU-05, RNF-02)
  const modificarPago = ({ id, nuevoImporte, nuevoMedio, nuevoComprobante, motivo }) => {
    if (state.role !== 'tesorero') {
      showToast('Acceso denegado: Solo el Tesorero puede modificar pagos (RF-10).', 'warning');
      return false;
    }

    const pagoActual = state.pagos.find((p) => p.id === id);
    if (!pagoActual) return false;

    const cambioAnterior = `Monto anterior: $${pagoActual.montoTotal}, Medio anterior: ${pagoActual.medio}, Ref: ${pagoActual.comprobante}`;

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
          'Tesorero',
          'PAGO_RECTIFICADO',
          `Recibo ${id} modificado. Nuevo importe: $${Number(nuevoImporte).toLocaleString('es-AR')} (${nuevoMedio}). Motivo: "${motivo}".`
        ),
        ...prev.auditLogs
      ]
    }));

    showToast(`Pago ${id} rectificado y auditado correctamente.`, 'info');
    return true;
  };

  // 6. Tesorero: Anular / Eliminar Pago (RF-10, HU-06, Pago.anular())
  const anularPago = ({ id, motivo }) => {
    if (state.role !== 'tesorero') {
      showToast('Acceso denegado: Solo el Tesorero puede anular pagos (RF-10).', 'warning');
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
          'Tesorero',
          'PAGO_ANULADO',
          `Recibo ${id} ANULADO. Cuotas revertidas a estado Pendiente. Motivo obligatorio: "${motivo}".`
        ),
        ...prev.auditLogs
      ]
    }));

    showToast(`Recibo ${id} anulado. Cuotas revertidas a Pendientes.`, 'warning');
    return true;
  };

  // 7. Tesorero.validarPago() (Diagrama de clases nuevo: TESORERO -> valida -> PAGO)
  const validarPagoTesoreria = (pagoId) => {
    if (state.role !== 'tesorero') {
      showToast('Solo el Tesorero puede visar y validar asientos en Tesorería.', 'warning');
      return;
    }
    setState((prev) => ({
      ...prev,
      pagos: prev.pagos.map((p) =>
        p.id === pagoId ? { ...p, validadoTesoreria: true } : p
      ),
      auditLogs: [
        createAuditEntry(
          'Tesorero',
          'PAGO_VALIDADO',
          `Tesorero.validarPago(): El recibo ${pagoId} fue visado y conciliado en Tesorería.`
        ),
        ...prev.auditLogs
      ]
    }));
    showToast(`Recibo ${pagoId} validado por Tesorería.`, 'success');
  };

  // 8. Tesoreria: Registrar Egreso y cerrarPeriodo() (Diagrama de clases cooperadora y DER)
  const registrarEgresoTesoreria = ({ concepto, categoria, importe, comprobante, fecha }) => {
    if (state.role !== 'tesorero') {
      showToast('Solo el Tesorero puede registrar egresos de caja.', 'warning');
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
      autorizadoPor: `Tesorero (${state.currentUser?.nombre || 'Marta Rodríguez'})`
    };

    setState((prev) => ({
      ...prev,
      tesoreria: {
        ...prev.tesoreria,
        egresos: [nuevoEgreso, ...(prev.tesoreria.egresos || [])]
      },
      auditLogs: [
        createAuditEntry(
          'Tesorero',
          'EGRESO_REGISTRADO',
          `Tesoreria: Registro de gasto ${nuevoEgreso.id} por $${nuevoEgreso.importe.toLocaleString('es-AR')} (${nuevoEgreso.concepto}).`
        ),
        ...prev.auditLogs
      ]
    }));
    showToast(`Egreso ${nuevoEgreso.id} asentado en Tesorería.`, 'success');
  };

  const cerrarPeriodoTesoreria = (nombrePeriodo) => {
    if (state.role !== 'tesorero') {
      showToast('Solo el Tesorero está autorizado a ejecutar cerrarPeriodo().', 'warning');
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
          'Tesorero',
          'CIERRE_PERIODO',
          `Tesoreria.cerrarPeriodo(): Cierre contable "${nuevoCierre.periodo}" consolidado. Saldo final en caja: $${saldoFinal.toLocaleString('es-AR')}.`
        ),
        ...prev.auditLogs
      ]
    }));

    showToast(`Período "${nuevoCierre.periodo}" cerrado y consolidado con éxito.`, 'success');
  };

  // --- MITIGACIÓN DE AMENAZAS FODA (MÓDULO 4): COPIAS DE SEGURIDAD Y EXPORTACIÓN ---
  const exportBackupJSON = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_cooperadora_ees14_${new Date().toISOString().split('T')[0]}.json`;
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
    a.download = `padron_cooperadora_ees14_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Planilla CSV (Excel) del padrón exportada con éxito.', 'success');
  };

  const resetDemoData = () => {
    if (
      window.confirm(
        '¿Desea restablecer todos los datos a la demostración inicial? Se revertirán modificaciones, alumnos creados y cobros de prueba.'
      )
    ) {
      const fresh = cooperadoraApi.resetState();
      setState(fresh);
      setSelectedCuotaIds([]);
      showToast('Datos de demostración restablecidos con éxito.', 'info');
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
        activeReciboId,
        setActiveReciboId,
        isLoginModalOpen,
        setIsLoginModalOpen,
        setRole,
        iniciarSesion,
        getStudent,
        getTutor,
        getStudentCuotas,
        getStudentSiblings,
        hasSiblingDiscount,
        selectStudent,
        toggleCuotaSelection,
        selectAllPendingForStudent,
        registrarCobro,
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
