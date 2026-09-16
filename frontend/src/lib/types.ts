export interface CurrentUser {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
  display_name: string;
  nombre: string;
  apellido: string;
  telefono: string;
  perfil_completo: boolean;
  rol: string;
  is_admin: boolean;
  is_staff: boolean;
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface Servicio {
  id: string;
  categoria_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracion_minutos: number;
  imagen_url: string | null;
  activo: boolean;
  categorias_servicio?: { nombre: string } | null;
}

export interface Empleado {
  id: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  foto_url: string | null;
  descripcion: string | null;
  activo: boolean;
  usuario_id: string | null;
}

export interface Horario {
  id: string;
  empleado_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

export interface Reserva {
  id: string;
  usuario_id: string;
  empleado_id: string;
  servicio_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  observaciones: string | null;
  usuarios?: { nombre: string; apellido: string | null; email: string | null } | null;
  servicios?: { nombre: string; precio?: number } | null;
  empleados?: { nombre: string; apellido: string | null } | null;
}

export interface Tarjeta {
  id: string;
  usuario_id: string;
  sellos: number;
  puntos: number;
  nivel: string;
  activo: boolean;
}

export interface FidelizacionData {
  tarjeta: Tarjeta | null;
  sellos_meta: number;
  proxima_cita: Reserva | null;
  historial: Reserva[];
  codigo_canje: string | null;
}

export interface CanjeVistaPrevia {
  cliente: { nombre: string; apellido: string | null; email: string | null } | null;
  sellos: number;
  sellos_meta: number;
}

export interface Configuracion {
  id?: string;
  nombre_barberia: string;
  telefono_whatsapp: string | null;
  direccion: string | null;
  horario: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  mision: string | null;
  vision: string | null;
}

export interface UsuarioAdmin {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
  rol: string;
  sellos: number;
  nivel: string;
  faltan: number;
  listo_para_canjear: boolean;
}

export const DIAS_SEMANA: Array<[number, string]> = [
  [0, "Domingo"],
  [1, "Lunes"],
  [2, "Martes"],
  [3, "Miércoles"],
  [4, "Jueves"],
  [5, "Viernes"],
  [6, "Sábado"],
];

export const ESTADOS_RESERVA = ["pendiente", "confirmada", "completada", "cancelada", "no_asistio"];
