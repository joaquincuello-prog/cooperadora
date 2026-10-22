/**
 * Modelo de Datos Inicial basado en:
 * - Diagrama de Clases (Cooperadora, Socio/Tutor, Alumno, Cuota, Pago, MedioPago, Comprobante, Usuario, Tesoreria, Reporte)
 * - Diagrama Entidad-Relación (DER)
 * - Relevamiento y Requisitos Módulos 1, 2, 3 y 4
 */

export const CUOTA_BASE = 5000;
export const DESCUENTO_HERMANO_PCT = 0.20; // 20% Automático (RF-05, HU-04)
export const RECARGO_MORA_PCT = 0.10; // 10% calcularRecargo() en clase Cuota

export const MEDIOS_PAGO = [
  { id: 'Efectivo', label: 'Efectivo (Ventanilla)', enum: 'EFECTIVO', enAlcancePrimario: true },
  { id: 'Transferencia', label: 'Transferencia Bancaria', enum: 'TRANSFERENCIA', enAlcancePrimario: true },
  { id: 'Mercado Pago', label: 'Mercado Pago (Transferencia CVU)', enum: 'MERCADO_PAGO', enAlcancePrimario: false },
];

export const MESES_CICLO = [
  { id: 3, nombre: 'Marzo', periodo: '2026-03', vencimiento: '10/03/2026' },
  { id: 4, nombre: 'Abril', periodo: '2026-04', vencimiento: '10/04/2026' },
  { id: 5, nombre: 'Mayo', periodo: '2026-05', vencimiento: '10/05/2026' },
  { id: 6, nombre: 'Junio', periodo: '2026-06', vencimiento: '10/06/2026' },
  { id: 7, nombre: 'Julio', periodo: '2026-07', vencimiento: '10/07/2026' },
  { id: 8, nombre: 'Agosto', periodo: '2026-08', vencimiento: '10/08/2026' },
  { id: 9, nombre: 'Septiembre', periodo: '2026-09', vencimiento: '10/09/2026' },
  { id: 10, nombre: 'Octubre', periodo: '2026-10', vencimiento: '10/10/2026' },
  { id: 11, nombre: 'Noviembre', periodo: '2026-11', vencimiento: '10/11/2026' },
  { id: 12, nombre: 'Diciembre', periodo: '2026-12', vencimiento: '10/12/2026' },
];

export const USUARIOS_SISTEMA = [
  {
    id: 1,
    username: 'secretaria',
    password: '123',
    nombre: 'Ana Martínez',
    email: 'secretaria@ees14.edu.ar',
    rol: 'secretaria',
    cargo: 'Secretaria Operativa (DVS)'
  },
  {
    id: 2,
    username: 'tesorero',
    password: '123',
    nombre: 'Marta Rodríguez',
    email: 'tesoreria@ees14.edu.ar',
    rol: 'tesorero',
    cargo: 'Tesorera de Cooperadora'
  },
  {
    id: 3,
    username: 'director',
    password: '123',
    nombre: 'Lic. Jorge Domínguez',
    email: 'direccion@ees14.edu.ar',
    rol: 'director',
    cargo: 'Director Institucional'
  },
  {
    id: 4,
    username: 'tutor',
    password: '123',
    nombre: 'Carlos Gómez',
    email: 'carlos.gomez@gmail.com',
    rol: 'tutor',
    tutorId: 'tut-1',
    cargo: 'Padre / Socio Cooperadora'
  }
];

export function getInitialMockData() {
  return {
    role: 'secretaria', // 'secretaria' | 'tesorero' | 'director' | 'tutor'
    currentUser: USUARIOS_SISTEMA[0],
    selectedStudentId: 'alu-1',
    selectedTutorPortalId: 'tut-1',
    cooperadora: {
      id: 1,
      nombre: 'Asociación Cooperadora E.E.S. N° 14',
      cuit: '30-71234567-9',
      direccion: 'Av. Libertador 1450, Buenos Aires',
      cicloLectivo: 2026,
      cuotaBase: CUOTA_BASE,
      descuentoHermanoPct: 20
    },
    tesoreria: {
      id: 1,
      cooperadoraId: 1,
      periodoActual: '2026-06 (Junio 2026)',
      saldoInicial: 125000,
      egresos: [
        {
          id: 'EGR-2026-001',
          fecha: '2026-03-22',
          concepto: 'Compra de artículos de limpieza e higiene institucional',
          categoria: 'Mantenimiento',
          importe: 14500,
          comprobante: 'FC-B-0004-001928',
          autorizadoPor: 'Tesorera (Marta Rodríguez)'
        },
        {
          id: 'EGR-2026-002',
          fecha: '2026-04-19',
          concepto: 'Reparación de cerraduras y vidrios de aulas (Planta Baja)',
          categoria: 'Infraestructura',
          importe: 18000,
          comprobante: 'FC-C-0002-000841',
          autorizadoPor: 'Tesorera (Marta Rodríguez)'
        },
        {
          id: 'EGR-2026-003',
          fecha: '2026-05-12',
          concepto: 'Resmas de papel A4 y tóners para Secretaría y Dirección',
          categoria: 'Insumos Escolares',
          importe: 12000,
          comprobante: 'FC-B-0012-009410',
          autorizadoPor: 'Tesorera (Marta Rodríguez)'
        }
      ],
      cierresPeriodo: [
        {
          id: 'CIE-2026-03',
          periodo: 'Marzo 2026',
          fechaCierre: '2026-03-31 18:00',
          saldoInicial: 125000,
          ingresos: 19000,
          egresos: 14500,
          saldoFinal: 129500,
          responsable: 'Marta Rodríguez (Tesorera)'
        },
        {
          id: 'CIE-2026-04',
          periodo: 'Abril 2026',
          fechaCierre: '2026-04-30 18:00',
          saldoInicial: 129500,
          ingresos: 10000,
          egresos: 18000,
          saldoFinal: 121500,
          responsable: 'Marta Rodríguez (Tesorera)'
        }
      ]
    },
    tutores: [
      {
        id: 'tut-1',
        cooperadoraId: 1,
        nombre: 'Carlos',
        apellido: 'Gómez',
        dni: '28.111.222',
        telefono: '11-4567-8901',
        email: 'carlos.gomez@gmail.com',
        fechaAlta: '2024-03-05',
        estado: 'Activo'
      },
      {
        id: 'tut-2',
        cooperadoraId: 1,
        nombre: 'Laura',
        apellido: 'Rivas',
        dni: '30.222.333',
        telefono: '11-9876-5432',
        email: 'laura.rivas@hotmail.com',
        fechaAlta: '2025-03-10',
        estado: 'Activo'
      },
      {
        id: 'tut-3',
        cooperadoraId: 1,
        nombre: 'Roberto',
        apellido: 'Fernández',
        dni: '26.543.210',
        telefono: '11-3322-1144',
        email: 'rfernandez@correo.com',
        fechaAlta: '2025-03-12',
        estado: 'Activo'
      },
      {
        id: 'tut-4',
        cooperadoraId: 1,
        nombre: 'Valeria',
        apellido: 'Sosa',
        dni: '32.876.543',
        telefono: '11-6655-4433',
        email: 'valeria.sosa@gmail.com',
        fechaAlta: '2026-03-02',
        estado: 'Activo'
      }
    ],
    alumnos: [
      {
        id: 'alu-1',
        nombre: 'Lucas',
        apellido: 'Gómez',
        dni: '45.123.456',
        curso: '4° Año',
        division: 'A',
        turno: 'Mañana',
        tutorId: 'tut-1'
      },
      {
        id: 'alu-2',
        nombre: 'Sofía',
        apellido: 'Gómez',
        dni: '47.654.321',
        curso: '1° Año',
        division: 'B',
        turno: 'Tarde',
        tutorId: 'tut-1' // Hermana de Lucas -> Aplica 20% descuento automático (RF-05)
      },
      {
        id: 'alu-3',
        nombre: 'Martina',
        apellido: 'Benítez',
        dni: '46.999.888',
        curso: '3° Año',
        division: 'A',
        turno: 'Mañana',
        tutorId: 'tut-2'
      },
      {
        id: 'alu-4',
        nombre: 'Mateo',
        apellido: 'Fernández',
        dni: '48.111.000',
        curso: '2° Año',
        division: 'B',
        turno: 'Mañana',
        tutorId: 'tut-3'
      },
      {
        id: 'alu-5',
        nombre: 'Valentina',
        apellido: 'Sosa',
        dni: '44.555.777',
        curso: '5° Año',
        division: 'A',
        turno: 'Mañana',
        tutorId: 'tut-4'
      }
    ],
    cuotas: [
      // Lucas Gómez (alu-1)
      { id: 'c-alu-1-3', alumnoId: 'alu-1', mesId: 3, concepto: 'Cuota Marzo 2026', periodo: '2026-03', vencimiento: '10/03/2026', monto: CUOTA_BASE, estado: 'pagada', pagoId: 'REC-2026-001' },
      { id: 'c-alu-1-4', alumnoId: 'alu-1', mesId: 4, concepto: 'Cuota Abril 2026', periodo: '2026-04', vencimiento: '10/04/2026', monto: CUOTA_BASE, estado: 'pagada', pagoId: 'REC-2026-002' },
      { id: 'c-alu-1-5', alumnoId: 'alu-1', mesId: 5, concepto: 'Cuota Mayo 2026', periodo: '2026-05', vencimiento: '10/05/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-1-6', alumnoId: 'alu-1', mesId: 6, concepto: 'Cuota Junio 2026', periodo: '2026-06', vencimiento: '10/06/2026', monto: CUOTA_BASE, estado: 'vencida', pagoId: null },
      { id: 'c-alu-1-7', alumnoId: 'alu-1', mesId: 7, concepto: 'Cuota Julio 2026', periodo: '2026-07', vencimiento: '10/07/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-1-8', alumnoId: 'alu-1', mesId: 8, concepto: 'Cuota Agosto 2026', periodo: '2026-08', vencimiento: '10/08/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-1-9', alumnoId: 'alu-1', mesId: 9, concepto: 'Cuota Septiembre 2026', periodo: '2026-09', vencimiento: '10/09/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-1-10', alumnoId: 'alu-1', mesId: 10, concepto: 'Cuota Octubre 2026', periodo: '2026-10', vencimiento: '10/10/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-1-11', alumnoId: 'alu-1', mesId: 11, concepto: 'Cuota Noviembre 2026', periodo: '2026-11', vencimiento: '10/11/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-1-12', alumnoId: 'alu-1', mesId: 12, concepto: 'Cuota Diciembre 2026', periodo: '2026-12', vencimiento: '10/12/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },

      // Sofía Gómez (alu-2)
      { id: 'c-alu-2-3', alumnoId: 'alu-2', mesId: 3, concepto: 'Cuota Marzo 2026', periodo: '2026-03', vencimiento: '10/03/2026', monto: CUOTA_BASE, estado: 'pagada', pagoId: 'REC-2026-003' },
      { id: 'c-alu-2-4', alumnoId: 'alu-2', mesId: 4, concepto: 'Cuota Abril 2026', periodo: '2026-04', vencimiento: '10/04/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-2-5', alumnoId: 'alu-2', mesId: 5, concepto: 'Cuota Mayo 2026', periodo: '2026-05', vencimiento: '10/05/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-2-6', alumnoId: 'alu-2', mesId: 6, concepto: 'Cuota Junio 2026', periodo: '2026-06', vencimiento: '10/06/2026', monto: CUOTA_BASE, estado: 'vencida', pagoId: null },
      { id: 'c-alu-2-7', alumnoId: 'alu-2', mesId: 7, concepto: 'Cuota Julio 2026', periodo: '2026-07', vencimiento: '10/07/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-2-8', alumnoId: 'alu-2', mesId: 8, concepto: 'Cuota Agosto 2026', periodo: '2026-08', vencimiento: '10/08/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-2-9', alumnoId: 'alu-2', mesId: 9, concepto: 'Cuota Septiembre 2026', periodo: '2026-09', vencimiento: '10/09/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-2-10', alumnoId: 'alu-2', mesId: 10, concepto: 'Cuota Octubre 2026', periodo: '2026-10', vencimiento: '10/10/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-2-11', alumnoId: 'alu-2', mesId: 11, concepto: 'Cuota Noviembre 2026', periodo: '2026-11', vencimiento: '10/11/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-2-12', alumnoId: 'alu-2', mesId: 12, concepto: 'Cuota Diciembre 2026', periodo: '2026-12', vencimiento: '10/12/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },

      // Martina Benítez (alu-3)
      { id: 'c-alu-3-3', alumnoId: 'alu-3', mesId: 3, concepto: 'Cuota Marzo 2026', periodo: '2026-03', vencimiento: '10/03/2026', monto: CUOTA_BASE, estado: 'pagada', pagoId: 'REC-2026-004' },
      { id: 'c-alu-3-4', alumnoId: 'alu-3', mesId: 4, concepto: 'Cuota Abril 2026', periodo: '2026-04', vencimiento: '10/04/2026', monto: CUOTA_BASE, estado: 'pagada', pagoId: 'REC-2026-005' },
      { id: 'c-alu-3-5', alumnoId: 'alu-3', mesId: 5, concepto: 'Cuota Mayo 2026', periodo: '2026-05', vencimiento: '10/05/2026', monto: CUOTA_BASE, estado: 'pagada', pagoId: 'REC-2026-006' },
      { id: 'c-alu-3-6', alumnoId: 'alu-3', mesId: 6, concepto: 'Cuota Junio 2026', periodo: '2026-06', vencimiento: '10/06/2026', monto: CUOTA_BASE, estado: 'vencida', pagoId: null },
      { id: 'c-alu-3-7', alumnoId: 'alu-3', mesId: 7, concepto: 'Cuota Julio 2026', periodo: '2026-07', vencimiento: '10/07/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-3-8', alumnoId: 'alu-3', mesId: 8, concepto: 'Cuota Agosto 2026', periodo: '2026-08', vencimiento: '10/08/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-3-9', alumnoId: 'alu-3', mesId: 9, concepto: 'Cuota Septiembre 2026', periodo: '2026-09', vencimiento: '10/09/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-3-10', alumnoId: 'alu-3', mesId: 10, concepto: 'Cuota Octubre 2026', periodo: '2026-10', vencimiento: '10/10/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-3-11', alumnoId: 'alu-3', mesId: 11, concepto: 'Cuota Noviembre 2026', periodo: '2026-11', vencimiento: '10/11/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-3-12', alumnoId: 'alu-3', mesId: 12, concepto: 'Cuota Diciembre 2026', periodo: '2026-12', vencimiento: '10/12/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },

      // Mateo Fernández (alu-4)
      { id: 'c-alu-4-3', alumnoId: 'alu-4', mesId: 3, concepto: 'Cuota Marzo 2026', periodo: '2026-03', vencimiento: '10/03/2026', monto: CUOTA_BASE, estado: 'pagada', pagoId: 'REC-2026-007' },
      { id: 'c-alu-4-4', alumnoId: 'alu-4', mesId: 4, concepto: 'Cuota Abril 2026', periodo: '2026-04', vencimiento: '10/04/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-4-5', alumnoId: 'alu-4', mesId: 5, concepto: 'Cuota Mayo 2026', periodo: '2026-05', vencimiento: '10/05/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-4-6', alumnoId: 'alu-4', mesId: 6, concepto: 'Cuota Junio 2026', periodo: '2026-06', vencimiento: '10/06/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-4-7', alumnoId: 'alu-4', mesId: 7, concepto: 'Cuota Julio 2026', periodo: '2026-07', vencimiento: '10/07/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-4-8', alumnoId: 'alu-4', mesId: 8, concepto: 'Cuota Agosto 2026', periodo: '2026-08', vencimiento: '10/08/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-4-9', alumnoId: 'alu-4', mesId: 9, concepto: 'Cuota Septiembre 2026', periodo: '2026-09', vencimiento: '10/09/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-4-10', alumnoId: 'alu-4', mesId: 10, concepto: 'Cuota Octubre 2026', periodo: '2026-10', vencimiento: '10/10/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-4-11', alumnoId: 'alu-4', mesId: 11, concepto: 'Cuota Noviembre 2026', periodo: '2026-11', vencimiento: '10/11/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-4-12', alumnoId: 'alu-4', mesId: 12, concepto: 'Cuota Diciembre 2026', periodo: '2026-12', vencimiento: '10/12/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },

      // Valentina Sosa (alu-5)
      { id: 'c-alu-5-3', alumnoId: 'alu-5', mesId: 3, concepto: 'Cuota Marzo 2026', periodo: '2026-03', vencimiento: '10/03/2026', monto: CUOTA_BASE, estado: 'pagada', pagoId: 'REC-2026-008' },
      { id: 'c-alu-5-4', alumnoId: 'alu-5', mesId: 4, concepto: 'Cuota Abril 2026', periodo: '2026-04', vencimiento: '10/04/2026', monto: CUOTA_BASE, estado: 'pagada', pagoId: 'REC-2026-008' },
      { id: 'c-alu-5-5', alumnoId: 'alu-5', mesId: 5, concepto: 'Cuota Mayo 2026', periodo: '2026-05', vencimiento: '10/05/2026', monto: CUOTA_BASE, estado: 'pagada', pagoId: 'REC-2026-009' },
      { id: 'c-alu-5-6', alumnoId: 'alu-5', mesId: 6, concepto: 'Cuota Junio 2026', periodo: '2026-06', vencimiento: '10/06/2026', monto: CUOTA_BASE, estado: 'pagada', pagoId: 'REC-2026-009' },
      { id: 'c-alu-5-7', alumnoId: 'alu-5', mesId: 7, concepto: 'Cuota Julio 2026', periodo: '2026-07', vencimiento: '10/07/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-5-8', alumnoId: 'alu-5', mesId: 8, concepto: 'Cuota Agosto 2026', periodo: '2026-08', vencimiento: '10/08/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-5-9', alumnoId: 'alu-5', mesId: 9, concepto: 'Cuota Septiembre 2026', periodo: '2026-09', vencimiento: '10/09/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-5-10', alumnoId: 'alu-5', mesId: 10, concepto: 'Cuota Octubre 2026', periodo: '2026-10', vencimiento: '10/10/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-5-11', alumnoId: 'alu-5', mesId: 11, concepto: 'Cuota Noviembre 2026', periodo: '2026-11', vencimiento: '10/11/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
      { id: 'c-alu-5-12', alumnoId: 'alu-5', mesId: 12, concepto: 'Cuota Diciembre 2026', periodo: '2026-12', vencimiento: '10/12/2026', monto: CUOTA_BASE, estado: 'pendiente', pagoId: null },
    ],
    pagos: [
      {
        id: 'REC-2026-001',
        numeroComprobante: 1,
        fecha: '2026-03-10',
        alumnoId: 'alu-1',
        tutorId: 'tut-1',
        conceptos: ['Cuota Marzo 2026 (Hermano)'],
        cuotaIds: ['c-alu-1-3'],
        montoSubtotal: 5000,
        descuento: 1000,
        recargo: 0,
        montoTotal: 4000,
        medio: 'Efectivo',
        comprobante: 'EF-001',
        operador: 'Secretaría (Ana Martínez)',
        estado: 'valido',
        validadoTesoreria: true,
        observaciones: 'Beneficio familiar 20% aplicado automáticamente',
        historialEdiciones: []
      },
      {
        id: 'REC-2026-002',
        numeroComprobante: 2,
        fecha: '2026-04-08',
        alumnoId: 'alu-1',
        tutorId: 'tut-1',
        conceptos: ['Cuota Abril 2026 (Hermano)'],
        cuotaIds: ['c-alu-1-4'],
        montoSubtotal: 5000,
        descuento: 1000,
        recargo: 0,
        montoTotal: 4000,
        medio: 'Transferencia',
        comprobante: 'TRF-BANCO-98214',
        operador: 'Secretaría (Ana Martínez)',
        estado: 'valido',
        validadoTesoreria: true,
        observaciones: 'Transferencia acreditada en cuenta cooperadora',
        historialEdiciones: []
      },
      {
        id: 'REC-2026-003',
        numeroComprobante: 3,
        fecha: '2026-03-11',
        alumnoId: 'alu-2',
        tutorId: 'tut-1',
        conceptos: ['Cuota Marzo 2026 (Hermano)'],
        cuotaIds: ['c-alu-2-3'],
        montoSubtotal: 5000,
        descuento: 1000,
        recargo: 0,
        montoTotal: 4000,
        medio: 'Transferencia',
        comprobante: 'TRF-BANCO-98215',
        operador: 'Secretaría (Ana Martínez)',
        estado: 'valido',
        validadoTesoreria: true,
        observaciones: 'Descuento por hermano Lucas Gómez',
        historialEdiciones: []
      },
      {
        id: 'REC-2026-004',
        numeroComprobante: 4,
        fecha: '2026-03-12',
        alumnoId: 'alu-3',
        tutorId: 'tut-2',
        conceptos: ['Cuota Marzo 2026'],
        cuotaIds: ['c-alu-3-3'],
        montoSubtotal: 5000,
        descuento: 0,
        recargo: 0,
        montoTotal: 5000,
        medio: 'Efectivo',
        comprobante: 'EF-004',
        operador: 'Secretaría (Ana Martínez)',
        estado: 'valido',
        validadoTesoreria: true,
        observaciones: 'Cobro en ventanilla',
        historialEdiciones: []
      },
      {
        id: 'REC-2026-005',
        numeroComprobante: 5,
        fecha: '2026-04-14',
        alumnoId: 'alu-3',
        tutorId: 'tut-2',
        conceptos: ['Cuota Abril 2026'],
        cuotaIds: ['c-alu-3-4'],
        montoSubtotal: 5000,
        descuento: 0,
        recargo: 0,
        montoTotal: 5000,
        medio: 'Efectivo',
        comprobante: 'EF-005',
        operador: 'Secretaría (Ana Martínez)',
        estado: 'valido',
        validadoTesoreria: true,
        observaciones: '',
        historialEdiciones: []
      },
      {
        id: 'REC-2026-006',
        numeroComprobante: 6,
        fecha: '2026-05-09',
        alumnoId: 'alu-3',
        tutorId: 'tut-2',
        conceptos: ['Cuota Mayo 2026'],
        cuotaIds: ['c-alu-3-5'],
        montoSubtotal: 5000,
        descuento: 0,
        recargo: 0,
        montoTotal: 5000,
        medio: 'Transferencia',
        comprobante: 'TRF-MP-441209',
        operador: 'Secretaría (Ana Martínez)',
        estado: 'valido',
        validadoTesoreria: false,
        observaciones: 'Pendiente de visado por Tesorería',
        historialEdiciones: []
      },
      {
        id: 'REC-2026-007',
        numeroComprobante: 7,
        fecha: '2026-03-15',
        alumnoId: 'alu-4',
        tutorId: 'tut-3',
        conceptos: ['Cuota Marzo 2026'],
        cuotaIds: ['c-alu-4-3'],
        montoSubtotal: 5000,
        descuento: 0,
        recargo: 0,
        montoTotal: 5000,
        medio: 'Efectivo',
        comprobante: 'EF-007',
        operador: 'Secretaría (Ana Martínez)',
        estado: 'valido',
        validadoTesoreria: true,
        observaciones: '',
        historialEdiciones: []
      },
      {
        id: 'REC-2026-008',
        numeroComprobante: 8,
        fecha: '2026-03-18',
        alumnoId: 'alu-5',
        tutorId: 'tut-4',
        conceptos: ['Cuota Marzo 2026', 'Cuota Abril 2026'],
        cuotaIds: ['c-alu-5-3', 'c-alu-5-4'],
        montoSubtotal: 10000,
        descuento: 0,
        recargo: 0,
        montoTotal: 10000,
        medio: 'Transferencia',
        comprobante: 'TRF-BNA-77310',
        operador: 'Secretaría (Ana Martínez)',
        estado: 'valido',
        validadoTesoreria: true,
        observaciones: 'Pago bimestral adelantado',
        historialEdiciones: []
      },
      {
        id: 'REC-2026-009',
        numeroComprobante: 9,
        fecha: '2026-05-20',
        alumnoId: 'alu-5',
        tutorId: 'tut-4',
        conceptos: ['Cuota Mayo 2026', 'Cuota Junio 2026'],
        cuotaIds: ['c-alu-5-5', 'c-alu-5-6'],
        montoSubtotal: 10000,
        descuento: 0,
        recargo: 0,
        montoTotal: 10000,
        medio: 'Efectivo',
        comprobante: 'EF-009',
        operador: 'Secretaría (Ana Martínez)',
        estado: 'valido',
        validadoTesoreria: false,
        observaciones: 'Cobro en ventanilla pendiente de arqueo',
        historialEdiciones: []
      }
    ],
    auditLogs: [
      {
        timestamp: '2026-05-20 10:15',
        usuario: 'Secretaría',
        accion: 'COBRO_REGISTRADO',
        detalle: 'Cobro cuotas Mayo y Junio 2026 a Valentina Sosa por $10.000 (Efectivo EF-009, REC-2026-009).'
      },
      {
        timestamp: '2026-05-09 14:20',
        usuario: 'Secretaría',
        accion: 'COBRO_REGISTRADO',
        detalle: 'Cobro cuota Mayo 2026 a Martina Benítez por $5.000 (Transferencia TRF-MP-441209, REC-2026-006).'
      },
      {
        timestamp: '2026-04-30 18:00',
        usuario: 'Tesorero',
        accion: 'CIERRE_PERIODO',
        detalle: 'Cierre contable del período Abril 2026 ejecutado por Marta Rodríguez. Saldo consolidado: $121.500.'
      },
      {
        timestamp: '2026-04-08 09:40',
        usuario: 'Secretaría',
        accion: 'COBRO_REGISTRADO',
        detalle: 'Cobro cuota Abril 2026 a Lucas Gómez por $4.000 con 20% Desc. Hermanos (Transferencia TRF-BANCO-98214, REC-2026-002).'
      },
      {
        timestamp: '2026-03-11 11:20',
        usuario: 'Secretaría',
        accion: 'COBRO_REGISTRADO',
        detalle: 'Cobro cuota Marzo 2026 a Sofía Gómez por $4.000 con 20% Desc. Hermanos (Transferencia TRF-BANCO-98215, REC-2026-003).'
      },
      {
        timestamp: '2026-03-01 08:00',
        usuario: 'Sistema',
        accion: 'INICIO_CICLO',
        detalle: 'Sistema de Gestión Cooperadora Escolar (E.E.S. N° 14) inicializado con control de auditoría RNF-02.'
      }
    ]
  };
}

export const ESTUDIO_PROYECTO = {
  equipo: [
    { nombre: 'Magnelli Fabrizio', rol: 'Coordinador', foco: 'Dirección general del proyecto, integración SDLC y supervisión de entregas.' },
    { nombre: 'Vivas Guillermo', rol: 'Analista de Stakeholders', foco: 'Identificación de actores, matriz Poder-Interés y gestión de expectativas.' },
    { nombre: 'Báez Federico', rol: 'Especialista en Metodología', foco: 'Estructuración del ciclo de vida (SDLC), backlog ágil y priorización.' },
    { nombre: 'Gudiño Matías', rol: 'Diseñador de Técnicas', foco: 'Diseño de la entrevista semiestructurada, guía de relevamiento y casos de uso.' },
    { nombre: 'Cuello Joaquín', rol: 'Crítico', foco: 'Auditoría de calidad, validación de reglas de negocio y análisis de riesgos FODA.' },
    { nombre: 'Florencia Fabatia', rol: 'Crítica', foco: 'Verificación de consistencia entre requisitos (RF/RNF), modelo DER y prototipo.' },
  ],
  stakeholders: [
    { actor: 'Tesorero', poder: 'Alto', interes: 'Alto', estrategia: 'Gestionar de cerca', rolSistema: 'tesorero', descripcion: 'Responsable de administrar los recursos económicos, validar cobros, autorizar modificaciones o anulaciones de pagos y emitir reportes.' },
    { actor: 'Secretaria', poder: 'Medio', interes: 'Alto', estrategia: 'Mantener involucrada', rolSistema: 'secretaria', descripcion: 'Utiliza el sistema diariamente para registrar alumnos, tutores, cuotas, cobros en ventanilla y comprobantes.' },
    { actor: 'Director', poder: 'Alto', interes: 'Medio', estrategia: 'Mantener informado', rolSistema: 'director', descripcion: 'Usuario de consulta ejecutiva. Accede a reportes generales sobre la situación económica y evolución de la recaudación.' },
    { actor: 'Padres / Tutores', poder: 'Bajo', interes: 'Alto', estrategia: 'Informar y atender consultas', rolSistema: 'tutor', descripcion: 'Responsables del pago de las cuotas sociales; consultan estados de deuda y descargan comprobantes de pago.' },
    { actor: 'Alumnos', poder: 'Bajo', interes: 'Medio', estrategia: 'Monitorear necesidades', rolSistema: null, descripcion: 'Beneficiarios indirectos de las mejoras edilicias, mantenimiento e insumos financiados por la cooperadora.' },
  ],
  preguntasEntrevista: [
    { n: 1, pregunta: '¿Cómo funciona actualmente el cobro de la cooperadora?', hallazgo: 'Se realiza de forma manual en planillas físicas y cuadernos, generando demoras al buscar historiales o verificar deudas.' },
    { n: 2, pregunta: '¿Quiénes administran los pagos?', hallazgo: 'La Secretaría realiza el cobro operativo diario y la Tesorera supervisa la caja, concilia transferencias y corrige errores.' },
    { n: 3, pregunta: '¿Qué datos necesitan guardar de cada alumno?', hallazgo: 'Nombre, apellido, DNI, curso (1° a 5° Año), división (A, B, C), turno (Mañana/Tarde) y su tutor asociado.' },
    { n: 4, pregunta: '¿Un tutor puede tener varios alumnos asociados?', hallazgo: 'Sí, existen numerosas familias con 2 o más hijos en la escuela representados por el mismo Padre/Tutor.' },
    { n: 5, pregunta: '¿Qué métodos de pago aceptan actualmente?', hallazgo: 'Efectivo en ventanilla y Transferencia bancaria (incluyendo transferencias desde billeteras virtuales al CBU escolar).' },
    { n: 6, pregunta: '¿Necesitan registrar comprobantes de pago?', hallazgo: 'Sí, cada pago debe generar un comprobante numerado e imprimible/PDF y guardar la referencia bancaria.' },
    { n: 7, pregunta: '¿Cómo controlan qué alumnos poseen cuotas pendientes?', hallazgo: 'Actualmente revisando planilla por planilla; requieren un semáforo automático (Pagada, Pendiente, Vencida).' },
    { n: 8, pregunta: '¿Qué tipos de usuarios utilizarán el sistema?', hallazgo: 'Secretaría (operativo), Tesorero (administrativo/fiscal), Director (consulta de reportes) y Padres/Tutores (consulta de estado y recibos).' },
    { n: 9, pregunta: '¿Quién puede modificar o eliminar un pago registrado por error?', hallazgo: 'Exclusivamente el Tesorero, dejando asentado el motivo en un historial de auditoría inmutable.' },
  ],
  requisitosFuncionales: [
    { codigo: 'RF-01', titulo: 'Registro de Alumnos', detalle: 'El sistema deberá registrar alumnos con sus datos personales (nombre, apellido, DNI), curso, división y turno.', modulo: 'Padrón Alumnos y Socios' },
    { codigo: 'RF-02', titulo: 'Registro de Tutores y Vínculo Familiar', detalle: 'El sistema deberá registrar tutores (Socios) y permitir asociar varios alumnos a un mismo tutor.', modulo: 'Padrón Alumnos y Socios' },
    { codigo: 'RF-03', titulo: 'Registro y Gestión de Cuotas', detalle: 'El sistema deberá registrar las cuotas mensuales o extraordinarias correspondientes a cada alumno.', modulo: 'Recepción y Cobros' },
    { codigo: 'RF-04', titulo: 'Registro de Pagos', detalle: 'El sistema deberá registrar pagos realizados en efectivo o mediante transferencia bancaria.', modulo: 'Recepción y Cobros' },
    { codigo: 'RF-05', titulo: 'Descuento Automático por Hermanos', detalle: 'El sistema deberá aplicar automáticamente el 20% de descuento cuando existan hermanos asociados al mismo tutor.', modulo: 'Recepción y Cobros' },
    { codigo: 'RF-06', titulo: 'Consulta de Cuotas Pendientes', detalle: 'El sistema deberá permitir consultar en tiempo real las cuotas pendientes, vencidas y pagadas de cada alumno.', modulo: 'Recepción / Portal Tutor' },
    { codigo: 'RF-07', titulo: 'Emisión de Comprobantes de Pago', detalle: 'El sistema deberá registrar y emitir comprobantes oficiales de pago en formato imprimible / PDF.', modulo: 'Recepción / Portal Tutor' },
    { codigo: 'RF-08', titulo: 'Reportes de Recaudación', detalle: 'El sistema deberá generar reportes dinámicos de recaudación, morosidad y desglose por curso y medio de pago.', modulo: 'Reportes y Métricas' },
    { codigo: 'RF-09', titulo: 'Diferenciación de Permisos por Rol', detalle: 'El sistema deberá diferenciar permisos entre Secretaría, Tesorero, Director y Padre/Tutor.', modulo: 'Control de Acceso Global' },
    { codigo: 'RF-10', titulo: 'Exclusividad Fiscal del Tesorero', detalle: 'Solo el Tesorero podrá validar, modificar o anular/eliminar pagos registrados por error.', modulo: 'Tesorería y Auditoría' },
  ],
  requisitosNoFuncionales: [
    { codigo: 'RNF-01', categoria: 'Seguridad', detalle: 'Cada usuario deberá acceder mediante un nombre de usuario y contraseña con permisos según su rol.' },
    { codigo: 'RNF-02', categoria: 'Integridad y Auditoría', detalle: 'Toda creación, modificación, validación o anulación de pagos queda registrada en una bitácora de auditoría con fecha, hora, operador y motivo.' },
    { codigo: 'RNF-03', categoria: 'Usabilidad', detalle: 'Interfaz intuitiva con modo claro/oscuro, feedback inmediato y diseño adaptable para facilitar el aprendizaje del personal escolar.' },
    { codigo: 'RNF-04', categoria: 'Disponibilidad y Respaldo', detalle: 'Disponibilidad inmediata en horario escolar con persistencia local, exportación de Backup JSON y planillas CSV.' },
    { codigo: 'RNF-05', categoria: 'Rendimiento', detalle: 'Arquitectura React reactiva en memoria que resuelve búsquedas de alumnos, cálculos de descuentos y reportes en milisegundos.' },
  ],
  historiasUsuario: [
    { codigo: 'HU-01', rol: 'Secretaria', prioridad: 'Alta', quiero: 'Registrar alumnos', para: 'Mantener actualizada la información de la cooperadora', criterios: ['Registrar nombre, apellido y DNI', 'Registrar curso, división y turno', 'Asociar un tutor existente o nuevo'] },
    { codigo: 'HU-02', rol: 'Secretaria', prioridad: 'Alta', quiero: 'Registrar pagos', para: 'Actualizar el estado de deuda del alumno', criterios: ['Registrar importe', 'Registrar fecha', 'Registrar método de pago y referencia'] },
    { codigo: 'HU-03', rol: 'Secretaria', prioridad: 'Alta', quiero: 'Consultar las cuotas pendientes', para: 'Informar correctamente a los tutores', criterios: ['Buscar por alumno, DNI o tutor', 'Mostrar cuotas pagadas, pendientes y vencidas'] },
    { codigo: 'HU-04', rol: 'Secretaria', prioridad: 'Alta', quiero: 'Que el sistema aplique automáticamente el descuento por hermanos', para: 'Evitar errores en el cálculo manual', criterios: ['Detectar alumnos asociados al mismo tutor', 'Calcular automáticamente el 20% de descuento'] },
    { codigo: 'HU-05', rol: 'Tesorero', prioridad: 'Alta', quiero: 'Modificar pagos registrados incorrectamente', para: 'Corregir errores administrativos', criterios: ['Solo el Tesorero puede modificar pagos', 'Registrar cada modificación y su motivo en el historial'] },
    { codigo: 'HU-06', rol: 'Tesorero', prioridad: 'Alta', quiero: 'Eliminar / anular pagos cargados por error', para: 'Mantener la información contable correcta', criterios: ['Solicitar confirmación y motivo obligatorio antes de anular', 'Revertir cuotas a Pendiente y registrar en auditoría'] },
    { codigo: 'HU-07', rol: 'Tesorero', prioridad: 'Media', quiero: 'Generar reportes de recaudación y arqueo de caja', para: 'Controlar los ingresos y egresos de la cooperadora', criterios: ['Filtrar por fechas/meses', 'Mostrar total recaudado, medios de pago y saldo de tesorería'] },
    { codigo: 'HU-08', rol: 'Padre / Tutor', prioridad: 'Media', quiero: 'Consultar el estado de mis cuotas y obtener comprobantes', para: 'Conocer si poseo pagos pendientes y descargar mis recibos', criterios: ['Visualizar cuotas pagadas y pendientes de mis hijos', 'Obtener comprobante oficial de pago imprimible'] },
    { codigo: 'HU-09', rol: 'Director', prioridad: 'Baja', quiero: 'Consultar reportes generales institucionales', para: 'Conocer la situación económica de la cooperadora', criterios: ['Mostrar la recaudación total acumulada y mensual', 'Mostrar cantidad de cuotas pagadas y pendientes por curso'] },
  ],
  foda: {
    fortalezas: [
      'Centraliza toda la información de socios, alumnos, cuotas y tesorería.',
      'Reduce drásticamente los errores en el cálculo manual y descuento de hermanos.',
      'Facilita el seguimiento en tiempo real de pagos y cuotas pendientes.',
      'Cuenta con permisos estrictamente diferenciados para cada uno de los 4 roles.'
    ],
    debilidades: [
      'El proyecto cuenta con presupuesto nulo ($0 de infraestructura).',
      'El tiempo de desarrollo académico es acotado (3 meses).',
      'Experiencia previa limitada del equipo en despliegues productivos complejos.',
      'La información histórica inicial debe migrarse desde planillas manuales.'
    ],
    oportunidades: [
      'Digitalizar un proceso clave de la institución educativa.',
      'Mejorar la transparencia y organización de la cooperadora frente a las familias.',
      'Disminuir el uso de papel mediante recibos digitales PDF e informes en pantalla.',
      'Ofrecer métricas confiables al Director y Tesorero para la toma de decisiones.'
    ],
    amenazas: [
      'Resistencia inicial al cambio por parte de usuarios acostumbrados al papel (Mitigado con UI intuitiva RNF-03).',
      'Posibles errores durante la carga inicial de datos (Mitigado con validaciones y edición de padrón).',
      'Pérdida de información si no existen copias de seguridad (Mitigado con módulo de Backup JSON/CSV).',
      'Fallas técnicas del equipo local (Mitigado con exportación e importación instantánea de respaldo).'
    ]
  }
};
