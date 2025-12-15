const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const distPath = path.join(__dirname, 'dist');
const publicPath = __dirname;

app.use(express.static(distPath));
app.use(express.static(publicPath));

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devono essere configurate nelle variabili di ambiente');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, role, company_id, csirtcompanies(name)')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    company_name: data?.csirtcompanies?.name || null,
  };
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token di accesso mancante' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: 'Token non valido' });
  }

  req.authUser = data.user;
  try {
    req.profile = await fetchProfile(data.user.id);
  } catch (profileError) {
    return res.status(403).json({ error: 'Profilo non trovato o non accessibile' });
  }

  next();
}

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const profile = await fetchProfile(data.user.id);
    return res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: { id: data.user.id, email: data.user.email },
      profile,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/session', requireAuth, (req, res) => {
  res.json({
    user: { id: req.authUser.id, email: req.authUser.email },
    profile: req.profile,
  });
});

app.post('/api/auth/logout', async (req, res) => {
  const { refresh_token } = req.body || {};
  if (refresh_token) {
    await supabase.auth.admin.signOut(refresh_token);
  }
  res.json({ success: true });
});

app.get('/api/companies', requireAuth, async (req, res) => {
  try {
    let query = supabase.from('csirtcompanies').select('id, name, vat_number, fiscal_code, sector, address');

    if (req.profile.role === 'company' && req.profile.company_id) {
      query = query.eq('id', req.profile.company_id);
    }

    const { data, error } = await query.order('name');
    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/designations', requireAuth, async (req, res) => {
  if (!['admin', 'csirt'].includes(req.profile.role)) {
    return res.status(403).json({ error: 'Permessi insufficienti' });
  }

  const { companyData, designationData } = req.body;

  try {
    const { data: company, error: companyError } = await supabase
      .from('csirtcompanies')
      .upsert(companyData, { onConflict: 'vat_number' })
      .select()
      .single();

    if (companyError) throw companyError;

    const payload = { ...designationData, company_id: company.id };

    const { error: designationError } = await supabase
      .from('csirtdesignations')
      .upsert(payload, { onConflict: 'company_id' });

    if (designationError) throw designationError;

    res.json({ success: true, company });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/configurations', requireAuth, async (req, res) => {
  const configData = req.body;

  if (req.profile.role === 'company' && req.profile.company_id !== configData.company_id) {
    return res.status(403).json({ error: 'Non puoi modificare un\'altra azienda' });
  }

  try {
    const { error } = await supabase
      .from('csirtnetwork_configuration')
      .upsert(configData, { onConflict: 'company_id' });

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/incidents', requireAuth, async (req, res) => {
  const incidentData = { ...req.body, created_by: req.authUser.id };

  if (req.profile.role === 'company' && req.profile.company_id !== incidentData.company_id) {
    return res.status(403).json({ error: 'Non puoi registrare incidenti per un\'altra azienda' });
  }

  try {
    const { error } = await supabase
      .from('csirtincidents')
      .insert([incidentData]);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/incidents', requireAuth, async (req, res) => {
  try {
    let query = supabase
      .from('csirtincidents')
      .select('*, csirtcompanies(name)');

    if (req.profile.role === 'company' && req.profile.company_id) {
      query = query.eq('company_id', req.profile.company_id);
    }

    const { data, error } = await query.order('incident_datetime', { ascending: false });
    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }

  const distIndex = path.join(distPath, 'index.html');
  if (fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }

  return res.sendFile(path.join(publicPath, 'index.html'));
});

app.post('/api/notifications', requireAuth, async (req, res) => {
  const notificationData = req.body;

  try {
    if (req.profile.role === 'company') {
      const { data: incident, error: incidentError } = await supabase
        .from('csirtincidents')
        .select('company_id')
        .eq('id', notificationData.incident_id)
        .single();

      if (incidentError) throw incidentError;

      if (incident.company_id !== req.profile.company_id) {
        return res.status(403).json({ error: 'Non puoi notificare incidenti di altre aziende' });
      }
    }

    const { error } = await supabase
      .from('csirtnotifications')
      .insert([notificationData]);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notifications', requireAuth, async (req, res) => {
  try {
    let query = supabase
      .from('csirtnotifications')
      .select('*, csirtincidents(title)')
      .order('created_at', { ascending: false });

    if (req.profile.role === 'company' && req.profile.company_id) {
      query = query.eq('company_id', req.profile.company_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', requireAuth, async (req, res) => {
  if (req.profile.role !== 'admin') {
    return res.status(403).json({ error: 'Solo gli Admin possono vedere gli utenti' });
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, csirtcompanies(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', requireAuth, async (req, res) => {
  if (req.profile.role !== 'admin') {
    return res.status(403).json({ error: 'Solo gli Admin possono creare utenti' });
  }

  const { email, password, name, role, company_id } = req.body;

  try {
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (createError) throw createError;

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: userData.user.id, name, role, company_id: company_id || null }]);

    if (profileError) throw profileError;

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server proxy avviato sulla porta ${PORT}`);
});
