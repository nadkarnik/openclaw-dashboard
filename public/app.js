const API_BASE = window.location.origin;
let currentTheme = localStorage.getItem('theme') || 'light';
let refreshInterval;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initModal();
  initEventListeners();
  loadAllData();
  startAutoRefresh();
});

// Theme
function initTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  document.getElementById('theme-toggle').textContent = currentTheme === 'dark' ? '☀️' : '🌙';
}

document.getElementById('theme-toggle').addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', currentTheme);
  initTheme();
});

// Tabs
function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      
      // Remove active class from all tabs and content
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      document.getElementById(`${target}-tab`).classList.add('active');
      
      // Load data for the active tab
      loadTabData(target);
    });
  });
}

// Modal
function initModal() {
  const modal = document.getElementById('spawn-modal');
  const btn = document.getElementById('spawn-subagent-btn');
  const closeBtn = document.querySelector('.close');
  const cancelBtn = document.getElementById('cancel-spawn');
  
  btn.addEventListener('click', () => modal.classList.add('active'));
  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  cancelBtn.addEventListener('click', () => modal.classList.remove('active'));
  
  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
  
  document.getElementById('spawn-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await spawnSubagent();
  });
}

// Event Listeners
function initEventListeners() {
  document.getElementById('refresh-btn').addEventListener('click', loadAllData);
  document.getElementById('memory-search-btn').addEventListener('click', searchMemory);
  
  // History search
  document.getElementById('history-search').addEventListener('input', filterHistory);
  document.getElementById('history-filter').addEventListener('change', filterHistory);
}

// Auto-refresh
function startAutoRefresh() {
  refreshInterval = setInterval(loadAllData, 30000); // 30 seconds
}

// API Calls
async function apiGet(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    return null;
  }
}

async function apiPost(endpoint, data) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    return null;
  }
}

// Load Data
async function loadAllData() {
  updateConnectionStatus(true);
  await loadStats();
  const activeTab = document.querySelector('.tab.active').getAttribute('data-tab');
  await loadTabData(activeTab);
  updateConnectionStatus(false);
}

async function loadTabData(tab) {
  switch (tab) {
    case 'sessions':
      await loadSessions();
      break;
    case 'subagents':
      await loadSubagents();
      break;
    case 'history':
      await loadHistory();
      break;
    case 'memory':
      await loadMemoryFiles();
      break;
    case 'system':
      await loadSystemInfo();
      break;
  }
}

async function loadStats() {
  const status = await apiGet('/api/status');
  if (!status) return;
  
  document.getElementById('token-usage').textContent = 
    `${(status.tokensUsed / 1000).toFixed(1)}K / ${(status.tokenLimit / 1000).toFixed(0)}K`;
  
  const percentage = (status.tokensUsed / status.tokenLimit) * 100;
  document.getElementById('token-progress').style.width = `${percentage}%`;
  
  document.getElementById('uptime').textContent = status.uptime;
  
  // These will be updated by other API calls
  const sessions = await apiGet('/api/sessions');
  if (sessions) {
    const count = 1 + (sessions.isolated?.length || 0);
    document.getElementById('session-count').textContent = count;
  }
  
  const subagents = await apiGet('/api/subagents');
  if (subagents) {
    document.getElementById('subagent-count').textContent = subagents.active?.length || 0;
  }
}

async function loadSessions() {
  const container = document.getElementById('sessions-list');
  const sessions = await apiGet('/api/sessions');
  
  if (!sessions) {
    container.innerHTML = '<div class="placeholder">Failed to load sessions</div>';
    return;
  }
  
  let html = '';
  
  // Main session
  html += `
    <div class="list-item">
      <div class="item-header">
        <div class="item-title">Main Session</div>
        <div class="item-badge badge-active">Active</div>
      </div>
      <div class="item-meta">
        Messages: ${sessions.main?.messageCount || 0} | 
        Last: ${sessions.main?.lastMessage ? new Date(sessions.main.lastMessage).toLocaleString() : 'N/A'}
      </div>
    </div>
  `;
  
  // Isolated sessions
  if (sessions.isolated && sessions.isolated.length > 0) {
    sessions.isolated.forEach(session => {
      html += `
        <div class="list-item">
          <div class="item-header">
            <div class="item-title">${session.label || session.sessionKey}</div>
            <div class="item-badge badge-${session.active ? 'active' : 'idle'}">${session.active ? 'Active' : 'Idle'}</div>
          </div>
          <div class="item-meta">
            Messages: ${session.messageCount || 0} | 
            Last: ${session.lastMessage ? new Date(session.lastMessage).toLocaleString() : 'N/A'}
          </div>
        </div>
      `;
    });
  }
  
  container.innerHTML = html || '<div class="placeholder">No sessions found</div>';
}

async function loadSubagents() {
  const container = document.getElementById('subagents-list');
  const subagents = await apiGet('/api/subagents');
  
  if (!subagents) {
    container.innerHTML = '<div class="placeholder">Failed to load subagents</div>';
    return;
  }
  
  let html = '';
  
  if (subagents.active && subagents.active.length > 0) {
    subagents.active.forEach(agent => {
      html += `
        <div class="list-item">
          <div class="item-header">
            <div class="item-title">${agent.label || agent.sessionKey}</div>
            <div class="item-badge badge-active">Running</div>
          </div>
          <div class="item-meta">
            Task: ${agent.task || 'N/A'}<br>
            Started: ${agent.startTime ? new Date(agent.startTime).toLocaleString() : 'N/A'}
          </div>
        </div>
      `;
    });
  }
  
  if (subagents.recent && subagents.recent.length > 0) {
    subagents.recent.forEach(agent => {
      html += `
        <div class="list-item">
          <div class="item-header">
            <div class="item-title">${agent.label || agent.sessionKey}</div>
            <div class="item-badge badge-complete">Complete</div>
          </div>
          <div class="item-meta">
            Task: ${agent.task || 'N/A'}<br>
            Completed: ${agent.endTime ? new Date(agent.endTime).toLocaleString() : 'N/A'}
          </div>
        </div>
      `;
    });
  }
  
  container.innerHTML = html || '<div class="placeholder">No subagents running</div>';
}

async function loadHistory() {
  const container = document.getElementById('history-list');
  const history = await apiGet('/api/sessions/main/history?limit=50');
  
  if (!history || !history.messages) {
    container.innerHTML = '<div class="placeholder">No history available yet</div>';
    return;
  }
  
  let html = '';
  history.messages.forEach(msg => {
    html += `
      <div class="list-item" data-role="${msg.role}">
        <div class="message-role ${msg.role}">${msg.role === 'user' ? 'You' : 'Assistant'}</div>
        <div class="message-content">${escapeHtml(msg.content)}</div>
        <div class="message-time">${new Date(msg.timestamp).toLocaleString()}</div>
      </div>
    `;
  });
  
  container.innerHTML = html || '<div class="placeholder">No messages</div>';
  container.dataset.fullContent = html;
}

async function loadMemoryFiles() {
  const container = document.getElementById('memory-files-list');
  const memory = await apiGet('/api/memory');
  
  if (!memory || !memory.files || memory.files.length === 0) {
    container.innerHTML = '<div class="placeholder">No memory files yet</div>';
    return;
  }
  
  let html = '';
  memory.files.forEach(file => {
    html += `
      <div class="list-item" onclick="loadMemoryFile('${file}')">
        ${file}
      </div>
    `;
  });
  
  container.innerHTML = html;
}

async function loadMemoryFile(filename) {
  const viewer = document.getElementById('memory-viewer');
  viewer.innerHTML = '<div class="loading">Loading...</div>';
  
  const data = await apiGet(`/api/memory/${filename}`);
  if (!data) {
    viewer.innerHTML = '<div class="placeholder">Failed to load file</div>';
    return;
  }
  
  viewer.textContent = data.content;
}

async function loadSystemInfo() {
  const container = document.getElementById('system-info');
  const info = await apiGet('/api/system');
  
  if (!info) {
    container.innerHTML = '<div class="placeholder">Failed to load system info</div>';
    return;
  }
  
  const items = [
    { label: 'Host', value: info.host },
    { label: 'OS', value: info.os },
    { label: 'Node.js', value: info.node },
    { label: 'Workspace', value: info.workspace },
    { label: 'Uptime', value: formatUptime(info.uptime) }
  ];
  
  let html = '';
  items.forEach(item => {
    html += `
      <div class="info-item">
        <span class="info-label">${item.label}</span>
        <span class="info-value">${item.value}</span>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Actions
async function spawnSubagent() {
  const task = document.getElementById('spawn-task').value;
  const label = document.getElementById('spawn-label').value;
  const model = document.getElementById('spawn-model').value;
  
  const data = { task };
  if (label) data.label = label;
  if (model) data.model = model;
  
  // Note: This would need to call the OpenClaw sessions_spawn tool
  console.log('Spawn subagent:', data);
  alert('Subagent spawn feature coming soon! (Needs OpenClaw API integration)');
  
  document.getElementById('spawn-modal').classList.remove('active');
  document.getElementById('spawn-form').reset();
}

async function searchMemory() {
  const query = document.getElementById('memory-search').value;
  if (!query) return;
  
  const results = await apiPost('/api/memory/search', { query });
  console.log('Memory search results:', results);
  alert('Memory search feature coming soon! (Needs OpenClaw API integration)');
}

function filterHistory() {
  const searchTerm = document.getElementById('history-search').value.toLowerCase();
  const filter = document.getElementById('history-filter').value;
  const container = document.getElementById('history-list');
  const items = container.querySelectorAll('.list-item');
  
  items.forEach(item => {
    const content = item.textContent.toLowerCase();
    const role = item.dataset.role;
    
    const matchesSearch = content.includes(searchTerm);
    const matchesFilter = filter === 'all' || role === filter;
    
    item.style.display = (matchesSearch && matchesFilter) ? 'block' : 'none';
  });
}

// Utilities
function updateConnectionStatus(loading) {
  const indicator = document.getElementById('connection-status');
  if (loading) {
    indicator.style.background = 'var(--warning)';
  } else {
    indicator.style.background = 'var(--success)';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
