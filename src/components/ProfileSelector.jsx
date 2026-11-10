import React from 'react';

export const PROFILES_CONFIG = [
  {
    id: 'secretaria',
    rol: 'secretaria',
    titulo: 'Secretaría',
    subtitulo: 'Cobranzas y Registro de Alumnos',
    icono: 'fa-cash-register',
    colorHeader: 'from-emerald-700 to-teal-800',
    borderColor: 'border-emerald-500/40 hover:border-emerald-500',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    descripcion: 'Gestión diaria de cobro de aranceles, alta y matriculación de alumnos, grupos familiares y emisión inmediata de recibos.',
    tareas: [
      'Cobro de cuotas en ventanilla (Efectivo / Transferencia)',
      'Alta y matriculación de estudiantes',
      'Bonificación automática del 20% por hermanos',
      'Emisión e impresión de recibos con numeración correlativa'
    ],
    usuarioDemo: 'secretaria',
    emailDemo: 'secretaria@ensdvs.edu.ar'
  },
  {
    id: 'tesorero',
    rol: 'tesorero',
    titulo: 'Tesorería',
    subtitulo: 'Arqueo de Caja y Fiscalización',
    icono: 'fa-vault',
    colorHeader: 'from-amber-600 to-orange-700',
    borderColor: 'border-amber-500/40 hover:border-amber-500',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    descripcion: 'Control financiero riguroso, arqueos de fondos, ajustes excepcionales de cuotas con motivo y validación de transferencias bancarias.',
    tareas: [
      'Arqueo de caja y conciliación de saldos contables',
      'Ajustes de cuotas con motivo obligatorio en auditoría',
      'Validación y visado de comprobantes de transferencia',
      'Cierres de período contable y control de egresos'
    ],
    usuarioDemo: 'tesorero',
    emailDemo: 'tesoreria@ensdvs.edu.ar'
  },
  {
    id: 'admin',
    rol: 'admin',
    titulo: 'Administrador / Rectoría',
    subtitulo: 'Supervisión y Control General',
    icono: 'fa-user-tie',
    colorHeader: 'from-purple-700 to-indigo-900',
    borderColor: 'border-purple-500/40 hover:border-purple-500',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    descripcion: 'Supervisión ejecutiva institucional, auditoría global de operaciones, métricas de recaudación y control de acceso del sistema.',
    tareas: [
      'Supervisión y control del sistema integral',
      'Reportes ejecutivos de recaudación y morosidad',
      'Control de accesos y seguridad por roles (RBAC)',
      'Trazabilidad completa de auditoría y registros'
    ],
    usuarioDemo: 'admin',
    emailDemo: 'admin@ensdvs.edu.ar'
  },
  {
    id: 'tutor',
    rol: 'tutor',
    titulo: 'Familia / Padre / Tutor',
    subtitulo: 'Portal Privado de Autogestión',
    icono: 'fa-house-user',
    colorHeader: 'from-blue-700 to-cyan-800',
    borderColor: 'border-blue-500/40 hover:border-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-emerald-800',
    descripcion: 'Portal privado para padres y tutores: requiere registro previo con sus datos y muestra únicamente la información de su(s) propio(s) hijo(s).',
    tareas: [
      'Registro obligatorio del padre/tutor y validación con el padrón',
      'Privacidad estricta: acceso exclusivo a su(s) hijo(s) a cargo',
      'Consulta de estado de cuotas y descuento del 20% por hermanos',
      'Descarga de sus propios comprobantes de pago oficiales (PDF)'
    ],
    usuarioDemo: 'tutor',
    emailDemo: 'carlos.gomez@gmail.com'
  }
];

export default function ProfileSelector({ selectedRole, onSelectRole }) {
  return (
    <div className="w-full">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 mb-3">
          <i className="fa-solid fa-fingerprint text-[11px]"></i>
          Control de Acceso Basado en Roles (RBAC)
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          ¿Cómo deseas ingresar al sistema?
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          Selecciona tu perfil institucional para abrir el formulario correspondiente con sus atribuciones y accesos autorizados.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {PROFILES_CONFIG.map((perfil) => {
          const isSelected = selectedRole === perfil.rol;
          return (
            <div
              key={perfil.id}
              onClick={() => onSelectRole(perfil.rol)}
              className={`group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border-2 transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl ${
                isSelected
                  ? `${perfil.borderColor} ring-4 ring-emerald-500/20 dark:ring-emerald-400/20 scale-[1.02]`
                  : 'border-slate-200 dark:border-slate-800 hover:scale-[1.01]'
              }`}
            >
              {/* Tarjeta superior con gradiente de color institucional */}
              <div>
                <div
                  className={`p-5 rounded-t-2xl bg-gradient-to-r ${perfil.colorHeader} text-white relative overflow-hidden`}
                >
                  <div className="absolute right-2 -bottom-2 opacity-15 text-6xl pointer-events-none">
                    <i className={`fa-solid ${perfil.icono}`}></i>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl shadow-inner">
                      <i className={`fa-solid ${perfil.icono}`}></i>
                    </div>
                    {isSelected && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-slate-900 shadow-sm flex items-center gap-1">
                        <i className="fa-solid fa-check text-emerald-600"></i>
                        Seleccionado
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-black tracking-tight">{perfil.titulo}</h4>
                  <p className="text-xs text-white/80 font-medium">{perfil.subtitulo}</p>
                </div>

                {/* Contenido descriptivo y tareas permitidas */}
                <div className="p-5 space-y-4 text-xs">
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {perfil.descripcion}
                  </p>

                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Módulos y Atribuciones:
                    </div>
                    <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                      {perfil.tareas.map((tarea, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <i className="fa-solid fa-circle-check text-emerald-500 mt-0.5 text-[10px] shrink-0"></i>
                          <span>{tarea}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Botón de acción al pie de la tarjeta */}
              <div className="p-4 pt-0">
                <button
                  type="button"
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{isSelected ? 'Completar Formulario' : 'Ingresar como ' + perfil.titulo}</span>
                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
