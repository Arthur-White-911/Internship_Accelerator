// ═══════════════════════════════════════════════════════
//  实习加速器 · 网申助手 — Background Service Worker
// ═══════════════════════════════════════════════════════

// 初始化存储
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(['savedJobs', 'userProfile', 'settings']);
  if (!existing.savedJobs) {
    await chrome.storage.local.set({ savedJobs: [] });
  }
  if (!existing.userProfile) {
    await chrome.storage.local.set({
      userProfile: {
        name: '',
        phone: '',
        email: '',
        school: '',
        major: '',
        grade: '',
        gpa: '',
        skills: '',
        experience: '',
      }
    });
  }
  if (!existing.settings) {
    await chrome.storage.local.set({
      settings: {
        autoDetect: true,
        showFloatingBtn: true,
        platformUrl: 'https://internship-accelerator.vercel.app',
      }
    });
  }
  console.log('[实习加速器] 扩展已初始化');
});

// 监听来自 content script 和 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_JOB') {
    handleSaveJob(message.payload).then(sendResponse);
    return true; // 保持消息通道开放
  }

  if (message.type === 'GET_SAVED_JOBS') {
    chrome.storage.local.get('savedJobs').then(({ savedJobs }) => {
      sendResponse({ success: true, data: savedJobs || [] });
    });
    return true;
  }

  if (message.type === 'UPDATE_JOB_STATUS') {
    handleUpdateJobStatus(message.payload).then(sendResponse);
    return true;
  }

  if (message.type === 'DELETE_JOB') {
    handleDeleteJob(message.payload).then(sendResponse);
    return true;
  }

  if (message.type === 'GET_PROFILE') {
    chrome.storage.local.get('userProfile').then(({ userProfile }) => {
      sendResponse({ success: true, data: userProfile || {} });
    });
    return true;
  }

  if (message.type === 'SAVE_PROFILE') {
    chrome.storage.local.set({ userProfile: message.payload }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'FILL_FORM') {
    // 向当前标签页的 content script 发送填写指令
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'DO_FILL_FORM',
          payload: message.payload,
        }, sendResponse);
      }
    });
    return true;
  }

  if (message.type === 'DETECT_JOB') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'DO_DETECT_JOB' }, sendResponse);
      }
    });
    return true;
  }
});

// 保存职位
async function handleSaveJob(job) {
  const { savedJobs = [] } = await chrome.storage.local.get('savedJobs');
  const exists = savedJobs.find(j => j.id === job.id);
  if (exists) {
    return { success: false, message: '该职位已收藏' };
  }
  const newJob = {
    ...job,
    id: job.id || `job_${Date.now()}`,
    savedAt: new Date().toISOString(),
    status: 'saved', // saved | applied | interview | offer | rejected
  };
  savedJobs.unshift(newJob);
  await chrome.storage.local.set({ savedJobs });
  return { success: true, data: newJob };
}

// 更新职位状态
async function handleUpdateJobStatus({ id, status }) {
  const { savedJobs = [] } = await chrome.storage.local.get('savedJobs');
  const idx = savedJobs.findIndex(j => j.id === id);
  if (idx === -1) return { success: false, message: '职位不存在' };
  savedJobs[idx].status = status;
  savedJobs[idx].updatedAt = new Date().toISOString();
  await chrome.storage.local.set({ savedJobs });
  return { success: true };
}

// 删除职位
async function handleDeleteJob({ id }) {
  const { savedJobs = [] } = await chrome.storage.local.get('savedJobs');
  const filtered = savedJobs.filter(j => j.id !== id);
  await chrome.storage.local.set({ savedJobs: filtered });
  return { success: true };
}
