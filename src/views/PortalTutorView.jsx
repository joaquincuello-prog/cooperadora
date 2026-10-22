import React, { useState } from 'react';
import { useCooperadora } from '../context/CooperadoraContext';
import { DESCUENTO_HERMANO_PCT } from '../data/mockData';

export default function PortalTutorView() {
  const {
    state,
    setState,
    getStudent,
    getStudentCuotas,
    hasSiblingDiscount,
    setActiveReciboId
  } = useCooperadora();

  const [dniFilter, setDniFilter] = useState('');

  const selectedTutorId =
    state.selectedTutorPortalId || state.tutores[0]?.id || 'tut-1';

  const currentTutor =
    state.tutores.find((t) => t.id === selectedTutorId) || state.tutores[0];

  const handleSelectTutor = (tutId) => {
    setState((prev) => ({
      ...prev,
      selectedTutorPortalId: tutId
    }));
  };

  const handleSearchByDni = (e) => {
    e.preventDefault();
    const q = dniFilter.trim().toLowerCase();
    if (!q) return;
    const found = state.tutores.find(
      (t) =>
        t.dni.includes(q) ||
        t.apellido.toLowerCase().includes(q) ||
        t.nombre.toLowerCase().includes(q)
    );
    if (found) {
      handleSelectTutor(found.id);
    }
  };

  const hijosAsociados = currentTutor
    ? state.alumnos.filter((a) => a.tutorId === currentTutor.id)
    : [];

  const recibosFamiliares = currentTutor
    ? state.pagos.filter(
        (p) => p.tutorId === currentTutor.id && p.estado !== 'anulado'
      )
    : [];

  const totalAportadoFamilia = recibosFamiliares.reduce(
    (acc, p) => acc + p.montoTotal,
    0
  );
  const totalAhorradoHermanos = recibosFamiliares.reduce(
    (acc, p) => acc + (p.descuento || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Encabezado Portal de Autogestión Padre / Tutor (HU-08 y Diagrama Caso de Uso PADRE / TUTOR) */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                Actor UML: Padre / Tutor (Socio) • HU-08
              </span>
              <span className="text-[11px] font-mono text-teal-200">
                Socio.consultarEstadoCuenta() • Obtener Comprobante de Pago
              </span>
            </div>
            <h2 className="text-xl font-black">
              Portal de Autogestión Familiar y Descarga de Comprobantes
            </h2>
            <p className="text-xs text-teal-100 mt-1 max-w-2xl">
              Consulte el estado de cuenta de todos sus hijos matriculados en la E.E.S. N° 14, verifique la aplicación automática del descuento del 20% por hermanos y descargue sus recibos oficiales.
            </p>
          </div>

          {/* Selector de Grupo Familiar / Tutor */}
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15 min-w-[290px]">
            <label className="block text-[11px] font-bold uppercase text-emerald-300 mb-1">
              Seleccionar Socio / Grupo Familiar:
            </label>
            <select
              value={currentTutor?.id || ''}
              onChange={(e) => handleSelectTutor(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold border border-emerald-500/40 outline-none"
            >
              {state.tutores.map((t) => {
                const cantHijos = state.alumnos.filter(
                  (a) => a.tutorId === t.id
                ).length;
                return (
                  <option key={t.id} value={t.id}>
                    {t.apellido}, {t.nombre} (DNI {t.dni}) — {cantHijos} hijo(s)
                  </option>
                );
              })}
            </select>
            <form onSubmit={handleSearchByDni} className="flex gap-1.5 mt-2">
              <input
                type="text"
                value={dniFilter}
                onChange={(e) => setDniFilter(e.target.value)}
                placeholder="Buscar por DNI o Apellido del Tutor..."
                className="flex-1 px-2.5 py-1 rounded bg-slate-900/80 text-white text-xs border border-white/20 outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      </div>

      {currentTutor && (
        <>
          {/* Resumen del Socio / Tutor y Aportes Familiares */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase text-slate-400">
                Titular Socio Cooperadora
              </span>
              <p className="text-lg font-black text-slate-800 mt-1">
                {currentTutor.apellido}, {currentTutor.nombre}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                DNI: <span className="font-mono">{currentTutor.dni}</span> • Estado:{' '}
                <span className="text-emerald-700 font-bold">
                  {currentTutor.estado || 'Activo'}
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentTutor.email} • {currentTutor.telefono}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase text-slate-400">
                Hijos Matriculados y Beneficio (RF-05)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-blue-700">
                  {hijosAsociados.length} Alumno(s)
                </span>
                {hijosAsociados.length >= 2 ? (
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    Bonificación -20% Activa
                  </span>
                ) : (
                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                    Tarifa Regular
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {hijosAsociados.map((h) => `${h.nombre} (${h.curso})`).join(' • ')}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase text-slate-400">
                Total Aportado Ciclo 2026
              </span>
              <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
                ${totalAportadoFamilia.toLocaleString('es-AR')}
              </p>
              {totalAhorradoHermanos > 0 ? (
                <p className="text-xs text-emerald-600 font-semibold mt-1">
                  Ahorro familiar por hermanos: $
                  {totalAhorradoHermanos.toLocaleString('es-AR')}
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">
                  {recibosFamiliares.length} comprobante(s) emitido(s)
                </p>
              )}
            </div>
          </div>

          {/* CASO DE USO PRINCIPAL PADRE/TUTOR: OBTENER COMPROBANTE DE PAGO */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-emerald-50/50 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <i className="fa-solid fa-file-invoice text-emerald-600"></i>
                  Mis Comprobantes de Pago Disponibles (Caso de Uso: Obtener Comprobante de Pago)
                </h3>
                <p className="text-xs text-slate-500">
                  Haga clic en <strong>"Obtener Comprobante / PDF"</strong> para visualizar e imprimir el recibo oficial con membrete y escudo del colegio.
                </p>
              </div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                {recibosFamiliares.length} Recibo(s) Oficial(es)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200">
                    <th className="py-3 px-4">N° Comprobante</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Hijo/a Alumno/a</th>
                    <th className="py-3 px-4">Conceptos Abonados</th>
                    <th className="py-3 px-4">Medio de Pago</th>
                    <th className="py-3 px-4 text-right">Importe Abonado</th>
                    <th className="py-3 px-4 text-right">Descarga / Impresión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {recibosFamiliares.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="py-8 text-center text-xs text-slate-400"
                      >
                        No se registran pagos emitidos para este grupo familiar aún.
                      </td>
                    </tr>
                  ) : (
                    recibosFamiliares.map((rec) => {
                      const alu = getStudent(rec.alumnoId);
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                            {rec.id}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            {rec.fecha}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {alu ? `${alu.apellido}, ${alu.nombre}` : 'Alumno'}
                            <span className="block text-xs font-normal text-slate-500">
                              {alu?.curso} "{alu?.division}"
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-700">
                            {rec.conceptos.join(', ')}
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            <span className="font-semibold">{rec.medio}</span>
                            <span className="block font-mono text-[10px] text-slate-400">
                              Ref: {rec.comprobante}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                            ${rec.montoTotal.toLocaleString('es-AR')}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setActiveReciboId(rec.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
                            >
                              <i className="fa-solid fa-file-pdf"></i>
                              Obtener Comprobante
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Estado de Cuenta Detallado por cada Hijo (Socio.consultarEstadoCuenta()) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hijosAsociados.map((hijo) => {
              const cuotasHijo = getStudentCuotas(hijo.id);
              const tieneDesc = hasSiblingDiscount(hijo.id);

              return (
                <div
                  key={hijo.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden"
                >
                  <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm">
                        {hijo.apellido}, {hijo.nombre}
                      </h4>
                      <p className="text-xs text-slate-300">
                        DNI {hijo.dni} • {hijo.curso} "{hijo.division}" (Turno{' '}
                        {hijo.turno})
                      </p>
                    </div>
                    {tieneDesc && (
                      <span className="text-[11px] bg-emerald-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full">
                        Bonificación -20%
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto text-xs">
                    {cuotasHijo.map((c) => {
                      const importeConDesc = tieneDesc
                        ? Math.round(c.monto * (1 - DESCUENTO_HERMANO_PCT))
                        : c.monto;
                      return (
                        <div
                          key={c.id}
                          className="p-3 flex items-center justify-between hover:bg-slate-50"
                        >
                          <div>
                            <span className="font-bold text-slate-800">
                              {c.concepto}
                            </span>
                            <span className="block text-[11px] text-slate-400">
                              Vencimiento: {c.vencimiento}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-slate-700">
                              ${importeConDesc.toLocaleString('es-AR')}
                            </span>
                            {c.estado === 'pagada' ? (
                              <button
                                onClick={() => setActiveReciboId(c.pagoId)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold flex items-center gap-1"
                              >
                                <i className="fa-solid fa-receipt"></i> Pagada
                              </button>
                            ) : c.estado === 'vencida' ? (
                              <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-800 font-bold">
                                Vencida
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold">
                                Pendiente
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
