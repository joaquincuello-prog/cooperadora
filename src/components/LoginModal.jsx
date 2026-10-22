import React, { useState } from 'react';
import { useCooperadora } from '../context/CooperadoraContext';
import { USUARIOS_SISTEMA } from '../data/mockData';

export default function LoginModal() {
  const { isLoginModalOpen, setIsLoginModalOpen, iniciarSesion } = useCooperadora();
  const [username, setUsername] = useState('secretaria');
  const [password, setPassword] = useState('123');
  const [error, setError] = useState('');

  if (!isLoginModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const res = iniciarSesion(username, password);
    if (!res.ok) {
      setError(res.error);
    } else {
      setError('');
    }
  };

  const fillCredentials = (u) => {
    setUsername(u.username);
    setPassword(u.password);
    setError('');
  };

  return (
    <div
      id="modalLogin"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl max-w-md w-full overflow-hidden">
        <div className="px-5 py-4 border-b border-emerald-100 dark:border-slate-700 flex items-center justify-between bg-emerald-50/70 dark:bg-slate-800">
          <div className="flex items-center space-x-2.5">
            <img src="/escudo-colegio.png" alt="Escudo" className="w-8 h-8 rounded-full" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Control de Acceso y Seguridad (RNF-01)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Método UML: <code className="font-mono">Usuario.iniciarSesion()</code>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLoginModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold px-2"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Usuario o Correo Institucional:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-md font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Contraseña:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-md font-mono"
            />
          </div>

          {/* Accesos rápidos para la defensa del proyecto */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Cuentas de Prueba (Clic para autocompletar — Clave: <code className="font-mono">123</code>):
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {USUARIOS_SISTEMA.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => fillCredentials(u)}
                  className="text-left p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-400 transition-colors"
                >
                  <div className="font-bold text-slate-900 dark:text-white">{u.cargo}</div>
                  <div className="text-[10px] font-mono text-slate-500">
                    usr: {u.username}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(false)}
              className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs"
            >
              Iniciar Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
