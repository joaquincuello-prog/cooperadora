import React, { useState } from 'react';
import { useCooperadora } from '../context/CooperadoraContext';

export default function TesoreriaView() {
  const {
    state,
    getStudent,
    getTutor,
    getStudentCuotas,
    setActiveReciboId,
    setPreviewComprobante,
    modificarPago,
    anularPago,
    validarPagoTesoreria,
    registrarEgresoTesoreria,
    cerrarPeriodoTesoreria,
    ajustarCuota,
    ajustarCuotasGeneral
  } = useCooperadora();

  const isTesorero = state.role === 'tesorero' || state.role === 'admin';

  // Subpestañas del módulo de Tesorería para navegación limpia
  const [subTab, setSubTab] = useState('cobros'); // 'cobros' | 'cuotas' | 'egresos' | 'auditoria'

  // Filtros avanzados predictivos para Libro Diario de Cobros
  const [searchCobros, setSearchCobros] = useState('');
  const [filtroEstadoCobro, setFiltroEstadoCobro] = useState('todos');

  // Filtros predictivos para Gestión y Ajuste de Cuotas / Cuentas Corrientes
  const [searchStudentCuotas, setSearchStudentCuotas] = useState('');
  const [selectedStudentForCuotas, setSelectedStudentForCuotas] = useState(
    state.selectedStudentId || 'alu-1'
  );

  // Estado Modal Modificar Pago (HU-05, RF-10)
  const [editTarget, setEditTarget] = useState(null);
  const [nuevoImporte, setNuevoImporte] = useState('');
  const [nuevoMedio, setNuevoMedio] = useState('Efectivo');
  const [nuevoComprobante, setNuevoComprobante] = useState('');
  const [motivoEdicion, setMotivoEdicion] = useState('');

  // Estado Modal Anular Pago (HU-06, RF-10)
  const [anularTarget, setAnularTarget] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  // Estado Modal Ajustar Cuota Individual (Auditoría Obligatoria)
  const [cuotaAjustarTarget, setCuotaAjustarTarget] = useState(null);
  const [montoCuotaAjuste, setMontoCuotaAjuste] = useState('');
  const [motivoCuotaAjuste, setMotivoCuotaAjuste] = useState('');
  const [errorAjuste, setErrorAjuste] = useState('');

  // Estado Modal Reajuste General Masivo
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);
  const [periodoGeneral, setPeriodoGeneral] = useState('todos_pendientes');
  const [montoGeneral, setMontoGeneral] = useState(5500);
  const [motivoGeneral, setMotivoGeneral] = useState('Actualización arancelaria aprobada en asamblea de cooperadora');

  // Estado Modal Ver Historial de Auditoría de una Cuota
  const [cuotaHistorialTarget, setCuotaHistorialTarget] = useState(null);

  // Estado Modal Registrar Egreso
  const [isEgresoModalOpen, setIsEgresoModalOpen] = useState(false);
  const [egresoConcepto, setEgresoConcepto] = useState('');
  const [egresoCategoria, setEgresoCategoria] = useState('Mantenimiento Edilicio');
  const [egresoImporte, setEgresoImporte] = useState('');
  const [egresoComprobante, setEgresoComprobante] = useState('');

  // Estado Modal Cerrar Período
  const [isCierreModalOpen, setIsCierreModalOpen] = useState(false);
  const [nombrePeriodoCierre, setNombrePeriodoCierre] = useState('2026-06 (Junio)');

  // Cálculos de Tesorería: Tesoreria.calcularSaldo()
  const saldoInicial = state.tesoreria?.saldoInicial || 0;
  const ingresosTotales = state.pagos
    .filter((p) => p.estado !== 'anulado')
    .reduce((acc, p) => acc + p.montoTotal, 0);
  const egresosLista = state.tesoreria?.egresos || [];
  const egresosTotales = egresosLista.reduce((acc, e) => acc + e.importe, 0);
  const saldoActualCaja = saldoInicial + ingresosTotales - egresosTotales;

  // Filtrado predictivo en Libro Diario de Cobros
  const filteredPagos = state.pagos.filter((pago) => {
    const alu = getStudent(pago.alumnoId);
    const tut = getTutor(pago.tutorId);
    const q = searchCobros.trim().toLowerCase();

    const matchTexto =
      !q ||
      pago.id.toLowerCase().includes(q) ||
      pago.comprobante.toLowerCase().includes(q) ||
      (alu && (
        alu.nombre.toLowerCase().includes(q) ||
        alu.apellido.toLowerCase().includes(q) ||
        alu.dni.includes(q)
      )) ||
      (tut && (
        tut.nombre.toLowerCase().includes(q) ||
        tut.apellido.toLowerCase().includes(q)
      ));

    if (!matchTexto) return false;

    if (filtroEstadoCobro === 'validados') return pago.validadoTesoreria && pago.estado !== 'anulado';
    if (filtroEstadoCobro === 'pendientes') return !pago.validadoTesoreria && pago.estado !== 'anulado';
    if (filtroEstadoCobro === 'anulados') return pago.estado === 'anulado';
    if (filtroEstadoCobro === 'transferencias') return pago.medio === 'Transferencia';
    return true;
  });

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
  const activeStudentTutor = activeStudentCuotas ? getTutor(activeStudentCuotas.tutorId) : null;
  const cuotasDelAlumno = activeStudentCuotas ? getStudentCuotas(activeStudentCuotas.id) : [];

  // Handlers
  const openEditModal = (pago) => {
    setEditTarget(pago);
    setNuevoImporte(pago.montoTotal);
    setNuevoMedio(pago.medio);
    setNuevoComprobante(pago.comprobante);
    setMotivoEdicion('');
  };

  const handleConfirmarEdicion = (e) => {
    e.preventDefault();
    if (!editTarget || !motivoEdicion.trim()) return;
    modificarPago({
      id: editTarget.id,
      nuevoImporte: Number(nuevoImporte),
      nuevoMedio,
      nuevoComprobante,
      motivo: motivoEdicion.trim()
    });
    setEditTarget(null);
  };

  const handleConfirmarAnulacion = (e) => {
    e.preventDefault();
    if (!anularTarget || !motivoAnulacion.trim()) return;
    anularPago({
      id: anularTarget.id,
      motivo: motivoAnulacion.trim()
    });
    setAnularTarget(null);
    setMotivoAnulacion('');
  };

  const openAjustarCuotaModal = (cuota) => {
    setCuotaAjustarTarget(cuota);
    setMontoCuotaAjuste(cuota.monto);
    setMotivoCuotaAjuste('');
    setErrorAjuste('');
  };

  const handleConfirmarAjusteCuota = (e) => {
    e.preventDefault();
    if (!motivoCuotaAjuste.trim() || motivoCuotaAjuste.trim().length < 5) {
      setErrorAjuste('El motivo del ajuste es obligatorio y debe contener al menos 5 caracteres para la bitácora de auditoría.');
      return;
    }
    const res = ajustarCuota({
      cuotaId: cuotaAjustarTarget.id,
      nuevoMonto: Number(montoCuotaAjuste),
      motivoAjuste: motivoCuotaAjuste.trim()
    });
    if (res.ok) {
      setCuotaAjustarTarget(null);
    } else {
      setErrorAjuste(res.error || 'Error al aplicar el ajuste.');
    }
  };

  const handleConfirmarAjusteGeneral = (e) => {
    e.preventDefault();
    if (!motivoGeneral.trim() || motivoGeneral.trim().length < 5) return;
    ajustarCuotasGeneral({
      periodo: periodoGeneral,
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
    cerrarPeriodoTesoreria(nombrePeriodoCierre);
    setIsCierreModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* PANEL SUPERIOR: ESTADO CONTABLE DE TESORERÍA (Escuela Normal Superior Dalmacio Vélez Sársfield) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                Módulo Fiscal: Tesorería y Auditoría
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Período: {state.tesoreria?.periodoActual || '2026-06'}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white mt-1">
              Escuela Normal Superior Dalmacio Vélez Sársfield — Tesorería
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Control de ingresos por cuotas, conciliación bancaria, ajuste arancelario con justificación obligatoria y arqueo de caja.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isTesorero ? (
              <>
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
                <span>Vista en modo consulta para <strong>{state.role.toUpperCase()}</strong>.</span>
              </div>
            )}
          </div>
        </div>

        {/* 4 Indicadores Financieros de Tesoreria.calcularSaldo() */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold uppercase text-slate-400">
              Saldo Inicial de Período
            </span>
            <p className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1">
              ${saldoInicial.toLocaleString('es-AR')}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Fondo de reserva en caja escolar
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <span className="text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
              + Ingresos Cobrados (Válidos)
            </span>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">
              +${ingresosTotales.toLocaleString('es-AR')}
            </p>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-300">
              {state.pagos.filter((p) => p.estado !== 'anulado').length} recibos oficiales emitidos
            </span>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
            <span className="text-[11px] font-bold uppercase text-rose-700 dark:text-rose-400">
              - Egresos e Inversión Institucional
            </span>
            <p className="text-xl font-black text-rose-700 dark:text-rose-400 font-mono mt-1">
              -${egresosTotales.toLocaleString('es-AR')}
            </p>
            <span className="text-[11px] text-rose-600 dark:text-rose-300">
              {egresosLista.length} comprobantes de gasto
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 dark:bg-slate-950 text-white shadow-md border border-slate-800">
            <span className="text-[11px] font-bold uppercase text-amber-400">
              = Saldo Neto Disponible en Caja
            </span>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
              ${saldoActualCaja.toLocaleString('es-AR')}
            </p>
            <span className="text-[11px] text-slate-300">
              Tesorería ENS Dalmacio Vélez Sársfield
            </span>
          </div>
        </div>
      </div>

      {/* SUBNAVEGACIÓN INTERNA DEL MÓDULO PARA MANTENER LA VISTA LIMPIA Y COLAPSADA */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 text-xs sm:text-sm font-bold">
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
          <span>Egresos y Cierres ({egresosLista.length})</span>
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
      {/* SUBPESTAÑA 1: LIBRO DIARIO DE COBROS Y COMPROBANTES CON FILTRO PREDICTIVO */}
      {/* ========================================================================= */}
      {subTab === 'cobros' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Cabecera con Filtro Predictivo por Estudiante */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-book-journal-whills text-blue-600"></i>
                Libro Diario de Cobros e Ingresos de Cooperadora
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Filtre cobros por estudiante en tiempo real. Visualice y descargue comprobantes de transferencias bancarias.
              </p>
            </div>

            {/* Barra de Filtros Predictivos Avanzados */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[240px]">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <i className="fa-solid fa-magnifying-glass text-xs"></i>
                </span>
                <input
                  type="text"
                  value={searchCobros}
                  onChange={(e) => setSearchCobros(e.target.value)}
                  placeholder="Buscar estudiante (nombre, DNI)..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none"
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

              <select
                value={filtroEstadoCobro}
                onChange={(e) => setFiltroEstadoCobro(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-semibold outline-none"
              >
                <option value="todos">Todos los cobros</option>
                <option value="transferencias">Solo Transferencias</option>
                <option value="validados">Validados</option>
                <option value="pendientes">Pendientes de Visado</option>
                <option value="anulados">Anulados</option>
              </select>
            </div>
          </div>

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
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {filteredPagos.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      <i className="fa-solid fa-filter-circle-xmark text-2xl mb-2 block"></i>
                      No se encontraron cobros que coincidan con el filtro predictivo.
                    </td>
                  </tr>
                ) : (
                  filteredPagos.map((pago) => {
                    const alu = getStudent(pago.alumnoId);
                    const tut = getTutor(pago.tutorId);
                    const isAnulado = pago.estado === 'anulado';
                    const tieneAdjunto = Boolean(pago.comprobanteAdjunto);

                    return (
                      <tr
                        key={pago.id}
                        className={`transition ${
                          isAnulado
                            ? 'bg-rose-50/40 dark:bg-rose-950/20 text-slate-400'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {pago.id}
                          </div>
                          <div className="text-[11px] text-slate-500">{pago.fecha}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {alu ? `${alu.apellido}, ${alu.nombre}` : 'Estudiante'}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            DNI: {alu ? alu.dni : '-'} • {alu ? alu.curso : ''}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-xs">
                          <div className="font-medium text-slate-700 dark:text-slate-300">
                            {pago.conceptos.join(', ')}
                          </div>
                          {pago.descuento > 0 && (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">
                              Desc. Hermanos -${pago.descuento.toLocaleString('es-AR')}
                            </span>
                          )}
                          {isAnulado && pago.motivoAnulacion && (
                            <div className="text-[11px] text-rose-600 font-bold mt-0.5">
                              Motivo Anulación: "{pago.motivoAnulacion}"
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {pago.medio}
                          </span>
                          <span className="block font-mono text-[11px] text-slate-400">
                            Ref: {pago.comprobante}
                          </span>
                        </td>

                        {/* Columna Comprobante Adjunto (JPG, PNG, PDF) */}
                        <td className="py-3 px-4 text-center">
                          {tieneAdjunto ? (
                            <button
                              onClick={() =>
                                setPreviewComprobante({
                                  pagoId: pago.id,
                                  alumnoNombre: alu ? `${alu.apellido}, ${alu.nombre}` : 'Estudiante',
                                  comprobanteRef: pago.comprobante,
                                  medio: pago.medio,
                                  monto: pago.montoTotal,
                                  fecha: pago.fecha,
                                  adjunto: pago.comprobanteAdjunto
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-bold transition shadow-2xs"
                              title="Previsualizar o descargar comprobante digital"
                            >
                              <i className="fa-solid fa-paperclip"></i>
                              <span>Ver Archivo</span>
                            </button>
                          ) : pago.medio === 'Transferencia' ? (
                            <span className="text-[11px] text-amber-600 font-semibold font-mono">
                              Sin archivo
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">-</span>
                          )}
                        </td>

                        <td
                          className={`py-3 px-4 text-right font-mono font-bold ${
                            isAnulado ? 'line-through text-rose-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          ${pago.montoTotal.toLocaleString('es-AR')}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isAnulado ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                              ANULADO
                            </span>
                          ) : pago.validadoTesoreria ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                              <i className="fa-solid fa-check-double mr-1"></i>
                              Validado
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              Pend. Visado
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setActiveReciboId(pago.id)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                              title="Ver / Imprimir Recibo Oficial Institucional"
                            >
                              <i className="fa-solid fa-print"></i>
                            </button>

                            {!isAnulado && isTesorero && (
                              <>
                                {!pago.validadoTesoreria && (
                                  <button
                                    onClick={() => validarPagoTesoreria(pago.id)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold"
                                    title="Validar y visar en Tesorería"
                                  >
                                    <i className="fa-solid fa-check"></i>
                                  </button>
                                )}
                                <button
                                  onClick={() => openEditModal(pago)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold"
                                  title="Rectificar pago con justificación"
                                >
                                  <i className="fa-solid fa-pen"></i>
                                </button>
                                <button
                                  onClick={() => {
                                    setAnularTarget(pago);
                                    setMotivoAnulacion('');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold"
                                  title="Anular pago y revertir cuotas a pendiente"
                                >
                                  <i className="fa-solid fa-ban"></i>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
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
                  const pendientesCount = cuotasAlu.filter((c) => c.estado !== 'pagada').length;

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
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pendientesCount === 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
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
                      DNI {activeStudentCuotas.dni} • Curso: {activeStudentCuotas.curso} "{activeStudentCuotas.division}" ({activeStudentCuotas.turno})
                      {activeStudentTutor && ` • Tutor: ${activeStudentTutor.apellido}, ${activeStudentTutor.nombre}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {cuotasDelAlumno.filter((c) => c.estado === 'pagada').length} Pagadas / {cuotasDelAlumno.length} Totales
                    </span>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-3">Concepto / Período</th>
                        <th className="py-2.5 px-3">Vencimiento</th>
                        <th className="py-2.5 px-3 text-right">Valor Arancel</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                        <th className="py-2.5 px-3 text-center">Auditoría Ajustes</th>
                        <th className="py-2.5 px-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {cuotasDelAlumno.map((cuota) => {
                        const tieneAjustes = cuota.historialAjustes && cuota.historialAjustes.length > 0;
                        const isPagada = cuota.estado === 'pagada';

                        return (
                          <tr key={cuota.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-800 dark:text-slate-100 block">
                                {cuota.concepto}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                Período: {cuota.periodo}
                              </span>
                            </td>

                            <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                              {cuota.vencimiento}
                            </td>

                            <td className="py-3 px-3 text-right font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                              ${cuota.monto.toLocaleString('es-AR')}
                            </td>

                            <td className="py-3 px-3 text-center">
                              {isPagada ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Pagada ({cuota.pagoId})
                                </span>
                              ) : cuota.estado === 'vencida' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                  Vencida
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Pendiente
                                </span>
                              )}
                            </td>

                            {/* Indicador de Auditoría de Ajustes */}
                            <td className="py-3 px-3 text-center">
                              {tieneAjustes ? (
                                <button
                                  onClick={() => setCuotaHistorialTarget(cuota)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 text-[10px] font-bold hover:bg-indigo-100"
                                  title="Ver trazabilidad de modificaciones de este arancel"
                                >
                                  <i className="fa-solid fa-clock-rotate-left"></i>
                                  <span>{cuota.historialAjustes.length} ajuste(s)</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-mono">Original</span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-right">
                              {isTesorero && (
                                <button
                                  onClick={() => openAjustarCuotaModal(cuota)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-bold transition flex items-center gap-1 ml-auto"
                                  title="Editar valor de cuota exigiendo justificación obligatoria"
                                >
                                  <i className="fa-solid fa-pen-to-square"></i>
                                  <span>Ajustar Monto</span>
                                </button>
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
      {/* SUBPESTAÑA 3: EGRESOS Y CIERRES DE CAJA DE COOPERADORA */}
      {/* ========================================================================= */}
      {subTab === 'egresos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
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
                      {eg.fecha} • {eg.categoria} • Factura: <span className="font-mono">{eg.comprobante}</span>
                    </p>
                  </div>
                  <span className="font-mono font-bold text-rose-600 text-sm shrink-0">
                    -${eg.importe.toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <i className="fa-solid fa-lock text-amber-600"></i>
              Actas de Cierre de Período Consolidado
            </h3>
            <div className="space-y-3 text-xs">
              {(state.tesoreria?.cierresPeriodo || []).map((cierre) => (
                <div
                  key={cierre.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-900 dark:text-white">{cierre.periodo}</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      Saldo Final: ${cierre.saldoFinal?.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                    <span>Cierre: {cierre.fechaCierre}</span>
                    <span>Resp: {cierre.responsable}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBPESTAÑA 4: BITÁCORA INMUTABLE DE AUDITORÍA (RNF-02) */}
      {/* ========================================================================= */}
      {subTab === 'auditoria' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-emerald-600"></i>
                Bitácora de Auditoría Fiscal Inmutable (RNF-02)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro criptográfico y cronológico de todas las modificaciones de aranceles, cobros, visados y sesiones seguras.
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
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {log.accion}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {log.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    {log.detalle}
                  </p>
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
      {/* MODAL 1: AJUSTE DE CUOTA INDIVIDUAL CON MOTIVO OBLIGATORIO DE AUDITORÍA */}
      {/* ========================================================================= */}
      {cuotaAjustarTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-pen-nib text-emerald-400"></i>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    Ajuste de Arancel de Cuota (Tesorería)
                  </h3>
                  <p className="text-[11px] text-emerald-200 font-mono">
                    Auditoría Obligatoria • Escuela Normal Superior DVS
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCuotaAjustarTarget(null)}
                className="text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmarAjusteCuota} className="p-5 space-y-4 text-xs">
              {errorAjuste && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-700 dark:text-rose-300 rounded-xl font-semibold">
                  {errorAjuste}
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Concepto:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{cuotaAjustarTarget.concepto}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valor actual:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">
                    ${cuotaAjustarTarget.monto.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Nuevo Valor de la Cuota ($):
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={montoCuotaAjuste}
                  onChange={(e) => setMontoCuotaAjuste(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold">
                    Motivo del Ajuste (Auditoría Obligatoria):
                  </label>
                  <span className="text-[10px] text-rose-600 font-bold">* Requerido</span>
                </div>
                <textarea
                  rows="3"
                  required
                  value={motivoCuotaAjuste}
                  onChange={(e) => setMotivoCuotaAjuste(e.target.value)}
                  placeholder="Explique la causa del cambio (ej: Beca social acordada, recargo no imputado, descuento directivo)..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 text-xs"
                />
              </div>

              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 text-amber-900 dark:text-amber-300 text-[11px] flex items-center gap-2">
                <i className="fa-solid fa-shield text-amber-600"></i>
                <span>Este cambio quedará registrado permanentemente con fecha, hora y usuario responsable.</span>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCuotaAjustarTarget(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-check"></i>
                  <span>Guardar y Auditar Ajuste</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REAJUSTE GENERAL MASIVO DE CUOTAS */}
      {/* ========================================================================= */}
      {isGeneralModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-indigo-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-sliders text-indigo-300"></i>
                <div>
                  <h3 className="font-bold text-base">Reajuste General Arancelario</h3>
                  <p className="text-[11px] text-indigo-200 font-mono">
                    Actualización masiva de cuotas pendientes con justificación
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGeneralModalOpen(false)}
                className="text-indigo-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmarAjusteGeneral} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Alcance del Ajuste:
                </label>
                <select
                  value={periodoGeneral}
                  onChange={(e) => setPeriodoGeneral(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                >
                  <option value="todos_pendientes">Todas las cuotas pendientes del ciclo lectivo 2026</option>
                  <option value="2026-07">Cuota Julio 2026</option>
                  <option value="2026-08">Cuota Agosto 2026</option>
                  <option value="2026-09">Cuota Septiembre 2026</option>
                  <option value="2026-10">Cuota Octubre 2026</option>
                  <option value="2026-11">Cuota Noviembre 2026</option>
                  <option value="2026-12">Cuota Diciembre 2026</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Nuevo Valor Arancelario ($):
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={montoGeneral}
                  onChange={(e) => setMontoGeneral(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Motivo y Justificación Institucional (Obligatorio):
                </label>
                <textarea
                  rows="3"
                  required
                  value={motivoGeneral}
                  onChange={(e) => setMotivoGeneral(e.target.value)}
                  placeholder="Justifique el motivo del reajuste general..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsGeneralModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold shadow-md"
                >
                  Aplicar Reajuste Masivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: HISTORIAL DE AUDITORÍA DE UNA CUOTA */}
      {/* ========================================================================= */}
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
                <div key={i} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-1">
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

      {/* ========================================================================= */}
      {/* MODAL 4: MODIFICAR PAGO EXISTENTE (HU-05) */}
      {/* ========================================================================= */}
      {editTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-amber-600 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Modificar Asiento: {editTarget.id}</h3>
              <button onClick={() => setEditTarget(null)} className="text-amber-100 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleConfirmarEdicion} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Importe Total:</label>
                <input
                  type="number"
                  required
                  value={nuevoImporte}
                  onChange={(e) => setNuevoImporte(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-mono text-sm"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Medio de Pago:</label>
                <select
                  value={nuevoMedio}
                  onChange={(e) => setNuevoMedio(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Motivo Obligatorio:</label>
                <textarea
                  required
                  rows="3"
                  value={motivoEdicion}
                  onChange={(e) => setMotivoEdicion(e.target.value)}
                  placeholder="Justifique la modificación del pago..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setEditTarget(null)} className="px-4 py-2 border rounded-xl">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-amber-600 text-white font-bold rounded-xl">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ANULAR PAGO (HU-06) */}
      {/* ========================================================================= */}
      {anularTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-rose-700 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Anular Recibo: {anularTarget.id}</h3>
              <button onClick={() => setAnularTarget(null)} className="text-rose-100 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleConfirmarAnulacion} className="p-5 space-y-4 text-xs">
              <p className="text-rose-600 font-semibold">
                Esta acción revertirá las cuotas asociadas al estado Pendiente e invalidará el recibo oficial.
              </p>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Motivo de Anulación (Obligatorio):</label>
                <textarea
                  required
                  rows="3"
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  placeholder="Explique por qué se anula el cobro..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setAnularTarget(null)} className="px-4 py-2 border rounded-xl">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-rose-700 text-white font-bold rounded-xl">Confirmar Anulación</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR EGRESO */}
      {isEgresoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-rose-800 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Registrar Egreso / Inversión Escolar</h3>
              <button onClick={() => setIsEgresoModalOpen(false)} className="text-rose-200 hover:text-white">✕</button>
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
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Importe ($):</label>
                <input
                  type="number"
                  required
                  value={egresoImporte}
                  onChange={(e) => setEgresoImporte(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">N° Comprobante / Factura:</label>
                <input
                  type="text"
                  value={egresoComprobante}
                  onChange={(e) => setEgresoComprobante(e.target.value)}
                  placeholder="FC-B-0001-..."
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsEgresoModalOpen(false)} className="px-4 py-2 border rounded-xl">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-rose-700 text-white font-bold rounded-xl">Registrar Egreso</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CIERRE PERÍODO */}
      {isCierreModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-amber-600 text-slate-950 px-5 py-4 flex items-center justify-between">
              <h3 className="font-black text-base">Ejecutar Cierre de Período Contable</h3>
              <button onClick={() => setIsCierreModalOpen(false)} className="font-bold">✕</button>
            </div>
            <form onSubmit={handleConfirmarCierre} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Consolida el saldo de ingresos y egresos al cierre del período mensual en Tesorería.
              </p>
              <div>
                <label className="block font-bold mb-1">Nombre del Período a Cerrar:</label>
                <input
                  type="text"
                  required
                  value={nombrePeriodoCierre}
                  onChange={(e) => setNombrePeriodoCierre(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsCierreModalOpen(false)} className="px-4 py-2 border rounded-xl">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl">Ejecutar Cierre</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
