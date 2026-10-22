import React, { useState, useRef } from 'react';
import { useCooperadora } from '../context/CooperadoraContext';
import { DESCUENTO_HERMANO_PCT } from '../data/mockData';

export default function ReportesView() {
  const {
    state,
    getStudent,
    getTutor,
    getStudentCuotas,
    hasSiblingDiscount,
    exportBackupJSON,
    importBackupJSON,
    exportPadronCSV
  } = useCooperadora();

  const [periodoFiltro, setPeriodoFiltro] = useState('todos');
  const [medioFiltro, setMedioFiltro] = useState('todos');
  const fileInputRef = useRef(null);

  const pagosValidos = state.pagos.filter((p) => {
    if (p.estado === 'anulado') return false;
    const matchPeriodo =
      periodoFiltro === 'todos' || p.fecha.startsWith(periodoFiltro);
    const matchMedio = medioFiltro === 'todos' || p.medio === medioFiltro;
    return matchPeriodo && matchMedio;
  });

  const totalRecaudado = pagosValidos.reduce((acc, p) => acc + p.montoTotal, 0);
  const totalEfectivo = pagosValidos
    .filter((p) => p.medio === 'Efectivo')
    .reduce((acc, p) => acc + p.montoTotal, 0);
  const totalTransferencia = pagosValidos
    .filter((p) => p.medio === 'Transferencia')
    .reduce((acc, p) => acc + p.montoTotal, 0);
  const totalBonificaciones = pagosValidos.reduce(
    (acc, p) => acc + (p.descuento || 0),
    0
  );

  // Cálculo de deuda exigible (cuotas vencidas) y pendiente anual
  const cuotasVencidasList = state.cuotas.filter((c) => c.estado === 'vencida');
  const deudaVencidaTotal = cuotasVencidasList.reduce((acc, c) => {
    const desc = hasSiblingDiscount(c.alumnoId) ? DESCUENTO_HERMANO_PCT : 0;
    return acc + Math.round(c.monto * (1 - desc));
  }, 0);

  const cuotasPagadasCount = state.cuotas.filter(
    (c) => c.estado === 'pagada'
  ).length;
  const tasaCobranzaGlobal =
    state.cuotas.length > 0
      ? Math.round((cuotasPagadasCount / state.cuotas.length) * 100)
      : 0;

  // Desglose por Curso
  const cursosUnicos = ['1° Año', '2° Año', '3° Año', '4° Año'];
  const estadisticasPorCurso = cursosUnicos.map((curso) => {
    const alumnosCurso = state.alumnos.filter((a) => a.curso === curso);
    const idsAlumnos = alumnosCurso.map((a) => a.id);
    const cuotasCurso = state.cuotas.filter((c) =>
      idsAlumnos.includes(c.alumnoId)
    );
    const pagadas = cuotasCurso.filter((c) => c.estado === 'pagada').length;
    const vencidas = cuotasCurso.filter((c) => c.estado === 'vencida').length;
    const pct =
      cuotasCurso.length > 0
        ? Math.round((pagadas / cuotasCurso.length) * 100)
        : 0;
    return {
      curso,
      cantidadAlumnos: alumnosCurso.length,
      totalCuotas: cuotasCurso.length,
      pagadas,
      vencidas,
      pct
    };
  });

  // Nómina de Morosidad (Alumnos con cuotas vencidas)
  const alumnosEnMora = state.alumnos
    .map((alu) => {
      const cuotasAlu = getStudentCuotas(alu.id);
      const vencidas = cuotasAlu.filter((c) => c.estado === 'vencida');
      const aplicaDesc = hasSiblingDiscount(alu.id);
      const montoDeuda = vencidas.reduce(
        (acc, c) =>
          acc +
          (aplicaDesc
            ? Math.round(c.monto * (1 - DESCUENTO_HERMANO_PCT))
            : c.monto),
        0
      );
      return {
        alu,
        tutor: getTutor(alu.tutorId),
        cantidadVencidas: vencidas.length,
        montoDeuda,
        aplicaDesc
      };
    })
    .filter((item) => item.cantidadVencidas > 0);

  return (
    <div className="space-y-6">
      {/* Cabecera de Reportes y Filtros (RF-08, HU-07, HU-09) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
              Casos de Uso: Director (HU-09) • Tesorero (HU-07)
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-800 mt-1">
            Tablero de Reportes Financieros, Recaudación y Morosidad (RF-08)
          </h2>
          <p className="text-xs text-slate-500">
            Ejecuta <code className="font-mono">Cooperadora.emitirReporte()</code>, <code className="font-mono">Director.consultarReportes()</code> y <code className="font-mono">Reporte.generarResumen()</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={periodoFiltro}
            onChange={(e) => setPeriodoFiltro(e.target.value)}
            className="px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-slate-50"
          >
            <option value="todos">Período: Todo el Ciclo 2026</option>
            <option value="2026-03">Marzo 2026 (2026-03)</option>
            <option value="2026-04">Abril 2026 (2026-04)</option>
            <option value="2026-05">Mayo 2026 (2026-05)</option>
          </select>

          <select
            value={medioFiltro}
            onChange={(e) => setMedioFiltro(e.target.value)}
            className="px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-slate-50"
          >
            <option value="todos">Medio: Efectivo + Transferencia</option>
            <option value="Efectivo">Solo Efectivo</option>
            <option value="Transferencia">Solo Transferencia</option>
          </select>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <i className="fa-solid fa-print"></i>
            Imprimir Informe
          </button>
        </div>
      </div>

      {/* KPIs Ejecutivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">
              Ingresos Recaudados
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <i className="fa-solid fa-sack-dollar"></i>
            </span>
          </div>
          <p className="text-2xl font-black text-slate-800 font-mono mt-2">
            ${totalRecaudado.toLocaleString('es-AR')}
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            {pagosValidos.length} comprobantes válidos en el período
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">
              Desglose por Medio (RF-04)
            </span>
            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <i className="fa-solid fa-building-columns"></i>
            </span>
          </div>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Efectivo en Caja:</span>
              <span className="font-mono font-bold text-slate-800">
                ${totalEfectivo.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transferencias:</span>
              <span className="font-mono font-bold text-blue-700">
                ${totalTransferencia.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">
              Ahorro Familiar Otorgado (RF-05)
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <i className="fa-solid fa-people-roof"></i>
            </span>
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono mt-2">
            ${totalBonificaciones.toLocaleString('es-AR')}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Bonificación automática 20% por hermanos
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">
              Mora Exigible (Cuotas Vencidas)
            </span>
            <span className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </span>
          </div>
          <p className="text-2xl font-black text-red-600 font-mono mt-2">
            ${deudaVencidaTotal.toLocaleString('es-AR')}
          </p>
          <p className="text-xs text-red-600 font-semibold mt-1">
            {cuotasVencidasList.length} cuotas vencidas sin abonar
          </p>
        </div>
      </div>

      {/* Gráficos de Adhesión por Curso y Nómina de Deudas Vencidas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Avance de Cobranza por Curso */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Índice de Cobranza por Año / Curso
            </h3>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
              Global Anual: {tasaCobranzaGlobal}%
            </span>
          </div>

          <div className="space-y-4">
            {estadisticasPorCurso.map((item) => (
              <div key={item.curso} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    {item.curso} ({item.cantidadAlumnos} alumnos)
                  </span>
                  <span className="font-mono font-bold text-slate-600">
                    {item.pagadas}/{item.totalCuotas} cuotas ({item.pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${Math.max(item.pct, 6)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla de Deudas Vencidas Exigibles */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-bell text-red-600"></i>
                Listado de Alumnos con Cuotas Vencidas (RF-08)
              </h3>
              <p className="text-xs text-slate-500">
                Detalle para seguimiento de Secretaría y Tesorería.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200">
                  <th className="py-3 px-4">Alumno / Curso</th>
                  <th className="py-3 px-4">Socio / Tutor Responsable</th>
                  <th className="py-3 px-4 text-center">Cuotas Vencidas</th>
                  <th className="py-3 px-4 text-right">Deuda Exigible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {alumnosEnMora.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="py-8 text-center text-xs text-emerald-700 font-bold"
                    >
                      ¡Excelente! No se registran alumnos con cuotas vencidas.
                    </td>
                  </tr>
                ) : (
                  alumnosEnMora.map((item) => (
                    <tr key={item.alu.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">
                          {item.alu.apellido}, {item.alu.nombre}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.alu.curso} "{item.alu.division}"
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-semibold text-slate-700">
                          {item.tutor
                            ? `${item.tutor.apellido}, ${item.tutor.nombre}`
                            : 'S/D'}
                        </div>
                        <div className="text-slate-500">
                          Tel: {item.tutor?.telefono || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          {item.cantidadVencidas} cuota(s)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-red-600">
                        ${item.montoDeuda.toLocaleString('es-AR')}
                        {item.aplicaDesc && (
                          <span className="block text-[10px] text-emerald-700">
                            Tarifa c/ -20% Hnos
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PANEL DE SEGURIDAD Y COPIAS DE RESPALDO (Mitigación FODA Módulo 4) */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
            Mitigación de Amenazas FODA (Módulo 4)
          </span>
          <h3 className="text-base font-bold mt-1.5">
            Resguardo de Información y Copias de Seguridad Local / Cloud
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Prevención contra pérdida de datos en equipos escolares y exportación directa a planillas de cálculo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportPadronCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-file-excel text-emerald-400"></i>
            Exportar Planilla CSV
          </button>

          <button
            onClick={exportBackupJSON}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <i className="fa-solid fa-download"></i>
            Descargar Backup JSON
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                importBackupJSON(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-upload"></i>
            Restaurar Backup JSON
          </button>
        </div>
      </div>
    </div>
  );
}
