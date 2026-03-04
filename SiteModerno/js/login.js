const PASS_HASH = '1e96752d590ab228b3ec4a6825c83cae7a6839aaec912ac23f7d14d7a8d052be';

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function checkAccess() {
    return sessionStorage.getItem('shumei_access_granted') === 'true';
}

function showLoginModal() {
    const overlay = document.createElement('div');
    overlay.className = 'login-overlay';
    overlay.innerHTML = `
        <div class="login-modal">
            <h2 style="font-family: var(--font-serif); color: var(--text-main); margin-top: 0;">Acesso Restrito</h2>
            <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">Por favor, insira a senha para acessar o acervo da Biblioteca Sagrada.</p>
            <input type="password" id="accessPassword" class="login-input" placeholder="Senha de acesso" autofocus>
            <button class="login-button" onclick="verifyPassword()">Acessar</button>
            <p id="loginError" style="color: var(--accent); font-size: 13px; margin-top: 15px; display: none;">Senha incorreta. Tente novamente.</p>
        </div>
    `;
    document.body.appendChild(overlay);

    const input = document.getElementById('accessPassword');
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') verifyPassword();
    });
}

async function verifyPassword() {
    const input = document.getElementById('accessPassword');
    const pwd = input.value;
    const hash = await sha256(pwd);
    
    if (hash === PASS_HASH) {
        sessionStorage.setItem('shumei_access_granted', 'true');
        const overlay = document.querySelector('.login-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }
    } else {
        const err = document.getElementById('loginError');
        err.style.display = 'block';
        input.value = '';
        input.focus();
        
        // Shake animation
        const modal = document.querySelector('.login-modal');
        modal.style.transform = 'translate(-50%, -50%) translateX(10px)';
        setTimeout(() => modal.style.transform = 'translate(-50%, -50%) translateX(-10px)', 100);
        setTimeout(() => modal.style.transform = 'translate(-50%, -50%) translateX(10px)', 200);
        setTimeout(() => modal.style.transform = 'translate(-50%, -50%) translateX(0)', 300);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Only require login on the root index or paths that don't already have access granted
    if (!checkAccess()) {
        showLoginModal();
    }
});
