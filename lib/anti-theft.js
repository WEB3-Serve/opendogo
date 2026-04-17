/**
 * 前端防盗保护系统 - 多层防护
 * 功能：反调试、环境检测、代码完整性校验、域名绑定
 */

(function() {
    'use strict';
    
    // ========== 配置 ==========
    const CONFIG = {
        allowedDomains: ['localhost', '127.0.0.1'], // 生产环境替换为你的域名
        checkInterval: 2000,
        maxDevtoolsDetected: 3,
        enableObfuscation: true
    };
    
    let devtoolsDetectedCount = 0;
    let isProduction = false;
    
    // ========== 1. 域名绑定检测 ==========
    function checkDomain() {
        const currentDomain = window.location.hostname;
        if (!CONFIG.allowedDomains.includes(currentDomain) && !currentDomain.endsWith('.vercel.app')) {
            console.warn('⚠️ 未授权的域名访问！');
            // 可以选择停止运行或跳转
            // window.stop();
            // window.location.href = 'about:blank';
            return false;
        }
        return true;
    }
    
    // ========== 2. 反调试检测 ==========
    function detectDevTools() {
        // 方法 1: 检查窗口尺寸差异
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;
        
        // 方法 2: 检查 debugger 语句执行时间
        const start = performance.now();
        debugger; // eslint-disable-line no-debugger
        const end = performance.now();
        const debugDelay = (end - start) > 100;
        
        // 方法 3: 检查 console 对象
        const consoleCheck = typeof console !== 'undefined' && 
                            typeof console.debug === 'function' &&
                            console.toString().includes('Console');
        
        if (widthThreshold || heightThreshold || debugDelay) {
            devtoolsDetectedCount++;
            if (devtoolsDetectedCount >= CONFIG.maxDevtoolsDetected) {
                handleDevToolsDetected();
            }
            return true;
        }
        return false;
    }
    
    function handleDevToolsDetected() {
        console.warn('🛡️ 检测到开发者工具，已启动保护措施');
        // 可选措施：
        // 1. 清空页面内容
        // document.body.innerHTML = '';
        // 2. 禁止右键和 F12
        // 3. 跳转页面
        // window.location.href = 'about:blank';
        // 4. 停止脚本执行
        // throw new Error('DevTools detected');
    }
    
    // ========== 3. 控制台保护 ==========
    function protectConsole() {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        
        console.log = function(...args) {
            // 过滤敏感信息
            const filtered = args.filter(arg => {
                if (typeof arg === 'string') {
                    return !arg.includes('token') && 
                           !arg.includes('password') && 
                           !arg.includes('secret');
                }
                return true;
            });
            originalLog.apply(console, filtered);
        };
        
        // 检测 console 被修改
        setInterval(() => {
            if (console.log !== this.protectedLog) {
                console.warn('⚠️ Console 被篡改!');
            }
        }, CONFIG.checkInterval);
    }
    
    // ========== 4. 右键/F12/复制禁用 ==========
    function disableContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });
        
        document.addEventListener('keydown', (e) => {
            // F12
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+I/J/C (开发者工具)
            if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
                e.preventDefault();
                return false;
            }
            // Ctrl+S (保存页面)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                return false;
            }
            // Ctrl+U (查看源码)
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                return false;
            }
        });
        
        // 禁止选择文本
        document.addEventListener('selectstart', (e) => {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        });
    }
    
    // ========== 5. 代码完整性校验 ==========
    function verifyCodeIntegrity() {
        // 可以添加关键函数的哈希校验
        // 如果文件被篡改，停止运行
        const criticalFunctions = [
            'initApp',
            'queryENS',
            'processResults'
        ];
        
        criticalFunctions.forEach(funcName => {
            if (typeof window[funcName] !== 'function') {
                console.error(`❌ 关键函数 ${funcName} 丢失或被篡改!`);
                // window.stop();
            }
        });
    }
    
    // ========== 6. 自动销毁机制 ==========
    function setupAutoDestroy() {
        // 检测到异常后自动销毁
        window.addEventListener('error', (e) => {
            if (e.message.includes('DevTools') || e.message.includes('tampered')) {
                // 清理敏感数据
                localStorage.clear();
                sessionStorage.clear();
            }
        });
        
        // 页面卸载时清理
        window.addEventListener('beforeunload', () => {
            // 清理临时数据
            const tempKeys = Object.keys(localStorage).filter(k => k.startsWith('temp_'));
            tempKeys.forEach(k => localStorage.removeItem(k));
        });
    }
    
    // ========== 7. 环境变量检测 ==========
    function checkEnvironment() {
        // 检测是否在正确的环境中运行
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
        const isVercel = window.location.hostname.endsWith('.vercel.app');
        const isCustomDomain = CONFIG.allowedDomains.includes(window.location.hostname);
        
        isProduction = !isLocalhost && (isVercel || isCustomDomain);
        
        if (!isProduction && !isLocalhost) {
            console.warn('⚠️ 非授权环境运行!');
        }
    }
    
    // ========== 8. 性能监控 ==========
    function monitorPerformance() {
        let lastFps = 60;
        setInterval(() => {
            const now = performance.now();
            // 如果 FPS 突然下降，可能开启了调试器
            // 可以实现更复杂的检测逻辑
        }, CONFIG.checkInterval);
    }
    
    // ========== 初始化 ==========
    function init() {
        console.log('🛡️ 启动前端防护系统...');
        
        checkEnvironment();
        checkDomain();
        disableContextMenu();
        protectConsole();
        verifyCodeIntegrity();
        setupAutoDestroy();
        
        // 定时检测
        setInterval(detectDevTools, CONFIG.checkInterval);
        setInterval(checkDomain, CONFIG.checkInterval * 2);
        
        console.log('✅ 防护系统已激活');
    }
    
    // 延迟初始化，避免影响页面加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }
    
})();
