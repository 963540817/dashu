// ==UserScript==
// @name         手机腾讯选集
// @version      963540817
// @description  无聊折腾好玩的，能不能用不清楚
// @author       Assistant
// @noframes
// @match        *://m.v.qq.com/*
// @grant        GM_xmlhttpRequest
// @connect      pbaccess.video.qq.com
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    if (window.top !== window.self) return;
    if (window.__tmQQEpisodeRunning) return;
    window.__tmQQEpisodeRunning = true;

    // ========== 请求封装 ==========
    const HAS_GM = typeof GM_xmlhttpRequest === 'function';

    // 缓存：同一 cid 的结果只请求一次
    const episodeCache = new Map();

    function request(ch, payload, done) {
        const body = JSON.stringify(payload);
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'Origin': 'https://v.qq.com',
            'Referer': 'https://v.qq.com/'
        };

        if (HAS_GM) {
            GM_xmlhttpRequest({
                method: 'POST',
                url: ch.apiUrl,
                headers: Object.assign({
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                }, headers),
                data: body,
                onload: function(response) { parseResponse(response.responseText, done); },
                onerror: function() { done(null); }
            });
        } else {
            fetch(ch.apiUrl, {
                method: 'POST', headers, body,
                mode: 'cors', credentials: 'omit'
            }).then(res => res.text()).then(text => parseResponse(text, done)).catch(() => done(null));
        }
    }

    function parseResponse(text, done) {
        try {
            const data = JSON.parse(text);
            if (data.ret !== 0 || !data.data || !Array.isArray(data.data.CardList)) {
                done(null);
            } else {
                done(data.data);
            }
        } catch (e) {
            done(null);
        }
    }

    // ========== 工具函数（正则预编译，复用） ==========
    const RE_PURE_NUM = /^\d+$/;
    const RE_EPISODE = /^第\d+(集|期)/;
    const RE_EPISODE_NUM = /第(\d+)(集|期)/;
    const RE_SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;
    const RE_PLAY_PAGE = /^https?:\/\/m\.v\.qq\.com\/x\/m\/play/;
    const EXTRA_KEYWORDS = ['预告', '特辑', '剧场版', '客栈', '花絮', '彩蛋', '抢先看', '前瞻', '回顾', 'PV', 'MV', '定档'];

    function makeGuid() {
        let s = '';
        for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 16).toString(16);
        return s;
    }

    function isSafeId(v) {
        return typeof v === 'string' && RE_SAFE_ID.test(v);
    }

    function rangeComplete(episodes, begin, end) {
        let count = 0;
        const len = episodes.length;
        for (let i = 0; i < len; i++) {
            const n = episodes[i].num;
            if (n >= begin && n <= end) count++;
        }
        return count === (end - begin + 1);
    }

    function isMainEpisode(title) {
        if (!title) return false;
        return RE_PURE_NUM.test(title) || RE_EPISODE.test(title);
    }

    function isExtraContent(title) {
        if (!title) return false;
        for (let i = 0; i < EXTRA_KEYWORDS.length; i++) {
            if (title.indexOf(EXTRA_KEYWORDS[i]) !== -1) return true;
        }
        return false;
    }

    function extractEpisodeNumber(title) {
        if (!title) return 999999;
        if (RE_PURE_NUM.test(title)) return parseInt(title, 10);
        const match = title.match(RE_EPISODE_NUM);
        return match ? parseInt(match[1], 10) : 999999;
    }

    function partWeight(title) {
        if (title.indexOf('加更上') !== -1) return 4;
        if (title.indexOf('加更下') !== -1) return 5;
        if (title.indexOf('（上）') !== -1) return 1;
        if (title.indexOf('（中）') !== -1) return 2;
        if (title.indexOf('（下）') !== -1) return 3;
        if (title.indexOf('上') !== -1) return 1;
        if (title.indexOf('中') !== -1) return 2;
        if (title.indexOf('下') !== -1) return 3;
        return 0;
    }

    // ========== 收集卡片（迭代式遍历，避免递归栈） ==========
    function collectCards(root, cid, episodes, seen) {
        const stack = [root];
        while (stack.length > 0) {
            const node = stack.pop();
            if (!node || typeof node !== 'object') continue;

            if (Array.isArray(node)) {
                for (let i = 0; i < node.length; i++) stack.push(node[i]);
                continue;
            }

            // 分集卡片
            if ((node.type === 'pc_web_episode_list' || node.type === 'pc_detail_ep_list') && node.params) {
                const params = node.params;
                const vid = typeof params.vid === 'string' ? params.vid.trim() : '';
                const rawTitle = (params.c_title_output ?? params.title ?? '').toString().trim();
                if (isSafeId(vid) && rawTitle && !seen.has(vid)) {
                    if (isMainEpisode(rawTitle) && !isExtraContent(rawTitle)) {
                        seen.add(vid);
                        episodes.push({ num: 0, title: rawTitle, vid: vid, isTrailer: params.is_trailer === '1' });
                    }
                }
            }

            // 兜底：id 即 vid
            if (node.id && typeof node.id === 'string' && isSafeId(node.id) && node.params) {
                const params = node.params;
                const rawTitle = (params.c_title_output ?? params.title ?? '').toString().trim();
                if (rawTitle && !seen.has(node.id)) {
                    if (isMainEpisode(rawTitle) && !isExtraContent(rawTitle)) {
                        seen.add(node.id);
                        episodes.push({ num: 0, title: rawTitle, vid: node.id, isTrailer: params.is_trailer === '1' });
                    }
                }
            }

            for (const key in node) {
                const v = node[key];
                if (v && typeof v === 'object') stack.push(v);
            }
        }
    }

    // ========== 获取集数 ==========
    function fetchEpisodes(cid, currentVid, callback) {
        // 缓存命中
        if (episodeCache.has(cid)) {
            callback(episodeCache.get(cid));
            return;
        }

        const guid = makeGuid();
        const apiUrl = `https://pbaccess.video.qq.com/trpc.vector_layout.page_view.PageService/getPage?vdevice_guid=${guid}&video_appid=3000010&vversion_name=8.5.96&vversion_platform=2`;

        const pageParams = {
            ad_wechat_authorization_status: '0', req_from: 'web_vsite',
            ad_exp_ids: '', pc_sdk_version: '', pc_oaid: '',
            new_mark_label_enabled: '1', pc_device_info: '',
            support_pc_yyb_mobile_app_engine: '0', pc_wegame_version: '',
            cid: cid, history_vid: '', vid: currentVid || '',
            is_pc_new_detail_page: '0', is_from_web_flyflow: '1', lid: ''
        };

        const basePayload = {
            page_params: pageParams,
            page_bypass_params: {
                params: { caller_id: '3000010', platform_id: '2' },
                scene: 'desk_detail', app_version: '', abtest_bypass_id: guid
            }
        };

        const ch = { apiUrl };
        const episodes = [];
        const seen = new Set();
        let episodeCard = null;

        const firstPayload = JSON.parse(JSON.stringify(basePayload));
        firstPayload.page_context = {};

        request(ch, firstPayload, function(data) {
            if (!data) { callback([]); return; }

            function scanCards(cardList) {
                for (let i = 0; i < cardList.length; i++) {
                    const card = cardList[i];
                    if (!card || typeof card !== 'object') continue;
                    if (card.type === 'pc_web_episode_list') {
                        episodeCard = card;
                        collectCards(card, cid, episodes, seen);
                    }
                }
            }

            scanCards(data.CardList);

            function tryNextPage(currentData, depth) {
                const hasNext = currentData.has_next_page === true ||
                    currentData.has_next_page === 1 ||
                    currentData.has_next_page === '1' ||
                    currentData.has_next_page === 'true';
                if (episodeCard || !hasNext || depth > 10) { finish(); return; }

                const nextPayload = JSON.parse(JSON.stringify(basePayload));
                nextPayload.page_context = currentData.page_context || {};

                request(ch, nextPayload, function(nextData) {
                    if (!nextData) { finish(); return; }
                    scanCards(nextData.CardList);
                    tryNextPage(nextData, depth + 1);
                });
            }

            tryNextPage(data, 0);

            function finish() {
                if (!episodeCard) { finalize(); return; }

                let tabs = [];
                try {
                    const tabJson = episodeCard.params?.tabs || '';
                    tabs = tabJson ? JSON.parse(tabJson) : [];
                } catch (e) { tabs = []; }

                const pageId = episodeCard.params?.page_id || '';
                const tasks = [];

                for (let i = 0; i < tabs.length; i++) {
                    const tab = tabs[i];
                    if (!tab || typeof tab !== 'object') continue;
                    const begin = parseInt(tab.begin, 10);
                    const end = parseInt(tab.end, 10);
                    if (!Number.isFinite(begin) || !Number.isFinite(end) || begin > end) continue;
                    if (rangeComplete(episodes, begin, end)) continue;
                    const context = tab.page_context;
                    if (typeof context !== 'string' || !context || !isSafeId(pageId)) continue;
                    tasks.push({ begin, end, context, pageId });
                }

                if (tasks.length === 0) { finalize(); return; }

                let doneCount = 0;
                for (let i = 0; i < tasks.length; i++) {
                    const task = tasks[i];
                    const payload = JSON.parse(JSON.stringify(basePayload));
                    payload.page_params = Object.assign({}, pageParams, {
                        req_from: '', page_id: task.pageId,
                        page_context: task.context, page_type: 'detail_operation'
                    });
                    payload.page_bypass_params.params = Object.assign({}, payload.page_bypass_params.params, {
                        page_type: 'detail_operation', page_id: task.pageId,
                        data_mode: 'default', user_mode: 'default', new_mark_label_enabled: '1'
                    });
                    payload.page_bypass_params.scene = 'operation';
                    payload.page_context = { latestPageContext: task.context };

                    request(ch, payload, function(pageData) {
                        if (pageData) collectCards(pageData.CardList, cid, episodes, seen);
                        doneCount++;
                        if (doneCount === tasks.length) finalize();
                    });
                }
            }

            function finalize() {
                const uniqueMap = new Map();
                for (let i = 0; i < episodes.length; i++) {
                    const ep = episodes[i];
                    if (!uniqueMap.has(ep.vid)) {
                        uniqueMap.set(ep.vid, ep);
                    } else {
                        const existing = uniqueMap.get(ep.vid);
                        if (existing.isTrailer && !ep.isTrailer) {
                            uniqueMap.set(ep.vid, ep);
                        }
                    }
                }

                const finalEpisodes = Array.from(uniqueMap.values());
                finalEpisodes.sort((a, b) => {
                    const numA = extractEpisodeNumber(a.title);
                    const numB = extractEpisodeNumber(b.title);
                    if (numA !== numB) return numA - numB;
                    return partWeight(a.title) - partWeight(b.title);
                });

                // 缓存结果
                episodeCache.set(cid, finalEpisodes);
                callback(finalEpisodes);
            }
        });
    }

    // ========== 注入选集（自适应分页） ==========
    let resizeObserver = null;

    function injectSelector(episodes, currentVid) {
        const playableWrapper = document.querySelector('div[class="playable-wrapper"]');
        if (!playableWrapper) return;

        // 隐藏后续兄弟节点
        let next = playableWrapper.nextElementSibling;
        while (next) {
            next.style.display = 'none';
            next = next.nextElementSibling;
        }

        // 移除旧面板和旧 observer
        const oldContainer = document.getElementById('tm-qq-episode-panel');
        if (oldContainer) oldContainer.remove();
        if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }

        if (!episodes || episodes.length === 0) return;

        const container = document.createElement('div');
        container.id = 'tm-qq-episode-panel';
        container.style.cssText = 'padding:8px 12px;background:#fff;color:#333;font-size:14px;box-sizing:border-box;';

        const hint = document.createElement('div');
        hint.textContent = `选集（共${episodes.length}集）`;
        hint.style.cssText = 'font-size:14px;font-weight:bold;color:#00a1ff;padding:2px 0 6px;border-bottom:1px solid #eee;';
        container.appendChild(hint);

        const listContainer = document.createElement('div');
        listContainer.id = 'tm-qq-episode-list';
        listContainer.style.cssText = 'overflow:hidden;';
        container.appendChild(listContainer);

        const pagerContainer = document.createElement('div');
        pagerContainer.id = 'tm-qq-episode-pager';
        pagerContainer.style.cssText = 'margin-top:6px;text-align:center;user-select:none;';
        container.appendChild(pagerContainer);

        let pageSize = 60;
        let totalPages = 1;
        let currentPage = 0;

        // ===== 自适应分页 =====
        function calcPageSize() {
            const wrapperRect = playableWrapper.getBoundingClientRect();
            const availableHeight = window.innerHeight - wrapperRect.bottom;
            const listHeight = availableHeight - 90;
            if (listHeight < 60) return 12;

            const btnHeight = 34;
            const btnWidth = 80;
            const rows = Math.max(1, Math.floor(listHeight / btnHeight));
            const cols = Math.max(1, Math.floor(container.clientWidth / btnWidth));
            return rows * cols;
        }

        function renderPage(page) {
            currentPage = page;
            listContainer.textContent = '';

            const start = page * pageSize;
            const end = Math.min(start + pageSize, episodes.length);

            const fragment = document.createDocumentFragment();
            for (let i = start; i < end; i++) {
                const ep = episodes[i];
                const btn = document.createElement('div');
                btn.textContent = ep.title;
                const isCurrent = ep.vid === currentVid;
                btn.style.cssText = `
                    display:inline-block;padding:4px 10px;margin:3px;font-size:13px;
                    border-radius:4px;cursor:pointer;text-align:center;
                    background:${isCurrent ? '#00a1ff' : '#f2f2f2'};
                    color:${isCurrent ? '#fff' : '#333'};
                `;
                btn.onclick = () => {
                    if (isCurrent) return;
                    window.location.href = window.location.href.replace(/vid=[^&]+/, `vid=${ep.vid}`);
                };
                fragment.appendChild(btn);
            }
            listContainer.appendChild(fragment);
            renderPager();
        }

        function renderPager() {
            pagerContainer.textContent = '';
            if (totalPages <= 1) return;

            const btnStyle = `
                display:inline-block;padding:4px 12px;margin:0 4px;font-size:12px;
                border-radius:4px;cursor:pointer;background:#f2f2f2;color:#333;
                user-select:none;
            `;

            const prevBtn = document.createElement('div');
            prevBtn.textContent = '上一页';
            prevBtn.style.cssText = btnStyle + (currentPage === 0 ? 'opacity:0.4;cursor:not-allowed;' : '');
            prevBtn.onclick = () => { if (currentPage > 0) renderPage(currentPage - 1); };
            pagerContainer.appendChild(prevBtn);

            const pageInfo = document.createElement('span');
            pageInfo.textContent = `${currentPage + 1} / ${totalPages}`;
            pageInfo.style.cssText = 'display:inline-block;padding:4px 8px;font-size:12px;color:#666;';
            pagerContainer.appendChild(pageInfo);

            const nextBtn = document.createElement('div');
            nextBtn.textContent = '下一页';
            nextBtn.style.cssText = btnStyle + (currentPage === totalPages - 1 ? 'opacity:0.4;cursor:not-allowed;' : '');
            nextBtn.onclick = () => { if (currentPage < totalPages - 1) renderPage(currentPage + 1); };
            pagerContainer.appendChild(nextBtn);
        }

        playableWrapper.parentNode.insertBefore(container, playableWrapper.nextElementSibling);

        requestAnimationFrame(() => {
            pageSize = calcPageSize();
            totalPages = Math.ceil(episodes.length / pageSize) || 1;

            const currentIndex = episodes.findIndex(ep => ep.vid === currentVid);
            const initialPage = currentIndex >= 0 ? Math.floor(currentIndex / pageSize) : 0;
            renderPage(initialPage);
        });

        // 防抖 ResizeObserver
        let resizeTimer = null;
        resizeObserver = new ResizeObserver(() => {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const newSize = calcPageSize();
                if (newSize !== pageSize) {
                    pageSize = newSize;
                    totalPages = Math.ceil(episodes.length / pageSize) || 1;
                    if (currentPage >= totalPages) currentPage = totalPages - 1;
                    renderPage(currentPage);
                }
            }, 200);
        });
        resizeObserver.observe(document.body);
    }

    // ========== 播放页检测 ==========
    let lastHandledUrl = '';
    let debounceTimer = null;

    function isPlayPage(url) {
        return RE_PLAY_PAGE.test(url);
    }

    function handlePage() {
        const url = location.href;
        if (url === lastHandledUrl) return;
        lastHandledUrl = url;

        if (!isPlayPage(url)) return;

        const urlParams = new URLSearchParams(window.location.search);
        const cid = urlParams.get('cid');
        const currentVid = urlParams.get('vid');
        if (!cid) return;

        fetchEpisodes(cid, currentVid, (episodes) => {
            injectSelector(episodes, currentVid);
        });
    }

    function scheduleHandle() {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(handlePage, 300);
    }

    handlePage();

    // 单一 MutationObserver，监听 URL 变化
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            scheduleHandle();
        }
    });
    observer.observe(document.body, { subtree: true, childList: true });

    const _pushState = history.pushState;
    history.pushState = function() {
        _pushState.apply(this, arguments);
        scheduleHandle();
    };
    const _replaceState = history.replaceState;
    history.replaceState = function() {
        _replaceState.apply(this, arguments);
        scheduleHandle();
    };
    window.addEventListener('popstate', scheduleHandle);

})();