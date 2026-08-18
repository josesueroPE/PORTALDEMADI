-- Madi Consulting — esquema inicial
-- Cubre: proveedores, interpretes, RRHH, credenciales, minutos por periodo,
-- recibos (individuales y consolidados), beneficiarios de pago,
-- comprobantes de pago, quejas, tareas/bitacora y notas.

-- ---------- staff interno (Jose y socio) ----------
-- Unicas cuentas con acceso total. Todo lo demas (interpretes, proveedores)
-- solo ve su propia informacion via RLS.
create table staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);

create or replace function is_staff()
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from staff where user_id = auth.uid());
$$;

-- ---------- proveedores (Maria, Ericka, Rigoberto, Douglas, Earny...) ----------
create table proveedores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  nombre text not null,
  email text,
  cedula text,
  direccion text,
  pais text,
  -- true = el proveedor siempre se paga a si mismo el 100% (Douglas, Earny)
  paga_a_si_mismo boolean not null default false,
  -- beneficiario fijo por defecto (ej. Rigoberto -> cuenta de su padre); precarga el builder, sigue siendo editable
  beneficiario_default_nombre text,
  beneficiario_default_metodo text,
  beneficiario_default_detalle text,
  ultimo_recibo integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- interpretes (locadores) ----------
create table interpretes (
  id uuid primary key default gen_random_uuid(),
  -- solo se llena si es intérprete directo con acceso al portal;
  -- los reclutados via proveedor NUNCA tienen user_id (sin acceso, por diseño)
  user_id uuid unique references auth.users(id) on delete set null,
  nombre text not null,
  email text,
  pais text,
  proveedor_id uuid references proveedores(id) on delete set null,
  estado text not null default 'Onboarding'
    check (estado in ('Activo','Onboarding','Sin actividad','Inactivo')),
  fecha_ingreso date,
  metodo_pago text check (metodo_pago in ('Transferencia bancaria','Payoneer','PayPal')),
  datos_pago text,
  -- Peru: el recibo lo emiten ellos mismos en SUNAT, el portal no genera nada
  genera_recibo_propio boolean not null default true,
  ultimo_recibo integer not null default 0,
  created_at timestamptz not null default now()
);

create index on interpretes (proveedor_id);

-- ---------- file RRHH ----------
create table interprete_documentos (
  interprete_id uuid primary key references interpretes(id) on delete cascade,
  cv boolean not null default false,
  cv_url text,
  government_id boolean not null default false,
  government_id_url text,
  ficha_evaluacion boolean not null default false,
  ficha_evaluacion_url text,
  contrato_firmado boolean not null default false,
  contrato_url text,
  updated_at timestamptz not null default now()
);

-- ---------- credenciales recicladas (Propio, TTG, Maven — Lionbridge no aplica) ----------
create table credenciales (
  id uuid primary key default gen_random_uuid(),
  plataforma text not null check (plataforma in ('Propio','TTG','Maven')),
  usuario text not null,
  asignado_a uuid references interpretes(id) on delete set null,
  fecha_asignacion date,
  created_at timestamptz not null default now()
);

create index on credenciales (asignado_a);

-- ---------- minutos por periodo (lo que se importa de la planilla mensual) ----------
create table minutos_periodo (
  id uuid primary key default gen_random_uuid(),
  interprete_id uuid not null references interpretes(id) on delete cascade,
  periodo date not null, -- primer dia del mes, ej. 2026-06-01 = "Junio 2026"
  plataforma text not null check (plataforma in ('Propio','TTG','Maven','LB')),
  minutos integer not null default 0,
  tarifa numeric(6,4) not null, -- se define a mano cada periodo (viene de la planilla)
  created_at timestamptz not null default now(),
  unique (interprete_id, periodo, plataforma)
);

create index on minutos_periodo (periodo);

-- ---------- recibos (individuales o consolidados de proveedor) ----------
create table recibos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('interprete','proveedor')),
  interprete_id uuid references interpretes(id) on delete cascade,
  proveedor_id uuid references proveedores(id) on delete cascade,
  numero integer not null,
  periodo date not null,
  fecha date not null default current_date,
  total numeric(10,2) not null,
  pdf_url text,
  created_at timestamptz not null default now(),
  constraint recibo_dueno_valido check (
    (tipo = 'interprete' and interprete_id is not null and proveedor_id is null) or
    (tipo = 'proveedor' and proveedor_id is not null and interprete_id is null)
  )
);

create index on recibos (interprete_id);
create index on recibos (proveedor_id);

create table recibo_lineas (
  id uuid primary key default gen_random_uuid(),
  recibo_id uuid not null references recibos(id) on delete cascade,
  plataforma text not null,
  minutos integer not null,
  tarifa numeric(6,4) not null,
  subtotal numeric(10,2) not null
);

create index on recibo_lineas (recibo_id);

-- solo aplica a recibos de proveedor: a quien se transfiere el pago
create table recibo_beneficiarios (
  id uuid primary key default gen_random_uuid(),
  recibo_id uuid not null references recibos(id) on delete cascade,
  nombre text not null,
  metodo text not null,
  detalle text,
  monto numeric(10,2) not null
);

create index on recibo_beneficiarios (recibo_id);

-- ---------- comprobantes de pago (Payoneer/banco — prueba de pago, no el recibo) ----------
create table comprobantes_pago (
  id uuid primary key default gen_random_uuid(),
  recibo_id uuid references recibos(id) on delete set null,
  monto numeric(10,2) not null,
  fee numeric(10,2) not null default 0,
  monto_total numeric(10,2) not null,
  metodo text,
  fecha date,
  referencia text,
  created_at timestamptz not null default now()
);

create index on comprobantes_pago (recibo_id);

-- ---------- quejas ----------
create table quejas (
  id uuid primary key default gen_random_uuid(),
  interprete_id uuid not null references interpretes(id) on delete cascade,
  plataforma text not null,
  fecha date not null,
  detalle text,
  correo_cliente text,
  resolucion text,
  retiro_id boolean not null default false,
  created_at timestamptz not null default now()
);

create index on quejas (interprete_id);

-- ---------- tareas / bitacora (kanban interno, solo staff) ----------
create table tareas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  estado text not null default 'Pendiente'
    check (estado in ('Pendiente','En Progreso','Resuelto')),
  asignado_a text,
  interprete_id uuid references interpretes(id) on delete set null,
  created_at timestamptz not null default now()
);

create table tarea_historial (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references tareas(id) on delete cascade,
  fecha date not null default current_date,
  autor text not null,
  accion text not null
);

create index on tarea_historial (tarea_id);

create table notas (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  autor text not null,
  texto text not null,
  created_at timestamptz not null default now()
);

-- ======================================================================
-- Row Level Security — cada quien ve solo lo suyo; staff ve todo.
-- ======================================================================

alter table staff enable row level security;
alter table proveedores enable row level security;
alter table interpretes enable row level security;
alter table interprete_documentos enable row level security;
alter table credenciales enable row level security;
alter table minutos_periodo enable row level security;
alter table recibos enable row level security;
alter table recibo_lineas enable row level security;
alter table recibo_beneficiarios enable row level security;
alter table comprobantes_pago enable row level security;
alter table quejas enable row level security;
alter table tareas enable row level security;
alter table tarea_historial enable row level security;
alter table notas enable row level security;

-- staff: solo el propio staff puede verse a si mismo en esa tabla
create policy staff_self_select on staff for select using (user_id = auth.uid());
create policy staff_all_access on staff for all using (is_staff()) with check (is_staff());

-- proveedores: staff todo; el proveedor solo su propia fila
create policy proveedores_staff on proveedores for all using (is_staff()) with check (is_staff());
create policy proveedores_self on proveedores for select using (user_id = auth.uid());

-- interpretes: staff todo; el interprete directo solo su propia fila
create policy interpretes_staff on interpretes for all using (is_staff()) with check (is_staff());
create policy interpretes_self on interpretes for select using (user_id = auth.uid());

-- documentos RRHH: staff todo; el interprete puede ver (no editar) su propio file
create policy documentos_staff on interprete_documentos for all using (is_staff()) with check (is_staff());
create policy documentos_self on interprete_documentos for select using (
  interprete_id in (select id from interpretes where user_id = auth.uid())
);

-- credenciales: solo staff (dato operativo interno, ningun locador debe verlo)
create policy credenciales_staff on credenciales for all using (is_staff()) with check (is_staff());

-- minutos_periodo: staff todo; interprete ve los suyos; proveedor ve los de su equipo
create policy minutos_staff on minutos_periodo for all using (is_staff()) with check (is_staff());
create policy minutos_interprete on minutos_periodo for select using (
  interprete_id in (select id from interpretes where user_id = auth.uid())
);
create policy minutos_proveedor on minutos_periodo for select using (
  interprete_id in (
    select i.id from interpretes i
    join proveedores p on p.id = i.proveedor_id
    where p.user_id = auth.uid()
  )
);

-- recibos: staff todo; interprete ve los suyos; proveedor ve los suyos (no los de sus locadores individualmente)
create policy recibos_staff on recibos for all using (is_staff()) with check (is_staff());
create policy recibos_interprete on recibos for select using (
  interprete_id in (select id from interpretes where user_id = auth.uid())
);
create policy recibos_interprete_insert on recibos for insert with check (
  interprete_id in (select id from interpretes where user_id = auth.uid())
);
create policy recibos_proveedor on recibos for select using (
  proveedor_id in (select id from proveedores where user_id = auth.uid())
);
create policy recibos_proveedor_insert on recibos for insert with check (
  proveedor_id in (select id from proveedores where user_id = auth.uid())
);

-- recibo_lineas / recibo_beneficiarios: siguen el acceso del recibo padre
create policy recibo_lineas_staff on recibo_lineas for all using (is_staff()) with check (is_staff());
create policy recibo_lineas_dueno on recibo_lineas for select using (
  recibo_id in (
    select r.id from recibos r
    left join interpretes i on i.id = r.interprete_id
    left join proveedores p on p.id = r.proveedor_id
    where i.user_id = auth.uid() or p.user_id = auth.uid()
  )
);
create policy recibo_lineas_insert on recibo_lineas for insert with check (
  recibo_id in (
    select r.id from recibos r
    left join interpretes i on i.id = r.interprete_id
    left join proveedores p on p.id = r.proveedor_id
    where i.user_id = auth.uid() or p.user_id = auth.uid()
  )
);

create policy recibo_beneficiarios_staff on recibo_beneficiarios for all using (is_staff()) with check (is_staff());
create policy recibo_beneficiarios_dueno on recibo_beneficiarios for select using (
  recibo_id in (select id from recibos where proveedor_id in (select id from proveedores where user_id = auth.uid()))
);
create policy recibo_beneficiarios_insert on recibo_beneficiarios for insert with check (
  recibo_id in (select id from recibos where proveedor_id in (select id from proveedores where user_id = auth.uid()))
);

-- comprobantes_pago, quejas, tareas, tarea_historial, notas: solo staff (uso interno)
create policy comprobantes_staff on comprobantes_pago for all using (is_staff()) with check (is_staff());
create policy quejas_staff on quejas for all using (is_staff()) with check (is_staff());
create policy tareas_staff on tareas for all using (is_staff()) with check (is_staff());
create policy tarea_historial_staff on tarea_historial for all using (is_staff()) with check (is_staff());
create policy notas_staff on notas for all using (is_staff()) with check (is_staff());
