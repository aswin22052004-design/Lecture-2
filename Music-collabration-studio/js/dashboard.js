/* ==============================
   DASHBOARD SCRIPT
   ============================== */

let currentUser = null;
let projects = [];
let currentProjectId = null;
let contributors = [];

// ==============================
// INIT
// ==============================
window.addEventListener('DOMContentLoaded', async () => {
  await loadUser();
  await loadProjects();
  drawCharts();
});

async function loadUser() {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) { window.location.href = '/login.html'; return; }
    currentUser = await res.json();

    const initial = currentUser.name ? currentUser.name[0].toUpperCase() : '?';
    ['sidebarAvatar', 'topnavAvatar', 'settingsAvatar'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = initial;
    });
    const nameEls = ['sidebarName', 'greetName', 'settingsName'];
    nameEls.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = currentUser.name || 'Artist';
    });
    const emailEl = document.getElementById('settingsEmail');
    if (emailEl) emailEl.textContent = currentUser.email || '';
    const nameInput = document.getElementById('settingsNameInput');
    if (nameInput) nameInput.value = currentUser.name || '';
  } catch (err) {
    window.location.href = '/login.html';
  }
}

async function loadProjects() {
  try {
    const res = await fetch('/api/project');
    if (!res.ok) return;
    projects = await res.json();

    document.getElementById('projectCount').textContent = projects.length;
    document.getElementById('statProjects').textContent = projects.length;

    let totalFiles = 0, totalCollabs = 0, totalVersions = 0;
    projects.forEach(p => {
      totalFiles += (p.audioFiles || []).length;
      totalCollabs += (p.collaborators || []).length;
      totalVersions += (p.versions || []).length;
    });
    document.getElementById('statFiles').textContent = totalFiles;
    document.getElementById('statCollabs').textContent = totalCollabs;
    document.getElementById('statVersions').textContent = totalVersions;

    renderRecentProjects();
    populateProjectSelects();
    renderProjectsGrid();
  } catch (err) {
    console.error('Failed to load projects', err);
  }
}

function renderRecentProjects() {
  const tbody = document.getElementById('recentProjectsBody');
  if (!tbody) return;
  if (!projects.length) {
    tbody.innerHTML = `<tr><td colspan="3" style="color:#4a5568;text-align:center;padding:24px;">No projects yet. <span style="color:#6c63ff;cursor:pointer;" onclick="showPage('upload',document.querySelector('[data-page=upload]'))">Upload your first track →</span></td></tr>`;
    return;
  }
  tbody.innerHTML = projects.slice(0, 5).map(p => `
    <tr>
      <td>
        <div class="project-name-cell">
          <div class="project-thumb">🎵</div>
          <div>
            <div class="project-name">${escHtml(p.title)}</div>
            <div class="project-genre">${escHtml(p.genre || 'No genre')}</div>
          </div>
        </div>
      </td>
      <td><span class="status-badge ${p.status || 'active'}">${p.status || 'active'}</span></td>
      <td>${timeAgo(p.updatedAt)}</td>
    </tr>
  `).join('');
}

function renderProjectsGrid() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  if (!projects.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:64px;color:#4a5568;">
      <div style="font-size:3rem;margin-bottom:16px;">🎵</div>
      <div style="font-size:1.1rem;color:#8892b0;margin-bottom:20px;">No projects yet. Start by creating one!</div>
      <button class="dash-btn-primary" onclick="openNewProjectModal()">+ Create First Project</button>
    </div>`;
    return;
  }
  grid.innerHTML = projects.map(p => `
    <div class="feature-card" style="cursor:default;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="width:44px;height:44px;background:linear-gradient(135deg,#6c63ff,#a855f7);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">🎵</div>
        <span class="status-badge ${p.status || 'active'}">${p.status || 'active'}</span>
      </div>
      <h3 style="font-size:1rem;font-weight:700;color:#f0f4ff;margin-bottom:6px;">${escHtml(p.title)}</h3>
      <p style="font-size:0.82rem;color:#8892b0;margin-bottom:16px;line-height:1.5;">${escHtml(p.description || 'No description')}</p>
      <div style="display:flex;gap:16px;font-size:0.78rem;color:#4a5568;margin-bottom:16px;">
        <span>🎵 ${(p.audioFiles||[]).length} files</span>
        <span>👥 ${(p.collaborators||[]).length} members</span>
        <span>🕐 ${(p.versions||[]).length} versions</span>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="dash-btn-primary" style="flex:1;padding:8px;font-size:0.8rem;" onclick="selectProjectAndNav('${p._id}','collaboration')">Collaborate</button>
        <button class="dash-btn-secondary" style="padding:8px 12px;font-size:0.8rem;" onclick="deleteProject('${p._id}')">🗑</button>
      </div>
    </div>
  `).join('');
}

function populateProjectSelects() {
  const selects = ['projectSelect', 'collabProjectSelect', 'historyProjectSelect', 'royaltyProjectSelect'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const firstOpt = id === 'projectSelect' ? '<option value="">— Select a project —</option>' : '<option value="">Select project...</option>';
    el.innerHTML = firstOpt + projects.map(p => `<option value="${p._id}">${escHtml(p.title)}</option>`).join('');
  });
}

// ==============================
// NAVIGATION
// ==============================
function showPage(pageId, navEl) {
  document.querySelectorAll('.dash-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');
  if (navEl) navEl.classList.add('active');
  else {
    const navItem = document.querySelector(`[data-page="${pageId}"]`);
    if (navItem) navItem.classList.add('active');
  }

  // Close sidebar on mobile
  if (window.innerWidth < 900) closeSidebar();
}

function selectProjectAndNav(projectId, page) {
  const select = document.getElementById('collabProjectSelect');
  if (select) select.value = projectId;
  currentProjectId = projectId;
  loadCollabProject();
  showPage(page, document.querySelector(`[data-page="${page}"]`));
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('visible');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('visible');
}

// ==============================
// AUTH
// ==============================
async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (_) {}
  window.location.href = '/login.html';
}

// ==============================
// CHARTS
// ==============================
function drawCharts() {
  drawActivityChart();
  drawTypeChart();
}

function drawActivityChart() {
  const canvas = document.getElementById('activityChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = [2, 5, 3, 8, 4, 7, 6];
  const W = canvas.offsetWidth || 500;
  const H = 200;
  canvas.width = W;
  canvas.height = H;
  const pad = { top: 20, right: 20, bottom: 30, left: 30 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const maxVal = Math.max(...data);
  const stepX = chartW / (data.length - 1);

  // Gradient fill
  const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
  grad.addColorStop(0, 'rgba(108,99,255,0.3)');
  grad.addColorStop(1, 'rgba(108,99,255,0)');

  // Points
  const pts = data.map((v, i) => ({
    x: pad.left + i * stepX,
    y: pad.top + chartH - (v / maxVal) * chartH
  }));

  // Draw fill
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length-1].x, H - pad.bottom);
  ctx.lineTo(pts[0].x, H - pad.bottom);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Draw line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = '#6c63ff';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Dots
  pts.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#6c63ff';
    ctx.fill();
    ctx.strokeStyle = '#070b14';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Labels
  ctx.fillStyle = '#4a5568';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  days.forEach((d, i) => ctx.fillText(d, pts[i].x, H - 8));
}

function drawTypeChart() {
  const canvas = document.getElementById('typeChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 200;
  const H = 200;
  canvas.width = W;
  canvas.height = H;

  const slices = [
    { label: 'WAV', value: 45, color: '#6c63ff' },
    { label: 'MP3', value: 35, color: '#a855f7' },
    { label: 'AIFF', value: 20, color: '#38bdf8' }
  ];

  const cx = W / 2, cy = H / 2 - 10;
  const r = Math.min(W, H) / 2 - 30;
  let start = -Math.PI / 2;

  slices.forEach(s => {
    const angle = (s.value / 100) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.fill();
    start += angle;
  });

  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = '#0f1320';
  ctx.fill();

  // Center text
  ctx.fillStyle = '#f0f4ff';
  ctx.font = 'bold 14px Space Grotesk, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Files', cx, cy + 5);

  // Legend
  let lx = 10, ly = H - 30;
  slices.forEach((s, i) => {
    ctx.fillStyle = s.color;
    ctx.fillRect(lx + i * 55, ly, 10, 10);
    ctx.fillStyle = '#8892b0';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(s.label + ' ' + s.value + '%', lx + i * 55 + 14, ly + 9);
  });
}

// ==============================
// UPLOAD
// ==============================
let selectedFile = null;

function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('uploadZone').classList.add('dragging');
}

function handleDragLeave(e) {
  document.getElementById('uploadZone').classList.remove('dragging');
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('uploadZone').classList.remove('dragging');
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) processFile(file);
}

function processFile(file) {
  const allowed = ['.wav', '.mp3', '.aiff', '.aif'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowed.includes(ext)) {
    showToast('Only WAV, MP3, and AIFF files are supported', 'error');
    return;
  }
  selectedFile = file;
  document.getElementById('previewName').textContent = file.name;
  document.getElementById('previewSize').textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
  const audio = document.getElementById('previewAudio');
  audio.src = URL.createObjectURL(file);
  document.getElementById('uploadPreview').classList.add('visible');
  showToast('File selected: ' + file.name, 'info');
}

async function submitUpload() {
  if (!selectedFile) { showToast('Please select an audio file first', 'error'); return; }

  const projectId = document.getElementById('projectSelect').value;
  const formData = new FormData();
  formData.append('audio', selectedFile);

  const progress = document.getElementById('uploadProgress');
  const bar = document.getElementById('uploadProgressBar');
  progress.classList.add('visible');

  // Simulate progress
  let pct = 0;
  const interval = setInterval(() => {
    pct = Math.min(pct + Math.random() * 15, 90);
    bar.style.width = pct + '%';
  }, 200);

  try {
    const url = projectId ? `/api/upload/${projectId}` : '/api/upload';
    const res = await fetch(url, { method: 'POST', body: formData });
    const data = await res.json();

    clearInterval(interval);
    bar.style.width = '100%';

    if (res.ok) {
      showToast('File uploaded successfully!', 'success');
      setTimeout(() => {
        progress.classList.remove('visible');
        bar.style.width = '0%';
        clearUpload();
        loadProjects();
      }, 1000);
    } else {
      showToast(data.error || 'Upload failed', 'error');
      progress.classList.remove('visible');
      bar.style.width = '0%';
    }
  } catch (err) {
    clearInterval(interval);
    showToast('Network error. Please try again.', 'error');
    progress.classList.remove('visible');
    bar.style.width = '0%';
  }
}

function clearUpload() {
  selectedFile = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('uploadPreview').classList.remove('visible');
  document.getElementById('trackTitle').value = '';
  document.getElementById('trackBpm').value = '';
  document.getElementById('trackNotes').value = '';
}

// ==============================
// PROJECTS
// ==============================
function openNewProjectModal() {
  document.getElementById('projectModal').style.display = 'flex';
}

function closeProjectModal() {
  document.getElementById('projectModal').style.display = 'none';
}

async function createProject() {
  const title = document.getElementById('newProjectTitle').value.trim();
  if (!title) { showToast('Project title is required', 'error'); return; }

  const body = {
    title,
    description: document.getElementById('newProjectDesc').value.trim(),
    genre: document.getElementById('newProjectGenre').value,
    bpm: document.getElementById('newProjectBpm').value || undefined
  };

  try {
    const res = await fetch('/api/project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Project "' + data.title + '" created!', 'success');
      closeProjectModal();
      document.getElementById('newProjectTitle').value = '';
      document.getElementById('newProjectDesc').value = '';
      await loadProjects();
    } else {
      showToast(data.error || 'Failed to create project', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

async function deleteProject(id) {
  if (!confirm('Delete this project? This cannot be undone.')) return;
  try {
    const res = await fetch('/api/project/' + id, { method: 'DELETE' });
    if (res.ok) {
      showToast('Project deleted', 'info');
      await loadProjects();
    }
  } catch (err) {
    showToast('Failed to delete project', 'error');
  }
}

// ==============================
// COLLABORATION
// ==============================
async function loadCollabProject() {
  const id = document.getElementById('collabProjectSelect').value;
  if (!id) return;
  currentProjectId = id;

  try {
    const res = await fetch('/api/project/' + id);
    const project = await res.json();

    // Render chat (comments)
    const chatEl = document.getElementById('chatMessages');
    if ((project.comments || []).length === 0) {
      chatEl.innerHTML = '<div style="text-align:center;color:#4a5568;font-size:0.85rem;padding:20px;">No messages yet. Start the conversation!</div>';
    } else {
      chatEl.innerHTML = project.comments.map(c => `
        <div class="chat-msg ${c.author === currentUser?.name ? 'own' : ''}">
          <div class="chat-avatar">${(c.author || 'U')[0].toUpperCase()}</div>
          <div>
            <div class="chat-bubble">${escHtml(c.text)}</div>
            <div class="chat-time">${c.author} · ${timeAgo(c.createdAt)}</div>
          </div>
        </div>
      `).join('');
      chatEl.scrollTop = chatEl.scrollHeight;
    }

    // Render tasks
    const taskEl = document.getElementById('taskList');
    if ((project.tasks || []).length === 0) {
      taskEl.innerHTML = '<div style="color:#4a5568;font-size:0.85rem;text-align:center;padding:12px;">No tasks yet</div>';
    } else {
      taskEl.innerHTML = project.tasks.map(t => `
        <div class="task-item ${t.status === 'done' ? 'done' : ''}">
          <input type="checkbox" class="task-check" ${t.status === 'done' ? 'checked' : ''} />
          <span class="task-text">${escHtml(t.title)}</span>
          ${t.assignedTo ? `<span class="task-assignee">${escHtml(t.assignedTo)}</span>` : ''}
        </div>
      `).join('');
    }

    // Render members
    const memberEl = document.getElementById('memberList');
    const ownerCard = `<div class="member-item">
      <div class="member-avatar">${(project.owner?.name || 'O')[0].toUpperCase()}</div>
      <div><div class="member-name">${escHtml(project.owner?.name || 'Owner')}</div><div class="member-email">${escHtml(project.owner?.email || '')}</div></div>
      <span class="member-role-badge">owner</span>
    </div>`;
    const collabCards = (project.collaborators || []).map(c => `
      <div class="member-item">
        <div class="member-avatar">${(c.email || 'C')[0].toUpperCase()}</div>
        <div><div class="member-name">${escHtml(c.email || 'Collaborator')}</div></div>
        <span class="member-role-badge">${c.role || 'editor'}</span>
      </div>
    `).join('');
    memberEl.innerHTML = ownerCard + collabCards;

    // Project info
    document.getElementById('collabProjectInfo').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;"><span style="color:#4a5568;">Genre</span><span style="color:#f0f4ff;">${escHtml(project.genre || '—')}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;"><span style="color:#4a5568;">BPM</span><span style="color:#f0f4ff;">${project.bpm || '—'}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;"><span style="color:#4a5568;">Audio files</span><span style="color:#f0f4ff;">${(project.audioFiles||[]).length}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;"><span style="color:#4a5568;">Status</span><span class="status-badge ${project.status||'active'}">${project.status||'active'}</span></div>
      </div>
    `;
  } catch (err) {
    showToast('Failed to load project', 'error');
  }
}

async function sendComment() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text || !currentProjectId) return;

  try {
    const res = await fetch('/api/project/' + currentProjectId + '/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (res.ok) {
      input.value = '';
      await loadCollabProject();
    }
  } catch (err) {
    showToast('Failed to send message', 'error');
  }
}

async function addTask() {
  const input = document.getElementById('newTaskInput');
  const assignee = document.getElementById('newTaskAssignee');
  const title = input.value.trim();
  if (!title || !currentProjectId) return;

  try {
    const res = await fetch('/api/project/' + currentProjectId + '/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, assignedTo: assignee.value.trim() })
    });
    if (res.ok) {
      input.value = '';
      assignee.value = '';
      await loadCollabProject();
    }
  } catch (err) {
    showToast('Failed to add task', 'error');
  }
}

async function inviteMember() {
  const email = document.getElementById('inviteEmail').value.trim();
  if (!email || !currentProjectId) { showToast('Enter a valid email address', 'error'); return; }

  try {
    const res = await fetch('/api/project/' + currentProjectId + '/collaborators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (res.ok) {
      document.getElementById('inviteEmail').value = '';
      showToast('Invitation sent to ' + email, 'success');
      await loadCollabProject();
    }
  } catch (err) {
    showToast('Failed to invite member', 'error');
  }
}

// ==============================
// VERSION HISTORY
// ==============================
async function loadVersionHistory() {
  const id = document.getElementById('historyProjectSelect').value;
  if (!id) return;
  currentProjectId = id;

  try {
    const res = await fetch('/api/project/' + id);
    const project = await res.json();
    const container = document.getElementById('versionsContainer');
    const versions = project.versions || [];

    if (!versions.length) {
      container.innerHTML = `<div style="color:#4a5568;text-align:center;padding:48px;font-size:0.9rem;">No versions saved yet. Click "Save Version" to create your first snapshot.</div>`;
      return;
    }

    container.innerHTML = `<div class="versions-timeline">` + versions.slice().reverse().map(v => `
      <div class="version-item">
        <div class="version-header">
          <span class="version-tag">${escHtml(v.label || 'v' + v.versionNumber)}</span>
          <span class="version-date">${timeAgo(v.createdAt)}</span>
        </div>
        <div class="version-title">Version ${v.versionNumber}</div>
        <div class="version-desc">${escHtml(v.description || 'No description provided')}</div>
        <div style="font-size:0.78rem;color:#4a5568;margin-top:8px;">${(v.files||[]).length} files included</div>
        <div class="version-actions">
          <button class="version-btn restore" onclick="showToast('Restoring version ${v.versionNumber}...','info')">↩ Restore</button>
          <button class="version-btn delete" onclick="deleteVersion('${id}','${v._id}')">🗑 Delete</button>
        </div>
      </div>
    `).join('') + `</div>`;
  } catch (err) {
    showToast('Failed to load versions', 'error');
  }
}

async function saveVersion() {
  const id = document.getElementById('historyProjectSelect').value;
  if (!id) { showToast('Select a project first', 'error'); return; }

  const label = prompt('Version label (e.g. v1.0, "Final Mix"):') || '';

  try {
    const res = await fetch('/api/project/' + id + '/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, description: 'Saved from dashboard' })
    });
    if (res.ok) {
      showToast('Version saved!', 'success');
      await loadVersionHistory();
      await loadProjects();
    }
  } catch (err) {
    showToast('Failed to save version', 'error');
  }
}

async function deleteVersion(projectId, versionId) {
  if (!confirm('Delete this version? This cannot be undone.')) return;
  try {
    const res = await fetch(`/api/project/${projectId}/versions/${versionId}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Version deleted', 'info');
      await loadVersionHistory();
    }
  } catch (err) {
    showToast('Failed to delete version', 'error');
  }
}

// ==============================
// ROYALTY SPLIT
// ==============================
function addContributor() {
  contributors.push({ name: '', email: '', role: '', percentage: 0 });
  renderContributors();
}

function removeContributor(idx) {
  contributors.splice(idx, 1);
  renderContributors();
  updateRoyaltyTotal();
}

function renderContributors() {
  const container = document.getElementById('contributorsContainer');
  if (!contributors.length) {
    container.innerHTML = `<div style="color:#4a5568;text-align:center;padding:32px;font-size:0.9rem;">No contributors yet. Add one to get started.</div>`;
    return;
  }
  container.innerHTML = contributors.map((c, i) => `
    <div class="contributor-row">
      <input type="text" class="dash-form-control" placeholder="Full name" value="${escHtml(c.name)}" oninput="contributors[${i}].name=this.value" />
      <input type="email" class="dash-form-control" placeholder="Email (optional)" value="${escHtml(c.email)}" oninput="contributors[${i}].email=this.value" />
      <input type="text" class="dash-form-control" placeholder="Role (e.g. Producer)" value="${escHtml(c.role)}" oninput="contributors[${i}].role=this.value" />
      <div class="pct-input-wrap">
        <input type="number" class="pct-input" min="0" max="100" value="${c.percentage}" oninput="contributors[${i}].percentage=Number(this.value);updateRoyaltyTotal()" />
      </div>
      <button class="remove-contributor" onclick="removeContributor(${i})">✕</button>
    </div>
  `).join('');
}

function updateRoyaltyTotal() {
  const total = contributors.reduce((sum, c) => sum + (Number(c.percentage) || 0), 0);
  const el = document.getElementById('royaltyTotal');
  const bar = document.getElementById('royaltyBarFill');
  el.textContent = total + '%';
  el.className = 'royalty-total-value ' + (total === 100 ? 'valid' : 'invalid');
  bar.style.width = Math.min(total, 100) + '%';
}

async function loadRoyalty() {
  const id = document.getElementById('royaltyProjectSelect').value;
  if (!id) return;
  currentProjectId = id;

  try {
    const res = await fetch('/api/project/' + id + '/royalty');
    const data = await res.json();
    contributors = data.contributors || [];
    renderContributors();
    updateRoyaltyTotal();
    document.getElementById('agreementPreview').classList.remove('visible');
    document.getElementById('agreementPreview').innerHTML = '';
  } catch (err) {
    showToast('Failed to load royalty data', 'error');
  }
}

async function saveRoyalty() {
  if (!currentProjectId) { showToast('Select a project first', 'error'); return; }
  const total = contributors.reduce((sum, c) => sum + (Number(c.percentage) || 0), 0);
  if (total !== 100) { showToast('Total must equal exactly 100%', 'error'); return; }

  try {
    const res = await fetch('/api/project/' + currentProjectId + '/royalty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contributors })
    });
    if (res.ok) {
      showToast('Royalty split saved!', 'success');
    } else {
      const d = await res.json();
      showToast(d.error || 'Failed to save', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

function generateAgreement() {
  if (!contributors.length) { showToast('Add contributors first', 'error'); return; }
  const total = contributors.reduce((sum, c) => sum + (Number(c.percentage) || 0), 0);
  if (total !== 100) { showToast('Total must equal 100% before generating agreement', 'error'); return; }

  const project = projects.find(p => p._id === currentProjectId);
  const pTitle = project ? project.title : 'Untitled Project';
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const rows = contributors.map(c => `<strong>${escHtml(c.name)}</strong> (${escHtml(c.role || 'Contributor')}) — ${c.percentage}%`).join('<br />');

  const el = document.getElementById('agreementPreview');
  el.innerHTML = `
    <h3>🎵 Royalty Agreement</h3>
    <p><strong>Project:</strong> ${escHtml(pTitle)}<br /><strong>Date:</strong> ${date}</p>
    <p>This Royalty Split Agreement ("Agreement") is entered into as of ${date}, between the contributors listed below regarding the musical work titled "<strong>${escHtml(pTitle)}</strong>".</p>
    <p><strong>Royalty Distribution:</strong><br />${rows}</p>
    <p>Each party agrees to their respective share as stated above. All parties acknowledge that the total allocation equals 100% of net royalties generated from the work.</p>
    <p>This agreement was generated through Music Collaboration Studio and represents the mutual understanding of all named contributors.</p>
    <div style="display:flex;gap:12px;margin-top:20px;">
      <button class="dash-btn-primary" onclick="downloadAgreement()">⬇ Download PDF</button>
      <button class="dash-btn-secondary" onclick="printAgreement()">🖨 Print</button>
    </div>
  `;
  el.classList.add('visible');
  showToast('Agreement generated successfully!', 'success');
}

function downloadAgreement() {
  showToast('PDF download requires PDFKit on the server — coming soon!', 'info');
}

function printAgreement() {
  window.print();
}

// ==============================
// SETTINGS
// ==============================
function switchSettingsTab(el, tab) {
  document.querySelectorAll('.settings-nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  ['profile', 'security', 'notifications'].forEach(t => {
    const panel = document.getElementById('settings-' + t);
    if (panel) panel.style.display = t === tab ? 'block' : 'none';
  });
}

function saveSettings() {
  showToast('Settings saved!', 'success');
}

// ==============================
// TOAST
// ==============================
function showToast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==============================
// UTILITIES
// ==============================
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function timeAgo(date) {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if (days < 7) return days + 'd ago';
  return new Date(date).toLocaleDateString();
}
