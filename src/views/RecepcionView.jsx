import React, { useState } from 'react';
import { useCooperadora } from '../context/CooperadoraContext';
import {
  CUOTA_BASE,
  DESCUENTO_HERMANO_PCT,
  RECARGO_MORA_PCT,
  MESES_CICLO
} from '../data/mockData';

export default function RecepcionView() {
  const {
    state,
    selectedCuotaIds,
    getStudent,
    getTutor,
    getStudentCuotas,
    getStudentSiblings,
    hasSiblingDiscount,
    selectStudent,
    toggleCuotaSelection,
    selectAllPendingForStudent,
    registrarCobro,
    registrarNuevaCuota,
    setActiveReciboId
  } = useCooperadora();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCobroModalOpen, setIsCobroModalOpen] = useState(false);
  const [isCuotaModalOpen, setIsCuotaModalOpen] = useState(false);

  // Estado formulario Cobro
  const [medioPago, setMedioPago] = useState('Efectivo');
  const [comprobanteRef, setComprobanteRef] = useState('');
  const [fechaCobro, setFechaCobro] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [aplicarRecargo, setAplicarRecargo] = useState(false);
  const [observacionesCobro, setObservacionesCobro] = useState('');

  // Estado formulario Nueva Cuota (Caso de Uso: Registrar cuota / gestionarCuotas)
  const [cuotaAlcance, setCuotaAlcance] = useState('actual');
  const [cuotaConcepto, setCuotaConcepto] = useState('Bono Contribución Materiales Taller');
  const [cuotaPeriodo, setCuotaPeriodo] = useState('2026-EXT');
  const [cuotaVencimiento, setCuotaVencimiento] = useState('30/06/2026');
  const [cuotaMonto, setCuotaMonto] = useState(CUOTA_BASE);

  const canOperate = state.role === 'secretaria' || state.role === 'tesorero';

  const filteredStudents = state.alumnos.filter((a) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      a.apellido.toLowerCase().includes(q) ||
      a.nombre.toLowerCase().includes(q) ||
      a.dni.includes(q) ||
      a.curso.toLowerCase().includes(q)
    );
  });

  const currentStudent =
    getStudent(state.selectedStudentId) || state.alumnos[0];
  const tutor = currentStudent ? getTutor(currentStudent.tutorId) : null;
  const siblings = currentStudent ? getStudentSiblings(currentStudent.id) : [];
  const aplicaDesc = currentStudent
    ? hasSiblingDiscount(currentStudent.id)
    : false;
  const cuotas = currentStudent ? getStudentCuotas(currentStudent.id) : [];

  const cuotasPagadas = cuotas.filter((c) => c.estado === 'pagada').length;
  const cuotasVencidas = cuotas.filter((c) => c.estado === 'vencida').length;
  const cuotasPendientes = cuotas.filter((c) => c.estado === 'pendiente').length;

  const selectedCuotasObj = cuotas.filter((c) =>
    selectedCuotaIds.includes(c.id)
  );
  const subtotalSeleccionado = selectedCuotasObj.reduce(
    (acc, c) => acc + c.monto,
    0
  );
  const descuentoCalculado = aplicaDesc
    ? Math.round(subtotalSeleccionado * DESCUENTO_HERMANO_PCT)
    : 0;
  const montoVencidasSeleccionadas = selectedCuotasObj
    .filter((c) => c.estado === 'vencida')
    .reduce((acc, c) => acc + c.monto, 0);
  const recargoCalculado = aplicarRecargo
    ? Math.round(montoVencidasSeleccionadas * RECARGO_MORA_PCT)
    : 0;
  const totalAPagar =
    subtotalSeleccionado - descuentoCalculado + recargoCalculado;

  const openCobroModal = () => {
    if (!canOperate) return;
    if (selectedCuotaIds.length === 0) return;
    const nextNum = state.pagos.length + 1;
    setMedioPago('Efectivo');
    setComprobanteRef(`CAJA-00${nextNum}`);
    setFechaCobro(new Date().toISOString().split('T')[0]);
    setAplicarRecargo(false);
    setObservacionesCobro('');
    setIsCobroModalOpen(true);
  };

  const handleConfirmarCobro = (e) => {
    e.preventDefault();
    if (!currentStudent || selectedCuotaIds.length === 0) return;
    const refFinal =
      comprobanteRef.trim() ||
      (medioPago === 'Efectivo'
        ? `CAJA-${Date.now().toString().slice(-4)}`
        : `TRF-${Date.now().toString().slice(-5)}`);

    registrarCobro({
      studentId: currentStudent.id,
      cuotaIds: selectedCuotaIds,
      medio: medioPago,
      comprobanteRef: refFinal,
      fecha: fechaCobro,
      aplicarRecargoMora: aplicarRecargo,
      observaciones: observacionesCobro
    });
    setIsCobroModalOpen(false);
  };

  const handleCrearCuota = (e) => {
    e.preventDefault();
    if (!cuotaConcepto.trim()) return;
    registrarNuevaCuota({
      alumnoId: cuotaAlcance === 'todos' ? 'todos' : currentStudent.id,
      concepto: cuotaConcepto,
      periodo: cuotaPeriodo,
      vencimiento: cuotaVencimiento,
      monto: Number(cuotaMonto) || CUOTA_BASE
    });
    setIsCuotaModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: BUSCADOR DE ALUMNOS (HU-03 / RF-06) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-magnifying-glass text-blue-600"></i>
                Buscar Alumno (HU-03)
              </h2>
              <span className="text-[11px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md border border-blue-200">
                {state.alumnos.length} Matriculados
              </span>
            </div>

            <div className="relative mb-3">
              <i className="fa-solid fa-search absolute left-3.5 top-3 text-slate-400 text-sm"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por DNI, Apellido, Nombre o Curso..."
                className="w-full pl-9 pr-8 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            {/* Accesos rápidos de prueba */}
            <div className="mb-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase mb-1.5">
                Casos de Prueba Rápidos (RF-05):
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => selectStudent('alu-1')}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition ${
                    currentStudent?.id === 'alu-1'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  <i className="fa-solid fa-people-roof mr-1"></i> Gómez, Sofía (Con Hermano -20%)
                </button>
                <button
                  onClick={() => selectStudent('alu-3')}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition ${
                    currentStudent?.id === 'alu-3'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  <i className="fa-solid fa-user mr-1"></i> Pérez, Mateo (Sin hermanos)
                </button>
                <button
                  onClick={() => selectStudent('alu-4')}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition ${
                    currentStudent?.id === 'alu-4'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  <i className="fa-solid fa-people-roof mr-1"></i> Fernández, Valentina (3 Hermanos)
                </button>
              </div>
            </div>

            {/* Lista de resultados */}
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto rounded-xl border border-slate-200">
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No se encontraron alumnos con ese criterio.
                </div>
              ) : (
                filteredStudents.map((alu) => {
                  const isSelected = currentStudent?.id === alu.id;
                  const hasSibs = hasSiblingDiscount(alu.id);
                  const aluCuotas = getStudentCuotas(alu.id);
                  const vencidasCount = aluCuotas.filter(
                    (c) => c.estado === 'vencida'
                  ).length;

                  return (
                    <button
                      key={alu.id}
                      onClick={() => selectStudent(alu.id)}
                      className={`w-full text-left p-3 transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50/90 border-l-4 border-l-blue-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                          {alu.apellido}, {alu.nombre}
                          {hasSibs && (
                            <span
                              title="Bonificación 20% por hermanos activa"
                              className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold"
                            >
                              -20% Hnos
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          DNI: <span className="font-mono">{alu.dni}</span> •{' '}
                          {alu.curso} "{alu.division}" ({alu.turno})
                        </div>
                      </div>
                      <div className="text-right">
                        {vencidasCount > 0 ? (
                          <span className="inline-block text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            {vencidasCount} venc.
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            Al día
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Tarjeta Resumen Reglas de Negocio */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl p-5 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-scale-balanced"></i> Reglas de Negocio Activas
            </h3>
            <ul className="text-xs space-y-2.5 text-slate-300">
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-circle-check text-emerald-400 mt-0.5"></i>
                <span>
                  <strong>RF-05 (Descuento Familiar):</strong> Si el socio/tutor tiene 2 o más hijos matriculados, el sistema deduce automáticamente un <strong>20%</strong> sobre cada cuota seleccionada.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-circle-check text-emerald-400 mt-0.5"></i>
                <span>
                  <strong>Clase Cuota (`calcularRecargo()`):</strong> Permite aplicar recargo del 10% sobre cuotas en estado <em>Vencida</em> si la comisión directiva lo dispone.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-circle-check text-emerald-400 mt-0.5"></i>
                <span>
                  <strong>RF-04 / RF-07 (Medios y Comprobante):</strong> Acepta Efectivo y Transferencia, emitiendo el recibo numerado listo para imprimir o descargar en PDF.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* COLUMNA DERECHA: FICHA DEL ALUMNO Y GESTIÓN DE CUOTAS */}
        <div className="lg:col-span-8 space-y-6">
          {currentStudent && (
            <>
              {/* Ficha del Alumno y Vínculo Familiar (RF-01, RF-02) */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xl shadow-sm shrink-0">
                      {currentStudent.apellido[0]}
                      {currentStudent.nombre[0]}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-slate-800">
                          {currentStudent.apellido}, {currentStudent.nombre}
                        </h2>
                        <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                          {currentStudent.curso} "{currentStudent.division}" • Turno{' '}
                          {currentStudent.turno}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        DNI Alumno:{' '}
                        <strong className="font-mono text-slate-700">
                          {currentStudent.dni}
                        </strong>{' '}
                        | Legajo ID:{' '}
                        <span className="font-mono">{currentStudent.id}</span>
                      </p>
                    </div>
                  </div>

                  {/* Resumen rápido de cuotas del alumno */}
                  <div className="flex items-center gap-2 self-start md:self-center">
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                      <span className="block text-sm font-black text-emerald-700">
                        {cuotasPagadas}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-emerald-600">
                        Pagadas
                      </span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-center">
                      <span className="block text-sm font-black text-red-700">
                        {cuotasVencidas}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-red-600">
                        Vencidas
                      </span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                      <span className="block text-sm font-black text-amber-700">
                        {cuotasPendientes}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-amber-600">
                        Pendientes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bloque Tutor y Hermanos (RF-02 y RF-05) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Socio / Padre o Tutor Responsable (RF-02)
                      </span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                        Socio {tutor?.estado || 'Activo'}
                      </span>
                    </div>
                    {tutor ? (
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {tutor.apellido}, {tutor.nombre}{' '}
                          <span className="font-normal text-xs text-slate-500">
                            (DNI {tutor.dni})
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3">
                          <span>
                            <i className="fa-solid fa-phone mr-1 text-slate-400"></i>
                            {tutor.telefono}
                          </span>
                          <span>
                            <i className="fa-solid fa-envelope mr-1 text-slate-400"></i>
                            {tutor.email}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Sin tutor asignado</p>
                    )}
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border ${
                      aplicaDesc
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Vínculo de Hermanos (RF-05)
                      </span>
                      {aplicaDesc ? (
                        <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                          <i className="fa-solid fa-percent mr-1"></i>20% DESCUENTO ACTIVO
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                          Tarifa Estándar
                        </span>
                      )}
                    </div>
                    {siblings.length > 0 ? (
                      <div className="space-y-1">
                        <p className="text-xs text-emerald-900 font-medium">
                          Comparte tutor con {siblings.length} hermano(s) en la institución:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {siblings.map((sib) => (
                            <button
                              key={sib.id}
                              onClick={() => selectStudent(sib.id)}
                              className="text-xs bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md font-semibold transition"
                            >
                              <i className="fa-solid fa-user-graduate mr-1"></i>
                              {sib.nombre} ({sib.curso} "{sib.division}")
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1">
                        No registra hermanos asociados al mismo tutor. Se aplica el 100% del valor nominal de la cuota (${CUOTA_BASE.toLocaleString('es-AR')}).
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabla de Cuotas del Alumno (RF-03, RF-04, RF-06) */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <i className="fa-solid fa-calendar-check text-blue-600"></i>
                      Plan de Cuotas y Estado de Cuenta (Ciclo 2026)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Seleccione una o más cuotas pendientes/vencidas para registrar el cobro y emitir el recibo.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {canOperate && (
                      <>
                        <button
                          onClick={() => setIsCuotaModalOpen(true)}
                          className="text-xs bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-2 rounded-xl border border-slate-300 transition flex items-center gap-1.5 shadow-sm"
                          title="Caso de Uso Secretaría: Registrar cuota / gestionarCuotas()"
                        >
                          <i className="fa-solid fa-plus text-blue-600"></i>
                          Registrar Cuota / Cargo
                        </button>
                        <button
                          onClick={() =>
                            selectAllPendingForStudent(currentStudent.id)
                          }
                          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-2 rounded-xl border border-blue-200 transition"
                        >
                          Seleccionar Impagas
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                        <th className="py-3 px-4 w-10 text-center">Sel.</th>
                        <th className="py-3 px-4">Concepto / Período</th>
                        <th className="py-3 px-4">Vencimiento</th>
                        <th className="py-3 px-4 text-right">Valor Base</th>
                        <th className="py-3 px-4 text-right">
                          {aplicaDesc ? 'Con Desc. -20%' : 'Importe Final'}
                        </th>
                        <th className="py-3 px-4 text-center">Estado</th>
                        <th className="py-3 px-4 text-right">Comprobante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {cuotas.map((c) => {
                        const isPaid = c.estado === 'pagada';
                        const isChecked = selectedCuotaIds.includes(c.id);
                        const finalMonto = aplicaDesc
                          ? Math.round(c.monto * (1 - DESCUENTO_HERMANO_PCT))
                          : c.monto;

                        return (
                          <tr
                            key={c.id}
                            onClick={() => {
                              if (!isPaid && canOperate) {
                                toggleCuotaSelection(c.id);
                              }
                            }}
                            className={`transition ${
                              isPaid
                                ? 'bg-slate-50/60 text-slate-500'
                                : isChecked
                                ? 'bg-blue-50/70 cursor-pointer'
                                : 'hover:bg-slate-50 cursor-pointer'
                            }`}
                          >
                            <td
                              className="py-3 px-4 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {isPaid ? (
                                <i className="fa-solid fa-lock text-emerald-600 text-xs"></i>
                              ) : (
                                <input
                                  type="checkbox"
                                  disabled={!canOperate}
                                  checked={isChecked}
                                  onChange={() => toggleCuotaSelection(c.id)}
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              )}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800">
                              {c.concepto}
                              <span className="block text-[11px] font-mono text-slate-400">
                                Período: {c.periodo}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs font-mono text-slate-600">
                              {c.vencimiento}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-500">
                              ${c.monto.toLocaleString('es-AR')}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                              ${finalMonto.toLocaleString('es-AR')}
                              {aplicaDesc && (
                                <span className="block text-[10px] text-emerald-600 font-semibold">
                                  Ahorra $
                                  {(c.monto - finalMonto).toLocaleString('es-AR')}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {c.estado === 'pagada' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                  <i className="fa-solid fa-circle-check"></i> Pagada
                                </span>
                              )}
                              {c.estado === 'vencida' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                  <i className="fa-solid fa-triangle-exclamation"></i> Vencida
                                </span>
                              )}
                              {c.estado === 'pendiente' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                  <i className="fa-regular fa-clock"></i> Pendiente
                                </span>
                              )}
                            </td>
                            <td
                              className="py-3 px-4 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {isPaid && c.pagoId ? (
                                <button
                                  onClick={() => setActiveReciboId(c.pagoId)}
                                  className="text-xs bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg font-bold transition shadow-sm"
                                >
                                  <i className="fa-solid fa-receipt mr-1"></i>
                                  {c.pagoId}
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Barra Inferior de Liquidación y Cobro */}
                <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-400 uppercase font-bold">
                      Liquidación de Cuotas Seleccionadas ({selectedCuotaIds.length})
                    </div>
                    <div className="flex flex-wrap items-baseline gap-3 mt-1">
                      <span className="text-2xl font-black text-emerald-400">
                        $
                        {(
                          subtotalSeleccionado - descuentoCalculado
                        ).toLocaleString('es-AR')}
                      </span>
                      {aplicaDesc && subtotalSeleccionado > 0 && (
                        <span className="text-xs text-emerald-300 bg-emerald-950/80 border border-emerald-700 px-2 py-0.5 rounded-md">
                          Subtotal ${subtotalSeleccionado.toLocaleString('es-AR')} - Desc. Hnos 20% (-$
                          {descuentoCalculado.toLocaleString('es-AR')})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedCuotaIds.length > 0 && (
                      <button
                        onClick={() => selectStudent(currentStudent.id)}
                        className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                      >
                        Limpiar
                      </button>
                    )}
                    <button
                      disabled={!canOperate || selectedCuotaIds.length === 0}
                      onClick={openCobroModal}
                      className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-lg ${
                        canOperate && selectedCuotaIds.length > 0
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <i className="fa-solid fa-cash-register"></i>
                      {canOperate
                        ? `Registrar Cobro (${selectedCuotaIds.length})`
                        : 'Rol de Solo Consulta'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL DE COBRO Y EMISIÓN DE RECIBO (RF-04, RF-05, RF-07) */}
      {isCobroModalOpen && currentStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <i className="fa-solid fa-cash-register text-emerald-400 text-lg"></i>
                <div>
                  <h3 className="font-bold text-base">
                    Confirmar Cobro y Emitir Comprobante
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Método: Pago.registrar() • Comprobante.emitir()
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCobroModalOpen(false)}
                className="text-blue-200 hover:text-white"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleConfirmarCobro} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Alumno:</span>
                  <span className="font-bold text-slate-800">
                    {currentStudent.apellido}, {currentStudent.nombre} (
                    {currentStudent.curso} "{currentStudent.division}")
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Socio / Tutor:</span>
                  <span className="font-semibold text-slate-700">
                    {tutor ? `${tutor.apellido}, ${tutor.nombre}` : 'S/D'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cuotas seleccionadas:</span>
                  <span className="font-bold text-blue-700">
                    {selectedCuotasObj.map((c) => c.concepto).join(', ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Medio de Pago (RF-04)
                  </label>
                  <select
                    value={medioPago}
                    onChange={(e) => {
                      const nextMedio = e.target.value;
                      setMedioPago(nextMedio);
                      const nextNum = state.pagos.length + 1;
                      setComprobanteRef(
                        nextMedio === 'Efectivo'
                          ? `CAJA-00${nextNum}`
                          : `TRF-${Date.now().toString().slice(-5)}`
                      );
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="Efectivo">Efectivo (Caja Presencial)</option>
                    <option value="Transferencia">Transferencia Bancaria / Alias</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    N° Operación / Referencia
                  </label>
                  <input
                    type="text"
                    required
                    value={comprobanteRef}
                    onChange={(e) => setComprobanteRef(e.target.value)}
                    placeholder="Ej: TRF-994812 o CAJA-006"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Fecha de Cobro
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaCobro}
                    onChange={(e) => setFechaCobro(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Observaciones (Opcional)
                  </label>
                  <input
                    type="text"
                    value={observacionesCobro}
                    onChange={(e) => setObservacionesCobro(e.target.value)}
                    placeholder="Nota en el recibo..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              {/* Opción del Diagrama de Clases: Cuota.calcularRecargo() */}
              {montoVencidasSeleccionadas > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-amber-900 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aplicarRecargo}
                      onChange={(e) => setAplicarRecargo(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600"
                    />
                    <span>
                      Ejecutar <code className="font-mono">Cuota.calcularRecargo()</code> (+10% mora sobre cuotas vencidas)
                    </span>
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-800">
                    +$
                    {Math.round(
                      montoVencidasSeleccionadas * RECARGO_MORA_PCT
                    ).toLocaleString('es-AR')}
                  </span>
                </div>
              )}

              {/* Desglose Financiero */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal Nominal ({selectedCuotaIds.length} cuota/s):</span>
                  <span className="font-mono">
                    ${subtotalSeleccionado.toLocaleString('es-AR')}
                  </span>
                </div>
                {aplicaDesc && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Bonificación 20% por Hermanos (RF-05):</span>
                    <span className="font-mono">
                      -${descuentoCalculado.toLocaleString('es-AR')}
                    </span>
                  </div>
                )}
                {recargoCalculado > 0 && (
                  <div className="flex justify-between text-amber-300 font-semibold">
                    <span>Recargo por Mora (10%):</span>
                    <span className="font-mono">
                      +${recargoCalculado.toLocaleString('es-AR')}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between items-center text-base font-black">
                  <span>TOTAL A COBRAR:</span>
                  <span className="text-emerald-400 font-mono text-lg">
                    ${totalAPagar.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCobroModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-check-double"></i>
                  Confirmar y Emitir Recibo Oficial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA REGISTRAR CUOTA / CARGO EXTRAORDINARIO (Caso de Uso Secretaría: Registrar cuota) */}
      {isCuotaModalOpen && currentStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <i className="fa-solid fa-file-invoice-dollar text-blue-400"></i>
                  Registrar Nueva Cuota / Cargo (RF-03)
                </h3>
                <p className="text-[11px] text-slate-300">
                  Caso de Uso Secretaría: Registrar cuota • Cuota.gestionar()
                </p>
              </div>
              <button
                onClick={() => setIsCuotaModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleCrearCuota} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Alcance de la Cuota
                </label>
                <select
                  value={cuotaAlcance}
                  onChange={(e) => setCuotaAlcance(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                >
                  <option value="actual">
                    Solo al alumno seleccionado ({currentStudent.apellido},{' '}
                    {currentStudent.nombre})
                  </option>
                  <option value="todos">
                    A todos los alumnos del Padrón ({state.alumnos.length} alumnos)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Concepto de la Cuota
                </label>
                <input
                  type="text"
                  required
                  value={cuotaConcepto}
                  onChange={(e) => setCuotaConcepto(e.target.value)}
                  placeholder="Ej: Cuota Extraordinaria Calefacción / Materiales"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Período
                  </label>
                  <input
                    type="text"
                    required
                    value={cuotaPeriodo}
                    onChange={(e) => setCuotaPeriodo(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Vencimiento
                  </label>
                  <input
                    type="text"
                    required
                    value={cuotaVencimiento}
                    onChange={(e) => setCuotaVencimiento(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Importe ($)
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={cuotaMonto}
                    onChange={(e) => setCuotaMonto(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCuotaModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Generar Cargo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
