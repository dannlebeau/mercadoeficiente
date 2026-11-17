-- Esquema inicial: licitaciones, ítems y registro de consultas a la API.

create extension if not exists unaccent;

-- Búsqueda en español sin distinguir tildes ("construccion" = "construcción").
do $$
begin
  if not exists (select 1 from pg_ts_config where cfgname = 'es_sin_tildes') then
    create text search configuration es_sin_tildes (copy = spanish);
    alter text search configuration es_sin_tildes
      alter mapping for hword, hword_part, word with unaccent, spanish_stem;
  end if;
end $$;

create table licitaciones (
  codigo              text primary key,
  nombre              text not null,
  codigo_estado       integer,
  estado              text,
  descripcion         text,
  tipo                text,
  organismo_codigo    text,
  organismo_nombre    text,
  unidad_nombre       text,
  rut_unidad          text,
  region              text,
  comuna              text,
  monto_estimado      numeric,
  moneda              text,
  fecha_publicacion   timestamptz,
  fecha_cierre        timestamptz,
  fecha_adjudicacion  timestamptz,
  -- Respuesta completa de la API, para no perder campos que aún no se usan.
  detalle             jsonb,
  detalle_en          timestamptz,
  visto_en_listado    timestamptz,
  creado_en           timestamptz not null default now(),
  actualizado_en      timestamptz not null default now(),
  busqueda tsvector generated always as (
    setweight(to_tsvector('es_sin_tildes', coalesce(nombre, '')), 'A') ||
    setweight(to_tsvector('es_sin_tildes', coalesce(descripcion, '')), 'B') ||
    setweight(to_tsvector('es_sin_tildes', coalesce(organismo_nombre, '')), 'C')
  ) stored
);

create index licitaciones_busqueda_idx on licitaciones using gin (busqueda);
create index licitaciones_cierre_idx on licitaciones (fecha_cierre);
create index licitaciones_region_idx on licitaciones (region);
create index licitaciones_estado_idx on licitaciones (codigo_estado);
create index licitaciones_pendientes_idx on licitaciones (detalle_en nulls first);

create table items (
  codigo_licitacion   text not null references licitaciones (codigo) on delete cascade,
  correlativo         integer not null,
  codigo_producto     text,
  codigo_categoria    text,
  categoria           text,
  nombre_producto     text,
  descripcion         text,
  cantidad            numeric,
  unidad              text,
  proveedor_rut       text,
  proveedor_nombre    text,
  cantidad_adjudicada numeric,
  monto_unitario      numeric,
  primary key (codigo_licitacion, correlativo)
);

-- Rubro = segmento UNSPSC (2 primeros dígitos del código de producto).
create index items_rubro_idx on items (left(codigo_producto, 2));
create index items_proveedor_idx on items (proveedor_rut);

-- Consultas gastadas por día (hora de Chile), para no pasar el límite del ticket.
create table consultas_api (
  dia     date primary key,
  usadas  integer not null default 0
);
