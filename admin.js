const PROD_API_BASE = 'https://opendogo.vercel.app';
const getDefaultApiBase = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  return PROD_API_BASE;
};
const API_BASE = window.localStorage.getItem('admin_api_base') || getDefaultApiBase();
const state = { accessToken: '' };

const el = (id) => document.getElementById(id);
const log = (msg) => {
  el('log').textContent = `${new Date().toLocaleTimeString()} ${msg}\n${el('log').textContent}`;
};

el('apiBase').textContent = API_BASE;

const api = async (path, { method = 'GET', body, auth = true } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && state.accessToken) headers.Authorization = `Bearer ${state.accessToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`${data.error || res.status}`);
  return data;
};

el('loginPwdBtn').onclick = async () => {
  try {
    const result = await api('/api/admin/auth/login-password', {
      method: 'POST',
      auth: false,
      body: { account: el('account').value, password: el('password').value }
    });
    el('ticket').value = result.login_ticket;
    log('账号密码通过，已获取 login_ticket');
  } catch (e) {
    log(`登录失败: ${e.message}`);
  }
};

el('login2faBtn').onclick = async () => {
  try {
    const result = await api('/api/admin/auth/login-2fa', {
      method: 'POST',
      auth: false,
      body: { login_ticket: el('ticket').value, totp_code: el('totp').value }
    });
    state.accessToken = result.access_token;
    log('2FA 通过，已登录');
  } catch (e) {
    log(`2FA 失败: ${e.message}`);
  }
};

el('loadDashboardBtn').onclick = async () => {
  try {
    const result = await api('/api/admin/dashboard');
    el('dashboardResult').textContent = JSON.stringify(result, null, 2);
    log('看板加载完成');
  } catch (e) {
    log(`看板加载失败: ${e.message}`);
  }
};

el('loadUsersBtn').onclick = async () => {
  try {
    const result = await api('/api/admin/users');
    el('usersResult').textContent = JSON.stringify(result, null, 2);
    const firstId = result?.users?.[0]?.id;
    if (firstId) el('targetUserId').value = firstId;
    log('用户列表加载完成');
  } catch (e) {
    log(`用户列表加载失败: ${e.message}`);
  }
};

el('updateUserStatusBtn').onclick = async () => {
  try {
    const userId = el('targetUserId').value.trim();
    const status = el('targetStatus').value;
    if (!userId) throw new Error('请先输入用户ID');

    const result = await api(`/api/admin/users/${encodeURIComponent(userId)}/status`, {
      method: 'PATCH',
      body: { status }
    });
    log(`用户状态更新成功: ${result.user.account} => ${result.user.status}`);
  } catch (e) {
    log(`用户状态更新失败: ${e.message}`);
  }
};

el('loadRulesBtn').onclick = async () => {
  try {
    const result = await api('/api/admin/domain-rules');
    el('rulesResult').textContent = JSON.stringify(result, null, 2);
    log('域名规则加载完成');
  } catch (e) {
    log(`域名规则加载失败: ${e.message}`);
  }
};

el('upsertRuleBtn').onclick = async () => {
  try {
    const result = await api('/api/admin/domain-rules', {
      method: 'POST',
      body: {
        moduleKey: el('moduleKey').value.trim(),
        enabled: el('ruleEnabled').value === 'true',
        allowedDomains: el('allowedDomains').value.split(',').map((v) => v.trim()).filter(Boolean),
        fallbackUrl: el('fallbackUrl').value.trim()
      }
    });
    el('rulesResult').textContent = JSON.stringify(result, null, 2);
    log('域名规则保存成功');
  } catch (e) {
    log(`域名规则保存失败: ${e.message}`);
  }
};

el('createBatchBtn').onclick = async () => {
  try {
    const result = await api('/api/admin/license-batches', {
      method: 'POST',
      body: {
        name: el('batchName').value,
        quantity: Number(el('batchQty').value)
      }
    });
    el('batchResult').textContent = JSON.stringify(result, null, 2);
    log('卡密批次生成成功');
  } catch (e) {
    log(`卡密生成失败: ${e.message}`);
  }
};

el('loadBatchesBtn').onclick = async () => {
  try {
    const result = await api('/api/admin/license-batches');
    el('batchResult').textContent = JSON.stringify(result, null, 2);
    log('卡密批次加载完成');
  } catch (e) {
    log(`卡密批次加载失败: ${e.message}`);
  }
};

el('queryRecordBtn').onclick = async () => {
  try {
    const account = encodeURIComponent(el('recordAccount').value);
    const result = await api(`/api/admin/user-records/${account}`);
    el('recordResult').textContent = JSON.stringify(result, null, 2);
    log('用户记录查询成功');
  } catch (e) {
    log(`查询失败: ${e.message}`);
  }
};
