import React, { useState } from 'react';
import { useCooperadora } from '../context/CooperadoraContext';
import ProfileSelector from '../components/ProfileSelector';
import LoginForm from '../components/LoginForm';

export default function LandingView() {
  const { theme, toggleTheme, state } = useCooperadora();
  const [selectedRole, setSelectedRole] = useState('secretaria');

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    scrollToSection('formulario-login');
  };

  const cicloLectivo = state?.cooperadora?.cicloLectivo || 2026;
  const cuit = state?.cooperadora?.cuit || '30-71234567-9';
  const direccion = state?.cooperadora?.direccion || 'Av. Libertador 1450, Buenos Aires';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* 1. Header Institucional Superior */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Logo y Nombre Institucional */}
            <div className="flex items-center space-x-3.5">
              <img
                src="/escudo-colegio.png"
                alt="Escudo Escuela Normal Superior Dalmacio Vélez Sársfield"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-contain border-2 border-emerald-600/40 bg-white p-0.5 shadow-sm"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-none">
                    Sistema Interno para la Cooperadora
                  </h1>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-extrabold mt-1">
                  <span>Escuela Normal Superior Dalmacio Vélez Sársfield</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">Ciclo Lectivo {cicloLectivo}</span>
                </div>
              </div>
            </div>

            {/* Acciones del Header */}
            <div className="flex items-center space-x-3">
              {/* Botón Tema */}
              <button
                onClick={toggleTheme}
                title="Alternar modo claro / oscuro"
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>

              {/* Botón Principal de Acceso */}
              <button
                onClick={() => scrollToSection('formulario-login')}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-arrow-right-to-bracket text-xs"></i>
                <span>Ingresar al Sistema</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* 2. Hero Section Institucional */}
      <section className="relative overflow-hidden py-12 sm:py-20 lg:py-24 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white via-slate-50 to-emerald-50/20 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        
        {/* Adorno decorativo de fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-500 blur-3xl"></div>
          <div className="absolute top-1/2 -right-24 w-96 h-96 rounded-full bg-teal-500 blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Badge institucional */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 mb-6 shadow-xs animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Portal Oficial de Gestión y Cobranzas • Ciclo Lectivo {cicloLectivo}</span>
          </div>

          {/* Gran Título */}
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Gestión Transparente y Autogestión Escolar para Nuestra Comunidad
          </h2>

          {/* Mensaje de Bienvenida Oficial */}
          <p className="mt-6 text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed">
            Bienvenidos al sistema web de la <strong className="text-slate-900 dark:text-white">Asociación Cooperadora de la Escuela Normal Superior Dalmacio Vélez Sársfield</strong>. 
            Una plataforma moderna orientada a la transparencia contable, administración ágil de aranceles y cuotas escolares, 
            y autogestión directa para que las familias consulten estados de cuenta y descarguen sus comprobantes oficiales.
          </p>

          {/* Botones de Acción Hero */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => scrollToSection('formulario-login')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/30 hover:shadow-2xl transition-all duration-200 flex items-center justify-center gap-2.5"
            >
              <i className="fa-solid fa-lock-open"></i>
              <span>Ingresar al Sistema</span>
            </button>
            <button
              onClick={() => scrollToSection('perfiles-acceso')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-sm sm:text-base border border-slate-300 dark:border-slate-700 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-layer-group text-emerald-600"></i>
              <span>Ver Perfiles de Acceso</span>
            </button>
          </div>

          {/* 4 Pilares Institucionales */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-lg mb-3">
                <i className="fa-solid fa-scale-balanced"></i>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Transparencia Total</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Arqueos de caja diarios, ajuste de cuotas con motivo obligatorio y rendición de cuentas en tiempo real.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center text-lg mb-3">
                <i className="fa-solid fa-people-roof"></i>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Descuento Hermanos</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Bonificación automática del 20% en aranceles mensuales para familias con más de un hijo en el establecimiento.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-lg mb-3">
                <i className="fa-solid fa-qrcode"></i>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Autogestión de Familias</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Portal 24hs para padres y tutores: consulta de cuotas y descarga directa de recibos digitales con QR.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center text-lg mb-3">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Seguridad RBAC & JWT</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Control estricto de accesos por rol con sesiones criptográficas seguras y trazabilidad de cada acción.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 3. Sección Selección de Perfil / Tipo de Ingreso */}
      <section id="perfiles-acceso" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProfileSelector
          selectedRole={selectedRole}
          onSelectRole={handleRoleSelect}
        />
      </section>

      {/* 4. Sección Formulario de Login */}
      <section id="formulario-login" className="py-12 sm:py-16 bg-slate-100/70 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Autenticación Institucional
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
              Ingreso Seguro al Portal
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Ingresa con tus credenciales asignadas o utiliza los accesos rápidos de prueba.
            </p>
          </div>

          <LoginForm
            activeRole={selectedRole}
            onSelectRole={setSelectedRole}
          />
        </div>
      </section>

      {/* 5. Footer Institucional */}
      <footer className="mt-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 px-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3.5">
            <img
              src="/escudo-colegio.png"
              alt="Escudo Institucional"
              className="w-10 h-10 object-contain rounded-full bg-white p-0.5 border border-slate-300 dark:border-slate-700"
            />
            <div>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                Escuela Normal Superior Dalmacio Vélez Sársfield
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Asociación Cooperadora • Personería Jurídica y CUIT: {cuit}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {direccion} • Ciclo Lectivo {cicloLectivo}
              </p>
            </div>
          </div>

          <div className="text-center md:text-right text-[11px] space-y-1">
            <p className="font-mono font-bold text-slate-700 dark:text-slate-300">
              Sistema Interno para la Cooperadora
            </p>
            <p className="text-slate-400">
              Arquitectura de Software Full Stack • Módulos 1 a 4 • React 18 + JWT + RBAC
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
