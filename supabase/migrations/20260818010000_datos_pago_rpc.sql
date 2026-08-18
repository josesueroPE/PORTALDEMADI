-- Permite que cada interprete actualice SOLO su metodo/datos de pago,
-- sin abrir una politica de UPDATE amplia sobre toda la fila
-- (que dejaria tocar estado, proveedor_id, ultimo_recibo, etc.).
create or replace function actualizar_mis_datos_pago(p_metodo text, p_datos text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_metodo not in ('Transferencia bancaria', 'Payoneer', 'PayPal') then
    raise exception 'Metodo de pago invalido';
  end if;

  update interpretes
  set metodo_pago = p_metodo, datos_pago = p_datos
  where user_id = auth.uid();
end;
$$;

grant execute on function actualizar_mis_datos_pago(text, text) to authenticated;
