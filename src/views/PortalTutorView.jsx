import React, { useState } from 'react';
import { useCooperadora } from '../context/CooperadoraContext';
import { DESCUENTO_HERMANO_PCT } from '../data/mockData';

export default function PortalTutorView() {
  const {
    state,
    getStudent,
    getStudentCuotas,
    hasSiblingDiscount,
    setActiveReciboId,
    setPreviewComprobante,
    registrarCuentaTutor,
    iniciarSesion,
    guardarTutor,
    vincularHijoPorDni,
    cambiarCuentaTutorPortal
  } = useCooperadora();

  // Determinar si el padre/tutor actual está autenticado y vinculado a su propio registro
  const authenticatedTutorId =
    state.role === 'tutor'
      ? state.currentUser?.requiereRegistro
        ? null
        : state.currentUser?.tutorId || null
      : state.selectedTutorPortalId || null;

  const currentTutor = authenticatedTutorId
    ? state.tutores.find((t) => t.id === authenticatedTutorId)
    : null;

  // Estados para el formulario de Registro / Ingreso cuando aún no se identificó
  const [authTab, setAuthTab] = useState('register'); // 'register' | 'login'
  const [regForm, setRegForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    dniHijo: '',
    email: '',
    telefono: '',
    password: ''
  });
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Estados para edición de datos propios del padre ya registrado
  const [isEditingMyData, setIsEditingMyData] = useState(false);
  const [editMyData, setEditMyData] = useState({
    telefono: '',
    email: ''
  });

  // Estado para vincular otro hijo por DNI
  const [isLinkingChild, setIsLinkingChild] = useState(false);
  const [nuevoHijoDni, setNuevoHijoDni] = useState('');
  const [linkError, setLinkError] = useState('');

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    const res = registrarCuentaTutor(regForm);
    if (!res.ok) {
      setAuthError(res.error);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    const res = iniciarSesion(loginIdentifier, loginPassword);
    if (!res.ok) {
      setAuthError(res.error);
    }
  };

  const handleSampleTutorFill = (t) => {
    const hijo = state.alumnos.find((a) => a.tutorId === t.id);
    setAuthTab('register');
    setRegForm({
      nombre: t.nombre,
      apellido: t.apellido,
      dni: t.dni,
      dniHijo: hijo ? hijo.dni : '',
      email: t.email,
      telefono: t.telefono,
      password: '123'
    });
    setAuthError('');
  };

  const handleStartEditMyData = () => {
    if (!currentTutor) return;
    setEditMyData({
      telefono: currentTutor.telefono || '',
      email: currentTutor.email || ''
    });
    setIsEditingMyData(true);
  };

  const handleSaveMyData = (e) => {
    e.preventDefault();
    if (!currentTutor) return;
    guardarTutor({
      ...currentTutor,
      telefono: editMyData.telefono.trim() || currentTutor.telefono,
      email: editMyData.email.trim() || currentTutor.email
    });
    setIsEditingMyData(false);
  };

  const handleLinkChildSubmit = (e) => {
    e.preventDefault();
    setLinkError('');
    const res = vincularHijoPorDni(nuevoHijoDni);
    if (!res.ok) {
      setLinkError(res.error);
    } else {
      setNuevoHijoDni('');
      setIsLinkingChild(false);
    }
  };

  // ============================================================================
  // VISTA 1: BLOQUEO DE PRIVACIDAD — PADRE / TUTOR AÚN NO REGISTRADO
  // ============================================================================
  if (!currentTutor) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Banner de Privacidad y Aislamiento de Datos */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-800/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-2xl text-blue-300 shrink-0">
              <i className="fa-solid fa-user-lock"></i>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Identificación Familiar Obligatoria • RBAC
                </span>
                <span className="text-[11px] font-mono text-blue-200">
                  Privacidad de Datos de Alumnos
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                Área Exclusiva para Padres y Tutores
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Por normas de privacidad institucional, <strong>ningún padre puede visualizar información hasta registrarse con sus datos personales</strong>. Una vez registrado, tendrá acceso única y exclusivamente a su propia ficha de socio y a los datos de <strong>su o sus hijos a cargo</strong>, sin acceso a otros padres ni alumnos del establecimiento.
              </p>
            </div>
          </div>
        </div>

        {/* Tarjeta Principal de Registro / Inicio de Sesión Familiar */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setAuthTab('register');
                setAuthError('');
              }}
              className={`flex-1 py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 ${
                authTab === 'register'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <i className="fa-solid fa-user-plus"></i>
              <span>1. Registrarme con Mis Datos (1° Ingreso)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('login');
                setAuthError('');
              }}
              className={`flex-1 py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 ${
                authTab === 'login'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <i className="fa-solid fa-right-to-bracket"></i>
              <span>2. Ya estoy registrado (Ingresar)</span>
            </button>
          </div>

          {authError && (
            <div className="mx-6 mt-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-3">
              <i className="fa-solid fa-triangle-exclamation text-rose-600 mt-0.5 text-sm"></i>
              <div>{authError}</div>
            </div>
          )}

          {authTab === 'register' ? (
            <form onSubmit={handleRegisterSubmit} className="p-6 sm:p-8 space-y-5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Formulario de Alta y Vinculación Familiar
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete sus datos personales. El sistema validará su DNI o el DNI de su hijo/a contra el padrón oficial para asociar únicamente a los alumnos a su cargo.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Padre / Tutor *
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.nombre}
                    onChange={(e) => setRegForm({ ...regForm, nombre: e.target.value })}
                    placeholder="Ej: Laura"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Apellido del Padre / Tutor *
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.apellido}
                    onChange={(e) => setRegForm({ ...regForm, apellido: e.target.value })}
                    placeholder="Ej: Rivas"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    DNI del Padre / Tutor *
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.dni}
                    onChange={(e) => setRegForm({ ...regForm, dni: e.target.value })}
                    placeholder="Ej: 30.222.333"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    DNI de su Hijo/a Matriculado/a
                  </label>
                  <input
                    type="text"
                    value={regForm.dniHijo}
                    onChange={(e) => setRegForm({ ...regForm, dniHijo: e.target.value })}
                    placeholder="Ej: 46.999.888"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico Personal *
                  </label>
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="laura.rivas@hotmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono Móvil / Contacto *
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.telefono}
                    onChange={(e) => setRegForm({ ...regForm, telefono: e.target.value })}
                    placeholder="Ej: 11-9876-5432"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Crear Contraseña Personal *
                </label>
                <input
                  type="password"
                  required
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  placeholder="Defina su clave para consultar cuotas y recibos"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-id-card-clip"></i>
                <span>Completar Registro y Acceder a los Datos de Mis Hijos</span>
              </button>

              {/* Ayuda interactiva para pruebas con datos del padrón */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <i className="fa-solid fa-wand-magic-sparkles text-amber-500"></i>
                  <span>Simulador para Defensa / Pruebas: Cargar datos de un padre del Padrón Escolar</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {state.tutores.map((t) => {
                    const hijos = state.alumnos.filter((a) => a.tutorId === t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSampleTutorFill(t)}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-blue-50/60 dark:bg-slate-800/60 text-left text-xs transition hover:border-blue-400"
                      >
                        <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
                          <span>
                            {t.apellido}, {t.nombre}
                          </span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                            DNI {t.dni}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Hijo(s) a cargo: {hijos.map((h) => `${h.nombre} ${h.apellido}`).join(' y ')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="p-6 sm:p-8 space-y-5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Ingreso para Padres Ya Registrados
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ingrese su DNI o correo electrónico y su contraseña para ver el estado de cuenta de sus hijos.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  DNI del Padre/Tutor o Correo Electrónico
                </label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Ej: 28.111.222 o carlos.gomez@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-unlock-keyhole"></i>
                <span>Ingresar a Mi Portal Familiar</span>
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // VISTA 2: PADRE REGISTRADO Y AUTENTICADO — SOLO VE SU PROPIA INFORMACIÓN Y SUS HIJOS
  // ============================================================================
  const hijosAsociados = state.alumnos.filter(
    (a) => a.tutorId === currentTutor.id
  );

  const recibosFamiliares = state.pagos.filter(
    (p) =>
      p.tutorId === currentTutor.id &&
      String(p.estado || '').toUpperCase() !== 'ANULADO'
  );

  const totalAportadoFamilia = recibosFamiliares.reduce(
    (acc, p) => acc + p.montoTotal,
    0
  );
  const totalAhorradoHermanos = recibosFamiliares.reduce(
    (acc, p) => acc + (p.descuento || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Encabezado Portal de Autogestión Padre / Tutor (Sin selector de otros padres) */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                Actor UML: Padre / Tutor Registrado • HU-08
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-400/20 text-blue-200 border border-blue-400/30 flex items-center gap-1">
                <i className="fa-solid fa-lock text-[10px]"></i>
                Sesión Privada: Solo Mis Hijos a Cargo
              </span>
            </div>
            <h2 className="text-xl font-black">
              Bienvenido/a, {currentTutor.nombre} {currentTutor.apellido}
            </h2>
            <p className="text-xs text-teal-100 mt-1 max-w-2xl">
              Aquí puede consultar su información personal de socio, verificar el estado de las cuotas exclusivamente de <strong>su(s) hijo(s) a cargo</strong> y descargar sus comprobantes oficiales de pago.
            </p>
          </div>

          {/* Tarjeta de Sesión Personal del Padre (sin acceso a otros padres) */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 min-w-[280px] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-emerald-300 flex items-center gap-1.5">
                <i className="fa-solid fa-circle-check"></i>
                Titular Identificado
              </span>
              <span className="text-[11px] font-mono bg-slate-900/70 px-2 py-0.5 rounded text-teal-200">
                DNI {currentTutor.dni}
              </span>
            </div>
            <div className="text-xs text-white/90">
              Hijos vinculados a su cuenta: <strong>{hijosAsociados.length}</strong>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsLinkingChild(!isLinkingChild)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold transition flex items-center justify-center gap-1.5"
              >
                <i className="fa-solid fa-child-reaching"></i>
                <span>Vincular otro hijo/a</span>
              </button>
              <button
                type="button"
                onClick={cambiarCuentaTutorPortal}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 text-[11px] font-bold transition flex items-center justify-center gap-1.5"
                title="Salir de esta cuenta familiar y volver al registro de Padre/Tutor"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                <span>Cambiar Padre</span>
              </button>
            </div>
          </div>
        </div>

        {/* Panel desplegable para asociar otro hijo por DNI si el padre tiene otro alumno en el colegio */}
        {isLinkingChild && (
          <form
            onSubmit={handleLinkChildSubmit}
            className="mt-4 pt-4 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center gap-3"
          >
            <div className="flex-1 text-xs">
              <span className="font-bold text-emerald-300 block">
                ¿Tiene otro hijo/a matriculado/a en la escuela?
              </span>
              <span className="text-teal-100/80 text-[11px]">
                Ingrese el DNI del estudiante para vincularlo a su grupo familiar y activar el descuento por hermanos (-20%).
              </span>
              {linkError && (
                <span className="block text-rose-300 font-bold mt-1">
                  {linkError}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={nuevoHijoDni}
                onChange={(e) => setNuevoHijoDni(e.target.value)}
                placeholder="DNI del alumno (ej: 47.654.321)"
                className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-mono border border-emerald-400/40 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition"
              >
                Vincular Hijo/a
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Resumen de Mi Información Personal y de Mi Grupo Familiar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">
              Mis Datos Personales (Socio)
            </span>
            {!isEditingMyData && (
              <button
                type="button"
                onClick={handleStartEditMyData}
                className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <i className="fa-solid fa-pen-to-square"></i>
                <span>Actualizar mis datos</span>
              </button>
            )}
          </div>

          {!isEditingMyData ? (
            <>
              <p className="text-lg font-black text-slate-800 dark:text-white mt-1">
                {currentTutor.apellido}, {currentTutor.nombre}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                DNI: <span className="font-mono font-bold">{currentTutor.dni}</span> • Estado:{' '}
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {currentTutor.estado || 'Activo'}
                </span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                <i className="fa-solid fa-envelope mr-1 text-slate-400"></i>
                {currentTutor.email}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <i className="fa-solid fa-phone mr-1 text-slate-400"></i>
                {currentTutor.telefono}
              </p>
            </>
          ) : (
            <form onSubmit={handleSaveMyData} className="mt-2 space-y-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500">
                  Mi Correo Electrónico:
                </label>
                <input
                  type="email"
                  required
                  value={editMyData.email}
                  onChange={(e) => setEditMyData({ ...editMyData, email: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500">
                  Mi Teléfono:
                </label>
                <input
                  type="text"
                  required
                  value={editMyData.telefono}
                  onChange={(e) => setEditMyData({ ...editMyData, telefono: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingMyData(false)}
                  className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase text-slate-400">
            Mis Hijos a Cargo y Beneficio (RF-05)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-700 dark:text-blue-400">
              {hijosAsociados.length} Hijo(s)
            </span>
            {hijosAsociados.length >= 2 ? (
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                Bonificación Hermanos -20% Activa
              </span>
            ) : (
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                Tarifa Regular
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {hijosAsociados.map((h) => `${h.nombre} ${h.apellido} (${h.curso} "${h.division}")`).join(' • ')}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase text-slate-400">
            Total Aportado por Mi Familia (2026)
          </span>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">
            ${totalAportadoFamilia.toLocaleString('es-AR')}
          </p>
          {totalAhorradoHermanos > 0 ? (
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              Ahorro familiar por hermanos: $
              {totalAhorradoHermanos.toLocaleString('es-AR')}
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {recibosFamiliares.length} comprobante(s) propio(s) emitido(s)
            </p>
          )}
        </div>
      </div>

      {/* CASO DE USO 1 DEL DIAGRAM DE USOS PADRE/TUTOR: CONSULTAR ESTADOS DE CUOTAS (SOLO DE SUS HIJOS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
              <i className="fa-solid fa-children text-blue-600"></i>
              <span>Estado de Cuotas de Mis Hijos (Caso de Uso: Consultar Estados de Cuotas)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visualización exclusiva de los alumnos asociados a su DNI de Padre/Tutor ({currentTutor.apellido}, {currentTutor.nombre}).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {hijosAsociados.map((hijo) => {
            const cuotasHijo = getStudentCuotas(hijo.id);
            const tieneDesc = hasSiblingDiscount(hijo.id);
            const pagadasCount = cuotasHijo.filter((c) => c.estado === 'pagada').length;
            const pendientesCount = cuotasHijo.filter((c) => c.estado !== 'pagada').length;

            return (
              <div
                key={hijo.id}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden"
              >
                <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <span>{hijo.apellido}, {hijo.nombre}</span>
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-white/10 text-slate-200">
                        Hijo/a a cargo
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      DNI {hijo.dni} • {hijo.curso} "{hijo.division}" (Turno {hijo.turno})
                    </p>
                  </div>
                  <div className="text-right">
                    {tieneDesc && (
                      <span className="text-[11px] bg-emerald-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full block mb-1">
                        Bonificación -20%
                      </span>
                    )}
                    <span className="text-[10px] text-slate-300 font-mono">
                      {pagadasCount} al día • {pendientesCount} pend.
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto text-xs">
                  {cuotasHijo.map((c) => {
                    const importeConDesc = tieneDesc
                      ? Math.round(c.monto * (1 - DESCUENTO_HERMANO_PCT))
                      : c.monto;
                    return (
                      <div
                        key={c.id}
                        className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {c.concepto}
                          </span>
                          <span className="block text-[11px] text-slate-400">
                            Vencimiento: {c.vencimiento}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                            ${importeConDesc.toLocaleString('es-AR')}
                          </span>
                          {c.estado === 'pagada' ? (
                            <button
                              onClick={() => setActiveReciboId(c.pagoId)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold flex items-center gap-1"
                              title="Ver comprobante de esta cuota"
                            >
                              <i className="fa-solid fa-receipt"></i> Pagada
                            </button>
                          ) : c.estado === 'vencida' ? (
                            <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-800 font-bold">
                              Vencida
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold">
                              Pendiente
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CASO DE USO 2 DEL DIAGRAMA DE USOS PADRE/TUTOR: OBTENER COMPROBANTE DE PAGO */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <i className="fa-solid fa-file-invoice text-emerald-600"></i>
              Mis Comprobantes de Pago (Caso de Uso: Obtener Comprobante de Pago)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comprobantes emitidos exclusivamente para los hijos de <strong>{currentTutor.nombre} {currentTutor.apellido}</strong>.
            </p>
          </div>
          <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
            {recibosFamiliares.length} Recibo(s) Propio(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-4">N° Comprobante</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Mi Hijo/a</th>
                <th className="py-3 px-4">Conceptos Abonados</th>
                <th className="py-3 px-4">Medio de Pago</th>
                <th className="py-3 px-4 text-right">Importe Abonado</th>
                <th className="py-3 px-4 text-right">Descarga / Impresión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {recibosFamiliares.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="py-8 text-center text-xs text-slate-400"
                  >
                    No se registran pagos emitidos para sus hijos aún.
                  </td>
                </tr>
              ) : (
                recibosFamiliares.map((rec) => {
                  const alu = getStudent(rec.alumnoId);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">
                        {rec.id}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {rec.fecha}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white">
                        {alu ? `${alu.apellido}, ${alu.nombre}` : 'Alumno'}
                        <span className="block text-xs font-normal text-slate-500">
                          {alu?.curso} "{alu?.division}"
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">
                        {rec.conceptos.join(', ')}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-semibold">{rec.medio}</span>
                        <span className="block font-mono text-[10px] text-slate-400">
                          Ref: {rec.comprobante}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        ${rec.montoTotal.toLocaleString('es-AR')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {rec.comprobanteAdjunto && (
                            <button
                              onClick={() =>
                                setPreviewComprobante({
                                  pagoId: rec.id,
                                  alumnoNombre: alu ? `${alu.apellido}, ${alu.nombre}` : 'Hijo/a',
                                  comprobanteRef: rec.comprobante,
                                  medio: rec.medio,
                                  monto: rec.montoTotal,
                                  fecha: rec.fecha,
                                  adjunto: rec.comprobanteAdjunto
                                })
                              }
                              className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition shadow-2xs inline-flex items-center gap-1.5"
                              title="Ver comprobante bancario digital"
                            >
                              <i className="fa-solid fa-paperclip"></i>
                              <span>Transferencia</span>
                            </button>
                          )}
                          <button
                            onClick={() => setActiveReciboId(rec.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
                          >
                            <i className="fa-solid fa-file-pdf"></i>
                            <span>Recibo Oficial</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
