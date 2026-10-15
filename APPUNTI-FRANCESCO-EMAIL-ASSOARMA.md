# Per Francesco · email di benvenuto Assoarma a tutti gli iscritti

**Quando:** entro stasera (15.10.2026). Domani c'è la presentazione e chi si iscrive deve ricevere subito l'email.

## Situazione

- Sul sito demo Assoarma, in home, c'è il modulo **«Resta aggiornato»** (nome, cognome, email). Chi si iscrive riceve in pochi secondi un'email di benvenuto dall'Ufficio Stampa.
- Database, coda delle email e invio sono già attivi su Supabase (progetto **ANCHECASA**, Edge Function `assoarma-email`, che spedisce con **Resend**).
- **Problema:** su Resend non c'è ancora un dominio verificato. Il mittente è `onboarding@resend.dev`, quindi Resend consegna **solo all'email del proprietario dell'account** (Nando). Agli altri risponde con un errore 403.
- Il dominio `anchecasa.it` ha il DNS su **Cloudflare**.

## Cosa fare (circa 15 minuti)

### 1. Resend: verificare il dominio
1. Accedi a resend.com con l'account di Nando (palumbofernando12@gmail.com) o fatti invitare nel team.
2. **Domains → Add domain** → `anchecasa.it`, regione **EU (Ireland)**.
3. Premi **Auto configure / Sign in to Cloudflare** e autorizza: Resend crea da solo i record DNS.
   Se non c'è il pulsante, aggiungi a mano in Cloudflare (`anchecasa.it` → DNS) i record che mostra Resend:
   - MX e TXT (SPF) sul sottodominio `send`;
   - TXT DKIM `resend._domainkey`.
   Tutti con la nuvoletta **grigia** (DNS only).
4. I record stanno su `send.anchecasa.it`, quindi non toccano le caselle email attuali né l'Email Routing di Cloudflare.
5. Aspetta lo stato **Verified**.

### 2. Supabase: il mittente
Progetto ANCHECASA → **Edge Functions → Secrets** → aggiungi:

| Nome | Valore |
|---|---|
| `MITTENTE` | `Ufficio Stampa Assoarma <ufficiostampa@anchecasa.it>` |
| `RISPONDI_A` | la casella dove leggere le risposte (es. la Gmail di Nando) |

`RESEND_API_KEY` c'è già. Non serve rideployare la funzione: legge i segreti a ogni invio.

### 3. Facoltativo: ricevere le risposte su ufficiostampa@
Cloudflare → `anchecasa.it` → **Email → Email Routing** → regola `ufficiostampa@anchecasa.it` → inoltro alla Gmail di Nando.

### 4. Prova
- Iscriviti dal sito con una **tua** email (non quella di Nando): https://assoarma.anchecasa.it/#resta-aggiornato
- L'email deve arrivare entro un minuto, da «Ufficio Stampa Assoarma».
- Se non arriva, controlla in Supabase → SQL Editor:
  ```sql
  select a_email, stato, errore, creata from assoarma_demo.notifiche order by creata desc limit 10;
  ```

### 5. Rimandare le email non partite
Dopo la verifica, rimanda le email rimaste in errore:

```sql
update assoarma_demo.notifiche set stato = 'da_inviare', errore = ''
where tipo = 'aggiornamenti' and stato = 'errore';
select assoarma_demo.spedisci_ora();
```

## Regole
- Le chiavi (Resend, Cloudflare) non vanno mai scritte nel codice, nei file o in chat: solo nei Secrets.
- La cartella `assoarma/` non va su GitHub (repository pubblico): questo appunto è l'unico file che parla della demo.

Quando hai finito, avvisa Nando: Claude rifà la prova con un indirizzo diverso.
