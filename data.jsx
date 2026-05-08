// Viáticos — datos seed
const CENTROS = [
  { id: "100020009", nombre: "VANES",          depto: "Operaciones" },
  { id: "100020011", nombre: "FL360",          depto: "Operaciones" },
  { id: "100020008", nombre: "PASAJE",         depto: "Operaciones" },
  { id: "100020007", nombre: "CARGA",          depto: "Operaciones" },
  { id: "100020010", nombre: "TRACTO",         depto: "Operaciones" },
  { id: "100020012", nombre: "SEMIRREMOLQUES", depto: "Operaciones" },
  { id: "100020017", nombre: "REFACCIONES",    depto: "Refacciones" },
  { id: "100020002", nombre: "SEMINUEVOS",     depto: "Comercial" },
  { id: "100010009", nombre: "ADMINISTRACIÓN", depto: "Administración" },
  { id: "100030001", nombre: "TALLER",         depto: "Servicio" },
];

const CATALOGO_GASTOS = [
  { cuenta: "6122900001", nombre: "Pasajes Nacionales", grupo: "Transporte", icon: "✈" },
  { cuenta: "6122900002", nombre: "Peaje", grupo: "Transporte", icon: "🛣" },
  { cuenta: "6122900003", nombre: "Alojamiento Nacional", grupo: "Hospedaje", icon: "🏨" },
  { cuenta: "6122900004", nombre: "Estacionamiento", grupo: "Transporte", icon: "P" },
  { cuenta: "6122900005", nombre: "Comidas", grupo: "Alimentos", icon: "🍽" },
  { cuenta: "6122900006", nombre: "Renta de Vehículos", grupo: "Transporte", icon: "🚗" },
  { cuenta: "6120800001", nombre: "Gasolina", grupo: "Transporte", icon: "⛽" },
  { cuenta: "6121200001", nombre: "No Deducibles", grupo: "Otros", icon: "—" },
  { cuenta: "6122700001", nombre: "Otros Impuestos (TUA)", grupo: "Impuestos", icon: "%" },
];

const USUARIOS = [
  { id: "U001", nombre: "Ana Lucía Reyes",      correo: "ana.reyes@viaticos.mx",     rol: "usuario",    centro: "100020007", gerente: "U101", iniciales: "AR", password: "1234" },
  { id: "U002", nombre: "Bruno Cárdenas",        correo: "bruno.cardenas@viaticos.mx", rol: "usuario",    centro: "100020007", gerente: "U101", iniciales: "BC", password: "1234" },
  { id: "U003", nombre: "Camila Ortega",         correo: "camila.ortega@viaticos.mx", rol: "usuario",    centro: "100020010", gerente: "U102", iniciales: "CO", password: "1234" },
  { id: "U004", nombre: "Diego Hernández",       correo: "diego.hernandez@viaticos.mx", rol: "usuario",  centro: "100020010", gerente: "U102", iniciales: "DH", password: "1234" },
  { id: "U005", nombre: "Elena Martínez",        correo: "elena.martinez@viaticos.mx", rol: "usuario",   centro: "100020017", gerente: "U103", iniciales: "EM", password: "1234" },
  { id: "U006", nombre: "Fernando Quiroz",       correo: "fernando.quiroz@viaticos.mx", rol: "usuario",  centro: "100030001", gerente: "U104", iniciales: "FQ", password: "1234" },
  { id: "U007", nombre: "Gabriela Solís",        correo: "gabriela.solis@viaticos.mx", rol: "usuario",   centro: "100020002", gerente: "U102", iniciales: "GS", password: "1234" },
  { id: "U008", nombre: "Héctor Pineda",         correo: "hector.pineda@viaticos.mx", rol: "usuario",    centro: "100020008", gerente: "U101", iniciales: "HP", password: "1234" },
  { id: "U101", nombre: "Mariana Téllez",        correo: "mariana.tellez@viaticos.mx", rol: "gerente",   centro: "100020007", gerente: null,    iniciales: "MT", password: "1234" },
  { id: "U102", nombre: "Ricardo Lozano",        correo: "ricardo.lozano@viaticos.mx", rol: "gerente",   centro: "100020010", gerente: null,    iniciales: "RL", password: "1234" },
  { id: "U103", nombre: "Sofía Aragón",          correo: "sofia.aragon@viaticos.mx", rol: "gerente",     centro: "100020017", gerente: null,    iniciales: "SA", password: "1234" },
  { id: "U104", nombre: "Tomás Beltrán",         correo: "tomas.beltran@viaticos.mx", rol: "gerente",    centro: "100030001", gerente: null,    iniciales: "TB", password: "1234" },
  { id: "T001", nombre: "Valeria Guzmán",        correo: "valeria.guzman@viaticos.mx", rol: "tesoreria", centro: "100010009", gerente: null,    iniciales: "VG", password: "1234" },
  { id: "T002", nombre: "Wences Olivares",       correo: "wences.olivares@viaticos.mx", rol: "tesoreria", centro: "100010009", gerente: null,    iniciales: "WO", password: "1234" },
  { id: "A001", nombre: "Ximena Rojas",          correo: "ximena.rojas@viaticos.mx", rol: "admin",       centro: "100010009", gerente: null,    iniciales: "XR", password: "1234" },
];

const HOY = new Date(2026, 4, 7); // 7 mayo 2026

function diasAtras(n) {
  const d = new Date(HOY);
  d.setDate(d.getDate() - n);
  return d;
}
function fmtFecha(d) {
  const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${String(d.getDate()).padStart(2,"0")} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtMXN(n) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }).format(n);
}

// SOLICITUDES — anticipos, comprobaciones, reembolsos
// status: solicitado | autorizado | liberado | rechazado | comprobado | parcial
const SOLICITUDES = [
  { id: "ANT-2026-0142", tipo: "anticipo", concepto: "Visita comercial Monterrey - 3 días", usuario: "U001", monto: 8500, fecha: diasAtras(2),  status: "solicitado",  saldoPendiente: 8500, comprobantes: 0 },
  { id: "ANT-2026-0141", tipo: "anticipo", concepto: "Capacitación regional Bajío",        usuario: "U002", monto: 12400, fecha: diasAtras(4), status: "autorizado",  saldoPendiente: 12400, comprobantes: 0 },
  { id: "ANT-2026-0140", tipo: "anticipo", concepto: "Auditoría planta Querétaro",         usuario: "U004", monto: 6300, fecha: diasAtras(7),  status: "liberado",    saldoPendiente: 6300, comprobantes: 0 },
  { id: "ANT-2026-0138", tipo: "anticipo", concepto: "Feria industrial Guadalajara",       usuario: "U001", monto: 15600, fecha: diasAtras(18),status: "liberado",    saldoPendiente: 4200, comprobantes: 5 },
  { id: "ANT-2026-0135", tipo: "anticipo", concepto: "Cliente estratégico CDMX",           usuario: "U003", monto: 4800, fecha: diasAtras(35), status: "comprobado",  saldoPendiente: 0, comprobantes: 7 },
  { id: "ANT-2026-0130", tipo: "anticipo", concepto: "Implementación TI sucursal Puebla",  usuario: "U006", monto: 22000, fecha: diasAtras(48),status: "liberado",    saldoPendiente: 11500, comprobantes: 8 },
  { id: "ANT-2026-0125", tipo: "anticipo", concepto: "Junta accionistas Tijuana",          usuario: "U007", monto: 18900, fecha: diasAtras(72),status: "liberado",    saldoPendiente: 18900, comprobantes: 0 },
  { id: "ANT-2026-0118", tipo: "anticipo", concepto: "Evento patrocinio Mérida",           usuario: "U005", monto: 9400, fecha: diasAtras(95), status: "liberado",    saldoPendiente: 9400, comprobantes: 0 },
  { id: "ANT-2026-0102", tipo: "anticipo", concepto: "Negociación proveedor Saltillo",     usuario: "U008", monto: 5600, fecha: diasAtras(120), status: "liberado",   saldoPendiente: 5600, comprobantes: 0 },

  { id: "CMP-2026-0287", tipo: "comprobacion", concepto: "Comprobación ANT-2026-0138 (parcial)", usuario: "U001", monto: 11400, fecha: diasAtras(3), status: "solicitado", anticipoRef: "ANT-2026-0138", comprobantes: 5 },
  { id: "CMP-2026-0285", tipo: "comprobacion", concepto: "Comprobación ANT-2026-0135",           usuario: "U003", monto: 4800, fecha: diasAtras(10), status: "comprobado", anticipoRef: "ANT-2026-0135", comprobantes: 7 },
  { id: "CMP-2026-0283", tipo: "comprobacion", concepto: "Comprobación ANT-2026-0130 (parcial)", usuario: "U006", monto: 10500, fecha: diasAtras(14), status: "autorizado", anticipoRef: "ANT-2026-0130", comprobantes: 8 },

  { id: "REE-2026-0064", tipo: "reembolso", concepto: "Comida con cliente sin anticipo",    usuario: "U002", monto: 1850, fecha: diasAtras(1),  status: "solicitado", comprobantes: 1 },
  { id: "REE-2026-0063", tipo: "reembolso", concepto: "Taxi aeropuerto + estacionamiento",   usuario: "U005", monto: 920,  fecha: diasAtras(5),  status: "autorizado", comprobantes: 2 },
  { id: "REE-2026-0061", tipo: "reembolso", concepto: "Hotel emergencia visita cliente",      usuario: "U004", monto: 3400, fecha: diasAtras(9),  status: "liberado",   comprobantes: 1 },
  { id: "REE-2026-0058", tipo: "reembolso", concepto: "Caseta + gasolina ruta Toluca",        usuario: "U008", monto: 1280, fecha: diasAtras(15), status: "rechazado",  comprobantes: 2, motivoRechazo: "Falta XML de la factura de gasolina" },
];

// Comprobantes (líneas dentro de comprobaciones)
const COMPROBANTES_DEMO = [
  { id: "C-9821", uuid: "A4F2-7B6C-9D1E", emisor: "Aeromexico Servicios", concepto: "Vuelo MEX-MTY redondo", subtotal: 4310, iva: 689.6, total: 4999.6, fecha: diasAtras(17), cuenta: "6122900001", confianza: 0.97 },
  { id: "C-9822", uuid: "B81C-2E4D-7A09", emisor: "ASUR Aeropuertos",      concepto: "TUA vuelo MEX-MTY",   subtotal: 540, iva: 86.4, total: 626.4, fecha: diasAtras(17), cuenta: "6122700001", confianza: 0.92 },
  { id: "C-9823", uuid: "33D7-9E8F-A102", emisor: "Hotel Camino Real MTY", concepto: "Hospedaje 2 noches",   subtotal: 2780, iva: 444.8, total: 3224.8, fecha: diasAtras(15), cuenta: "6122900003", confianza: 0.98 },
  { id: "C-9824", uuid: "AA92-4F1B-7CC6", emisor: "Pemex Estación 4421",  concepto: "Magna 45.2 lt",        subtotal: 1086, iva: 173.76, total: 1259.76, fecha: diasAtras(14), cuenta: "6120800001", confianza: 0.99 },
  { id: "C-9825", uuid: "F1D6-8E3A-22BC", emisor: "Restaurante La Nogalera", concepto: "Comida cliente x4",  subtotal: 1290, iva: 206.4, total: 1496.4, fecha: diasAtras(14), cuenta: "6122900005", confianza: 0.88 },
];

// Helpers
function findUser(id) { return USUARIOS.find(u => u.id === id); }
function findCentro(id) { return CENTROS.find(c => c.id === id); }
function findCuenta(id) { return CATALOGO_GASTOS.find(c => c.cuenta === id); }


// Auth helpers
window.AUTH_TOKENS = {}; // email -> { token, expires }

function findUserByEmail(email) {
  return USUARIOS.find(u => u.correo.toLowerCase() === email.toLowerCase());
}
function checkPassword(correo, pwd) {
  const u = findUserByEmail(correo);
  return u && u.password === pwd ? u : null;
}
function generateToken(correo) {
  const token = Math.random().toString(36).slice(2, 10).toUpperCase();
  window.AUTH_TOKENS[correo] = { token, expires: Date.now() + 15 * 60000 };
  return token;
}
function verifyToken(correo, token) {
  const rec = window.AUTH_TOKENS[correo];
  if (!rec) return false;
  if (Date.now() > rec.expires) { delete window.AUTH_TOKENS[correo]; return false; }
  return rec.token === token.toUpperCase();
}

Object.assign(window, { findUserByEmail, checkPassword, generateToken, verifyToken });

Object.assign(window, {
  CENTROS, CATALOGO_GASTOS, USUARIOS, SOLICITUDES, COMPROBANTES_DEMO,
  HOY, diasAtras, fmtFecha, fmtMXN, findUser, findCentro, findCuenta,
});
