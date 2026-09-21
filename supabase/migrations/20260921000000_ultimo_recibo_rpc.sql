-- El intérprete no tiene permiso de UPDATE directo sobre su propia fila de
-- interpretes (a propósito, para que no pueda tocar estado/proveedor_id/etc.).
-- Eso incluía sin querer a ultimo_recibo, así que generar un recibo nunca
-- lograba avanzar el contador. Esta funcion, igual que las de datos_pago y
-- datos_personales, solo toca esa columna.
create or replace function actualizar_mi_ultimo_recibo(p_numero integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update interpretes set ultimo_recibo = p_numero where user_id = auth.uid();
end;
$$;

grant execute on function actualizar_mi_ultimo_recibo(integer) to authenticated;
