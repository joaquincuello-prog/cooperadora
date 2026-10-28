import React from 'react';
import { useCooperadora } from '../context/CooperadoraContext';

export default function ComprobanteAdjuntoModal() {
  const { previewComprobante, setPreviewComprobante } = useCooperadora();

  if (!previewComprobante) return null;

  const {
    pagoId,
    alumnoNombre,
    comprobanteRef,
    medio,
    monto,
    fecha,
    adjunto
  } = previewComprobante;

  if (!adjunto || !adjunto.dataUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200 dark:border-slate-800">
          <i className="fa-solid fa-triangle-exclamation text-amber-500 text-3xl mb-3"></i>
          <h3 className="font-bold text-slate-800 dark:text-white text-base">
            Comprobante no disponible
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Este pago no posee un archivo digital de comprobante adjunto.
          </p>
          <button
            onClick={() => setPreviewComprobante(null)}
            className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const isPdf =
    adjunto.tipo === 'application/pdf' ||
    (adjunto.nombre && adjunto.nombre.toLowerCase().endsWith('.pdf')) ||
    adjunto.dataUrl.startsWith('data:application/pdf');

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = adjunto.dataUrl;
    a.download = adjunto.nombre || `comprobante_${pagoId || 'pago'}.${isPdf ? 'pdf' : 'png'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera del modal */}
        <div className="bg-emerald-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-800/80 rounded-lg text-emerald-300">
              <i className="fa-solid fa-file-invoice text-lg"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base">
                  Comprobante Digital de Transferencia Bancaria
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-700 text-white">
                  {pagoId}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200">
                Escuela Normal Superior Dalmacio Vélez Sársfield • Tesorería y Secretaría
              </p>
            </div>
          </div>
          <button
            onClick={() => setPreviewComprobante(null)}
            className="text-emerald-200 hover:text-white p-1 rounded-md text-sm font-bold transition-colors"
            title="Cerrar ventana"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Metadatos del pago y del archivo */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
              Alumno / Titular
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
              {alumnoNombre || 'Estudiante'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
              Referencia / Op.
            </span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-200 truncate block">
              {comprobanteRef || 'S/R'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
              Monto Acreditado
            </span>
            <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              ${monto ? Number(monto).toLocaleString('es-AR') : '-'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
              Archivo / Peso
            </span>
            <span className="font-mono text-slate-600 dark:text-slate-300 truncate block" title={adjunto.nombre}>
              {adjunto.nombre} ({adjunto.tamanio || 'OK'})
            </span>
          </div>
        </div>

        {/* Visor interactivo del archivo */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950/80 flex items-center justify-center min-h-[320px]">
          {isPdf ? (
            <div className="w-full h-[55vh] flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden shadow-inner">
              <iframe
                src={adjunto.dataUrl}
                title="Visor de Comprobante PDF"
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="max-w-full max-h-[55vh] flex items-center justify-center">
              <img
                src={adjunto.dataUrl}
                alt={`Comprobante de ${alumnoNombre || 'pago'}`}
                className="max-h-[55vh] max-w-full rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 object-contain bg-white"
              />
            </div>
          )}
        </div>

        {/* Barra inferior de acciones */}
        <div className="p-3.5 sm:px-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            <i className="fa-solid fa-shield-halved text-emerald-600"></i>
            <span>Verificación digital de tesorería • Subido: {adjunto.fechaSubida || fecha}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <i className="fa-solid fa-download"></i>
              <span>Descargar Archivo</span>
            </button>
            <button
              onClick={() => setPreviewComprobante(null)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
