alter table interpretes add column if not exists cedula text;

drop function if exists actualizar_mis_datos_personales(text, text);

create or replace function actualizar_mis_datos_personales(p_direccion text, p_telefono text, p_cedula text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update interpretes
  set direccion = p_direccion, telefono = p_telefono, cedula = p_cedula
  where user_id = auth.uid();
end;
$$;

grant execute on function actualizar_mis_datos_personales(text, text, text) to authenticated;
