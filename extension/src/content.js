// ═══════════════════════════════════════════════════════
//  实习加速器 · 网申助手 — Content Script
// ═══════════════════════════════════════════════════════

(function () {
  'use strict';

  // ─── 职位信息识别规则（按平台） ───
  const PLATFORM_RULES = {
    'zhaopin.com': {
      title: ['.job-name', '.position-name', 'h1.name'],
      company: ['.company-name', '.corp-name'],
      location: ['.job-address', '.work-city'],
      salary: ['.salary', '.job-salary'],
      requirements: ['.job-qualifications', '.job-detail'],
    },
    '51job.com': {
      title: ['.cn h1', '.tHeader h1'],
      company: ['.cname', '.cn a'],
      location: ['.ltype'],
      salary: ['.cn strong'],
      requirements: ['.bmsg'],
    },
    'liepin.com': {
      title: ['.job-name', 'h1.title'],
      company: ['.company-name'],
      location: ['.job-city'],
      salary: ['.job-salary'],
      requirements: ['.job-description'],
    },
    'boss.zhipin.com': {
      title: ['.name h1', '.job-name'],
      company: ['.company-info .name'],
      location: ['.job-primary .info-primary p'],
      salary: ['.salary'],
      requirements: ['.job-detail'],
    },
    'lagou.com': {
      title: ['.position-name', 'h1'],
      company: ['.company-name'],
      location: ['.work-place'],
      salary: ['.salary'],
      requirements: ['.job-detail-container'],
    },
    'linkedin.com': {
      title: ['.job-details-jobs-unified-top-card__job-title h1', '.jobs-unified-top-card__job-title'],
      company: ['.job-details-jobs-unified-top-card__company-name', '.jobs-unified-top-card__company-name'],
      location: ['.job-details-jobs-unified-top-card__bullet', '.jobs-unified-top-card__workplace-type'],
      salary: ['.compensation__salary'],
      requirements: ['.jobs-description__content'],
    },
    'default': {
      title: ['h1', '.job-title', '.position-title', '[class*="job-name"]', '[class*="position-name"]'],
      company: ['.company-name', '[class*="company"]', '[class*="employer"]'],
      location: ['.location', '[class*="location"]', '[class*="city"]'],
      salary: ['.salary', '[class*="salary"]', '[class*="compensation"]'],
      requirements: ['.job-description', '[class*="description"]', '[class*="requirement"]'],
    }
  };

  // ─── 表单字段映射规则 ───
  const FORM_FIELD_PATTERNS = {
    name: {
      labels: ['姓名', '名字', '真实姓名', 'name', 'full name', 'your name'],
      attrs: ['name', 'realname', 'fullname', 'username'],
      types: ['text'],
    },
    phone: {
      labels: ['手机', '电话', '联系方式', 'phone', 'mobile', 'telephone'],
      attrs: ['phone', 'mobile', 'tel', 'telephone'],
      types: ['tel', 'text'],
    },
    email: {
      labels: ['邮箱', '电子邮件', 'email', 'e-mail'],
      attrs: ['email', 'mail'],
      types: ['email', 'text'],
    },
    school: {
      labels: ['学校', '院校', '毕业院校', '就读学校', 'school', 'university', 'college'],
      attrs: ['school', 'university', 'college', 'institution'],
      types: ['text'],
    },
    major: {
      labels: ['专业', '所学专业', '专业方向', 'major', 'field of study'],
      attrs: ['major', 'major_name', 'study_major'],
      types: ['text'],
    },
    grade: {
      labels: ['年级', '在读年级', '年级/届', 'grade', 'year'],
      attrs: ['grade', 'year', 'class_year'],
      types: ['text', 'select'],
    },
    gpa: {
      labels: ['gpa', '绩点', '成绩', 'grade point'],
      attrs: ['gpa', 'grade_point', 'score'],
      types: ['text', 'number'],
    },
  };

  // ─── 获取当前平台规则 ───
  function getPlatformRules() {
    const host = window.location.hostname;
    for (const [domain, rules] of Object.entries(PLATFORM_RULES)) {
      if (domain !== 'default' && host.includes(domain)) {
        return rules;
      }
    }
    return PLATFORM_RULES.default;
  }

  // ─── 从选择器列表中获取文本 ───
  function getTextFromSelectors(selectors) {
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el && el.textContent.trim()) {
          return el.textContent.trim().replace(/\s+/g, ' ');
        }
      } catch (e) {}
    }
    return '';
  }

  // ─── 识别职位信息 ───
  function detectJobInfo() {
    const rules = getPlatformRules();
    const info = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      url: window.location.href,
      platform: window.location.hostname,
      title: getTextFromSelectors(rules.title) || document.title.split(/[-|_]/)[0].trim(),
      company: getTextFromSelectors(rules.company),
      location: getTextFromSelectors(rules.location),
      salary: getTextFromSelectors(rules.salary),
      requirements: getTextFromSelectors(rules.requirements).substring(0, 500),
      detectedAt: new Date().toISOString(),
    };
    return info;
  }

  // ─── 智能表单填写 ───
  function fillForm(profile) {
    let filledCount = 0;
    const inputs = document.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
      if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') return;
      if (input.value && input.value.trim()) return; // 已有值则跳过

      const fieldKey = detectFieldType(input);
      if (fieldKey && profile[fieldKey]) {
        if (input.tagName === 'SELECT') {
          fillSelect(input, profile[fieldKey]);
        } else {
          fillInput(input, profile[fieldKey]);
        }
        filledCount++;
      }
    });

    return filledCount;
  }

  // ─── 识别字段类型 ───
  function detectFieldType(input) {
    const label = getAssociatedLabel(input);
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    const placeholder = (input.placeholder || '').toLowerCase();
    const combined = `${label} ${name} ${id} ${placeholder}`;

    for (const [fieldKey, patterns] of Object.entries(FORM_FIELD_PATTERNS)) {
      // 检查 label 文本
      for (const lbl of patterns.labels) {
        if (combined.includes(lbl.toLowerCase())) return fieldKey;
      }
      // 检查 attr 名称
      for (const attr of patterns.attrs) {
        if (name.includes(attr) || id.includes(attr)) return fieldKey;
      }
    }
    return null;
  }

  // ─── 获取关联 label ───
  function getAssociatedLabel(input) {
    // 通过 for 属性
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) return label.textContent.toLowerCase();
    }
    // 父级 label
    const parentLabel = input.closest('label');
    if (parentLabel) return parentLabel.textContent.toLowerCase();
    // 前一个兄弟元素
    const prev = input.previousElementSibling;
    if (prev && (prev.tagName === 'LABEL' || prev.tagName === 'SPAN' || prev.tagName === 'P')) {
      return prev.textContent.toLowerCase();
    }
    return '';
  }

  // ─── 填写 input 字段（触发 React/Vue 事件） ───
  function fillInput(input, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    const nativeTextareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');

    if (input.tagName === 'TEXTAREA' && nativeTextareaSetter) {
      nativeTextareaSetter.set.call(input, value);
    } else if (nativeInputValueSetter) {
      nativeInputValueSetter.set.call(input, value);
    } else {
      input.value = value;
    }

    // 触发各种事件以兼容 React/Vue/Angular
    ['input', 'change', 'blur'].forEach(eventType => {
      input.dispatchEvent(new Event(eventType, { bubbles: true }));
    });
  }

  // ─── 填写 select 字段 ───
  function fillSelect(select, value) {
    const options = Array.from(select.options);
    const match = options.find(opt =>
      opt.text.includes(value) || opt.value.includes(value) || value.includes(opt.text)
    );
    if (match) {
      select.value = match.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  // ─── 创建悬浮按钮 ───
  function createFloatingButton() {
    if (document.getElementById('ia-floating-btn')) return;

    const btn = document.createElement('div');
    btn.id = 'ia-floating-btn';
    btn.innerHTML = `
      <div class="ia-fab-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      </div>
      <span class="ia-fab-label">网申助手</span>
    `;
    btn.title = '实习加速器 · 网申助手';

    btn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
      // 发送检测信号给 popup
      chrome.storage.local.set({
        lastDetectedJob: detectJobInfo(),
        lastDetectedAt: Date.now(),
      });
    });

    document.body.appendChild(btn);
  }

  // ─── 显示操作反馈提示 ───
  function showToast(message, type = 'success') {
    const existing = document.getElementById('ia-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'ia-toast';
    toast.className = `ia-toast ia-toast-${type}`;
    toast.innerHTML = `
      <div class="ia-toast-icon">
        ${type === 'success'
          ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
          : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
        }
      </div>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('ia-toast-hide');
      setTimeout(() => toast.remove(), 400);
    }, 2500);
  }

  // ─── 高亮已填写的字段 ───
  function highlightFilledFields(inputs) {
    inputs.forEach(input => {
      input.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
      input.style.boxShadow = '0 0 0 2px rgba(0, 212, 255, 0.4)';
      input.style.borderColor = '#00D4FF';
      setTimeout(() => {
        input.style.boxShadow = '';
        input.style.borderColor = '';
      }, 2000);
    });
  }

  // ─── 监听来自 background/popup 的消息 ───
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'DO_DETECT_JOB') {
      const jobInfo = detectJobInfo();
      sendResponse({ success: true, data: jobInfo });
      return true;
    }

    if (message.type === 'DO_FILL_FORM') {
      const profile = message.payload;
      const inputsBefore = Array.from(document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button])'));
      const count = fillForm(profile);
      const inputsAfter = Array.from(document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button])'));
      highlightFilledFields(inputsAfter.filter(i => i.value));
      showToast(count > 0 ? `已自动填写 ${count} 个字段` : '未找到可填写的字段', count > 0 ? 'success' : 'info');
      sendResponse({ success: true, count });
      return true;
    }

    if (message.type === 'SHOW_TOAST') {
      showToast(message.payload.message, message.payload.type);
      sendResponse({ success: true });
      return true;
    }
  });

  // ─── 初始化 ───
  async function init() {
    const { settings } = await chrome.storage.local.get('settings');
    if (settings?.showFloatingBtn !== false) {
      // 延迟创建悬浮按钮，等页面加载完成
      setTimeout(createFloatingButton, 1500);
    }
  }

  init();
})();
