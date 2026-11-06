// ==UserScript==
// @name         B站 PDD + 充电视频监控提醒 (极速低耗版)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  事件驱动,极速拦截,超低占用,主动请求API检测PDD广告与充电专属视频；弹窗1分钟无操作自动关页，失败则强制暂停
// @author       江小白
// @match        https://www.bilibili.com/video/*
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @grant        unsafeWindow
// @connect      api.bilibili.com
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const W = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

    // ============ 配置 ============
    const DEBUG          = false;
    const CHECK_INTERVAL = 10 * 60 * 1000; // 常驻兜底检测降至 10 分钟，降低后台占用
    const PATTERN        = /点击[\s\S]{0,30}?解锁[\s\S]{0,30}?(?:全集|福利)/;
    const OVERLAY_ID     = 'pdd-alert-overlay';
    const AD_URL_RE      = /gaoneng\.bilibili\.com|snssdk\.com|b23\.tv\/cm-/i;
    const AD_JUMP_RE     = /tetris\/page|adtype=XST_CPC/i;
    const NAV_URL        = 'https://api.bilibili.com/x/web-interface/nav';
    const COMMENT_URL    = 'https://api.bilibili.com/x/v2/reply/wbi/main?';
    const PLAYER_URL     = 'https://api.bilibili.com/x/player/wbi/v2?';
    const VIEW_URL       = 'https://api.bilibili.com/x/web-interface/view?';
    const AUTO_CLOSE_MS  = 60 * 1000; // 弹窗 1 分钟无操作自动处理

    // 惰性日志
    const log  = DEBUG ? console.log.bind(console, '[PDD监控]') : () => {};
    const warn = DEBUG ? console.warn.bind(console, '[PDD监控]') : () => {};

    // ============ 单例与状态 ============
    if (W.__PDD_MONITOR__ && W.__PDD_MONITOR__.inited) return;
    const state = W.__PDD_MONITOR__ = {
        inited: true,
        stopped: false,
        alerted: false,
        timers: new Map(),
        mixinKey: null,
        mixinKeyTime: 0,
        cachedOid: null,
        cachedCid: null,
        currentBvid: '',
        checkingBvid: '', // 用于防抖去重
        navPromise: null,
        observer: null,
        autoCloseTimer: null // 弹窗无操作自动处理定时器
    };

    // ============ 定时器管理 ============
    const setT = (fn, ms) => { const id = setTimeout(fn, ms); state.timers.set(id, 't'); return id; };
    const setI = (fn, ms) => { const id = setInterval(fn, ms); state.timers.set(id, 'i'); return id; };
    const clearT = clearTimeout;
    const clearI = clearInterval;
    const clearAllTimers = () => {
        for (const [id, type] of state.timers) {
            if (type === 't') clearT(id);
            else if (type === 'i') clearI(id);
        }
        state.timers.clear();
    };

    // ============ MD5 ============
    const md5 = (function () {
        const HEX = '0123456789abcdef';
        function safeAdd(x, y) { const lsw = (x & 0xffff) + (y & 0xffff); return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xffff); }
        const rot = (n, c) => (n << c) | (n >>> (32 - c));
        const cmn = (q, a, b, x, s, t) => safeAdd(rot(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
        const ff = (a,b,c,d,x,s,t) => cmn((b & c) | (~b & d), a, b, x, s, t);
        const gg = (a,b,c,d,x,s,t) => cmn((b & d) | (c & ~d), a, b, x, s, t);
        const hh = (a,b,c,d,x,s,t) => cmn(b ^ c ^ d, a, b, x, s, t);
        const ii = (a,b,c,d,x,s,t) => cmn(c ^ (b | ~d), a, b, x, s, t);

        function binlMD5(x, len) {
            x[len >> 5] |= 0x80 << (len % 32);
            x[(((len + 64) >>> 9) << 4) + 14] = len;
            let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
            for (let i = 0; i < x.length; i += 16) {
                const oa = a, ob = b, oc = c, od = d;
                a=ff(a,b,c,d,x[i],7,-680876936);   d=ff(d,a,b,c,x[i+1],12,-389564586);
                c=ff(c,d,a,b,x[i+2],17,606105819); b=ff(b,c,d,a,x[i+3],22,-1044525330);
                a=ff(a,b,c,d,x[i+4],7,-176418897); d=ff(d,a,b,c,x[i+5],12,1200080426);
                c=ff(c,d,a,b,x[i+6],17,-1473231341);b=ff(b,c,d,a,x[i+7],22,-45705983);
                a=ff(a,b,c,d,x[i+8],7,1770035416); d=ff(d,a,b,c,x[i+9],12,-1958414417);
                c=ff(c,d,a,b,x[i+10],17,-42063);   b=ff(b,c,d,a,x[i+11],22,-1990404162);
                a=ff(a,b,c,d,x[i+12],7,1804603682);d=ff(d,a,b,c,x[i+13],12,-40341101);
                c=ff(c,d,a,b,x[i+14],17,-1502002290);b=ff(b,c,d,a,x[i+15],22,1236535329);
                a=gg(a,b,c,d,x[i+1],5,-165796510); d=gg(d,a,b,c,x[i+6],9,-1069501632);
                c=gg(c,d,a,b,x[i+11],14,643717713);b=gg(b,c,d,a,x[i],20,-373897302);
                a=gg(a,b,c,d,x[i+5],5,-701558691); d=gg(d,a,b,c,x[i+10],9,38016083);
                c=gg(c,d,a,b,x[i+15],14,-660478335);b=gg(b,c,d,a,x[i+4],20,-405537848);
                a=gg(a,b,c,d,x[i+9],5,568446438);  d=gg(d,a,b,c,x[i+14],9,-1019803690);
                c=gg(c,d,a,b,x[i+3],14,-187363961);b=gg(b,c,d,a,x[i+8],20,1163531501);
                a=gg(a,b,c,d,x[i+13],5,-1444681467);d=gg(d,a,b,c,x[i+2],9,-51403784);
                c=gg(c,d,a,b,x[i+7],14,1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);
                a=hh(a,b,c,d,x[i+5],4,-378558);    d=hh(d,a,b,c,x[i+8],11,-2022574463);
                c=hh(c,d,a,b,x[i+11],16,1839030562);b=hh(b,c,d,a,x[i+14],23,-35309556);
                a=hh(a,b,c,d,x[i+1],4,-1530992060);d=hh(d,a,b,c,x[i+4],11,1272893353);
                c=hh(c,d,a,b,x[i+7],16,-155497632);b=hh(b,c,d,a,x[i+10],23,-1094730640);
                a=hh(a,b,c,d,x[i+13],4,681279174); d=hh(d,a,b,c,x[i],11,-358537222);
                c=hh(c,d,a,b,x[i+3],16,-722521979);b=hh(b,c,d,a,x[i+6],23,76029189);
                a=hh(a,b,c,d,x[i+9],4,-640364487); d=hh(d,a,b,c,x[i+12],11,-421815835);
                c=hh(c,d,a,b,x[i+15],16,530742520);b=hh(b,c,d,a,x[i+2],23,-995338651);
                a=ii(a,b,c,d,x[i],6,-198630844);   d=ii(d,a,b,c,x[i+7],10,1126891415);
                c=ii(c,d,a,b,x[i+14],15,-1416354905);b=ii(b,c,d,a,x[i+5],21,-57434055);
                a=ii(a,b,c,d,x[i+12],6,1700485571);d=ii(d,a,b,c,x[i+3],10,-1894986606);
                c=ii(c,d,a,b,x[i+10],15,-1051523); b=ii(b,c,d,a,x[i+1],21,-2054922799);
                a=ii(a,b,c,d,x[i+8],6,1873313359); d=ii(d,a,b,c,x[i+15],10,-30611744);
                c=ii(c,d,a,b,x[i+6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21,1309151649);
                a=ii(a,b,c,d,x[i+4],6,-145523070); d=ii(d,a,b,c,x[i+11],10,-1120210379);
                c=ii(c,d,a,b,x[i+2],15,718787259); b=ii(b,c,d,a,x[i+9],21,-343485551);
                a=safeAdd(a,oa);b=safeAdd(b,ob);c=safeAdd(c,oc);d=safeAdd(d,od);
            }
            return [a, b, c, d];
        }
        function binl2hex(input) {
            let out = '';
            for (let i = 0; i < input.length * 32; i += 8) {
                const byte = (input[i >> 5] >>> (i % 32)) & 0xff;
                out += HEX[(byte >>> 4) & 0x0f] + HEX[byte & 0x0f];
            }
            return out;
        }
        function rstr2binl(input) {
            const out = new Array((input.length >> 2) + 1).fill(0);
            for (let i = 0; i < input.length * 8; i += 8)
                out[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << (i % 32);
            return out;
        }
        return function (s) {
            const utf8 = unescape(encodeURIComponent(s));
            return binl2hex(binlMD5(rstr2binl(utf8), utf8.length * 8));
        };
    })();

    // ============ wbi 签名 ============
    const mixinKeyEncTab = [
        46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35,
        27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13,
        37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4,
        22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52
    ];
    const keyFromUrl = (u) => u ? u.substring(u.lastIndexOf('/') + 1).split('.')[0] : '';
    const genMixinKey = (a, b) => {
        const s = a + b;
        let out = '';
        for (let i = 0; i < 32; i++) out += s[mixinKeyEncTab[i]];
        return out;
    };

    function fetchMixinKey() {
        const now = Date.now();
        if (state.mixinKey && now - state.mixinKeyTime < 10 * 60 * 1000) {
            return Promise.resolve(state.mixinKey);
        }
        if (state.navPromise) return state.navPromise;
        state.navPromise = new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: NAV_URL,
                withCredentials: true,
                timeout: 10000,
                onload: (resp) => {
                    state.navPromise = null;
                    try {
                        const wbi = JSON.parse(resp.responseText)?.data?.wbi_img;
                        if (!wbi) return reject(new Error('nav 无 wbi_img'));
                        state.mixinKey = genMixinKey(keyFromUrl(wbi.img_url), keyFromUrl(wbi.sub_url));
                        state.mixinKeyTime = Date.now();
                        resolve(state.mixinKey);
                    } catch (e) { reject(e); }
                },
                onerror: (e) => { state.navPromise = null; reject(e); },
                ontimeout: () => { state.navPromise = null; reject(new Error('nav 超时')); }
            });
        });
        return state.navPromise;
    }

    function encWbi(params, mixinKey) {
        const wts = Math.round(Date.now() / 1000);
        params.wts = wts;
        const keys = Object.keys(params).sort();
        const parts = new Array(keys.length);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            const v = String(params[k]).replace(/[!'()*]/g, '');
            parts[i] = `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
        }
        const query = parts.join('&');
        return `${query}&w_rid=${md5(query + mixinKey)}`;
    }

    // ============ GM 请求 ============
    function gmGet(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                withCredentials: true,
                timeout: 15000,
                headers: { 'Referer': 'https://www.bilibili.com/', 'Origin': 'https://www.bilibili.com' },
                onload: (r) => resolve(r.responseText),
                onerror: reject,
                ontimeout: () => reject(new Error('请求超时'))
            });
        });
    }

    // ============ 核心：极速获取 ID（内存 -> URL API -> 前端 DOM 提取） ============
    async function getVideoIds(bvid) {
        // 1. 尝试从内存缓存直接秒取
        const vd = W.__INITIAL_STATE__?.videoData;
        if (vd && vd.bvid === bvid && vd.aid && vd.cid) {
            return { oid: String(vd.aid), cid: String(vd.cid) };
        }
        
        // 2. 内存没命中，直接携带 bvid 请求官方 API (极速)
        try {
            const text = await gmGet(VIEW_URL + 'bvid=' + bvid);
            const json = JSON.parse(text);
            if (json.code === 0 && json.data) {
                return { oid: String(json.data.aid), cid: String(json.data.cid) };
            }
        } catch (e) {
            warn('API 获取 ID 失败', e);
        }
        return null;
    }

    // ============ PDD 检测 ============
    function isPddComment(json) {
        const data = json && json.data;
        if (!data) return false;
        const checkItem = (item) => {
            if (!item) return false;
            const jumps = item.content && item.content.jump_url;
            if (jumps) {
                for (const u in jumps) {
                    const info = jumps[u];
                    if (!info) continue;
                    const extra = info.extra || {};
                    if ((extra.is_ad_loc === true || extra.is_ad === 1 || extra.card_type === 99) &&
                        (AD_URL_RE.test(u) || AD_URL_RE.test(info.pc_url || ''))) return true;
                    if (AD_JUMP_RE.test(info.pc_url || '')) return true;
                    if (info.title && PATTERN.test(info.title)) return true;
                }
            }
            const msg = (item.content && item.content.message) || '';
            return msg ? PATTERN.test(msg) : false;
        };
        if (checkItem(data.top && data.top.upper)) return true;
        const topReplies = data.top_replies;
        if (topReplies) for (let i = 0; i < topReplies.length; i++) if (checkItem(topReplies[i])) return true;
        const replies = data.replies;
        if (replies) for (let i = 0; i < replies.length; i++) if (checkItem(replies[i])) return true;
        return false;
    }

    // ============ 请求执行检测 ============
    async function runChecks(oid, cid, bvid) {
        if (state.stopped || state.alerted || state.checkingBvid === bvid) return;
        state.checkingBvid = bvid;

        try {
            const mixinKey = await fetchMixinKey();
            
            // 并行请求：评论 和 充电检测
            Promise.allSettled([
                (async () => {
                    const qs = encWbi({ oid, type: '1', mode: '3', pagination_str: '{"offset":""}', plat: '1', web_location: '1315875' }, mixinKey);
                    const text = await gmGet(COMMENT_URL + qs);
                    const json = JSON.parse(text);
                    if (json.code === 0 && isPddComment(json)) {
                        triggerAlert('pdd');
                    }
                })(),
                (async () => {
                    const qs = encWbi({ aid: oid, cid: cid }, mixinKey);
                    const text = await gmGet(PLAYER_URL + qs);
                    const json = JSON.parse(text);
                    if (json.code === 0 && json.data?.is_upower_exclusive === true) {
                        triggerAlert('charge');
                    }
                })()
            ]);
        } catch (e) {
            warn('检测执行出错:', e);
        }
    }

    // ============ 强制暂停视频播放 ============
    function forcePauseVideo() {
        try {
            const videos = document.querySelectorAll('video');
            let paused = false;
            for (const v of videos) {
                if (!v.paused) {
                    try { v.pause(); paused = true; } catch {}
                }
            }
            // 尝试调用 B 站播放器 API 暂停
            try {
                const player = W.player || document.querySelector('#bilibili-player')?.__vue__;
                if (player && typeof player.pause === 'function') {
                    player.pause();
                    paused = true;
                }
            } catch {}
            // 兜底：点击播放器暂停按钮
            if (!paused) {
                const btn = document.querySelector('.bpx-player-ctrl-play, .bilibili-player-video-btn-start');
                if (btn) { try { btn.click(); } catch {} }
            }
          try { window.close(); } catch {}
            return paused || videos.length > 0;
        } catch (e) {
            warn('强制暂停失败', e);
            return false;
        }
    }

    // ============ 弹窗 ============
    function showAlert(reason) {
        if (state.alerted || document.getElementById(OVERLAY_ID)) return;
        if (!document.body) { setT(() => showAlert(reason), 200); return; }
        state.alerted = true;

        // 全屏适配：把弹窗挂到全屏元素内部，否则全屏层会盖住普通 DOM
        const fsEl = document.fullscreenElement
            || document.webkitFullscreenElement
            || document.mozFullScreenElement
            || document.msFullscreenElement;

        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:-apple-system,"Microsoft YaHei",sans-serif;';

        const dialog = document.createElement('div');
        dialog.style.cssText = 'background:#fff;border-radius:12px;padding:28px 32px;min-width:320px;max-width:80vw;box-shadow:0 12px 40px rgba(0,0,0,.3);text-align:center;';
        const msg = document.createElement('div');
        msg.textContent = reason === 'charge' ? '此视频是充电专属视频,是否关闭网页?' : '此视频是 pdd,是否关闭网页?';
        msg.style.cssText = 'font-size:18px;color:#222;margin-bottom:22px;font-weight:600;';

        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;gap:12px;justify-content:center;';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭网页';
        closeBtn.style.cssText = 'padding:8px 20px;font-size:14px;border:none;border-radius:6px;background:#fb7299;color:#fff;cursor:pointer;';
        closeBtn.onclick = () => {
            clearAutoCloseTimer();
            // 先退出全屏再关窗，避免全屏元素残留
            exitFullscreenSafe();
            window.close();
            setTimeout(() => {
                try { window.open('', '_self'); window.close(); } catch {}
                document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-size:20px;color:#666;">页面已关闭</div>';
            }, 100);
        };

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        cancelBtn.style.cssText = 'padding:8px 20px;font-size:14px;border:1px solid #ccc;border-radius:6px;background:#f5f5f5;color:#333;cursor:pointer;';
        cancelBtn.onclick = () => {
            clearAutoCloseTimer();
            overlay.remove();
            state.alerted = false;
        };

        wrap.appendChild(closeBtn);
        wrap.appendChild(cancelBtn);
        dialog.appendChild(msg);
        dialog.appendChild(wrap);
        overlay.appendChild(dialog);

        // 关键：挂到全屏元素内部；没有全屏则挂 body
        const mountTarget = fsEl || document.body;
        if (fsEl) {
            overlay.style.position = 'fixed';
        }
        mountTarget.appendChild(overlay);

        // ============ 新增：1 分钟无操作自动处理 ============
        clearAutoCloseTimer();
        state.autoCloseTimer = setTimeout(() => {
            state.autoCloseTimer = null;
            // 弹窗可能已被用户处理，二次确认
            if (!document.getElementById(OVERLAY_ID) || state.stopped) return;

            log('弹窗 1 分钟无操作，尝试自动关闭网页');
            // 先退出全屏，避免全屏阻止关闭
            exitFullscreenSafe();
            try { window.close(); } catch {}

            // 再尝试通过 window.open 自关（部分浏览器需要）
            setTimeout(() => {
                if (document.getElementById(OVERLAY_ID)) {
                    try { window.open('', '_self'); window.close(); } catch {}
                }
                // 如果仍未关闭，强制暂停视频播放
                setTimeout(() => {
                    if (document.getElementById(OVERLAY_ID)) {
                        log('自动关闭失败，强制暂停视频');
                        forcePauseVideo();
                    }
                }, 300);
            }, 200);
        }, AUTO_CLOSE_MS);
    }

    function clearAutoCloseTimer() {
        if (state.autoCloseTimer) {
            clearTimeout(state.autoCloseTimer);
            state.autoCloseTimer = null;
        }
    }

    // 安全退出全屏（兼容各浏览器）
    function exitFullscreenSafe() {
        try {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
        } catch {}
    }

    function triggerAlert(reason) {
        if (state.stopped || state.alerted) return;
        showAlert(reason);
        clearAllTimers(); // 命中立刻清理定时器释放资源
    }

    // ============ 核心逻辑：处理视频切换 ============
    let debounceTimer = null;
    async function handleVideoChange(forcedBvid = null) {
        if (state.stopped) return;
        
        // 提取 BV 号，优先用传进来的，其次从 URL 拿
        const match = location.href.match(/\/video\/(BV[a-zA-Z0-9]+)/i);
        const bvid = forcedBvid || (match ? match[1] : null);
        
        // 相同视频忽略，防止 B站 内部频繁修改 URL 参数导致重复触发
        if (!bvid || bvid === state.currentBvid) return;

        // 防抖，防止状态极速跳变
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            if (state.alerted) {
                // 如果之前被拦截了，现在切了新视频，需要复活
                state.alerted = false;
                clearAutoCloseTimer();
                const old = document.getElementById(OVERLAY_ID);
                if (old) old.remove();
            }

            log('开始处理新视频:', bvid);
            state.currentBvid = bvid;
            state.checkingBvid = ''; // 重置去重锁

            // 获取最新 ID 并执行检测
            const ids = await getVideoIds(bvid);
            if (ids && state.currentBvid === bvid) {
                runChecks(ids.oid, ids.cid, bvid);
            }
        }, 300); // 300ms 防抖
    }

    // ============ 启动与监听 ============
    function start() {
        // 1) 页面初始加载时，抓取一次
        handleVideoChange();

        // 2) 原生路由劫持 (触发反应最快)
        const origPush = W.history.pushState;
        const origReplace = W.history.replaceState;
        W.history.pushState = function (...a) { const r = origPush.apply(this, a); handleVideoChange(); return r; };
        W.history.replaceState = function (...a) { const r = origReplace.apply(this, a); handleVideoChange(); return r; };
        
        W.addEventListener('popstate', () => handleVideoChange());
        W.addEventListener('hashchange', () => handleVideoChange());

        // 3) MutationObserver 监听 <title> 变化 (解决 B站 偷改路由不触发 API 的问题)
        const titleEl = document.querySelector('title');
        if (titleEl) {
            state.observer = new MutationObserver(() => { handleVideoChange(); });
            state.observer.observe(titleEl, { childList: true });
        }

        // 4) 极低频兜底 (10分钟一次，防止浏览器休眠或者 API 漏抓)
        setI(() => {
            if (!state.stopped && !state.alerted) {
                handleVideoChange(state.currentBvid); // 强制重新检测当前视频
            }
        }, CHECK_INTERVAL);
    }

    state.destroy = function () {
        clearAllTimers();
        clearAutoCloseTimer();
        clearTimeout(debounceTimer);
        if (state.observer) state.observer.disconnect();
        const old = document.getElementById(OVERLAY_ID);
        if (old) old.remove();
        state.inited = false;
        state.alerted = false;
        state.stopped = false;
        console.log('[PDD监控] 已销毁');
    };

    start();
    log('初始化完成(v11.1 极速低耗版 + 自动关页/暂停)');
})();