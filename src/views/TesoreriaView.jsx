import React, { useState } from 'react';
import { useCooperadora } from '../context/CooperadoraContext';

export default function TesoreriaView() {
  const {
    state,
    getStudent,
    getTutor,
    setActiveReciboId,
    modificarPago,
    anularPago,
    validarPagoTesoreria,
    registrarEgresoTesoreria,
    cerrarPeriodoTesoreria
  } = useCooperadora();

  const isTesorero = state.role === 'tesorero';

  // Estado Modal Modificar Pago (HU-05, RF-10)
  const [editTarget, setEditTarget] = useState(null);
  const [nuevoImporte, setNuevoImporte] = useState('');
  const [nuevoMedio, setNuevoMedio] = useState('Efectivo');
  const [nuevoComprobante, setNuevoComprobante] = useState('');
  const [motivoEdicion, setMotivoEdicion] = useState('');

  // Estado Modal Anular Pago (HU-06, RF-10)
  const [anularTarget, setAnularTarget] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  // Estado Modal Registrar Egreso (Entidad TESORERIA: egresos)
  const [isEgresoModalOpen, setIsEgresoModalOpen] = useState(false);
  const [egresoConcepto, setEgresoConcepto] = useState('');
  const [egresoCategoria, setEgresoCategoria] = useState('Mantenimiento Edilicio');
  const [egresoImporte, setEgresoImporte] = useState('');
  const [egresoComprobante, setEgresoComprobante] = useState('');

  // Estado Modal Cerrar Período (Método Tesoreria.cerrarPeriodo())
  const [isCierreModalOpen, setIsCierreModalOpen] = useState(false);
  const [nombrePeriodoCierre, setNombrePeriodoCierre] = useState('2026-04 (Abril)');

  // Cálculos de Tesorería: Tesoreria.calcularSaldo()
  const saldoInicial = state.tesoreria?.saldoInicial || 0;
  const ingresosTotales = state.pagos
    .filter((p) => p.estado !== 'anulado')
    .reduce((acc, p) => acc + p.montoTotal, 0);
  const egresosLista = state.tesoreria?.egresos || [];
  const egresosTotales = egresosLista.reduce((acc, e) => acc + e.importe, 0);
  const saldoActualCaja = saldoInicial + ingresosTotales - egresosTotales;

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
      {/* PANEL CONSOLIDADO DE ENTIDAD TESORERIA (Diagrama de Clases y DER) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                Clase: Tesoreria • Tesorero
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Período Activo: {state.tesoreria?.periodoActual || '2026-03'}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-800 mt-1">
              Tesorería, Arqueo de Caja y Auditoría Fiscal (RF-09, RF-10, RNF-02)
            </h2>
            <p className="text-xs text-slate-500">
              Ejecución de métodos <code className="font-mono">Tesoreria.calcularSaldo()</code>, <code className="font-mono">Tesoreria.cerrarPeriodo()</code>, <code className="font-mono">Tesorero.validarPago()</code> y <code className="font-mono">Pago.anular()</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isTesorero ? (
              <>
                <button
                  onClick={() => setIsEgresoModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-arrow-trend-down"></i>
                  + Registrar Egreso / Gasto
                </button>
                <button
                  onClick={() => setIsCierreModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-sm"
                >
                  <i className="fa-solid fa-file-shield"></i>
                  Ejecutar cerrarPeriodo()
                </button>
              </>
            ) : (
              <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-600 text-xs font-semibold flex items-center gap-2">
                <i className="fa-solid fa-lock text-amber-600"></i>
                <span>
                  Vista en modo lectura para <strong>{state.role.toUpperCase()}</strong>. Cambie al rol <strong>Tesorero</strong> arriba para editar, anular o cerrar caja.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 4 Indicadores de Tesoreria.calcularSaldo() */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase text-slate-400">
              Saldo Inicial Período (DER)
            </span>
            <p className="text-xl font-black text-slate-800 font-mono mt-1">
              ${saldoInicial.toLocaleString('es-AR')}
            </p>
            <span className="text-[11px] text-slate-500">
              Fondo de reserva al inicio del ciclo
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[11px] font-bold uppercase text-emerald-700">
              + Ingresos por Cuotas (Válidos)
            </span>
            <p className="text-xl font-black text-emerald-700 font-mono mt-1">
              +${ingresosTotales.toLocaleString('es-AR')}
            </p>
            <span className="text-[11px] text-emerald-600">
              {state.pagos.filter((p) => p.estado !== 'anulado').length} recibos activos
            </span>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
            <span className="text-[11px] font-bold uppercase text-rose-700">
              - Egresos / Inversión Escolar
            </span>
            <p className="text-xl font-black text-rose-700 font-mono mt-1">
              -${egresosTotales.toLocaleString('es-AR')}
            </p>
            <span className="text-[11px] text-rose-600">
              {egresosLista.length} comprobantes de gasto
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-white shadow-md">
            <span className="text-[11px] font-bold uppercase text-amber-400">
              = Tesoreria.calcularSaldo()
            </span>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
              ${saldoActualCaja.toLocaleString('es-AR')}
            </p>
            <span className="text-[11px] text-slate-300">
              Saldo neto disponible en Cooperadora
            </span>
          </div>
        </div>
      </div>

      {/* LIBRO DIARIO DE PAGOS Y RECTIFICACIÓN (RF-10, HU-05, HU-06) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-book-journal-whills text-blue-600"></i>
              Libro Diario de Cobros y Comprobantes Emitidos
            </h3>
            <p className="text-xs text-slate-500">
              Según <strong>RF-09 y RF-10</strong>, Secretaría solo puede visualizar comprobantes; el <strong>Tesorero</strong> posee facultades exclusivas para Validar, Modificar (HU-05) o Anular (HU-06) con motivo obligatorio.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Recibo / Fecha</th>
                <th className="py-3 px-4">Alumno y Socio Tutor</th>
                <th className="py-3 px-4">Conceptos Abonados</th>
                <th className="py-3 px-4">Medio / Ref.</th>
                <th className="py-3 px-4 text-right">Importe Total</th>
                <th className="py-3 px-4 text-center">Estado / Visado</th>
                <th className="py-3 px-4 text-right">Acciones Fiscalización</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {state.pagos.map((pago) => {
                const alu = getStudent(pago.alumnoId);
                const tut = getTutor(pago.tutorId);
                const isAnulado = pago.estado === 'anulado';

                return (
                  <tr
                    key={pago.id}
                    className={`transition ${
                      isAnulado
                        ? 'bg-red-50/40 text-slate-400'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-800">
                        {pago.id}
                      </div>
                      <div className="text-xs text-slate-500">{pago.fecha}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">
                        {alu ? `${alu.apellido}, ${alu.nombre}` : 'Alumno'}
                      </div>
                      <div className="text-xs text-slate-500">
                        Tutor: {tut ? `${tut.apellido}, ${tut.nombre}` : 'S/D'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-slate-700">
                        {pago.conceptos.join(', ')}
                      </div>
                      {pago.descuento > 0 && (
                        <span className="inline-block text-[10px] text-emerald-700 font-bold">
                          Incluye Desc. Hnos -${pago.descuento.toLocaleString('es-AR')}
                        </span>
                      )}
                      {pago.historialEdiciones?.length > 0 && (
                        <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                          <i className="fa-solid fa-clock-rotate-left mr-1"></i>
                          Rectificado ({pago.historialEdiciones.length} vez/veces)
                        </div>
                      )}
                      {isAnulado && pago.motivoAnulacion && (
                        <div className="text-[11px] text-red-600 font-bold mt-0.5">
                          Motivo Anulación: "{pago.motivoAnulacion}"
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-semibold text-slate-700">
                        {pago.medio}
                      </span>
                      <span className="block font-mono text-[11px] text-slate-400">
                        Ref: {pago.comprobante}
                      </span>
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-mono font-bold ${
                        isAnulado
                          ? 'line-through text-red-400'
                          : 'text-slate-900'
                      }`}
                    >
                      ${pago.montoTotal.toLocaleString('es-AR')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isAnulado ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          ANULADO
                        </span>
                      ) : pago.validadoTesoreria ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <i className="fa-solid fa-check-double mr-1"></i>
                          Validado
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          Pend. Visado
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveReciboId(pago.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                          title="Ver / Imprimir Recibo Oficial"
                        >
                          <i className="fa-solid fa-print"></i>
                        </button>

                        {!isAnulado && isTesorero && (
                          <>
                            {!pago.validadoTesoreria && (
                              <button
                                onClick={() => validarPagoTesoreria(pago.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold"
                                title="Caso de Uso Tesorero: Validar Pago"
                              >
                                <i className="fa-solid fa-check mr-1"></i>
                                Validar
                              </button>
                            )}
                            <button
                              onClick={() => openEditModal(pago)}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold"
                              title="HU-05: Modificar Pago (Exclusivo Tesorero)"
                            >
                              <i className="fa-solid fa-pen"></i>
                            </button>
                            <button
                              onClick={() => {
                                setAnularTarget(pago);
                                setMotivoAnulacion('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold"
                              title="HU-06: Anular Pago y revertir cuotas"
                            >
                              <i className="fa-solid fa-ban"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FILA INFERIOR: EGRESOS / CIERRES Y BITÁCORA DE AUDITORÍA (RNF-02) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Egresos y Cierres de Período */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <i className="fa-solid fa-screwdriver-wrench text-rose-600"></i>
              Egresos e Inversión en la Escuela
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {egresosLista.map((eg) => (
                <div key={eg.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-800">{eg.concepto}</p>
                    <p className="text-slate-500">
                      {eg.fecha} • {eg.categoria} • Comp: <span className="font-mono">{eg.comprobante}</span>
                    </p>
                  </div>
                  <span className="font-mono font-bold text-rose-600 shrink-0">
                    -${eg.importe.toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <i className="fa-solid fa-lock text-amber-600"></i>
              Actas de Cierre de Período (<code className="font-mono">cerrarPeriodo()</code>)
            </h3>
            <div className="space-y-2.5 text-xs">
              {(state.tesoreria?.cierresPeriodo || []).map((cierre) => (
                <div
                  key={cierre.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Período: {cierre.periodo}</span>
                    <span className="font-mono text-emerald-700">
                      Saldo Final: ${cierre.saldoFinal.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Fecha Cierre: {cierre.fechaCierre} • Resp: {cierre.responsable}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bitácora de Auditoría Inmutable (RNF-02) */}
        <div className="lg:col-span-7 bg-slate-900 text-white rounded-2xl shadow-md p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-fingerprint"></i>
                Bitácora de Auditoría de Eventos Críticos (RNF-02)
              </h3>
              <p className="text-xs text-slate-400">
                Trazabilidad cronológica inalterable de cobros, rectificaciones, anulaciones y cierres.
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">
              {state.auditLogs.length} eventos
            </span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 text-xs font-mono">
            {state.auditLogs.map((log, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-slate-800/90 border border-slate-700/80 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 font-bold">
                    [{log.accion}] • {log.usuario}
                  </span>
                  <span className="text-slate-400">{log.timestamp}</span>
                </div>
                <p className="text-slate-200 font-sans text-xs">{log.detalle}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL MODIFICAR PAGO (HU-05 / RF-10) */}
      {editTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-amber-500 text-slate-950 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm">
                  Rectificar Pago Registrado ({editTarget.id})
                </h3>
                <p className="text-[11px] font-semibold">
                  HU-05 / RF-10 • Exclusivo Rol Tesorero
                </p>
              </div>
              <button onClick={() => setEditTarget(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleConfirmarEdicion} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Importe Total Rectificado ($)
                </label>
                <input
                  type="number"
                  required
                  value={nuevoImporte}
                  onChange={(e) => setNuevoImporte(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Medio de Pago
                  </label>
                  <select
                    value={nuevoMedio}
                    onChange={(e) => setNuevoMedio(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Comprobante Ref.
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevoComprobante}
                    onChange={(e) => setNuevoComprobante(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Motivo de Auditoría Obligatorio (RNF-02) *
                </label>
                <textarea
                  required
                  rows="2"
                  value={motivoEdicion}
                  onChange={(e) => setMotivoEdicion(e.target.value)}
                  placeholder="Explique la causa de la rectificación contable..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black"
                >
                  Guardar Rectificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ANULAR PAGO (HU-06 / RF-10 / Pago.anular()) */}
      {anularTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  Anular Comprobante {anularTarget.id} (Pago.anular())
                </h3>
                <p className="text-[11px] text-red-100">
                  HU-06 / RF-10 • Revertirá las cuotas a estado Pendiente
                </p>
              </div>
              <button onClick={() => setAnularTarget(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleConfirmarAnulacion} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Está por anular el recibo <strong>{anularTarget.id}</strong> por{' '}
                <strong>${anularTarget.montoTotal.toLocaleString('es-AR')}</strong>. El registro quedará trazado en la bitácora y las cuotas volverán a figurar impagas.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Motivo de Anulación Obligatorio (RNF-02) *
                </label>
                <textarea
                  required
                  rows="2"
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  placeholder="Ej: Transferencia rechazada / Error de imputación de alumno..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAnularTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                >
                  Confirmar Anulación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR EGRESO */}
      {isEgresoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-rose-700 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                Registrar Egreso / Inversión de Cooperadora
              </h3>
              <button onClick={() => setIsEgresoModalOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleConfirmarEgreso} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Concepto del Gasto *
                </label>
                <input
                  type="text"
                  required
                  value={egresoConcepto}
                  onChange={(e) => setEgresoConcepto(e.target.value)}
                  placeholder="Ej: Compra de pintura para aulas de 2° Año"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Categoría
                  </label>
                  <select
                    value={egresoCategoria}
                    onChange={(e) => setEgresoCategoria(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  >
                    <option value="Mantenimiento Edilicio">Mantenimiento Edilicio</option>
                    <option value="Material Didáctico">Material Didáctico</option>
                    <option value="Insumos Limpieza">Insumos Limpieza</option>
                    <option value="Equipamiento">Equipamiento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Importe ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={egresoImporte}
                    onChange={(e) => setEgresoImporte(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Factura / Comprobante Proveedor
                </label>
                <input
                  type="text"
                  value={egresoComprobante}
                  onChange={(e) => setEgresoComprobante(e.target.value)}
                  placeholder="Ej: FAC-C-0004-00019283"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEgresoModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  Asentar Egreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CERRAR PERÍODO CONTABLE (Tesoreria.cerrarPeriodo()) */}
      {isCierreModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                Consolidar y Cerrar Período (<code className="font-mono text-amber-400">cerrarPeriodo()</code>)
              </h3>
              <button onClick={() => setIsCierreModalOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleConfirmarCierre} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Identificador del Período a Consolidar
                </label>
                <input
                  type="text"
                  required
                  value={nombrePeriodoCierre}
                  onChange={(e) => setNombrePeriodoCierre(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono"
                />
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Saldo Inicial:</span>
                  <span className="font-mono">${saldoInicial.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>+ Ingresos Válidos:</span>
                  <span className="font-mono">+${ingresosTotales.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-semibold">
                  <span>- Egresos Registrados:</span>
                  <span className="font-mono">-${egresosTotales.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>Saldo Final Consolidado:</span>
                  <span className="font-mono">${saldoActualCaja.toLocaleString('es-AR')}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCierreModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black"
                >
                  Firmar Acta de Cierre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
