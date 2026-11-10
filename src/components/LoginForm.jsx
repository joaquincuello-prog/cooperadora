import React, { useState, useEffect } from 'react';
import { useCooperadora } from '../context/CooperadoraContext';
import { USUARIOS_SISTEMA } from '../data/mockData';
import { PROFILES_CONFIG } from './ProfileSelector';

export default function LoginForm({ activeRole, onSelectRole, onSuccess }) {
  const { iniciarSesion, registrarCuentaTutor, state } = useCooperadora();

  // Modo dentro del perfil Padre/Tutor: 'register' (por defecto al elegir tutor) | 'login'
  const [tutorAuthMode, setTutorAuthMode] = useState('register');

  // Estados Login
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados Registro Padre / Tutor
  const [regData, setRegData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    dniHijo: '',
    email: '',
    telefono: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Al cambiar el rol seleccionado:
  // - Si es personal escolar (secretaría, tesorero, admin), autocompletar demo
  // - Si es Padre/Tutor, NO autocompletar datos de otro padre; abrir el registro obligatorio por defecto
  useEffect(() => {
    setError('');
    if (activeRole === 'tutor') {
      setTutorAuthMode('register');
      setIdentificador('');
      setPassword('');
    } else if (activeRole) {
      const match = USUARIOS_SISTEMA.find((u) => u.rol === activeRole);
      if (match) {
        setIdentificador(match.email);
        setPassword(match.password);
      }
    }
  }, [activeRole]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!identificador.trim()) {
      setError('Por favor, ingrese su DNI, usuario o correo electrónico.');
      return;
    }
    if (!password) {
      setError('Por favor, ingrese su contraseña.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = iniciarSesion(identificador, password);
      setIsLoading(false);

      if (!res.ok) {
        setError(res.error || 'Credenciales incorrectas.');
      } else if (onSuccess) {
        onSuccess(res.user);
      }
    }, 400);
  };

  const handleRegisterTutorSubmit = (e) => {
    e.preventDefault();
    setError('');

    setIsLoading(true);
    setTimeout(() => {
      const res = registrarCuentaTutor(regData);
      setIsLoading(false);

      if (!res.ok) {
        setError(res.error);
      } else if (onSuccess) {
        onSuccess(res.user);
      }
    }, 450);
  };

  const handleQuickFill = (user) => {
    if (user.rol === 'tutor') {
      if (onSelectRole) onSelectRole('tutor');
      setTutorAuthMode('login');
      setIdentificador(user.email);
      setPassword(user.password);
      setError('');
      return;
    }
    setIdentificador(user.email);
    setPassword(user.password);
    setError('');
    if (onSelectRole) {
      onSelectRole(user.rol);
    }
  };

  const handleFillSampleTutorFromPadron = (tutor) => {
    const hijo = state?.alumnos?.find((a) => a.tutorId === tutor.id);
    setRegData({
      nombre: tutor.nombre,
      apellido: tutor.apellido,
      dni: tutor.dni,
      dniHijo: hijo ? hijo.dni : '',
      email: tutor.email,
      telefono: tutor.telefono,
      password: '123'
    });
    setError('');
  };

  const currentProfile = PROFILES_CONFIG.find((p) => p.rol === activeRole);
  const isTutorRole = activeRole === 'tutor';

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
                {isTutorRole
                  ? tutorAuthMode === 'register'
                    ? 'Registro de Padre / Tutor'
                    : 'Ingreso Familiar Seguro'
                  : 'Iniciar Sesión Segura'}
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

      {/* Si el rol elegido es Padre/Tutor: Selector entre REGISTRARSE (1° vez) o INICIAR SESIÓN */}
      {isTutorRole && (
        <div className="px-6 pt-5">
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setTutorAuthMode('register');
                setError('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                tutorAuthMode === 'register'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-user-plus"></i>
              <span>Registrarme (1° Vez)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTutorAuthMode('login');
                setError('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                tutorAuthMode === 'login'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-right-to-bracket"></i>
              <span>Ya estoy registrado</span>
            </button>
          </div>
        </div>
      )}

      {/* FORMULARIO DE REGISTRO PARA PADRE / TUTOR */}
      {isTutorRole && tutorAuthMode === 'register' ? (
        <form onSubmit={handleRegisterTutorSubmit} className="p-6 sm:p-7 space-y-4">
          <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <i className="fa-solid fa-user-shield text-sm"></i>
            </div>
            <div>
              <p className="font-extrabold text-slate-800 dark:text-slate-100">
                Privacidad y Protección de Datos Familiares
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                Al ingresar por primera vez no podrá ver información hasta registrarse con sus datos. Una vez validado su vínculo en el padrón, <strong>solo verá la información y cuotas de su(s) propio(s) hijo(s)</strong>.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2.5">
              <i className="fa-solid fa-triangle-exclamation text-rose-600 mt-0.5"></i>
              <div>{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre del Padre / Tutor *
              </label>
              <input
                type="text"
                required
                value={regData.nombre}
                onChange={(e) => setRegData({ ...regData, nombre: e.target.value })}
                placeholder="Ej: Laura"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Apellido del Padre / Tutor *
              </label>
              <input
                type="text"
                required
                value={regData.apellido}
                onChange={(e) => setRegData({ ...regData, apellido: e.target.value })}
                placeholder="Ej: Rivas"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tu DNI (Titular Socio) *
              </label>
              <input
                type="text"
                required
                value={regData.dni}
                onChange={(e) => setRegData({ ...regData, dni: e.target.value })}
                placeholder="Ej: 30.222.333"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                DNI de tu Hijo/a Matriculado/a
              </label>
              <input
                type="text"
                value={regData.dniHijo}
                onChange={(e) => setRegData({ ...regData, dniHijo: e.target.value })}
                placeholder="Ej: 46.999.888 (valida vínculo)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={regData.email}
                onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                placeholder="ejemplo@correo.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                value={regData.telefono}
                onChange={(e) => setRegData({ ...regData, telefono: e.target.value })}
                placeholder="Ej: 11-9876-5432"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Crear Contraseña de Acceso *
            </label>
            <input
              type="password"
              required
              value={regData.password}
              onChange={(e) => setRegData({ ...regData, password: e.target.value })}
              placeholder="Elija una contraseña para futuros ingresos"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Validando vínculo con el Padrón...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-id-card-clip"></i>
                <span>Registrarme y Ver Datos de Mis Hijos</span>
              </>
            )}
          </button>

          {/* Guía rápida de familias en padrón para facilitar la prueba */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-3.5 space-y-2">
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>
                <i className="fa-solid fa-lightbulb text-amber-500 mr-1"></i>
                Familias en Padrón para probar registro (1-Clic para autocompletar):
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {(state?.tutores || []).map((t) => {
                const hijos = (state?.alumnos || []).filter((a) => a.tutorId === t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleFillSampleTutorFromPadron(t)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-blue-50/50 dark:bg-slate-800/50 text-left text-[11px] transition hover:border-blue-400"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {t.apellido}, {t.nombre}{' '}
                      <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                        (DNI {t.dni})
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      Hijo/s: {hijos.map((h) => `${h.nombre} (DNI ${h.dni})`).join(', ')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      ) : (
        /* Cuerpo del Formulario de Login tradicional */
        <form onSubmit={handleLoginSubmit} className="p-6 sm:p-7 space-y-5">
          
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
                  {isTutorRole
                    ? 'Ingrese con su DNI o correo registrado para ver exclusivamente el estado de cuenta y recibos de sus hijos.'
                    : currentProfile.descripcion}
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

          {/* Campo: Usuario / Correo / DNI */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isTutorRole ? 'DNI del Padre/Tutor o Correo Electrónico' : 'Usuario o Correo Institucional'}
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
                placeholder={
                  isTutorRole
                    ? 'ej: 28.111.222 o carlos.gomez@gmail.com'
                    : 'ej: secretaria@ensdvs.edu.ar o tesorero'
                }
                required
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-xs sm:text-sm font-medium transition"
              />
            </div>
          </div>

          {/* Campo: Contraseña */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Contraseña
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
                  tutor: { label: 'Padre ya registrado', icon: 'fa-users', color: 'text-blue-600' }
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
        </form>
      )}
    </div>
  );
}
