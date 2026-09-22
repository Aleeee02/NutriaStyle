from pydantic import BaseModel


class LoginBody(BaseModel):
    email: str
    password: str


class RegistroBody(BaseModel):
    nombre: str
    apellido: str | None = None
    telefono: str | None = None
    email: str
    password: str


class SessionBody(BaseModel):
    access_token: str


class CanjeBody(BaseModel):
    codigo: str


class AsistenciaBody(BaseModel):
    codigo: str
    asistio: bool


class RolBody(BaseModel):
    rol: str


class PerfilBody(BaseModel):
    nombre: str
    apellido: str
    telefono: str


class ReservaCreateBody(BaseModel):
    servicio_id: str
    empleado_id: str
    fecha: str
    hora_inicio: str
    observaciones: str | None = None


class ServicioBody(BaseModel):
    nombre: str
    categoria_id: str
    descripcion: str | None = None
    precio: float
    duracion_minutos: int
    imagen_url: str | None = None
    activo: bool | None = None


class EmpleadoBody(BaseModel):
    nombre: str
    apellido: str | None = None
    telefono: str | None = None
    descripcion: str | None = None
    foto_url: str | None = None
    activo: bool | None = None


class HorarioBody(BaseModel):
    dia_semana: int
    hora_inicio: str
    hora_fin: str


class EstadoReservaBody(BaseModel):
    estado: str


class ConfiguracionBody(BaseModel):
    nombre_barberia: str
    telefono_whatsapp: str | None = None
    direccion: str | None = None
    horario: str | None = None
    instagram_url: str | None = None
    facebook_url: str | None = None
    mision: str | None = None
    vision: str | None = None
