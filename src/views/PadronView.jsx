import React, { useState, useMemo, useEffect, useRef } from 'react';
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
    editarAlumno,
    cambiarTutorAlumno,
    solicitarBajaMatricula,
    aprobarBajaMatricula,
    guardarTutor,
    exportPadronCSV,
    showToast
  } = useCooperadora();

  // -------------------------------------------------------------
  // ESTADOS DE NAVEGACIÓN Y FILTRADO (AÑO, CURSO, DIVISIÓN Y DNI/NOMBRE)
  // -------------------------------------------------------------
  const [subTab, setSubTab] = useState('estudiantes'); // 'estudiantes' | 'tutores'
  const [search, setSearch] = useState('');
  const [anioFilter, setAnioFilter] = useState('todos');
  const [cursoFilter, setCursoFilter] = useState('todos');
  const [divisionFilter, setDivisionFilter] = useState('todos');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [hermanoFilter, setHermanoFilter] = useState('todos');

  // Filtros de búsqueda en Padrón de Tutores (por DNI/Nombre y por Año, Curso y División de sus hijos)
  const [tutorSearch, setTutorSearch] = useState('');
  const [tutorAnioFilter, setTutorAnioFilter] = useState('todos');
  const [tutorCursoFilter, setTutorCursoFilter] = useState('todos');
  const [tutorDivisionFilter, setTutorDivisionFilter] = useState('todos');

  // -------------------------------------------------------------
  // ESTADOS DE PAGINACIÓN (ESTUDIANTES)
  // -------------------------------------------------------------
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reiniciar a la primera página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [search, anioFilter, cursoFilter, divisionFilter, estadoFilter, hermanoFilter, subTab]);

  // -------------------------------------------------------------
  // ESTADOS DE SELECCIÓN MÚLTIPLE (ACCIONES EN LOTE)
  // -------------------------------------------------------------
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Menú contextual desplegable por fila (Dropdown de acciones)
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // -------------------------------------------------------------
  // ESTADOS PARA MODALES
  // -------------------------------------------------------------
  // 1. Modal Matricular Nuevo Estudiante
  const [isMatricularModalOpen, setIsMatricularModalOpen] = useState(false);
  const [aluNombre, setAluNombre] = useState('');
  const [aluApellido, setAluApellido] = useState('');
  const [aluDni, setAluDni] = useState('');
  const [aluAnioLectivo, setAluAnioLectivo] = useState('2026');
  const [aluCurso, setAluCurso] = useState('1° Año');
  const [aluDivision, setAluDivision] = useState('A');
  const [aluTurno, setAluTurno] = useState('Mañana');
  const [tutorMode, setTutorMode] = useState('existente');
  const [tutorExistenteId, setTutorExistenteId] = useState(state.tutores[0]?.id || 'tut-1');
  const [tutorExistenteSearch, setTutorExistenteSearch] = useState('');
  const [nuevoTutNombre, setNuevoTutNombre] = useState('');
  const [nuevoTutApellido, setNuevoTutApellido] = useState('');
  const [nuevoTutDni, setNuevoTutDni] = useState('');
  const [nuevoTutTel, setNuevoTutTel] = useState('');
  const [nuevoTutEmail, setNuevoTutEmail] = useState('');
  const [matricularError, setMatricularError] = useState('');

  // 2. Modal Nuevo / Editar Socio Tutor
  const [isTutorModalOpen, setIsTutorModalOpen] = useState(false);
  const [editingTutor, setEditingTutor] = useState(null);
  const [tutorFormError, setTutorFormError] = useState('');

  // 3. Modal Solicitar Baja de Matrícula
  const [isBajaModalOpen, setIsBajaModalOpen] = useState(false);
  const [targetStudentForBaja, setTargetStudentForBaja] = useState(null);
  const [motivoBaja, setMotivoBaja] = useState('Pase a otra institución');
  const [observacionesBaja, setObservacionesBaja] = useState('');
  const [docAdjuntaBaja, setDocAdjuntaBaja] = useState('');
  const [confirmBajaCheck, setConfirmBajaCheck] = useState(false);
  const [resolucionDeudaAdmin, setResolucionDeudaAdmin] = useState('condonar');

  // 4. Modal Ver Legajo Completo
  const [isLegajoModalOpen, setIsLegajoModalOpen] = useState(false);
  const [targetStudentForLegajo, setTargetStudentForLegajo] = useState(null);

  // 5. Modal Editar Datos del Estudiante
  const [isEditarAlumnoModalOpen, setIsEditarAlumnoModalOpen] = useState(false);
  const [editingAlumnoData, setEditingAlumnoData] = useState(null);

  // 6. Modal Gestionar Vínculo Familiar
  const [isVinculoModalOpen, setIsVinculoModalOpen] = useState(false);
  const [targetStudentForVinculo, setTargetStudentForVinculo] = useState(null);
  const [selectedNuevoTutorId, setSelectedNuevoTutorId] = useState('');
  const [vinculoTutorSearch, setVinculoTutorSearch] = useState('');

  // 7. Modal Constancias en Lote
  const [isConstanciaBatchModalOpen, setIsConstanciaBatchModalOpen] = useState(false);

  // Permisos según Rol RBAC
  const canOperate = state.role === 'secretaria' || state.role === 'admin' || state.role === 'tesorero';
  const isAdminOrDirector = state.role === 'admin' || state.role === 'director';

  // -------------------------------------------------------------
  // FILTRADO Y PROCESAMIENTO DE ESTUDIANTES
  // -------------------------------------------------------------
  const filteredAlumnos = useMemo(() => {
    return state.alumnos.filter((alu) => {
      const tutor = getTutor(alu.tutorId);
      const siblings = getStudentSiblings(alu.id);
      const cuotas = getStudentCuotas(alu.id);
      const vencidas = cuotas.filter((c) => c.estado === 'vencida').length;
      const estadoMatricula = alu.estado_matricula || 'Regular';
      const anioAlu = String(alu.anioLectivo || '2026');

      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        alu.apellido.toLowerCase().includes(q) ||
        alu.nombre.toLowerCase().includes(q) ||
        alu.dni.replace(/\./g, '').includes(q.replace(/\./g, '')) ||
        (tutor &&
          (`${tutor.apellido} ${tutor.nombre}`.toLowerCase().includes(q) ||
            tutor.dni.replace(/\./g, '').includes(q.replace(/\./g, ''))));

      const matchesAnio = anioFilter === 'todos' || anioAlu === anioFilter;
      const matchesCurso = cursoFilter === 'todos' || alu.curso === cursoFilter;
      const matchesDivision = divisionFilter === 'todos' || alu.division === divisionFilter;

      let matchesEstado = true;
      if (estadoFilter === 'aldia') {
        matchesEstado = vencidas === 0 && estadoMatricula !== 'Baja';
      } else if (estadoFilter === 'mora') {
        matchesEstado = vencidas > 0;
      } else if (estadoFilter === 'baja_pendiente') {
        matchesEstado = estadoMatricula === 'BAJA_PENDIENTE_APROBACION';
      } else if (estadoFilter === 'baja_efectiva') {
        matchesEstado = estadoMatricula === 'Baja';
      }

      const matchesHermano =
        hermanoFilter === 'todos' ||
        (hermanoFilter === 'con_hermanos' && siblings.length > 0) ||
        (hermanoFilter === 'hijo_unico' && siblings.length === 0);

      return (
        matchesSearch &&
        matchesAnio &&
        matchesCurso &&
        matchesDivision &&
        matchesEstado &&
        matchesHermano
      );
    });
  }, [
    state.alumnos,
    state.tutores,
    state.cuotas,
    search,
    anioFilter,
    cursoFilter,
    divisionFilter,
    estadoFilter,
    hermanoFilter
  ]);

  // Paginación de Estudiantes
  const totalRecords = filteredAlumnos.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedAlumnos = useMemo(() => {
    return filteredAlumnos.slice(startIndex, endIndex);
  }, [filteredAlumnos, startIndex, endIndex]);

  // -------------------------------------------------------------
  // FILTRADO DE TUTORES / SOCIOS (POR NOMBRE/DNI Y POR AÑO, CURSO Y DIVISIÓN DE HIJOS)
  // -------------------------------------------------------------
  const filteredTutores = useMemo(() => {
    const q = tutorSearch.trim().toLowerCase();
    return state.tutores.filter((tut) => {
      const hijos = state.alumnos.filter((a) => a.tutorId === tut.id);

      const matchesText =
        !q ||
        tut.apellido.toLowerCase().includes(q) ||
        tut.nombre.toLowerCase().includes(q) ||
        `${tut.apellido} ${tut.nombre}`.toLowerCase().includes(q) ||
        `${tut.nombre} ${tut.apellido}`.toLowerCase().includes(q) ||
        tut.dni.replace(/\./g, '').includes(q.replace(/\./g, '')) ||
        (tut.telefono && tut.telefono.toLowerCase().includes(q)) ||
        (tut.email && tut.email.toLowerCase().includes(q)) ||
        hijos.some(
          (h) =>
            h.nombre.toLowerCase().includes(q) ||
            h.apellido.toLowerCase().includes(q) ||
            h.dni.replace(/\./g, '').includes(q.replace(/\./g, ''))
        );

      const hasAcademicFilter =
        tutorAnioFilter !== 'todos' ||
        tutorCursoFilter !== 'todos' ||
        tutorDivisionFilter !== 'todos';

      const matchesAcademic =
        !hasAcademicFilter ||
        hijos.some((h) => {
          const matchAnio =
            tutorAnioFilter === 'todos' || String(h.anioLectivo || '2026') === tutorAnioFilter;
          const matchCurso = tutorCursoFilter === 'todos' || h.curso === tutorCursoFilter;
          const matchDiv = tutorDivisionFilter === 'todos' || h.division === tutorDivisionFilter;
          return matchAnio && matchCurso && matchDiv;
        });

      return matchesText && matchesAcademic;
    });
  }, [
    state.tutores,
    state.alumnos,
    tutorSearch,
    tutorAnioFilter,
    tutorCursoFilter,
    tutorDivisionFilter
  ]);

  // Buscador de tutores existentes para el modal de Matricular Estudiante
  const matchingTutoresParaMatricula = useMemo(() => {
    const q = tutorExistenteSearch.trim().toLowerCase();
    const cleanQ = q.replace(/[.\-\s]/g, '');
    if (!q) return state.tutores;
    return state.tutores.filter((t) => {
      const full1 = `${t.apellido} ${t.nombre}`.toLowerCase();
      const full2 = `${t.nombre} ${t.apellido}`.toLowerCase();
      const cleanDni = String(t.dni || '').replace(/[.\-\s]/g, '').toLowerCase();
      return (
        full1.includes(q) ||
        full2.includes(q) ||
        (cleanQ && cleanDni.includes(cleanQ))
      );
    });
  }, [state.tutores, tutorExistenteSearch]);

  // Buscador de tutores existentes para el modal de Gestionar Vínculo Familiar
  const matchingTutoresParaVinculo = useMemo(() => {
    const q = vinculoTutorSearch.trim().toLowerCase();
    const cleanQ = q.replace(/[.\-\s]/g, '');
    if (!q) return state.tutores;
    return state.tutores.filter((t) => {
      const full1 = `${t.apellido} ${t.nombre}`.toLowerCase();
      const full2 = `${t.nombre} ${t.apellido}`.toLowerCase();
      const cleanDni = String(t.dni || '').replace(/[.\-\s]/g, '').toLowerCase();
      return (
        full1.includes(q) ||
        full2.includes(q) ||
        (cleanQ && cleanDni.includes(cleanQ))
      );
    });
  }, [state.tutores, vinculoTutorSearch]);

  // -------------------------------------------------------------
  // MANEJADORES DE SELECCIÓN MÚLTIPLE
  // -------------------------------------------------------------
  const isAllCurrentPageSelected =
    paginatedAlumnos.length > 0 &&
    paginatedAlumnos.every((alu) => selectedStudentIds.includes(alu.id));

  const handleToggleSelectAll = () => {
    if (isAllCurrentPageSelected) {
      const pageIds = paginatedAlumnos.map((a) => a.id);
      setSelectedStudentIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedAlumnos.map((a) => a.id);
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleStudent = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedStudentIds([]);
  };

  // Exportar solo los estudiantes seleccionados a CSV
  const handleExportSelectedCSV = () => {
    if (selectedStudentIds.length === 0) return;
    const alumnosAExportar = state.alumnos.filter((a) =>
      selectedStudentIds.includes(a.id)
    );

    const headers = [
      'ID Estudiante',
      'Apellido',
      'Nombre',
      'DNI',
      'Curso',
      'División',
      'Turno',
      'Estado Matrícula',
      'Tutor / Socio',
      'DNI Tutor',
      'Teléfono Tutor',
      'Hermanos Matriculados',
      'Cuotas Pagadas',
      'Cuotas Pendientes'
    ];

    const rows = alumnosAExportar.map((alu) => {
      const tutor = getTutor(alu.tutorId);
      const siblings = getStudentSiblings(alu.id);
      const cuotas = getStudentCuotas(alu.id);
      const pagadas = cuotas.filter((c) => c.estado === 'pagada').length;
      const pendientes = cuotas.filter((c) => c.estado !== 'pagada').length;

      return [
        alu.id,
        `"${alu.apellido}"`,
        `"${alu.nombre}"`,
        alu.dni,
        `"${alu.curso}"`,
        alu.division,
        `"${alu.turno}"`,
        `"${alu.estado_matricula || 'Regular'}"`,
        `"${tutor ? `${tutor.apellido}, ${tutor.nombre}` : 'Sin tutor'}"`,
        tutor ? tutor.dni : '-',
        tutor ? tutor.telefono : '-',
        siblings.length,
        pagadas,
        pendientes
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `padron_seleccionados_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Se exportaron ${alumnosAExportar.length} estudiantes seleccionados en CSV.`, 'success');
  };

  // -------------------------------------------------------------
  // GESTIÓN DE MODALES
  // -------------------------------------------------------------
  const handleOpenNewTutor = () => {
    setTutorFormError('');
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
    setTutorFormError('');
    setEditingTutor({
      ...tutor,
      telefono: tutor.telefono === 'S/D' ? '' : tutor.telefono || '',
      email: tutor.email === 'S/D' ? '' : tutor.email || ''
    });
    setIsTutorModalOpen(true);
  };

  const handleSaveTutor = (e) => {
    e.preventDefault();
    setTutorFormError('');
    const nombreClean = (editingTutor.nombre || '').trim();
    const apellidoClean = (editingTutor.apellido || '').trim();
    const dniClean = (editingTutor.dni || '').trim();
    const telClean = (editingTutor.telefono || '').trim();
    const emailClean = (editingTutor.email || '').trim();

    if (!nombreClean || !apellidoClean || !dniClean || !telClean || !emailClean) {
      setTutorFormError(
        'Todos los campos son obligatorios antes de confirmar: Nombre, Apellido, DNI, Número de Teléfono y Correo Electrónico (Gmail).'
      );
      return;
    }

    if (!emailClean.includes('@') || !emailClean.includes('.')) {
      setTutorFormError('Por favor ingrese un correo electrónico (Gmail) válido.');
      return;
    }

    const ok = guardarTutor({
      ...editingTutor,
      nombre: nombreClean,
      apellido: apellidoClean,
      dni: dniClean,
      telefono: telClean,
      email: emailClean
    });
    if (ok !== false) {
      setIsTutorModalOpen(false);
    }
  };

  const handleCreateAlumno = (e) => {
    e.preventDefault();
    setMatricularError('');
    if (!aluNombre.trim() || !aluApellido.trim() || !aluDni.trim()) {
      setMatricularError('Complete Nombre, Apellido y DNI del estudiante.');
      return;
    }

    if (tutorMode === 'existente') {
      if (!tutorExistenteId) {
        setMatricularError('Debe buscar y seleccionar un tutor existente de la lista.');
        return;
      }
    } else {
      if (
        !nuevoTutNombre.trim() ||
        !nuevoTutApellido.trim() ||
        !nuevoTutDni.trim() ||
        !nuevoTutTel.trim() ||
        !nuevoTutEmail.trim()
      ) {
        setMatricularError(
          'Para registrar un nuevo tutor, todas las celdas son obligatorias: Nombre, Apellido, DNI, Teléfono y Gmail.'
        );
        return;
      }
      if (!nuevoTutEmail.trim().includes('@') || !nuevoTutEmail.trim().includes('.')) {
        setMatricularError('Ingrese un correo electrónico (Gmail) válido para el nuevo tutor.');
        return;
      }
    }

    const creado = registrarAlumno({
      alumnoData: {
        nombre: aluNombre,
        apellido: aluApellido,
        dni: aluDni,
        anioLectivo: aluAnioLectivo,
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

    if (!creado) return;

    setIsMatricularModalOpen(false);
    setAluNombre('');
    setAluApellido('');
    setAluDni('');
    setTutorExistenteSearch('');
    setNuevoTutNombre('');
    setNuevoTutApellido('');
    setNuevoTutDni('');
    setNuevoTutTel('');
    setNuevoTutEmail('');
    setMatricularError('');
    selectStudent(creado.id);
  };

  // Abrir Modal de Solicitud de Baja
  const handleOpenBajaModal = (alu) => {
    setTargetStudentForBaja(alu);
    setMotivoBaja('Pase a otra institución');
    setObservacionesBaja('');
    setDocAdjuntaBaja('');
    setConfirmBajaCheck(false);
    setResolucionDeudaAdmin('condonar');
    setOpenDropdownId(null);
    setIsBajaModalOpen(true);
  };

  // Ejecutar Solicitud de Baja (Secretaría / Admin)
  const handleSubmitSolicitudBaja = (e) => {
    e.preventDefault();
    if (!targetStudentForBaja) return;
    if (!confirmBajaCheck) {
      showToast('Debe marcar la casilla de confirmación para proceder con el trámite.', 'warning');
      return;
    }

    solicitarBajaMatricula({
      studentId: targetStudentForBaja.id,
      motivo: motivoBaja,
      observaciones: observacionesBaja,
      documentacionAdjunta: docAdjuntaBaja
    });

    setIsBajaModalOpen(false);
    setTargetStudentForBaja(null);
  };

  // Ejecutar Aprobación Definitiva de Baja (Dirección / Admin)
  const handleAprobarBajaDirecta = () => {
    if (!targetStudentForBaja) return;
    aprobarBajaMatricula({
      studentId: targetStudentForBaja.id,
      resolucionDeuda: resolucionDeudaAdmin,
      observaciones: observacionesBaja
    });
    setIsBajaModalOpen(false);
    setTargetStudentForBaja(null);
  };

  // Abrir Modal Ver Legajo Completo
  const handleOpenLegajoModal = (alu) => {
    setTargetStudentForLegajo(alu);
    setOpenDropdownId(null);
    setIsLegajoModalOpen(true);
  };

  // Abrir Modal Editar Datos Alumno
  const handleOpenEditarAlumno = (alu) => {
    setEditingAlumnoData({
      id: alu.id,
      nombre: alu.nombre,
      apellido: alu.apellido,
      dni: alu.dni,
      anioLectivo: alu.anioLectivo || '2026',
      curso: alu.curso,
      division: alu.division,
      turno: alu.turno
    });
    setOpenDropdownId(null);
    setIsEditarAlumnoModalOpen(true);
  };

  const handleSaveEditarAlumno = (e) => {
    e.preventDefault();
    if (!editingAlumnoData) return;
    editarAlumno({
      studentId: editingAlumnoData.id,
      alumnoData: editingAlumnoData
    });
    setIsEditarAlumnoModalOpen(false);
    setEditingAlumnoData(null);
  };

  // Abrir Modal Gestionar Vínculo Familiar
  const handleOpenVinculoModal = (alu) => {
    setTargetStudentForVinculo(alu);
    setSelectedNuevoTutorId(alu.tutorId);
    setVinculoTutorSearch('');
    setOpenDropdownId(null);
    setIsVinculoModalOpen(true);
  };

  const handleSaveVinculoModal = (e) => {
    e.preventDefault();
    if (!targetStudentForVinculo || !selectedNuevoTutorId) return;
    cambiarTutorAlumno({
      studentId: targetStudentForVinculo.id,
      nuevoTutorId: selectedNuevoTutorId
    });
    setIsVinculoModalOpen(false);
    setTargetStudentForVinculo(null);
  };

  return (
    <div className="space-y-6">
      {/* =========================================================
          CABECERA INSTITUCIONAL Y ACCIONES PRINCIPALES
         ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/90 dark:border-slate-800 p-5 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-xl">
                <i className="fa-solid fa-users-rectangle text-lg"></i>
              </span>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Padrón Institucional de Estudiantes y Tutores
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Gestión de legajos, grupos familiares con bonificación y padrón de la Cooperadora Escolar.
                </p>
              </div>
            </div>
          </div>

          {/* Botones de Acción Principal alineados a la derecha */}
          <div className="flex flex-wrap items-center gap-2.5 justify-start lg:justify-end">
            <button
              onClick={exportPadronCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700 text-xs font-bold transition flex items-center gap-2 shadow-2xs"
              title="Exportar nómina completa en formato CSV para Excel"
            >
              <i className="fa-solid fa-file-csv text-emerald-600 dark:text-emerald-400 text-sm"></i>
              <span>Exportar CSV</span>
            </button>

            {canOperate && (
              <>
                <button
                  onClick={handleOpenNewTutor}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
                >
                  <i className="fa-solid fa-user-plus text-slate-300"></i>
                  <span>+ Nuevo Tutor</span>
                </button>

                <button
                  onClick={() => setIsMatricularModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
                >
                  <i className="fa-solid fa-graduation-cap"></i>
                  <span>+ Matricular Estudiante</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Control Segmentado / Tabs Secundarios */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setSubTab('estudiantes')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                subTab === 'estudiantes'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <i className="fa-solid fa-user-graduate"></i>
              <span>Estudiantes ({state.alumnos.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('tutores')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                subTab === 'tutores'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <i className="fa-solid fa-people-roof"></i>
              <span>Tutores / Socios ({state.tutores.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Ciclo Lectivo 2026 • Cuota Base: ${state.cooperadora?.cuotaBase?.toLocaleString('es-AR') || '5.000'}</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          VISTA 1: NÓMINA DE ESTUDIANTES
         ========================================================= */}
      {subTab === 'estudiantes' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/90 dark:border-slate-800 overflow-hidden transition-colors">
          {/* Contenedor Coherente y Responsive de Filtros por Año, Curso, División y Búsqueda */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <i className="fa-solid fa-filter text-blue-600 dark:text-blue-400"></i>
                <span>Filtrar Alumnos por Año, Curso y División (o buscar por Nombre / DNI)</span>
              </div>
              {(anioFilter !== 'todos' ||
                cursoFilter !== 'todos' ||
                divisionFilter !== 'todos' ||
                estadoFilter !== 'todos' ||
                hermanoFilter !== 'todos' ||
                search) && (
                <button
                  type="button"
                  onClick={() => {
                    setAnioFilter('todos');
                    setCursoFilter('todos');
                    setDivisionFilter('todos');
                    setEstadoFilter('todos');
                    setHermanoFilter('todos');
                    setSearch('');
                  }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <i className="fa-solid fa-rotate-left"></i>
                  <span>Restablecer todos los filtros</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
              {/* 1. Selector de Año Lectivo */}
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Año Lectivo
                </label>
                <select
                  value={anioFilter}
                  onChange={(e) => setAnioFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="todos">Todos los Años</option>
                  <option value="2026">Año 2026</option>
                  <option value="2025">Año 2025</option>
                  <option value="2024">Año 2024</option>
                </select>
              </div>

              {/* 2. Selector de Curso (1° a 6° Año) */}
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Curso
                </label>
                <select
                  value={cursoFilter}
                  onChange={(e) => setCursoFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="todos">Todos los Cursos</option>
                  <option value="1° Año">1° Año</option>
                  <option value="2° Año">2° Año</option>
                  <option value="3° Año">3° Año</option>
                  <option value="4° Año">4° Año</option>
                  <option value="5° Año">5° Año</option>
                  <option value="6° Año">6° Año</option>
                </select>
              </div>

              {/* 3. Selector de División (A, B, C) */}
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  División
                </label>
                <select
                  value={divisionFilter}
                  onChange={(e) => setDivisionFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="todos">Todas las Div.</option>
                  <option value="A">División "A"</option>
                  <option value="B">División "B"</option>
                  <option value="C">División "C"</option>
                </select>
              </div>

              {/* 4. Selector Estado Financiero / Matrícula */}
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Estado Cuotas
                </label>
                <select
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="todos">Todos</option>
                  <option value="aldia">Al Día</option>
                  <option value="mora">En Mora</option>
                  <option value="baja_pendiente">Baja Pendiente</option>
                  <option value="baja_efectiva">Baja Efectiva</option>
                </select>
              </div>

              {/* 5. Selector Vínculo Familiar */}
              <div className="lg:col-span-1">
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Grupo Fam.
                </label>
                <select
                  value={hermanoFilter}
                  onChange={(e) => setHermanoFilter(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="todos">Todos</option>
                  <option value="con_hermanos">C/ Hnos (-20%)</option>
                  <option value="hijo_unico">Sin Hnos</option>
                </select>
              </div>

              {/* 6. Barra de Búsqueda Opcional por Nombre / Apellido / DNI / Tutor */}
              <div className="lg:col-span-3">
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Búsqueda por Nombre, Apellido o DNI
                </label>
                <div className="relative">
                  <i className="fa-solid fa-search absolute left-3.5 top-2.5 text-slate-400 text-xs"></i>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Nombre, Apellido o DNI..."
                    className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                      title="Limpiar búsqueda"
                    >
                      <i className="fa-solid fa-circle-xmark"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Barra contextual de acciones en lote si hay selección múltiple */}
            {selectedStudentIds.length > 0 && (
              <div className="mt-3 p-2.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between flex-wrap gap-2 animate-fadeIn">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                    {selectedStudentIds.length}
                  </span>
                  <span>estudiante(s) seleccionado(s)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportSelectedCSV}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <i className="fa-solid fa-download"></i>
                    Exportar Seleccionados (CSV)
                  </button>

                  <button
                    onClick={() => setIsConstanciaBatchModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <i className="fa-solid fa-file-invoice"></i>
                    Emitir Constancias en Lote
                  </button>

                  <button
                    onClick={handleClearSelection}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 text-xs font-medium transition"
                  >
                    Deseleccionar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tabla de Estudiantes */}
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-850/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 select-none">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllCurrentPageSelected}
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      title="Seleccionar todos los de esta página"
                    />
                  </th>
                  <th className="py-3 px-4">Estudiante / Legajo</th>
                  <th className="py-3 px-4">Curso y Turno</th>
                  <th className="py-3 px-4">Socio / Tutor Asociado</th>
                  <th className="py-3 px-4">Grupo Familiar</th>
                  <th className="py-3 px-4 text-center">Estado de Cuotas</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {paginatedAlumnos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <i className="fa-solid fa-user-slash text-3xl mb-2 block text-slate-300 dark:text-slate-600"></i>
                      No se encontraron estudiantes que coincidan con los criterios de búsqueda y filtros.
                    </td>
                  </tr>
                ) : (
                  paginatedAlumnos.map((alu) => {
                    const tutor = getTutor(alu.tutorId);
                    const siblings = getStudentSiblings(alu.id);
                    const cuotas = getStudentCuotas(alu.id);
                    const pagadas = cuotas.filter((c) => c.estado === 'pagada').length;
                    const vencidas = cuotas.filter((c) => c.estado === 'vencida').length;
                    const isSelected = selectedStudentIds.includes(alu.id);
                    const estadoMatricula = alu.estado_matricula || 'Regular';

                    return (
                      <tr
                        key={alu.id}
                        className={`transition ${
                          isSelected
                            ? 'bg-blue-50/50 dark:bg-blue-950/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {/* Checkbox de fila */}
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleStudent(alu.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                        </td>

                        {/* Estudiante / DNI */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-100">
                              {alu.apellido}, {alu.nombre}
                            </span>
                            {/* Badges de estado de matrícula */}
                            {estadoMatricula === 'BAJA_PENDIENTE_APROBACION' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                Baja Pendiente
                              </span>
                            )}
                            {estadoMatricula === 'Baja' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                Baja Efectivizada
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            DNI {alu.dni} • Legajo: {alu.id}
                          </div>
                        </td>

                        {/* Curso y Turno */}
                        <td className="py-3.5 px-4">
                          <span className="inline-block text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                            {alu.curso} "{alu.division}"
                          </span>
                          <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Turno {alu.turno}
                          </span>
                        </td>

                        {/* Tutor Asociado */}
                        <td className="py-3.5 px-4">
                          {tutor ? (
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                {tutor.apellido}, {tutor.nombre}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                DNI {tutor.dni} • Tel: {tutor.telefono || 'S/D'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Sin tutor registrado</span>
                          )}
                        </td>

                        {/* Grupo Familiar */}
                        <td className="py-3.5 px-4">
                          {siblings.length > 0 ? (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                <i className="fa-solid fa-tags text-[10px]"></i>
                                Bonificación 20%
                              </span>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Hno/a de: {siblings.map((s) => s.nombre).join(', ')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Sin hermanos registrados</span>
                          )}
                        </td>

                        {/* Estado Cuotas */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 text-xs">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                              {pagadas}/{cuotas.length} al día
                            </span>
                            {vencidas > 0 && (
                              <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
                                {vencidas} vencidas
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Columna de Acciones Optimizada: Botón Cobrar + Menú Contextual Dropdown */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 relative">
                            {/* Botón Cobrar directo estilizado */}
                            <button
                              type="button"
                              onClick={() => {
                                selectStudent(alu.id);
                                setActiveTab('recepcion');
                              }}
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-2xs flex items-center gap-1"
                              title="Acceso directo a Recepción y Cobranzas"
                            >
                              <i className="fa-solid fa-cash-register text-[11px]"></i>
                              <span>Cobrar</span>
                            </button>

                            {/* Botón ⋮ (Tres puntos) para desplegar menú contextual */}
                            <button
                              type="button"
                              onClick={() =>
                                setOpenDropdownId(openDropdownId === alu.id ? null : alu.id)
                              }
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition ${
                                openDropdownId === alu.id
                                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                                  : 'bg-slate-100 dark:bg-slate-800'
                              }`}
                              title="Más acciones del legajo"
                            >
                              <i className="fa-solid fa-ellipsis-vertical text-sm"></i>
                            </button>

                            {/* Dropdown flotante */}
                            {openDropdownId === alu.id && (
                              <div
                                ref={dropdownRef}
                                className="absolute right-0 top-10 z-30 w-56 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 text-xs text-left animate-in fade-in zoom-in-95 duration-100"
                              >
                                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                                  Gestión del Legajo
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleOpenLegajoModal(alu)}
                                  className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium transition"
                                >
                                  <i className="fa-solid fa-id-card text-blue-600 dark:text-blue-400 w-4"></i>
                                  <span>Ver Legajo Completo</span>
                                </button>

                                {canOperate && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditarAlumno(alu)}
                                      className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium transition"
                                    >
                                      <i className="fa-solid fa-user-pen text-slate-500 w-4"></i>
                                      <span>Editar Datos</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenVinculoModal(alu)}
                                      className="w-full px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium transition"
                                    >
                                      <i className="fa-solid fa-people-arrows text-indigo-600 dark:text-indigo-400 w-4"></i>
                                      <span>Gestionar Vínculo Familiar</span>
                                    </button>

                                    <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenBajaModal(alu)}
                                      className="w-full px-3.5 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 font-bold transition"
                                    >
                                      <i className="fa-solid fa-user-xmark w-4"></i>
                                      <span>Solicitar Baja de Matrícula</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* =========================================================
              CONTROLES DE PAGINACIÓN AL PIE DE LA TABLA
             ========================================================= */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
            {/* Indicador de Registros Mostrados */}
            <div className="flex items-center gap-3">
              <span>
                Mostrando{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {totalRecords === 0 ? 0 : startIndex + 1}
                </strong>
                -
                <strong className="text-slate-800 dark:text-slate-200">
                  {endIndex}
                </strong>{' '}
                de <strong className="text-slate-800 dark:text-slate-200">{totalRecords}</strong> registros
              </span>

              {/* Selector de Ítems por Página */}
              <div className="flex items-center gap-1.5 ml-2">
                <span>Por pág:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Botones de Navegación de Página */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Primera página"
              >
                <i className="fa-solid fa-angles-left text-xs"></i>
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Página anterior"
              >
                <i className="fa-solid fa-angle-left text-xs"></i>
              </button>

              {/* Números de página interactivos */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((pageNum, idx, arr) => {
                  const showEllipsisBefore = idx > 0 && pageNum - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={pageNum}>
                      {showEllipsisBefore && <span className="px-1 text-slate-400">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Página siguiente"
              >
                <i className="fa-solid fa-angle-right text-xs"></i>
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Última página"
              >
                <i className="fa-solid fa-angles-right text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          VISTA 2: PADRÓN DE SOCIOS / TUTORES
         ========================================================= */}
      {subTab === 'tutores' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/90 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="p-4 bg-slate-50/80 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <i className="fa-solid fa-people-roof text-blue-600 dark:text-blue-400"></i>
                  Padrón Oficial de Socios y Tutores
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Filtre tutores por Año, Curso y División de sus hijos o busque por Nombre y Documento (DNI).
                </p>
              </div>

              {(tutorAnioFilter !== 'todos' ||
                tutorCursoFilter !== 'todos' ||
                tutorDivisionFilter !== 'todos' ||
                tutorSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setTutorAnioFilter('todos');
                    setTutorCursoFilter('todos');
                    setTutorDivisionFilter('todos');
                    setTutorSearch('');
                  }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <i className="fa-solid fa-rotate-left"></i>
                  <span>Limpiar filtros de tutores</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Año Lectivo Hijo/a
                </label>
                <select
                  value={tutorAnioFilter}
                  onChange={(e) => setTutorAnioFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold"
                >
                  <option value="todos">Todos los Años</option>
                  <option value="2026">Año 2026</option>
                  <option value="2025">Año 2025</option>
                  <option value="2024">Año 2024</option>
                </select>
              </div>

              <div className="lg:col-span-3">
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Curso del Hijo/a
                </label>
                <select
                  value={tutorCursoFilter}
                  onChange={(e) => setTutorCursoFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold"
                >
                  <option value="todos">Todos los Cursos</option>
                  <option value="1° Año">1° Año</option>
                  <option value="2° Año">2° Año</option>
                  <option value="3° Año">3° Año</option>
                  <option value="4° Año">4° Año</option>
                  <option value="5° Año">5° Año</option>
                  <option value="6° Año">6° Año</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  División del Hijo/a
                </label>
                <select
                  value={tutorDivisionFilter}
                  onChange={(e) => setTutorDivisionFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold"
                >
                  <option value="todos">Todas las Div.</option>
                  <option value="A">División "A"</option>
                  <option value="B">División "B"</option>
                  <option value="C">División "C"</option>
                </select>
              </div>

              <div className="lg:col-span-5">
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Buscar Tutor por Nombre, Apellido, DNI o Teléfono
                </label>
                <div className="relative">
                  <i className="fa-solid fa-search absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                  <input
                    type="text"
                    value={tutorSearch}
                    onChange={(e) => setTutorSearch(e.target.value)}
                    placeholder="Buscar por Nombre, Apellido, DNI o Gmail..."
                    className="w-full pl-8 pr-8 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                  />
                  {tutorSearch && (
                    <button
                      type="button"
                      onClick={() => setTutorSearch('')}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      <i className="fa-solid fa-circle-xmark"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-850/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">Identificador</th>
                  <th className="py-3 px-4">Apellido y Nombre</th>
                  <th className="py-3 px-4">Documento (DNI)</th>
                  <th className="py-3 px-4">Teléfono y Correo Electrónico</th>
                  <th className="py-3 px-4">Estudiantes a Cargo</th>
                  <th className="py-3 px-4 text-center">Estado Socio</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredTutores.map((tut) => {
                  const hijos = state.alumnos.filter((a) => a.tutorId === tut.id);
                  return (
                    <tr key={tut.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {tut.id}
                        <span className="block text-[10px] text-slate-400">
                          Alta: {tut.fechaAlta || '2026-03-01'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">
                        {tut.apellido}, {tut.nombre}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {tut.dni}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                        <div>
                          <i className="fa-solid fa-phone mr-1.5 text-slate-400"></i>
                          {tut.telefono || 'Sin teléfono'}
                        </div>
                        <div>
                          <i className="fa-solid fa-envelope mr-1.5 text-slate-400"></i>
                          {tut.email || 'Sin correo'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {hijos.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">Sin estudiantes vinculados</span>
                          ) : (
                            hijos.map((h) => (
                              <span
                                key={h.id}
                                className="text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded font-semibold"
                              >
                                {h.nombre} ({h.curso})
                              </span>
                            ))
                          )}
                          {hijos.length >= 2 && (
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-300 dark:border-emerald-800">
                              Bonificación 20%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          {tut.estado || 'Activo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {canOperate && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditTutor(tut)}
                            className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 transition"
                          >
                            <i className="fa-solid fa-pen-to-square mr-1 text-slate-400"></i>
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

      {/* =========================================================
          MODAL 1: SOLICITAR BAJA DE MATRÍCULA (REGLA DE NEGOCIO SECRETARÍA)
         ========================================================= */}
      {isBajaModalOpen && targetStudentForBaja && (() => {
        const cuotas = getStudentCuotas(targetStudentForBaja.id);
        const pendientes = cuotas.filter((c) => c.estado === 'pendiente' || c.estado === 'vencida');
        const totalDeuda = pendientes.reduce((acc, c) => acc + c.monto, 0);
        const tutor = getTutor(targetStudentForBaja.tutorId);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] overflow-y-auto animate-in zoom-in-95">
              {/* Header Modal */}
              <div className="bg-rose-900 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <i className="fa-solid fa-user-slash text-rose-300"></i>
                    Solicitud de Baja de Matrícula Institucional
                  </h3>
                  <p className="text-xs text-rose-200 mt-0.5">
                    Perfil de Secretaría • Auditoría institucional y verificación de deuda
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBajaModalOpen(false)}
                  className="text-rose-200 hover:text-white"
                >
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>

              <form onSubmit={handleSubmitSolicitudBaja} className="p-6 space-y-4">
                {/* Resumen del Estudiante */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-750 flex items-start justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {targetStudentForBaja.apellido}, {targetStudentForBaja.nombre}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      DNI {targetStudentForBaja.dni} • Legajo: {targetStudentForBaja.id}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Curso: <strong>{targetStudentForBaja.curso} "{targetStudentForBaja.division}"</strong> (Turno {targetStudentForBaja.turno})
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Tutor: {tutor ? `${tutor.apellido}, ${tutor.nombre} (DNI ${tutor.dni})` : 'Sin tutor'}
                    </div>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                    Estado Actual: {targetStudentForBaja.estado_matricula || 'Regular'}
                  </span>
                </div>

                {/* VALIDACIÓN PREVIA DE DEUDA: Alerta prominente si registra cuotas impagas */}
                {pendientes.length > 0 ? (
                  <div className="bg-amber-50 dark:bg-amber-950/60 border-l-4 border-amber-500 p-4 rounded-r-xl">
                    <div className="flex items-start gap-3">
                      <i className="fa-solid fa-triangle-exclamation text-amber-600 dark:text-amber-400 text-lg mt-0.5"></i>
                      <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                        <strong className="text-sm font-bold block text-amber-950 dark:text-amber-100">
                          El estudiante posee {pendientes.length} cuotas pendientes por un total de ${totalDeuda.toLocaleString('es-AR')}.
                        </strong>
                        <p>
                          La solicitud marcará el legajo en estado <span className="font-mono font-bold bg-amber-200/80 dark:bg-amber-900/80 px-1 py-0.5 rounded text-amber-950 dark:text-amber-100">BAJA_PENDIENTE_APROBACION</span> y requerirá confirmación explícita de Dirección/Administración para autorizar la condonación de deuda o mantenerla en gestión judicial/extrajudicial.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
                    <i className="fa-solid fa-circle-check text-emerald-600 dark:text-emerald-400 text-base"></i>
                    <span>El estudiante se encuentra al día con la Cooperadora Escolar (sin saldo deudor).</span>
                  </div>
                )}

                {/* Selector Obligatorio del Motivo de la Baja */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Motivo de la Baja *
                  </label>
                  <select
                    required
                    value={motivoBaja}
                    onChange={(e) => setMotivoBaja(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium"
                  >
                    <option value="Pase a otra institución">Pase a otra institución</option>
                    <option value="Abandono/Deserción">Abandono / Deserción</option>
                    <option value="Situación socioeconómica">Situación socioeconómica</option>
                    <option value="Otro">Otro motivo</option>
                  </select>
                </div>

                {/* Observaciones o Documentación Adjunta */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Observaciones y Justificación Institucional *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={observacionesBaja}
                    onChange={(e) => setObservacionesBaja(e.target.value)}
                    placeholder="Detalle el motivo, colegio de destino, número de expediente o trámite de pase..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>

                {/* Referencia de Documentación Respaldatoria */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Documentación Adjunta / Número de Pase Provisorio
                  </label>
                  <input
                    type="text"
                    value={docAdjuntaBaja}
                    onChange={(e) => setDocAdjuntaBaja(e.target.value)}
                    placeholder="Ej: Pase Provisorio N° 458/2026, Nota formal del tutor..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Confirmación y Auditoría */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmBajaCheck}
                      onChange={(e) => setConfirmBajaCheck(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      Constato la solicitud formal de baja y el estado contable de cuotas. Entiendo que se registrará un evento inmutable en <code className="font-mono text-rose-600 font-bold">audit_log</code> vinculando mi usuario institucional, fecha y motivo.
                    </span>
                  </label>
                </div>

                {/* Botones de Acción */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsBajaModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Opción adicional para perfil de Dirección / Administrador */}
                    {isAdminOrDirector && (
                      <button
                        type="button"
                        onClick={handleAprobarBajaDirecta}
                        className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition shadow-sm"
                        title="Aprobar de manera directa por Rectoría"
                      >
                        <i className="fa-solid fa-stamp mr-1.5"></i>
                        Aprobar Baja Definitiva (Dirección)
                      </button>
                    )}

                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                    >
                      <i className="fa-solid fa-paper-plane text-xs"></i>
                      <span>Registrar Solicitud de Baja</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* =========================================================
          MODAL 2: VER LEGAJO COMPLETO DEL ESTUDIANTE
         ========================================================= */}
      {isLegajoModalOpen && targetStudentForLegajo && (() => {
        const tutor = getTutor(targetStudentForLegajo.tutorId);
        const siblings = getStudentSiblings(targetStudentForLegajo.id);
        const cuotas = getStudentCuotas(targetStudentForLegajo.id);
        const pagadas = cuotas.filter((c) => c.estado === 'pagada');
        const pendientes = cuotas.filter((c) => c.estado === 'pendiente');
        const vencidas = cuotas.filter((c) => c.estado === 'vencida');
        const totalPagado = pagadas.reduce((acc, c) => acc + c.monto, 0);
        const totalDeuda = [...pendientes, ...vencidas].reduce((acc, c) => acc + c.monto, 0);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <i className="fa-solid fa-id-card text-blue-400"></i>
                    Legajo Institucional del Estudiante
                  </h3>
                  <p className="text-xs text-slate-300">
                    Escuela Normal Superior Dalmacio Vélez Sársfield • Cooperadora Escolar
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLegajoModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>

              <div className="p-6 space-y-5 text-xs">
                {/* Cabecera del legajo */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-black shrink-0">
                    {targetStudentForLegajo.nombre[0]}{targetStudentForLegajo.apellido[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {targetStudentForLegajo.apellido}, {targetStudentForLegajo.nombre}
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {targetStudentForLegajo.estado_matricula || 'Regular'}
                      </span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      DNI: {targetStudentForLegajo.dni} • Legajo: {targetStudentForLegajo.id}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 mt-1">
                      Curso: <strong>{targetStudentForLegajo.curso} División "{targetStudentForLegajo.division}"</strong> • Turno: {targetStudentForLegajo.turno}
                    </div>
                  </div>
                </div>

                {/* Datos del Tutor y Vínculo Familiar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-850">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Socio / Tutor Responsable
                    </span>
                    {tutor ? (
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">
                          {tutor.apellido}, {tutor.nombre}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                          DNI {tutor.dni} • Tel: {tutor.telefono || 'S/D'}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                          Email: {tutor.email || 'S/D'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Sin tutor registrado</span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-850">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Bonificación por Hermanos
                    </span>
                    {siblings.length > 0 ? (
                      <div>
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                          <i className="fa-solid fa-check-circle"></i>
                          20% de Descuento Activo
                        </span>
                        <div className="text-slate-500 dark:text-slate-400 mt-1">
                          Hermanos matriculados: {siblings.map((s) => `${s.nombre} (${s.curso})`).join(', ')}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">
                          Sin hermanos en la institución (Tarifa plena).
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumen Contable */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-300">
                      Estado de Cuenta Ciclo Lectivo 2026
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        Abonado: ${totalPagado.toLocaleString('es-AR')}
                      </span>
                      <span>•</span>
                      <span className="text-rose-600 font-bold">
                        Saldo Impago: ${totalDeuda.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
                    {cuotas.map((c) => (
                      <div
                        key={c.id}
                        className={`p-2 rounded-lg border text-center ${
                          c.estado === 'pagada'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                            : c.estado === 'vencida'
                            ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-bold text-[11px]">{c.concepto.replace('Cuota ', '')}</div>
                        <div className="font-mono text-[10px] mt-0.5">${c.monto.toLocaleString('es-AR')}</div>
                        <span className="inline-block text-[9px] uppercase font-bold mt-1">
                          {c.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botones del Modal */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsLegajoModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cerrar
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLegajoModalOpen(false);
                        selectStudent(targetStudentForLegajo.id);
                        setActiveTab('recepcion');
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs flex items-center gap-1.5"
                    >
                      <i className="fa-solid fa-cash-register"></i>
                      <span>Cobrar en Ventanilla</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================
          MODAL 3: EDITAR DATOS DEL ESTUDIANTE
         ========================================================= */}
      {isEditarAlumnoModalOpen && editingAlumnoData && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <i className="fa-solid fa-user-pen text-blue-400"></i>
                  Modificar Legajo del Estudiante
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Actualice los datos personales y asignación académica
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditarAlumnoModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEditarAlumno} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAlumnoData.apellido}
                    onChange={(e) =>
                      setEditingAlumnoData({ ...editingAlumnoData, apellido: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAlumnoData.nombre}
                    onChange={(e) =>
                      setEditingAlumnoData({ ...editingAlumnoData, nombre: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Documento (DNI) *
                </label>
                <input
                  type="text"
                  required
                  value={editingAlumnoData.dni}
                  onChange={(e) =>
                    setEditingAlumnoData({ ...editingAlumnoData, dni: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Año Lectivo
                  </label>
                  <select
                    value={editingAlumnoData.anioLectivo || '2026'}
                    onChange={(e) =>
                      setEditingAlumnoData({ ...editingAlumnoData, anioLectivo: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Curso
                  </label>
                  <select
                    value={editingAlumnoData.curso}
                    onChange={(e) =>
                      setEditingAlumnoData({ ...editingAlumnoData, curso: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    División
                  </label>
                  <select
                    value={editingAlumnoData.division}
                    onChange={(e) =>
                      setEditingAlumnoData({ ...editingAlumnoData, division: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                  >
                    <option value="A">División A</option>
                    <option value="B">División B</option>
                    <option value="C">División C</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Turno
                  </label>
                  <select
                    value={editingAlumnoData.turno}
                    onChange={(e) =>
                      setEditingAlumnoData({ ...editingAlumnoData, turno: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                  >
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditarAlumnoModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: GESTIONAR VÍNCULO FAMILIAR
         ========================================================= */}
      {isVinculoModalOpen && targetStudentForVinculo && (() => {
        const currentTutor = getTutor(targetStudentForVinculo.tutorId);
        const selectedTutor = getTutor(selectedNuevoTutorId);
        const otherChildren = state.alumnos.filter(
          (a) => a.tutorId === selectedNuevoTutorId && a.id !== targetStudentForVinculo.id
        );

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <i className="fa-solid fa-people-arrows text-indigo-300"></i>
                    Gestionar Vínculo Familiar y Bonificaciones
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Reasignar tutor y calcular automáticamente el 20% de bonificación
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVinculoModalOpen(false)}
                  className="text-indigo-200 hover:text-white"
                >
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>

              <form onSubmit={handleSaveVinculoModal} className="p-6 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-100">
                    Estudiante: {targetStudentForVinculo.apellido}, {targetStudentForVinculo.nombre}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Tutor actual: {currentTutor ? `${currentTutor.apellido}, ${currentTutor.nombre}` : 'Sin tutor'}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Buscar Tutor Existente por Nombre, Apellido o Documento (DNI) *
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-2.5 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      value={vinculoTutorSearch}
                      onChange={(e) => setVinculoTutorSearch(e.target.value)}
                      placeholder="Escriba el Nombre, Apellido o DNI del tutor para buscar..."
                      className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                    {vinculoTutorSearch && (
                      <button
                        type="button"
                        onClick={() => setVinculoTutorSearch('')}
                        className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        <i className="fa-solid fa-circle-xmark"></i>
                      </button>
                    )}
                  </div>

                  {/* Lista filtrada de tutores */}
                  <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    {matchingTutoresParaVinculo.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No se encontraron tutores con ese nombre o DNI.
                      </div>
                    ) : (
                      matchingTutoresParaVinculo.map((tut) => {
                        const countHijos = state.alumnos.filter((a) => a.tutorId === tut.id).length;
                        const isPicked = selectedNuevoTutorId === tut.id;
                        return (
                          <button
                            key={tut.id}
                            type="button"
                            onClick={() => setSelectedNuevoTutorId(tut.id)}
                            className={`w-full text-left p-2.5 text-xs transition flex items-center justify-between ${
                              isPicked
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-l-4 border-l-indigo-600'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-100">
                                {tut.apellido}, {tut.nombre}
                              </span>
                              <span className="block text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                DNI {tut.dni} • {tut.email || 'S/D'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {countHijos} hijo(s)
                              </span>
                              {isPicked && (
                                <i className="fa-solid fa-circle-check text-indigo-600 dark:text-indigo-400 text-sm"></i>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {selectedTutor && (
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">
                          Tutor Seleccionado
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          {selectedTutor.apellido}, {selectedTutor.nombre} (DNI {selectedTutor.dni})
                        </span>
                      </div>
                      <i className="fa-solid fa-user-check text-emerald-600 text-base"></i>
                    </div>
                  )}
                </div>

                {/* Previsualización del beneficio */}
                <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs">
                  {otherChildren.length > 0 ? (
                    <div className="text-indigo-900 dark:text-indigo-200 space-y-1">
                      <strong className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                        <i className="fa-solid fa-circle-check"></i>
                        Aplica 20% de Bonificación Automática por Hermanos
                      </strong>
                      <p>
                        Este tutor ya registra a: <strong>{otherChildren.map((c) => c.nombre).join(', ')}</strong>. Ambos estudiantes mantendrán el descuento del 20% en sus aranceles.
                      </p>
                    </div>
                  ) : (
                    <div className="text-slate-600 dark:text-slate-300">
                      <i className="fa-solid fa-circle-info mr-1.5 text-indigo-500"></i>
                      Este tutor no registra otros hijos actualmente. El estudiante aplicará a tarifa plena institucional.
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsVinculoModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
                  >
                    Guardar Vínculo Familiar
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* =========================================================
          MODAL 5: MATRICULAR NUEVO ESTUDIANTE
         ========================================================= */}
      {isMatricularModalOpen && (() => {
        const selectedTutorObj = state.tutores.find((t) => t.id === tutorExistenteId);
        const isNuevoTutorComplete =
          tutorMode !== 'nuevo' ||
          (Boolean(nuevoTutApellido.trim()) &&
            Boolean(nuevoTutNombre.trim()) &&
            Boolean(nuevoTutDni.trim()) &&
            Boolean(nuevoTutTel.trim()) &&
            Boolean(nuevoTutEmail.trim()) &&
            nuevoTutEmail.includes('@'));
        const isFormReady =
          Boolean(aluApellido.trim()) &&
          Boolean(aluNombre.trim()) &&
          Boolean(aluDni.trim()) &&
          (tutorMode === 'existente' ? Boolean(tutorExistenteId) : isNuevoTutorComplete);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] overflow-y-auto">
              <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <i className="fa-solid fa-user-graduate text-emerald-400"></i>
                    Matricular Nuevo Estudiante
                  </h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Generación automática de aranceles anuales y evaluación de bonificación familiar
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMatricularModalOpen(false)}
                  className="text-blue-200 hover:text-white"
                >
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>

              <form onSubmit={handleCreateAlumno} className="p-6 space-y-4">
                {matricularError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-200 flex items-center gap-2">
                    <i className="fa-solid fa-triangle-exclamation text-rose-600"></i>
                    <span>{matricularError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={aluApellido}
                      onChange={(e) => setAluApellido(e.target.value)}
                      placeholder="Ej: Gómez"
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={aluNombre}
                      onChange={(e) => setAluNombre(e.target.value)}
                      placeholder="Ej: Julieta"
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      DNI *
                    </label>
                    <input
                      type="text"
                      required
                      value={aluDni}
                      onChange={(e) => setAluDni(e.target.value)}
                      placeholder="Ej: 49.112.233"
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Año Lectivo
                    </label>
                    <select
                      value={aluAnioLectivo}
                      onChange={(e) => setAluAnioLectivo(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Curso
                    </label>
                    <select
                      value={aluCurso}
                      onChange={(e) => setAluCurso(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
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
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      División
                    </label>
                    <select
                      value={aluDivision}
                      onChange={(e) => setAluDivision(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    >
                      <option value="A">División A</option>
                      <option value="B">División B</option>
                      <option value="C">División C</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Turno
                    </label>
                    <select
                      value={aluTurno}
                      onChange={(e) => setAluTurno(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    >
                      <option value="Mañana">Mañana</option>
                      <option value="Tarde">Tarde</option>
                    </select>
                  </div>
                </div>

                {/* Vinculación con Tutor */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                    Vinculación Familiar con Socio / Tutor
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTutorMode('existente');
                        setMatricularError('');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        tutorMode === 'existente'
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-300'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <i className="fa-solid fa-people-roof mr-1.5"></i>
                      Vincular a Tutor Existente
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTutorMode('nuevo');
                        setMatricularError('');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        tutorMode === 'nuevo'
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-300'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <i className="fa-solid fa-user-plus mr-1.5"></i>
                      Registrar Nuevo Tutor
                    </button>
                  </div>

                  {tutorMode === 'existente' ? (
                    <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">
                        Buscar Tutor por Nombre, Apellido o Documento (DNI):
                      </label>
                      <div className="relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                        <input
                          type="text"
                          value={tutorExistenteSearch}
                          onChange={(e) => setTutorExistenteSearch(e.target.value)}
                          placeholder="Escriba el Nombre, Apellido o DNI del tutor (ej: Gómez o 28.111.222)..."
                          className="w-full pl-8 pr-8 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                        {tutorExistenteSearch && (
                          <button
                            type="button"
                            onClick={() => setTutorExistenteSearch('')}
                            className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs"
                          >
                            <i className="fa-solid fa-circle-xmark"></i>
                          </button>
                        )}
                      </div>

                      {/* Resultados de búsqueda de tutor */}
                      <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        {matchingTutoresParaMatricula.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400">
                            No se encontraron tutores con ese Nombre o DNI. Puede usar la pestaña "Registrar Nuevo Tutor".
                          </div>
                        ) : (
                          matchingTutoresParaMatricula.map((t) => {
                            const cantHijos = state.alumnos.filter((a) => a.tutorId === t.id).length;
                            const isSelected = tutorExistenteId === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setTutorExistenteId(t.id)}
                                className={`w-full text-left p-2.5 text-xs transition flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-blue-50 dark:bg-blue-950/60 border-l-4 border-l-blue-600'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                }`}
                              >
                                <div>
                                  <span className="font-bold text-slate-800 dark:text-slate-100">
                                    {t.apellido}, {t.nombre}
                                  </span>
                                  <span className="block text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                    DNI {t.dni} • Tel: {t.telefono || 'S/D'} • {t.email || 'S/D'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    {cantHijos} hijo(s)
                                  </span>
                                  {isSelected && (
                                    <i className="fa-solid fa-circle-check text-blue-600 dark:text-blue-400 text-sm"></i>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>

                      {selectedTutorObj && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">
                              Tutor Seleccionado para Vincular
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {selectedTutorObj.apellido}, {selectedTutorObj.nombre} — DNI {selectedTutorObj.dni}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                            <i className="fa-solid fa-check mr-1"></i>
                            Vinculado
                          </span>
                        </div>
                      )}

                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <i className="fa-solid fa-circle-check"></i>
                        Si el tutor ya registra hijos en la institución, el sistema activará automáticamente el 20% de bonificación.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <i className="fa-solid fa-asterisk text-[10px]"></i>
                        <span>Todos los campos del nuevo tutor son obligatorios (Nombre, Apellido, DNI, Teléfono y Gmail).</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                            Apellido del Tutor *
                          </label>
                          <input
                            type="text"
                            required
                            value={nuevoTutApellido}
                            onChange={(e) => setNuevoTutApellido(e.target.value)}
                            placeholder="Ej: Rivas *"
                            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                            Nombre del Tutor *
                          </label>
                          <input
                            type="text"
                            required
                            value={nuevoTutNombre}
                            onChange={(e) => setNuevoTutNombre(e.target.value)}
                            placeholder="Ej: Laura *"
                            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                            DNI del Tutor *
                          </label>
                          <input
                            type="text"
                            required
                            value={nuevoTutDni}
                            onChange={(e) => setNuevoTutDni(e.target.value)}
                            placeholder="Ej: 30.222.333 *"
                            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                            Número de Teléfono *
                          </label>
                          <input
                            type="text"
                            required
                            value={nuevoTutTel}
                            onChange={(e) => setNuevoTutTel(e.target.value)}
                            placeholder="Ej: 11-4567-8901 *"
                            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                            Gmail / Correo Electrónico *
                          </label>
                          <input
                            type="email"
                            required
                            value={nuevoTutEmail}
                            onChange={(e) => setNuevoTutEmail(e.target.value)}
                            placeholder="Ej: nombre.apellido@gmail.com *"
                            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsMatricularModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormReady}
                    className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-sm transition ${
                      isFormReady
                        ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                        : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-70'
                    }`}
                  >
                    Guardar Estudiante y Generar Cuotas
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* =========================================================
          MODAL 6: REGISTRAR O ACTUALIZAR SOCIO TUTOR (CAMPOS OBLIGATORIOS)
         ========================================================= */}
      {isTutorModalOpen && editingTutor && (() => {
        const isTutorComplete =
          Boolean((editingTutor.apellido || '').trim()) &&
          Boolean((editingTutor.nombre || '').trim()) &&
          Boolean((editingTutor.dni || '').trim()) &&
          Boolean((editingTutor.telefono || '').trim()) &&
          Boolean((editingTutor.email || '').trim()) &&
          (editingTutor.email || '').includes('@');

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">
                    {editingTutor.id ? 'Actualizar Datos del Socio / Tutor' : 'Registrar Nuevo Socio / Tutor'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Todos los campos marcados con (*) son obligatorios
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTutorModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <form onSubmit={handleSaveTutor} className="p-6 space-y-3.5">
                {tutorFormError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-200 flex items-start gap-2">
                    <i className="fa-solid fa-triangle-exclamation text-rose-600 mt-0.5"></i>
                    <span>{tutorFormError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Apellido obligatorio *"
                      value={editingTutor.apellido}
                      onChange={(e) =>
                        setEditingTutor({ ...editingTutor, apellido: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nombre obligatorio *"
                      value={editingTutor.nombre}
                      onChange={(e) =>
                        setEditingTutor({ ...editingTutor, nombre: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Documento (DNI) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 30.111.222 *"
                      value={editingTutor.dni}
                      onChange={(e) =>
                        setEditingTutor({ ...editingTutor, dni: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Número de Teléfono *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 11-4567-8901 *"
                      value={editingTutor.telefono || ''}
                      onChange={(e) =>
                        setEditingTutor({ ...editingTutor, telefono: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Gmail / Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Ej: tutor@gmail.com *"
                    value={editingTutor.email || ''}
                    onChange={(e) =>
                      setEditingTutor({ ...editingTutor, email: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {!isTutorComplete && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                    <i className="fa-solid fa-circle-info"></i>
                    <span>Complete Nombre, Apellido, DNI, Teléfono y Gmail para habilitar la confirmación.</span>
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsTutorModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!isTutorComplete}
                    className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition ${
                      isTutorComplete
                        ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-sm'
                        : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-70'
                    }`}
                  >
                    Confirmar y Guardar Tutor
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* =========================================================
          MODAL 7: EMISIÓN DE CONSTANCIAS EN LOTE
         ========================================================= */}
      {isConstanciaBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <i className="fa-solid fa-file-invoice text-blue-300"></i>
                  Emisión Masiva de Constancias de Matrícula
                </h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  {selectedStudentIds.length} estudiante(s) seleccionado(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsConstanciaBatchModalOpen(false)}
                className="text-blue-200 hover:text-white"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Se generará el archivo consolidado de constancias oficiales de regularidad y estado de cuotas de la Cooperadora Escolar para los siguientes estudiantes:
              </p>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700 font-medium">
                {state.alumnos
                  .filter((a) => selectedStudentIds.includes(a.id))
                  .map((a) => (
                    <div key={a.id} className="py-1.5 flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {a.apellido}, {a.nombre}
                      </span>
                      <span className="text-slate-500 font-mono">
                        DNI {a.dni} • {a.curso} "{a.division}"
                      </span>
                    </div>
                  ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConstanciaBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsConstanciaBatchModalOpen(false);
                    showToast(`Se emitieron ${selectedStudentIds.length} constancias de matrícula listas para imprimir.`, 'success');
                  }}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <i className="fa-solid fa-print"></i>
                  <span>Generar e Imprimir Lote</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
