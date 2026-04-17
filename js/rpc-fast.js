(function(){
  const rpcCtxCache = new Map();
  let rpcCursor = 0;

  function uiNum(id, fallback) {
    const el = document.getElementById(id);
    const v = el ? parseInt(el.value, 10) : NaN;
    return Number.isFinite(v) ? v : fallback;
  }

  function ensureFastDefaults() {
    const delay = document.getElementById('requestDelay');
    if (delay && (delay.value === '20' || delay.value === '')) delay.value = '5';
    const workers = document.getElementById('maxWorkers');
    if (workers && (workers.value === '60' || workers.value === '')) workers.value = '50';
    const retries = document.getElementById('maxRetries');
    if (retries && (retries.value === '5' || retries.value === '')) retries.value = '3';
  }

  function markRpcSuccess(rpc, elapsed) {
    if (!rpcStatus[rpc]) return;
    const s = rpcStatus[rpc];
    s.available = true;
    s.disabledUntil = 0;
    s.lastUsed = Date.now();
    s.successCount = (s.successCount || 0) + 1;
    s.responseTime = s.responseTime ? Math.round(s.responseTime * 0.7 + elapsed * 0.3) : elapsed;
  }

  function markRpcFailure(rpc, error) {
    if (!rpcStatus[rpc]) return;
    const s = rpcStatus[rpc];
    s.failCount = (s.failCount || 0) + 1;
    s.lastError = error ? String(error.message || error) : 'unknown';
    const fails = s.failCount || 1;
    const cooldown = Math.min(20000, 1500 * Math.max(1, Math.min(6, fails)));
    s.available = false;
    s.disabledUntil = Date.now() + cooldown;
    s.lastUsed = Date.now();
  }

  function buildRpcContext(rpc) {
    let ctx = rpcCtxCache.get(rpc);
    if (ctx) return ctx;
    const w3 = new Web3(rpc);
    ctx = {
      rpc,
      web3: w3,
      registry: new w3.eth.Contract(ENS_ABI, ENS_REGISTRY),
      registrar: new w3.eth.Contract(REGISTRAR_ABI, BASE_REGISTRAR),
      controller: new w3.eth.Contract(CONTROLLER_ABI, CONTROLLER),
      transferContract: new w3.eth.Contract(TRANSFER_ABI, BASE_REGISTRAR),
      nameWrapper: new w3.eth.Contract(NAME_WRAPPER_ABI, NAME_WRAPPER)
    };
    rpcCtxCache.set(rpc, ctx);
    return ctx;
  }

  function getHealthyRpcList() {
    const now = Date.now();
    const available = RPC_LIST.filter(r => {
      const s = rpcStatus[r] || {};
      return (s.available !== false) && (s.disabledUntil || 0) < now;
    });
    if (available.length) return available;
    Object.keys(rpcStatus).forEach(r => {
      rpcStatus[r].available = true;
      rpcStatus[r].disabledUntil = 0;
    });
    return RPC_LIST.slice();
  }

  function scoreRpc(rpc) {
    const s = rpcStatus[rpc] || {};
    const total = (s.successCount || 0) + (s.failCount || 0);
    const failRate = total ? (s.failCount || 0) / total : 0;
    const rt = s.responseTime || 300;
    const idleBonus = s.lastUsed ? Math.min(3000, Date.now() - s.lastUsed) / 1000 : 3;
    return (1 / Math.max(rt, 60)) * (1 - failRate * 0.6) + idleBonus * 0.015;
  }

  window.getCurrentRpc = function() {
    const selectedEl = document.getElementById('rpcSelect');
    const selected = selectedEl ? selectedEl.value : 'dynamic';
    if (selected && selected !== 'dynamic') return selected;
    const ranked = getHealthyRpcList().sort((a, b) => scoreRpc(b) - scoreRpc(a));
    const bucket = ranked.slice(0, Math.min(4, ranked.length));
    if (!bucket.length) return RPC_LIST[0];
    const rpc = bucket[rpcCursor % bucket.length];
    rpcCursor = (rpcCursor + 1) % Math.max(bucket.length, 1);
    return rpc;
  };

  async function getFastOwner(tokenId, ctx, maxRetries = 2) {
    let lastErr;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const owner = await ctx.registrar.methods.ownerOf(tokenId).call();
        return normalizeRegistrantOwner(owner);
      } catch (e) {
        lastErr = e;
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 80 * (attempt + 1)));
        }
      }
    }
    throw lastErr;
  }

  async function getLastOwnerWithContext(tokenId, ctx) {
    if (lastOwnerCache.has(tokenId)) return lastOwnerCache.get(tokenId);
    try {
      const events = await ctx.transferContract.getPastEvents('Transfer', {
        filter: { tokenId },
        fromBlock: 9380410,
        toBlock: 'latest'
      });
      if (!events.length) {
        lastOwnerCache.set(tokenId, '');
        return '';
      }
      for (let i = events.length - 1; i >= 0; i--) {
        const to = events[i].returnValues.to;
        if (to && to !== '0x0000000000000000000000000000000000000000') {
          lastOwnerCache.set(tokenId, to);
          return to;
        }
      }
      const from = events[events.length - 1]?.returnValues?.from || '';
      const val = from !== '0x0000000000000000000000000000000000000000' ? from : '';
      lastOwnerCache.set(tokenId, val);
      return val;
    } catch (_) {
      return '';
    }
  }

  window.getOwnerWithRetry = async function(tokenId, maxRetries = 2, ctx) {
    const localCtx = ctx || buildRpcContext(window.getCurrentRpc());
    return getFastOwner(tokenId, localCtx, Math.max(1, maxRetries));
  };

  function withTimeout(promise, timeoutMs, timeoutMessage) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(timeoutMessage || 'Request timeout')), timeoutMs);
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        }
      );
    });
  }

  window.queryDomain = async function(domain, idx, preferredCtx) {
    const label = domain.replace('.eth', '');
    const maxRetries = Math.max(1, uiNum('maxRetries', 2));
    const perAttemptTimeoutMs = Math.max(2500, uiNum('requestTimeoutMs', 9000));
    let tokenId;
    try {
      tokenId = Web3.utils.keccak256(label);
    } catch (_) {
      return {
        序号: idx + 1, 域名: domain, 状态: 'error', 过期天数: '', 过期时间: '', 宽限期结束: '', 注册时间: '',
        所有者地址: '', 错误信息: 'tokenId error', 注册状态: 'error', 过期状态: 'error', 宽限状态: 'error', 溢价状态: 'no_premium', 时间戳: 0
      };
    }

    let lastError = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const rpc = attempt === 0 && preferredCtx ? preferredCtx.rpc : window.getCurrentRpc();
      const ctx = attempt === 0 && preferredCtx ? preferredCtx : buildRpcContext(rpc);
      const started = Date.now();
      try {
        const available = await withTimeout(
          ctx.controller.methods.available(label).call(),
          perAttemptTimeoutMs,
          `RPC timeout: available(${domain})`
        );

        if (available) {
          try {
            const price = await withTimeout(
              ctx.controller.methods.rentPrice(label, 31536000).call(),
              perAttemptTimeoutMs,
              `RPC timeout: rentPrice(${domain})`
            );
            let expiry = 0;
            try {
              expiry = await withTimeout(
                ctx.registrar.methods.nameExpires(tokenId).call(),
                perAttemptTimeoutMs,
                `RPC timeout: nameExpires(${domain})`
              );
            } catch (_) {}
            if (price && price.premium && Number(price.premium) > 0) {
              const lastOwner = await getLastOwnerWithContext(tokenId, ctx);
              markRpcSuccess(rpc, Date.now() - started);
              return {
                序号: idx + 1, 域名: domain, 状态: 'premium',
                过期天数: expiry ? Math.floor((new Date(expiry * 1000) - new Date()) / 86400000) : '',
                过期时间: expiry ? formatDate(new Date(expiry * 1000)) : '',
                宽限期结束: expiry ? formatDate(new Date(expiry * 1000 + 90 * 86400000)) : '',
                注册时间: '', 所有者地址: lastOwner || '', 错误信息: '',
                注册状态: 'premium', 过期状态: expiry && new Date(expiry * 1000) < new Date() ? 'expired' : 'valid',
                宽限状态: 'no_grace', 溢价状态: 'in_premium', 时间戳: expiry || 0
              };
            }
            markRpcSuccess(rpc, Date.now() - started);
            return {
              序号: idx + 1, 域名: domain, 状态: 'unregistered', 过期天数: '', 过期时间: '', 宽限期结束: '', 注册时间: '',
              所有者地址: '', 错误信息: '', 注册状态: 'unregistered', 过期状态: 'valid', 宽限状态: 'no_grace', 溢价状态: 'no_premium', 时间戳: 0
            };
          } catch (_) {
            let owner = '';
            try { owner = await getFastOwner(tokenId, ctx, 1); } catch (_) {}
            if (!owner) owner = await getLastOwnerWithContext(tokenId, ctx);
            markRpcSuccess(rpc, Date.now() - started);
            return {
              序号: idx + 1, 域名: domain, 状态: owner ? 'registered' : 'premium',
              过期天数: '', 过期时间: '', 宽限期结束: '', 注册时间: '', 所有者地址: owner || '', 错误信息: '',
              注册状态: owner ? 'registered' : 'premium', 过期状态: 'valid', 宽限状态: 'no_grace',
              溢价状态: owner ? 'no_premium' : 'in_premium', 时间戳: 0
            };
          }
        }

        const expiry = await withTimeout(
          ctx.registrar.methods.nameExpires(tokenId).call(),
          perAttemptTimeoutMs,
          `RPC timeout: nameExpires(${domain})`
        );
        const expiryDate = new Date(Number(expiry) * 1000);
        const now = new Date();
        const days = Math.floor((expiryDate - now) / 86400000);
        const graceEnd = new Date(expiryDate.getTime() + 90 * 86400000);
        let owner = '';
        try { owner = await getFastOwner(tokenId, ctx, 2); } catch (_) {}
        if (!owner) owner = await getLastOwnerWithContext(tokenId, ctx);
        const expiryStatus = now > expiryDate ? 'expired' : 'valid';
        const graceStatus = now > expiryDate && now <= graceEnd ? 'in_grace' : 'no_grace';
        markRpcSuccess(rpc, Date.now() - started);
        return {
          序号: idx + 1, 域名: domain, 状态: expiryStatus === 'expired' ? 'expired' : 'registered',
          过期天数: days, 过期时间: formatDate(expiryDate), 宽限期结束: formatDate(graceEnd), 注册时间: '',
          所有者地址: owner || '', 错误信息: '', 注册状态: expiryStatus === 'expired' ? 'expired' : 'registered',
          过期状态: expiryStatus, 宽限状态: graceStatus, 溢价状态: 'no_premium', 时间戳: Number(expiry)
        };
      } catch (e) {
        lastError = e;
        markRpcFailure(rpc, e);
      }
    }
    return {
      序号: idx + 1, 域名: domain, 状态: 'error', 过期天数: '', 过期时间: '', 宽限期结束: '', 注册时间: '',
      所有者地址: '', 错误信息: String(lastError && lastError.message || '未知错误').slice(0, 100),
      注册状态: 'error', 过期状态: 'error', 宽限状态: 'error', 溢价状态: 'no_premium', 时间戳: 0
    };
  };

  let lastUiRefreshAt = 0;
  window.worker = async function() {
    while (isQueryRunning && !isPaused) {
      const idx = currentIndex++;
      if (idx >= pendingDomains.length) break;
      const rpc = window.getCurrentRpc();
      const ctx = buildRpcContext(rpc);
      const result = await window.queryDomain(pendingDomains[idx], idx, ctx);
      queryResults[idx] = result;
      processedDomains++;

      const nowMs = Date.now();
      const shouldRefreshUi = (nowMs - lastUiRefreshAt >= 120) || processedDomains === totalDomains;
      if (shouldRefreshUi) {
        lastUiRefreshAt = nowMs;
        const elapsedSec = Math.max((nowMs - startTime) / 1000, 0.001);
        const speed = (processedDomains / elapsedSec).toFixed(1) || '0';
        const querySpeedEl = document.getElementById('querySpeed');
        const querySpeedDisplayEl = document.getElementById('querySpeedDisplay');
        if (querySpeedEl) querySpeedEl.innerHTML = `${translations[currentLang].speed}: ${speed} ${translations[currentLang].speedUnit}`;
        if (querySpeedDisplayEl) querySpeedDisplayEl.textContent = speed;
        const pct = totalDomains ? (processedDomains / totalDomains * 100) : 0;
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const progressPercent = document.getElementById('progressPercent');
        const progressMiniBar = document.getElementById('progressMiniBar');
        const queryProgress = document.getElementById('queryProgress');
        if (progressBar) progressBar.style.width = pct + '%';
        if (progressMiniBar) progressMiniBar.style.width = pct + '%';
        if (progressText) progressText.innerHTML = `${processedDomains}/${totalDomains}`;
        if (queryProgress) queryProgress.textContent = `${processedDomains}/${totalDomains}`;
        if (progressPercent) progressPercent.innerText = Math.round(pct) + '%';
        updateRetryAllButton();
      }
      if (processedDomains % 20 === 0 || processedDomains === totalDomains) {
        filteredResults = queryResults.filter(Boolean);
        applyFilters();
        updateStatistics();
        updateRpcList();
      }
      if (processedDomains % 25 === 0 || processedDomains === totalDomains) {
        saveResultsToStorage();
        scheduleSessionSave();
      }

      const delay = uiNum('requestDelay', 0);
      if (!isPaused && delay > 0) await new Promise(r => setTimeout(r, delay));
    }
    activeWorkers--;
  };

  function finishWatcher() {
    if (window.__fastQueryInterval) clearInterval(window.__fastQueryInterval);
    window.__fastQueryInterval = setInterval(() => {
      if (!isQueryRunning || isPaused) return;
      if (activeWorkers <= 0 || processedDomains >= totalDomains) {
        clearInterval(window.__fastQueryInterval);
        window.__fastQueryInterval = null;
        if (!isPaused) completeQuery();
      }
    }, 120);
  }

  window.startQuery = async function() {
    if (isQueryRunning) return;
    ensureFastDefaults();
    const domains = document.getElementById('domainsText').value.split('\n').map(d => normalizeDomain(d)).filter(Boolean);
    if (!domains.length) return;
    isQueryRunning = true;
    isPaused = false;
    pendingDomains = domains;
    currentIndex = 0;
    queryResults = new Array(domains.length);
    filteredResults = [];
    totalDomains = domains.length;
    processedDomains = 0;
    startTime = Date.now();
    lastUiRefreshAt = 0;
    currentPage = 1;
    document.getElementById('startQueryBtn').disabled = true;
    document.getElementById('resumeQueryBtn').disabled = true;
    document.getElementById('stopQueryBtn').disabled = false;
    document.getElementById('cancelQueryBtn').disabled = false;
    document.getElementById('exportBtn').disabled = true;
    document.getElementById('retryAllBtn').disabled = true;
    resetRpcRunQueryCount();
    addLog((translations[currentLang].logQueryStart || '开始查询 {count} 个域名').replace('{count}', totalDomains), 'info');
    scheduleSessionSave(true);
    const maxWorkers = Math.max(1, Math.min(200, uiNum('maxWorkers', 50)));
    activeWorkers = maxWorkers;
    for (let i = 0; i < maxWorkers; i++) window.worker();
    finishWatcher();
  };

  window.resumeQuery = async function() {
    if (isQueryRunning || currentIndex >= pendingDomains.length) return;
    ensureFastDefaults();
    isQueryRunning = true;
    isPaused = false;
    lastUiRefreshAt = 0;
    document.getElementById('startQueryBtn').disabled = true;
    document.getElementById('resumeQueryBtn').disabled = true;
    document.getElementById('stopQueryBtn').disabled = false;
    document.getElementById('cancelQueryBtn').disabled = false;
    document.getElementById('exportBtn').disabled = true;
    document.getElementById('retryAllBtn').disabled = true;
    addLog((translations[currentLang].logQueryResumed || '继续查询，剩余 {remaining} 个域名').replace('{remaining}', pendingDomains.length - currentIndex), 'info');
    scheduleSessionSave(true);
    const maxWorkers = Math.max(1, Math.min(200, uiNum('maxWorkers', 50)));
    activeWorkers = maxWorkers;
    for (let i = 0; i < maxWorkers; i++) window.worker();
    finishWatcher();
  };

  window.cancelQuery = function() {
    if (!isQueryRunning && !(isPaused && currentIndex < pendingDomains.length)) return;
    isPaused = false;
    isQueryRunning = false;
    currentIndex = pendingDomains.length;
    activeWorkers = 0;
    document.getElementById('startQueryBtn').disabled = false;
    document.getElementById('resumeQueryBtn').disabled = true;
    document.getElementById('stopQueryBtn').disabled = true;
    document.getElementById('cancelQueryBtn').disabled = true;
    document.getElementById('exportBtn').disabled = false;
    document.getElementById('retryAllBtn').disabled = false;
    updateRetryAllButton();
    addLog((translations[currentLang].logQueryCanceled || '查询已取消，已处理 {processed}/{total}')
      .replace('{processed}', processedDomains)
      .replace('{total}', totalDomains), 'warning');
    saveResultsToStorage();
    scheduleSessionSave(true);
  };

  let ownerTooltipEl = null;
  let ownerTooltipTarget = null;

  function ensureOwnerTooltip() {
    if (ownerTooltipEl) return ownerTooltipEl;
    ownerTooltipEl = document.createElement('div');
    ownerTooltipEl.className = 'owner-tooltip';
    document.body.appendChild(ownerTooltipEl);
    return ownerTooltipEl;
  }

  function hideOwnerTooltip() {
    if (!ownerTooltipEl) return;
    ownerTooltipEl.classList.remove('is-visible', 'is-multiline');
    ownerTooltipEl.style.transform = 'translate3d(-9999px, -9999px, 0)';
    ownerTooltipTarget = null;
  }

  function positionOwnerTooltip(target) {
    if (!target || !ownerTooltipEl) return;
    const rect = target.getBoundingClientRect();
    const spacing = 10;
    const viewportPadding = 12;
    const preferredMinWidth = Math.min(168, Math.max(120, window.innerWidth - viewportPadding * 2));
    ownerTooltipEl.classList.remove('is-multiline');
    ownerTooltipEl.style.left = '0px';
    ownerTooltipEl.style.top = '0px';
    ownerTooltipEl.style.width = 'max-content';
    ownerTooltipEl.style.minWidth = `${preferredMinWidth}px`;
    ownerTooltipEl.style.maxWidth = `${Math.max(220, window.innerWidth - viewportPadding * 2)}px`;
    ownerTooltipEl.style.transform = 'translate3d(-9999px, -9999px, 0)';

    let width = ownerTooltipEl.offsetWidth;
    const maxWidth = Math.max(220, window.innerWidth - viewportPadding * 2);
    if (width > maxWidth) {
      ownerTooltipEl.classList.add('is-multiline');
      ownerTooltipEl.style.width = `${maxWidth}px`;
      ownerTooltipEl.style.minWidth = '0';
      width = ownerTooltipEl.offsetWidth;
    } else {
      ownerTooltipEl.style.width = 'max-content';
      ownerTooltipEl.style.minWidth = `${preferredMinWidth}px`;
      width = ownerTooltipEl.offsetWidth;
    }

    const height = ownerTooltipEl.offsetHeight;
    const centeredLeft = rect.left + rect.width / 2 - width / 2;
    const left = Math.min(Math.max(centeredLeft, viewportPadding), window.innerWidth - width - viewportPadding);
    let top = rect.top - height - spacing;
    if (top < viewportPadding) {
      top = rect.bottom + spacing;
    }
    ownerTooltipEl.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
  }

  function showOwnerTooltip(target) {
    const text = target?.dataset?.ownerTooltip;
    if (!text) return;
    ownerTooltipTarget = target;
    const tooltip = ensureOwnerTooltip();
    tooltip.textContent = text;
    tooltip.classList.add('is-visible');
    positionOwnerTooltip(target);
  }

  window.retryAllFailed = async function() {
    if (isQueryRunning) {
      addLog(currentLang === 'zh' ? '请先暂停查询再重试失败域名' : 'Pause query before retrying failed domains', 'warning');
      return;
    }
    if (isRetrying || isRetryingAll) return;
    const failedDomains = queryResults.filter(r => r && (r.注册状态 === 'error' || r.状态 === 'error')).map(r => ({ domain: r.域名, index: r.序号 - 1 }));
    if (!failedDomains.length) {
      addLog(currentLang === 'zh' ? '没有失败的域名需要刷新' : 'No failed domains to refresh', 'info');
      return;
    }
    isRetryingAll = true;
    document.getElementById('startQueryBtn').disabled = true;
    document.getElementById('resumeQueryBtn').disabled = true;
    document.getElementById('stopQueryBtn').disabled = true;
    document.getElementById('cancelQueryBtn').disabled = true;
    document.getElementById('exportBtn').disabled = true;
    document.getElementById('retryAllBtn').disabled = true;
    const progressText = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    const progressBar = document.getElementById('progressMiniBar');
    let successCount = 0, failCount = 0;
    const concurrency = Math.max(20, Math.min(120, uiNum('maxWorkers', 50)));
    for (let i = 0; i < failedDomains.length; i += concurrency) {
      const batch = failedDomains.slice(i, i + concurrency);
      await Promise.all(batch.map(async item => {
        const result = await window.queryDomain(item.domain, item.index);
        queryResults[item.index] = result;
        if (result && result.注册状态 !== 'error' && result.状态 !== 'error') successCount++;
        else failCount++;
      }));
      const done = Math.min(i + concurrency, failedDomains.length);
      const percent = Math.round((done / failedDomains.length) * 100);
      if (progressText) progressText.innerHTML = currentLang === 'zh' ? `批量刷新中: ${done}/${failedDomains.length}` : `Refreshing: ${done}/${failedDomains.length}`;
      if (progressPercent) progressPercent.innerText = percent + '%';
      if (progressBar) progressBar.style.width = percent + '%';
      filteredResults = queryResults.filter(Boolean);
      applyFilters();
      updateStatistics();
      updateRpcList();
    }
    if (progressPercent) progressPercent.innerText = '0%';
    if (progressBar) progressBar.style.width = '0%';
    isRetryingAll = false;
    document.getElementById('startQueryBtn').disabled = false;
    document.getElementById('resumeQueryBtn').disabled = false;
    document.getElementById('stopQueryBtn').disabled = true;
    document.getElementById('cancelQueryBtn').disabled = !(isPaused && currentIndex < pendingDomains.length);
    document.getElementById('exportBtn').disabled = false;
    saveResultsToStorage();
    updateRetryAllButton();
    addLog((translations[currentLang].logRetryAllComplete || '批量重试完成: 成功 {success} 个, 失败 {failed} 个').replace('{success}', successCount).replace('{failed}', failCount), successCount ? 'success' : 'warning');
  };

  document.addEventListener('DOMContentLoaded', () => {
    ensureFastDefaults();
    setTimeout(() => {
      updateRpcList();
      const note = currentLang === 'zh'
        ? '已切换到极速版：0延迟 + 智能动态RPC轮询 + 50并发默认值'
        : 'Turbo mode enabled: 0 delay + smart dynamic RPC rotation + 50 workers';
      addLog(note, 'success');
    }, 300);
  });

  window.startQuery = window.startQuery;
  window.resumeQuery = window.resumeQuery;
  window.retryAllFailed = window.retryAllFailed;
})();
