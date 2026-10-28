import React from 'react';
import { useCooperadora } from '../context/CooperadoraContext';

export default function RoleBanner() {
  const { state } = useCooperadora();
  const { role } = state;

  const roleConfig = {
    secretaria: {
      bg: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200',
      dot: 'bg-emerald-600 dark:bg-emerald-400',
      title: 'Secretaría (Operativo Diario)',
      desc: 'Casos de Uso habilitados: Registrar alumnos (HU-01), Registrar socio/tutor, Gestionar cuotas, Registrar pagos (HU-02), Aplicar descuento automático por hermanos (HU-04) y Consultar deudas (HU-03).'
    },
    tesorero: {
      bg: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 text-amber-950 dark:text-amber-200',
      dot: 'bg-amber-600 dark:bg-amber-400',
      title: 'Tesorería (Fiscalización y Auditoría)',
      desc: 'Casos de Uso habilitados: Ajuste de cuotas con motivo obligatorio en auditoría, conciliación y validación de transferencias con comprobante, rectificación/anulación de pagos, arqueo de caja y cierres de período.'
    },
    admin: {
      bg: 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800/60 text-purple-950 dark:text-purple-200',
      dot: 'bg-purple-600 dark:bg-purple-400',
      title: 'Administrador Institucional / Rectoría',
      desc: 'Supervisión ejecutiva integral, gestión de usuarios y roles RBAC, auditoría global y reportes de recaudación.'
    },
    director: {
      bg: 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800/60 text-sky-950 dark:text-sky-200',
      dot: 'bg-sky-600 dark:bg-sky-400',
      title: 'Director Institucional (Modo Consulta Ejecutiva — HU-09)',
      desc: 'Casos de Uso habilitados: Consultar reportes generales de recaudación, evolución de cobranza por curso y estado financiero de la cooperadora (sin permisos de escritura).'
    },
    tutor: {
      bg: 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800/60 text-indigo-950 dark:text-indigo-200',
      dot: 'bg-indigo-600 dark:bg-indigo-400',
      title: 'Padre / Tutor (Socio de Cooperadora — HU-08)',
      desc: 'Casos de Uso habilitados: Consultar estados de cuotas de sus hijos representados (consultarEstadoCuenta) y Obtener comprobantes oficiales de pago en PDF/Impresión.'
    }
  };

  const current = roleConfig[role] || roleConfig.secretaria;

  return (
    <div
      className={`no-print mb-5 p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs transition-colors duration-200 ${current.bg}`}
    >
      <div className="flex items-start sm:items-center space-x-2.5">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 sm:mt-0 animate-pulse ${current.dot}`} />
        <div>
          <span className="font-extrabold mr-1.5">Rol Activo: {current.title} —</span>
          <span className="opacity-90">{current.desc}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2 text-[11px] font-medium shrink-0">
        <span className="font-mono font-bold px-2 py-0.5 rounded bg-white/70 dark:bg-slate-900/60 border border-current/20">
          Cuota Base: $5.000
        </span>
        <span className="font-bold px-2 py-0.5 rounded bg-white/70 dark:bg-slate-900/60 border border-current/20">
          Desc. Hermanos: 20% OFF
        </span>
      </div>
    </div>
  );
}
