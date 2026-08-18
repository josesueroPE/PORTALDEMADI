alter table interpretes add column if not exists direccion text;
alter table interpretes add column if not exists telefono text;

-- Igual que actualizar_mis_datos_pago: scoped solo a direccion/telefono,
-- nunca a nombre/estado/proveedor_id/etc.
create or replace function actualizar_mis_datos_personales(p_direccion text, p_telefono text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update interpretes
  set direccion = p_direccion, telefono = p_telefono
  where user_id = auth.uid();
end;
$$;

grant execute on function actualizar_mis_datos_personales(text, text) to authenticated;
