-- =============================================================================
-- Nutria Style - base de datos completa para Supabase
-- =============================================================================
-- Como usarlo en un proyecto NUEVO de Supabase:
--   1. Supabase > SQL Editor > New query
--   2. Pega TODO este archivo y pulsa "Run"
--   3. Sigue los pasos de "DESPUES DE CORRERLO" al final del archivo
--
-- Contiene: las 12 tablas que usa la app (incluidos los cambios hechos despues
-- del esquema original: roles, vinculo empleado-usuario, TikTok, enlace de
-- resenas de Google y la tabla de resenas), indices, seguridad (RLS) y los
-- datos iniciales del negocio (categorias, servicios, barbero, horarios y
-- configuracion).
--
-- Los usuarios NO se pueden crear desde aqui: viven en auth.users y se crean
-- al registrarse en la web. Ver el paso 2 del final para volver a ser admin.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Usuarios y roles
-- -----------------------------------------------------------------------------
create table public.usuarios (
  id uuid not null,
  nombre character varying not null,
  apellido character varying,
  email character varying,
  telefono character varying,
  fecha_registro timestamp with time zone default now(),
  activo boolean default true,
  -- cliente: reserva y acumula sellos | barbero: escanea QR | admin: todo el panel
  rol character varying not null default 'cliente'
    check (rol::text = any (array['cliente', 'barbero', 'admin']::text[])),
  constraint usuarios_pkey primary key (id),
  constraint usuarios_id_fkey foreign key (id) references auth.users (id)
);

-- -----------------------------------------------------------------------------
-- Equipo
-- -----------------------------------------------------------------------------
create table public.empleados (
  id uuid not null default gen_random_uuid(),
  nombre character varying not null,
  apellido character varying,
  telefono character varying,
  foto_url text,
  descripcion text,
  activo boolean default true,
  created_at timestamp with time zone default now(),
  -- cuenta del barbero en la web (opcional)
  usuario_id uuid unique references public.usuarios (id),
  constraint empleados_pkey primary key (id)
);

create table public.horarios_empleado (
  id uuid not null default gen_random_uuid(),
  empleado_id uuid not null,
  -- 0 = domingo ... 6 = sabado
  dia_semana integer not null check (dia_semana >= 0 and dia_semana <= 6),
  hora_inicio time without time zone not null,
  hora_fin time without time zone not null,
  activo boolean default true,
  constraint horarios_empleado_pkey primary key (id),
  constraint horarios_empleado_empleado_id_fkey foreign key (empleado_id) references public.empleados (id)
);

-- -----------------------------------------------------------------------------
-- Catalogo de servicios
-- -----------------------------------------------------------------------------
create table public.categorias_servicio (
  id uuid not null default gen_random_uuid(),
  nombre character varying not null,
  descripcion text,
  activo boolean default true,
  created_at timestamp with time zone default now(),
  constraint categorias_servicio_pkey primary key (id)
);

create table public.servicios (
  id uuid not null default gen_random_uuid(),
  categoria_id uuid not null,
  nombre character varying not null,
  descripcion text,
  precio numeric not null check (precio >= 0::numeric),
  duracion_minutos integer not null check (duracion_minutos > 0),
  imagen_url text,
  activo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint servicios_pkey primary key (id),
  constraint servicios_categoria_id_fkey foreign key (categoria_id) references public.categorias_servicio (id)
);

-- -----------------------------------------------------------------------------
-- Reservas
-- -----------------------------------------------------------------------------
create table public.reservas (
  id uuid not null default gen_random_uuid(),
  usuario_id uuid not null,
  empleado_id uuid not null,
  servicio_id uuid not null,
  fecha date not null,
  hora_inicio time without time zone not null,
  hora_fin time without time zone not null,
  estado character varying not null default 'pendiente'::character varying
    check (estado::text = any (array['pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio']::text[])),
  observaciones text,
  whatsapp_confirmado boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint reservas_pkey primary key (id),
  constraint reservas_usuario_id_fkey foreign key (usuario_id) references public.usuarios (id),
  constraint reservas_empleado_id_fkey foreign key (empleado_id) references public.empleados (id),
  constraint reservas_servicio_id_fkey foreign key (servicio_id) references public.servicios (id)
);

-- -----------------------------------------------------------------------------
-- Fidelizacion (tarjeta de sellos)
-- -----------------------------------------------------------------------------
create table public.tarjetas_fidelizacion (
  id uuid not null default gen_random_uuid(),
  usuario_id uuid not null unique,
  puntos integer default 0 check (puntos >= 0),
  sellos integer default 0 check (sellos >= 0),
  nivel character varying default 'basico'::character varying
    check (nivel::text = any (array['basico', 'premium', 'vip']::text[])),
  fecha_creacion timestamp with time zone default now(),
  activo boolean default true,
  constraint tarjetas_fidelizacion_pkey primary key (id),
  constraint tarjetas_fidelizacion_usuario_id_fkey foreign key (usuario_id) references public.usuarios (id)
);

-- -----------------------------------------------------------------------------
-- Ventas (aun no las usa la web, pero estaban en el esquema original)
-- -----------------------------------------------------------------------------
create table public.ventas (
  id uuid not null default gen_random_uuid(),
  usuario_id uuid,
  reserva_id uuid unique,
  empleado_id uuid,
  subtotal numeric not null default 0 check (subtotal >= 0::numeric),
  descuento numeric not null default 0 check (descuento >= 0::numeric),
  total numeric not null default 0 check (total >= 0::numeric),
  metodo_pago character varying
    check (metodo_pago is null or (metodo_pago::text = any (array['efectivo', 'yape', 'plin', 'tarjeta', 'otro']::text[]))),
  estado character varying not null default 'pendiente'::character varying
    check (estado::text = any (array['pendiente', 'pagada', 'cancelada']::text[])),
  fecha timestamp with time zone default now(),
  constraint ventas_pkey primary key (id),
  constraint ventas_reserva_id_fkey foreign key (reserva_id) references public.reservas (id),
  constraint ventas_empleado_id_fkey foreign key (empleado_id) references public.empleados (id),
  constraint ventas_usuario_id_fkey foreign key (usuario_id) references public.usuarios (id)
);

create table public.detalle_venta (
  id uuid not null default gen_random_uuid(),
  venta_id uuid not null,
  servicio_id uuid not null,
  cantidad integer not null default 1 check (cantidad > 0),
  precio_unitario numeric not null check (precio_unitario >= 0::numeric),
  subtotal numeric not null check (subtotal >= 0::numeric),
  constraint detalle_venta_pkey primary key (id),
  constraint detalle_venta_venta_id_fkey foreign key (venta_id) references public.ventas (id),
  constraint detalle_venta_servicio_id_fkey foreign key (servicio_id) references public.servicios (id)
);

create table public.movimientos_fidelizacion (
  id uuid not null default gen_random_uuid(),
  tarjeta_id uuid not null,
  venta_id uuid,
  tipo character varying not null
    check (tipo::text = any (array['ganancia', 'uso', 'ajuste']::text[])),
  cantidad integer not null,
  descripcion text,
  fecha timestamp with time zone default now(),
  constraint movimientos_fidelizacion_pkey primary key (id),
  constraint movimientos_fidelizacion_tarjeta_id_fkey foreign key (tarjeta_id) references public.tarjetas_fidelizacion (id),
  constraint movimientos_fidelizacion_venta_id_fkey foreign key (venta_id) references public.ventas (id)
);

-- -----------------------------------------------------------------------------
-- Resenas propias del sitio (Google no permite publicar resenas desde fuera)
-- -----------------------------------------------------------------------------
create table public.resenas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id),
  -- una sola resena por cita
  reserva_id uuid not null unique references public.reservas (id),
  empleado_id uuid references public.empleados (id),
  calificacion integer not null check (calificacion between 1 and 5),
  comentario text,
  -- no se muestra en la web hasta que el admin la aprueba
  aprobada boolean not null default false,
  created_at timestamp with time zone default now()
);

-- -----------------------------------------------------------------------------
-- Datos del negocio
-- -----------------------------------------------------------------------------
create table public.configuracion (
  id uuid not null default gen_random_uuid(),
  nombre_barberia character varying not null,
  logo_url text,
  telefono_whatsapp character varying,
  direccion text,
  mision text,
  vision text,
  horario text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  -- enlace directo a "escribir resena" del Perfil de Empresa de Google
  resenas_google_url text,
  activo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint configuracion_pkey primary key (id)
);

-- -----------------------------------------------------------------------------
-- Indices para las consultas frecuentes (disponibilidad y agenda)
-- -----------------------------------------------------------------------------
create index reservas_empleado_fecha_idx on public.reservas (empleado_id, fecha);
create index reservas_usuario_fecha_idx on public.reservas (usuario_id, fecha);
create index reservas_estado_fecha_idx on public.reservas (estado, fecha);
create index horarios_empleado_dia_idx on public.horarios_empleado (empleado_id, dia_semana);
create index movimientos_tarjeta_idx on public.movimientos_fidelizacion (tarjeta_id);
create index resenas_aprobada_idx on public.resenas (aprobada, created_at desc);

-- -----------------------------------------------------------------------------
-- Seguridad: RLS activo y SIN politicas en todas las tablas.
-- Asi nadie puede leer ni escribir con la clave publica (anon); solo el
-- backend, que usa la clave service_role y valida permisos en cada endpoint.
-- -----------------------------------------------------------------------------
alter table public.usuarios enable row level security;
alter table public.empleados enable row level security;
alter table public.horarios_empleado enable row level security;
alter table public.categorias_servicio enable row level security;
alter table public.servicios enable row level security;
alter table public.reservas enable row level security;
alter table public.tarjetas_fidelizacion enable row level security;
alter table public.ventas enable row level security;
alter table public.detalle_venta enable row level security;
alter table public.movimientos_fidelizacion enable row level security;
alter table public.resenas enable row level security;
alter table public.configuracion enable row level security;

-- =============================================================================
-- DATOS INICIALES
-- =============================================================================

insert into public.configuracion
  (nombre_barberia, telefono_whatsapp, direccion, horario, mision, vision, tiktok_url)
values (
  'NutriaStyle',
  '51930381147',
  'Av. Mariscal Cáceres 540, Iquitos 16001',
  'Lunes a Sábado, 09:00 - 20:00',
  'Brindar servicios de barbería de calidad y una excelente experiencia a nuestros clientes.',
  'Ser una barbería reconocida por su calidad, atención y fidelización de clientes.',
  'https://www.tiktok.com/@nutria208'
);

insert into public.categorias_servicio (nombre) values
  ('Cortes'),
  ('Barba'),
  ('Combos'),
  ('Otros');

-- Precios en soles. Los nombres "Corte Clásico" y "Corte con Diseño" importan:
-- la web los usa para saber a que servicios aplica el 20% de FF.AA./PNP.
insert into public.servicios (categoria_id, nombre, descripcion, precio, duracion_minutos)
select c.id, s.nombre, s.descripcion, s.precio, s.duracion
from (values
  ('Cortes', 'Corte Clásico',              null::text,                                                                                                                    15, 45),
  ('Cortes', 'Corte con Diseño',           null,                                                                                                                          20, 45),
  ('Barba',  'Barba',                      null,                                                                                                                          10, 25),
  ('Otros',  'Cejas',                      'Arreglo de cejas.',                                                                                                            5, 15),
  ('Combos', 'Combo 1 · Corte Clásico',    'Corte clásico + mascarilla facial + una bebida de cortesía. Precio fijo para todos, no acumulable con otros descuentos.',                     20, 45),
  ('Combos', 'Combo 2 · Corte con Diseño', 'Corte con diseño + arreglo de ceja + mascarilla facial + una bebida de cortesía. Precio fijo para todos, no acumulable con otros descuentos.', 25, 60)
) as s (categoria, nombre, descripcion, precio, duracion)
join public.categorias_servicio c on c.nombre = s.categoria;

-- Barbero y su horario semanal (el que tenia cargado en el panel)
with barbero as (
  insert into public.empleados (nombre, apellido) values ('Mateo', 'Silva') returning id
)
insert into public.horarios_empleado (empleado_id, dia_semana, hora_inicio, hora_fin)
select barbero.id, h.dia, h.inicio::time, h.fin::time
from barbero, (values
  (0, '09:00', '21:00'),  -- domingo
  (1, '09:00', '18:00'),  -- lunes
  (2, '09:00', '21:00'),  -- martes
  (3, '09:00', '21:00'),  -- miercoles
  (4, '09:00', '21:00'),  -- jueves
  (5, '09:00', '21:00'),  -- viernes
  (6, '09:00', '21:00')   -- sabado
) as h (dia, inicio, fin);

commit;

-- =============================================================================
-- DESPUES DE CORRERLO
-- =============================================================================
-- 1. Registrate en la web (con tu correo o con Google). Al iniciar sesion la
--    app crea sola tu fila en "usuarios" y tu tarjeta de sellos.
--
-- 2. Vuelve a hacerte admin. Corre esto en el SQL Editor con TU correo:
--
--      update public.usuarios set rol = 'admin' where email = 'aesalazarsencia02@gmail.com';
--
-- 3. Si un barbero tiene cuenta, se le da el rol desde Admin > Usuarios.
-- =============================================================================
