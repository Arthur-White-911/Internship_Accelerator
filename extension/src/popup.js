// ═══════════════════════════════════════════════════════
//  实习加速器 · 网申助手 — Popup Script
// ═══════════════════════════════════════════════════════

// ─── 状态 ───
let currentJob = null;
let savedJobs = [];
let userProfile = {};

// ─── 工具函数 ───
function $(id) { return document.getElementById(id); }

function showMsg(el, msg, type = 'success') {
  const existing = el.parentNode.querySelector('.inline-msg');
  if (existing) existing.remove();
  const span = document.createElement('span');
  span.className = 'inline-msg';
  span.style.cssText = `font-size:11px;color:${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#94A3B8'};margin-left:8px;`;
  span.textContent = msg;
  el.parentNode.appendChild(span);
  setTimeout(() => span.remove(), 2500);
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function truncate(str, len = 20) {
  if (!str) return '—';
  return str.length > len ? str.substring(0, len) + '…' : str;
}

// ─── Tab 切换 ───
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');

    if (tab === 'tracker') renderJobList();
    if (tab === 'fill') loadProfilePreview();
    if (tab === 'profile') loadProfileForm();
  });
});

// ─── 职位识别 ───
$('btn-detect').addEventListener('click', async () => {
  const btn = $('btn-detect');
  btn.disabled = true;
  btn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
    识别中...
  `;

  try {
    // 先尝试从 storage 读取最近检测结果（content script 已检测）
    const stored = await chrome.storage.local.get(['lastDetectedJob', 'lastDetectedAt']);
    const isRecent = stored.lastDetectedAt && (Date.now() - stored.lastDetectedAt < 5000);

    let jobData = null;

    if (isRecent && stored.lastDetectedJob) {
      jobData = stored.lastDetectedJob;
    } else {
      // 向 content script 发送检测请求
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        try {
          const res = await chrome.tabs.sendMessage(tab.id, { type: 'DO_DETECT_JOB' });
          if (res?.success) jobData = res.data;
        } catch (e) {
          // content script 可能未注入（如 chrome:// 页面）
        }
      }
    }

    if (jobData) {
      currentJob = jobData;
      renderJobCard(jobData);
      $('btn-save-job').disabled = false;
    } else {
      renderJobCardEmpty('未能识别到职位信息，请在招聘网站的职位详情页使用');
    }
  } catch (e) {
    renderJobCardEmpty('识别失败，请刷新页面后重试');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      识别职位信息
    `;
  }
});

function renderJobCard(job) {
  const card = $('job-info-card');
  card.innerHTML = `
    <div class="job-card-content">
      <div class="job-title">${job.title || '未知职位'}</div>
      <div class="job-company">${job.company || '未知公司'}</div>
      <div class="job-card-meta">
        ${job.location ? `<span class="job-meta-tag">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          ${truncate(job.location, 12)}
        </span>` : ''}
        ${job.salary ? `<span class="job-meta-tag">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          ${truncate(job.salary, 12)}
        </span>` : ''}
      </div>
      <div class="job-platform">${job.platform || job.url}</div>
    </div>
  `;
}

function renderJobCardEmpty(msg) {
  const card = $('job-info-card');
  card.innerHTML = `
    <div class="job-card-placeholder">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>${msg}</p>
    </div>
  `;
}

// ─── 收藏职位 ───
$('btn-save-job').addEventListener('click', async () => {
  if (!currentJob) return;
  const btn = $('btn-save-job');
  btn.disabled = true;

  const res = await chrome.runtime.sendMessage({ type: 'SAVE_JOB', payload: currentJob });
  if (res.success) {
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      已收藏
    `;
    btn.style.background = 'rgba(16, 185, 129, 0.15)';
    btn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    btn.style.color = '#10B981';
    showMsg(btn, '收藏成功！', 'success');
  } else {
    btn.disabled = false;
    showMsg(btn, res.message || '收藏失败', 'error');
  }
});

// ─── 一键填表 ───
$('btn-fill').addEventListener('click', async () => {
  const btn = $('btn-fill');
  btn.disabled = true;
  btn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
    填写中...
  `;

  try {
    const { userProfile: profile } = await chrome.storage.local.get('userProfile');
    if (!profile || !Object.values(profile).some(v => v)) {
      alert('请先在「我的信息」中填写个人资料！');
      return;
    }

    const res = await chrome.runtime.sendMessage({ type: 'FILL_FORM', payload: profile });
    if (res?.success) {
      showMsg(btn, res.count > 0 ? `已填写 ${res.count} 个字段` : '未找到可填写字段', res.count > 0 ? 'success' : 'info');
    }
  } catch (e) {
    showMsg(btn, '填写失败，请重试', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
      一键填写表单
    `;
  }
});

// ─── 加载填表预览 ───
async function loadProfilePreview() {
  const { userProfile: profile } = await chrome.storage.local.get('userProfile');
  if (!profile) return;
  $('preview-name').textContent = profile.name || '—';
  $('preview-phone').textContent = profile.phone || '—';
  $('preview-email').textContent = profile.email || '—';
  $('preview-school').textContent = truncate(profile.school || '—', 16);
  $('preview-major').textContent = profile.major || '—';
}

// ─── 渲染职位列表 ───
async function renderJobList() {
  const res = await chrome.runtime.sendMessage({ type: 'GET_SAVED_JOBS' });
  savedJobs = res.data || [];

  const list = $('job-list');
  if (savedJobs.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <p>暂无收藏职位<br/>在「职位识别」中收藏职位后显示</p>
      </div>
    `;
    return;
  }

  list.innerHTML = savedJobs.map(job => `
    <div class="job-item" data-id="${job.id}">
      <div class="job-item-header">
        <div class="job-item-title">${truncate(job.title || '未知职位', 22)}</div>
      </div>
      <div class="job-item-company">${truncate(job.company || '未知公司', 24)}</div>
      <div class="job-item-footer">
        <select class="job-status-select" data-id="${job.id}">
          <option value="saved" ${job.status === 'saved' ? 'selected' : ''}>📌 已收藏</option>
          <option value="applied" ${job.status === 'applied' ? 'selected' : ''}>📤 已投递</option>
          <option value="interview" ${job.status === 'interview' ? 'selected' : ''}>🎯 面试中</option>
          <option value="offer" ${job.status === 'offer' ? 'selected' : ''}>🎉 已拿Offer</option>
          <option value="rejected" ${job.status === 'rejected' ? 'selected' : ''}>❌ 已拒绝</option>
        </select>
        <div class="job-item-actions">
          <a href="${job.url}" target="_blank" class="job-action-btn" title="打开职位页面">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
          <button class="job-action-btn delete" data-id="${job.id}" title="删除">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
        <span class="job-date">${formatDate(job.savedAt)}</span>
      </div>
    </div>
  `).join('');

  // 状态更新
  list.querySelectorAll('.job-status-select').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const status = e.target.value;
      await chrome.runtime.sendMessage({ type: 'UPDATE_JOB_STATUS', payload: { id, status } });
    });
  });

  // 删除职位
  list.querySelectorAll('.job-action-btn.delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      await chrome.runtime.sendMessage({ type: 'DELETE_JOB', payload: { id } });
      renderJobList();
    });
  });
}

// ─── 加载个人信息表单 ───
async function loadProfileForm() {
  const { userProfile: profile } = await chrome.storage.local.get('userProfile');
  if (!profile) return;
  userProfile = profile;
  $('p-name').value = profile.name || '';
  $('p-phone').value = profile.phone || '';
  $('p-email').value = profile.email || '';
  $('p-school').value = profile.school || '';
  $('p-major').value = profile.major || '';
  $('p-grade').value = profile.grade || '';
  $('p-gpa').value = profile.gpa || '';
  $('p-skills').value = profile.skills || '';
}

// ─── 保存个人信息 ───
$('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const profile = {
    name: $('p-name').value.trim(),
    phone: $('p-phone').value.trim(),
    email: $('p-email').value.trim(),
    school: $('p-school').value.trim(),
    major: $('p-major').value.trim(),
    grade: $('p-grade').value.trim(),
    gpa: $('p-gpa').value.trim(),
    skills: $('p-skills').value.trim(),
  };

  const res = await chrome.runtime.sendMessage({ type: 'SAVE_PROFILE', payload: profile });
  if (res.success) {
    const btn = e.target.querySelector('button[type=submit]');
    btn.classList.add('save-success');
    btn.style.background = 'rgba(16, 185, 129, 0.8)';
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      已保存
    `;
    setTimeout(() => {
      btn.classList.remove('save-success');
      btn.style.background = '';
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
        </svg>
        保存信息
      `;
    }, 2000);
  }
});

// ─── 打开平台 ───
$('btn-open-platform').addEventListener('click', async (e) => {
  e.preventDefault();
  const { settings } = await chrome.storage.local.get('settings');
  const url = settings?.platformUrl || 'https://internship-accelerator.vercel.app';
  chrome.tabs.create({ url });
});

// ─── 初始化 ───
async function init() {
  // 检查是否有最近检测的职位
  const stored = await chrome.storage.local.get(['lastDetectedJob', 'lastDetectedAt']);
  if (stored.lastDetectedJob && stored.lastDetectedAt && (Date.now() - stored.lastDetectedAt < 30000)) {
    currentJob = stored.lastDetectedJob;
    renderJobCard(currentJob);
    $('btn-save-job').disabled = false;
  }

  // 加载个人信息预览
  await loadProfilePreview();
}

init();

// ─── 添加旋转动画 CSS ───
const style = document.createElement('style');
style.textContent = `
  .spin {
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
