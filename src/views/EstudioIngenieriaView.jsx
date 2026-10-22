import React, { useState } from 'react';
import { ESTUDIO_PROYECTO } from '../data/mockData';
import { API_ENDPOINTS_CONTRACT } from '../services/cooperadoraApi';

const CASOS_DE_USO_POR_ROL = [
  {
    actor: 'Rol: Secretaría',
    archivo: 'DIAGRAMA DE USOS-ROL SECRETARIA.drawio',
    casos: [
      'Registrar alumno (RF-01, HU-01)',
      'Registrar tutor y asociar hermanos (RF-02, RF-05)',
      'Registrar cuota / gestionar cargos (RF-03)',
      'Registrar pago en Efectivo o Transferencia (RF-04, HU-02)',
      'Consultar estado de cuenta del alumno (RF-06, HU-03)'
    ]
  },
  {
    actor: 'Rol: Tesorero',
    archivo: 'DIAGRAMA DE USOS-ROL TESORERO',
    casos: [
      'Validar pago registrado (Tesorero.validarPago())',
      'Modificar pago con motivo de auditoría (RF-10, HU-05)',
      'Eliminar / Anular pago y revertir cuotas (RF-10, HU-06)',
      'Calcular saldo y cerrar período (Tesoreria.cerrarPeriodo())',
      'Generar reporte financiero (RF-08, HU-07)'
    ]
  },
  {
    actor: 'Rol: Director',
    archivo: 'DIAGRAMA DE USOS-ROL DIRECTOR.drawio',
    casos: [
      'Consultar reportes financieros e institucionales (HU-09)',
      'Auditar índice de cobrabilidad por curso y turno',
      'Supervisar balance de ingresos y egresos (Solo lectura RF-09)'
    ]
  },
  {
    actor: 'Rol: Padre / Tutor',
    archivo: 'Diagrama Caso de Uso PADRE / TUTOR (Imagen)',
    casos: [
      'Obtener comprobante de pago oficial en PDF / Impresión (HU-08)',
      'Consultar estado de cuenta familiar (Socio.consultarEstadoCuenta())',
      'Verificar descuento automático del 20% por hermanos (RF-05)'
    ]
  }
];

const CLASES_DIAGRAMA = [
  {
    clase: 'Cooperadora',
    atributos: ['id: int', 'nombre: string', 'cuit: string', 'direccion: string'],
    metodos: ['registrarSocio()', 'registrarPago()', 'emitirReporte()']
  },
  {
    clase: 'Tesoreria',
    atributos: ['id: int', 'periodo: string', 'saldoInicial: float', 'ingresos: float', 'egresos: float'],
    metodos: ['calcularSaldo()', 'cerrarPeriodo()']
  },
  {
    clase: 'Socio (Tutor)',
    atributos: ['id: int', 'nombre: string', 'apellido: string', 'documento: string', 'email: string', 'telefono: string', 'estado: string'],
    metodos: ['actualizarDatos()', 'consultarEstadoCuenta()']
  },
  {
    clase: 'Alumno',
    atributos: ['id: int', 'nombre: string', 'apellido: string', 'dni: string', 'curso: string', 'division: string', 'turno: string'],
    metodos: ['obtenerDatos()', 'verificarHermanos()']
  },
  {
    clase: 'Cuota',
    atributos: ['id: int', 'concepto: string', 'importe: float', 'vencimiento: date', 'periodo: string', 'estado: string'],
    metodos: ['calcularRecargo()', 'gestionar()']
  },
  {
    clase: 'Pago',
    atributos: ['id: int', 'fechaPago: date', 'importePagado: float', 'medioPago: string', 'numeroComprobante: int'],
    metodos: ['registrar()', 'anular()', 'generarComprobante()']
  },
  {
    clase: 'Comprobante',
    atributos: ['id: int', 'numero: int', 'fechaEmision: date', 'detalle: string', 'total: float'],
    metodos: ['emitir()', 'generarPDF()']
  },
  {
    clase: 'Usuario (Herencia)',
    atributos: ['id: int', 'nombre: string', 'email: string', 'rol: Secretaria | Tesorero | Director | Tutor'],
    metodos: ['iniciarSesion()', 'validarPago()', 'consultarReportes()']
  }
];

const ENTIDADES_DER = [
  {
    entidad: 'COOPERADORA',
    pk: 'id',
    atributos: 'nombre, cuit, direccion',
    relaciones: '1:N con SOCIO y 1:N con TESORERIA'
  },
  {
    entidad: 'TESORERIA',
    pk: 'id',
    atributos: 'cooperadora_id (FK), periodo, saldo_inicial, ingresos, egresos',
    relaciones: 'Pertenece a COOPERADORA; consolida PAGO'
  },
  {
    entidad: 'SOCIO (TUTOR)',
    pk: 'id',
    atributos: 'cooperadora_id (FK), documento, nombre, apellido, email, telefono, fecha_alta, estado',
    relaciones: '1:N con ALUMNO (permite detectar hermanos RF-05) y 1:N con CUOTA'
  },
  {
    entidad: 'ALUMNO',
    pk: 'id',
    atributos: 'tutor_id (FK), dni, nombre, apellido, curso, division, turno',
    relaciones: 'Pertenece a SOCIO/TUTOR; posee N CUOTAS'
  },
  {
    entidad: 'CUOTA',
    pk: 'id',
    atributos: 'socio_id / alumno_id (FK), concepto, periodo, importe, vencimiento, estado',
    relaciones: 'Se cancela mediante PAGO'
  },
  {
    entidad: 'PAGO / COMPROBANTE',
    pk: 'id',
    atributos: 'cuota_id (FK), fecha_pago, importe_pagado, medio_pago, numero_comprobante, estado',
    relaciones: 'Emite COMPROBANTE e impacta en TESORERIA'
  }
];

export default function EstudioIngenieriaView() {
  const [moduloActivo, setModuloActivo] = useState('diagramas');

  return (
    <div className="space-y-6">
      {/* Cabecera del Estudio de Ingeniería de Software */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Documentación Técnica y Estudio Completo • Módulos 1 al 4
            </span>
            <h2 className="text-xl font-black text-slate-800 mt-1.5">
              Sistema de Gestión para la Cooperadora Escolar (E.E.S. N° 14)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Trazabilidad completa entre Relevamiento, Matriz Poder-Interés, Requisitos, Backlog Ágil, FODA, Diagramas UML/DER y Contrato de API para Backend.
            </p>
          </div>

          {/* Equipo del Proyecto */}
          <div className="flex flex-wrap gap-2">
            {ESTUDIO_PROYECTO.equipo.map((int, i) => (
              <div
                key={i}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                title={int.foco}
              >
                <span className="font-bold text-slate-800 block">
                  {int.nombre}
                </span>
                <span className="text-[10px] text-blue-700 font-semibold">
                  {int.rol}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pestañas de navegación del Estudio */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setModuloActivo('diagramas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              moduloActivo === 'diagramas'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <i className="fa-solid fa-diagram-project mr-1.5"></i>
            Diagramas UML y DER (Casos de Uso + Clases)
          </button>

          <button
            onClick={() => setModuloActivo('mod1_2')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              moduloActivo === 'mod1_2'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <i className="fa-solid fa-comments mr-1.5"></i>
            Mód. 1 y 2: Stakeholders y Entrevista
          </button>

          <button
            onClick={() => setModuloActivo('mod3')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              moduloActivo === 'mod3'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <i className="fa-solid fa-list-check mr-1.5"></i>
            Mód. 3: Requisitos (RF/RNF) y Backlog (HU)
          </button>

          <button
            onClick={() => setModuloActivo('mod4')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              moduloActivo === 'mod4'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <i className="fa-solid fa-shield-halved mr-1.5"></i>
            Mód. 4: Análisis FODA y Viabilidad
          </button>

          <button
            onClick={() => setModuloActivo('backend_api')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              moduloActivo === 'backend_api'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <i className="fa-solid fa-server mr-1.5"></i>
            Contrato API REST (Para Compañero de Backend)
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: DIAGRAMAS UML (CASOS DE USO, CLASES Y DER) */}
      {moduloActivo === 'diagramas' && (
        <div className="space-y-6">
          {/* 4 Diagramas de Casos de Uso por Rol */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <h3 className="text-base font-black text-slate-800 mb-1 flex items-center gap-2">
              <i className="fa-solid fa-users-gear text-blue-600"></i>
              1. Diagramas de Casos de Uso UML (4 Roles del Estudio)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Modelado de los 4 actores de los archivos <code className="font-mono">.drawio</code> e imágenes del estudio, todos implementados e interactivos en la barra superior de este sistema React.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {CASOS_DE_USO_POR_ROL.map((cu, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-blue-900 uppercase">
                        {cu.actor}
                      </span>
                      <i className="fa-solid fa-user-check text-blue-600"></i>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 mb-3">
                      Fuente: {cu.archivo}
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {cu.casos.map((c, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <i className="fa-solid fa-circle-check text-emerald-600 mt-0.5 text-[11px]"></i>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Imagen original del Diagrama de Caso de Uso Padre/Tutor subida por el usuario */}
            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center gap-6">
              <img
                src="/diagrama-padre-tutor.png"
                alt="Diagrama de Casos de Uso Rol Padre / Tutor"
                className="h-36 object-contain rounded-lg border border-slate-200 bg-white p-2"
              />
              <div className="text-xs space-y-1.5">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                  Artefacto Integrado en Vista "Portal Padre / Tutor"
                </span>
                <h4 className="font-bold text-slate-800 text-sm">
                  Diagrama de Caso de Uso: Actor PADRE / TUTOR → OBTENER COMPROBANTE DE PAGO
                </h4>
                <p className="text-slate-600">
                  Además de los diagramas <code className="font-mono">DIAGRAMA DE USOS-ROL SECRETARIA.drawio</code>, <code className="font-mono">DIAGRAMA DE USOS-ROL TESORERO</code> y <code className="font-mono">DIAGRAMA DE USOS-ROL DIRECTOR.drawio</code>, se incorporó el rol interactivo <strong>Padre / Tutor</strong> para que las familias consulten su estado de cuenta y descarguen sus recibos oficiales.
                </p>
              </div>
            </div>
          </div>

          {/* Diagramas de Clases Unificados */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <h3 className="text-base font-black text-slate-800 mb-1 flex items-center gap-2">
              <i className="fa-solid fa-sitemap text-indigo-600"></i>
              2. Arquitectura de Clases (<code className="font-mono">diagrama de clases cooperadora.drawio</code> + <code className="font-mono">Diagrama de clases nuevo.drawio</code>)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Todas las clases, atributos y métodos definidos en los diagramas de clases fueron llevados al estado y contexto de React (<code className="font-mono">src/context/CooperadoraContext.jsx</code>).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {CLASES_DIAGRAMA.map((cls, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-300 overflow-hidden bg-white shadow-sm flex flex-col"
                >
                  <div className="bg-slate-800 text-white px-3.5 py-2 font-mono font-bold text-xs text-center border-b border-slate-700">
                    {cls.clase}
                  </div>
                  <div className="p-3 border-b border-slate-200 bg-slate-50/60 flex-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Atributos:
                    </span>
                    <ul className="text-[11px] font-mono text-slate-700 space-y-0.5">
                      {cls.atributos.map((attr, i) => (
                        <li key={i}>• {attr}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 bg-blue-50/40">
                    <span className="text-[10px] font-bold uppercase text-blue-600 block mb-1">
                      Métodos Implementados:
                    </span>
                    <ul className="text-[11px] font-mono text-blue-900 font-semibold space-y-0.5">
                      {cls.metodos.map((m, i) => (
                        <li key={i}>+ {m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Diagrama Entidad-Relación (DER) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <h3 className="text-base font-black text-slate-800 mb-1 flex items-center gap-2">
              <i className="fa-solid fa-database text-emerald-600"></i>
              3. Modelo Entidad-Relación (<code className="font-mono">diagramaentidadrelacioncooperadora.drawio</code>)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Estructura relacional lista para que el compañero de Backend migre las tablas SQL con claves primarias (PK) y foráneas (FK).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {ENTIDADES_DER.map((ent, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-black text-emerald-900 text-sm">
                      TABLA: {ent.entidad}
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">
                      PK: {ent.pk}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-slate-600">
                    <strong>Atributos:</strong> {ent.atributos}
                  </p>
                  <p className="text-[11px] text-emerald-800 font-semibold mt-2">
                    <i className="fa-solid fa-link mr-1"></i>
                    {ent.relaciones}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 2: MÓDULOS 1 Y 2 (STAKEHOLDERS Y ENTREVISTA) */}
      {moduloActivo === 'mod1_2' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <h3 className="text-base font-black text-slate-800 mb-2">
              Módulo 1: Definición del Problema, Objetivos y Matriz Poder-Interés
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              En la E.E.S. N° 14, la gestión de la asociación cooperadora se realizaba mediante cuadernos y planillas manuales, dificultando verificar rápidamente qué alumnos tenían cuotas pendientes, calcular descuentos por hermanos y emitir reportes transparentes.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <th className="py-2.5 px-4">Stakeholder (Interesado)</th>
                    <th className="py-2.5 px-4">Descripción y Responsabilidad</th>
                    <th className="py-2.5 px-4">Nivel de Poder</th>
                    <th className="py-2.5 px-4">Nivel de Interés</th>
                    <th className="py-2.5 px-4">Estrategia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ESTUDIO_PROYECTO.stakeholders.map((st, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {st.actor}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {st.descripcion}
                      </td>
                      <td className="py-3 px-4 font-semibold">{st.poder}</td>
                      <td className="py-3 px-4 font-semibold">{st.interes}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold">
                          {st.estrategia}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <h3 className="text-base font-black text-slate-800 mb-1">
              Módulo 2: Relevamiento — Entrevista Semiestructurada (9 Preguntas Clave)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Hallazgos obtenidos durante la entrevista con Secretaría y Tesorería que dieron origen a las reglas de negocio.
            </p>

            <div className="space-y-3">
              {ESTUDIO_PROYECTO.preguntasEntrevista.map((item) => (
                <div
                  key={item.n}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                >
                  <p className="font-bold text-blue-900">
                    <i className="fa-solid fa-circle-question mr-1.5 text-blue-600"></i>
                    {item.n}. {item.pregunta}
                  </p>
                  <p className="text-slate-700 pl-5 italic">
                    "{item.hallazgo}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 3: MÓDULO 3 (RF, RNF Y BACKLOG DE HISTORIAS DE USUARIO) */}
      {moduloActivo === 'mod3' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
              <h3 className="text-base font-black text-slate-800 mb-3">
                Requisitos Funcionales (RF-01 a RF-10)
              </h3>
              <div className="space-y-2.5 text-xs">
                {ESTUDIO_PROYECTO.requisitosFuncionales.map((rf) => (
                  <div
                    key={rf.codigo}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-700 mr-2">
                        {rf.codigo} ({rf.titulo}):
                      </span>
                      <span className="text-slate-700">{rf.detalle}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0">
                      {rf.modulo}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
              <h3 className="text-base font-black text-slate-800 mb-3">
                Requisitos No Funcionales (RNF-01 a RNF-05)
              </h3>
              <div className="space-y-2.5 text-xs">
                {ESTUDIO_PROYECTO.requisitosNoFuncionales.map((rnf) => (
                  <div
                    key={rnf.codigo}
                    className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-indigo-900">
                        {rnf.codigo}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                        {rnf.categoria}
                      </span>
                    </div>
                    <p className="text-slate-700">{rnf.detalle}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <h3 className="text-base font-black text-slate-800 mb-3">
              Product Backlog — Historias de Usuario (HU-01 a HU-09)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {ESTUDIO_PROYECTO.historiasUsuario.map((hu) => (
                <div
                  key={hu.codigo}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-black text-blue-700">
                        {hu.codigo} • {hu.rol}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                        Prioridad {hu.prioridad}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 mb-1">
                      Quiero: {hu.quiero}
                    </p>
                    <p className="text-slate-600 mb-2">Para: {hu.para}</p>
                    <ul className="text-[11px] text-slate-500 space-y-0.5">
                      {hu.criterios.map((c, idx) => (
                        <li key={idx}>• {c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 4: MÓDULO 4 (MATRIZ FODA Y VIABILIDAD) */}
      {moduloActivo === 'mod4' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5">
            <h4 className="font-black text-emerald-900 text-sm uppercase mb-3 flex items-center gap-2">
              <i className="fa-solid fa-thumbs-up"></i> Fortalezas (Internas)
            </h4>
            <ul className="space-y-2 text-emerald-950">
              {ESTUDIO_PROYECTO.foda.fortalezas.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <i className="fa-solid fa-check text-emerald-600 mt-0.5"></i>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5">
            <h4 className="font-black text-blue-900 text-sm uppercase mb-3 flex items-center gap-2">
              <i className="fa-solid fa-lightbulb"></i> Oportunidades (Externas)
            </h4>
            <ul className="space-y-2 text-blue-950">
              {ESTUDIO_PROYECTO.foda.oportunidades.map((o, i) => (
                <li key={i} className="flex items-start gap-2">
                  <i className="fa-solid fa-arrow-trend-up text-blue-600 mt-0.5"></i>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5">
            <h4 className="font-black text-amber-900 text-sm uppercase mb-3 flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation"></i> Debilidades (Internas)
            </h4>
            <ul className="space-y-2 text-amber-950">
              {ESTUDIO_PROYECTO.foda.debilidades.map((d, i) => (
                <li key={i} className="flex items-start gap-2">
                  <i className="fa-solid fa-wrench text-amber-600 mt-0.5"></i>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5">
            <h4 className="font-black text-rose-900 text-sm uppercase mb-3 flex items-center gap-2">
              <i className="fa-solid fa-shield-virus"></i> Amenazas y Mitigación en el Sistema
            </h4>
            <ul className="space-y-2 text-rose-950">
              {ESTUDIO_PROYECTO.foda.amenazas.map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <i className="fa-solid fa-shield-halved text-rose-600 mt-0.5"></i>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* SECCIÓN 5: CONTRATO DE API REST PARA EL COMPAÑERO DE BACKEND */}
      {moduloActivo === 'backend_api' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Arquitectura Desacoplada Frontend / Backend
              </span>
              <h3 className="text-base font-black text-slate-800 mt-1">
                Especificación de Endpoints REST (<code className="font-mono text-blue-700">src/services/cooperadoraApi.js</code>)
              </h3>
              <p className="text-xs text-slate-500">
                Este Frontend React concentra toda su persistencia en el servicio <code className="font-mono">cooperadoraApi.js</code>. Tu compañero de Backend solo debe implementar estos endpoints y reemplazar las llamadas de <code className="font-mono">localStorage</code> por <code className="font-mono">fetch / axios</code>.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-mono uppercase">
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Ruta Endpoint REST</th>
                  <th className="py-3 px-4">Método UML / Descripción</th>
                  <th className="py-3 px-4">Roles Autorizados (RBAC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {API_ENDPOINTS_CONTRACT.map((ep, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          ep.method === 'GET'
                            ? 'bg-blue-100 text-blue-800'
                            : ep.method === 'POST'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ep.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {ep.path}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {ep.description}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {ep.roles}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
