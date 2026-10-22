import React, { useRef } from 'react';
import { useCooperadora } from '../context/CooperadoraContext';

export default function Navbar() {
  const {
    state,
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    setRole,
    setIsLoginModalOpen,
    exportBackupJSON,
    importBackupJSON,
    resetDemoData
  } = useCooperadora();

  const fileInputRef = useRef(null);

  const roles = [
    { id: 'secretaria', label: 'Secretaría', color: 'emerald' },
    { id: 'tesorero', label: 'Tesorero', color: 'amber' },
    { id: 'director', label: 'Director', color: 'sky' },
    { id: 'tutor', label: 'Padre/Tutor', color: 'indigo' },
  ];

  const tabs = [
    { id: 'recepcion', label: 'Recepción y Cobros' },
    { id: 'padron', label: 'Padrón Alumnos y Socios' },
    {
      id: 'tesoreria',
      label: 'Tesorería, Caja y Auditoría',
      badge: state.role === 'tesorero' ? 'Autorizado' : 'Restringido',
      badgeColor: state.role === 'tesorero' ? 'emerald' : 'amber'
    },
    { id: 'reportes', label: 'Reportes (Director / Tesorero)' },
    { id: 'portalTutor', label: 'Portal Padre / Tutor' },
    { id: 'estudio', label: 'Ingeniería & UML (Mód. 1–4)' }
  ];

  return (
    <header className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-2.5 gap-3">
          {/* Identidad Institucional con Escudo Escolar */}
          <div className="flex items-center space-x-3.5">
            <div className="relative shrink-0">
              <img
                src="/escudo-colegio.png"
                alt="Escudo E.E.S. N° 14"
                className="w-11 h-11 rounded-full object-contain border-2 border-emerald-600/30 bg-white p-0.5 shadow-xs"
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"
                title="Sistema Operativo"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-base sm:text-lg">
                  Cooperadora Escolar
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                  E.E.S. N° 14
                </span>
                <span className="hidden xl:inline-block text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  CUIT: {state.cooperadora.cuit} • {state.cooperadora.direccion}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Gestión Digital de Socios, Alumnos, Cuotas, Tesorería y Auditoría • Ciclo {state.cooperadora.cicloLectivo}
              </p>
            </div>
          </div>

          {/* Controles Superiores: Tema, Selector de 4 Roles, Login RNF-01, Backup FODA y Reset */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Modo Claro / Oscuro */}
            <button
              onClick={toggleTheme}
              title="Alternar tema Claro / Oscuro (RNF-03 Usabilidad)"
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Conmutador Rápido de los 4 Roles del Estudio */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2 hidden sm:inline">
                Rol (RF-09):
              </span>
              <div className="inline-flex rounded-md p-0.5 bg-slate-200/70 dark:bg-slate-900/70 flex-wrap gap-0.5">
                {roles.map((r) => {
                  const isActive = state.role === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                        isActive
                          ? 'font-bold bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-xs border border-emerald-300 dark:border-emerald-600'
                          : 'font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Botón Login Autenticado (RNF-01 Seguridad / Usuario.iniciarSesion) */}
            <button
              onClick={() => setIsLoginModalOpen(true)}
              title="Autenticación de Usuario (RNF-01: iniciarSesion)"
              className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2.5 py-1.5 rounded-md transition-colors border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-1.5"
            >
              <span>🔐</span>
              <span className="hidden md:inline">
                {state.currentUser?.nombre || 'Iniciar Sesión'}
              </span>
            </button>

            {/* Botones Backup JSON (Mitigación Amenaza FODA Módulo 4) */}
            <button
              onClick={exportBackupJSON}
              title="Exportar Copia de Seguridad JSON (Mitigación Amenaza FODA Módulo 4)"
              className="text-xs px-2.5 py-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 font-semibold"
            >
              ⬇ Backup
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Importar Copia de Seguridad JSON"
              className="text-xs px-2 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 font-medium"
            >
              ⬆ Restaurar
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

            {/* Reiniciar Demo */}
            <button
              onClick={resetDemoData}
              title="Restablecer datos originales de demostración"
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 px-2 py-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-slate-800 border border-transparent hover:border-rose-200 transition-colors font-medium"
            >
              ↺ Reset
            </button>
          </div>
        </div>

        {/* Barra de Navegación por Pestañas */}
        <nav
          className="flex space-x-1 sm:space-x-2 border-t border-slate-100 dark:border-slate-800 -mb-px overflow-x-auto"
          aria-label="Módulos del Sistema"
        >
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`py-3 px-3 text-xs sm:text-sm flex items-center whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'font-bold border-emerald-600 dark:border-emerald-500 text-emerald-800 dark:text-emerald-400'
                    : 'font-medium border-transparent text-slate-500 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:border-emerald-300'
                }`}
              >
                <span>{t.label}</span>
                {t.badge && (
                  <span
                    className={`ml-1.5 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                      t.badgeColor === 'emerald'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
