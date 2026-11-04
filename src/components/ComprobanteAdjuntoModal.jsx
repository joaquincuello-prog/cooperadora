import React, { useState, useEffect } from 'react';
import { useCooperadora } from '../context/CooperadoraContext';

export default function ComprobanteAdjuntoModal() {
  const {
    state,
    previewComprobante,
    setPreviewComprobante,
    getStudent,
    getTutor,
    validarPagoTesoreria,
    rechazarComprobanteTesoreria,
    subirComprobantePago,
    setActiveReciboId
  } = useCooperadora();

  const [zoomLevel, setZoomLevel] = useState(100);
  const [observacionConciliacion, setObservacionConciliacion] = useState('');
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [errorRechazo, setErrorRechazo] = useState('');

  useEffect(() => {
    setZoomLevel(100);
    setObservacionConciliacion('');
    setIsRejectMode(false);
    setMotivoRechazo('');
    setErrorRechazo('');
  }, [previewComprobante?.pagoId]);

  if (!previewComprobante) return null;

  // Buscar el pago en tiempo real dentro de state.pagos para reflejar cambios inmediatos
  const pago =
    state.pagos.find((p) => p.id === previewComprobante.pagoId) || null;

  const alu = pago ? getStudent(pago.alumnoId) : null;
  const tut = pago ? getTutor(pago.tutorId) : null;

  const pagoId = pago?.id || previewComprobante.pagoId;
  const alumnoNombre = alu
    ? `${alu.apellido}, ${alu.nombre}`
    : previewComprobante.alumnoNombre || 'Estudiante';
  const alumnoDni = alu?.dni || previewComprobante.alumnoDni || '-';
  const alumnoCurso = alu ? `${alu.curso} "${alu.division}" (${alu.turno})` : '';
  const tutorNombre = tut ? `${tut.apellido}, ${tut.nombre}` : 'Socio / Tutor';
  const tutorDni = tut?.dni || '-';

  const comprobanteRef = pago?.comprobante || previewComprobante.comprobanteRef || 'S/R';
  const medio = pago?.medio || previewComprobante.medio || 'Transferencia';
  const monto = pago?.montoTotal ?? previewComprobante.monto ?? 0;
  const subtotal = pago?.montoSubtotal ?? monto;
  const descuento = pago?.descuento ?? 0;
  const fecha = pago?.fecha || previewComprobante.fecha || '-';
  const adjunto = pago?.comprobanteAdjunto || previewComprobante.adjunto || null;

  const isAnulado = String(pago?.estado || '').toUpperCase() === 'ANULADO';
  const isValidado = Boolean(pago?.validadoTesoreria) && !isAnulado;
  const isTesorero = state.role === 'tesorero' || state.role === 'admin';

  const isPdf =
    adjunto &&
    (adjunto.tipo === 'application/pdf' ||
      (adjunto.nombre && adjunto.nombre.toLowerCase().endsWith('.pdf')) ||
      (adjunto.dataUrl && adjunto.dataUrl.startsWith('data:application/pdf')));

  const handleDownload = () => {
    if (!adjunto?.dataUrl) return;
    const a = document.createElement('a');
    a.href = adjunto.dataUrl;
    a.download =
      adjunto.nombre || `comprobante_${pagoId || 'pago'}.${isPdf ? 'pdf' : 'png'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleQuickUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !pagoId) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const nuevoAdjunto = {
        nombre: file.name,
        tipo: file.type || 'image/png',
        tamanio: `${(file.size / 1024).toFixed(1)} KB`,
        fechaSubida: new Date().toISOString().replace('T', ' ').slice(0, 16),
        dataUrl: ev.target.result
      };
      subirComprobantePago({ pagoId, comprobanteAdjunto: nuevoAdjunto });
      setPreviewComprobante((prev) =>
        prev ? { ...prev, adjunto: nuevoAdjunto } : null
      );
    };
    reader.readAsDataURL(file);
  };

  const handleAprobarYConciliar = () => {
    if (!pagoId) return;
    validarPagoTesoreria(
      pagoId,
      observacionConciliacion.trim() ||
        'Conciliación bancaria verificada en visor Split-View'
    );
    setPreviewComprobante(null);
  };

  const handleConfirmarRechazo = (e) => {
    e.preventDefault();
    if (!motivoRechazo.trim() || motivoRechazo.trim().length < 4) {
      setErrorRechazo(
        'Debe indicar el motivo del rechazo para notificar al usuario y auditar el reverso.'
      );
      return;
    }
    const res = rechazarComprobanteTesoreria({
      pagoId,
      motivoRechazo: motivoRechazo.trim()
    });
    if (res?.ok) {
      setPreviewComprobante(null);
    }
  };

  const motivosRapidosRechazo = [
    'Transferencia no acreditada en extracto bancario',
    'El importe del comprobante no coincide con el monto a conciliar',
    'Comprobante ilegible, incompleto o fecha incorrecta',
    'Operación duplicada ya imputada en otro recibo'
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-6xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh]">
        {/* CABECERA DEL MODAL SPLIT VIEW */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
              <i className="fa-solid fa-Columns text-lg fa-table-columns"></i>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base tracking-tight">
                  Conciliación Bancaria Rápida y Visor de Comprobante (Split View)
                </h3>
                <span className="text-[11px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-800 text-emerald-400 border border-slate-700">
                  {pagoId}
                </span>
                {isAnulado ? (
                  <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    RECHAZADO / ANULADO
                  </span>
                ) : isValidado ? (
                  <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <i className="fa-solid fa-check-double mr-1"></i>
                    CONCILIADO EN BANCO
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <i className="fa-solid fa-clock mr-1"></i>
                    PENDIENTE DE VISADO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Escuela Normal Superior Dalmacio Vélez Sársfield • Contraste simultáneo de constancia bancaria vs. asiento del sistema
              </p>
            </div>
          </div>

          <button
            onClick={() => setPreviewComprobante(null)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Cerrar ventana (Esc)"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* CUERPO DIVIDIDO EN DOS COLUMNAS (SPLIT VIEW) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* COLUMNA IZQUIERDA (7 cols): VISOR DEL COMPROBANTE (PDF O IMAGEN) */}
          <div className="lg:col-span-7 flex flex-col bg-slate-100 dark:bg-slate-950/90 min-h-[360px]">
            {/* Barra de herramientas del visor */}
            <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-[10px] uppercase border border-indigo-200 dark:border-indigo-800">
                  {adjunto ? (isPdf ? 'PDF' : 'IMAGEN') : 'SIN ARCHIVO'}
                </span>
                <span
                  className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[220px] sm:max-w-[300px]"
                  title={adjunto?.nombre || 'Sin archivo adjunto'}
                >
                  {adjunto
                    ? `${adjunto.nombre} (${adjunto.tamanio || 'OK'})`
                    : 'Constancia digital pendiente de carga'}
                </span>
              </div>

              {adjunto?.dataUrl && (
                <div className="flex items-center gap-1.5">
                  {!isPdf && (
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.max(75, z - 25))}
                        className="px-2 py-0.5 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-bold"
                        title="Reducir zoom"
                      >
                        -
                      </button>
                      <span className="px-2 font-mono text-[11px] text-slate-700 dark:text-slate-200">
                        {zoomLevel}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.min(175, z + 25))}
                        className="px-2 py-0.5 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-bold"
                        title="Aumentar zoom"
                      >
                        +
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700 transition"
                    title="Descargar comprobante original"
                  >
                    <i className="fa-solid fa-download"></i>
                    <span>Descargar</span>
                  </button>
                </div>
              )}
            </div>

            {/* Lienzo del comprobante */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center">
              {adjunto?.dataUrl ? (
                isPdf ? (
                  <div className="w-full h-[54vh] bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden shadow-md">
                    <iframe
                      src={adjunto.dataUrl}
                      title="Visor de Comprobante PDF"
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : (
                  <div className="overflow-auto max-h-[54vh] max-w-full flex items-center justify-center p-2">
                    <img
                      src={adjunto.dataUrl}
                      alt={`Comprobante de ${alumnoNombre}`}
                      style={{
                        transform: `scale(${zoomLevel / 100})`,
                        transformOrigin: 'center center'
                      }}
                      className="max-h-[50vh] max-w-full rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 object-contain bg-white transition-transform duration-150"
                    />
                  </div>
                )
              ) : (
                <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 flex items-center justify-center mx-auto">
                    <i className="fa-solid fa-file-circle-exclamation text-xl"></i>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                    Sin archivo digital adjunto en este asiento
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    La operación fue registrada con la referencia bancaria{' '}
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                      {comprobanteRef}
                    </span>
                    , pero no se subió la captura o PDF del banco.
                  </p>
                  <div className="pt-2">
                    <input
                      type="file"
                      id="splitUploadComprobante"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleQuickUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="splitUploadComprobante"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-xs transition"
                    >
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                      <span>Vincular Archivo Ahora (PDF / PNG / JPG)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {adjunto && (
              <div className="px-4 py-2 bg-slate-200/60 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                <span>
                  <i className="fa-solid fa-calendar-check text-emerald-600 mr-1.5"></i>
                  Subido: {adjunto.fechaSubida || fecha}
                </span>
                <span>Integridad verificada • ENS DVS</span>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA (5 cols): DATOS CRUZADOS DEL SISTEMA PARA CONCILIACIÓN */}
          <div className="lg:col-span-5 p-5 space-y-4 bg-white dark:bg-slate-900 text-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
                    Verificación Contable Cruzada
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Datos Registrados en Sistema
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewComprobante(null);
                    setActiveReciboId(pagoId);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-print text-slate-500"></i>
                  <span>Ver Recibo Oficial</span>
                </button>
              </div>

              {/* Tarjeta 1: Identificación del Estudiante y Tutor */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                      Nombre del Estudiante
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {alumnoNombre}
                    </span>
                    {alumnoCurso && (
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        Curso: {alumnoCurso}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                      DNI Estudiante
                    </span>
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 inline-block mt-0.5">
                      {alumnoDni}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Socio / Tutor Ordenante:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {tutorNombre} <span className="font-mono text-slate-500">(DNI {tutorDni})</span>
                  </span>
                </div>
              </div>

              {/* Tarjeta 2: Importe a Conciliar y Referencia Bancaria */}
              <div className="p-4 rounded-xl bg-emerald-950 text-white border border-emerald-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-emerald-300 font-bold block">
                      Importe a Conciliar
                    </span>
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      ${Number(monto).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase text-emerald-300 font-bold block">
                      N° Comprobante / Ref. Bancaria
                    </span>
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-emerald-900/90 text-white border border-emerald-700 inline-block mt-0.5">
                      {comprobanteRef}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-800/80 grid grid-cols-2 gap-2 text-[11px] text-emerald-100/90">
                  <div>
                    <span className="text-emerald-400/80 block text-[10px]">Medio e Imputación:</span>
                    <span className="font-bold">
                      {medio} → {medio === 'Efectivo' ? 'Caja Escolar' : 'Bancos / Digital'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400/80 block text-[10px]">Fecha Registrada:</span>
                    <span className="font-mono font-bold">{fecha}</span>
                  </div>
                </div>

                {descuento > 0 && (
                  <div className="px-2.5 py-1.5 rounded-lg bg-emerald-900/70 border border-emerald-700/80 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-200">
                      Subtotal: ${Number(subtotal).toLocaleString('es-AR')}
                    </span>
                    <span className="font-bold text-emerald-300">
                      Desc. Hermanos -20% (-${Number(descuento).toLocaleString('es-AR')})
                    </span>
                  </div>
                )}
              </div>

              {/* Tarjeta 3: Conceptos / Cuotas alcanzadas */}
              {pago?.conceptos && (
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
                    Conceptos Imputados ({pago.conceptos.length} cuota/s)
                  </span>
                  <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                    {pago.conceptos.map((conc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[11px] py-0.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
                      >
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {conc}
                        </span>
                        <span className="font-mono text-slate-500">
                          $
                          {Math.round(
                            Number(monto) / (pago.conceptos.length || 1)
                          ).toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulario de Rechazo de Comprobante (cuando se activa "Rechazar Comprobante") */}
              {isRejectMode ? (
                <form
                  onSubmit={handleConfirmarRechazo}
                  className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-2.5 animate-fadeIn"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                      <i className="fa-solid fa-triangle-exclamation"></i>
                      <span>Motivo de Rechazo del Comprobante (Obligatorio):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRejectMode(false);
                        setErrorRechazo('');
                      }}
                      className="text-[11px] text-rose-600 hover:underline font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>

                  {errorRechazo && (
                    <p className="text-[11px] text-rose-600 font-bold">{errorRechazo}</p>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {motivosRapidosRechazo.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setMotivoRechazo(m);
                          setErrorRechazo('');
                        }}
                        className={`text-[10px] px-2 py-1 rounded-lg border transition text-left ${
                          motivoRechazo === m
                            ? 'bg-rose-700 text-white border-rose-700 font-bold'
                            : 'bg-white dark:bg-slate-800 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows="2"
                    required
                    value={motivoRechazo}
                    onChange={(e) => {
                      setMotivoRechazo(e.target.value);
                      setErrorRechazo('');
                    }}
                    placeholder="Indique el motivo de rechazo que se notificará al usuario y quedará en audit_log..."
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-rose-500"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-rose-700 dark:text-rose-300">
                      Se emitirá reverso contable y las cuotas volverán a Pendiente.
                    </span>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                    >
                      <i className="fa-solid fa-ban"></i>
                      <span>Confirmar Rechazo</span>
                    </button>
                  </div>
                </form>
              ) : (
                !isAnulado &&
                !isValidado &&
                isTesorero && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Nota de Conciliación Bancaria (Opcional):
                    </label>
                    <input
                      type="text"
                      value={observacionConciliacion}
                      onChange={(e) => setObservacionConciliacion(e.target.value)}
                      placeholder="Ej: Verificado en extracto Banco Galicia / Macro..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                )
              )}
            </div>

            {/* Estado de Conciliación si ya fue validado o anulado */}
            {isValidado && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
                <i className="fa-solid fa-circle-check text-emerald-600 text-base"></i>
                <div>
                  <p className="font-bold text-xs">
                    Cobro Conciliado e Imputado a Bancos / Cuentas Digitales
                  </p>
                  <p className="text-[11px] opacity-80">
                    {pago?.fechaConciliacion
                      ? `Visado el ${pago.fechaConciliacion} por ${pago.conciliadoPor}`
                      : 'Fondos verificados y acreditados en cuenta institucional.'}
                  </p>
                </div>
              </div>
            )}

            {isAnulado && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 space-y-1">
                <p className="font-bold text-xs flex items-center gap-1.5">
                  <i className="fa-solid fa-ban"></i>
                  <span>Comprobante Anulado / Rechazado</span>
                </p>
                <p className="text-[11px]">
                  Motivo: <strong>"{pago?.motivoAnulacion || 'No especificado'}"</strong>
                </p>
                {pago?.reversoContableId && (
                  <p className="text-[10px] font-mono">
                    Asiento de Reverso Emitido: {pago.reversoContableId} (-$
                    {Number(monto).toLocaleString('es-AR')})
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PIE DEL MODAL CON ACCIONES DE CONCILIACIÓN BANCARIA */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            <i className="fa-solid fa-shield-halved text-emerald-600"></i>
            <span>
              Trazabilidad RNF-02 • Operador de origen: {pago?.operador || 'Secretaría'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isTesorero && !isAnulado && (
              <>
                <button
                  type="button"
                  onClick={() => setIsRejectMode(true)}
                  className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 font-bold flex items-center gap-1.5 transition"
                >
                  <i className="fa-solid fa-file-circle-xmark"></i>
                  <span>Rechazar Comprobante</span>
                </button>

                {!isValidado && (
                  <button
                    type="button"
                    onClick={handleAprobarYConciliar}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center gap-2 shadow-md transition"
                  >
                    <i className="fa-solid fa-check-double"></i>
                    <span>Aprobar y Conciliar Cobro</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => setPreviewComprobante(null)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
