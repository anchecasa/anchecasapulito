-- app-30 · Prezzo dell'artigiano (decisione di Nando, 12.10.2026 16:04)
-- Artigiano: primo mese gratis, secondo e terzo mese 14,90 €/mese senza costo per lavoro;
-- dal quarto mese 19,90 €/mese più 5,90 € per lavoro fatto, pagati nell'app (il cliente prenota e paga con l'app).
-- Qui solo il costo per lavoro: 0 € nei primi 3 mesi dall'iscrizione (aziende_stato.prova_dal), poi 5,90 €.
-- I lavori già confermati non cambiano. Nessuna tabella nuova, nessun dato cancellato.

alter table marketplace.guasti alter column fee set default 5.90;

create or replace function marketplace.guasti_fee_artigiano()
returns trigger language plpgsql security definer set search_path = marketplace, public as $$
begin
  if new.stato = 'confermato' and old.stato is distinct from 'confermato' and new.artigiano_id is not null then
    new.fee := case
      when exists (select 1 from marketplace.aziende_stato s
                   where s.azienda_id = new.artigiano_id
                     and s.prova_dal + interval '3 months' > coalesce(new.confermato_il, now()))
      then 0 else 5.90 end;
  end if;
  return new;
end $$;

drop trigger if exists guasti_fee_artigiano on marketplace.guasti;
create trigger guasti_fee_artigiano before update of stato on marketplace.guasti
  for each row execute function marketplace.guasti_fee_artigiano();
