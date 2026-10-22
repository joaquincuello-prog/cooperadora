import React, { useState } from 'react';
import { useCooperadora } from '../context/CooperadoraContext';

export default function PadronView() {
  const {
    state,
    getTutor,
    getStudentCuotas,
    getStudentSiblings,
    selectStudent,
    setActiveTab,
    registrarAlumno,
    guardarTutor,
    exportPadronCSV
  } = useCooperadora();

  const [subTab, setSubTab] = useState('alumnos'); // 'alumnos' | 'tutores'
  const [search, setSearch] = useState('');
  const [cursoFilter, setCursoFilter] = useState('todos');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [hermanoFilter, setHermanoFilter] = useState('todos');

  // Modal Nuevo Alumno
  const [isAlumnoModalOpen, setIsAlumnoModalOpen] = useState(false);
  const [aluNombre, setAluNombre] = useState('');
  const [aluApellido, setAluApellido] = useState('');
  const [aluDni, setAluDni] = useState('');
  const [aluCurso, setAluCurso] = useState('1° Año');
  const [aluDivision, setAluDivision] = useState('A');
  const [aluTurno, setAluTurno] = useState('Mañana');
  const [tutorMode, setTutorMode] = useState('existente');
  const [tutorExistenteId, setTutorExistenteId] = useState('tut-1');
  const [nuevoTutNombre, setNuevoTutNombre] = useState('');
  const [nuevoTutApellido, setNuevoTutApellido] = useState('');
  const [nuevoTutDni, setNuevoTutDni] = useState('');
  const [nuevoTutTel, setNuevoTutTel] = useState('');
  const [nuevoTutEmail, setNuevoTutEmail] = useState('');

  // Modal Crear / Editar Socio Tutor (Socio.actualizarDatos / Cooperadora.registrarSocio)
  const [isTutorModalOpen, setIsTutorModalOpen] = useState(false);
  const [editingTutor, setEditingTutor] = useState(null);

  const canOperate = state.role === 'secretaria' || state.role === 'tesorero';

  const filteredAlumnos = state.alumnos.filter((alu) => {
    const tutor = getTutor(alu.tutorId);
    const siblings = getStudentSiblings(alu.id);
    const cuotas = getStudentCuotas(alu.id);
    const vencidas = cuotas.filter((c) => c.estado === 'vencida').length;

    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      alu.apellido.toLowerCase().includes(q) ||
      alu.nombre.toLowerCase().includes(q) ||
      alu.dni.includes(q) ||
      (tutor &&
        (`${tutor.apellido} ${tutor.nombre}`.toLowerCase().includes(q) ||
          tutor.dni.includes(q)));

    const matchesCurso = cursoFilter === 'todos' || alu.curso === cursoFilter;
    const matchesEstado =
      estadoFilter === 'todos' ||
      (estadoFilter === 'aldia' && vencidas === 0) ||
      (estadoFilter === 'mora' && vencidas > 0);
    const matchesHermano =
      hermanoFilter === 'todos' ||
      (hermanoFilter === 'con_hermanos' && siblings.length > 0) ||
      (hermanoFilter === 'hijo_unico' && siblings.length === 0);

    return matchesSearch && matchesCurso && matchesEstado && matchesHermano;
  });

  const handleOpenNewTutor = () => {
    setEditingTutor({
      id: '',
      nombre: '',
      apellido: '',
      dni: '',
      telefono: '',
      email: '',
      estado: 'Activo'
    });
    setIsTutorModalOpen(true);
  };

  const handleOpenEditTutor = (tutor) => {
    setEditingTutor({ ...tutor });
    setIsTutorModalOpen(true);
  };

  const handleSaveTutor = (e) => {
    e.preventDefault();
    if (!editingTutor.nombre.trim() || !editingTutor.apellido.trim()) return;
    guardarTutor(editingTutor);
    setIsTutorModalOpen(false);
  };

  const handleCreateAlumno = (e) => {
    e.preventDefault();
    if (!aluNombre.trim() || !aluApellido.trim() || !aluDni.trim()) return;

    const creado = registrarAlumno({
      alumnoData: {
        nombre: aluNombre,
        apellido: aluApellido,
        dni: aluDni,
        curso: aluCurso,
        division: aluDivision,
        turno: aluTurno
      },
      tutorMode,
      tutorExistenteId,
      nuevoTutorData: {
        nombre: nuevoTutNombre,
        apellido: nuevoTutApellido,
        dni: nuevoTutDni,
        telefono: nuevoTutTel,
        email: nuevoTutEmail
      }
    });

    setIsAlumnoModalOpen(false);
    setAluNombre('');
    setAluApellido('');
    setAluDni('');
    if (creado) {
      selectStudent(creado.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Sub-navegación Alumnos / Socios Tutores */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-users-rectangle text-blue-600"></i>
            Padrón Institucional de Alumnos y Socios / Tutores (RF-01, RF-02)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión integral de legajos estudiantiles, grupos familiares con descuento automático del 20% y socios de la Cooperadora.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setSubTab('alumnos')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                subTab === 'alumnos'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-user-graduate mr-1.5"></i>
              Nómina de Alumnos ({state.alumnos.length})
            </button>
            <button
              onClick={() => setSubTab('tutores')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                subTab === 'tutores'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-people-roof mr-1.5"></i>
              Socios / Tutores ({state.tutores.length})
            </button>
          </div>

          <button
            onClick={exportPadronCSV}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5"
            title="Exportar planilla CSV compatible con Excel"
          >
            <i className="fa-solid fa-file-csv text-emerald-600"></i>
            Exportar CSV
          </button>

          {canOperate && (
            <>
              <button
                onClick={handleOpenNewTutor}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <i className="fa-solid fa-user-plus"></i>
                + Nuevo Socio/Tutor
              </button>
              <button
                onClick={() => setIsAlumnoModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <i className="fa-solid fa-graduation-cap"></i>
                + Matricular Alumno (HU-01)
              </button>
            </>
          )}
        </div>
      </div>

      {/* VISTA 1: NÓMINA DE ALUMNOS */}
      {subTab === 'alumnos' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          {/* Barra de Filtros */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <i className="fa-solid fa-search absolute left-3 top-2.5 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar alumno o tutor por DNI / Apellido..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
              />
            </div>

            <select
              value={cursoFilter}
              onChange={(e) => setCursoFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
            >
              <option value="todos">Todos los Cursos (1° a 6° Año)</option>
              <option value="1° Año">1° Año</option>
              <option value="2° Año">2° Año</option>
              <option value="3° Año">3° Año</option>
              <option value="4° Año">4° Año</option>
              <option value="5° Año">5° Año</option>
              <option value="6° Año">6° Año</option>
            </select>

            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
            >
              <option value="todos">Todos los Estados Financieros</option>
              <option value="aldia">Al Día (Sin cuotas vencidas)</option>
              <option value="mora">Con Cuotas Vencidas</option>
            </select>

            <select
              value={hermanoFilter}
              onChange={(e) => setHermanoFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
            >
              <option value="todos">Vínculo Familiar: Todos</option>
              <option value="con_hermanos">Con Hermanos (-20% Descuento RF-05)</option>
              <option value="hijo_unico">Sin Hermanos (Tarifa Plena)</option>
            </select>
          </div>

          {/* Tabla de Alumnos */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Alumno / DNI</th>
                  <th className="py-3 px-4">Curso y Turno</th>
                  <th className="py-3 px-4">Socio / Tutor Asociado</th>
                  <th className="py-3 px-4">Grupo Familiar (RF-05)</th>
                  <th className="py-3 px-4 text-center">Estado Cuotas</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAlumnos.map((alu) => {
                  const tutor = getTutor(alu.tutorId);
                  const siblings = getStudentSiblings(alu.id);
                  const cuotas = getStudentCuotas(alu.id);
                  const pagadas = cuotas.filter((c) => c.estado === 'pagada').length;
                  const vencidas = cuotas.filter((c) => c.estado === 'vencida').length;

                  return (
                    <tr key={alu.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {alu.apellido}, {alu.nombre}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          DNI {alu.dni} • ID: {alu.id}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block text-xs font-bold bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-md border border-blue-200">
                          {alu.curso} "{alu.division}"
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5">
                          Turno {alu.turno}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {tutor ? (
                          <div>
                            <div className="font-semibold text-slate-800 text-xs">
                              {tutor.apellido}, {tutor.nombre}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              DNI {tutor.dni} • Tel: {tutor.telefono}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Sin tutor</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {siblings.length > 0 ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              <i className="fa-solid fa-tags"></i> Bonificación -20%
                            </span>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Hno/a de: {siblings.map((s) => s.nombre).join(', ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Sin hermanos registrados
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 text-xs">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                            {pagadas}/{cuotas.length} pagas
                          </span>
                          {vencidas > 0 && (
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">
                              {vencidas} venc.
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            selectStudent(alu.id);
                            setActiveTab('recepcion');
                          }}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-sm"
                        >
                          <i className="fa-solid fa-cash-register mr-1"></i>
                          Ver Legajo / Cobrar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 2: PADRÓN DE SOCIOS / TUTORES (Diagrama de Clases: Socio) */}
      {subTab === 'tutores' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Padrón de Socios Activos (Clase <code className="font-mono text-blue-700">Socio</code> / <code className="font-mono text-blue-700">Tutor</code>)
              </h3>
              <p className="text-xs text-slate-500">
                Implementa los métodos <code className="font-mono">Cooperadora.registrarSocio()</code> y <code className="font-mono">Socio.actualizarDatos()</code> del Diagrama de Clases.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">ID Socio</th>
                  <th className="py-3 px-4">Apellido y Nombre</th>
                  <th className="py-3 px-4">Documento (DNI)</th>
                  <th className="py-3 px-4">Teléfono y Email</th>
                  <th className="py-3 px-4">Hijos Asociados</th>
                  <th className="py-3 px-4 text-center">Estado Socio</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {state.tutores.map((tut) => {
                  const hijos = state.alumnos.filter((a) => a.tutorId === tut.id);
                  return (
                    <tr key={tut.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        {tut.id}
                        <span className="block text-[10px] text-slate-400">
                          Alta: {tut.fechaAlta || '2026-03-01'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {tut.apellido}, {tut.nombre}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                        {tut.dni}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div>
                          <i className="fa-solid fa-phone mr-1 text-slate-400"></i>
                          {tut.telefono}
                        </div>
                        <div>
                          <i className="fa-solid fa-envelope mr-1 text-slate-400"></i>
                          {tut.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {hijos.map((h) => (
                            <span
                              key={h.id}
                              className="text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-semibold"
                            >
                              {h.nombre} ({h.curso})
                            </span>
                          ))}
                          {hijos.length >= 2 && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                              Grupo Familiar -20%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          {tut.estado || 'Activo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {canOperate && (
                          <button
                            onClick={() => handleOpenEditTutor(tut)}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg border border-slate-300 transition"
                          >
                            <i className="fa-solid fa-pen-to-square mr-1"></i>
                            Actualizar Datos
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL MATRICULAR NUEVO ALUMNO (HU-01, RF-01, RF-02) */}
      {isAlumnoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <i className="fa-solid fa-user-graduate text-emerald-400"></i>
                  Matricular Nuevo Alumno (HU-01 / RF-01)
                </h3>
                <p className="text-[11px] text-blue-200">
                  Genera automáticamente las 10 cuotas anuales y evalúa vínculo de hermanos (RF-05).
                </p>
              </div>
              <button
                onClick={() => setIsAlumnoModalOpen(false)}
                className="text-blue-200 hover:text-white"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleCreateAlumno} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Apellido Alumno *
                  </label>
                  <input
                    type="text"
                    required
                    value={aluApellido}
                    onChange={(e) => setAluApellido(e.target.value)}
                    placeholder="Ej: Gómez"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nombre Alumno *
                  </label>
                  <input
                    type="text"
                    required
                    value={aluNombre}
                    onChange={(e) => setAluNombre(e.target.value)}
                    placeholder="Ej: Julieta"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    DNI Alumno *
                  </label>
                  <input
                    type="text"
                    required
                    value={aluDni}
                    onChange={(e) => setAluDni(e.target.value)}
                    placeholder="Ej: 49112233"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Curso
                  </label>
                  <select
                    value={aluCurso}
                    onChange={(e) => setAluCurso(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  >
                    <option value="1° Año">1° Año</option>
                    <option value="2° Año">2° Año</option>
                    <option value="3° Año">3° Año</option>
                    <option value="4° Año">4° Año</option>
                    <option value="5° Año">5° Año</option>
                    <option value="6° Año">6° Año</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    División
                  </label>
                  <select
                    value={aluDivision}
                    onChange={(e) => setAluDivision(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  >
                    <option value="A">División A</option>
                    <option value="B">División B</option>
                    <option value="C">División C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Turno
                  </label>
                  <select
                    value={aluTurno}
                    onChange={(e) => setAluTurno(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  >
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                  </select>
                </div>
              </div>

              {/* Asociación de Padre / Tutor (RF-02) */}
              <div className="pt-3 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Vinculación Familiar con Socio / Tutor (RF-02 y RF-05)
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setTutorMode('existente')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      tutorMode === 'existente'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <i className="fa-solid fa-people-roof mr-1"></i>
                    Vincular a Tutor Existente (Activa -20% Hnos)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTutorMode('nuevo')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      tutorMode === 'nuevo'
                        ? 'bg-blue-50 border-blue-500 text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <i className="fa-solid fa-user-plus mr-1"></i>
                    Registrar Nuevo Padre/Tutor
                  </button>
                </div>

                {tutorMode === 'existente' ? (
                  <div>
                    <select
                      value={tutorExistenteId}
                      onChange={(e) => setTutorExistenteId(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl"
                    >
                      {state.tutores.map((t) => {
                        const cantHijos = state.alumnos.filter(
                          (a) => a.tutorId === t.id
                        ).length;
                        return (
                          <option key={t.id} value={t.id}>
                            {t.apellido}, {t.nombre} (DNI {t.dni}) — {cantHijos}{' '}
                            hijo(s) actual(es)
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-[11px] text-emerald-700 mt-1.5 font-medium">
                      <i className="fa-solid fa-circle-info mr-1"></i>
                      Al asociar este alumno a un tutor que ya tiene hijos en el colegio, el sistema activará automáticamente el 20% de descuento para ambos.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      required
                      value={nuevoTutApellido}
                      onChange={(e) => setNuevoTutApellido(e.target.value)}
                      placeholder="Apellido del Tutor *"
                      className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                    <input
                      type="text"
                      required
                      value={nuevoTutNombre}
                      onChange={(e) => setNuevoTutNombre(e.target.value)}
                      placeholder="Nombre del Tutor *"
                      className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                    <input
                      type="text"
                      required
                      value={nuevoTutDni}
                      onChange={(e) => setNuevoTutDni(e.target.value)}
                      placeholder="DNI del Tutor *"
                      className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                    />
                    <input
                      type="text"
                      value={nuevoTutTel}
                      onChange={(e) => setNuevoTutTel(e.target.value)}
                      placeholder="Teléfono (Ej: 11-5555-9999)"
                      className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                    <input
                      type="email"
                      value={nuevoTutEmail}
                      onChange={(e) => setNuevoTutEmail(e.target.value)}
                      placeholder="Email de contacto"
                      className="sm:col-span-2 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAlumnoModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
                >
                  Guardar Alumno y Generar Cuotas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR / ACTUALIZAR SOCIO TUTOR (Socio.actualizarDatos) */}
      {isTutorModalOpen && editingTutor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  {editingTutor.id
                    ? 'Actualizar Datos del Socio / Tutor'
                    : 'Registrar Nuevo Socio / Tutor'}
                </h3>
                <p className="text-[11px] text-slate-300">
                  Método: {editingTutor.id ? 'Socio.actualizarDatos()' : 'Cooperadora.registrarSocio()'}
                </p>
              </div>
              <button
                onClick={() => setIsTutorModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveTutor} className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTutor.apellido}
                    onChange={(e) =>
                      setEditingTutor({ ...editingTutor, apellido: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTutor.nombre}
                    onChange={(e) =>
                      setEditingTutor({ ...editingTutor, nombre: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Documento (DNI) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTutor.dni}
                    onChange={(e) =>
                      setEditingTutor({ ...editingTutor, dni: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={editingTutor.telefono}
                    onChange={(e) =>
                      setEditingTutor({ ...editingTutor, telefono: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={editingTutor.email}
                  onChange={(e) =>
                    setEditingTutor({ ...editingTutor, email: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTutorModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Guardar Socio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
