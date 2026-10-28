import React from 'react';
import { useCooperadora } from '../context/CooperadoraContext';

export default function ReciboModal() {
  const { state, activeReciboId, setActiveReciboId, getStudent, getTutor, setPreviewComprobante } =
    useCooperadora();

  if (!activeReciboId) return null;

  const pago = state.pagos.find((p) => p.id === activeReciboId);
  if (!pago) return null;

  const student = getStudent(pago.alumnoId);
  const tutor = getTutor(pago.tutorId);
  const countConceptos = pago.conceptos.length || 1;
  const unitBase = Math.round(pago.montoSubtotal / countConceptos);
  const unitDesc = Math.round((pago.descuento || 0) / countConceptos);
  const tieneAdjunto = Boolean(pago.comprobanteAdjunto);

  return (
    <div
      id="modalRecibo"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden text-slate-900">
        
        {/* Barra superior de controles (no-print) */}
        <div className="no-print px-5 py-3 border-b border-emerald-100 bg-emerald-50/90 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold text-emerald-950">
              Recibo Oficial Institucional — {pago.id}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {tieneAdjunto && (
              <button
                onClick={() =>
                  setPreviewComprobante({
                    pagoId: pago.id,
                    alumnoNombre: student ? `${student.apellido}, ${student.nombre}` : 'Estudiante',
                    comprobanteRef: pago.comprobante,
                    medio: pago.medio,
                    monto: pago.montoTotal,
                    fecha: pago.fecha,
                    adjunto: pago.comprobanteAdjunto
                  })
                }
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
                title="Ver comprobante de transferencia bancaria adjunto"
              >
                <i className="fa-solid fa-paperclip"></i>
                <span>Comprobante Bancario</span>
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <i className="fa-solid fa-print"></i>
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={() => setActiveReciboId(null)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              ✕ Cerrar
            </button>
          </div>
        </div>

        {/* Contenido Imprimible del Comprobante */}
        <div id="printReceiptContainer" className="p-8 text-slate-900 font-sans space-y-6 bg-white">
          <div className="border-b-2 border-emerald-800 pb-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center space-x-3.5">
                <img
                  src="/escudo-colegio.png"
                  alt="Escudo Escuela Normal Superior Dalmacio Vélez Sársfield"
                  className="w-14 h-14 object-contain"
                />
                <div>
                  <h2 className="text-base font-black uppercase tracking-tight text-emerald-950">
                    Escuela Normal Superior Dalmacio Vélez Sársfield
                  </h2>
                  <p className="text-xs font-bold text-slate-700">
                    Asociación Cooperadora Escolar
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {state.cooperadora.direccion}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    CUIT: {state.cooperadora.cuit} • Personería Jurídica Escolar
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="inline-block px-3 py-1.5 rounded-xl border-2 border-emerald-800 bg-emerald-50">
                  <span className="block text-[10px] text-emerald-800 font-mono uppercase font-bold">
                    Recibo Oficial N°
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-950">
                    {pago.id}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1 font-mono">
                  Fecha: {pago.fecha}
                </div>
              </div>
            </div>
          </div>

          {/* Datos del Socio/Tutor y Alumno */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-mono font-semibold">
                Estudiante Matriculado:
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {student ? `${student.apellido}, ${student.nombre}` : 'Estudiante'}
              </span>
              <span className="block text-slate-600 font-mono">
                DNI: {student ? student.dni : '-'}
              </span>
              <span className="block text-slate-600 font-medium">
                {student ? `${student.curso} "${student.division}" — Turno ${student.turno}` : '-'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-mono font-semibold">
                Socio / Tutor Responsable:
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {tutor ? `${tutor.apellido}, ${tutor.nombre}` : 'Tutor Responsable'}
              </span>
              <span className="block text-slate-600 font-mono">
                DNI: {tutor ? tutor.dni : '-'}
              </span>
              <span className="block text-slate-600 font-mono text-[11px]">
                Operador: {pago.operador}
              </span>
            </div>
          </div>

          {/* Tabla de Conceptos Abonados */}
          <div>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b-2 border-emerald-200 font-semibold text-slate-700 bg-emerald-50/40">
                  <th className="py-2 px-2">Concepto Liquidado</th>
                  <th className="py-2 px-2 text-center">Importe Base</th>
                  <th className="py-2 px-2 text-right">Bonif. Hermanos</th>
                  <th className="py-2 px-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pago.conceptos.map((concepto, idx) => {
                  const unitFinal = unitBase - unitDesc;
                  return (
                    <tr key={idx} className="text-slate-800">
                      <td className="py-2 px-2 font-bold">{concepto}</td>
                      <td className="py-2 px-2 text-center font-mono tabular-nums text-slate-700">
                        ${unitBase.toLocaleString('es-AR')}
                      </td>
                      <td className="py-2 px-2 text-right text-emerald-700 font-mono tabular-nums font-bold">
                        {unitDesc > 0 ? `-$${unitDesc.toLocaleString('es-AR')}` : '-'}
                      </td>
                      <td className="py-2 px-2 text-right font-black font-mono tabular-nums text-emerald-950">
                        ${unitFinal.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  );
                })}
                {pago.recargo > 0 && (
                  <tr className="text-amber-900 bg-amber-50/40">
                    <td className="py-2 px-2 font-bold">Recargo por Mora Liquidado (+10%)</td>
                    <td className="py-2 px-2 text-center font-mono">-</td>
                    <td className="py-2 px-2 text-right font-mono">-</td>
                    <td className="py-2 px-2 text-right font-bold font-mono">
                      +${pago.recargo.toLocaleString('es-AR')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totales y Medio de Pago */}
          <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-end">
            <div className="text-xs text-slate-600 space-y-1">
              <div>
                <strong>Medio de Pago:</strong>{' '}
                <span className="font-semibold text-slate-800">{pago.medio}</span>
              </div>
              <div>
                <strong>Comprobante / Referencia:</strong>{' '}
                <span className="font-mono text-emerald-800 font-bold">{pago.comprobante}</span>
                {tieneAdjunto && (
                  <span className="ml-2 text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                    ✓ Comprobante Digital Respaldado ({pago.comprobanteAdjunto.nombre})
                  </span>
                )}
              </div>
              <div>
                <strong>Estado Fiscal:</strong>{' '}
                <span className="font-bold uppercase text-[11px]">
                  {pago.estado === 'anulado'
                    ? 'ANULADO POR TESORERÍA'
                    : pago.validadoTesoreria
                    ? 'VÁLIDO — VISADO Y AUDITADO POR TESORERÍA'
                    : 'VÁLIDO — EMISIÓN DE SECRETARÍA'}
                </span>
              </div>
              {pago.observaciones && (
                <div className="text-[11px] text-slate-500">
                  <strong>Obs:</strong> {pago.observaciones}
                </div>
              )}
            </div>
            <div className="text-right p-3 rounded-xl border-2 border-emerald-700 bg-emerald-50">
              <span className="text-[10px] text-emerald-800 block uppercase font-mono font-bold">
                Total Percibido:
              </span>
              <span className="text-2xl font-black font-mono text-emerald-950">
                ${pago.montoTotal.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          {/* Firma y Sello Oficial */}
          <div className="pt-8 flex justify-between items-end text-center">
            <div className="w-48 border-t border-dashed border-slate-400 pt-2 text-[10px] text-slate-500 font-mono uppercase">
              Sello Cooperadora Escolar
              <br />ENS Dalmacio Vélez Sársfield
            </div>
            <div className="w-48 border-t border-dashed border-slate-400 pt-2 text-[10px] text-slate-500 font-mono uppercase">
              Firma Tesorería / Secretaría
              <br />Control y Fiscalización
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
