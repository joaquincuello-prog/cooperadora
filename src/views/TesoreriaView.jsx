import React, { useState, useMemo, useEffect } from 'react';
import { useCooperadora } from '../context/CooperadoraContext';
import { MESES_CICLO, CUOTA_BASE } from '../data/mockData';

const DENOMINACIONES_BILLETES = [
  { valor: 20000, label: '$20.000', color: 'bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300' },
  { valor: 10000, label: '$10.000', color: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300' },
  { valor: 2000, label: '$2.000', color: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300' },
  { valor: 1000, label: '$1.000', color: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300' },
  { valor: 500, label: '$500', color: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' },
  { valor: 200, label: '$200', color: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300' },
  { valor: 100, label: '$100', color: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300' }
];

const PERIODOS_FISCALES = [
  { codigo: '2026-TODOS', mesPrefijo: '2026', label: 'Ciclo Fiscal 2026 (Completo)', mesNombre: 'Ciclo 2026', fechaRef: '2026-05-21' },
  { codigo: '2026-03', mesPrefijo: '2026-03', label: '2026-03 (Marzo 2026)', mesNombre: 'Marzo 2026', fechaRef: '2026-03-18' },
  { codigo: '2026-04', mesPrefijo: '2026-04', label: '2026-04 (Abril 2026)', mesNombre: 'Abril 2026', fechaRef: '2026-04-14' },
  { codigo: '2026-05', mesPrefijo: '2026-05', label: '2026-05 (Mayo 2026)', mesNombre: 'Mayo 2026', fechaRef: '2026-05-21' },
  { codigo: '2026-06', mesPrefijo: '2026-06', label: '2026-06 (Junio 2026)', mesNombre: 'Junio 2026', fechaRef: '2026-06-10' },
  { codigo: '2026-07', mesPrefijo: '2026-07', label: '2026-07 (Julio 2026)', mesNombre: 'Julio 2026', fechaRef: '2026-07-10' },
  { codigo: '2026-08', mesPrefijo: '2026-08', label: '2026-08 (Agosto 2026)', mesNombre: 'Agosto 2026', fechaRef: '2026-08-10' },
  { codigo: '2026-09', mesPrefijo: '2026-09', label: '2026-09 (Septiembre 2026)', mesNombre: 'Septiembre 2026', fechaRef: '2026-09-10' },
  { codigo: '2026-10', mesPrefijo: '2026-10', label: '2026-10 (Octubre 2026)', mesNombre: 'Octubre 2026', fechaRef: '2026-10-10' },
  { codigo: '2026-11', mesPrefijo: '2026-11', label: '2026-11 (Noviembre 2026)', mesNombre: 'Noviembre 2026', fechaRef: '2026-11-10' },
  { codigo: '2026-12', mesPrefijo: '2026-12', label: '2026-12 (Diciembre 2026)', mesNombre: 'Diciembre 2026', fechaRef: '2026-12-10' }
];

const MOTIVOS_ANULACION_TIPIFICADOS = [
  {
    id: 'Error de imputación',
    titulo: 'Error de imputación',
    descripcion: 'El cobro fue cargado al estudiante, cuota o medio de pago equivocado.'
  },
  {
    id: 'Transferencia no acreditada',
    titulo: 'Transferencia no acreditada',
    descripcion: 'Los fondos no impactaron en el extracto bancario o el comprobante es inválido.'
  },
  {
    id: 'Duplicado',
    titulo: 'Duplicado',
    descripcion: 'El recibo fue emitido por duplicado para una misma operación ya registrada.'
  }
];

/**
 * Analiza las cuotas y conceptos abonados en un recibo para colapsar
 * automáticamente cuando agrupe 3 o más cuotas ("N Cuotas (Mes Inicio – Mes Fin AAAA)")
 * y calcular el desglose detallado mes por mes.
 */
function analizarConceptosRecibo(pago, allCuotas) {
  const cuotasAsociadas = (pago.cuotaIds || [])
    .map((cid) => allCuotas.find((c) => c.id === cid))
    .filter(Boolean)
    .sort((a, b) => (a.mesId || 99) - (b.mesId || 99));

  const count = Math.max(cuotasAsociadas.length, (pago.conceptos || []).length, 1);
  const tieneDescuento = Number(pago.descuento || 0) > 0;
  const pctDescuento =
    pago.montoSubtotal > 0 && tieneDescuento
      ? Math.round((pago.descuento / pago.montoSubtotal) * 100)
      : 20;

  const unitSubtotal = Math.round((pago.montoSubtotal || pago.montoTotal) / count);
  const unitDescuento = Math.round((pago.descuento || 0) / count);
  const unitNeto = Math.round(pago.montoTotal / count);

  const desgloseMensual =
    cuotasAsociadas.length > 0
      ? cuotasAsociadas.map((c) => {
          const mesObj = MESES_CICLO.find((m) => m.id === c.mesId);
          const base = c.monto || unitSubtotal || CUOTA_BASE;
          const desc = tieneDescuento ? Math.round(base * (pctDescuento / 100)) : 0;
          return {
            id: c.id,
            mesNombre: mesObj ? `${mesObj.nombre} 2026` : c.concepto,
            periodo: c.periodo || '2026',
            importeBase: base,
            descuento: desc,
            importeNeto: base - desc
          };
        })
      : (pago.conceptos || []).map((conc, idx) => ({
          id: `${pago.id}-item-${idx}`,
          mesNombre: conc.replace(/\s*\(Hermano.*?\)/i, ''),
          periodo: pago.fecha?.slice(0, 7) || '2026',
          importeBase: unitSubtotal,
          descuento: unitDescuento,
          importeNeto: unitNeto
        }));

  const esColapsable = count >= 3;

  let badgeCompacto = '';
  if (esColapsable) {
    if (cuotasAsociadas.length >= 3) {
      const firstMes = MESES_CICLO.find((m) => m.id === cuotasAsociadas[0].mesId)?.nombre || cuotasAsociadas[0].concepto;
      const lastMes =
        MESES_CICLO.find((m) => m.id === cuotasAsociadas[cuotasAsociadas.length - 1].mesId)?.nombre ||
        cuotasAsociadas[cuotasAsociadas.length - 1].concepto;
      const anio = (cuotasAsociadas[0].periodo || '2026').split('-')[0] || '2026';
      badgeCompacto = `${count} Cuotas (${firstMes} – ${lastMes} ${anio})`;
    } else {
      const extraerMes = (str) => {
        const match = str.match(/(Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)/i);
        return match ? match[1] : str;
      };
      const inicio = extraerMes(pago.conceptos[0] || '');
      const fin = extraerMes(pago.conceptos[pago.conceptos.length - 1] || '');
      badgeCompacto = `${count} Cuotas (${inicio} – ${fin} 2026)`;
    }
  }

  return {
    count,
    esColapsable,
    badgeCompacto,
    tieneDescuento,
    pctDescuento,
    desgloseMensual
  };
}

export default function TesoreriaView() {
  const {
    state,
    getStudent,
    getTutor,
    getStudentCuotas,
    setActiveReciboId,
    setPreviewComprobante,
    anularPago,
    validarPagoTesoreria,
    registrarArqueoCaja,
    cambiarPeriodoFiscalTesoreria,
    registrarEgresoTesoreria,
    cerrarPeriodoTesoreria,
    ajustarCuota,
    ajustarCuotasGeneral
  } = useCooperadora();

  const isTesorero = state.role === 'tesorero' || state.role === 'admin';

  // Subpestañas del módulo de Tesorería
  const [subTab, setSubTab] = useState('cobros'); // 'cobros' | 'cuotas' | 'egresos' | 'auditoria'

  // =========================================================================
  // 5. BARRA DE HERRAMIENTAS Y FILTROS OPERATIVOS SINCRONIZADOS
  // =========================================================================
  const [searchCobros, setSearchCobros] = useState('');
  const [filtroMedioPago, setFiltroMedioPago] = useState('todos'); // 'todos' | 'efectivo' | 'transferencias'
  const [filtroEstadoCobro, setFiltroEstadoCobro] = useState('todos'); // 'todos' | 'pendientes' | 'conciliados' | 'anulados'
  const [periodoFiscalSeleccionado, setPeriodoFiscalSeleccionado] = useState('2026-TODOS');
  const [rangoFechaRapido, setRangoFechaRapido] = useState('periodo'); // 'periodo' | 'hoy' | 'semana' | 'mes'

  // Control de desglose expandible de conceptos (Requerimiento 2) y menú contextual ⋮ (Requerimiento 3)
  const [expandedConceptoId, setExpandedConceptoId] = useState(null);
  const [openMenuPagoId, setOpenMenuPagoId] = useState(null);

  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuPagoId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Sincronización coherente entre Selector de Período Fiscal y Selector Rápido de Fechas
  const handleSelectPeriodoFiscal = (nuevoCodigo) => {
    setPeriodoFiscalSeleccionado(nuevoCodigo);
    const found = PERIODOS_FISCALES.find((p) => p.codigo === nuevoCodigo);
    if (found) {
      cambiarPeriodoFiscalTesoreria(found.label);
    }
    if (nuevoCodigo === '2026-TODOS' && rangoFechaRapido === 'mes') {
      setRangoFechaRapido('periodo');
    } else if (nuevoCodigo !== '2026-TODOS' && rangoFechaRapido === 'periodo') {
      setRangoFechaRapido('mes');
    }
  };

  const handleSelectRangoRapido = (nuevoRango) => {
    setRangoFechaRapido(nuevoRango);
    if (nuevoRango === 'mes' && periodoFiscalSeleccionado === '2026-TODOS') {
      // Sincroniza automáticamente con el período operativo vigente (Mayo 2026)
      setPeriodoFiscalSeleccionado('2026-05');
      cambiarPeriodoFiscalTesoreria('2026-05 (Mayo 2026)');
    } else if (nuevoRango === 'periodo') {
      setPeriodoFiscalSeleccionado('2026-TODOS');
    }
  };

  // Filtros predictivos para Gestión y Ajuste de Cuotas / Cuentas Corrientes
  const [searchStudentCuotas, setSearchStudentCuotas] = useState('');
  const [selectedStudentForCuotas, setSelectedStudentForCuotas] = useState(
    state.selectedStudentId || 'alu-1'
  );

  // =========================================================================
  // ESTADO MODAL ARQUEO DE TURNO / CONTEO RÁPIDO (Requerimiento 1)
  // =========================================================================
  const [isArqueoModalOpen, setIsArqueoModalOpen] = useState(false);
  const [turnoArqueo, setTurnoArqueo] = useState('Mañana / Tarde');
  const [conteoBilletes, setConteoBilletes] = useState({
    20000: 0,
    10000: 0,
    2000: 0,
    1000: 0,
    500: 0,
    200: 0,
    100: 0
  });
  const [otrosValoresMonedas, setOtrosValoresMonedas] = useState(0);
  const [observacionesArqueo, setObservacionesArqueo] = useState('');

  // =========================================================================
  // ESTADO MODAL ANULAR RECIBO CON MOTIVO TIPIFICADO Y REVERSO (Requerimiento 3)
  // =========================================================================
  const [anularTarget, setAnularTarget] = useState(null);
  const [motivoCategoriaAnulacion, setMotivoCategoriaAnulacion] = useState('Error de imputación');
  const [detalleAnulacion, setDetalleAnulacion] = useState('');
  const [errorAnulacion, setErrorAnulacion] = useState('');

  // Estado Modal Reajuste General Masivo (10 Meses del Ciclo Lectivo)
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);
  const [selectedPeriodosGeneral, setSelectedPeriodosGeneral] = useState(
    MESES_CICLO.map((m) => m.periodo)
  );
  const [montoGeneral, setMontoGeneral] = useState(5500);
  const [motivoGeneral, setMotivoGeneral] = useState(
    'Actualización arancelaria aprobada en asamblea general de cooperadora'
  );

  const togglePeriodoGeneral = (periodo) => {
    setSelectedPeriodosGeneral((prev) =>
      prev.includes(periodo) ? prev.filter((p) => p !== periodo) : [...prev, periodo]
    );
  };
  const selectAllPeriodosGeneral = () => {
    setSelectedPeriodosGeneral(MESES_CICLO.map((m) => m.periodo));
  };
  const deselectAllPeriodosGeneral = () => {
    setSelectedPeriodosGeneral([]);
  };

  // Estado Modal Ver Historial de Auditoría de una Cuota
  const [cuotaHistorialTarget, setCuotaHistorialTarget] = useState(null);

  // Estado Modal Registrar Egreso
  const [isEgresoModalOpen, setIsEgresoModalOpen] = useState(false);
  const [egresoConcepto, setEgresoConcepto] = useState('');
  const [egresoCategoria, setEgresoCategoria] = useState('Mantenimiento Edilicio');
  const [egresoMedioPago, setEgresoMedioPago] = useState('Efectivo');
  const [egresoImporte, setEgresoImporte] = useState('');
  const [egresoComprobante, setEgresoComprobante] = useState('');

  // Estado Modal Cerrar Período y Acta Oficial
  const [isCierreModalOpen, setIsCierreModalOpen] = useState(false);
  const [nombrePeriodoCierre, setNombrePeriodoCierre] = useState('Mayo 2026');
  const [observacionesCierre, setObservacionesCierre] = useState(
    'Cierre contable ordinario consolidado con verificación física de caja y cuentas bancarias.'
  );
  const [actaCierreTarget, setActaCierreTarget] = useState(null);

  // =========================================================================
  // 1. CÁLCULOS Y DESGLOSE CONTABLE DE SALDOS (FÍSICO VS. DIGITAL)
  // =========================================================================
  const isPagoAnulado = (p) => String(p.estado || '').toUpperCase() === 'ANULADO';

  const saldoInicialTotal = state.tesoreria?.saldoInicial ?? 125000;
  const saldoInicialEfectivo = state.tesoreria?.saldoInicialEfectivo ?? 45000;
  const saldoInicialBanco =
    state.tesoreria?.saldoInicialBanco ?? saldoInicialTotal - saldoInicialEfectivo;

  const pagosValidos = useMemo(
    () => state.pagos.filter((p) => !isPagoAnulado(p)),
    [state.pagos]
  );

  // Efectivo cobrado por ventanilla
  const ingresosEfectivoCobrado = useMemo(
    () =>
      pagosValidos
        .filter((p) => p.medio === 'Efectivo')
        .reduce((acc, p) => acc + p.montoTotal, 0),
    [pagosValidos]
  );

  // Transferencias / Mercado Pago YA VALIDADAS (conciliadas en banco)
  const ingresosBancoValidados = useMemo(
    () =>
      pagosValidos
        .filter((p) => p.medio !== 'Efectivo' && p.validadoTesoreria)
        .reduce((acc, p) => acc + p.montoTotal, 0),
    [pagosValidos]
  );

  // Transferencias pendientes de visado (en tránsito)
  const ingresosBancoPendientes = useMemo(
    () =>
      pagosValidos
        .filter((p) => p.medio !== 'Efectivo' && !p.validadoTesoreria)
        .reduce((acc, p) => acc + p.montoTotal, 0),
    [pagosValidos]
  );

  const ingresosTotales = ingresosEfectivoCobrado + ingresosBancoValidados + ingresosBancoPendientes;

  const egresosLista = state.tesoreria?.egresos || [];
  const egresosTotales = egresosLista.reduce((acc, e) => acc + e.importe, 0);

  const egresosEfectivo = egresosLista
    .filter((e) => (e.medioPago || 'Efectivo') === 'Efectivo')
    .reduce((acc, e) => acc + e.importe, 0);

  const egresosBanco = egresosLista
    .filter((e) => e.medioPago && e.medioPago !== 'Efectivo')
    .reduce((acc, e) => acc + e.importe, 0);

  // Subtotales disponibles:
  // 1) Efectivo en Caja Escolar (billetes físicos disponibles para caja chica)
  const efectivoEnCajaEscolar =
    saldoInicialEfectivo + ingresosEfectivoCobrado - egresosEfectivo;

  // 2) Bancos / Cuentas Digitales (fondos recaudados vía transferencia/Mercado Pago ya validados)
  const bancosCuentasDigitales =
    saldoInicialBanco + ingresosBancoValidados - egresosBanco;

  // Saldo Neto Disponible en Caja (Efectivo físico + Bancos conciliados)
  const saldoNetoDisponible = efectivoEnCajaEscolar + bancosCuentasDigitales;

  // Cálculos del Modal de Arqueo de Turno en tiempo real
  const totalBilletesContados = Object.entries(conteoBilletes).reduce(
    (acc, [denom, cant]) => acc + Number(denom) * (Number(cant) || 0),
    0
  );
  const efectivoFisicoTotalContado =
    totalBilletesContados + (Number(otrosValoresMonedas) || 0);
  const diferenciaArqueo = efectivoFisicoTotalContado - efectivoEnCajaEscolar;

  const autocompletarArqueoExacto = () => {
    let restante = Math.max(0, efectivoEnCajaEscolar);
    const nuevoConteo = {};
    DENOMINACIONES_BILLETES.forEach(({ valor }) => {
      nuevoConteo[valor] = Math.floor(restante / valor);
      restante = restante % valor;
    });
    setConteoBilletes(nuevoConteo);
    setOtrosValoresMonedas(restante);
  };

  const limpiarConteoArqueo = () => {
    setConteoBilletes({
      20000: 0,
      10000: 0,
      2000: 0,
      1000: 0,
      500: 0,
      200: 0,
      100: 0
    });
    setOtrosValoresMonedas(0);
  };

  const handleGuardarArqueo = (e) => {
    e.preventDefault();
    registrarArqueoCaja({
      turno: turnoArqueo,
      conteoBilletes,
      otrosValores: otrosValoresMonedas,
      efectivoContado: efectivoFisicoTotalContado,
      efectivoEsperado: efectivoEnCajaEscolar,
      diferencia: diferenciaArqueo,
      observaciones: observacionesArqueo
    });
    setIsArqueoModalOpen(false);
    setObservacionesArqueo('');
  };

  // =========================================================================
  // FILTRADO OPERATIVO DEL LIBRO DIARIO DE COBROS (Requerimiento 5)
  // =========================================================================
  const periodoInfoActivo =
    PERIODOS_FISCALES.find((p) => p.codigo === periodoFiscalSeleccionado) ||
    PERIODOS_FISCALES[0];

  // Determinar fecha operativa de referencia sincronizada con el período fiscal
  const fechaReferenciaOperativa = useMemo(() => {
    const todayISO = new Date().toISOString().split('T')[0];
    const hayPagosHoyReal = state.pagos.some((p) => p.fecha === todayISO);
    if (hayPagosHoyReal && periodoFiscalSeleccionado === '2026-TODOS') {
      return todayISO;
    }
    const pagosDelPeriodo = state.pagos
      .filter((p) =>
        periodoFiscalSeleccionado === '2026-TODOS'
          ? true
          : p.fecha.startsWith(periodoInfoActivo.mesPrefijo)
      )
      .map((p) => p.fecha)
      .sort();
    return pagosDelPeriodo[pagosDelPeriodo.length - 1] || periodoInfoActivo.fechaRef;
  }, [state.pagos, periodoFiscalSeleccionado, periodoInfoActivo]);

  const filteredPagos = useMemo(() => {
    return state.pagos.filter((pago) => {
      const alu = getStudent(pago.alumnoId);
      const tut = getTutor(pago.tutorId);
      const q = searchCobros.trim().toLowerCase();

      // 1. Búsqueda textual
      const matchTexto =
        !q ||
        pago.id.toLowerCase().includes(q) ||
        pago.comprobante.toLowerCase().includes(q) ||
        (alu &&
          (alu.nombre.toLowerCase().includes(q) ||
            alu.apellido.toLowerCase().includes(q) ||
            alu.dni.includes(q))) ||
        (tut &&
          (tut.nombre.toLowerCase().includes(q) ||
            tut.apellido.toLowerCase().includes(q)));

      if (!matchTexto) return false;

      // 2. Segmentador por Medio de Pago: [ Todos | Solo Efectivo | Solo Transferencias ]
      if (filtroMedioPago === 'efectivo' && pago.medio !== 'Efectivo') return false;
      if (filtroMedioPago === 'transferencias' && pago.medio === 'Efectivo') return false;

      // 3. Segmentador por Estado: [ Todos | Pendientes de Visado | Conciliados | Anulados ]
      const anulado = isPagoAnulado(pago);
      if (filtroEstadoCobro === 'pendientes' && (pago.validadoTesoreria || anulado))
        return false;
      if (filtroEstadoCobro === 'conciliados' && (!pago.validadoTesoreria || anulado))
        return false;
      if (filtroEstadoCobro === 'anulados' && !anulado) return false;

      // 4. Sincronización de Período Fiscal y Selector Rápido de Fechas
      if (
        periodoFiscalSeleccionado !== '2026-TODOS' &&
        !pago.fecha.startsWith(periodoInfoActivo.mesPrefijo)
      ) {
        return false;
      }

      if (rangoFechaRapido === 'hoy') {
        return pago.fecha === fechaReferenciaOperativa;
      }

      if (rangoFechaRapido === 'semana') {
        const refDate = new Date(`${fechaReferenciaOperativa}T12:00:00`);
        const pagoDate = new Date(`${pago.fecha}T12:00:00`);
        const diffDays = Math.abs((refDate - pagoDate) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }

      if (rangoFechaRapido === 'mes') {
        const mesTarget =
          periodoFiscalSeleccionado === '2026-TODOS'
            ? fechaReferenciaOperativa.slice(0, 7)
            : periodoInfoActivo.mesPrefijo;
        return pago.fecha.startsWith(mesTarget);
      }

      return true;
    });
  }, [
    state.pagos,
    searchCobros,
    filtroMedioPago,
    filtroEstadoCobro,
    periodoFiscalSeleccionado,
    rangoFechaRapido,
    fechaReferenciaOperativa,
    periodoInfoActivo
  ]);

  // Alumnos coincidentes con la búsqueda predictiva para Cuotas
  const filteredStudentsForCuotas = state.alumnos.filter((alu) => {
    const q = searchStudentCuotas.trim().toLowerCase();
    if (!q) return true;
    return (
      alu.apellido.toLowerCase().includes(q) ||
      alu.nombre.toLowerCase().includes(q) ||
      alu.dni.includes(q) ||
      alu.curso.toLowerCase().includes(q)
    );
  });

  const activeStudentCuotas = getStudent(selectedStudentForCuotas) || state.alumnos[0];
  const activeStudentTutor = activeStudentCuotas
    ? getTutor(activeStudentCuotas.tutorId)
    : null;
  const cuotasDelAlumno = activeStudentCuotas
    ? getStudentCuotas(activeStudentCuotas.id)
    : [];

  // Handlers de Conciliación y Visor Split-View (Requerimiento 4)
  const openConciliacionSplitModal = (pago) => {
    const alu = getStudent(pago.alumnoId);
    setPreviewComprobante({
      pagoId: pago.id,
      alumnoNombre: alu ? `${alu.apellido}, ${alu.nombre}` : 'Estudiante',
      alumnoDni: alu?.dni || '-',
      comprobanteRef: pago.comprobante,
      medio: pago.medio,
      monto: pago.montoTotal,
      fecha: pago.fecha,
      adjunto: pago.comprobanteAdjunto
    });
  };

  // Handler de Confirmación Destructiva de Anulación con Reverso Contable (Requerimiento 3)
  const openAnularModal = (pago) => {
    setAnularTarget(pago);
    setMotivoCategoriaAnulacion('Error de imputación');
    setDetalleAnulacion('');
    setErrorAnulacion('');
    setOpenMenuPagoId(null);
  };

  const handleConfirmarAnulacion = (e) => {
    e.preventDefault();
    if (!anularTarget) return;
    if (!motivoCategoriaAnulacion) {
      setErrorAnulacion('Debe seleccionar obligatoriamente un motivo tipificado de anulación.');
      return;
    }
    const res = anularPago({
      id: anularTarget.id,
      motivoCategoria: motivoCategoriaAnulacion,
      detalleAdicional: detalleAnulacion.trim()
    });
    if (res?.ok !== false) {
      setAnularTarget(null);
      setDetalleAnulacion('');
    }
  };

  const totalCuotasAfectadas = useMemo(() => {
    return state.cuotas.filter(
      (c) => selectedPeriodosGeneral.includes(c.periodo) && c.estado !== 'pagada'
    ).length;
  }, [state.cuotas, selectedPeriodosGeneral]);

  const handleConfirmarAjusteGeneral = (e) => {
    e.preventDefault();
    if (!motivoGeneral.trim() || motivoGeneral.trim().length < 5) return;
    if (selectedPeriodosGeneral.length === 0) return;
    ajustarCuotasGeneral({
      periodos: selectedPeriodosGeneral,
      nuevoMonto: Number(montoGeneral),
      motivoAjuste: motivoGeneral.trim()
    });
    setIsGeneralModalOpen(false);
  };

  const handleConfirmarEgreso = (e) => {
    e.preventDefault();
    if (!egresoConcepto.trim() || !egresoImporte) return;
    registrarEgresoTesoreria({
      concepto: egresoConcepto,
      categoria: egresoCategoria,
      medioPago: egresoMedioPago,
      importe: Number(egresoImporte),
      comprobante: egresoComprobante || 'FAC-S/N'
    });
    setEgresoConcepto('');
    setEgresoImporte('');
    setEgresoComprobante('');
    setIsEgresoModalOpen(false);
  };

  const handleConfirmarCierre = (e) => {
    e.preventDefault();
    if (!nombrePeriodoCierre.trim()) return;
    cerrarPeriodoTesoreria({
      periodo: nombrePeriodoCierre.trim(),
      observaciones: observacionesCierre.trim()
    });
    setIsCierreModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. PANEL SUPERIOR: DESGLOSE CONTABLE DE SALDOS Y ARQUEO DE CAJA */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                Módulo Fiscal: Tesorería, Caja y Ajuste de Cuotas
              </span>

              {/* Selector de Período Fiscal Sincronizado */}
              <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <i className="fa-regular fa-calendar-days text-emerald-600 text-[11px]"></i>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  Período Fiscal:
                </span>
                <select
                  value={periodoFiscalSeleccionado}
                  onChange={(e) => handleSelectPeriodoFiscal(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
                >
                  {PERIODOS_FISCALES.map((pf) => (
                    <option key={pf.codigo} value={pf.codigo} className="bg-white dark:bg-slate-900">
                      {pf.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <h2 className="text-xl font-black text-slate-800 dark:text-white mt-1.5">
              Escuela Normal Superior Dalmacio Vélez Sársfield — Tesorería
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Separación contable de efectivo físico en caja chica vs. cuentas digitales conciliadas, auditoría de aranceles y reversos.
            </p>
          </div>

          {/* Botonera Principal de Acciones Operativas */}
          <div className="flex flex-wrap items-center gap-2">
            {isTesorero ? (
              <>
                <button
                  onClick={() => setIsArqueoModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1.5 shadow-sm"
                  title="Ingresar billetes físicos por denominación y contrastar contra el saldo esperado en efectivo"
                >
                  <i className="fa-solid fa-money-bill-1-wave"></i>
                  <span>Arqueo de Turno / Conteo Rápido</span>
                </button>

                <button
                  onClick={() => setIsGeneralModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition flex items-center gap-1.5"
                  title="Reajuste general de aranceles de cuotas pendientes con justificación de auditoría"
                >
                  <i className="fa-solid fa-sliders"></i>
                  <span>Reajuste General Aranceles</span>
                </button>

                <button
                  onClick={() => setIsEgresoModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-arrow-trend-down"></i>
                  <span>+ Registrar Egreso</span>
                </button>

                <button
                  onClick={() => setIsCierreModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-sm"
                >
                  <i className="fa-solid fa-file-shield"></i>
                  <span>Cierre de Período</span>
                </button>
              </>
            ) : (
              <div className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-2">
                <i className="fa-solid fa-lock text-amber-600"></i>
                <span>
                  Vista en modo consulta para <strong>{state.role?.toUpperCase()}</strong>.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 4 Tarjetas de Métricas de Caja con Desglose Físico vs. Digital en la Tarjeta de Saldo Neto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 mt-5">
          <div className="lg:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                Saldo Inicial Período
              </span>
              <p className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1">
                ${saldoInicialTotal.toLocaleString('es-AR')}
              </p>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/70 space-y-0.5">
              <div className="flex justify-between">
                <span>Caja física:</span>
                <span className="font-bold">${saldoInicialEfectivo.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between">
                <span>Banco inicial:</span>
                <span className="font-bold">${saldoInicialBanco.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">
                + Ingresos Emitidos (Válidos)
              </span>
              <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                +${ingresosTotales.toLocaleString('es-AR')}
              </p>
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono mt-2 pt-2 border-t border-emerald-200/70 dark:border-emerald-800/70 space-y-0.5">
              <div className="flex justify-between">
                <span>Recibos activos:</span>
                <span className="font-bold">{pagosValidos.length} comprobantes</span>
              </div>
              {ingresosBancoPendientes > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-300 font-bold">
                  <span>Pend. Conciliar:</span>
                  <span>${ingresosBancoPendientes.toLocaleString('es-AR')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-rose-700 dark:text-rose-400 block">
                - Egresos e Inversión
              </span>
              <p className="text-xl font-black text-rose-700 dark:text-rose-400 font-mono mt-1">
                -${egresosTotales.toLocaleString('es-AR')}
              </p>
            </div>
            <div className="text-[10px] text-rose-600 dark:text-rose-300 font-mono mt-2 pt-2 border-t border-rose-200/70 dark:border-rose-800/70 space-y-0.5">
              <div className="flex justify-between">
                <span>Caja chica:</span>
                <span className="font-bold">-${egresosEfectivo.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between">
                <span>Por banco:</span>
                <span className="font-bold">-${egresosBanco.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>

          {/* TARJETA PRINCIPAL MODIFICADA: = SALDO NETO DISPONIBLE EN CAJA (Desglose Físico vs Digital) */}
          <div className="lg:col-span-5 p-4 rounded-xl bg-slate-900 dark:bg-slate-950 text-white shadow-md border border-slate-800 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase text-amber-400 tracking-wide block">
                  = Saldo Neto Disponible en Caja
                </span>
                <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                  ${saldoNetoDisponible.toLocaleString('es-AR')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsArqueoModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[10px] font-mono font-bold transition flex items-center gap-1 shrink-0"
                title="Contrastación rápida de billetes físicos"
              >
                <i className="fa-solid fa-scale-balanced"></i>
                <span>Arquear Caja</span>
              </button>
            </div>

            {/* Desglose requerido: Efectivo en Caja Escolar vs. Bancos / Cuentas Digitales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-2.5 border-t border-slate-800">
              <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700/80">
                <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold uppercase">
                  <span>Efectivo en Caja Escolar</span>
                  <i className="fa-solid fa-money-bills"></i>
                </div>
                <p className="text-base font-black font-mono text-white mt-0.5">
                  ${efectivoEnCajaEscolar.toLocaleString('es-AR')}
                </p>
                <span className="text-[10px] text-slate-400 block">
                  Billetes físicos para caja chica
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700/80">
                <div className="flex items-center justify-between text-[10px] text-sky-300 font-bold uppercase">
                  <span>Bancos / Cuentas Digitales</span>
                  <i className="fa-solid fa-building-columns"></i>
                </div>
                <p className="text-base font-black font-mono text-sky-400 mt-0.5">
                  ${bancosCuentasDigitales.toLocaleString('es-AR')}
                </p>
                <span className="text-[10px] text-slate-400 block">
                  Transferencias / MP ya validados
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUBNAVEGACIÓN INTERNA DEL MÓDULO */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-2 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setSubTab('cobros')}
          className={`py-2.5 px-4 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            subTab === 'cobros'
              ? 'border-emerald-600 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-receipt"></i>
          <span>Libro Diario de Cobros ({state.pagos.length})</span>
        </button>

        <button
          onClick={() => setSubTab('cuotas')}
          className={`py-2.5 px-4 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            subTab === 'cuotas'
              ? 'border-emerald-600 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-calculator"></i>
          <span>Ajuste de Cuotas y Cuentas Corrientes</span>
        </button>

        <button
          onClick={() => setSubTab('egresos')}
          className={`py-2.5 px-4 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            subTab === 'egresos'
              ? 'border-emerald-600 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-coins"></i>
          <span>Egresos, Arqueos y Cierres ({egresosLista.length})</span>
        </button>

        <button
          onClick={() => setSubTab('auditoria')}
          className={`py-2.5 px-4 rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            subTab === 'auditoria'
              ? 'border-emerald-600 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-fingerprint"></i>
          <span>Bitácora de Auditoría ({state.auditLogs?.length || 0})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBPESTAÑA 1: LIBRO DIARIO DE COBROS CON BARRA DE HERRAMIENTAS ENRIQUECIDA */}
      {/* ========================================================================= */}
      {subTab === 'cobros' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-visible">
          {/* 5. BARRA DE HERRAMIENTAS Y FILTROS OPERATIVOS */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <i className="fa-solid fa-book-journal-whills text-emerald-600"></i>
                  Libro Diario de Cobros y Conciliación Bancaria
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Seguridad contable activa: los recibos emitidos son inmutables; las correcciones operan vía anulación lógica y reverso en <code className="font-mono">audit_log</code>.
                </p>
              </div>

              {/* Buscador predictivo + Selector Rápido de Rango de Fechas sincronizado */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Selector rápido de rango de fechas */}
                <div className="inline-flex items-center rounded-xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700 shadow-2xs text-xs">
                  <span className="px-2 text-[10px] font-mono uppercase font-bold text-slate-400">
                    <i className="fa-regular fa-clock mr-1"></i>
                    Fecha:
                  </span>
                  {[
                    { id: 'periodo', label: 'Período Fiscal' },
                    { id: 'hoy', label: 'Hoy' },
                    { id: 'semana', label: 'Semana actual' },
                    { id: 'mes', label: 'Mes en curso' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectRangoRapido(item.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                        rangoFechaRapido === item.id
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Buscador por Estudiante / DNI / Recibo */}
                <div className="relative min-w-[240px]">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <i className="fa-solid fa-magnifying-glass text-xs"></i>
                  </span>
                  <input
                    type="text"
                    value={searchCobros}
                    onChange={(e) => setSearchCobros(e.target.value)}
                    placeholder="Buscar alumno, DNI, recibo o ref..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                  {searchCobros && (
                    <button
                      onClick={() => setSearchCobros('')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Fila Inferior de Segmentadores Operativos (Medio de Pago y Estado) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
              {/* Segmentador rápido por Medio de Pago */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase text-slate-400">
                  Medio de Pago:
                </span>
                <div className="inline-flex rounded-xl bg-slate-200/70 dark:bg-slate-800 p-1 border border-slate-300/60 dark:border-slate-700">
                  {[
                    { id: 'todos', label: 'Todos', icon: 'fa-layer-group' },
                    { id: 'efectivo', label: 'Solo Efectivo', icon: 'fa-money-bill-wave' },
                    { id: 'transferencias', label: 'Solo Transferencias', icon: 'fa-building-columns' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setFiltroMedioPago(m.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        filtroMedioPago === m.id
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <i className={`fa-solid ${m.icon} text-[10px]`}></i>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Segmentador rápido por Estado */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase text-slate-400">
                  Estado:
                </span>
                <div className="inline-flex flex-wrap rounded-xl bg-slate-200/70 dark:bg-slate-800 p-1 border border-slate-300/60 dark:border-slate-700">
                  {[
                    { id: 'todos', label: 'Todos' },
                    {
                      id: 'pendientes',
                      label: 'Pendientes de Visado',
                      count: state.pagos.filter(
                        (p) => !p.validadoTesoreria && !isPagoAnulado(p)
                      ).length
                    },
                    {
                      id: 'conciliados',
                      label: 'Conciliados',
                      count: state.pagos.filter(
                        (p) => p.validadoTesoreria && !isPagoAnulado(p)
                      ).length
                    },
                    {
                      id: 'anulados',
                      label: 'Anulados',
                      count: state.pagos.filter((p) => isPagoAnulado(p)).length
                    }
                  ].map((est) => (
                    <button
                      key={est.id}
                      type="button"
                      onClick={() => setFiltroEstadoCobro(est.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        filtroEstadoCobro === est.id
                          ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <span>{est.label}</span>
                      {typeof est.count === 'number' && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {est.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TABLA DEL LIBRO DIARIO DE COBROS */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">Recibo / Fecha</th>
                  <th className="py-3 px-4">Estudiante & DNI</th>
                  <th className="py-3 px-4">Conceptos Abonados</th>
                  <th className="py-3 px-4">Medio & Referencia</th>
                  <th className="py-3 px-4 text-center">Comprobante Adjunto</th>
                  <th className="py-3 px-4 text-right">Monto Total</th>
                  <th className="py-3 px-4 text-center">Estado / Visado</th>
                  <th className="py-3 px-4 text-right">Acciones Contables</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {filteredPagos.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-10 text-center text-slate-400 space-y-2">
                      <i className="fa-solid fa-filter-circle-xmark text-2xl block mx-auto"></i>
                      <p>No se encontraron cobros para los filtros seleccionados.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchCobros('');
                          setFiltroMedioPago('todos');
                          setFiltroEstadoCobro('todos');
                          setPeriodoFiscalSeleccionado('2026-TODOS');
                          setRangoFechaRapido('periodo');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800"
                      >
                        Restablecer filtros operativos
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredPagos.map((pago) => {
                    const alu = getStudent(pago.alumnoId);
                    const isAnulado = isPagoAnulado(pago);
                    const tieneAdjunto = Boolean(pago.comprobanteAdjunto);
                    const infoConceptos = analizarConceptosRecibo(pago, state.cuotas);
                    const isExpanded = expandedConceptoId === pago.id;

                    return (
                      <React.Fragment key={pago.id}>
                        <tr
                          className={`transition ${
                            isAnulado
                              ? 'bg-rose-50/40 dark:bg-rose-950/20 text-slate-400'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          {/* Columna 1: Recibo / Fecha */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {pago.id}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {pago.fecha}
                            </div>
                            {isAnulado && pago.reversoContableId && (
                              <span className="inline-block mt-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                                {pago.reversoContableId}
                              </span>
                            )}
                          </td>

                          {/* Columna 2: Estudiante & DNI */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {alu ? `${alu.apellido}, ${alu.nombre}` : 'Estudiante'}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">
                              DNI: {alu ? alu.dni : '-'} • {alu ? alu.curso : ''}
                            </div>
                          </td>

                          {/* =================================================================== */}
                          {/* 2. COLUMNA CONCEPTOS ABONADOS: COLAPSO DE 3+ CUOTAS Y DESGLOSE */}
                          {/* =================================================================== */}
                          <td className="py-3.5 px-4 text-xs align-top max-w-xs">
                            {infoConceptos.esColapsable ? (
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedConceptoId(isExpanded ? null : pago.id)
                                    }
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs transition shadow-2xs"
                                    title="Haga clic para desplegar el desglose detallado de importes por mes"
                                  >
                                    <i className="fa-solid fa-layer-group text-indigo-600 dark:text-indigo-400"></i>
                                    <span>{infoConceptos.badgeCompacto}</span>
                                    <i
                                      className={`fa-solid fa-chevron-${
                                        isExpanded ? 'up' : 'down'
                                      } text-[10px] ml-0.5`}
                                    ></i>
                                  </button>

                                  {infoConceptos.tieneDescuento && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[10px] font-extrabold">
                                      <i className="fa-solid fa-tags text-[9px]"></i>
                                      <span>Desc. Hermanos -{infoConceptos.pctDescuento}%</span>
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedConceptoId(isExpanded ? null : pago.id)
                                  }
                                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                                >
                                  <span>
                                    {isExpanded
                                      ? 'Ocultar desglose mensual'
                                      : `Ver desglose detallado (${infoConceptos.count} meses)`}
                                  </span>
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="font-semibold text-slate-700 dark:text-slate-200">
                                  {pago.conceptos
                                    .map((c) => c.replace(/\s*\(Hermano.*?\)/i, ''))
                                    .join(' • ')}
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {infoConceptos.tieneDescuento && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[10px] font-extrabold">
                                      Desc. Hermanos -{infoConceptos.pctDescuento}% (-$
                                      {pago.descuento.toLocaleString('es-AR')})
                                    </span>
                                  )}
                                  {infoConceptos.count > 1 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedConceptoId(isExpanded ? null : pago.id)
                                      }
                                      className="text-[10px] text-slate-500 hover:text-indigo-600 font-semibold underline"
                                    >
                                      {isExpanded ? 'Ocultar detalle' : 'Ver detalle'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Popover / Tarjeta Inline Expandible con el desglose detallado por mes */}
                            {isExpanded && (
                              <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-indigo-200 dark:border-indigo-800 shadow-md space-y-1.5 text-[11px] animate-fadeIn">
                                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1 font-bold text-slate-700 dark:text-slate-200">
                                  <span>Desglose Mensual Imputado</span>
                                  <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                                    {infoConceptos.count} cuota(s)
                                  </span>
                                </div>
                                <div className="divide-y divide-slate-200/60 dark:divide-slate-700/60 max-h-44 overflow-y-auto">
                                  {infoConceptos.desgloseMensual.map((item) => (
                                    <div
                                      key={item.id}
                                      className="py-1 flex items-center justify-between gap-2"
                                    >
                                      <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {item.mesNombre}
                                      </span>
                                      <div className="font-mono text-right shrink-0">
                                        {item.descuento > 0 && (
                                          <span className="text-[10px] text-slate-400 line-through mr-1.5">
                                            ${item.importeBase.toLocaleString('es-AR')}
                                          </span>
                                        )}
                                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                          ${item.importeNeto.toLocaleString('es-AR')}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="pt-1 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-white font-mono">
                                  <span>Total Recibo:</span>
                                  <span>${pago.montoTotal.toLocaleString('es-AR')}</span>
                                </div>
                              </div>
                            )}

                            {isAnulado && pago.motivoAnulacion && (
                              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1 bg-rose-100/60 dark:bg-rose-950/50 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
                                <i className="fa-solid fa-ban mr-1"></i>
                                Motivo Anulación: "{pago.motivoAnulacion}"
                              </div>
                            )}
                          </td>

                          {/* Columna 4: Medio & Referencia */}
                          <td className="py-3.5 px-4 text-xs align-top">
                            <span
                              className={`inline-flex items-center gap-1 font-bold ${
                                pago.medio === 'Efectivo'
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : 'text-sky-700 dark:text-sky-400'
                              }`}
                            >
                              <i
                                className={`fa-solid ${
                                  pago.medio === 'Efectivo'
                                    ? 'fa-money-bill-wave'
                                    : 'fa-building-columns'
                                } text-[10px]`}
                              ></i>
                              {pago.medio}
                            </span>
                            <span className="block font-mono text-[11px] text-slate-500 mt-0.5">
                              Ref: {pago.comprobante}
                            </span>
                          </td>

                          {/* Columna 5: Comprobante Adjunto (Abre Split-View Modal) */}
                          <td className="py-3.5 px-4 text-center align-top">
                            {tieneAdjunto ? (
                              <button
                                type="button"
                                onClick={() => openConciliacionSplitModal(pago)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 text-xs font-bold transition shadow-2xs"
                                title="Abrir visor Split-View de Conciliación Bancaria"
                              >
                                <i className="fa-solid fa-file-invoice"></i>
                                <span>Ver Archivo</span>
                              </button>
                            ) : pago.medio !== 'Efectivo' ? (
                              <button
                                type="button"
                                onClick={() => openConciliacionSplitModal(pago)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[11px] font-semibold font-mono hover:bg-amber-100"
                                title="Abrir modal de conciliación para adjuntar o verificar referencia"
                              >
                                <i className="fa-solid fa-paperclip"></i>
                                <span>Sin adjunto (Ver)</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono">
                                Caja Ventanilla
                              </span>
                            )}
                          </td>

                          {/* Columna 6: Monto Total */}
                          <td
                            className={`py-3.5 px-4 text-right font-mono font-bold align-top ${
                              isAnulado
                                ? 'line-through text-rose-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            ${pago.montoTotal.toLocaleString('es-AR')}
                            {isAnulado && (
                              <span className="block text-[10px] text-rose-600 font-mono no-underline">
                                Reverso: -${pago.montoTotal.toLocaleString('es-AR')}
                              </span>
                            )}
                          </td>

                          {/* Columna 7: Estado / Visado */}
                          <td className="py-3.5 px-4 text-center align-top">
                            {isAnulado ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                ANULADO
                              </span>
                            ) : pago.validadoTesoreria ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 inline-flex items-center gap-1">
                                <i className="fa-solid fa-check-double"></i>
                                <span>Conciliado</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 inline-flex items-center gap-1">
                                <i className="fa-solid fa-clock"></i>
                                <span>Pend. Visado</span>
                              </span>
                            )}
                          </td>

                          {/* =================================================================== */}
                          {/* 3. SEGURIDAD CONTABLE EN LA COLUMNA DE ACCIONES (Sin edición libre) */}
                          {/* =================================================================== */}
                          <td className="py-3.5 px-4 text-right align-top">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Si el recibo está en 'Pend. Visado': Botón prioritario "Validar / Conciliar" y "Ver Comprobante" */}
                              {!isAnulado && !pago.validadoTesoreria && isTesorero && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      pago.medio !== 'Efectivo' || tieneAdjunto
                                        ? openConciliacionSplitModal(pago)
                                        : validarPagoTesoreria(pago.id)
                                    }
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
                                    title="Validar y conciliar cobro imputando fondos"
                                  >
                                    <i className="fa-solid fa-check-double"></i>
                                    <span>Validar / Conciliar</span>
                                  </button>

                                  {(tieneAdjunto || pago.medio !== 'Efectivo') && (
                                    <button
                                      type="button"
                                      onClick={() => openConciliacionSplitModal(pago)}
                                      className="px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold flex items-center gap-1 transition"
                                      title="Ver Comprobante en modo Split-View"
                                    >
                                      <i className="fa-solid fa-eye"></i>
                                      <span>Ver Comprobante</span>
                                    </button>
                                  )}
                                </>
                              )}

                              {/* Para todos los recibos: Botón visible "Imprimir Recibo Oficial" */}
                              <button
                                type="button"
                                onClick={() => setActiveReciboId(pago.id)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                                title="Imprimir o descargar Recibo Oficial Institucional"
                              >
                                <i className="fa-solid fa-print text-slate-500"></i>
                                <span>Imprimir Recibo Oficial</span>
                              </button>

                              {/* Menú secundario contextual (⋮) con la acción "Anular Recibo" */}
                              {isTesorero && (
                                <div
                                  className="relative inline-block text-left"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenMenuPagoId(
                                        openMenuPagoId === pago.id ? null : pago.id
                                      )
                                    }
                                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition"
                                    title="Más opciones contables (⋮)"
                                  >
                                    <i className="fa-solid fa-ellipsis-vertical"></i>
                                  </button>

                                  {openMenuPagoId === pago.id && (
                                    <div className="origin-top-right absolute right-0 mt-1.5 w-56 rounded-xl shadow-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 z-30 text-left overflow-hidden animate-fadeIn">
                                      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/70">
                                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                                          Seguridad Contable • {pago.id}
                                        </span>
                                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                          Recibo oficial no editable
                                        </span>
                                      </div>

                                      <div className="p-1">
                                        {(tieneAdjunto || pago.medio !== 'Efectivo') && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenMenuPagoId(null);
                                              openConciliacionSplitModal(pago);
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                                          >
                                            <i className="fa-solid fa-table-columns text-indigo-600"></i>
                                            <span>Conciliación Split-View</span>
                                          </button>
                                        )}

                                        {!isAnulado ? (
                                          <button
                                            type="button"
                                            onClick={() => openAnularModal(pago)}
                                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 flex items-center gap-2"
                                          >
                                            <i className="fa-solid fa-ban"></i>
                                            <span>Anular Recibo (Con Reverso)</span>
                                          </button>
                                        ) : (
                                          <div className="px-3 py-2 text-[11px] text-slate-400 italic">
                                            Recibo ya anulado ({pago.reversoContableId || 'ANULADO'})
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBPESTAÑA 2: AJUSTE DE CUOTAS Y CUENTAS CORRIENTES CON AUDITORÍA OBLIGATORIA */}
      {/* ========================================================================= */}
      {subTab === 'cuotas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Buscador Predictivo de Estudiantes */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <i className="fa-solid fa-users text-emerald-600"></i>
                Estudiantes Matriculados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Seleccione un alumno para visualizar su cuenta corriente y ajustar cuotas.
              </p>

              <div className="relative mb-3">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <i className="fa-solid fa-magnifying-glass text-xs"></i>
                </span>
                <input
                  type="text"
                  value={searchStudentCuotas}
                  onChange={(e) => setSearchStudentCuotas(e.target.value)}
                  placeholder="Filtrar por nombre, apellido, DNI..."
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[480px] overflow-y-auto space-y-1">
                {filteredStudentsForCuotas.map((alu) => {
                  const isSelected = alu.id === activeStudentCuotas?.id;
                  const cuotasAlu = getStudentCuotas(alu.id);
                  const pendientesCount = cuotasAlu.filter(
                    (c) => c.estado !== 'pagada'
                  ).length;

                  return (
                    <button
                      key={alu.id}
                      onClick={() => setSelectedStudentForCuotas(alu.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 shadow-2xs'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {alu.apellido}, {alu.nombre}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            pendientesCount === 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pendientesCount} pend.
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        DNI {alu.dni} • {alu.curso} "{alu.division}"
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Detalle de Cuenta Corriente y Ajustes de Cuotas */}
          <div className="lg:col-span-8 space-y-5">
            {activeStudentCuotas ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 dark:text-emerald-400">
                      Cuenta Corriente Institucional
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {activeStudentCuotas.apellido}, {activeStudentCuotas.nombre}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      DNI {activeStudentCuotas.dni} • Curso: {activeStudentCuotas.curso} "
                      {activeStudentCuotas.division}" ({activeStudentCuotas.turno})
                      {activeStudentTutor &&
                        ` • Tutor: ${activeStudentTutor.apellido}, ${activeStudentTutor.nombre}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {cuotasDelAlumno.filter((c) => c.estado === 'pagada').length} Pagadas /{' '}
                      {cuotasDelAlumno.length} Totales
                    </span>
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-shield-check text-emerald-600"></i>
                    <span>
                      Valores arancelarios estandarizados. Los montos se actualizan institucionalmente mediante <strong>Reajuste General Arancelario</strong>.
                    </span>
                  </div>
                  {isTesorero && (
                    <button
                      onClick={() => setIsGeneralModalOpen(true)}
                      className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 text-xs font-bold transition flex items-center gap-1 shrink-0"
                    >
                      <i className="fa-solid fa-sliders"></i>
                      <span>Reajuste General</span>
                    </button>
                  )}
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <th className="py-3 px-3">Concepto / Período</th>
                        <th className="py-3 px-3">Vencimiento</th>
                        <th className="py-3 px-3 text-right">Valor Arancel</th>
                        <th className="py-3 px-3 text-center">Estado</th>
                        <th className="py-3 px-3 text-center">Trazabilidad Fiscal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      {cuotasDelAlumno.map((cuota) => {
                        const tieneAjustes =
                          cuota.historialAjustes && cuota.historialAjustes.length > 0;
                        const isPagada = cuota.estado === 'pagada';

                        return (
                          <tr
                            key={cuota.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                          >
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-800 dark:text-slate-100 block">
                                {cuota.concepto}
                              </span>
                              <span className="text-xs font-mono text-slate-500">
                                Período: {cuota.periodo}
                              </span>
                            </td>

                            <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 text-xs">
                              {cuota.vencimiento}
                            </td>

                            <td className="py-3 px-3 text-right font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                              ${cuota.monto.toLocaleString('es-AR')}
                            </td>

                            <td className="py-3 px-3 text-center">
                              {isPagada ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  Pagada ({cuota.pagoId})
                                </span>
                              ) : cuota.estado === 'vencida' ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                  Vencida
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  Pendiente
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center">
                              {tieneAjustes ? (
                                <button
                                  onClick={() => setCuotaHistorialTarget(cuota)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 text-xs font-bold hover:bg-indigo-100 transition"
                                  title="Ver trazabilidad de modificaciones de este arancel"
                                >
                                  <i className="fa-solid fa-clock-rotate-left"></i>
                                  <span>{cuota.historialAjustes.length} ajuste(s)</span>
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 font-mono">
                                  Arancel Original
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800 text-slate-400">
                Seleccione un alumno de la lista para ver sus cuentas corrientes.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBPESTAÑA 3: EGRESOS, ACTAS DE ARQUEO Y CIERRES DE CAJA */}
      {/* ========================================================================= */}
      {subTab === 'egresos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <i className="fa-solid fa-screwdriver-wrench text-rose-600"></i>
              Egresos e Inversión Institucional
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {egresosLista.map((eg) => (
                <div key={eg.id} className="py-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">{eg.concepto}</p>
                    <p className="text-slate-500 text-[11px]">
                      {eg.fecha} • {eg.categoria} •{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {eg.medioPago || 'Efectivo'}
                      </span>{' '}
                      • Factura: <span className="font-mono">{eg.comprobante}</span>
                    </p>
                  </div>
                  <span className="font-mono font-bold text-rose-600 text-sm shrink-0">
                    -${eg.importe.toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-money-bill-1-wave text-emerald-600"></i>
                Actas de Arqueo de Turno
              </h3>
              <button
                type="button"
                onClick={() => setIsArqueoModalOpen(true)}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                + Nuevo Arqueo
              </button>
            </div>
            <div className="space-y-3 text-xs">
              {(state.tesoreria?.arqueos || []).map((arq) => (
                <div
                  key={arq.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-1"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="font-mono text-slate-800 dark:text-white">
                      {arq.id} • {arq.turno}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        arq.diferencia === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : arq.diferencia < 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {arq.estado} ({arq.diferencia >= 0 ? '+' : ''}$
                      {arq.diferencia.toLocaleString('es-AR')})
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 flex justify-between">
                    <span>Esperado: ${arq.efectivoEsperado?.toLocaleString('es-AR')}</span>
                    <span>Contado: ${arq.efectivoContado?.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between">
                    <span>{arq.fecha}</span>
                    <span>{arq.responsable}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-lock text-amber-600"></i>
                Actas de Cierre de Período
              </h3>
              {isTesorero && (
                <button
                  onClick={() => setIsCierreModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center gap-1 shadow-xs"
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Nuevo Cierre</span>
                </button>
              )}
            </div>

            <div className="space-y-3.5">
              {(state.tesoreria?.cierresPeriodo || []).map((cierre) => (
                <div
                  key={cierre.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-amber-400 transition"
                >
                  <div className="flex items-center justify-between font-bold mb-1.5">
                    <div>
                      <span className="text-slate-900 dark:text-white font-extrabold text-sm block">
                        {cierre.periodo}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {cierre.id}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Saldo Final</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm">
                        ${cierre.saldoFinal?.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 grid grid-cols-2 gap-1 py-1.5 border-t border-slate-200/70 dark:border-slate-700/70">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Ingresos (+)</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        +${(cierre.ingresos || 0).toLocaleString('es-AR')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[11px]">Egresos (-)</span>
                      <span className="font-mono font-bold text-rose-700 dark:text-rose-400">
                        -${(cierre.egresos || 0).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 pt-1.5 border-t border-slate-200/70 dark:border-slate-700/70 flex justify-between items-center">
                    <span className="font-mono text-xs">{cierre.fechaCierre}</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {cierre.responsable}
                    </span>
                  </div>

                  <button
                    onClick={() => setActaCierreTarget(cierre)}
                    className="mt-3 w-full py-2 px-3 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-600 transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    <i className="fa-solid fa-file-invoice text-amber-600"></i>
                    <span>Ver Acta Oficial Imprimible</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBPESTAÑA 4: BITÁCORA INMUTABLE DE AUDITORÍA Y REVERSOS (audit_log) */}
      {/* ========================================================================= */}
      {subTab === 'auditoria' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-emerald-600"></i>
                Bitácora de Auditoría Fiscal Inmutable (<code className="font-mono">audit_log</code> • RNF-02)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro cronológico de conciliaciones bancarias, anulaciones con reverso contable, arqueos de turno y ajustes arancelarios.
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
            {(state.auditLogs || []).map((log, idx) => (
              <div key={idx} className="py-3 flex items-start gap-3 text-xs">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 shrink-0 mt-0.5">
                  <i className="fa-solid fa-clock"></i>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {log.accion}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {log.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">{log.detalle}</p>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                    Operador: {log.usuario}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL REQUERIMIENTO 1: ARQUEO DE TURNO / CONTEO RÁPIDO DE BILLETES */}
      {/* ========================================================================= */}
      {isArqueoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <i className="fa-solid fa-money-bill-1-wave text-lg"></i>
                </div>
                <div>
                  <h3 className="font-black text-base">
                    Arqueo de Turno / Conteo Rápido de Billetes Físicos
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Contraste automático contra "Efectivo en Caja Escolar" esperado por el sistema
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsArqueoModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarArqueo} className="p-6 space-y-5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Turno Arqueado:
                  </label>
                  <select
                    value={turnoArqueo}
                    onChange={(e) => setTurnoArqueo(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-white"
                  >
                    <option value="Mañana">Turno Mañana</option>
                    <option value="Tarde">Turno Tarde</option>
                    <option value="Mañana / Tarde">Jornada Completa (Mañana / Tarde)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={autocompletarArqueoExacto}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold hover:bg-emerald-100 transition"
                    title="Distribuir billetes automáticamente para simular caja cuadrada"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles mr-1"></i>
                    Simular Conteo Exacto
                  </button>
                  <button
                    type="button"
                    onClick={limpiarConteoArqueo}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                  >
                    Reiniciar a $0
                  </button>
                </div>
              </div>

              {/* Grilla de Denominaciones de Billetes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DENOMINACIONES_BILLETES.map((billete) => {
                  const cant = conteoBilletes[billete.valor] || 0;
                  const subtotalBillete = cant * billete.valor;
                  return (
                    <div
                      key={billete.valor}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 flex items-center justify-between gap-2"
                    >
                      <span
                        className={`px-2.5 py-1 rounded-lg border font-mono font-black text-xs w-24 text-center ${billete.color}`}
                      >
                        {billete.label}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setConteoBilletes((prev) => ({
                              ...prev,
                              [billete.valor]: Math.max(0, (Number(prev[billete.valor]) || 0) - 1)
                            }))
                          }
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 font-bold text-slate-700 dark:text-white"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={cant}
                          onChange={(e) =>
                            setConteoBilletes((prev) => ({
                              ...prev,
                              [billete.valor]: Math.max(0, parseInt(e.target.value, 10) || 0)
                            }))
                          }
                          className="w-16 text-center py-1 border border-slate-300 dark:border-slate-600 rounded-lg font-mono font-bold bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setConteoBilletes((prev) => ({
                              ...prev,
                              [billete.valor]: (Number(prev[billete.valor]) || 0) + 1
                            }))
                          }
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 font-bold text-slate-700 dark:text-white"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 w-24 text-right">
                        ${subtotalBillete.toLocaleString('es-AR')}
                      </span>
                    </div>
                  );
                })}

                {/* Monedas / Cambio chico */}
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                    Monedas / Otros
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={otrosValoresMonedas}
                    onChange={(e) =>
                      setOtrosValoresMonedas(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-28 text-right px-2.5 py-1 border border-slate-300 dark:border-slate-600 rounded-lg font-mono font-bold bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Panel de Contraste Automático: Físico Contado vs. Efectivo Esperado */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 border border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Saldo Esperado en Efectivo (Sistema)
                    </span>
                    <span className="text-lg font-black font-mono text-white">
                      ${efectivoEnCajaEscolar.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                    <span className="text-[10px] font-mono uppercase text-amber-300 block">
                      Total Físico Contado (Billetes)
                    </span>
                    <span className="text-lg font-black font-mono text-amber-400">
                      ${efectivoFisicoTotalContado.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${
                      diferenciaArqueo === 0
                        ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                        : diferenciaArqueo < 0
                        ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                        : 'bg-sky-950/80 border-sky-600 text-sky-300'
                    }`}
                  >
                    <span className="text-[10px] font-mono uppercase font-bold block">
                      Diferencia de Arqueo
                    </span>
                    <span className="text-lg font-black font-mono">
                      {diferenciaArqueo >= 0 ? '+' : ''}$
                      {diferenciaArqueo.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                {/* Alerta de Diagnóstico Contable */}
                <div
                  className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-bold ${
                    diferenciaArqueo === 0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : diferenciaArqueo < 0
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  <i
                    className={`fa-solid text-base ${
                      diferenciaArqueo === 0
                        ? 'fa-circle-check text-emerald-400'
                        : 'fa-triangle-exclamation text-rose-400'
                    }`}
                  ></i>
                  <span>
                    {diferenciaArqueo === 0
                      ? 'CAJA CUADRADA EXACTA: El recuento físico de billetes coincide exactamente con el Efectivo en Caja Escolar del sistema.'
                      : diferenciaArqueo < 0
                      ? `ALERTA DE FALTANTE EN CAJA: Se detecta un faltante físico de $${Math.abs(
                          diferenciaArqueo
                        ).toLocaleString('es-AR')} respecto al saldo esperado en efectivo.`
                      : `ALERTA DE SOBRANTE EN CAJA: Se detecta un excedente físico de +$${diferenciaArqueo.toLocaleString(
                          'es-AR'
                        )} respecto al saldo registrado en sistema.`}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observaciones del Acta de Turno (Opcional):
                </label>
                <input
                  type="text"
                  value={observacionesArqueo}
                  onChange={(e) => setObservacionesArqueo(e.target.value)}
                  placeholder="Ej: Recuento realizado en cambio de turno junto a Secretaría..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsArqueoModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-file-signature"></i>
                  <span>Asentar Acta de Arqueo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL REQUERIMIENTO 3: CONFIRMACIÓN DESTRUCTIVA DE ANULACIÓN Y REVERSO */}
      {/* ========================================================================= */}
      {anularTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-rose-800 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <i className="fa-solid fa-ban text-rose-300 text-lg"></i>
                <div>
                  <h3 className="font-black text-base">
                    Anular Recibo Oficial: {anularTarget.id}
                  </h3>
                  <p className="text-[11px] text-rose-200 font-mono">
                    Borrado Lógico (estado = 'ANULADO') • Reverso Contable Automático
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAnularTarget(null)}
                className="text-rose-200 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmarAnulacion} className="p-5 space-y-4 text-xs">
              {errorAnulacion && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                  {errorAnulacion}
                </div>
              )}

              {/* Vista previa del Reverso Contable que se emitirá */}
              <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-rose-900 dark:text-rose-200">
                  <span>Impacto Contable del Reverso:</span>
                  <span className="font-mono text-sm text-rose-600 dark:text-rose-400">
                    -${anularTarget.montoTotal.toLocaleString('es-AR')} ({anularTarget.medio})
                  </span>
                </div>
                <p className="text-[11px] text-rose-700 dark:text-rose-300">
                  • El registro físico <strong>{anularTarget.id}</strong> se conservará intacto en la base de datos con <code className="font-mono">estado = 'ANULADO'</code>.<br />
                  • Se generará una entrada inmutable en <code className="font-mono">audit_log</code> y se revertirán{' '}
                  <strong>{anularTarget.cuotaIds?.length || 1} cuota(s)</strong> al estado Pendiente.
                </p>
              </div>

              {/* Selección Obligatoria de Motivo Tipificado */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Seleccione el Motivo Obligatorio de Anulación: *
                </label>
                <div className="space-y-2">
                  {MOTIVOS_ANULACION_TIPIFICADOS.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                        motivoCategoriaAnulacion === item.id
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="motivoCategoriaAnulacion"
                        value={item.id}
                        checked={motivoCategoriaAnulacion === item.id}
                        onChange={(e) => setMotivoCategoriaAnulacion(e.target.value)}
                        className="mt-0.5 text-rose-600"
                      />
                      <div>
                        <span className="font-bold block">{item.titulo}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.descripcion}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Detalle u Observación Adicional para Auditoría (Opcional):
                </label>
                <textarea
                  rows="2"
                  value={detalleAnulacion}
                  onChange={(e) => setDetalleAnulacion(e.target.value)}
                  placeholder="Agregue referencias adicionales para el asiento de reverso en audit_log..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAnularTarget(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-black rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-ban"></i>
                  <span>Confirmar Anulación y Emitir Reverso</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL REAJUSTE GENERAL MASIVO DE ARANCELES (10 MESES DEL CICLO LECTIVO)   */}
      {/* ========================================================================= */}
      {isGeneralModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-800 border border-indigo-700 flex items-center justify-center text-indigo-300">
                  <i className="fa-solid fa-sliders text-lg"></i>
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Reajuste General Arancelario</h3>
                  <p className="text-xs text-indigo-200 font-mono">
                    Actualización masiva de aranceles escolares • Ciclo Lectivo 2026
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGeneralModalOpen(false)}
                className="text-indigo-200 hover:text-white p-1 rounded-lg text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmarAjusteGeneral} className="p-6 space-y-5 overflow-y-auto text-sm">
              {/* Selector interactivo de meses */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <i className="fa-regular fa-calendar-check text-indigo-600 dark:text-indigo-400"></i>
                    <span>Meses de Cobro a Reajustar ({selectedPeriodosGeneral.length} de {MESES_CICLO.length} seleccionados):</span>
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={selectAllPeriodosGeneral}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 text-xs font-semibold transition"
                    >
                      Todos (10 Meses)
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllPeriodosGeneral}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
                    >
                      Deseleccionar
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPeriodosGeneral(['2026-03', '2026-04', '2026-05', '2026-06'])}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                    >
                      1° Semestre
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPeriodosGeneral(['2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'])}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                    >
                      2° Semestre
                    </button>
                  </div>
                </div>

                {/* Grilla con los 10 meses del ciclo de cobro */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {MESES_CICLO.map((m) => {
                    const isSelected = selectedPeriodosGeneral.includes(m.periodo);
                    const pendingCount = state.cuotas.filter(
                      (c) => c.periodo === m.periodo && c.estado !== 'pagada'
                    ).length;

                    return (
                      <button
                        type="button"
                        key={m.periodo}
                        onClick={() => togglePeriodoGeneral(m.periodo)}
                        className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-100 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-sm">{m.nombre}</span>
                          <i
                            className={`fa-solid ${
                              isSelected
                                ? 'fa-circle-check text-indigo-600 dark:text-indigo-400 text-base'
                                : 'fa-circle text-slate-300 dark:text-slate-600 text-sm'
                            }`}
                          ></i>
                        </div>
                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          {m.periodo}
                        </div>
                        <div className="mt-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {pendingCount} cuotas pend.
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedPeriodosGeneral.length === 0 && (
                  <p className="text-xs text-rose-500 font-semibold mt-2">
                    * Debe seleccionar al menos un mes de cobro para aplicar el ajuste.
                  </p>
                )}
              </div>

              {/* Nuevo Valor Arancelario */}
              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Nuevo Valor Arancelario ($):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">$</span>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    required
                    value={montoGeneral}
                    onChange={(e) => setMontoGeneral(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-base font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Se actualizarán únicamente las cuotas pendientes o adeudadas. Las cuotas ya pagadas conservan su valor histórico inmutable.
                </p>
              </div>

              {/* Justificación obligatoria */}
              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Motivo y Justificación Institucional (Obligatorio para Auditoría):
                </label>
                <textarea
                  rows="3"
                  required
                  value={motivoGeneral}
                  onChange={(e) => setMotivoGeneral(e.target.value)}
                  placeholder="Indique la causa del reajuste general (ej: Resolución N° 04/2026 de Asamblea de Cooperadora por adecuación inflacionaria)..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                />
              </div>

              {/* Panel de resumen de impacto en vivo */}
              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-circle-info text-indigo-600 dark:text-indigo-400 text-base"></i>
                  <span>
                    Meses seleccionados: <strong>{selectedPeriodosGeneral.length}</strong> • Cuotas pendientes a modificar: <strong>{totalCuotasAfectadas}</strong>
                  </span>
                </div>
                <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 text-sm">
                  ${Number(montoGeneral || 0).toLocaleString('es-AR')} c/u
                </span>
              </div>

              {/* Botones de acción */}
              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGeneralModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={selectedPeriodosGeneral.length === 0 || !montoGeneral || montoGeneral <= 0}
                  className="px-6 py-2.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-xl font-bold shadow-md text-sm flex items-center gap-2 transition"
                >
                  <i className="fa-solid fa-check"></i>
                  <span>Aplicar Reajuste Masivo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL DE AUDITORÍA DE UNA CUOTA */}
      {cuotaHistorialTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm sm:text-base">
                  Trazabilidad de Ajustes: {cuotaHistorialTarget.concepto}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Historial de auditoría inmutable
                </p>
              </div>
              <button
                onClick={() => setCuotaHistorialTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 max-h-[400px] overflow-y-auto space-y-3 text-xs">
              {(cuotaHistorialTarget.historialAjustes || []).map((ajuste, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-1"
                >
                  <div className="flex justify-between font-bold">
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono">
                      ${ajuste.montoAnterior} → ${ajuste.montoNuevo}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {ajuste.fecha}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 italic">
                    "{ajuste.motivo}"
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Responsable: {ajuste.usuario}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 text-right">
              <button
                onClick={() => setCuotaHistorialTarget(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR EGRESO */}
      {isEgresoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-rose-800 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Registrar Egreso / Inversión Escolar</h3>
              <button
                onClick={() => setIsEgresoModalOpen(false)}
                className="text-rose-200 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleConfirmarEgreso} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Concepto:</label>
                <input
                  type="text"
                  required
                  value={egresoConcepto}
                  onChange={(e) => setEgresoConcepto(e.target.value)}
                  placeholder="Compra de materiales, reparaciones..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Origen de Fondos:</label>
                  <select
                    value={egresoMedioPago}
                    onChange={(e) => setEgresoMedioPago(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="Efectivo">Efectivo (Caja Escolar)</option>
                    <option value="Transferencia">Bancos / Digital</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Importe ($):</label>
                  <input
                    type="number"
                    required
                    value={egresoImporte}
                    onChange={(e) => setEgresoImporte(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">N° Comprobante / Factura:</label>
                <input
                  type="text"
                  value={egresoComprobante}
                  onChange={(e) => setEgresoComprobante(e.target.value)}
                  placeholder="FC-B-0001-..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-mono"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEgresoModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-700 text-white font-bold rounded-xl"
                >
                  Registrar Egreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CIERRE PERÍODO CONTABLE Y CONSOLIDACIÓN FISCAL                       */}
      {/* ========================================================================= */}
      {isCierreModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-amber-600 text-slate-950 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 border border-amber-400 flex items-center justify-center text-slate-950">
                  <i className="fa-solid fa-file-shield text-lg"></i>
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">Ejecutar Cierre de Período Contable</h3>
                  <p className="text-xs text-amber-950 font-medium">
                    Consolidación oficial de saldos de caja escolar y bancos • ENS DVS
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCierreModalOpen(false)}
                className="text-slate-950 hover:bg-amber-700/20 p-1.5 rounded-lg text-lg font-bold leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmarCierre} className="p-6 space-y-4 overflow-y-auto text-sm">
              <p className="text-slate-600 dark:text-slate-300 text-xs">
                El cierre mensual consolida los fondos de efectivo en caja escolar y las cuentas digitales en banco, emitiendo el acta oficial con trazabilidad inmutable de auditoría.
              </p>

              {/* Selector de período contable */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Nombre del Período Contable:
                </label>
                <select
                  value={nombrePeriodoCierre}
                  onChange={(e) => setNombrePeriodoCierre(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Mayo 2026">Mayo 2026 (Período Actual)</option>
                  <option value="Junio 2026">Junio 2026</option>
                  <option value="Julio 2026">Julio 2026</option>
                  <option value="Agosto 2026">Agosto 2026</option>
                  <option value="Septiembre 2026">Septiembre 2026</option>
                  <option value="Octubre 2026">Octubre 2026</option>
                  <option value="Noviembre 2026">Noviembre 2026</option>
                  <option value="Diciembre 2026">Diciembre 2026 (Cierre de Ejercicio)</option>
                </select>
              </div>

              {/* Pre-balance Contable en Tiempo Real */}
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-2.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-2">
                  <i className="fa-solid fa-scale-balanced"></i>
                  Balance Contable al Cierre del Período
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 block">Saldo Inicial Total:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-white text-sm">
                      ${saldoInicialTotal.toLocaleString('es-AR')}
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      (Efvo: ${saldoInicialEfectivo.toLocaleString('es-AR')} • Banco: ${saldoInicialBanco.toLocaleString('es-AR')})
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 block">(+) Ingresos Período:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      +${ingresosTotales.toLocaleString('es-AR')}
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      (Efvo: ${ingresosEfectivoCobrado.toLocaleString('es-AR')} • Banco: ${ingresosBancoValidados.toLocaleString('es-AR')})
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 block">(-) Egresos Asentados:</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                      -${egresosTotales.toLocaleString('es-AR')}
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      (Efvo: ${egresosEfectivo.toLocaleString('es-AR')} • Banco: ${egresosBanco.toLocaleString('es-AR')})
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-emerald-800 dark:text-emerald-300 font-bold block">(=) Saldo Final Consolidado:</span>
                    <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-base">
                      ${saldoNetoDisponible.toLocaleString('es-AR')}
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      (Caja: ${efectivoEnCajaEscolar.toLocaleString('es-AR')} • Banco: ${bancosCuentasDigitales.toLocaleString('es-AR')})
                    </span>
                  </div>
                </div>
              </div>

              {/* Observaciones / Dictamen de Acta */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Dictamen / Observaciones para el Acta Oficial:
                </label>
                <textarea
                  rows="2"
                  value={observacionesCierre}
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                  placeholder="Observaciones de caja, notas de arqueo o detalles del balance mensual..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Responsable: <strong>Marta Rodríguez (Tesorera)</strong></span>
                <span className="font-mono">Fecha: {new Date().toLocaleDateString('es-AR')}</span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCierreModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-md text-sm flex items-center gap-2 transition"
                >
                  <i className="fa-solid fa-lock"></i>
                  <span>Asentar y Consolidar Cierre</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL ACTA OFICIAL DE CIERRE CONTABLE IMPRIMIBLE                         */}
      {/* ========================================================================= */}
      {actaCierreTarget && (
        <div id="modalActaCierre" className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 no-print">
              <div className="flex items-center gap-2.5">
                <i className="fa-solid fa-certificate text-amber-400 text-lg"></i>
                <h3 className="font-bold text-base">Acta Oficial de Cierre Contable ({actaCierreTarget.periodo})</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-xs"
                >
                  <i className="fa-solid fa-print"></i>
                  <span>Imprimir Acta</span>
                </button>
                <button
                  onClick={() => setActaCierreTarget(null)}
                  className="text-slate-400 hover:text-white p-1 text-lg font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div id="printActaCierreContainer" className="p-8 space-y-6 overflow-y-auto text-slate-800 dark:text-slate-100 font-sans print:p-0">
              {/* Encabezado Institucional */}
              <div className="text-center pb-4 border-b-2 border-slate-800 dark:border-slate-600">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <img src="/escudo-colegio.png" alt="Escudo" className="w-12 h-12 object-contain" />
                  <div className="text-left">
                    <h2 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-wide">
                      Escuela Normal Superior Dalmacio Vélez Sársfield
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                      Asociación Cooperadora Escolar • Personería Jurídica y Matrícula Oficial
                    </p>
                  </div>
                </div>
                <div className="mt-2 inline-block px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider font-mono">
                  ACTA DE BALANCE MENSUAL Y CIERRE DE PERÍODO CONTABLE • {actaCierreTarget.id}
                </div>
              </div>

              {/* Datos Generales */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-500 block">Período Contable:</span>
                  <strong className="text-sm text-slate-900 dark:text-white">{actaCierreTarget.periodo}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Fecha y Hora de Cierre:</span>
                  <strong className="font-mono text-sm">{actaCierreTarget.fechaCierre}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Responsable Actuante:</span>
                  <strong className="text-slate-900 dark:text-white">{actaCierreTarget.responsable}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Estado del Acta:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                    <i className="fa-solid fa-circle-check"></i> {actaCierreTarget.estado || 'Conciliado y Firmado'}
                  </span>
                </div>
              </div>

              {/* Cuadro de Liquidación y Balance */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 uppercase">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Rubro Contable</th>
                      <th className="py-2.5 px-3 text-right">Efectivo (Caja)</th>
                      <th className="py-2.5 px-3 text-right">Bancos / Digital</th>
                      <th className="py-2.5 px-3 text-right">Total Consolidado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">Saldo Inicial</td>
                      <td className="py-2.5 px-3 text-right font-mono">${(actaCierreTarget.saldoInicialEfectivo || 45000).toLocaleString('es-AR')}</td>
                      <td className="py-2.5 px-3 text-right font-mono">${(actaCierreTarget.saldoInicialBanco || 80000).toLocaleString('es-AR')}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">${(actaCierreTarget.saldoInicial || 125000).toLocaleString('es-AR')}</td>
                    </tr>
                    <tr className="bg-emerald-50/40 dark:bg-emerald-950/20">
                      <td className="py-2.5 px-3 font-semibold text-emerald-800 dark:text-emerald-300">(+) Ingresos del Período</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400">+${(actaCierreTarget.ingresosEfectivo || (actaCierreTarget.ingresos ? Math.round(actaCierreTarget.ingresos * 0.4) : 0)).toLocaleString('es-AR')}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400">+${(actaCierreTarget.ingresosBanco || (actaCierreTarget.ingresos ? Math.round(actaCierreTarget.ingresos * 0.6) : 0)).toLocaleString('es-AR')}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">+${(actaCierreTarget.ingresos || 0).toLocaleString('es-AR')}</td>
                    </tr>
                    <tr className="bg-rose-50/40 dark:bg-rose-950/20">
                      <td className="py-2.5 px-3 font-semibold text-rose-800 dark:text-rose-300">(-) Egresos Asentados</td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-700 dark:text-rose-400">-${(actaCierreTarget.egresosEfectivo || (actaCierreTarget.egresos ? Math.round(actaCierreTarget.egresos * 0.5) : 0)).toLocaleString('es-AR')}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-700 dark:text-rose-400">-${(actaCierreTarget.egresosBanco || (actaCierreTarget.egresos ? Math.round(actaCierreTarget.egresos * 0.5) : 0)).toLocaleString('es-AR')}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 dark:text-rose-400">-${(actaCierreTarget.egresos || 0).toLocaleString('es-AR')}</td>
                    </tr>
                    <tr className="bg-slate-100 dark:bg-slate-800 font-extrabold text-sm border-t-2 border-slate-300 dark:border-slate-600">
                      <td className="py-3 px-3 text-slate-900 dark:text-white">(=) SALDO FINAL EN CAJA Y BANCO</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">${(actaCierreTarget.saldoFinalEfectivo || Math.round(actaCierreTarget.saldoFinal * 0.35)).toLocaleString('es-AR')}</td>
                      <td className="py-3 px-3 text-right font-mono text-indigo-600 dark:text-indigo-400">${(actaCierreTarget.saldoFinalBanco || Math.round(actaCierreTarget.saldoFinal * 0.65)).toLocaleString('es-AR')}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-900 dark:text-white font-black text-base">${actaCierreTarget.saldoFinal?.toLocaleString('es-AR')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Dictamen / Observaciones */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="font-bold block text-slate-700 dark:text-slate-300 mb-1">Dictamen y Observaciones:</span>
                <p className="text-slate-600 dark:text-slate-400 italic">
                  "{actaCierreTarget.observaciones || 'Cierre de período ordinario visado conforme normas contables de Cooperadora Escolar sin discrepancias.'}"
                </p>
              </div>

              {/* Firmas y Sellos Institucionales */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 w-44 mx-auto mb-2"></div>
                  <strong className="block text-slate-800 dark:text-slate-200">{actaCierreTarget.responsable}</strong>
                  <span className="text-slate-500">Tesorera de Cooperadora</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-44 mx-auto mb-2"></div>
                  <strong className="block text-slate-800 dark:text-slate-200">Lic. Jorge Domínguez</strong>
                  <span className="text-slate-500">Presidente / Dirección ENS DVS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
