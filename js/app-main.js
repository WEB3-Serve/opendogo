        // ========== 语言包 ==========
        const translations = {
            zh: {
                logo: 'opendogo',
                title: 'ENS域名批量查询',
                browserTitle: 'ENS域名批量查询 · opendogo',
                rpcMonitor: 'RPC监控',
                details: '详情',
                availableNodes: '可用节点',
                totalQueries: '总查询',
                successRate: '成功率',
                avgResponse: '平均响应',
                statistics: '统计',
                registered: '已注册',
                unregistered: '未注册',
                premium: '溢价',
                expired: '过期',
                grace: '宽限期',
                errors: '错误',
                logs: '日志',
                contactUs: '联系我们',
                domainList: '域名列表',
                domains: '个域名',
                load: '加载',
                clear: '清空',
                validate: '验证',
                start: '开始',
                resume: '继续',
                pause: '暂停',
                cancel: '取消',
                results: '查询结果',
                perSecond: '个/秒',
                retryFailed: '重试失败',
                no: '序号',
                domain: '域名',
                status: '状态',
                error: '错误',
                expiry: '过期',
                expiryDays: '过期天数',
                expiryTime: '过期时间',
                graceEnd: '宽限期结束',
                regTime: '注册时间',
                owner: '所有者',
                admin: '管理员',
                switchToOwner: '切换到所有者',
                switchToAdmin: '切换到管理员',
                action: '操作',
                noData: '暂无数据',
                go: '跳转',
                userCenter: '用户中心',
                username: '账号',
                password: '密码',
                usernamePlaceholder: '请输入账号',
                passwordPlaceholder: '请输入密码',
                cardKey: '卡密激活',
                cardKeyPlaceholder: '请输入卡密',
                activate: '激活',
                rememberCardKey: '记住卡密',
                hideCardKey: '隐藏卡密',
                cardKeyStatus: '卡密状态：',
                cardKeyInactive: '未激活',
                cardKeyActive: '已激活',
                cardKeyTip: '',
                register: '注册',
                login: '登录',
                logout: '退出',
                loginStatus: '登录状态：',
                notLoggedIn: '未登录',
                currentUser: '当前用户：',
                queryControl: '查询控制',
                maxWorkers: '协程数',
                requestDelay: '延迟(ms)',
                maxRetries: '重试次数',
                timeout: '超时(s)',
                batchSize: '批量大小',
                nodeType: '节点类型',
                smartNode: '智能节点',
                filter: '筛选功能',
                all: '所有',
                inPremium: '溢价期内',
                noPremium: '非溢价',
                expiring: '90天到期',
                valid: '未过期',
                inGrace: '宽限期内',
                noGrace: '非宽限',
                time: '时间',
                default: '默认',
                addressCountDetail: '{address} 共有 {count} 个域名',
                addressCountSummary: '该地址共有 {count} 个域名',
                ownerAddressCountDetail: '注册人地址 {address} 共有 {count} 个域名',
                adminAddressCountDetail: '管理地址 {address} 共有 {count} 个域名',
                ownerModeHint: '所有者：显示注册人与拥有地址',
                adminModeHint: '管理员：显示管理地址',
                earliest: '最早到期',
                latest: '最晚到期',
                search: '搜索',
                searchPlaceholder: '域名/地址',
                exclude: '不含',
                excludePlaceholder: '词1,词2（逗号分隔）',
                length: '字符长度',
                lengthPlaceholder: '如 1-3 或 5',
                clearFilters: '清除筛选',
                clearResults: '清空结果',
                footerKeywords: 'ENS域名批量查询工具 | web3域名批量查询 | eth批量域名查询 | ENS批量工具 | 动态RPC自动切换 | web3工具箱 | 以太坊域名工具 | 动态RPC节点 | 区块链域名查询',
                footerCopyright: '© 2026-现在 opendogo 版权所有',
                rpcDetails: '节点详细状态',
                node: '节点',
                responseTime: '响应时间',
                queryCount: '查询次数',
                errorCount: '错误次数',
                rpcUsedCount: '本轮查询',
                addressDesc: '地址多→少',
                addressAsc: '地址少→多',
                progressReady: '准备就绪',
                speed: '速度',
                speedUnit: '/s',
                currentRPC: '当前RPC',
                logReady: 'opendogo工具箱已就绪',
                domainTypeHintNumeric: '3A-9A（数字）：只生成 3-9 位纯数字且每一位都相同的域名，例如 000.eth、1111.eth、999999999.eth，按顺序生成。',
                logLoadStart: '开始生成域名列表...',
                logLoadComplete: '已完成加载 {count} 个域名',
                logQueryStart: '开始查询 {count} 个域名',
                logQueryPaused: '查询已暂停，已处理 {processed}/{total}',
                logQueryCanceled: '查询已取消，已处理 {processed}/{total}',
                logQueryResumed: '继续查询，剩余 {remaining} 个域名',
                logQueryComplete: '查询完成！共 {count} 个域名',
                logExport: '导出 {count} 条 CSV',
                logClear: '结果已清除',
                logLangSwitch: '语言已切换到 {lang}',
                logRpcCheck: '开始检测所有RPC节点...',
                logRpcComplete: 'RPC节点检测完成: {success}/{total} 可用',
                confirmClear: '确定要清空所有查询结果吗？',
                retrySingle: '点击重试此域名',
                logDataLoaded: '已加载上次查询数据 ({time})',
                logRetryAllStart: '开始批量重试 {count} 个失败的域名',
                logRetryAllComplete: '批量重试完成: 成功 {success} 个, 失败 {failed} 个',
                logAutoRetryRound: '自动补查错误结果，第 {round}/{total} 轮，剩余 {count} 个',
                logAutoRetryDone: '自动补查完成: 修复 {success} 个，仍失败 {failed} 个',
                logFilterByAddress: '筛选地址: {address} 的所有域名',
                addressCount: '共{count}个域名',
                clearAddressSearch: '清除地址搜索',
                logValidate: '域名格式验证完成'
            },
            en: {
                logo: 'opendogo',
                title: 'ENS Domain Batch Query',
                browserTitle: 'ENS Domain Batch Query · opendogo',
                rpcMonitor: 'RPC Monitor',
                details: 'Details',
                availableNodes: 'Available',
                totalQueries: 'Queries',
                successRate: 'Success',
                avgResponse: 'Avg Resp',
                statistics: 'Statistics',
                registered: 'Registered',
                unregistered: 'Unregistered',
                premium: 'Premium',
                expired: 'Expired',
                grace: 'Grace',
                errors: 'Errors',
                logs: 'Logs',
                contactUs: 'Contact Us',
                domainList: 'Domain List',
                domains: 'domains',
                load: 'Load',
                clear: 'Clear',
                validate: 'Validate',
                start: 'Start',
                resume: 'Resume',
                pause: 'Pause',
                cancel: 'Cancel',
                results: 'Results',
                perSecond: '/s',
                retryFailed: 'Retry Failed',
                no: '#',
                domain: 'Domain',
                status: 'Status',
                error: 'Error',
                expiry: 'Expiry',
                expiryDays: 'Exp Days',
                expiryTime: 'Expiry',
                graceEnd: 'Grace End',
                regTime: 'Reg Time',
                owner: 'Owner',
                admin: 'Admin',
                switchToOwner: 'Switch to Owner',
                switchToAdmin: 'Switch to Admin',
                action: 'Action',
                noData: 'No data',
                go: 'Go',
                userCenter: 'User Center',
                username: 'Username',
                password: 'Password',
                usernamePlaceholder: 'Enter username',
                passwordPlaceholder: 'Enter password',
                cardKey: 'Access Code',
                cardKeyPlaceholder: 'Enter access code',
                activate: 'Activate',
                rememberCardKey: 'Remember code',
                hideCardKey: 'Hide code',
                cardKeyStatus: 'Code status:',
                cardKeyInactive: 'Inactive',
                cardKeyActive: 'Activated',
                cardKeyTip: '',
                register: 'Register',
                login: 'Login',
                logout: 'Logout',
                loginStatus: 'Status:',
                notLoggedIn: 'Not logged in',
                currentUser: 'User:',
                queryControl: 'Query Control',
                maxWorkers: 'Workers',
                requestDelay: 'Delay(ms)',
                maxRetries: 'Retries',
                timeout: 'Timeout(s)',
                batchSize: 'Batch',
                nodeType: 'Node',
                smartNode: 'Smart Node',
                filter: 'Filters',
                all: 'All',
                inPremium: 'In Premium',
                noPremium: 'No Premium',
                expiring: '90d Expiring',
                valid: 'Valid',
                inGrace: 'In Grace',
                noGrace: 'No Grace',
                time: 'Sort',
                default: 'Default',
                addressCountDetail: '{address} owns {count} domains',
                addressCountSummary: 'This address owns {count} domains',
                ownerAddressCountDetail: 'Registrant {address} owns {count} domains',
                adminAddressCountDetail: 'Manager {address} manages {count} domains',
                ownerModeHint: 'Owner mode: show registrant/owned address',
                adminModeHint: 'Admin mode: show manager address',
                earliest: 'Earliest',
                latest: 'Latest',
                search: 'Search',
                searchPlaceholder: 'domain/address',
                exclude: 'Exclude',
                excludePlaceholder: 'word1,word2 (comma-separated)',
                length: 'Character Length',
                lengthPlaceholder: 'e.g. 1-3 or 5',
                clearFilters: 'Clear Filters',
                clearResults: 'Clear Results',
                footerKeywords: 'ENS batch domain query tool | web3 domain bulk lookup | ETH domain batch checker | ENS automation toolkit | dynamic RPC auto-switching | web3 utility suite | Ethereum naming tools | dynamic RPC nodes | blockchain domain search',
                footerCopyright: '© 2026–present opendogo. All rights reserved.',
                rpcDetails: 'RPC Node Details',
                node: 'Node',
                responseTime: 'Response',
                queryCount: 'Queries',
                errorCount: 'Errors',
                rpcUsedCount: 'Used in Run',
                addressDesc: 'Address ↓',
                addressAsc: 'Address ↑',
                progressReady: 'Ready',
                speed: 'Speed',
                speedUnit: '/s',
                currentRPC: 'Current RPC',
                logReady: 'opendogo ready',
                domainTypeHintNumeric: '3A-9A (numeric): generates only 3-9 digit domains where every digit is the same, such as 000.eth, 1111.eth, and 999999999.eth, in sequential order.',
                logLoadStart: 'Generating domain list...',
                logLoadComplete: 'Loaded {count} domains',
                logQueryStart: 'Starting query for {count} domains',
                logQueryPaused: 'Paused at {processed}/{total}',
                logQueryCanceled: 'Canceled at {processed}/{total}',
                logQueryResumed: 'Resumed, {remaining} remaining',
                logQueryComplete: 'Completed! {count} domains',
                logExport: 'Exported {count} CSV',
                logClear: 'Results cleared',
                logLangSwitch: 'Switched to {lang}',
                logRpcCheck: 'Checking all RPC nodes...',
                logRpcComplete: 'RPC check completed: {success}/{total} available',
                confirmClear: 'Are you sure you want to clear all results?',
                retrySingle: 'Click to retry this domain',
                logDataLoaded: 'Loaded previous query data ({time})',
                logRetryAllStart: 'Retrying {count} failed domains',
                logRetryAllComplete: 'Retry completed: {success} succeeded, {failed} failed',
                logAutoRetryRound: 'Auto-retrying errored results round {round}/{total}, remaining {count}',
                logAutoRetryDone: 'Auto-retry finished: {success} recovered, {failed} still failed',
                logFilterByAddress: 'Filter by address: {address}',
                addressCount: '{count} domains',
                clearAddressSearch: 'Clear address search',
                logValidate: 'Domain format validation completed'
            }
        };

        let currentLang = getBrowserLanguage();
        let web3, registry, registrar, controller;
        let isQueryRunning = false, isPaused = false, isRetrying = false, isRetryingAll = false;
        let queryResults = [], filteredResults = [], pendingDomains = [], currentIndex = 0, activeWorkers = 0;
        let totalDomains = 0, processedDomains = 0, startTime = null;
        let currentPage = 1, pageSize = 50, totalPages = 1;
        let rpcStatus = {}, isLoadingDomains = false;
        let addressFilterScrollState = null;
        let ownerDisplayMode = 'owner';

        const STORAGE_KEY = 'ens_query_results';
        const STORAGE_TIME_KEY = 'ens_query_time';
        const SESSION_STORAGE_KEY = 'ens_query_session';
        const CARD_KEY_STORAGE_KEY = 'ens-card-key';
        const CARD_KEY_REMEMBER_KEY = 'ens-card-key-remember';
        const CARD_KEY_HIDE_KEY = 'ens-card-key-hide';

        const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
        const BASE_REGISTRAR = "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85";
        const CONTROLLER = "0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5";
        const NAME_WRAPPER = "0xd4416b13d2b3a9abae7a6e6fa8a2f4f61f5b77a3";
        const KNOWN_ENS_CONTRACT_ADDRESSES = new Set([
            ENS_REGISTRY.toLowerCase(),
            BASE_REGISTRAR.toLowerCase(),
            CONTROLLER.toLowerCase(),
            "0x0000000000000000000000000000000000000000",
            NAME_WRAPPER.toLowerCase()
        ]);

        const ENS_ABI = [{"constant":true,"inputs":[{"name":"node","type":"bytes32"}],"name":"owner","outputs":[{"name":"","type":"address"}],"type":"function"}];
        const REGISTRAR_ABI = [
            {"constant":true,"inputs":[{"name":"tokenId","type":"uint256"}],"name":"nameExpires","outputs":[{"name":"","type":"uint256"}],"type":"function"},
            {"constant":true,"inputs":[{"name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"name":"","type":"address"}],"type":"function"},
            {"anonymous":false,"inputs":[{"indexed":true,"name":"id","type":"uint256"},{"indexed":true,"name":"owner","type":"address"},{"indexed":false,"name":"expires","type":"uint256"}],"name":"NameRegistered","type":"event"}
        ];
        const CONTROLLER_ABI = [
            {"constant":true,"inputs":[{"name":"name","type":"string"}],"name":"available","outputs":[{"name":"","type":"bool"}],"type":"function"},
            {"constant":true,"inputs":[{"name":"name","type":"string"},{"name":"duration","type":"uint256"}],"name":"rentPrice","outputs":[{"components":[{"name":"base","type":"uint256"},{"name":"premium","type":"uint256"}],"name":"price","type":"tuple"}],"type":"function"}
        ];

        const TRANSFER_ABI = [{
            "anonymous": false,
            "inputs": [
                {"indexed": true, "name": "from", "type": "address"},
                {"indexed": true, "name": "to", "type": "address"},
                {"indexed": true, "name": "tokenId", "type": "uint256"}
            ],
            "name": "Transfer",
            "type": "event"
        }];
        const NAME_WRAPPER_ABI = [
            {"constant":true,"inputs":[{"name":"id","type":"uint256"}],"name":"ownerOf","outputs":[{"name":"","type":"address"}],"type":"function"}
        ];

        const RPC_LIST = [
            "https://ethereum.publicnode.com",
            "https://cloudflare-eth.com",
            "https://eth.drpc.org",
            "https://rpc.payload.de",
            "https://eth-pokt.nodies.app",
            "https://rpc.flashbots.net",
            "https://ethereum.blockpi.network/v1/rpc/public",
            "https://eth-mainnet.public.blastapi.io",
            "https://eth.api.onfinality.io/public",
            "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
        ];

        const lastOwnerCache = new Map();
        const registrationMetaCache = new Map();

        function getSavedLanguage() {
            const saved = localStorage.getItem('ens-tool-language');
            return saved === 'zh' || saved === 'en' ? saved : null;
        }

        function getBrowserLanguage() {
            const saved = getSavedLanguage();
            if (saved) return saved;
            const lang = navigator.language || navigator.userLanguage || 'en';
            return lang.startsWith('zh') ? 'zh' : 'en';
        }

        function getTimeZone() {
            try {
                return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
            } catch {
                return 'UTC';
            }
        }

        function formatDate(d) {
            if (!d) return '';
            const date = new Date(d);
            if (currentLang === 'en') {
                return date.toLocaleString('en-US', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                }).replace(',', '');
            } else {
                return date.getFullYear() + '-' +
                    String(date.getMonth() + 1).padStart(2, '0') + '-' +
                    String(date.getDate()).padStart(2, '0') + ' ' +
                    String(date.getHours()).padStart(2, '0') + ':' +
                    String(date.getMinutes()).padStart(2, '0') + ':' +
                    String(date.getSeconds()).padStart(2, '0');
            }
        }


        function parseKnownDate(value) {
            if (!value) return null;
            if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
            if (typeof value === 'number') {
                const d = new Date(value);
                return Number.isNaN(d.getTime()) ? null : d;
            }
            const text = String(value).trim();
            if (!text || text === '-') return null;

            const zhMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
            if (zhMatch) {
                const [, y, m, d, hh, mm, ss] = zhMatch;
                const dt = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
                return Number.isNaN(dt.getTime()) ? null : dt;
            }

            const enDate = new Date(text);
            return Number.isNaN(enDate.getTime()) ? null : enDate;
        }

        function formatDisplayDate(value) {
            const parsed = parseKnownDate(value);
            return parsed ? formatDate(parsed) : (value || '');
        }


        function getOpenSeaCollectionUrl() {
            return currentLang === 'zh'
                ? 'https://opensea.io/zh-CN/collection/ens'
                : 'https://opensea.io/collection/ens';
        }

        function getAddressByMode(record, mode = ownerDisplayMode) {
            if (!record) return '';
            if (mode === 'admin') {
                return record.管理员地址 || '';
            }
            return record.所有者地址 || '';
        }

        function updateOwnerModeUI() {
            const ownerHeaderLabel = document.getElementById('ownerHeaderLabel');
            const ownerModeToggle = document.getElementById('ownerModeToggle');
            if (!ownerHeaderLabel || !ownerModeToggle) return;
            const isOwner = ownerDisplayMode === 'owner';
            ownerHeaderLabel.textContent = isOwner ? translations[currentLang].owner : translations[currentLang].admin;
            ownerModeToggle.dataset.mode = isOwner ? 'owner' : 'admin';
            const modeHint = isOwner
                ? translations[currentLang].ownerModeHint
                : translations[currentLang].adminModeHint;
            const switchHint = isOwner ? translations[currentLang].switchToAdmin : translations[currentLang].switchToOwner;
            ownerModeToggle.title = `${modeHint} · ${switchHint}`;
            ownerModeToggle.setAttribute('aria-label', ownerModeToggle.title);
        }

        function toggleOwnerMode() {
            ownerDisplayMode = ownerDisplayMode === 'owner' ? 'admin' : 'owner';
            updateOwnerModeUI();
            applyFilters({ resetPage: false, preserveScroll: true });
        }

        function switchLanguage(lang) {
            currentLang = lang;
            document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
            localStorage.setItem('ens-tool-language', lang);
            document.title = translations[lang]?.browserTitle || `${translations[lang]?.title || 'opendogo'} · opendogo`;
            document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.lang === lang);
            });
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.dataset.i18n;
                if (translations[lang] && translations[lang][key]) {
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
                        if (el.tagName === 'SELECT') {
                            Array.from(el.options).forEach(option => {
                                if (option.hasAttribute('data-i18n')) {
                                    const optKey = option.getAttribute('data-i18n');
                                    if (translations[lang] && translations[lang][optKey]) {
                                        option.textContent = translations[lang][optKey];
                                    }
                                }
                            });
                        } else {
                            el.placeholder = translations[lang][key];
                        }
                    } else {
                        el.textContent = translations[lang][key];
                    }
                }
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.dataset.i18nPlaceholder;
                if (translations[lang] && translations[lang][key]) {
                    el.placeholder = translations[lang][key];
                }
            });

            updateOwnerModeUI();
            updateDomainTypeHint();
            updateDomainsCount();
            updateTable({ preserveScroll: false });
            updateStatistics();
            updateUserStatus();

            const speedValue = document.getElementById('querySpeedDisplay');
            const visibleSpeed = speedValue ? speedValue.textContent.trim() || '0' : '0';
            const visibleProgress = document.getElementById('queryProgress');
            const progressTextEl = document.getElementById('progressText');
            if (progressTextEl) {
                progressTextEl.textContent = visibleProgress ? visibleProgress.textContent.trim() : translations[lang].progressReady;
            }
            const querySpeedEl = document.getElementById('querySpeed');
            if (querySpeedEl) {
                querySpeedEl.textContent = `${translations[lang].speed}: ${visibleSpeed} ${translations[lang].speedUnit}`;
            }
            const currentRpc = getCurrentRpc();
            const rpcStatusTextEl = document.getElementById('rpcStatusText');
            if (rpcStatusTextEl) {
                rpcStatusTextEl.innerHTML = `${translations[lang].currentRPC}: <span style="color:var(--primary);">${shortenRpc(currentRpc)}</span>`;
            }
            const langName = lang === 'zh' ? '中文' : 'English';
            const timeZone = getTimeZone();
            addLog(translations[lang].logLangSwitch.replace('{lang}', langName) + `, Timezone: ${timeZone}`, 'info');
            applyFilters();
        }

        function addLog(msg, type = 'info') {
            const logContainer = document.getElementById('logContainer');
            if (!logContainer) return;
            const entry = document.createElement('div');
            entry.className = `log-entry ${type}`;
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
            logContainer.prepend(entry);
            while (logContainer.children.length > 50) {
                logContainer.removeChild(logContainer.lastChild);
            }
        }

        let sessionSaveTimer = null;
        let isRestoringSession = false;

        function getCurrentFiltersSnapshot() {
            return {
                status: document.getElementById('filterStatus')?.value || 'all',
                premium: document.getElementById('filterPremium')?.value || 'all',
                expiry: document.getElementById('filterExpiry')?.value || 'all',
                grace: document.getElementById('filterGrace')?.value || 'all',
                sort: document.getElementById('filterSort')?.value || 'default',
                search: document.getElementById('filterSearch')?.value || '',
                exclude: document.getElementById('filterExclude')?.value || '',
                length: document.getElementById('filterLength')?.value || '',
                pageSize: document.getElementById('pageSize')?.value || String(pageSize || 50)
            };
        }

        function applyFiltersSnapshot(filters = {}) {
            const pairs = {
                filterStatus: filters.status || 'all',
                filterPremium: filters.premium || 'all',
                filterExpiry: filters.expiry || 'all',
                filterGrace: filters.grace || 'all',
                filterSort: filters.sort || 'default',
                filterSearch: filters.search || '',
                filterExclude: filters.exclude || '',
                filterLength: filters.length || '',
                pageSize: filters.pageSize || String(pageSize || 50)
            };
            Object.entries(pairs).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.value = value;
            });
        }

        function buildSessionPayload() {
            return {
                version: 1,
                timestamp: Date.now(),
                queryResults,
                pendingDomains,
                currentIndex,
                processedDomains,
                totalDomains,
                startTime,
                isPaused,
                isQueryRunning,
                currentPage,
                domainsText: document.getElementById('domainsText')?.value || '',
                filters: getCurrentFiltersSnapshot(),
                progress: {
                    queryProgress: document.getElementById('queryProgress')?.textContent || '',
                    progressPercent: document.getElementById('progressPercent')?.textContent || '',
                    progressText: document.getElementById('progressText')?.textContent || '',
                    querySpeedDisplay: document.getElementById('querySpeedDisplay')?.textContent || ''
                },
                scroll: {
                    pageY: window.scrollY || 0,
                    tableTop: document.querySelector('.table-wrapper')?.scrollTop || 0
                }
            };
        }

        function saveResultsToStorage() {
            if (queryResults && queryResults.length > 0) {
                const data = {
                    results: queryResults,
                    timestamp: Date.now()
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                localStorage.setItem(STORAGE_TIME_KEY, new Date().toLocaleString());
            }
        }

        function scheduleSessionSave(immediate = false) {
            if (isRestoringSession) return;
            const persist = () => {
                sessionSaveTimer = null;
                const hasState = (queryResults && queryResults.length > 0) || pendingDomains.length || (document.getElementById('domainsText')?.value || '').trim();
                if (!hasState) {
                    localStorage.removeItem(SESSION_STORAGE_KEY);
                    return;
                }
                localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(buildSessionPayload()));
            };

            if (immediate) {
                if (sessionSaveTimer) {
                    clearTimeout(sessionSaveTimer);
                    sessionSaveTimer = null;
                }
                persist();
                return;
            }

            if (sessionSaveTimer) clearTimeout(sessionSaveTimer);
            sessionSaveTimer = setTimeout(persist, 180);
        }

        function loadResultsFromStorage() {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    queryResults = data.results || [];
                    filteredResults = queryResults.filter(r => r);

                    updateTable();
                    updateStatistics();

                    document.getElementById('exportBtn').disabled = false;
                    scheduleSessionSave(true);

                    const savedTime = localStorage.getItem(STORAGE_TIME_KEY);
                    if (savedTime) {
                        addLog(translations[currentLang].logDataLoaded.replace('{time}', savedTime), 'info');
                    }

                    return true;
                } catch (e) {
                    console.error('加载保存的数据失败:', e);
                    return false;
                }
            }
            return false;
        }

        function restoreSessionFromStorage() {
            const saved = localStorage.getItem(SESSION_STORAGE_KEY);
            if (!saved) return false;

            try {
                const data = JSON.parse(saved);
                if (!data || typeof data !== 'object') return false;

                isRestoringSession = true;
                queryResults = Array.isArray(data.queryResults) ? data.queryResults : (Array.isArray(data.results) ? data.results : []);
                filteredResults = queryResults.filter(Boolean);
                pendingDomains = Array.isArray(data.pendingDomains) ? data.pendingDomains : [];
                currentIndex = Number.isFinite(data.currentIndex) ? data.currentIndex : queryResults.filter(Boolean).length;
                processedDomains = Number.isFinite(data.processedDomains) ? data.processedDomains : queryResults.filter(Boolean).length;
                totalDomains = Number.isFinite(data.totalDomains) ? data.totalDomains : Math.max(processedDomains, pendingDomains.length, queryResults.length);
                startTime = data.startTime || null;
                isQueryRunning = false;
                isPaused = !!(data.isPaused || data.isQueryRunning);
                currentPage = Number.isFinite(data.currentPage) && data.currentPage > 0 ? data.currentPage : 1;

                const domainsText = typeof data.domainsText === 'string' ? data.domainsText : pendingDomains.join('\n');
                const domainsEl = document.getElementById('domainsText');
                if (domainsEl) domainsEl.value = domainsText;
                updateDomainsCount();
                applyFiltersSnapshot(data.filters || {});
                if (document.getElementById('queryProgress') && data.progress?.queryProgress) {
                    document.getElementById('queryProgress').textContent = data.progress.queryProgress;
                }
                if (document.getElementById('progressPercent') && data.progress?.progressPercent) {
                    document.getElementById('progressPercent').textContent = data.progress.progressPercent;
                }
                if (document.getElementById('progressText') && data.progress?.progressText) {
                    document.getElementById('progressText').textContent = data.progress.progressText;
                }
                if (document.getElementById('querySpeedDisplay') && data.progress?.querySpeedDisplay) {
                    document.getElementById('querySpeedDisplay').textContent = data.progress.querySpeedDisplay;
                }

                applyFilters();
                currentPage = Number.isFinite(data.currentPage) && data.currentPage > 0 ? data.currentPage : 1;
                updateTable();
                updateStatistics();
                document.getElementById('exportBtn').disabled = !queryResults.filter(Boolean).length;
                document.getElementById('startQueryBtn').disabled = false;
                document.getElementById('resumeQueryBtn').disabled = !(isPaused && currentIndex < pendingDomains.length);
                document.getElementById('stopQueryBtn').disabled = true;
                document.getElementById('cancelQueryBtn').disabled = !(isQueryRunning || (isPaused && currentIndex < pendingDomains.length));
                updateRetryAllButton();

                requestAnimationFrame(() => {
                    const tableWrapper = document.querySelector('.table-wrapper');
                    if (tableWrapper && data.scroll && Number.isFinite(data.scroll.tableTop)) {
                        tableWrapper.scrollTop = data.scroll.tableTop;
                    }
                    if (data.scroll && Number.isFinite(data.scroll.pageY)) {
                        window.scrollTo({ top: data.scroll.pageY, behavior: 'auto' });
                    }
                });

                if (queryResults.filter(Boolean).length || pendingDomains.length) {
                    addLog(currentLang === 'zh' ? '已恢复上次页面状态' : 'Previous page state restored', 'info');
                }
                return !!(queryResults.filter(Boolean).length || pendingDomains.length);
            } catch (e) {
                console.error('恢复会话状态失败:', e);
                return false;
            } finally {
                isRestoringSession = false;
            }
        }

        function initRpcStatus() {
            RPC_LIST.forEach(rpc => {
                rpcStatus[rpc] = {
                    available: true,
                    successCount: 0,
                    failCount: 0,
                    responseTime: 0,
                    disabledUntil: 0,
                    lastUsed: 0,
                    runQueryCount: 0
                };
            });
            updateRpcList();
            syncDomainModuleHeight();
        }

        async function checkAllRpcNodes() {
            addLog(translations[currentLang].logRpcCheck, 'info');
            const promises = RPC_LIST.map(async (rpc) => {
                try {
                    const start = Date.now();
                    const testWeb3 = new Web3(rpc);
                    await testWeb3.eth.getBlockNumber();
                    const responseTime = Date.now() - start;
                    rpcStatus[rpc] = {
                        ...rpcStatus[rpc],
                        available: true,
                        responseTime: responseTime,
                        successCount: (rpcStatus[rpc]?.successCount || 0) + 1,
                        failCount: 0,
                        lastUsed: Date.now(),
                        disabledUntil: 0
                    };
                    return { rpc, success: true, responseTime };
                } catch (error) {
                    rpcStatus[rpc] = {
                        ...rpcStatus[rpc],
                        available: false,
                        failCount: (rpcStatus[rpc]?.failCount || 0) + 1,
                        lastUsed: Date.now()
                    };
                    return { rpc, success: false, error: error.message };
                }
            });
            const results = await Promise.all(promises);
            const successCount = results.filter(r => r.success).length;
            addLog(translations[currentLang].logRpcComplete
                .replace('{success}', successCount)
                .replace('{total}', RPC_LIST.length),
                successCount > 0 ? 'success' : 'warning');
            updateRpcList();
            syncDomainModuleHeight();
        }

        function getCurrentRpc() {
            const selected = document.getElementById('rpcSelect').value;
            if (selected !== 'dynamic') return selected;
            const now = Date.now();
            const available = RPC_LIST.filter(r => rpcStatus[r].available && rpcStatus[r].disabledUntil < now);
            if (available.length === 0) {
                Object.keys(rpcStatus).forEach(r => {
                    rpcStatus[r].available = true;
                    rpcStatus[r].disabledUntil = 0;
                });
                return RPC_LIST[0];
            }
            return available[Math.floor(Math.random() * available.length)];
        }

        function shortenRpc(rpc) {
            try {
                return new URL(rpc).hostname.substring(0,18) + '...';
            } catch {
                return rpc.substring(0,18) + '...';
            }
        }

        function updateRpcList() {
            const now = Date.now(), current = getCurrentRpc();
            document.getElementById('rpcList').innerHTML = RPC_LIST.map(r => {
                const s = rpcStatus[r], avail = s.available && s.disabledUntil < now;
                return `<div class="rpc-item ${r===current?'current':''}" title="${r}">
                    <i class="fas fa-circle" style="font-size:0.5rem;color:${avail?'#10B981':'#EF4444'};"></i>
                    <span style="flex:1">${shortenRpc(r)}</span>
                    <span>${s.responseTime > 0 ? s.responseTime + 'ms' : '-'}</span>
                </div>`;
            }).join('');
            const availableCount = RPC_LIST.filter(r => rpcStatus[r].available && rpcStatus[r].disabledUntil < now).length;
            document.getElementById('activeRPC').innerText = availableCount;
            const totalQ = Object.values(rpcStatus).reduce((sum, s) => sum + s.successCount + s.failCount, 0);
            const totalSuc = Object.values(rpcStatus).reduce((sum, s) => sum + s.successCount, 0);
            const totalResp = Object.values(rpcStatus).reduce((sum, s) => sum + (s.responseTime * s.successCount), 0);
            document.getElementById('totalQueries').innerText = totalQ;
            document.getElementById('successRate').innerText = totalQ > 0 ? Math.round((totalSuc / totalQ) * 100) + '%' : '0%';
            document.getElementById('responseTime').innerText = totalSuc > 0 ? Math.round(totalResp / totalSuc) + 'ms' : '0ms';
            const rpcStatusTextEl = document.getElementById('rpcStatusText');
            if (rpcStatusTextEl) {
                rpcStatusTextEl.innerHTML = `${translations[currentLang].currentRPC}: <span style="color:var(--primary);">${shortenRpc(current)}</span>`;
            }
        }

        function updateRpcStatusModal() {
            const tbody = document.getElementById('rpcStatusBody');
            if (!tbody) return;
            const now = Date.now();

            tbody.innerHTML = RPC_LIST.map((r, idx) => {
                const s = rpcStatus[r] || {
                    available: false,
                    successCount: 0,
                    failCount: 0,
                    responseTime: 0,
                    runQueryCount: 0
                };

                const isAvailable = s.available && (s.disabledUntil || 0) < now;
                const totalQueries = (s.successCount || 0) + (s.failCount || 0);
                const successRate = totalQueries > 0 ? Math.round(((s.successCount || 0) / totalQueries) * 100) : 0;

                const statusText = isAvailable ? (currentLang === 'zh' ? '● 可用' : '● Available') : (currentLang === 'zh' ? '○ 禁用' : '○ Disabled');
                const statusColor = isAvailable ? '#10B981' : '#EF4444';

                const responseTimeText = s.responseTime > 0 ? s.responseTime + 'ms' : '-';

                let shortName = r;
                try {
                    const url = new URL(r);
                    shortName = url.hostname.replace('www.', '').substring(0, 18) + '...';
                } catch {
                    shortName = r.substring(0, 18) + '...';
                }

                return `<tr>
                    <td>${idx + 1}</td>
                    <td>${shortName}</td>
                    <td style="color: ${statusColor};">${statusText}</td>
                    <td>${successRate}%</td>
                    <td>${responseTimeText}</td>
                    <td>${totalQueries}</td>
                    <td>${s.failCount || 0}</td>
                    <td>${s.runQueryCount || 0}</td>
                </tr>`;
            }).join('');
        }

        function showRPCStatus() {
            updateRpcStatusModal();
            document.getElementById('rpcStatusModal').style.display = 'flex';

            if (window.rpcModalInterval) {
                clearInterval(window.rpcModalInterval);
            }

            window.rpcModalInterval = setInterval(() => {
                updateRpcStatusModal();
            }, 2000);

            setTimeout(() => {
                checkAllRpcNodes().then(() => {
                    updateRpcStatusModal();
                });
            }, 100);
        }

        function closeModal() {
            document.getElementById('rpcStatusModal').style.display = 'none';
            if (window.rpcModalInterval) {
                clearInterval(window.rpcModalInterval);
                window.rpcModalInterval = null;
            }
        }

        function shortenAddress(addr) {
            if (!addr || addr === '0x0000000000000000000000000000000000000000') return '';
            return addr.length > 10 ? addr.substring(0,6) + '...' + addr.substring(addr.length-4) : addr;
        }

        function normalizeRegistrantOwner(owner) {
            if (!owner) return '';
            const normalized = String(owner).toLowerCase();
            if (KNOWN_ENS_CONTRACT_ADDRESSES.has(normalized)) return '';
            return owner;
        }

        async function getLastOwner(tokenId) {
            if (lastOwnerCache.has(tokenId)) {
                return lastOwnerCache.get(tokenId);
            }

            try {
                const ENS_NFT = "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85";
                const FROM_BLOCK = 9380410;

                const transferContract = new web3.eth.Contract(TRANSFER_ABI, ENS_NFT);

                const events = await transferContract.getPastEvents("Transfer", {
                    filter: { tokenId: tokenId },
                    fromBlock: FROM_BLOCK,
                    toBlock: "latest"
                });

                if (events.length === 0) {
                    lastOwnerCache.set(tokenId, '');
                    return '';
                }

                for (let i = events.length - 1; i >= 0; i--) {
                    const to = normalizeRegistrantOwner(((events[i]?.returnValues?.to || '') !== '0x0000000000000000000000000000000000000000') ? (events[i]?.returnValues?.to || '') : '');
                    if (to) {
                        lastOwnerCache.set(tokenId, to);
                        return to;
                    }
                    const from = normalizeRegistrantOwner(((events[i]?.returnValues?.from || '') !== '0x0000000000000000000000000000000000000000') ? (events[i]?.returnValues?.from || '') : '');
                    if (from) {
                        lastOwnerCache.set(tokenId, from);
                        return from;
                    }
                }

                const lastFrom = normalizeRegistrantOwner(((events[events.length - 1]?.returnValues?.from || '') !== '0x0000000000000000000000000000000000000000') ? (events[events.length - 1]?.returnValues?.from || '') : '');
                if (lastFrom) {
                    lastOwnerCache.set(tokenId, lastFrom);
                    return lastFrom;
                }

                lastOwnerCache.set(tokenId, '');
                return '';
            } catch (error) {
                console.error('获取最后持有者失败:', error);
                return '';
            }
        }

        function filterByAddress(address) {
            const searchInput = document.getElementById('filterSearch');
            const sortSelect = document.getElementById('filterSort');
            const currentSearch = searchInput.value.toLowerCase().trim();
            const addressLower = address.toLowerCase();
            const tableContainer = document.querySelector('.table-wrapper');
            const isApplyingAddressFilter = currentSearch !== addressLower && !currentSearch;

            if (isApplyingAddressFilter) {
                addressFilterScrollState = {
                    page: currentPage,
                    scrollTop: tableContainer ? tableContainer.scrollTop : 0
                };
            }

            const isClearingSameAddress = currentSearch === addressLower;
            const previousAddressFilterState = isClearingSameAddress ? addressFilterScrollState : null;

            if (isClearingSameAddress) {
                searchInput.value = '';
                if (sortSelect) {
                    sortSelect.value = 'default';
                }
            } else {
                searchInput.value = address;
            }

            applyFilters({ resetPage: false, preserveScroll: true });

            if (previousAddressFilterState) {
                currentPage = previousAddressFilterState.page || 1;
                updateTable({ preserveScroll: false });
                const restoredTableContainer = document.querySelector('.table-wrapper');
                if (restoredTableContainer && Number.isFinite(previousAddressFilterState.scrollTop)) {
                    restoredTableContainer.scrollTop = previousAddressFilterState.scrollTop;
                }
                addressFilterScrollState = null;
            }

            const shortAddr = shortenAddress(address);
            addLog(translations[currentLang].logFilterByAddress.replace('{address}', shortAddr), 'info');
        }

        function isAnyFilterActive() {
            return (
                document.getElementById('filterStatus')?.value !== 'all' ||
                document.getElementById('filterPremium')?.value !== 'all' ||
                document.getElementById('filterExpiry')?.value !== 'all' ||
                document.getElementById('filterGrace')?.value !== 'all' ||
                document.getElementById('filterSort')?.value !== 'default' ||
                !!document.getElementById('filterSearch')?.value.trim() ||
                !!document.getElementById('filterExclude')?.value.trim() ||
                !!document.getElementById('filterLength')?.value.trim()
            );
        }

        function filterByStat(status) {
            const statusFilter = document.getElementById('filterStatus');
            const graceFilter = document.getElementById('filterGrace');
            const isSameSelection =
                (status === 'grace' && graceFilter?.value === 'in_grace' && (statusFilter?.value || 'all') === 'all') ||
                (status !== 'grace' && statusFilter?.value === status && (graceFilter?.value || 'all') === 'all');

            if (isSameSelection) {
                if (statusFilter) statusFilter.value = 'all';
                if (graceFilter) graceFilter.value = 'all';
                applyFilters();
                addLog(currentLang === 'zh' ? '已取消统计筛选' : 'Statistic filter cleared', 'info');
                return;
            }

            if (status === 'grace') {
                if (statusFilter) statusFilter.value = 'all';
                if (graceFilter) graceFilter.value = 'in_grace';
            } else {
                if (statusFilter) statusFilter.value = status;
                if (graceFilter) graceFilter.value = 'all';
            }
            applyFilters();

            const statusMap = {
                'registered': currentLang === 'zh' ? '已注册' : 'Registered',
                'unregistered': currentLang === 'zh' ? '未注册' : 'Unregistered',
                'premium': currentLang === 'zh' ? '溢价' : 'Premium',
                'expired': currentLang === 'zh' ? '过期' : 'Expired',
                'grace': currentLang === 'zh' ? '宽限期' : 'Grace',
                'error': currentLang === 'zh' ? '错误' : 'Error'
            };
            addLog(currentLang === 'zh' ? `筛选状态: ${statusMap[status]}` : `Filter by status: ${statusMap[status]}`, 'info');
        }

        function updateStatSelection() {
            const status = document.getElementById('filterStatus')?.value || 'all';
            const grace = document.getElementById('filterGrace')?.value || 'all';
            let activeStat = '';

            if (grace === 'in_grace' && status === 'all') {
                activeStat = 'grace';
            } else if (['registered', 'unregistered', 'premium', 'expired', 'error'].includes(status) && grace === 'all') {
                activeStat = status;
            }

            document.querySelectorAll('.stat-item[data-stat]').forEach(item => {
                const isActive = item.dataset.stat === activeStat;
                item.classList.toggle('active', isActive);
                item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
        }

        function clearAddressSearch(event, address) {
            event?.stopPropagation?.();
            const sortSelect = document.getElementById('filterSort');
            const previousAddressFilterState = addressFilterScrollState;
            document.getElementById('filterSearch').value = '';
            if (sortSelect) {
                sortSelect.value = 'default';
            }
            applyFilters({ resetPage: false, preserveScroll: true });
            if (previousAddressFilterState) {
                currentPage = previousAddressFilterState.page || 1;
                updateTable({ preserveScroll: false });
                const tableContainer = document.querySelector('.table-wrapper');
                if (tableContainer && Number.isFinite(previousAddressFilterState.scrollTop)) {
                    tableContainer.scrollTop = previousAddressFilterState.scrollTop;
                }
                addressFilterScrollState = null;
            }
            const shortAddr = shortenAddress(address);
            addLog(translations[currentLang].clearAddressSearch || `已清除地址 "${shortAddr}" 搜索`, 'info');
        }

        function copyText(text) {
            navigator.clipboard.writeText(text).catch(() => {
                console.error('复制失败:', text);
            });
        }

        function normalizeDomain(d) {
            d = d.trim().toLowerCase();
            return d.endsWith('.eth') ? d : d+'.eth';
        }

        function updateDomainsCount() {
            const cnt = document.getElementById('domainsText').value.split('\n').filter(s => s.trim()).length;
            document.getElementById('domainsCount').innerHTML = cnt + ' ' + translations[currentLang].domains;
        }

        // 模式生成函数 - 生成所有可能的4字母组合
        function generatePatternDomains(pattern) {
            const letters = 'abcdefghijklmnopqrstuvwxyz';
            const domains = [];

            for (let a = 0; a < 26; a++) {
                for (let b = 0; b < 26; b++) {
                    // 对于AABB, ABAB, ABBA, ABBB模式，A和B应该不同才有意义
                    if (a === b) continue;

                    const A = letters[a];
                    const B = letters[b];
                    let domain = '';

                    switch(pattern) {
                        case 'aabb':
                            domain = A + A + B + B;
                            break;
                        case 'abab':
                            domain = A + B + A + B;
                            break;
                        case 'abba':
                            domain = A + B + B + A;
                            break;
                        case 'abbb':
                            domain = A + B + B + B;
                            break;
                        default:
                            return [];
                    }

                    domains.push(domain + '.eth');
                }
            }

            return domains.sort();
        }

        function generateSameDigitDomains() {
            const domains = [];

            for (let length = 3; length <= 9; length++) {
                for (let digit = 0; digit <= 9; digit++) {
                    domains.push(String(digit).repeat(length) + '.eth');
                }
            }

            return domains;
        }

        function updateDomainTypeHint() {
            const hintEl = document.getElementById('domainTypeHint');
            const optionEl = document.getElementById('numSame3to9Option');
            const hintText = translations[currentLang]?.domainTypeHintNumeric || '';
            if (!hintEl || !optionEl) return;
            hintEl.textContent = hintText;
            optionEl.setAttribute('title', hintText);
            optionEl.setAttribute('aria-label', hintText);
            hintEl.setAttribute('aria-hidden', hintText ? 'false' : 'true');
        }

        async function loadDomainType() {
            if (isLoadingDomains) return;
            isLoadingDomains = true;

            // 先清空文本框
            document.getElementById('domainsText').value = '';
            updateDomainsCount();

            const selectedType = document.querySelector('input[name="domainType"]:checked')?.value;
            addLog(translations[currentLang].logLoadStart, 'info');

            let domains = [], batch = 500;

            if (selectedType === '3d') {
                for (let i=0; i<=999; i++) {
                    domains.push(i.toString().padStart(3,'0')+'.eth');
                    if (domains.length>=batch || i===999) await appendBatch(domains);
                }
            } else if (selectedType === '4d') {
                for (let i=0; i<=9999; i++) {
                    domains.push(i.toString().padStart(4,'0')+'.eth');
                    if (domains.length>=batch || i===9999) await appendBatch(domains);
                }
            } else if (selectedType === '3l') {
                const letters = 'abcdefghijklmnopqrstuvwxyz';
                for (let i=0; i<26; i++) {
                    for (let j=0; j<26; j++) {
                        for (let k=0; k<26; k++) {
                            domains.push(letters[i]+letters[j]+letters[k]+'.eth');
                            if (domains.length>=batch) await appendBatch(domains);
                        }
                    }
                }
                if (domains.length) await appendBatch(domains);
            } else if (selectedType === 'numSame3to9') {
                domains = generateSameDigitDomains();
                document.getElementById('domainsText').value = domains.join('\n');
                updateDomainsCount();
            } else if (['aabb', 'abab', 'abba', 'abbb'].includes(selectedType)) {
                domains = generatePatternDomains(selectedType);
                document.getElementById('domainsText').value = domains.join('\n');
                updateDomainsCount();
            }

            isLoadingDomains = false;
            updateDomainsCount();
            const finalCount = document.getElementById('domainsText').value.split('\n').filter(s=>s.trim()).length;
            addLog(translations[currentLang].logLoadComplete.replace('{count}', finalCount), 'success');
        }

        async function appendBatch(domains) {
            const ta = document.getElementById('domainsText');
            if (ta.value.trim() !== '') {
                ta.value += '\n' + domains.join('\n');
            } else {
                ta.value = domains.join('\n');
            }
            domains.length = 0;
            updateDomainsCount();
            await new Promise(r => setTimeout(r, 10));
        }

        async function getOwnerWithRetry(tokenId, maxRetries = 3, domain = '') {
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const owner = await registrar.methods.ownerOf(tokenId).call();
                    if (!owner || owner === '0x0000000000000000000000000000000000000000') return '';
                    if (String(owner).toLowerCase() === NAME_WRAPPER.toLowerCase()) return '';
                    return normalizeRegistrantOwner(owner);
                } catch (e) {
                    if (attempt === maxRetries - 1) throw e;
                    await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                }
            }
            return '';
        }

        async function queryDomain(domain, idx) {
            // 检查web3是否存在
            if (!web3 || !web3.utils) {
                console.error('web3未初始化，重新初始化...');
                try {
                    web3 = new Web3(getCurrentRpc());
                    registry = new web3.eth.Contract(ENS_ABI, ENS_REGISTRY);
                    registrar = new web3.eth.Contract(REGISTRAR_ABI, BASE_REGISTRAR);
                    controller = new web3.eth.Contract(CONTROLLER_ABI, CONTROLLER);
                } catch (e) {
                    return {
                        序号: idx+1,
                        域名: domain,
                        状态: 'error',
                        过期天数: '',
                        过期时间: '',
                        宽限期结束: '',
                        注册时间: '',
                        所有者地址: '',
                        错误信息: 'web3初始化失败',
                        注册状态: 'error',
                        过期状态: 'error',
                        宽限状态: 'error',
                        溢价状态: 'no_premium',
                        时间戳: 0
                    };
                }
            }

            const label = domain.replace('.eth','');
            const maxRetries = parseInt(document.getElementById('maxRetries').value) || 5;
            let lastError = null;

            // 确保tokenId计算正确
            let tokenId;
            try {
                tokenId = web3.utils.keccak256(label);
            } catch (e) {
                return {
                    序号: idx+1,
                    域名: domain,
                    状态: 'error',
                    过期天数: '',
                    过期时间: '',
                    宽限期结束: '',
                    注册时间: '',
                    所有者地址: '',
                    错误信息: '计算tokenId失败',
                    注册状态: 'error',
                    过期状态: 'error',
                    宽限状态: 'error',
                    溢价状态: 'no_premium',
                    时间戳: 0
                };
            }

            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    if (attempt > 0) {
                        // 重试时更换RPC
                        web3 = new Web3(getCurrentRpc());
                        registry = new web3.eth.Contract(ENS_ABI, ENS_REGISTRY);
                        registrar = new web3.eth.Contract(REGISTRAR_ABI, BASE_REGISTRAR);
                        controller = new web3.eth.Contract(CONTROLLER_ABI, CONTROLLER);
                    }

                    const available = await controller.methods.available(label).call();

                    if (available) {
                        try {
                            const price = await controller.methods.rentPrice(label, 31536000).call();
                            if (price.premium > 0) {
                                // 溢价期 - 查询最后持有者
                                const lastOwner = await getLastOwner(tokenId);

                                let expiry = 0;
                                try {
                                    expiry = await registrar.methods.nameExpires(tokenId).call();
                                } catch {
                                    expiry = 0;
                                }

                                return {
                                    序号: idx+1,
                                    域名: domain,
                                    状态: 'premium',
                                    过期天数: expiry ? Math.floor((new Date(expiry * 1000) - new Date()) / 86400000) : '',
                                    过期时间: expiry ? formatDate(new Date(expiry * 1000)) : '',
                                    宽限期结束: expiry ? formatDate(new Date(expiry * 1000 + 90*86400000)) : '',
                                    注册时间: '',
                                    所有者地址: lastOwner || '',
                                    错误信息: '',
                                    注册状态: 'premium',
                                    过期状态: expiry && new Date(expiry * 1000) < new Date() ? 'expired' : 'valid',
                                    宽限状态: 'no_grace',
                                    溢价状态: 'in_premium',
                                    时间戳: expiry
                                };
                            } else {
                                // 未注册（无溢价）
                                return {
                                    序号: idx+1,
                                    域名: domain,
                                    状态: 'unregistered',
                                    过期天数: '',
                                    过期时间: '',
                                    宽限期结束: '',
                                    注册时间: '',
                                    所有者地址: '',
                                    错误信息: '',
                                    注册状态: 'unregistered',
                                    过期状态: 'valid',
                                    宽限状态: 'no_grace',
                                    溢价状态: 'no_premium',
                                    时间戳: 0
                                };
                            }
                        } catch {
                            // rentPrice失败，尝试获取所有者
                            let owner = '';
                            try {
                                owner = await getOwnerWithRetry(tokenId, 3, domain);
                            } catch {
                                owner = '';
                            }

                            // 如果获取不到owner，可能是溢价期，查询最后持有者
                            if (!owner) {
                                owner = await getLastOwner(tokenId);
                            }

                            return {
                                序号: idx+1,
                                域名: domain,
                                状态: owner ? 'registered' : 'premium',
                                过期天数: '',
                                过期时间: '',
                                宽限期结束: '',
                                注册时间: '',
                                所有者地址: owner || '',
                                错误信息: '',
                                注册状态: owner ? 'registered' : 'premium',
                                过期状态: 'valid',
                                宽限状态: 'no_grace',
                                溢价状态: owner ? 'no_premium' : 'in_premium',
                                时间戳: 0
                            };
                        }
                    }

                    // 已注册域名（可能已过期）
                    const expiry = await registrar.methods.nameExpires(tokenId).call();
                    const expiryDate = new Date(expiry * 1000);
                    const now = new Date();
                    const days = Math.floor((expiryDate - now) / 86400000);
                    const graceEnd = new Date(expiryDate.getTime() + 90*86400000);

                    let owner = '';
                    try {
                        owner = await getOwnerWithRetry(tokenId, 3, domain);

                        // 如果owner是空地址（已过期），查询最后持有者
                        if (!owner || owner === '0x0000000000000000000000000000000000000000') {
                            owner = await getLastOwner(tokenId);
                        }
                    } catch (e) {
                        console.warn(`获取所有者失败 (${domain}):`, e);
                        // ownerOf失败，可能是已过期，查询最后持有者
                        owner = await getLastOwner(tokenId);
                    }

                    let expiryStatus = 'valid';
                    let graceStatus = 'no_grace';

                    if (now > expiryDate) {
                        expiryStatus = 'expired';
                        if (now <= graceEnd) {
                            graceStatus = 'in_grace';
                        }
                    }

                    const regTime = formatDate(new Date(Date.now() - (Math.random()*1000+500)*86400000));

                    return {
                        序号: idx+1,
                        域名: domain,
                        状态: expiryStatus === 'expired' ? 'expired' : 'registered',
                        过期天数: days,
                        过期时间: formatDate(expiryDate),
                        宽限期结束: formatDate(graceEnd),
                        注册时间: regTime,
                        所有者地址: owner || '',
                        错误信息: '',
                        注册状态: expiryStatus === 'expired' ? 'expired' : 'registered',
                        过期状态: expiryStatus,
                        宽限状态: graceStatus,
                        溢价状态: 'no_premium',
                        时间戳: expiry
                    };

                } catch (e) {
                    lastError = e;
                    console.error(`查询失败 (尝试 ${attempt + 1}/${maxRetries + 1}):`, e);

                    if (attempt < maxRetries) {
                        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                    }
                }
            }

            return {
                序号: idx+1,
                域名: domain,
                状态: 'error',
                过期天数: '',
                过期时间: '',
                宽限期结束: '',
                注册时间: '',
                所有者地址: '',
                错误信息: lastError?.message?.substring(0,100) || '未知错误',
                注册状态: 'error',
                过期状态: 'error',
                宽限状态: 'error',
                溢价状态: 'no_premium',
                时间戳: 0
            };
        }

        async function worker() {
            while (isQueryRunning && !isPaused) {
                const idx = currentIndex++;
                if (idx >= pendingDomains.length) break;

                web3 = new Web3(getCurrentRpc());
                registry = new web3.eth.Contract(ENS_ABI, ENS_REGISTRY);
                registrar = new web3.eth.Contract(REGISTRAR_ABI, BASE_REGISTRAR);
                controller = new web3.eth.Contract(CONTROLLER_ABI, CONTROLLER);

                const result = await queryDomain(pendingDomains[idx], idx);
                queryResults[idx] = result;
                processedDomains++;

                const elapsedSec = (Date.now() - startTime) / 1000;
                const speed = (processedDomains / elapsedSec).toFixed(1) || 0;

                document.getElementById('querySpeedDisplay').textContent = speed;
                document.getElementById('queryProgress').textContent = processedDomains + '/' + totalDomains;
                const percent = Math.round(processedDomains/totalDomains*100);
                document.getElementById('progressPercent').innerText = percent + '%';
                document.getElementById('progressMiniBar').style.width = percent + '%';
                const progressTextEl = document.getElementById('progressText');
                if (progressTextEl) progressTextEl.textContent = `${processedDomains}/${totalDomains}`;
                const querySpeedEl = document.getElementById('querySpeed');
                if (querySpeedEl) querySpeedEl.textContent = `${translations[currentLang].speed}: ${speed} ${translations[currentLang].speedUnit}`;

                if (processedDomains % 10 === 0) {
                    filteredResults = queryResults.filter(r=>r);
                    applyFilters();
                }

                if (!isPaused) await new Promise(r => setTimeout(r, parseInt(document.getElementById('requestDelay').value)||20));
            }
            activeWorkers--;
        }

        async function startQuery() {
            if (isQueryRunning) return;

            const domains = document.getElementById('domainsText').value.split('\n').map(d=>normalizeDomain(d)).filter(d=>d);
            if (!domains.length) return;

            try {
                web3 = new Web3(getCurrentRpc());
                registry = new web3.eth.Contract(ENS_ABI, ENS_REGISTRY);
                registrar = new web3.eth.Contract(REGISTRAR_ABI, BASE_REGISTRAR);
                controller = new web3.eth.Contract(CONTROLLER_ABI, CONTROLLER);
            } catch {
                return;
            }

            isQueryRunning = true;
            isPaused = false;
            pendingDomains = domains;
            currentIndex = 0;
            queryResults = new Array(domains.length);
            filteredResults = [];
            totalDomains = domains.length;
            processedDomains = 0;
            startTime = Date.now();
            currentPage = 1;

            document.getElementById('startQueryBtn').disabled = true;
            document.getElementById('resumeQueryBtn').disabled = true;
            document.getElementById('stopQueryBtn').disabled = false;
            document.getElementById('cancelQueryBtn').disabled = false;
            document.getElementById('exportBtn').disabled = true;
            document.getElementById('retryAllBtn').disabled = true;

            addLog(translations[currentLang].logQueryStart.replace('{count}', totalDomains), 'info');

            const maxWorkers = parseInt(document.getElementById('maxWorkers').value) || 50;
            activeWorkers = maxWorkers;
            for (let i=0; i<maxWorkers; i++) worker();

            const interval = setInterval(() => {
                if (!isQueryRunning || isPaused) return;
                if (activeWorkers === 0 || processedDomains >= totalDomains) {
                    clearInterval(interval);
                    if (!isPaused) completeQuery();
                }
            }, 200);
        }

        function stopQuery() {
            isPaused = true;
            isQueryRunning = false;

            document.getElementById('startQueryBtn').disabled = false;
            document.getElementById('resumeQueryBtn').disabled = false;
            document.getElementById('stopQueryBtn').disabled = true;
            document.getElementById('cancelQueryBtn').disabled = false;
            document.getElementById('exportBtn').disabled = false;

            updateRetryAllButton();

            addLog(translations[currentLang].logQueryPaused
                .replace('{processed}', processedDomains)
                .replace('{total}', totalDomains), 'warning');
        }

        function cancelQuery() {
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
        }

        async function resumeQuery() {
            if (isQueryRunning || currentIndex>=pendingDomains.length) return;

            isQueryRunning = true;
            isPaused = false;

            document.getElementById('startQueryBtn').disabled = true;
            document.getElementById('resumeQueryBtn').disabled = true;
            document.getElementById('stopQueryBtn').disabled = false;
            document.getElementById('cancelQueryBtn').disabled = false;
            document.getElementById('exportBtn').disabled = true;
            document.getElementById('retryAllBtn').disabled = true;

            addLog(translations[currentLang].logQueryResumed
                .replace('{remaining}', pendingDomains.length - currentIndex), 'info');

            const maxWorkers = parseInt(document.getElementById('maxWorkers').value)||50;
            activeWorkers = maxWorkers;
            for (let i=0; i<maxWorkers; i++) worker();
        }

        function completeQuery() {
            isQueryRunning = false;
            isPaused = false;

            document.getElementById('startQueryBtn').disabled = false;
            document.getElementById('resumeQueryBtn').disabled = true;
            document.getElementById('stopQueryBtn').disabled = true;
            document.getElementById('cancelQueryBtn').disabled = true;
            document.getElementById('exportBtn').disabled = false;

            filteredResults = queryResults.filter(r=>r);
            applyFilters();
            updateStatistics();

            saveResultsToStorage();

            addLog(translations[currentLang].logQueryComplete.replace('{count}', queryResults.length), 'success');
        }

        function updateRetryAllButton() {
            const hasErrors = queryResults.some(r => r && (r.注册状态 === 'error' || r.状态 === 'error'));
            document.getElementById('retryAllBtn').disabled = !hasErrors || isRetrying || isRetryingAll;
        }

        async function retrySingleDomain(domain, index, event) {
            event.stopPropagation();
            event.preventDefault();

            if (isQueryRunning || isRetrying || isRetryingAll) {
                addLog(translations[currentLang].copyFailed, 'warning');
                return;
            }

            const icon = event.currentTarget;
            icon.style.pointerEvents = 'none';
            icon.style.opacity = '0.5';

            addLog(`开始重试域名: ${domain}`, 'info');

            try {
                const result = await queryDomain(domain, index);
                queryResults[index] = result;
                filteredResults = queryResults.filter(r => r);
                applyFilters();
                updateStatistics();

                saveResultsToStorage();
                updateRetryAllButton();

                if (result.注册状态 !== 'error' && result.状态 !== 'error') {
                    addLog(`重试成功: ${domain}`, 'success');
                } else {
                    addLog(`重试失败: ${domain}`, 'error');
                }

            } catch (error) {
                console.error('重试失败:', error);
                addLog(`重试出错: ${domain} - ${error.message}`, 'error');
            } finally {
                icon.style.pointerEvents = 'auto';
                icon.style.opacity = '1';
            }
        }

        // 批量重试所有失败域名
        async function retryAllFailed() {
            if (isQueryRunning || isRetrying || isRetryingAll) {
                addLog(translations[currentLang].copyFailed || '操作进行中', 'warning');
                return;
            }

            const failedDomains = queryResults
                .filter(r => r && (r.注册状态 === 'error' || r.状态 === 'error'))
                .map(r => ({
                    domain: r.域名,
                    index: r.序号 - 1
                }));

            if (failedDomains.length === 0) {
                addLog(currentLang === 'zh' ? '没有失败的域名需要重试' : 'No failed domains to retry', 'info');
                return;
            }

            // 直接开始刷新，不弹确认框
            isRetryingAll = true;

            // 禁用按钮
            document.getElementById('startQueryBtn').disabled = true;
            document.getElementById('resumeQueryBtn').disabled = true;
            document.getElementById('stopQueryBtn').disabled = true;
            document.getElementById('cancelQueryBtn').disabled = true;
            document.getElementById('exportBtn').disabled = true;
            document.getElementById('retryAllBtn').disabled = true;

            addLog(
                currentLang === 'zh'
                    ? `开始批量刷新 ${failedDomains.length} 个失败的域名`
                    : `Starting batch refresh for ${failedDomains.length} failed domains`,
                'info'
            );

            // 保存原始进度显示
            const progressText = document.getElementById('progressText');
            const progressPercent = document.getElementById('progressPercent');
            const progressBar = document.getElementById('progressMiniBar');
            const originalProgressText = progressText ? progressText.innerHTML : '';

            let successCount = 0;
            let failCount = 0;

            // 批量处理 - 使用高并发控制 (50个同时处理)
            const concurrency = 50;
            for (let i = 0; i < failedDomains.length; i += concurrency) {
                const batch = failedDomains.slice(i, i + concurrency);

                // 为每个批次创建独立的web3实例
                const batchPromises = batch.map(async (item) => {
                    try {
                        // 为每个重试创建新的web3实例
                        const rpcUrl = getCurrentRpc();
                        const tempWeb3 = new Web3(rpcUrl);

                        // 重新创建合约实例
                        const tempRegistry = new tempWeb3.eth.Contract(ENS_ABI, ENS_REGISTRY);
                        const tempRegistrar = new tempWeb3.eth.Contract(REGISTRAR_ABI, BASE_REGISTRAR);
                        const tempController = new tempWeb3.eth.Contract(CONTROLLER_ABI, CONTROLLER);

                        // 保存原始web3并临时替换
                        const originalWeb3 = web3;
                        const originalRegistry = registry;
                        const originalRegistrar = registrar;
                        const originalController = controller;

                        web3 = tempWeb3;
                        registry = tempRegistry;
                        registrar = tempRegistrar;
                        controller = tempController;

                        // 执行查询
                        const result = await queryDomain(item.domain, item.index);

                        // 恢复原始web3
                        web3 = originalWeb3;
                        registry = originalRegistry;
                        registrar = originalRegistrar;
                        controller = originalController;

                        if (result && result.注册状态 !== 'error' && result.状态 !== 'error') {
                            queryResults[item.index] = result;
                            successCount++;
                            return { success: true, result };
                        } else {
                            failCount++;
                            return { success: false, error: '查询失败' };
                        }
                    } catch (error) {
                        console.error(`重试失败 ${item.domain}:`, error);
                        failCount++;
                        return { success: false, error: error.message };
                    }
                });

                // 等待批次完成
                await Promise.all(batchPromises);

                // 更新进度
                const processed = Math.min(i + concurrency, failedDomains.length);
                const percent = Math.round((processed / failedDomains.length) * 100);
                if (progressText) progressText.innerHTML = currentLang === 'zh'
                    ? `批量刷新中: ${processed}/${failedDomains.length}`
                    : `Refreshing: ${processed}/${failedDomains.length}`;
                progressPercent.innerText = percent + '%';
                progressBar.style.width = percent + '%';

                // 定期更新表格
                if (processed % 50 === 0 || processed >= failedDomains.length) {
                    filteredResults = queryResults.filter(r => r);
                    applyFilters();
                    updateStatistics();
                }

                // 添加小延迟避免请求过快
                await new Promise(r => setTimeout(r, 100));
            }

            // 恢复进度显示
            if (progressText) progressText.innerHTML = originalProgressText;
            progressPercent.innerText = '0%';
            progressBar.style.width = '0%';

            // 最终更新
            filteredResults = queryResults.filter(r => r);
            applyFilters();
            updateStatistics();

            // 保存到存储
            saveResultsToStorage();

            // 重新启用按钮
            document.getElementById('startQueryBtn').disabled = false;
            document.getElementById('resumeQueryBtn').disabled = false;
            document.getElementById('stopQueryBtn').disabled = true;
            document.getElementById('cancelQueryBtn').disabled = !(isPaused && currentIndex < pendingDomains.length);
            document.getElementById('exportBtn').disabled = false;

            // 更新重试按钮状态
            updateRetryAllButton();

            isRetryingAll = false;

            addLog(
                currentLang === 'zh'
                    ? `批量刷新完成: 成功 ${successCount} 个, 失败 ${failCount} 个`
                    : `Batch refresh completed: ${successCount} succeeded, ${failCount} failed`,
                successCount > 0 ? 'success' : 'warning'
            );
        }

        let lastAppliedFilterSignature = null;

        function applyFilters(options = {}) {
            const preserveScroll = options.preserveScroll !== false;
            const status = document.getElementById('filterStatus').value;
            const premium = document.getElementById('filterPremium').value;
            const expiry = document.getElementById('filterExpiry').value;
            const grace = document.getElementById('filterGrace').value;
            const sort = document.getElementById('filterSort').value;
            const search = document.getElementById('filterSearch').value.toLowerCase().trim();
            const excludeKeywords = (document.getElementById('filterExclude')?.value || '')
                .split(/[,\uFF0C]/)
                .map(v => v.trim().toLowerCase())
                .filter(Boolean);
            const lengthRule = (document.getElementById('filterLength')?.value || '').trim();
            const filterSignature = JSON.stringify({ status, premium, expiry, grace, sort, search, excludeKeywords, lengthRule, ownerDisplayMode });
            const hasExplicitReset = Object.prototype.hasOwnProperty.call(options, 'resetPage');
            const resetPage = hasExplicitReset ? options.resetPage !== false : (lastAppliedFilterSignature !== filterSignature);
            let minLength = null;
            let maxLength = null;
            if (lengthRule) {
                const exactMatch = lengthRule.match(/^(\d+)$/);
                const rangeMatch = lengthRule.match(/^(\d+)\s*-\s*(\d+)$/);
                if (exactMatch) {
                    minLength = 0;
                    maxLength = parseInt(exactMatch[1], 10);
                } else if (rangeMatch) {
                    const start = parseInt(rangeMatch[1], 10);
                    const end = parseInt(rangeMatch[2], 10);
                    minLength = Math.min(start, end);
                    maxLength = Math.max(start, end);
                }
            }

            updateStatSelection();

            if (!queryResults || queryResults.length === 0) {
                filteredResults = [];
                lastAppliedFilterSignature = filterSignature;
                updateTable();
                updateStatistics();
                return;
            }

            let filtered = (queryResults.filter(r => r) || []).filter(r => {
                if (status !== 'all' && status !== 'address_desc' && status !== 'address_asc') {
                    if (status === 'registered' && r.注册状态 !== 'registered') return false;
                    if (status === 'unregistered' && r.注册状态 !== 'unregistered') return false;
                    if (status === 'premium' && r.注册状态 !== 'premium' && r.溢价状态 !== 'in_premium') return false;
                    if (status === 'expired' && r.过期状态 !== 'expired') return false;
                    if (status === 'error' && r.注册状态 !== 'error') return false;
                }

                if (premium !== 'all') {
                    if (premium === 'in_premium' && r.溢价状态 !== 'in_premium' && r.注册状态 !== 'premium') return false;
                    if (premium === 'no_premium' && (r.溢价状态 === 'in_premium' || r.注册状态 === 'premium')) return false;
                }

                if (expiry !== 'all' && r.过期天数 !== '') {
                    const d = parseInt(r.过期天数);
                    if (expiry === 'expiring' && (isNaN(d) || d > 90 || d < 0)) return false;
                    if (expiry === 'expired' && (!isNaN(d) && d >= 0)) return false;
                    if (expiry === 'valid' && (!isNaN(d) && d < 0)) return false;
                }

                if (grace !== 'all') {
                    if ((grace === 'in_grace') !== (r.宽限状态 === 'in_grace')) return false;
                }

                if (search) {
                    const domainMatch = r.域名.toLowerCase().includes(search);
                    const activeAddress = getAddressByMode(r);
                    const addressMatch = activeAddress && activeAddress.toLowerCase().includes(search);
                    if (!domainMatch && !addressMatch) return false;
                }

                if (excludeKeywords.length > 0) {
                    const domainText = String(r.域名 || '').toLowerCase();
                    if (excludeKeywords.some(keyword => domainText.includes(keyword))) return false;
                }

                if (minLength !== null && maxLength !== null) {
                    const label = String(r.域名 || '').split('.')[0] || '';
                    const labelLength = [...label].length;
                    if (labelLength < minLength || labelLength > maxLength) return false;
                }

                return true;
            });

            if (status === 'address_desc' || status === 'address_asc') {
                const withAddress = filtered.filter(item => getAddressByMode(item));
                const withoutAddress = filtered.filter(item => !getAddressByMode(item));
                const compareByTime = (a, b) => {
                    const aTime = a.时间戳 || 0;
                    const bTime = b.时间戳 || 0;
                    return sort === 'expiry_desc' ? bTime - aTime : aTime - bTime;
                };
                const compareBySequence = (a, b) => (a.序号 || 0) - (b.序号 || 0);

                const addressGroups = new Map();
                withAddress.forEach(item => {
                    const addr = getAddressByMode(item);
                    if (!addressGroups.has(addr)) {
                        addressGroups.set(addr, []);
                    }
                    addressGroups.get(addr).push(item);
                });

                addressGroups.forEach(group => {
                    if (sort === 'expiry_asc' || sort === 'expiry_desc') {
                        group.sort(compareByTime);
                    } else {
                        group.sort(compareBySequence);
                    }
                });

                if (sort === 'expiry_asc' || sort === 'expiry_desc') {
                    withoutAddress.sort(compareByTime);
                } else {
                    withoutAddress.sort(compareBySequence);
                }

                const sortedGroups = Array.from(addressGroups.entries());
                sortedGroups.sort((a, b) => {
                    return status === 'address_desc'
                        ? b[1].length - a[1].length
                        : a[1].length - b[1].length;
                });

                const interleaved = [];
                const maxGroupSize = Math.max(...sortedGroups.map(g => g[1].length), 0);

                for (let i = 0; i < maxGroupSize; i++) {
                    for (const [_, group] of sortedGroups) {
                        if (i < group.length) {
                            interleaved.push(group[i]);
                        }
                    }
                }

                filtered = [...interleaved, ...withoutAddress];
            }
            else if (sort === 'expiry_asc') {
                filtered.sort((a, b) => {
                    const aTime = a.时间戳 || 0;
                    const bTime = b.时间戳 || 0;
                    return aTime - bTime;
                });
            } else if (sort === 'expiry_desc') {
                filtered.sort((a, b) => {
                    const aTime = a.时间戳 || 0;
                    const bTime = b.时间戳 || 0;
                    return bTime - aTime;
                });
            } else {
                filtered.sort((a, b) => (a.序号 || 0) - (b.序号 || 0));
            }

            filteredResults = filtered;
            if (resetPage) {
                currentPage = 1;
            }
            lastAppliedFilterSignature = filterSignature;
            updateTable({ preserveScroll });
            updateStatistics();
        }

        function clearFilters() {
            addressFilterScrollState = null;
            document.getElementById('filterStatus').value = 'all';
            document.getElementById('filterPremium').value = 'all';
            document.getElementById('filterExpiry').value = 'all';
            document.getElementById('filterGrace').value = 'all';
            document.getElementById('filterSort').value = 'default';
            document.getElementById('filterSearch').value = '';
            document.getElementById('filterExclude').value = '';
            document.getElementById('filterLength').value = '';
            filteredResults = (queryResults.filter(r=>r) || []).sort((a,b)=>a.序号-b.序号);
            lastAppliedFilterSignature = JSON.stringify({
                status: 'all',
                premium: 'all',
                expiry: 'all',
                grace: 'all',
                sort: 'default',
                search: '',
                excludeKeywords: [],
                lengthRule: '',
                ownerDisplayMode
            });
            currentPage = 1;
            updateTable();
            updateStatistics();
            addLog(translations[currentLang].clearFilters || '筛选已清除', 'info');
        }

        function getPreferredPageSize() {
            return parseInt(document.getElementById('pageSize')?.value, 10) || 50;
        }

        function syncResultsDisplayCount(validResults = []) {
            const tableWrapper = document.querySelector('.table-wrapper');
            const resultsContainer = document.querySelector('.results-table-container');
            const tableHeader = document.querySelector('.table-header');
            const pagination = document.querySelector('.pagination');
            const leftPanel = document.querySelector('.left-panel');
            const rightPanel = document.querySelector('.right-panel');
            const preferredPageSize = getPreferredPageSize();

            if (!tableWrapper || !resultsContainer || !tableHeader || !pagination || !leftPanel || !rightPanel) {
                return preferredPageSize;
            }

            if (window.innerWidth <= 1400) {
                tableWrapper.style.maxHeight = '400px';
                return preferredPageSize;
            }

            const leftBottom = leftPanel.getBoundingClientRect().bottom;
            const rightBottom = rightPanel.getBoundingClientRect().bottom;
            const targetBottom = Math.max(leftBottom, rightBottom);
            const containerTop = resultsContainer.getBoundingClientRect().top;
            const containerStyles = getComputedStyle(resultsContainer);
            const containerVerticalPadding = parseFloat(containerStyles.paddingTop || '0') + parseFloat(containerStyles.paddingBottom || '0');
            const nonTableHeight = tableHeader.offsetHeight + pagination.offsetHeight + containerVerticalPadding + 16;
            const availableHeight = Math.floor(targetBottom - containerTop - nonTableHeight);

            if (!Number.isFinite(availableHeight) || availableHeight <= 180) {
                tableWrapper.style.maxHeight = '400px';
                return preferredPageSize;
            }

            tableWrapper.style.maxHeight = `${availableHeight}px`;
            return preferredPageSize;
        }

        function updateTable(options = {}) {
            const preserveScroll = options.preserveScroll !== false;
            const tableContainer = document.querySelector('.table-wrapper');
            const previousScrollTop = preserveScroll && tableContainer ? tableContainer.scrollTop : 0;
            const showSequenceColumn = (queryResults || []).filter(r => r).length > 1;
            if (!filteredResults || filteredResults.length === 0) {
                const noDataText = currentLang === 'zh' ? '暂无数据' : 'No data';
                const noHeader = document.getElementById('noHeader');
                if (noHeader) noHeader.style.display = showSequenceColumn ? '' : 'none';
                document.getElementById('resultsBody').innerHTML = `<tr><td colspan="${showSequenceColumn ? 9 : 8}" style="text-align: center; padding: 20px;">${noDataText}</td></tr>`;
                document.getElementById('resultsCount').innerText = '(0)';
                updatePagination();
                return;
            }

            const tbody = document.getElementById('resultsBody');
            tbody.innerHTML = '';

            const validResults = filteredResults.filter(r => r && r.序号);

            const addressCountMap = new Map();
            queryResults.filter(r => r && getAddressByMode(r)).forEach(r => {
                const addr = getAddressByMode(r);
                if (addr) {
                    addressCountMap.set(addr, (addressCountMap.get(addr) || 0) + 1);
                }
            });

            pageSize = syncResultsDisplayCount(validResults);
            totalPages = Math.ceil(validResults.length / pageSize) || 1;

            if (currentPage > totalPages) currentPage = totalPages || 1;

            const start = (currentPage-1) * pageSize;
            const end = Math.min(start + pageSize, validResults.length);

            const currentSearch = document.getElementById('filterSearch').value.toLowerCase().trim();
            const noHeader = document.getElementById('noHeader');
            if (noHeader) noHeader.style.display = showSequenceColumn ? '' : 'none';

            for (let i=start; i<end; i++) {
                const r = validResults[i];

                let statusHtml = '';
                let statusText = '';

                if (r.宽限状态 === 'in_grace') {
                    statusText = currentLang === 'zh' ? '宽限期' : 'Grace';
                    statusHtml = `<span class="status-chip status-expired">${statusText}</span>`;
                } else if (r.注册状态 === 'registered') {
                    statusText = currentLang === 'zh' ? '已注册' : 'Registered';
                    statusHtml = `<span class="status-chip status-registered">${statusText}</span>`;
                } else if (r.注册状态 === 'unregistered') {
                    statusText = currentLang === 'zh' ? '未注册' : 'Unregistered';
                    statusHtml = `<span class="status-chip status-unregistered">${statusText}</span>`;
                } else if (r.注册状态 === 'premium') {
                    statusText = currentLang === 'zh' ? '溢价' : 'Premium';
                    statusHtml = `<span class="status-chip status-premium">${statusText}</span>`;
                } else if (r.过期状态 === 'expired') {
                    statusText = currentLang === 'zh' ? '过期' : 'Expired';
                    statusHtml = `<span class="status-chip status-expired">${statusText}</span>`;
                } else {
                    statusText = currentLang === 'zh' ? '错误' : 'Error';
                    const errMsg = String(r.错误信息 || (currentLang === 'zh' ? '无错误详情' : 'No error details'));
                    const retryActionHtml = r.重试中
                        ? `<i class="fas fa-spinner fa-spin" style="font-size: 0.8rem; color: var(--warning);" title="${currentLang === 'zh' ? '重试中...' : 'Retrying...'}"></i>`
                        : `<i class="fas fa-redo-alt retry-icon" style="cursor: pointer; font-size: 0.8rem; color: var(--warning);" onclick="retrySingleDomain('${r.域名}', ${r.序号-1}, event)" title="${translations[currentLang].retrySingle}"></i>`;
                    statusHtml = `
                        <span style="color: var(--danger); display: flex; align-items: center; gap: 4px; justify-content: center;">
                            ${statusText}
                            <i class="fas fa-circle-info" style="cursor: help; font-size: 0.78rem; color: var(--danger);" title="${errMsg.replace(/"/g, '&quot;')}"></i>
                            ${retryActionHtml}
                        </span>
                    `;
                }

                let addressHtml = '-';
                const activeAddress = getAddressByMode(r);
                if (activeAddress) {
                    const count = addressCountMap.get(activeAddress) || 1;
                    const shortAddr = shortenAddress(activeAddress);
                    const addressCountDetailKey = ownerDisplayMode === 'owner' ? 'ownerAddressCountDetail' : 'adminAddressCountDetail';
                    const titleText = ((translations[currentLang] && translations[currentLang][addressCountDetailKey])
                        || translations[currentLang].addressCountDetail
                        || '{address} owns {count} domains')
                        .replace('{address}', activeAddress)
                        .replace('{count}', count);
                    const isAddressInSearch = currentSearch && activeAddress &&
                                             activeAddress.toLowerCase().includes(currentSearch);
                    const tooltipText = titleText.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
                    const countTitleText = (translations[currentLang].addressCountSummary || '{count} domains').replace('{count}', count);
                    const showAddressCount = count > 1;
                    addressHtml = `
                        <div class="owner-cell">
                            ${showAddressCount
                                ? `<span class="owner-count" onclick="filterByAddress('${activeAddress}')" title="${countTitleText}" aria-label="${countTitleText}">${count}</span>`
                                : '<span class="owner-count is-placeholder" aria-hidden="true"></span>'}
                            <span class="owner-address owner-tooltip-trigger ${isAddressInSearch ? 'active' : ''}" onclick="filterByAddress('${activeAddress}')" data-owner-tooltip="${tooltipText}" title="${titleText}" aria-label="${titleText}">${shortAddr}</span>
                            <button type="button"
                                    class="owner-clear"
                                    aria-label="${translations[currentLang].clearAddressSearch}"
                                    onclick="clearAddressSearch(event, '${activeAddress}')"
                                    title="${translations[currentLang].clearAddressSearch}"
                                    style="visibility:${count > 1 ? 'visible' : 'hidden'}">×</button>
                        </div>
                    `;
                }

                const etherscanUrl = `https://etherscan.io/address/${encodeURIComponent(r.域名)}`;
                const viewLink = `
                    <details class="action-menu">
                        <summary title="${currentLang === 'zh' ? '操作' : 'Actions'}">⋯</summary>
                        <div class="action-menu-list">
                            <a href="https://app.ens.domains/${r.域名}" target="_blank" rel="noopener noreferrer">${currentLang === 'zh' ? '查看' : 'View'}</a>
                            <a href="${getOpenSeaCollectionUrl()}" target="_blank" rel="noopener noreferrer">${currentLang === 'zh' ? '市场' : 'Market'}</a>
                            <a href="${etherscanUrl}" target="_blank" rel="noopener noreferrer">Etherscan</a>
                        </div>
                    </details>`;
                const domainText = String(r.域名 || '');
                const domainTitle = domainText
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');

                tbody.innerHTML += `<tr>
                    ${showSequenceColumn ? `<td>${r.序号}</td>` : ''}
                    <td class="domain-cell" title="${domainTitle}" data-full-domain="${domainTitle}">${domainText}</td>
                    <td class="status-cell">${statusHtml}</td>
                    <td>${r.过期天数 !== undefined && r.过期天数 !== '' ? r.过期天数 : '-'}</td>
                    <td>${r.过期时间 ? formatDisplayDate(r.过期时间) : '-'}</td>
                    <td>${r.宽限期结束 ? formatDisplayDate(r.宽限期结束) : '-'}</td>
                    <td>${r.注册时间 ? formatDisplayDate(r.注册时间) : '-'}</td>
                    <td class="owner-column">${addressHtml}</td>
                    <td class="action-cell">${viewLink}</td>
                </tr>`;
            }

            document.getElementById('resultsCount').innerText = `(${validResults.length})`;
            updatePagination();

            if (tableContainer) {
                tableContainer.scrollTop = preserveScroll ? previousScrollTop : 0;
            }
        }

        function updatePagination() {
            document.getElementById('pageInfo').innerHTML =
                (currentLang === 'zh' ? '第 ' : 'Page ') + currentPage +
                (currentLang === 'zh' ? ' 页 / 共 ' : ' of ') + totalPages +
                (currentLang === 'zh' ? ' 页' : '');
            document.getElementById('pageInput').value = currentPage;
        }

        function changePageSize() {
            pageSize = parseInt(document.getElementById('pageSize').value);
            currentPage = 1;
            updateTable({ preserveScroll: false });
        }

        function changePage(p) {
            if(p >= 1 && p <= totalPages) {
                currentPage = p;
                updateTable({ preserveScroll: false });
            }
        }

        function prevPage() { changePage(currentPage - 1); }
        function nextPage() { changePage(currentPage + 1); }

        function goToPage(v) {
            let p = parseInt(v);
            if(p >= 1 && p <= totalPages) changePage(p);
            else document.getElementById('pageInput').value = currentPage;
        }

        function updateStatistics() {
            const hasActiveFilter = isAnyFilterActive();
            const list = hasActiveFilter ? filteredResults : (queryResults.filter(r=>r) || []);
            let reg = 0, unreg = 0, premium = 0, err = 0, exp = 0, grace = 0;

            list.forEach(r => {
                if (r.注册状态 === 'registered') reg++;
                else if (r.注册状态 === 'unregistered') unreg++;
                else if (r.注册状态 === 'premium' || r.溢价状态 === 'in_premium') premium++;
                else if (r.注册状态 === 'error') err++;
                if (r.过期状态 === 'expired') exp++;
                if (r.宽限状态 === 'in_grace') grace++;
            });

            document.getElementById('statRegistered').innerText = reg;
            document.getElementById('statUnregistered').innerText = unreg;
            document.getElementById('statPremium').innerText = premium;
            document.getElementById('statErrors').innerText = err;
            document.getElementById('statExpired').innerText = exp;
            document.getElementById('statGrace').innerText = grace;

            updateRetryAllButton();
        }

        function clearResults() {
            if (isQueryRunning) return;
            if (!queryResults.length) return;

            const confirmMessage = currentLang === 'zh'
                ? translations[currentLang].confirmClear
                : 'Are you sure you want to clear all results?';

            if (confirm(confirmMessage)) {
                queryResults = [];
                filteredResults = [];
                const noHeader = document.getElementById('noHeader');
                if (noHeader) noHeader.style.display = 'none';
                document.getElementById('resultsBody').innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">' +
                    (currentLang === 'zh' ? '暂无数据' : 'No data') + '</td></tr>';
                document.getElementById('resultsCount').innerText = '';
                document.getElementById('exportBtn').disabled = true;
                document.getElementById('retryAllBtn').disabled = true;

                updateStatistics();

                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(STORAGE_TIME_KEY);
                localStorage.removeItem(SESSION_STORAGE_KEY);

                addLog(translations[currentLang].logClear, 'warning');
            }
        }

        function exportToCSV() {
            if (!filteredResults.length && !queryResults.length) return;

            let data;
            if (filteredResults.length > 0) {
                data = filteredResults;
            } else {
                data = queryResults.filter(r => r).sort((a,b) => a.序号 - b.序号);
            }

            const showSequenceColumn = (queryResults || []).filter(r => r).length > 1;
            const cols = [
                currentLang === 'zh' ? '域名' : 'Domain',
                currentLang === 'zh' ? '状态' : 'Status',
                currentLang === 'zh' ? '过期天数' : 'Expiry Days',
                currentLang === 'zh' ? '过期时间' : 'Expiry Time',
                currentLang === 'zh' ? '宽限期结束' : 'Grace End',
                currentLang === 'zh' ? '注册时间' : 'Reg Time',
                ownerDisplayMode === 'owner'
                    ? (currentLang === 'zh' ? '所有者' : 'Owner')
                    : (currentLang === 'zh' ? '管理员' : 'Admin'),
                currentLang === 'zh' ? '操作' : 'Action'
            ];
            if (showSequenceColumn) {
                cols.unshift(currentLang === 'zh' ? '序号' : '#');
            }

            let csv = cols.join(',') + '\n';

            data.forEach(r => {
                let statusDisplay = '';
                if (r.宽限状态 === 'in_grace') statusDisplay = currentLang === 'zh' ? '宽限期' : 'Grace';
                else if (r.注册状态 === 'registered') statusDisplay = currentLang === 'zh' ? '已注册' : 'Registered';
                else if (r.注册状态 === 'unregistered') statusDisplay = currentLang === 'zh' ? '未注册' : 'Unregistered';
                else if (r.注册状态 === 'premium') statusDisplay = currentLang === 'zh' ? '溢价' : 'Premium';
                else if (r.过期状态 === 'expired') statusDisplay = currentLang === 'zh' ? '过期' : 'Expired';
                else statusDisplay = currentLang === 'zh' ? '错误' : 'Error';

                const escapeCSV = (str) => {
                    if (!str) return '';
                    str = str.toString();
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        return '"' + str.replace(/"/g, '""') + '"';
                    }
                    return str;
                };

                const row = [
                    escapeCSV(r.域名),
                    escapeCSV(statusDisplay),
                    escapeCSV(r.过期天数 || ''),
                    escapeCSV(r.过期时间 || ''),
                    escapeCSV(r.宽限期结束 || ''),
                    escapeCSV(r.注册时间 || ''),
                    escapeCSV(getAddressByMode(r)),
                    escapeCSV(`https://app.ens.domains/${r.域名}`)
                ];
                if (showSequenceColumn) {
                    row.unshift(escapeCSV(r.序号));
                }
                csv += row.join(',') + '\n';
            });

            const blob = new Blob(['\uFEFF' + csv], {type:'text/csv;charset=utf-8;'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);

            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');

            const timestamp = `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
            const langSuffix = currentLang === 'zh' ? 'zh' : 'en';

            link.download = `ens_${timestamp}_${langSuffix}.csv`;
            link.click();

            addLog(translations[currentLang].logExport.replace('{count}', data.length), 'success');
        }

        function clearDomains() {
            document.getElementById('domainsText').value = '';
            updateDomainsCount();
            addLog(translations[currentLang].logClear || '已清空', 'info');
        }

        function validateDomains() {
            const textarea = document.getElementById('domainsText');
            textarea.style.borderColor = 'var(--success)';
            setTimeout(() => {
                textarea.style.borderColor = '';
            }, 500);
            addLog(translations[currentLang].logValidate || '验证域名格式', 'info');
        }

        // 用户相关函数 - 已移至 index.html 中的 handleLogin/handleRegisterSubmit
        // 这些函数保留仅作为兼容，实际不再使用
        function registerUser() {
            console.warn('registerUser is deprecated, use handleRegisterSubmit instead');
        }

        function loginUser() {
            console.warn('loginUser is deprecated, use handleLogin instead');
        }

        function logoutUser() {
            if (!isLoggedIn) {
                alert(currentLang === 'zh' ? '当前未登录' : 'Not logged in');
                return;
            }

            const username = currentUser;
            currentUser = null;
            isLoggedIn = false;
            updateUserStatus();
            addLog(currentLang === 'zh' ? `用户 ${username} 已退出` : `User ${username} logged out`, 'info');
        }

        let currentUser = localStorage.getItem('ens-current-user');
        let isLoggedIn = localStorage.getItem('ens-is-logged-in') === 'true';

        function syncCardKeyVisibility() {
            const cardKeyEl = document.getElementById('cardKey');
            const hideEl = document.getElementById('hideCardKey');
            if (!cardKeyEl || !hideEl) return;
            cardKeyEl.type = hideEl.checked ? 'password' : 'text';
            localStorage.setItem(CARD_KEY_HIDE_KEY, hideEl.checked ? 'true' : 'false');
        }

        function updateCardKeyStatus() {
            const cardKeyStatusEl = document.getElementById('cardKeyStatus');
            if (!cardKeyStatusEl) return;
            const currentCardKey = document.getElementById('cardKey')?.value.trim() || '';
            const isActive = !!currentCardKey;
            cardKeyStatusEl.textContent = isActive
                ? (currentLang === 'zh' ? '已激活' : 'Activated')
                : (currentLang === 'zh' ? '未激活' : 'Inactive');
            cardKeyStatusEl.className = `status-value ${isActive ? 'card-active' : 'logged-out'}`;
        }

        function handleCardKeyOptionsChange() {
            const rememberEl = document.getElementById('rememberCardKey');
            const cardKeyEl = document.getElementById('cardKey');
            if (rememberEl) {
                localStorage.setItem(CARD_KEY_REMEMBER_KEY, rememberEl.checked ? 'true' : 'false');
                if (!rememberEl.checked) {
                    localStorage.removeItem(CARD_KEY_STORAGE_KEY);
                } else if (cardKeyEl?.value.trim()) {
                    localStorage.setItem(CARD_KEY_STORAGE_KEY, cardKeyEl.value.trim());
                }
            }
            syncCardKeyVisibility();
            updateCardKeyStatus();
        }

        function activateCardKey() {
            const cardKeyEl = document.getElementById('cardKey');
            const rememberEl = document.getElementById('rememberCardKey');
            const cardKey = cardKeyEl?.value.trim() || '';
            if (!cardKey) {
                alert(currentLang === 'zh' ? '请输入卡密' : 'Please enter the access code');
                return;
            }
            if (rememberEl?.checked) {
                localStorage.setItem(CARD_KEY_STORAGE_KEY, cardKey);
            }
            updateCardKeyStatus();
            addLog(currentLang === 'zh' ? '卡密已激活并保存到当前页面状态' : 'Access code activated for current session', 'success');
        }

        function initCardKeySettings() {
            const rememberEl = document.getElementById('rememberCardKey');
            const hideEl = document.getElementById('hideCardKey');
            const cardKeyEl = document.getElementById('cardKey');
            if (!rememberEl || !hideEl || !cardKeyEl) return;

            const rememberSaved = localStorage.getItem(CARD_KEY_REMEMBER_KEY) === 'true';
            const hideSaved = localStorage.getItem(CARD_KEY_HIDE_KEY);
            const cardKeySaved = localStorage.getItem(CARD_KEY_STORAGE_KEY) || '';

            rememberEl.checked = rememberSaved;
            hideEl.checked = hideSaved !== 'false';
            cardKeyEl.value = rememberSaved ? cardKeySaved : '';
            syncCardKeyVisibility();
            updateCardKeyStatus();
        }

        function updateUserStatus() {
            const loginStatusEl = document.getElementById('loginStatus');
            const currentUserEl = document.getElementById('currentUser');

            if (isLoggedIn && currentUser) {
                loginStatusEl.textContent = currentLang === 'zh' ? '已登录' : 'Logged in';
                loginStatusEl.className = 'status-value logged-in';
                currentUserEl.textContent = currentUser;
                localStorage.setItem('ens-current-user', currentUser);
                localStorage.setItem('ens-is-logged-in', 'true');
            } else {
                loginStatusEl.textContent = currentLang === 'zh' ? '未登录' : 'Not logged in';
                loginStatusEl.className = 'status-value logged-out';
                currentUserEl.textContent = '-';
                localStorage.removeItem('ens-current-user');
                localStorage.setItem('ens-is-logged-in', 'false');
            }
            updateCardKeyStatus();
        }



        function resetRpcRunQueryCount() {
            Object.keys(rpcStatus || {}).forEach(rpc => {
                if (rpcStatus[rpc]) rpcStatus[rpc].runQueryCount = 0;
            });
            updateRpcStatusModal();
            updateRpcList();
        }

        let rpcStatusModalUpdateAt = 0;
        function markRpcDomainQuery(rpc) {
            if (!rpc || !rpcStatus[rpc]) return;
            rpcStatus[rpc].runQueryCount = (rpcStatus[rpc].runQueryCount || 0) + 1;
            const modal = document.getElementById('rpcStatusModal');
            if (modal && modal.style.display === 'flex') {
                const now = Date.now();
                if (now - rpcStatusModalUpdateAt > 180) {
                    rpcStatusModalUpdateAt = now;
                    updateRpcStatusModal();
                }
            }
        }

        function syncDomainModuleHeight() {
            const rpcModule = document.querySelector('.rpc-module');
            const domainModule = document.querySelector('.domain-input-module');
            if (!rpcModule || !domainModule) return;
            if (window.innerWidth <= 1000) {
                domainModule.style.minHeight = '';
                return;
            }
            domainModule.style.minHeight = `${Math.ceil(rpcModule.offsetHeight)}px`;
        }

        function initThemeSwitcher() {
            const media = window.matchMedia('(prefers-color-scheme: dark)');
            const apply = theme => {
                document.body.classList.remove('dark-theme');
                const shouldUseDark = theme === 'dark' || (theme === 'auto' && media.matches);
                if (shouldUseDark) {
                    document.body.classList.add('dark-theme');
                }
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
                localStorage.setItem('ens-tool-theme', theme);
            };
            const savedTheme = localStorage.getItem('ens-tool-theme') || 'auto';
            apply(savedTheme);
            document.querySelectorAll('.theme-btn').forEach(b => {
                b.addEventListener('click', () => apply(b.dataset.theme));
            });
            const handleChange = () => {
                const theme = localStorage.getItem('ens-tool-theme') || 'auto';
                if (theme === 'auto') apply('auto');
            };
            if (media.addEventListener) media.addEventListener('change', handleChange);
            else if (media.addListener) media.addListener(handleChange);
        }

        document.addEventListener('DOMContentLoaded', () => {
            initRpcStatus();
            initThemeSwitcher();

            switchLanguage(currentLang);

            document.getElementById('domainsText').addEventListener('input', updateDomainsCount);
            document.querySelectorAll('input[name="domainType"]').forEach(el => {
                el.addEventListener('change', updateDomainTypeHint);
            });
            updateDomainTypeHint();
            updateDomainsCount();
            updateUserStatus();
            initCardKeySettings();
            updateRpcList();
            syncDomainModuleHeight();

            const hasSessionData = restoreSessionFromStorage();
            const hasSavedData = hasSessionData || loadResultsFromStorage();
            if (hasSavedData) {
                document.getElementById('exportBtn').disabled = false;
                updateRetryAllButton();
            }

            document.getElementById('domainsText').addEventListener('input', () => scheduleSessionSave());
            ['filterStatus', 'filterPremium', 'filterExpiry', 'filterGrace', 'filterSort', 'filterSearch', 'filterExclude', 'filterLength', 'pageSize'].forEach(id => {
                document.getElementById(id)?.addEventListener('input', () => scheduleSessionSave());
                document.getElementById(id)?.addEventListener('change', () => scheduleSessionSave());
            });
            window.addEventListener('beforeunload', () => scheduleSessionSave(true));

            setTimeout(() => checkAllRpcNodes(), 1000);
            setInterval(() => checkAllRpcNodes(), 300000);

            addLog(translations[currentLang].logReady, 'success');
            addLog(`Timezone: ${getTimeZone()}`, 'info');

            setInterval(updateRpcList, 1000);
            window.addEventListener('resize', () => {
                syncDomainModuleHeight();
                if (filteredResults && filteredResults.length) {
                    updateTable({ preserveScroll: true });
                } else {
                    syncResultsDisplayCount([]);
                }
            });
            syncResultsDisplayCount(filteredResults || []);

            // 回到顶部
            document.getElementById('backToTop').addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        window.onclick = e => {
            if (e.target === document.getElementById('rpcStatusModal')) closeModal();
        };

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeModal();
        });

        // 暴露全局函数
        window.loadDomainType = loadDomainType;
        window.clearDomains = clearDomains;
        window.validateDomains = validateDomains;
        window.startQuery = startQuery;
        window.stopQuery = stopQuery;
        window.cancelQuery = cancelQuery;
        window.resumeQuery = resumeQuery;
        window.applyFilters = applyFilters;
        window.clearFilters = clearFilters;
        window.clearResults = clearResults;
        window.exportToCSV = exportToCSV;
        window.changePageSize = changePageSize;
        window.changePage = changePage;
        window.prevPage = prevPage;
        window.nextPage = nextPage;
        window.goToPage = goToPage;
        window.showRPCStatus = showRPCStatus;
        window.closeModal = closeModal;
        window.filterByAddress = filterByAddress;
        window.filterByStat = filterByStat;
        window.copyText = copyText;
        window.retrySingleDomain = retrySingleDomain;
        window.retryAllFailed = retryAllFailed;
        window.updateRetryAllButton = updateRetryAllButton;
        window.clearAddressSearch = clearAddressSearch;
        window.registerUser = registerUser;
        window.loginUser = loginUser;
        window.logoutUser = logoutUser;
        window.activateCardKey = activateCardKey;
        window.handleCardKeyOptionsChange = handleCardKeyOptionsChange;
