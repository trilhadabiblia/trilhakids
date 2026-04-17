// ============================================
// AUTH DO PROFESSOR — TRILHO KIDS
// Shared entre login.html, dashboard.html e admin/index.html
// ============================================

const PROF_API = (() => {
  const h = location.hostname;
  return (h === 'localhost' || h === '127.0.0.1')
    ? 'http://localhost:8080'
    : 'https://cafecomhomensdedeus.com.br/trilhokids/api';
})();

// ── Armazenamento do token ───────────────────
const Auth = {
  getToken()  { return localStorage.getItem('tk_prof_token'); },
  getProf()   {
    try { return JSON.parse(localStorage.getItem('tk_prof_data') || 'null'); }
    catch { return null; }
  },
  salvar(token, prof) {
    localStorage.setItem('tk_prof_token', token);
    localStorage.setItem('tk_prof_data',  JSON.stringify(prof));
  },
  limpar() {
    localStorage.removeItem('tk_prof_token');
    localStorage.removeItem('tk_prof_data');
  },
  isAdmin() { return !!this.getProf()?.is_admin; },
};

// ── Fetch autenticado ────────────────────────
async function apiAuth(endpoint, options = {}) {
  const token = Auth.getToken();
  const res = await fetch(`${PROF_API}/${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
    ...options,
  });
  return res.json();
}

// ── Redireciona para login se não autenticado ─
function checkAuth(requireAdmin = false) {
  const token = Auth.getToken();
  const prof  = Auth.getProf();

  if (!token || !prof) {
    window.location.href = '/professor/login.html';
    return false;
  }
  if (requireAdmin && !prof.is_admin) {
    window.location.href = '/professor/dashboard.html';
    return false;
  }
  return true;
}

// ── Logout ───────────────────────────────────
function logout() {
  Auth.limpar();
  window.location.href = '/professor/login.html';
}
