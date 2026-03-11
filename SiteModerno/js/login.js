// ============================================================
// Unified Authentication — Mioshie College
// Uses localStorage for persistence across sessions
// ============================================================
const PASS_HASH = '97a6d21df7c51e8289ac1a8c026aaac143e15aa1957f54f42e30d8f8a85c3a55';

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function checkAuth() {
  return localStorage.getItem('shumei_auth') === 'true';
}

function showLoginOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'login-overlay';
  overlay.innerHTML = `
    <div class="login-card">
      <h2>Mioshie College</h2>
      <p style="color: var(--text-muted); margin-bottom: 24px;">Insira a senha para acessar</p>
      <input type="password" id="login-pass" class="login-input" placeholder="Senha">
      <button id="login-submit" class="login-button">Entrar</button>
      <p id="login-error" style="color: #ff3b30; margin-top: 16px; font-size: 0.9rem; display: none;">Senha incorreta</p>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = document.getElementById('login-pass');
  const submit = document.getElementById('login-submit');
  const error = document.getElementById('login-error');

  const attempt = async () => {
    const pass = input.value.trim();
    if (!pass) return;
    try {
      let hashHex = '';
      if (window.crypto && crypto.subtle) {
        hashHex = await sha256(pass);
      } else {
        // Fallback for non-secure contexts (e.g., file://)
        if (pass === '567') {
          localStorage.setItem('shumei_auth', 'true');
          overlay.remove();
          return;
        }
      }

      if (hashHex === PASS_HASH) {
        localStorage.setItem('shumei_auth', 'true');
        overlay.remove();
      } else {
        error.style.display = 'block';
        input.value = '';
        input.focus();
      }
    } catch (e) {
      console.error('Auth error:', e);
      error.style.display = 'block';
    }
  };

  submit.onclick = attempt;
  input.onkeypress = (e) => { if (e.key === 'Enter') attempt(); };
  input.focus();
}

// Auto-run on page load
(function () {
  const init = () => {
    if (!checkAuth()) showLoginOverlay();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
