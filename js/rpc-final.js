(function(){
  const FINAL_RPC_SOURCES = [
    'https://chainid.network/chains.json',
    'https://raw.githubusercontent.com/ethereum-lists/chains/master/_data/chains/eip155-1.json'
  ];
  const AUTO_ERROR_RETRY_ROUNDS = 3;
  const BASE_RPC_LIST = Array.isArray(RPC_LIST) ? RPC_LIST.slice() : [];
  const BASE_RPC_SET = new Set(BASE_RPC_LIST.map(normalizeRpcUrl).filter(Boolean));
  const finalRpcCtxCache = new Map();
  let finalRpcCursor = 0;
  let rpcProbeCursor = 0;
  let autoRefreshTaskId = 0;

  Object.assign(translations.zh, {
    error: '错误',
    expiry: '过期时间',
    released: '已释放',
    statusGrace: '宽限期',
    statusReleased: '已释放',
    retrySingle: translations.zh.retrySingle || '点击重试此域名'
  });
  Object.assign(translations.en, {
    error: 'Error',
    expiry: 'Expiry',
    released: 'Released',
    statusGrace: 'Grace',
    statusReleased: 'Released',
    retrySingle: translations.en.retrySingle || 'Retry this domain'
  });

  function num(id, fallback) {
    const el = document.getElementById(id);
    const value = el ? parseInt(el.value, 10) : NaN;
    return Number.isFinite(value) ? value : fallback;
  }

  function withFinalTimeout(promise, timeoutMs, message) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(message || 'RPC timeout')), Math.max(1000, timeoutMs || 1000));
      Promise.resolve(promise)
        .then(value => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  function normalizeRpcUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed.startsWith('http')) return '';
    if (trimmed.includes('${') || trimmed.startsWith('wss')) return '';
    return trimmed.replace(/\/$/, '');
  }

  function isReliableRpc(rpc) {
    const key = normalizeRpcUrl(rpc);
    if (!key) return false;
    const status = rpcStatus[key] || {};
    const success = status.successCount || 0;
    const fail = status.failCount || 0;
    if (BASE_RPC_SET.has(key)) return true;
    return success > 0 && success >= fail;
  }

  function isRpcReady(rpc, now = Date.now()) {
    const key = normalizeRpcUrl(rpc);
    if (!key) return false;
    const status = rpcStatus[key] || {};
    return (status.disabledUntil || 0) < now;
  }


  function ensNamehashFinal(name) {
    let node = '0x' + '00'.repeat(32);
    const parts = String(name || '').toLowerCase().split('.').filter(Boolean).reverse();
    for (const part of parts) {
      const labelHash = Web3.utils.keccak256(part);
      node = Web3.utils.soliditySha3({ type: 'bytes32', value: node }, { type: 'bytes32', value: labelHash });
    }
    return node;
  }

  function normalizeAddressFinal(addr) {
    return addr && addr !== '0x0000000000000000000000000000000000000000' ? addr : '';
  }

  async function getRegistryOwnerFinal(domain, ctx) {
    try {
      const timeoutMs = Math.max(3000, num('timeout', 12) * 1000);
      const owner = await withFinalTimeout(
        ctx.registry.methods.owner(ensNamehashFinal(domain)).call(),
        Math.min(timeoutMs, 10000),
        `registry owner timeout: ${domain}`
      );
      return normalizeAddressFinal(owner);
    } catch (_) {
      return '';
    }
  }

  async function getWrappedOwnerFinal(domain, ctx) {
    try {
      const timeoutMs = Math.max(3000, num('timeout', 12) * 1000);
      const wrappedTokenId = ctx.web3.utils.toBN(ensNamehashFinal(domain)).toString();
      const wrappedOwner = await withFinalTimeout(
        ctx.nameWrapper.methods.ownerOf(wrappedTokenId).call(),
        Math.min(timeoutMs, 10000),
        `nameWrapper owner timeout: ${domain}`
      );
      return normalizeRegistrantOwner(normalizeAddressFinal(wrappedOwner));
    } catch (_) {
      return '';
    }
  }

  function isWrapperCustodyOwner(owner) {
    if (!owner) return false;
    return String(owner).toLowerCase() === NAME_WRAPPER.toLowerCase();
  }

  function getLookupContexts(preferredCtx) {
    const currentRpc = typeof window.getCurrentRpc === 'function' ? window.getCurrentRpc() : '';
    const rankedReliable = RPC_LIST
      .slice()
      .filter(isReliableRpc)
      .sort((a, b) => scoreRpcFinal(b) - scoreRpcFinal(a))
      .slice(0, 1);
    const rpcCandidates = [preferredCtx?.rpc, currentRpc, ...rankedReliable].filter(Boolean);
    const unique = [];
    const seen = new Set();
    rpcCandidates.forEach(rpc => {
      const normalized = normalizeRpcUrl(rpc);
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        unique.push(normalized);
      }
    });
    if (preferredCtx?.web3) return [preferredCtx, ...unique.filter(rpc => rpc !== preferredCtx.rpc).map(getOrCreateCtx)];
    return unique.map(getOrCreateCtx);
  }

  async function loadRegistrationMetaFromCtx(tokenId, ctx) {
    const timeoutMs = Math.max(3000, num('timeout', 12) * 1000);
    let events = [];
    try {
      events = await withFinalTimeout(
        ctx.registrar.getPastEvents('NameRegistered', {
          filter: { id: tokenId },
          fromBlock: 9380410,
          toBlock: 'latest'
        }),
        timeoutMs,
        'NameRegistered events timeout'
      );
    } catch (_) {
      events = [];
    }

    if (events.length) {
      const event = events[events.length - 1];
      const block = await withFinalTimeout(
        ctx.web3.eth.getBlock(event.blockNumber),
        Math.min(timeoutMs, 8000),
        'block lookup timeout'
      );
      return {
        time: block?.timestamp ? formatDate(new Date(Number(block.timestamp) * 1000)) : '',
        owner: normalizeRegistrantOwner(normalizeAddressFinal(event?.returnValues?.owner || ''))
      };
    }

    const transferEvents = await withFinalTimeout(
      ctx.transferContract.getPastEvents('Transfer', {
        filter: { tokenId },
        fromBlock: 9380410,
        toBlock: 'latest'
      }),
      timeoutMs,
      'Transfer events timeout'
    );
    const mintEvent = transferEvents.find(ev => /^0x0{40}$/i.test(ev?.returnValues?.from || ''));
    if (!mintEvent) return { time: '', owner: '' };

    const mintBlock = await withFinalTimeout(
      ctx.web3.eth.getBlock(mintEvent.blockNumber),
      Math.min(timeoutMs, 8000),
      'mint block lookup timeout'
    );
    return {
      time: mintBlock?.timestamp ? formatDate(new Date(Number(mintBlock.timestamp) * 1000)) : '',
      owner: normalizeRegistrantOwner(normalizeAddressFinal(mintEvent?.returnValues?.to || ''))
    };
  }

  async function getRegistrationMetaFinal(label, tokenId, ctx) {
    const cacheKey = String(tokenId).toLowerCase();
    if (registrationMetaCache.has(cacheKey)) return registrationMetaCache.get(cacheKey);

    const empty = { time: '', owner: '' };
    for (const lookupCtx of getLookupContexts(ctx)) {
      try {
        const result = await loadRegistrationMetaFromCtx(tokenId, lookupCtx);
        if (result.time || result.owner) {
          registrationMetaCache.set(cacheKey, result);
          return result;
        }
      } catch (_) {}
    }

    registrationMetaCache.set(cacheKey, empty);
    return empty;
  }

  function getOrCreateCtx(rpc) {
    const key = normalizeRpcUrl(rpc);
    if (!key) throw new Error('invalid rpc');
    if (finalRpcCtxCache.has(key)) return finalRpcCtxCache.get(key);
    const web3Instance = new Web3(key);
    const ctx = {
      rpc: key,
      web3: web3Instance,
      registry: new web3Instance.eth.Contract(ENS_ABI, ENS_REGISTRY),
      registrar: new web3Instance.eth.Contract(REGISTRAR_ABI, BASE_REGISTRAR),
      controller: new web3Instance.eth.Contract(CONTROLLER_ABI, CONTROLLER),
      transferContract: new web3Instance.eth.Contract(TRANSFER_ABI, BASE_REGISTRAR),
      nameWrapper: new web3Instance.eth.Contract(NAME_WRAPPER_ABI, NAME_WRAPPER)
    };
    finalRpcCtxCache.set(key, ctx);
    return ctx;
  }

  function markRpcSuccessFinal(rpc, elapsedMs) {
    if (!rpcStatus[rpc]) return;
    const s = rpcStatus[rpc];
    s.available = true;
    s.disabledUntil = 0;
    s.successCount = (s.successCount || 0) + 1;
    s.lastUsed = Date.now();
    s.responseTime = s.responseTime ? Math.round(s.responseTime * 0.7 + elapsedMs * 0.3) : elapsedMs;
  }

  function markRpcFailureFinal(rpc, error) {
    if (!rpcStatus[rpc]) return;
    const s = rpcStatus[rpc];
    s.available = false;
    s.failCount = (s.failCount || 0) + 1;
    s.lastUsed = Date.now();
    s.lastError = String((error && error.message) || error || 'unknown');
    s.disabledUntil = Date.now() + Math.min(30000, 2000 * Math.max(1, s.failCount));
  }

  function scoreRpcFinal(rpc) {
    const s = rpcStatus[rpc] || {};
    const total = (s.successCount || 0) + (s.failCount || 0);
    const failRate = total ? (s.failCount || 0) / total : 0;
    const latency = s.responseTime || 280;
    const availabilityBoost = (s.available === false && (s.disabledUntil || 0) > Date.now()) ? -10 : 0;
    return availabilityBoost + (1000 / Math.max(latency, 60)) - failRate * 8;
  }

  window.getCurrentRpc = function() {
    const selected = document.getElementById('rpcSelect')?.value || 'dynamic';
    if (selected !== 'dynamic') return selected;
    const now = Date.now();
    const healthyReliable = RPC_LIST.filter(r => {
      const s = rpcStatus[r] || {};
      return isReliableRpc(r) && (s.available !== false) && (s.disabledUntil || 0) < now;
    });
    const fallbackReliable = RPC_LIST.filter(isReliableRpc);
    const fallbackBase = BASE_RPC_LIST.slice();
    const pool = (healthyReliable.length ? healthyReliable : (fallbackReliable.length ? fallbackReliable : fallbackBase))
      .sort((a, b) => scoreRpcFinal(b) - scoreRpcFinal(a));
    const bucket = pool.slice(0, Math.max(1, Math.min(8, pool.length)));

    // 为防止少量头部节点被限流：周期性探测“已过冷却”的节点，恢复后自动回流到主池。
    const probeCandidates = RPC_LIST.filter(r => !isReliableRpc(r) && isRpcReady(r, now));
    const shouldProbe = probeCandidates.length > 0 && ((finalRpcCursor + 1) % 6 === 0);
    let rpc;
    if (shouldProbe) {
      rpc = probeCandidates[rpcProbeCursor % probeCandidates.length];
      rpcProbeCursor = (rpcProbeCursor + 1) % Math.max(1, probeCandidates.length);
    } else {
      rpc = bucket[finalRpcCursor % bucket.length] || RPC_LIST[0];
    }
    finalRpcCursor = (finalRpcCursor + 1) % Math.max(1, bucket.length || 1);
    return rpc;
  };

  async function fetchRemoteRpcCandidates() {
    const collected = [];
    for (const source of FINAL_RPC_SOURCES) {
      try {
        const res = await fetch(source, { cache: 'no-store' });
        const data = await res.json();
        if (Array.isArray(data)) {
          const mainnet = data.find(item => item.chainId === 1 || item.chain === 'ETH');
          if (mainnet && Array.isArray(mainnet.rpc)) collected.push(...mainnet.rpc);
        } else if (data && Array.isArray(data.rpc)) {
          collected.push(...data.rpc);
        }
      } catch (e) {
        console.warn('RPC source fetch failed:', source, e);
      }
    }
    return [...new Set(collected.map(normalizeRpcUrl).filter(Boolean))];
  }

  async function refreshRpcPoolFromWeb(silent = false) {
    try {
      const remote = await fetchRemoteRpcCandidates();
      if (!remote.length) return;
      const merged = [...new Set([...RPC_LIST, ...remote])].slice(0, 80);
      RPC_LIST.splice(0, RPC_LIST.length, ...merged);
      merged.forEach(rpc => {
        if (!rpcStatus[rpc]) {
          rpcStatus[rpc] = {
            available: true,
            successCount: 0,
            failCount: 0,
            responseTime: 0,
            disabledUntil: 0,
            lastUsed: 0,
            runQueryCount: 0
          };
        }
      });
      const select = document.getElementById('rpcSelect');
      if (select) {
        const previous = select.value;
        const manualOptions = ['dynamic'];
        const dynamicLabel = currentLang === 'zh' ? '🌐 智能动态RPC' : '🌐 Smart Dynamic RPC';
        select.innerHTML = `<option value="dynamic">${dynamicLabel}</option>` + merged.map(rpc => {
          const label = (() => { try { return new URL(rpc).hostname; } catch { return rpc; } })();
          return `<option value="${rpc}">${label}</option>`;
        }).join('');
        select.value = manualOptions.includes(previous) || merged.includes(previous) ? previous : 'dynamic';
      }
      updateRpcList();
      if (!silent) addLog(currentLang === 'zh' ? `已自动更新 ${merged.length} 个RPC节点` : `RPC pool updated: ${merged.length} nodes`, 'info');
    } catch (e) {
      console.warn('refreshRpcPoolFromWeb failed', e);
    }
  }

  async function readAvailableAndPrice(ctx, label) {
    const available = await ctx.controller.methods.available(label).call();
    let price = null;
    let priceError = null;
    try {
      price = await ctx.controller.methods.rentPrice(label, 31536000).call();
    } catch (e) {
      priceError = e;
    }
    return { available, price, priceError };
  }

  function getPremiumAmount(price) {
    if (!price) return 0n;
    const raw = price.premium ?? price?.price?.premium ?? price?.[0]?.premium ?? price[1] ?? price['1'] ?? 0;
    try {
      return BigInt(raw);
    } catch (_) {
      const parsed = Number(raw);
      return Number.isFinite(parsed) && parsed > 0 ? 1n : 0n;
    }
  }

  async function getFastOwnerFinal(domain, tokenId, ctx, maxRetries = 2) {
    let lastErr;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const owner = normalizeAddressFinal(await ctx.registrar.methods.ownerOf(tokenId).call());
        if (!owner) return '';
        if (isWrapperCustodyOwner(owner)) {
          return await getWrappedOwnerFinal(domain, ctx);
        }
        return normalizeRegistrantOwner(owner);
      } catch (e) {
        lastErr = e;
        if (attempt < maxRetries - 1) await new Promise(r => setTimeout(r, 80 * (attempt + 1)));
      }
    }
    throw lastErr;
  }

  async function getLastOwnerFinal(tokenId, ctx) {
    const cacheKey = String(tokenId).toLowerCase();
    if (lastOwnerCache.has(cacheKey)) return lastOwnerCache.get(cacheKey);
    const timeoutMs = Math.max(3000, num('timeout', 12) * 1000);

    for (const lookupCtx of getLookupContexts(ctx)) {
      try {
        const events = await withFinalTimeout(
          lookupCtx.transferContract.getPastEvents('Transfer', {
            filter: { tokenId },
            fromBlock: 9380410,
            toBlock: 'latest'
          }),
          timeoutMs,
          'last owner events timeout'
        );
        if (!events.length) continue;

        for (let i = events.length - 1; i >= 0; i--) {
          const to = normalizeRegistrantOwner(((events[i]?.returnValues?.to || '') !== '0x0000000000000000000000000000000000000000') ? (events[i]?.returnValues?.to || '') : '');
          if (to) {
            lastOwnerCache.set(cacheKey, to);
            return to;
          }
          const from = normalizeRegistrantOwner(((events[i]?.returnValues?.from || '') !== '0x0000000000000000000000000000000000000000') ? (events[i]?.returnValues?.from || '') : '');
          if (from) {
            lastOwnerCache.set(cacheKey, from);
            return from;
          }
        }

        const fallback = normalizeRegistrantOwner(normalizeAddressFinal(events[events.length - 1]?.returnValues?.from || ''));
        if (fallback) {
          lastOwnerCache.set(cacheKey, fallback);
          return fallback;
        }
      } catch (_) {}
    }

    lastOwnerCache.set(cacheKey, '');
    return '';
  }

  window.queryDomain = async function(domain, idx, preferredSource) {
    const label = domain.replace(/\.eth$/i, '');
    const maxRetries = Math.max(1, num('maxRetries', 3));
    const timeoutMs = Math.max(3000, num('timeout', 12) * 1000);
    let tokenId;
    try {
      tokenId = Web3.utils.keccak256(label);
    } catch (_) {
      return {
        序号: idx + 1, 域名: domain, 状态: 'error', 过期天数: '', 过期时间: '', 宽限期结束: '', 注册时间: '', 所有者地址: '',
        管理员地址: '', 错误信息: 'tokenId error', 注册状态: 'error', 过期状态: 'error', 宽限状态: 'error', 溢价状态: 'no_premium', 时间戳: 0
      };
    }

    let lastError = null;
    const triedRpcs = new Set();
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let rpc = typeof preferredSource === 'string' && preferredSource ? preferredSource : (preferredSource && preferredSource.rpc) || window.getCurrentRpc();
      if ((!preferredSource || !preferredSource.web3) && (!preferredSource || typeof preferredSource !== 'string')) {
        if (triedRpcs.has(rpc)) {
          const now = Date.now();
          const alt = RPC_LIST.find(r => !triedRpcs.has(r) && (rpcStatus[r]?.available !== false || (rpcStatus[r]?.disabledUntil || 0) < now));
          if (alt) rpc = alt;
        }
      }
      triedRpcs.add(rpc);
      markRpcDomainQuery(rpc);
      const ctx = preferredSource && preferredSource.web3 ? preferredSource : getOrCreateCtx(rpc);
      const started = Date.now();
      try {
        const [{ available, price, priceError }, expiryRaw] = await withFinalTimeout(
          Promise.all([
            readAvailableAndPrice(ctx, label),
            ctx.registrar.methods.nameExpires(tokenId).call().catch(() => 0)
          ]),
          timeoutMs,
          `query timeout: ${domain}`
        );
        const expiry = Number(expiryRaw || 0);
        const nowTs = Math.floor(Date.now() / 1000);
        const graceEndTs = expiry ? expiry + 90 * 24 * 3600 : 0;
        const premiumEndTs = graceEndTs ? graceEndTs + 21 * 24 * 3600 : 0;
        const premiumAmount = getPremiumAmount(price);
        const inferredPremiumByExpiry = Boolean(
          available &&
          expiry &&
          nowTs > graceEndTs &&
          nowTs <= premiumEndTs
        );
        const isPremiumAvailable = premiumAmount > 0n || inferredPremiumByExpiry;
        if (available) {
          // ENS official flow: available=true means name can be registered now.
          // premium > 0 indicates Dutch-auction premium period, not an active registration.
          let previousOwner = '';
          let managerAddress = '';
          const isGracePeriod = Boolean(expiry && nowTs > expiry && nowTs <= graceEndTs);
          if (isPremiumAvailable || isGracePeriod) {
            previousOwner = await withFinalTimeout(
              getLastOwnerFinal(tokenId, ctx),
              timeoutMs,
              `last owner timeout: ${domain}`
            );
            if (!previousOwner) {
              const registrationMeta = await withFinalTimeout(
                getRegistrationMetaFinal(label, tokenId, ctx),
                timeoutMs,
                `registration meta timeout: ${domain}`
              );
              previousOwner = registrationMeta.owner || '';
            }
          }
          if (isGracePeriod) {
            managerAddress = await withFinalTimeout(
              getRegistryOwnerFinal(domain, ctx),
              Math.min(timeoutMs, 8000),
              `registry manager timeout: ${domain}`
            ).catch(() => '');
          }
          markRpcSuccessFinal(rpc, Date.now() - started);
          if (isGracePeriod) {
            return {
              序号: idx + 1,
              域名: domain,
              状态: 'expired',
              过期天数: Math.floor((expiry * 1000 - Date.now()) / 86400000),
              过期时间: formatDate(new Date(expiry * 1000)),
              宽限期结束: formatDate(new Date(graceEndTs * 1000)),
              注册时间: '',
              所有者地址: previousOwner,
              管理员地址: managerAddress,
              错误信息: '',
              注册状态: 'expired',
              过期状态: 'expired',
              宽限状态: 'in_grace',
              溢价状态: 'no_premium',
              时间戳: expiry || 0
            };
          }
          return {
            序号: idx + 1,
            域名: domain,
            状态: isPremiumAvailable ? 'premium' : 'unregistered',
            过期天数: '',
            过期时间: '',
            宽限期结束: '',
            注册时间: '',
            所有者地址: isPremiumAvailable ? previousOwner : '',
            管理员地址: managerAddress,
            错误信息: (!price && priceError && !inferredPremiumByExpiry)
              ? String(priceError.message || priceError.reason || priceError.code || '').slice(0, 80)
              : '',
            注册状态: isPremiumAvailable ? 'premium' : 'unregistered',
            过期状态: isPremiumAvailable ? 'expired' : 'valid',
            宽限状态: 'no_grace',
            溢价状态: isPremiumAvailable ? 'in_premium' : 'no_premium',
            时间戳: 0
          };
        }

        const cacheKey = String(tokenId).toLowerCase();
        let registrationMeta = registrationMetaCache.get(cacheKey) || { time: '', owner: '' };
        const ownerFromFastCall = await (async () => {
          try {
            return await getFastOwnerFinal(domain, tokenId, ctx, 2);
          } catch (_) {
            return '';
          }
        })();

        let owner = ownerFromFastCall || '';
        if (!owner) {
          const [metaResult, lastOwner] = await Promise.all([
            withFinalTimeout(getRegistrationMetaFinal(label, tokenId, ctx), timeoutMs, `registration meta timeout: ${domain}`)
              .catch(() => ({ time: '', owner: '' })),
            withFinalTimeout(getLastOwnerFinal(tokenId, ctx), timeoutMs, `last owner timeout: ${domain}`)
              .catch(() => '')
          ]);
          registrationMeta = metaResult || registrationMeta;
          const normalizedMetaOwner = normalizeRegistrantOwner(registrationMeta.owner || '');
          owner = normalizedMetaOwner || normalizeRegistrantOwner(lastOwner) || '';
        }

        const expiryDate = expiry ? new Date(expiry * 1000) : null;
        const graceEndDate = graceEndTs ? new Date(graceEndTs * 1000) : null;
        let regStatus = 'registered';
        let state = 'registered';
        let expiryStatus = 'valid';
        let graceStatus = 'no_grace';

        if (expiry && nowTs > graceEndTs) {
          regStatus = 'unregistered';
          state = 'unregistered';
          owner = '';
          expiryStatus = 'expired';
        } else if (expiry && nowTs > expiry) {
          regStatus = 'expired';
          state = 'expired';
          expiryStatus = 'expired';
          graceStatus = 'in_grace';
        } else if (!expiry && (!owner || /^0x0{40}$/i.test(owner))) {
          // Reserved/special names can report available=false without active registration.
          regStatus = 'unregistered';
          state = 'unregistered';
          owner = '';
          expiryStatus = 'valid';
        }

        const isUnregisteredLike = regStatus === 'unregistered';
        const managerAddress = isUnregisteredLike
          ? ''
          : await withFinalTimeout(
              getRegistryOwnerFinal(domain, ctx),
              Math.min(timeoutMs, 8000),
              `registry manager timeout: ${domain}`
            ).catch(() => '');
        markRpcSuccessFinal(rpc, Date.now() - started);
        return {
          序号: idx + 1,
          域名: domain,
          状态: state,
          过期天数: isUnregisteredLike ? '' : (expiry ? Math.floor((expiry * 1000 - Date.now()) / 86400000) : ''),
          过期时间: isUnregisteredLike ? '' : (expiryDate ? formatDate(expiryDate) : ''),
          宽限期结束: isUnregisteredLike ? '' : (graceEndDate ? formatDate(graceEndDate) : ''),
          注册时间: isUnregisteredLike ? '' : (registrationMeta.time || ''),
          所有者地址: isUnregisteredLike ? '' : (owner || registrationMeta.owner || ''),
          管理员地址: managerAddress,
          错误信息: '',
          注册状态: regStatus,
          过期状态: expiryStatus,
          宽限状态: graceStatus,
          溢价状态: 'no_premium',
          时间戳: isUnregisteredLike ? 0 : (expiry || 0)
        };
      } catch (e) {
        lastError = e;
        markRpcFailureFinal(rpc, e);
      }
    }

    return {
      序号: idx + 1, 域名: domain, 状态: 'error', 过期天数: '', 过期时间: '', 宽限期结束: '', 注册时间: '', 所有者地址: '',
      管理员地址: '', 错误信息: (`${String((lastError && (lastError.message || lastError.reason || lastError.code || JSON.stringify(lastError))) || (currentLang === 'zh' ? '未知错误: RPC无响应或返回空' : 'Unknown error: empty RPC response'))} | attempts:${maxRetries} rpcs:${triedRpcs.size}`).slice(0, 180), 注册状态: 'error', 过期状态: 'error', 宽限状态: 'error', 溢价状态: 'no_premium', 时间戳: 0
    };
  };

  function isErroredResult(result) {
    return Boolean(result && !result.重试中 && (result.注册状态 === 'error' || result.状态 === 'error'));
  }

  function needsBackgroundRefresh(result) {
    if (!result || result.重试中 || isErroredResult(result)) return false;
    if ((result.注册状态 === 'registered' || result.状态 === 'registered' || result.注册状态 === 'expired' || result.状态 === 'expired') && !result.所有者地址) return true;
    if ((result.注册状态 === 'registered' || result.状态 === 'registered') && !result.注册时间) return true;
    if ((result.注册状态 === 'premium' || result.状态 === 'premium') && !result.所有者地址) return true;
    return false;
  }

  function resultCompletenessScore(result) {
    if (!result) return 0;
    let score = 0;
    if (result.注册状态 && result.注册状态 !== 'error') score += 2;
    if (result.所有者地址) score += 3;
    if (result.注册时间) score += 2;
    if (result.过期时间) score += 1;
    if (result.错误信息) score -= 2;
    return score;
  }

  function buildAutoRetryRpcList() {
    const selected = document.getElementById('rpcSelect')?.value;
    const now = Date.now();
    const ranked = RPC_LIST
      .slice()
      .sort((a, b) => scoreRpcFinal(b) - scoreRpcFinal(a));
    const ordered = [selected !== 'dynamic' ? selected : '', window.getCurrentRpc(), ...ranked]
      .map(normalizeRpcUrl)
      .filter(Boolean);
    const healthy = [];
    const fallback = [];
    const seen = new Set();
    ordered.forEach(rpc => {
      if (seen.has(rpc)) return;
      seen.add(rpc);
      const status = rpcStatus[rpc] || {};
      const ready = status.available !== false || (status.disabledUntil || 0) < now;
      (ready ? healthy : fallback).push(rpc);
    });
    return [...healthy, ...fallback];
  }

  async function autoRetryErroredResults(reason = 'background', taskId = autoRefreshTaskId) {
    let recoveredCount = 0;
    const rpcCandidates = buildAutoRetryRpcList();
    if (!rpcCandidates.length) return { recoveredCount, remainingCount: 0 };

    const concurrency = Math.min(6, Math.max(2, num('maxWorkers', 6)));
    for (let round = 0; round < AUTO_ERROR_RETRY_ROUNDS; round++) {
      if (taskId !== autoRefreshTaskId || isQueryRunning || isRetrying || isRetryingAll) break;
      const targets = queryResults
        .map((result, index) => ({ result, index }))
        .filter(({ result }) => isErroredResult(result));
      if (!targets.length) {
        return { recoveredCount, remainingCount: 0 };
      }

      const logTemplate = translations[currentLang].logAutoRetryRound || (currentLang === 'zh'
        ? '自动补查错误结果，第 {round}/{total} 轮，剩余 {count} 个'
        : 'Auto-retrying errored results round {round}/{total}, remaining {count}');
      addLog(logTemplate
        .replace('{round}', round + 1)
        .replace('{total}', AUTO_ERROR_RETRY_ROUNDS)
        .replace('{count}', targets.length), 'info');

      for (let i = 0; i < targets.length; i += concurrency) {
        if (taskId !== autoRefreshTaskId || isQueryRunning || isRetrying || isRetryingAll) break;
        const batch = targets.slice(i, i + concurrency);
        await Promise.all(batch.map(async ({ result, index }, batchOffset) => {
          try {
            const rpc = rpcCandidates[(round + index + batchOffset) % rpcCandidates.length];
            const fresh = await window.queryDomain(result.域名, index, rpc);
            if (fresh && !isErroredResult(fresh)) {
              recoveredCount++;
            }
            if (resultCompletenessScore(fresh) >= resultCompletenessScore(result) || !isErroredResult(fresh)) {
              queryResults[index] = { ...fresh, 重试中: false };
            }
          } catch (_) {}
        }));
        filteredResults = queryResults.filter(Boolean);
        applyFilters();
        updateStatistics();
        updateRetryAllButton();
        saveResultsToStorage();
        scheduleSessionSave();
      }
    }

    const remainingCount = queryResults.filter(result => isErroredResult(result)).length;
    const doneTemplate = translations[currentLang].logAutoRetryDone || (currentLang === 'zh'
      ? '自动补查完成: 修复 {success} 个，仍失败 {failed} 个'
      : 'Auto-retry finished: {success} recovered, {failed} still failed');
    if (recoveredCount || remainingCount) {
      addLog(doneTemplate
        .replace('{success}', recoveredCount)
        .replace('{failed}', remainingCount), remainingCount ? 'warning' : 'success');
    }
    return { recoveredCount, remainingCount };
  }

  async function refreshIncompleteResults(reason = 'background') {
    if (isQueryRunning || isRetrying || isRetryingAll) return;
    const taskId = ++autoRefreshTaskId;
    await autoRetryErroredResults(reason, taskId);
    if (taskId !== autoRefreshTaskId || isQueryRunning || isRetrying || isRetryingAll) return;

    const targets = queryResults
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => needsBackgroundRefresh(result));
    if (!targets.length) return;

    addLog((currentLang === 'zh'
      ? `自动补查 ${targets.length} 条${reason === 'restore' ? '已恢复的' : ''}未完整结果`
      : `Auto-refreshing ${targets.length} incomplete results`), 'info');

    const concurrency = Math.min(6, Math.max(2, num('maxWorkers', 6)));
    for (let i = 0; i < targets.length; i += concurrency) {
      if (taskId !== autoRefreshTaskId || isQueryRunning || isRetrying || isRetryingAll) return;
      const batch = targets.slice(i, i + concurrency);
      await Promise.all(batch.map(async ({ result, index }) => {
        try {
          const fresh = await window.queryDomain(result.域名, index);
          if (resultCompletenessScore(fresh) >= resultCompletenessScore(result)) {
            queryResults[index] = { ...fresh, 重试中: false };
          }
        } catch (_) {}
      }));
      filteredResults = queryResults.filter(Boolean);
      applyFilters();
      updateStatistics();
      updateRetryAllButton();
      saveResultsToStorage();
      scheduleSessionSave();
    }
  }

  window.retrySingleDomain = async function(domain, index, event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (isRetryingAll) return;
    isRetrying = true;
    const icon = event?.currentTarget || null;
    if (icon) {
      icon.style.pointerEvents = 'none';
      icon.style.opacity = '0.45';
    }
    try {
      addLog((currentLang === 'zh' ? '开始重试域名: ' : 'Retrying domain: ') + domain, 'info');
      const previous = queryResults[index] || { 序号: index + 1, 域名: domain, 状态: 'error', 注册状态: 'error' };
      queryResults[index] = { ...previous, 重试中: true, 错误信息: currentLang === 'zh' ? '重试中...' : 'Retrying...' };
      filteredResults = queryResults.filter(Boolean);
      applyFilters();
      updateStatistics();
      await new Promise(resolve => requestAnimationFrame(resolve));

      const result = await window.queryDomain(domain, index);
      queryResults[index] = { ...result, 重试中: false };
      filteredResults = queryResults.filter(Boolean);
      applyFilters();
      updateStatistics();
      saveResultsToStorage();
      scheduleSessionSave();
      updateRetryAllButton();
      addLog((result.注册状态 !== 'error' && result.状态 !== 'error') ? ((currentLang === 'zh' ? '重试成功: ' : 'Retry succeeded: ') + domain) : ((currentLang === 'zh' ? '重试失败: ' : 'Retry failed: ') + domain), result.注册状态 !== 'error' && result.状态 !== 'error' ? 'success' : 'warning');
    } catch (e) {
      const previous = queryResults[index] || { 序号: index + 1, 域名: domain, 状态: 'error', 注册状态: 'error' };
      queryResults[index] = { ...previous, 重试中: false };
      filteredResults = queryResults.filter(Boolean);
      applyFilters();
      updateStatistics();
      addLog((currentLang === 'zh' ? '重试出错: ' : 'Retry error: ') + domain, 'error');
    } finally {
      isRetrying = false;
      if (icon) {
        icon.style.pointerEvents = 'auto';
        icon.style.opacity = '1';
      }
    }
  };

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
    document.getElementById('startQueryBtn').disabled = isQueryRunning;
    document.getElementById('resumeQueryBtn').disabled = true;
    document.getElementById('stopQueryBtn').disabled = !isQueryRunning;
    document.getElementById('exportBtn').disabled = true;
    document.getElementById('retryAllBtn').disabled = true;
    resetRpcRunQueryCount();
    let successCount = 0;
    let failCount = 0;
    let doneCount = 0;
    const progressText = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    const progressBar = document.getElementById('progressMiniBar');
    const snapshot = {
      text: progressText ? progressText.innerHTML : '',
      percent: progressPercent ? progressPercent.innerText : '',
      width: progressBar ? progressBar.style.width : ''
    };
    const updateRetryProgress = () => {
      const percent = Math.round((doneCount / failedDomains.length) * 100);
      if (progressText) progressText.innerHTML = (currentLang === 'zh' ? `重试失败域名: ${doneCount}/${failedDomains.length} (成功:${successCount} 失败:${failCount})` : `Retry failed: ${doneCount}/${failedDomains.length} (ok:${successCount} fail:${failCount})`);
      if (progressPercent) progressPercent.innerText = percent + '%';
      if (progressBar) progressBar.style.width = percent + '%';
    };
    updateRetryProgress();
    addLog((translations[currentLang].logRetryAllStart || '开始批量重试 {count} 个失败的域名').replace('{count}', failedDomains.length), 'info');
    try {
      const concurrency = Math.max(20, Math.min(120, num('maxWorkers', 50)));
      for (let i = 0; i < failedDomains.length; i += concurrency) {
        const batch = failedDomains.slice(i, i + concurrency);
        batch.forEach(item => {
          const previous = queryResults[item.index] || { 序号: item.index + 1, 域名: item.domain, 状态: 'error', 注册状态: 'error' };
          queryResults[item.index] = { ...previous, 重试中: true, 错误信息: currentLang === 'zh' ? '重试中...' : 'Retrying...' };
          addLog((currentLang === 'zh' ? '已发起重试: ' : 'Retry queued: ') + item.domain, 'info');
        });
        filteredResults = queryResults.filter(Boolean);
        applyFilters();
        updateStatistics();
        updateRetryProgress();
        await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));

        await Promise.all(batch.map(async item => {
          try {
            const result = await window.queryDomain(item.domain, item.index);
            queryResults[item.index] = { ...result, 重试中: false };
            if (result && result.注册状态 !== 'error' && result.状态 !== 'error') {
              successCount++;
              addLog((currentLang === 'zh' ? '重试成功: ' : 'Retry succeeded: ') + item.domain, 'success');
            } else {
              failCount++;
              addLog((currentLang === 'zh' ? '重试失败: ' : 'Retry failed: ') + item.domain, 'warning');
            }
          } catch (e) {
            failCount++;
            const previous = queryResults[item.index] || { 序号: item.index + 1, 域名: item.domain, 状态: 'error', 注册状态: 'error' };
            queryResults[item.index] = { ...previous, 重试中: false };
            addLog((currentLang === 'zh' ? '重试出错: ' : 'Retry error: ') + item.domain, 'error');
          } finally {
            doneCount++;
            filteredResults = queryResults.filter(Boolean);
            applyFilters();
            updateStatistics();
            updateRetryAllButton();
            updateRetryProgress();
          }
        }));
      }
      saveResultsToStorage();
      scheduleSessionSave();
      addLog((translations[currentLang].logRetryAllComplete || '批量重试完成: 成功 {success} 个, 失败 {failed} 个').replace('{success}', successCount).replace('{failed}', failCount), successCount ? 'success' : 'warning');
    } catch (e) {
      addLog(currentLang === 'zh' ? '批量刷新过程中出现异常' : 'Batch refresh interrupted', 'error');
      console.error(e);
    } finally {
      isRetryingAll = false;
      document.getElementById('startQueryBtn').disabled = isQueryRunning;
      document.getElementById('resumeQueryBtn').disabled = isQueryRunning || currentIndex >= pendingDomains.length;
      document.getElementById('stopQueryBtn').disabled = !isQueryRunning;
      document.getElementById('exportBtn').disabled = false;
      updateRetryAllButton();
      if (progressText) progressText.innerHTML = snapshot.text;
      if (progressPercent) progressPercent.innerText = snapshot.percent;
      if (progressBar) progressBar.style.width = snapshot.width;
    }
  };

  function positionActionMenu(details) {
    if (!details) return;
    const summary = details.querySelector('summary');
    const menu = details.querySelector('.action-menu-list');
    if (!summary || !menu) return;

    const spacing = 8;
    const summaryRect = summary.getBoundingClientRect();
    const menuWidth = menu.offsetWidth || 110;
    const menuHeight = menu.offsetHeight || 84;

    let left = summaryRect.right - menuWidth;
    left = Math.max(spacing, Math.min(left, window.innerWidth - menuWidth - spacing));

    const openUp = summaryRect.bottom + spacing + menuHeight > window.innerHeight - spacing
      && summaryRect.top - spacing - menuHeight >= spacing;
    const top = openUp
      ? Math.max(spacing, summaryRect.top - menuHeight - spacing)
      : Math.min(window.innerHeight - menuHeight - spacing, summaryRect.bottom + spacing);

    details.classList.toggle('open-up', openUp);
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }

  function repositionOpenActionMenus() {
    document.querySelectorAll('.action-menu[open]').forEach(positionActionMenu);
  }

  document.getElementById('resultsBody')?.addEventListener('click', function(e){
    const menuSummary = e.target.closest('.action-menu > summary');
    if (menuSummary) {
      e.preventDefault();
      const details = menuSummary.parentElement;
      if (!details) return;
      const willOpen = !details.hasAttribute('open');
      document.querySelectorAll('.action-menu[open]').forEach(item => {
        if (item !== details) {
          item.removeAttribute('open');
          item.classList.remove('open-up');
        }
      });
      if (willOpen) {
        details.setAttribute('open', 'open');
        positionActionMenu(details);
      } else {
        details.removeAttribute('open');
        details.classList.remove('open-up');
      }
      return;
    }

    const retryIcon = e.target.closest('.retry-icon');
    if (!retryIcon) return;
    const row = retryIcon.closest('tr');
    if (!row) return;
    const idx = parseInt(row.children[0]?.textContent || '0', 10) - 1;
    const domain = row.children[1]?.textContent?.trim();
    if (domain) window.retrySingleDomain(domain, idx, e);
  });

  document.addEventListener('mouseover', function(e) {
    const trigger = e.target.closest('.owner-tooltip-trigger');
    if (!trigger) return;
    if (ownerTooltipTarget === trigger) return;
    showOwnerTooltip(trigger);
  });

  document.addEventListener('mouseout', function(e) {
    if (!ownerTooltipTarget) return;
    const leaving = e.target.closest('.owner-tooltip-trigger');
    if (!leaving || leaving !== ownerTooltipTarget) return;
    const related = e.relatedTarget;
    if (related && ownerTooltipTarget.contains(related)) return;
    hideOwnerTooltip();
  });

  document.addEventListener('scroll', function() {
    if (ownerTooltipTarget) positionOwnerTooltip(ownerTooltipTarget);
  }, true);

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.owner-tooltip-trigger')) hideOwnerTooltip();
  });

  window.addEventListener('resize', function() {
    if (ownerTooltipTarget) positionOwnerTooltip(ownerTooltipTarget);
  });

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.action-menu')) {
      document.querySelectorAll('.action-menu[open]').forEach(item => {
        item.removeAttribute('open');
        item.classList.remove('open-up');
      });
    }
  });

  window.addEventListener('resize', repositionOpenActionMenus);
  window.addEventListener('scroll', repositionOpenActionMenus, true);
  document.querySelector('.table-wrapper')?.addEventListener('scroll', repositionOpenActionMenus);

  const originalSwitchLanguage = window.switchLanguage;
  window.switchLanguage = function(lang) {
    originalSwitchLanguage(lang);
    const dynamicOption = document.querySelector('#rpcSelect option[value="dynamic"]');
    if (dynamicOption) dynamicOption.textContent = lang === 'zh' ? '🌐 智能动态RPC' : '🌐 Smart Dynamic RPC';
  };

  const originalCompleteQuery = window.completeQuery;
  window.completeQuery = function() {
    originalCompleteQuery();
    scheduleSessionSave(true);
    setTimeout(() => refreshIncompleteResults('complete'), 120);
  };

  const originalStopQuery = window.stopQuery;
  window.stopQuery = function() {
    originalStopQuery();
    saveResultsToStorage();
    scheduleSessionSave(true);
  };

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => refreshRpcPoolFromWeb(true), 600);
    setInterval(() => refreshRpcPoolFromWeb(true), 60 * 60 * 1000);
    setTimeout(() => refreshIncompleteResults('restore'), 900);
  });
})();
