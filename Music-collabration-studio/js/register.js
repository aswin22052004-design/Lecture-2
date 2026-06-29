/* ==============================
   REGISTER PAGE SCRIPT
   ============================== */

function togglePw(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
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
  ['name', 'email', 'password', 'confirm'].forEach(id => setFieldError(id, ''));
  document.getElementById('authMessage').style.display = 'none';
}

// Password strength indicator
document.addEventListener('DOMContentLoaded', () => {
  const pwInput = document.getElementById('password');
  if (!pwInput) return;

  pwInput.addEventListener('input', () => {
    const val = pwInput.value;
    const fill = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    if (!fill || !label) return;

    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const levels = ['', 'weak', 'fair', 'good', 'strong', 'strong'];
    const labels = ['Enter a password', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];

    fill.className = 'strength-fill ' + (levels[score] || '');
    label.className = 'strength-label ' + (levels[score] || '');
    label.textContent = labels[score] || 'Enter a password';
  });
});

async function handleRegister(e) {
  e.preventDefault();
  clearErrors();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const terms = document.getElementById('terms').checked;
  const btn = document.getElementById('registerBtn');

  let valid = true;
  if (!name || name.length < 2) { setFieldError('name', 'Full name is required (min 2 chars)'); valid = false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError('email', 'Enter a valid email address'); valid = false; }
  if (!password || password.length < 6) { setFieldError('password', 'Password must be at least 6 characters'); valid = false; }
  if (password !== confirmPassword) { setFieldError('confirm', 'Passwords do not match'); valid = false; }
  if (!terms) { showMessage('✗ Please accept the Terms of Service to continue', 'error'); valid = false; }
  if (!valid) return;

  btn.classList.add('loading');
  btn.innerHTML = '<span class="auth-btn-spinner"></span>Creating account...';

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      showMessage('✓ Account created! Redirecting to login...', 'success');
      setTimeout(() => window.location.href = '/login.html', 1500);
    } else {
      showMessage('✗ ' + (data.error || 'Registration failed'), 'error');
    }
  } catch (err) {
    showMessage('✗ Network error. Please try again.', 'error');
  } finally {
    btn.classList.remove('loading');
    btn.innerHTML = 'Create Account';
  }
}
