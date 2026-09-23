-- Recibos duplicados (ej. Lila con dos "Recibo N° 1"): el numero se calculaba
-- en la app como ultimo_recibo + 1 y el contador se guardaba despues, en un
-- paso aparte que fallaba sin avisar (antes de 20260921000000). Ahora la base
-- de datos reserva el numero en un solo paso, nunca por debajo del recibo mas
-- alto que ya existe, y un indice unico impide que se repita.

-- 1) Reparar duplicados existentes: renumerar por periodo a partir del numero
--    mas bajo de ese interprete (Lila: Julio = 1, Agosto = 2).
with afectados as (
  select interprete_id
  from recibos
  where tipo = 'interprete'
  group by interprete_id
  having count(*) <> count(distinct numero)
),
renumerados as (
  select r.id,
         min(r.numero) over (partition by r.interprete_id)
           + row_number() over (partition by r.interprete_id order by r.periodo, r.created_at) - 1
           as nuevo
  from recibos r
  join afectados a using (interprete_id)
  where r.tipo = 'interprete'
)
update recibos r set numero = n.nuevo
from renumerados n
where r.id = n.id;

-- 2) Poner cada contador al dia con los recibos que ya existen.
update interpretes i
set ultimo_recibo = m.max_numero
from (
  select interprete_id, max(numero) as max_numero
  from recibos
  where tipo = 'interprete'
  group by interprete_id
) m
where m.interprete_id = i.id
  and i.ultimo_recibo < m.max_numero;

-- 3) Nunca mas dos recibos con el mismo numero para el mismo interprete.
create unique index if not exists recibos_interprete_numero_unico
  on recibos (interprete_id, numero)
  where tipo = 'interprete';

-- 4) Reservar el siguiente numero de forma atomica.
create or replace function reservar_mi_numero_recibo()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_numero integer;
begin
  update interpretes i
  set ultimo_recibo = greatest(
        i.ultimo_recibo,
        coalesce((select max(numero) from recibos r
                  where r.interprete_id = i.id and r.tipo = 'interprete'), 0)
      ) + 1
  where i.user_id = auth.uid()
  returning i.ultimo_recibo into v_numero;

  if v_numero is null then
    raise exception 'No se encontró tu file de intérprete';
  end if;
  return v_numero;
end;
$$;

grant execute on function reservar_mi_numero_recibo() to authenticated;

drop function if exists actualizar_mi_ultimo_recibo(integer);
