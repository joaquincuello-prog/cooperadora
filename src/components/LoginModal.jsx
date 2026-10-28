import React, { useState } from 'react';
import { useCooperadora } from '../context/CooperadoraContext';
import { USUARIOS_SISTEMA } from '../data/mockData';

export default function LoginModal() {
  const { isLoginModalOpen, setIsLoginModalOpen, iniciarSesion, sessionToken } = useCooperadora();
  const [identificador, setIdentificador] = useState('tesorero');
  const [password, setPassword] = useState('Teso2026*DVS');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isLoginModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const res = iniciarSesion(identificador, password);
    if (!res.ok) {
      setError(res.error);
    }
  };

  const fillCredentials = (u) => {
    setIdentificador(u.username);
    setPassword(u.passwordHash || u.password);
    setError('');
  };

  return (
    <div
      id="modalLogin"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Encabezado Institucional */}
        <div className="px-6 py-5 border-b border-emerald-100 dark:border-slate-800 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/escudo-colegio.png"
              alt="Escudo Escuela Normal Superior Dalmacio Vélez Sársfield"
              className="w-10 h-10 rounded-full bg-white p-0.5 shadow-sm"
            />
            <div>
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                Escuela Normal Superior Dalmacio Vélez Sársfield
              </h3>
              <p className="text-[11px] text-emerald-200 font-medium">
                Autenticación y Manejo de Sesiones Seguras (Tokens JWT / RBAC)
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLoginModalOpen(false)}
            className="text-emerald-200 hover:text-white p-1 rounded-md text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation text-rose-500 text-sm"></i>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Usuario o Correo Institucional:
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <i className="fa-solid fa-envelope"></i>
              </span>
              <input
                type="text"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="ej: tesoreria@ensdvs.edu.ar o tesorero"
                required
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none font-mono text-xs transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">
                Contraseña Segura:
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <i className="fa-solid fa-lock"></i>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none font-mono text-xs transition"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-900 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-start gap-2">
            <i className="fa-solid fa-shield-halved text-emerald-600 mt-0.5"></i>
            <div>
              <strong>Seguridad Institucional:</strong> Al autenticar se emite un token de sesión criptográfico (JWT) de 8 horas con permisos RBAC según el rol institucional.
            </div>
          </div>

          {/* Accesos rápidos con credenciales por usuario */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>Perfiles Institucionales (Clic para autocompletar):</span>
              <span className="text-[10px] text-slate-500 font-mono">RBAC</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {USUARIOS_SISTEMA.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => fillCredentials(u)}
                  className={`text-left p-2.5 rounded-xl border transition-all ${
                    identificador.toLowerCase() === u.username.toLowerCase() ||
                    identificador.toLowerCase() === u.email.toLowerCase()
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {u.rol === 'tesorero' ? 'Tesorería' : u.rol === 'secretaria' ? 'Secretaría' : u.rol === 'admin' ? 'Administrador' : 'Padre / Socio'}
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {u.username}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {u.email}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              {sessionToken ? '● Token JWT en memoria' : '○ Sin sesión activa'}
            </span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md transition-colors flex items-center gap-1.5"
              >
                <i className="fa-solid fa-key"></i>
                <span>Ingresar al Sistema</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
