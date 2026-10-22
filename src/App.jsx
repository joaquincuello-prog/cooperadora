import React from 'react';
import {
  CooperadoraProvider,
  useCooperadora
} from './context/CooperadoraContext';
import Navbar from './components/Navbar';
import RoleBanner from './components/RoleBanner';
import ReciboModal from './components/ReciboModal';
import LoginModal from './components/LoginModal';

import RecepcionView from './views/RecepcionView';
import PadronView from './views/PadronView';
import TesoreriaView from './views/TesoreriaView';
import ReportesView from './views/ReportesView';
import PortalTutorView from './views/PortalTutorView';
import EstudioIngenieriaView from './views/EstudioIngenieriaView';

function MainLayout() {
  const { activeTab, toast } = useCooperadora();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 transition-colors">
      <Navbar />
      <RoleBanner />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'recepcion' && <RecepcionView />}
        {activeTab === 'padron' && <PadronView />}
        {activeTab === 'tesoreria' && <TesoreriaView />}
        {activeTab === 'reportes' && <ReportesView />}
        {activeTab === 'portalTutor' && <PortalTutorView />}
        {activeTab === 'estudio' && <EstudioIngenieriaView />}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 px-4 mt-8 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <img
              src="/escudo-colegio.png"
              alt="Escudo E.E.S. N° 14"
              className="w-5 h-5 object-contain"
            />
            <span>
              <strong>Asociación Cooperadora E.E.S. N° 14</strong> — Sistema de Gestión Financiera y Padrón de Socios (Frontend React)
            </span>
          </div>
          <div>
            Equipo: Rodríguez, Quinteros, Poveda, Romero • Arquitectura lista para integración REST Backend
          </div>
        </div>
      </footer>

      {/* Modales Globales */}
      <ReciboModal />
      <LoginModal />

      {/* Notificación Toast Flotante */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 no-print animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl border text-xs font-bold flex items-center gap-2.5 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toast.type === 'warning'
                ? 'bg-amber-900 text-white border-amber-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <i
              className={`fa-solid ${
                toast.type === 'success'
                  ? 'fa-circle-check text-emerald-400'
                  : toast.type === 'warning'
                  ? 'fa-triangle-exclamation text-amber-400'
                  : 'fa-circle-info text-blue-400'
              }`}
            ></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <CooperadoraProvider>
      <MainLayout />
    </CooperadoraProvider>
  );
}
