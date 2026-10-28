import React, { useRef, useState, useEffect } from 'react';
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
    cerrarSesion,
    sessionToken,
    exportBackupJSON,
    importBackupJSON,
    exportPadronCSV,
    resetDemoData
  } = useCooperadora();

  const fileInputRef = useRef(null);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const toolsMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  // Cerrar dropdowns al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target)) {
        setIsToolsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roles = [
    { id: 'secretaria', label: 'Secretaría', icon: 'fa-user-pen' },
    { id: 'tesorero', label: 'Tesorería', icon: 'fa-scale-balanced' },
    { id: 'admin', label: 'Administrador', icon: 'fa-user-tie' },
    { id: 'tutor', label: 'Padre / Tutor', icon: 'fa-users' },
  ];

  // Control de Acceso basado en Roles (RBAC) para pestañas principales
  const rolePermissions = {
    secretaria: ['recepcion', 'padron'],
    tesorero: ['tesoreria', 'recepcion'],
    admin: ['reportes', 'tesoreria', 'padron'],
    director: ['reportes', 'tesoreria', 'padron'],
    tutor: ['portalTutor']
  };

  const allTabs = [
    {
      id: 'recepcion',
      label: 'Recepción y Cobranzas',
      icon: 'fa-cash-register',
      roles: ['secretaria', 'tesorero', 'admin']
    },
    {
      id: 'padron',
      label: 'Padrón Alumnos y Socios',
      icon: 'fa-id-card',
      roles: ['secretaria', 'admin']
    },
    {
      id: 'tesoreria',
      label: 'Tesorería, Caja y Ajuste de Cuotas',
      icon: 'fa-vault',
      roles: ['tesorero', 'admin', 'director'],
      badge: state.role === 'tesorero' ? 'Auditoría Activa' : null
    },
    {
      id: 'reportes',
      label: 'Reportes y Dirección',
      icon: 'fa-chart-pie',
      roles: ['admin', 'director', 'tesorero']
    },
    {
      id: 'portalTutor',
      label: 'Portal Padre / Tutor',
      icon: 'fa-house-user',
      roles: ['tutor', 'admin']
    }
  ];

  const allowedTabIds = rolePermissions[state.role] || ['recepcion'];
  const visibleTabs = allTabs.filter((t) => allowedTabIds.includes(t.id));

  return (
    <header className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          
          {/* Identidad Institucional Oficial (Branding) */}
          <div className="flex items-center space-x-3.5">
            <div className="relative shrink-0">
              <img
                src="/escudo-colegio.png"
                alt="Escudo Escuela Normal Superior Dalmacio Vélez Sársfield"
                className="w-12 h-12 rounded-full object-contain border-2 border-emerald-600/40 bg-white p-0.5 shadow-sm"
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"
                title="Sistema Institucional En Línea"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="font-black text-slate-900 dark:text-white tracking-tight text-base sm:text-lg">
                  Escuela Normal Superior Dalmacio Vélez Sársfield
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold border border-emerald-300 dark:border-emerald-700">
                  Cooperadora Escolar
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 flex-wrap">
                <span>Gestión Financiera, Cobranzas y Aranceles</span>
                <span className="hidden sm:inline">•</span>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  CUIT: {state.cooperadora.cuit} • Ciclo Lectivo {state.cooperadora.cicloLectivo}
                </span>
              </p>
            </div>
          </div>

          {/* Barra de Acciones y Controles Superiores Limpia */}
          <div className="flex items-center flex-wrap gap-2 justify-end">
            
            {/* Alternar Tema */}
            <button
              onClick={toggleTheme}
              title="Alternar tema Claro / Oscuro"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Menú de Opciones Secundarias / Herramientas Colapsable */}
            <div className="relative" ref={toolsMenuRef}>
              <button
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
                title="Herramientas del sistema y acciones secundarias"
              >
                <i className="fa-solid fa-ellipsis-vertical"></i>
                <span className="hidden sm:inline">Herramientas</span>
              </button>

              {isToolsOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 text-xs animate-fadeIn">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Respaldo y Auditoría
                  </div>
                  <button
                    onClick={() => {
                      exportBackupJSON();
                      setIsToolsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                  >
                    <i className="fa-solid fa-download text-emerald-600"></i>
                    <span>Descargar Backup JSON</span>
                  </button>
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setIsToolsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                  >
                    <i className="fa-solid fa-upload text-blue-600"></i>
                    <span>Restaurar Copia de Seguridad</span>
                  </button>
                  <button
                    onClick={() => {
                      exportPadronCSV();
                      setIsToolsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                  >
                    <i className="fa-solid fa-file-csv text-teal-600"></i>
                    <span>Exportar Padrón (CSV Excel)</span>
                  </button>

                  <div className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                    Documentación y Pruebas
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('estudio');
                      setIsToolsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                  >
                    <i className="fa-solid fa-diagram-project text-indigo-600"></i>
                    <span>Estudio de Ingeniería & UML</span>
                  </button>
                  <button
                    onClick={() => {
                      resetDemoData();
                      setIsToolsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2"
                  >
                    <i className="fa-solid fa-arrow-rotate-left"></i>
                    <span>Restablecer Datos Originales</span>
                  </button>

                  <div className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                    Cambio Rápido de Rol (Demo RBAC)
                  </div>
                  <div className="px-2 py-1 grid grid-cols-2 gap-1">
                    {roles.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setRole(r.id);
                          setIsToolsOpen(false);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold text-left flex items-center gap-1.5 transition ${
                          state.role === r.id
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <i className={`fa-solid ${r.icon} text-[10px]`}></i>
                        <span>{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

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

            {/* Menú de Sesión y Usuario Autenticado (JWT / RBAC) */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 font-bold text-xs flex items-center gap-2 transition-colors shadow-2xs"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                  <i className="fa-solid fa-user-shield"></i>
                </div>
                <div className="text-left hidden sm:block">
                  <div className="leading-tight text-[11px] truncate max-w-[140px]">
                    {state.currentUser?.nombre || 'Usuario'}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
                    {state.role === 'tesorero' ? 'Tesorería' : state.role === 'secretaria' ? 'Secretaría' : state.role === 'admin' ? 'Administrador' : 'Tutor'}
                  </div>
                </div>
                <i className="fa-solid fa-chevron-down text-[10px] text-emerald-700 dark:text-emerald-400"></i>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-3 z-50 text-xs animate-fadeIn">
                  <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-extrabold text-slate-800 dark:text-white text-sm">
                      {state.currentUser?.nombre}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                      {state.currentUser?.email}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold">
                        ROL: {state.role.toUpperCase()}
                      </span>
                      {sessionToken && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono text-[10px] font-bold flex items-center gap-1">
                          <i className="fa-solid fa-key text-[9px]"></i> JWT Activo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="px-4 py-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                    <i className="fa-solid fa-circle-check text-emerald-500 mr-1.5"></i>
                    {state.currentUser?.cargo}
                  </div>

                  <div className="pt-2 px-2 space-y-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsLoginModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2"
                    >
                      <i className="fa-solid fa-users-gear text-slate-500"></i>
                      <span>Cambiar de Cuenta</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        cerrarSesion();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2"
                    >
                      <i className="fa-solid fa-right-from-bracket"></i>
                      <span>Cerrar Sesión Segura</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Pestañas de Navegación Principal (Filtradas Limpiamente por RBAC) */}
        <nav
          className="flex space-x-1 sm:space-x-2 border-t border-slate-100 dark:border-slate-800 -mb-px overflow-x-auto scrollbar-none"
          aria-label="Módulos Habilitados"
        >
          {visibleTabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`py-3 px-3.5 text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? 'font-extrabold border-emerald-600 dark:border-emerald-500 text-emerald-800 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'font-semibold border-transparent text-slate-600 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:border-emerald-300'
                }`}
              >
                <i className={`fa-solid ${t.icon} text-xs`}></i>
                <span>{t.label}</span>
                {t.badge && (
                  <span className="ml-1 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
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
