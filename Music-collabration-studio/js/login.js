/* ==============================
   LOGIN PAGE SCRIPT
   ============================== */

function togglePw() {
  const input = document.getElementById('password');
  const btn = document.getElementById('pwToggle');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

function showMessage(text, type) {
  const el = document.getElementById('authMessage');
  el.textContent = text;
  el.className = 'auth-message ' + type;
  el.style.display = 'flex';
}

function hideMessage() {
  const el = document.getElementById('authMessage');
  el.style.display = 'none';
}

function setFieldError(id, msg) {
  const input = document.getElementById(id);
  const errEl = document.getElementById(id + 'Error');
  if (input) input.classList.toggle('is-invalid', !!msg);
  if (errEl) {
    errEl.textContent = msg || '';
    errEl.classList.toggle('visible', !!msg);
  }
}

function clearErrors() {
  ['email', 'password'].forEach(id => setFieldError(id, ''));
  hideMessage();
}

async function handleLogin(e) {
  e.preventDefault();
  clearErrors();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('loginBtn');

  // Client-side validation
  let valid = true;
  if (!email) { setFieldError('email', 'Email is required'); valid = false; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError('email', 'Enter a valid email'); valid = false; }
  if (!password) { setFieldError('password', 'Password is required'); valid = false; }
  if (!valid) return;

  // Loading state
  btn.classList.add('loading');
  btn.innerHTML = '<span class="auth-btn-spinner"></span>Signing in...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      showMessage('✓ Login successful! Redirecting...', 'success');
      setTimeout(() => window.location.href = '/dashboard', 1000);
    } else {
      showMessage('✗ ' + (data.error || 'Login failed'), 'error');
    }
  } catch (err) {
    showMessage('✗ Network error. Please try again.', 'error');
  } finally {
    btn.classList.remove('loading');
    btn.innerHTML = 'Sign In';
  }
}

function handleForgot(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  if (!email) {
    setFieldError('email', 'Enter your email first');
    return;
  }
  showMessage('✓ If that email exists, a reset link has been sent.', 'success');
}

// Restore remembered email
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('mcs_remembered_email');
  if (saved) {
    document.getElementById('email').value = saved;
    document.getElementById('rememberMe').checked = true;
  }

  document.getElementById('loginForm').addEventListener('submit', (e) => {
    const remember = document.getElementById('rememberMe').checked;
    const email = document.getElementById('email').value.trim();
    if (remember) localStorage.setItem('mcs_remembered_email', email);
    else localStorage.removeItem('mcs_remembered_email');
  });
});
