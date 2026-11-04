import React, { useState, useEffect } from 'react';
import { useCooperadora } from '../context/CooperadoraContext';
import { USUARIOS_SISTEMA } from '../data/mockData';
import { PROFILES_CONFIG } from './ProfileSelector';

export default function LoginForm({ activeRole, onSelectRole, onSuccess }) {
  const { iniciarSesion } = useCooperadora();

  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Al cambiar el rol preseleccionado externamente, precompletar credenciales de ayuda si los campos están vacíos
  useEffect(() => {
    if (activeRole) {
      const match = USUARIOS_SISTEMA.find((u) => u.rol === activeRole);
      if (match) {
        setIdentificador(match.email);
        setPassword(match.password);
        setError('');
      }
    }
  }, [activeRole]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!identificador.trim()) {
      setError('Por favor, ingrese su usuario o correo institucional.');
      return;
    }
    if (!password) {
      setError('Por favor, ingrese su contraseña institucional.');
      return;
    }

    setIsLoading(true);

    // Pequeño retardo de 500ms para simular verificación criptográfica y dar feedback visual
    setTimeout(() => {
      const res = iniciarSesion(identificador, password);
      setIsLoading(false);

      if (!res.ok) {
        setError(res.error || 'Credenciales incorrectas.');
      } else if (onSuccess) {
        onSuccess(res.user);
      }
    }, 500);
  };

  const handleQuickFill = (user) => {
    setIdentificador(user.email);
    setPassword(user.password);
    setError('');
    if (onSelectRole) {
      onSelectRole(user.rol);
    }
  };

  const currentProfile = PROFILES_CONFIG.find((p) => p.rol === activeRole);

  return (
    <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-300">
      
      {/* Encabezado del Formulario */}
      <div className="px-6 py-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <img
            src="/escudo-colegio.png"
            alt="Escudo Institucional"
            className="w-11 h-11 rounded-full bg-white p-0.5 shadow-md shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold tracking-tight">
                Iniciar Sesión Segura
              </h3>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                JWT • RBAC
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 font-medium">
              Escuela Normal Superior Dalmacio Vélez Sársfield
            </p>
          </div>
        </div>

        {currentProfile && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-xs text-xs font-bold text-white border border-white/20">
            <i className={`fa-solid ${currentProfile.icono} text-emerald-300 text-[11px]`}></i>
            <span>{currentProfile.titulo}</span>
          </div>
        )}
      </div>

      {/* Selector Rápido de Pestaña de Rol */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {PROFILES_CONFIG.map((p) => {
          const isActive = activeRole === p.rol;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectRole && onSelectRole(p.rol)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <i className={`fa-solid ${p.icono} text-[10px]`}></i>
              <span>{p.titulo}</span>
            </button>
          );
        })}
      </div>

      {/* Cuerpo del Formulario */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
        
        {/* Banner contextual del perfil seleccionado */}
        {currentProfile && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <i className={`fa-solid ${currentProfile.icono} text-sm`}></i>
            </div>
            <div>
              <p className="font-extrabold text-slate-800 dark:text-slate-100">
                Acceso para {currentProfile.titulo} ({currentProfile.subtitulo})
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                {currentProfile.descripcion}
              </p>
            </div>
          </div>
        )}

        {/* Mensaje de Error */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-3 animate-shake">
            <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-900/80 flex items-center justify-center text-rose-600 dark:text-rose-300 shrink-0">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <div className="font-bold">Error de autenticación</div>
              <div className="text-[11px] opacity-90">{error}</div>
            </div>
          </div>
        )}

        {/* Campo: Usuario / Correo */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Usuario o Correo Institucional
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <i className="fa-solid fa-envelope text-sm"></i>
            </span>
            <input
              type="text"
              value={identificador}
              onChange={(e) => {
                setIdentificador(e.target.value);
                if (error) setError('');
              }}
              placeholder="ej: secretaria@ensdvs.edu.ar o tesorero"
              required
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-xs sm:text-sm font-medium transition"
            />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Puedes utilizar tanto tu correo institucional como tu nombre de usuario oficial.
          </p>
        </div>

        {/* Campo: Contraseña */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Contraseña Institucional
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              <span>{showPassword ? 'Ocultar' : 'Mostrar'}</span>
            </button>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <i className="fa-solid fa-lock text-sm"></i>
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="••••••••••••"
              required
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-xs sm:text-sm font-mono transition"
            />
          </div>
        </div>

        {/* Botón Principal de Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-xl font-black text-sm text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
            isLoading
              ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-emerald-600/30'
          }`}
        >
          {isLoading ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin text-sm"></i>
              <span>Validando credenciales criptográficas...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-arrow-right-to-bracket text-sm"></i>
              <span>Ingresar al Sistema</span>
            </>
          )}
        </button>

        {/* Sección de Demostración / Defensa del Proyecto */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <i className="fa-solid fa-wand-magic-sparkles text-amber-500"></i>
              Accesos Rápidos de Prueba (Modo Demo / Examen):
            </span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold">
              1-Clic
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {USUARIOS_SISTEMA.map((user) => {
              const rolMap = {
                secretaria: { label: 'Secretaría', icon: 'fa-user-pen', color: 'text-emerald-600' },
                tesorero: { label: 'Tesorería', icon: 'fa-vault', color: 'text-amber-600' },
                admin: { label: 'Rectoría / Admin', icon: 'fa-user-tie', color: 'text-purple-600' },
                tutor: { label: 'Familia / Tutor', icon: 'fa-users', color: 'text-blue-600' }
              };
              const info = rolMap[user.rol] || rolMap.secretaria;
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickFill(user)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-white dark:bg-slate-800/60 dark:hover:bg-slate-800 text-left transition-all hover:border-emerald-400 group shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <i className={`fa-solid ${info.icon} ${info.color} text-[11px]`}></i>
                      <span>{info.label}</span>
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 group-hover:text-emerald-500 font-bold">
                      {user.username}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {user.nombre}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Garantía de Seguridad Institucional */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
          <i className="fa-solid fa-shield-halved text-emerald-600 mt-0.5 text-xs"></i>
          <div>
            <strong>Autenticación Criptográfica:</strong> La sesión genera un token firmado (JWT) con validez de 8 horas y persistencia local para mantener la sesión ante recargas de página.
          </div>
        </div>

      </form>
    </div>
  );
}
