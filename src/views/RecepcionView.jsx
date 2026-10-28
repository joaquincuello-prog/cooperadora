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
    setActiveReciboId,
    setPreviewComprobante
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

  // Estado para Comprobante Digital de Transferencia (JPG, PNG, PDF)
  const [archivoComprobante, setArchivoComprobante] = useState(null);
  const [archivoError, setArchivoError] = useState('');

  // Estado formulario Nueva Cuota
  const [cuotaAlcance, setCuotaAlcance] = useState('actual');
  const [cuotaConcepto, setCuotaConcepto] = useState('Bono Contribución Materiales Taller');
  const [cuotaPeriodo, setCuotaPeriodo] = useState('2026-EXT');
  const [cuotaVencimiento, setCuotaVencimiento] = useState('30/06/2026');
  const [cuotaMonto, setCuotaMonto] = useState(CUOTA_BASE);

  const canOperate = state.role === 'secretaria' || state.role === 'tesorero' || state.role === 'admin';

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

  // Pagos asentados para el estudiante actual
  const pagosEstudiante = state.pagos.filter(
    (p) => p.alumnoId === currentStudent?.id
  );

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivoError('');

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const isValidExt = /\.(jpe?g|png|pdf)$/i.test(file.name);

    if (!validTypes.includes(file.type) && !isValidExt) {
      setArchivoError('Formato no soportado. Debe seleccionar un archivo en formato JPG, PNG o PDF.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setArchivoError('El archivo es demasiado grande. El límite institucional es de 8 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const formattedSize =
        file.size < 1024 * 1024
          ? `${Math.round(file.size / 1024)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      setArchivoComprobante({
        nombre: file.name,
        tipo: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png'),
        tamanio: formattedSize,
        fechaSubida: new Date().toISOString().replace('T', ' ').slice(0, 16),
        dataUrl: event.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  const openCobroModal = () => {
    if (!canOperate) return;
    if (selectedCuotaIds.length === 0) return;
    const nextNum = state.pagos.length + 1;
    setMedioPago('Efectivo');
    setComprobanteRef(`CAJA-00${nextNum}`);
    setFechaCobro(new Date().toISOString().split('T')[0]);
    setAplicarRecargo(false);
    setObservacionesCobro('');
    setArchivoComprobante(null);
    setArchivoError('');
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
      observaciones: observacionesCobro,
      comprobanteAdjunto: medioPago === 'Transferencia' ? archivoComprobante : null
    });

    setIsCobroModalOpen(false);
    setArchivoComprobante(null);
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
        
        {/* COLUMNA IZQUIERDA: BUSCADOR PREDICTIVO DE ALUMNOS (HU-03 / RF-06) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-magnifying-glass text-emerald-600"></i>
                Búsqueda Predictiva de Alumnos
              </h2>
              <span className="text-[11px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                {state.alumnos.length} Matriculados
              </span>
            </div>

            <div className="relative mb-3">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <i className="fa-solid fa-search text-xs"></i>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por nombre, apellido, DNI o curso..."
                className="w-full pl-8 pr-8 py-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Accesos rápidos de prueba */}
            <div className="mb-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Acceso Rápido Familiar (Beneficio 20%):
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => selectStudent('alu-1')}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition ${
                    currentStudent?.id === 'alu-1'
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border-emerald-200'
                  }`}
                >
                  Gómez, Lucas (Hermano -20%)
                </button>
                <button
                  onClick={() => selectStudent('alu-3')}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition ${
                    currentStudent?.id === 'alu-3'
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200'
                  }`}
                >
                  Benítez, Martina (Regular)
                </button>
              </div>
            </div>

            {/* Lista de resultados con selector en tiempo real */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No se encontraron estudiantes coincidentes.
                </div>
              ) : (
                filteredStudents.map((alu) => {
                  const isSelected = currentStudent?.id === alu.id;
                  const hasSibs = hasSiblingDiscount(alu.id);
                  const aluCuotas = getStudentCuotas(alu.id);
                  const vencidasCount = aluCuotas.filter((c) => c.estado === 'vencida').length;
                  const impagasCount = aluCuotas.filter((c) => c.estado !== 'pagada').length;

                  return (
                    <button
                      key={alu.id}
                      onClick={() => selectStudent(alu.id)}
                      className={`w-full text-left p-3 transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-l-4 border-l-emerald-600 text-slate-900 dark:text-white'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">
                          {alu.apellido}, {alu.nombre}
                        </span>
                        {hasSibs && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            -20% Hnos
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-0.5">
                        <span>DNI {alu.dni} • {alu.curso} "{alu.division}"</span>
                        <span className={vencidasCount > 0 ? 'text-rose-600 font-bold' : ''}>
                          {impagasCount} pend.
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: ESTADO DE CUENTA Y ACCIONES DE COBRANZA */}
        <div className="lg:col-span-8 space-y-6">
          {currentStudent && (
            <>
              {/* Tarjeta de Información del Alumno y Tutor */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      Escuela Normal Superior Dalmacio Vélez Sársfield
                    </span>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      {currentStudent.apellido}, {currentStudent.nombre}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      DNI: {currentStudent.dni} • Curso: {currentStudent.curso} "{currentStudent.division}" • Turno: {currentStudent.turno}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {canOperate && (
                      <button
                        onClick={() => setIsCuotaModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition"
                      >
                        <i className="fa-solid fa-plus"></i>
                        <span>+ Cargo Extraordinario</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Datos del Socio Tutor y Bonificaciones */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Socio / Tutor</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {tutor ? `${tutor.apellido}, ${tutor.nombre}` : 'Sin tutor asignado'}
                    </p>
                    <span className="text-[11px] text-slate-500 font-mono">
                      DNI {tutor ? tutor.dni : '-'}
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border ${
                    aplicaDesc
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    <span className="text-[10px] font-bold uppercase block">Beneficio Familiar (RF-05)</span>
                    <p className="font-bold">
                      {aplicaDesc ? '20% Descuento Activo' : 'Tarifa Plena (Sin Hnos)'}
                    </p>
                    <span className="text-[11px]">
                      {siblings.length > 0 ? `${siblings.length} hermano(s) en la institución` : 'Hijo único en padrón'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Resumen Cuotas 2026</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-emerald-600 font-bold font-mono">{cuotasPagadas} Pag.</span>
                      <span>•</span>
                      <span className="text-amber-600 font-bold font-mono">{cuotasPendientes} Pend.</span>
                      <span>•</span>
                      <span className="text-rose-600 font-bold font-mono">{cuotasVencidas} Venc.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Planilla de Cuotas a Cobrar */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-list-check text-emerald-600"></i>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                      Liquidación de Cuotas del Ciclo 2026
                    </h3>
                  </div>

                  {canOperate && (
                    <button
                      onClick={() => selectAllPendingForStudent(currentStudent.id)}
                      className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                    >
                      Seleccionar todas las pendientes
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/70 dark:bg-slate-800 text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-3 w-10 text-center">Sel.</th>
                        <th className="py-2.5 px-3">Concepto / Mes</th>
                        <th className="py-2.5 px-3">Vencimiento</th>
                        <th className="py-2.5 px-3 text-right">Valor Base</th>
                        <th className="py-2.5 px-3 text-right">
                          {aplicaDesc ? 'Importe (-20%)' : 'Importe Final'}
                        </th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                        <th className="py-2.5 px-3 text-right">Recibo Oficial</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
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
                                ? 'bg-slate-50/50 dark:bg-slate-950/30 text-slate-400'
                                : isChecked
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 cursor-pointer'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer'
                            }`}
                          >
                            <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              {isPaid ? (
                                <i className="fa-solid fa-lock text-emerald-600 text-xs"></i>
                              ) : (
                                <input
                                  type="checkbox"
                                  disabled={!canOperate}
                                  checked={isChecked}
                                  onChange={() => toggleCuotaSelection(c.id)}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                              )}
                            </td>

                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-800 dark:text-slate-100 block">
                                {c.concepto}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {c.periodo}
                              </span>
                            </td>

                            <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 text-xs">
                              {c.vencimiento}
                            </td>

                            <td className="py-3 px-3 text-right font-mono text-slate-500 text-xs">
                              ${c.monto.toLocaleString('es-AR')}
                            </td>

                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              ${finalMonto.toLocaleString('es-AR')}
                            </td>

                            <td className="py-3 px-3 text-center">
                              {c.estado === 'pagada' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Pagada
                                </span>
                              )}
                              {c.estado === 'vencida' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                  Vencida
                                </span>
                              )}
                              {c.estado === 'pendiente' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Pendiente
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                              {isPaid && c.pagoId ? (
                                <button
                                  onClick={() => setActiveReciboId(c.pagoId)}
                                  className="text-xs bg-white dark:bg-slate-800 hover:bg-slate-100 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg font-mono font-bold shadow-2xs"
                                >
                                  {c.pagoId}
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Barra Inferior de Liquidación y Cobro */}
                <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase">
                      Liquidación de Cuotas Seleccionadas ({selectedCuotaIds.length})
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        ${(subtotalSeleccionado - descuentoCalculado).toLocaleString('es-AR')}
                      </span>
                      {aplicaDesc && subtotalSeleccionado > 0 && (
                        <span className="text-xs text-emerald-300">
                          (Incluye -20% desc. hermanos)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedCuotaIds.length > 0 && (
                      <button
                        onClick={() => selectStudent(currentStudent.id)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                      >
                        Limpiar
                      </button>
                    )}
                    <button
                      disabled={!canOperate || selectedCuotaIds.length === 0}
                      onClick={openCobroModal}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-md ${
                        canOperate && selectedCuotaIds.length > 0
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer font-black'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <i className="fa-solid fa-cash-register"></i>
                      <span>
                        {canOperate
                          ? `Asentar Pago (${selectedCuotaIds.length})`
                          : 'Rol Solo Consulta'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SECCIÓN NUEVA: HISTORIAL DE RECIBOS Y COMPROBANTES DEL ALUMNO */}
              {pagosEstudiante.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                      <i className="fa-solid fa-receipt text-emerald-600"></i>
                      <span>Recibos Emitidos y Comprobantes de Transferencia del Alumno</span>
                    </h3>
                    <span className="text-xs text-slate-500 font-mono font-bold">
                      {pagosEstudiante.length} registro(s)
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {pagosEstudiante.map((pago) => {
                      const tieneAdjunto = Boolean(pago.comprobanteAdjunto);

                      return (
                        <div key={pago.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                                {pago.id}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {pago.fecha}
                              </span>
                              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                {pago.medio} (Ref: {pago.comprobante})
                              </span>
                            </div>
                            <p className="text-slate-500 text-[11px] mt-0.5">
                              {pago.conceptos.join(', ')} • Operador: {pago.operador}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {tieneAdjunto && (
                              <button
                                onClick={() =>
                                  setPreviewComprobante({
                                    pagoId: pago.id,
                                    alumnoNombre: `${currentStudent.apellido}, ${currentStudent.nombre}`,
                                    comprobanteRef: pago.comprobante,
                                    medio: pago.medio,
                                    monto: pago.montoTotal,
                                    fecha: pago.fecha,
                                    adjunto: pago.comprobanteAdjunto
                                  })
                                }
                                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold flex items-center gap-1.5 transition"
                                title="Previsualizar o descargar comprobante bancario adjunto"
                              >
                                <i className="fa-solid fa-paperclip"></i>
                                <span>Ver Comprobante Digital</span>
                              </button>
                            )}

                            <button
                              onClick={() => setActiveReciboId(pago.id)}
                              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition"
                              title="Visualizar o imprimir Recibo Oficial"
                            >
                              <i className="fa-solid fa-print"></i>
                              <span>Recibo Oficial</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE COBRO Y EMISIÓN DE RECIBO CON SUBIDA DE COMPROBANTE DE TRANSFERENCIA */}
      {/* ========================================================================= */}
      {isCobroModalOpen && currentStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <i className="fa-solid fa-cash-register text-emerald-400 text-lg"></i>
                <div>
                  <h3 className="font-bold text-base">
                    Asentar Cobro y Emitir Comprobante Oficial
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    Escuela Normal Superior Dalmacio Vélez Sársfield
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCobroModalOpen(false)}
                className="text-emerald-200 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmarCobro} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Alumno:</span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {currentStudent.apellido}, {currentStudent.nombre} ({currentStudent.curso} "{currentStudent.division}")
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Socio / Tutor:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {tutor ? `${tutor.apellido}, ${tutor.nombre}` : 'S/D'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cuotas a cancelar:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {selectedCuotasObj.map((c) => c.concepto).join(', ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Medio de Cobro
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
                      if (nextMedio !== 'Transferencia') {
                        setArchivoComprobante(null);
                        setArchivoError('');
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                  >
                    <option value="Efectivo">Efectivo (Ventanilla / Caja)</option>
                    <option value="Transferencia">Transferencia Bancaria / CVU</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    N° Operación / Referencia
                  </label>
                  <input
                    type="text"
                    required
                    value={comprobanteRef}
                    onChange={(e) => setComprobanteRef(e.target.value)}
                    placeholder="Ej: TRF-GALICIA-98214"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>
              </div>

              {/* SECCIÓN OBLIGATORIA / REQUERIMIENTO 4: SUBIDA DE COMPROBANTE DE TRANSFERENCIA */}
              {medioPago === 'Transferencia' && (
                <div className="p-3.5 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <i className="fa-solid fa-cloud-arrow-up text-emerald-600"></i>
                      <span>Adjuntar Comprobante de Transferencia (JPG, PNG, PDF):</span>
                    </label>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                      Máx 8 MB
                    </span>
                  </div>

                  {archivoError && (
                    <p className="text-[11px] text-rose-600 font-semibold">{archivoError}</p>
                  )}

                  {!archivoComprobante ? (
                    <div>
                      <input
                        type="file"
                        id="inputComprobante"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="inputComprobante"
                        className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition text-center"
                      >
                        <i className="fa-solid fa-file-arrow-up text-emerald-600 text-xl mb-1"></i>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          Haga clic para seleccionar el archivo o comprobante
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          Soporta capturas de pantalla (PNG, JPG) o resumen de transferencia (PDF)
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <i className={`fa-solid ${
                          archivoComprobante.tipo.includes('pdf')
                            ? 'fa-file-pdf text-rose-600'
                            : 'fa-file-image text-emerald-600'
                        } text-lg`}></i>
                        <div className="truncate">
                          <p className="font-bold text-slate-800 dark:text-white truncate">
                            {archivoComprobante.nombre}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {archivoComprobante.tamanio} • Listo para guardar
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setArchivoComprobante(null)}
                        className="p-1 text-slate-400 hover:text-rose-600 text-xs font-bold"
                        title="Quitar archivo"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Fecha de Cobro
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaCobro}
                    onChange={(e) => setFechaCobro(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Observaciones (Opcional)
                  </label>
                  <input
                    type="text"
                    value={observacionesCobro}
                    onChange={(e) => setObservacionesCobro(e.target.value)}
                    placeholder="Nota en el recibo..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Opción del Diagrama de Clases: Cuota.calcularRecargo() */}
              {montoVencidasSeleccionadas > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aplicarRecargo}
                      onChange={(e) => setAplicarRecargo(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600"
                    />
                    <span>Recargo por Mora (+10% sobre cuotas vencidas)</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300">
                    +${Math.round(montoVencidasSeleccionadas * RECARGO_MORA_PCT).toLocaleString('es-AR')}
                  </span>
                </div>
              )}

              {/* Desglose Financiero */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal Nominal ({selectedCuotaIds.length} cuota/s):</span>
                  <span className="font-mono">${subtotalSeleccionado.toLocaleString('es-AR')}</span>
                </div>
                {aplicaDesc && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Bonificación 20% por Hermanos:</span>
                    <span className="font-mono">-${descuentoCalculado.toLocaleString('es-AR')}</span>
                  </div>
                )}
                {recargoCalculado > 0 && (
                  <div className="flex justify-between text-amber-300 font-semibold">
                    <span>Recargo por Mora (10%):</span>
                    <span className="font-mono">+${recargoCalculado.toLocaleString('es-AR')}</span>
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
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-check-double"></i>
                  <span>Confirmar Cobro y Emitir Recibo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA REGISTRAR CUOTA / CARGO EXTRAORDINARIO */}
      {isCuotaModalOpen && currentStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-emerald-800 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Registrar Nuevo Arancel Extraordinario</h3>
              <button onClick={() => setIsCuotaModalOpen(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCrearCuota} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Alcance:</label>
                <select
                  value={cuotaAlcance}
                  onChange={(e) => setCuotaAlcance(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="actual">Solo para {currentStudent.apellido}, {currentStudent.nombre}</option>
                  <option value="todos">Para todos los alumnos matriculados</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Concepto:</label>
                <input
                  type="text"
                  required
                  value={cuotaConcepto}
                  onChange={(e) => setCuotaConcepto(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Período:</label>
                  <input
                    type="text"
                    required
                    value={cuotaPeriodo}
                    onChange={(e) => setCuotaPeriodo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Importe ($):</label>
                  <input
                    type="number"
                    required
                    value={cuotaMonto}
                    onChange={(e) => setCuotaMonto(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsCuotaModalOpen(false)} className="px-4 py-2 border rounded-xl">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-emerald-700 text-white font-bold rounded-xl">Generar Cargo</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
