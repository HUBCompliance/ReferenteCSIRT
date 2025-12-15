# Configurazione Supabase per utenti demo

Questi passaggi spiegano dove creare gli utenti di prova indicati nel login (Admin, Referente CSIRT, Referente Aziendale) usando Supabase.

## 0. Configurare le chiavi Supabase nel backend
1. Recupera l'URL del progetto e la **Service role key** da **Settings → API → Project API keys** nella dashboard Supabase.
2. Crea un file `.env` nella radice del progetto (puoi copiare `.env.example`) e incolla i valori:
   ```env
   SUPABASE_URL=https://<your-project>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ```
   > Non serve modificare `server.js`: le chiavi vengono lette automaticamente dal file `.env` grazie a `dotenv`.
3. Avvia l'app con `npm start` (usa questo comando anche in locale: **non** usare solo `npm run dev`, perché il proxy `/api` verrebbe mancato e il login risponderebbe con "Errore di rete").
4. Riavvia `npm start` (o il processo del server Node) dopo ogni modifica alle variabili di ambiente.

> **Nota:** queste chiavi non devono essere esposte lato browser; restano solo nel backend `server.js`.

## 1. Creare gli utenti in Supabase Auth
1. Apri la dashboard Supabase del progetto.
2. Vai su **Authentication → Users**.
3. Clicca **Add user** e inserisci le credenziali desiderate (esempio: `admin@csirt.it / password123`).
4. Spunta **Confirm email** per evitare il flusso di verifica.
5. Ripeti per ogni utente demo necessario.

> **Nota:** il campo `id` dell'utente creato in Auth verrà usato come chiave primaria nella tabella `profiles`.

## 2. Popolare la tabella `profiles`
1. Apri **SQL Editor** oppure **Table Editor** in Supabase.
2. Inserisci un record per ogni utente creato in Auth con le colonne richieste dall'applicazione:
   - `id`: UUID dell'utente da Auth
   - `name`: nome visualizzato in app
   - `role`: uno tra `admin`, `csirt`, `company`
   - `company_id`: UUID dell'azienda associata (solo per il ruolo `company`; altrimenti `NULL`).

### Esempio SQL di inserimento
```sql
insert into public.profiles (id, name, role, company_id)
values
  ('<uuid-admin>', 'Admin Demo', 'admin', null),
  ('<uuid-csirt>', 'Referente CSIRT Demo', 'csirt', null),
  ('<uuid-company>', 'Azienda Demo', 'company', '<uuid-azienda>');
```

Assicurati che `<uuid-azienda>` esista nella tabella `csirtcompanies` per i profili aziendali; in caso contrario, crea prima l'azienda oppure lascialo `NULL` e assegnalo in seguito.

## 3. Verifica rapida
- Effettua il login dal form principale con le credenziali appena create.
- Se usi il ruolo `company`, controlla che il campo `company_id` in `profiles` punti alla tua azienda per vedere solo i suoi dati.

Seguendo questi passaggi i tre utenti demo del login saranno utilizzabili nell'ambiente Supabase collegato alla piattaforma.
