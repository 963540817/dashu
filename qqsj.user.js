// ==UserScript==
// @name         手机腾讯选集
// @version      3
// @description  修复集数提取与上下中排序，适配多种标题格式
// @author       屏幕前的你
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

    const AD_PATTERNS = [
        '/activity/downapp_activity.html',
        /\/activity\/downapp_/i,
        /\/download\/app/i
    ];

    function isAdUrl(url) {
        if (typeof url !== 'string' || url === '') return false;
        for (let i = 0; i < AD_PATTERNS.length; i++) {
            const p = AD_PATTERNS[i];
            if (typeof p === 'string') {
                if (url.indexOf(p) !== -1) return true;
            } else if (p.test(url)) {
                return true;
            }
        }
        return false;
    }

    if (isAdUrl(location.pathname)) {
        try {
            if (history.length > 1) history.back();
            else if (document.referrer) location.replace(document.referrer);
            else location.replace('https://m.v.qq.com/');
        } catch (e) {}
        return;
    }

    if (window.navigation && window.navigation.addEventListener) {
        try {
            window.navigation.addEventListener('navigate', function(e) {
                const u = e.destination && e.destination.url;
                if (u && isAdUrl(u) && e.cancelable) e.preventDefault();
            });
        } catch (e) {}
    }

    const _rawOpen = window.open;
    window.open = function(url) {
        if (isAdUrl(typeof url === 'string' ? url : '')) return null;
        return _rawOpen.apply(window, arguments);
    };

    document.addEventListener('click', function(e) {
        const t = e.target;
        if (!t || typeof t.closest !== 'function') return;
        const a = t.closest('a[href]');
        if (a && isAdUrl(a.href)) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    const HAS_GM = typeof GM_xmlhttpRequest === 'function';
    const episodeCache = new Map();

    const WRAPPER_SELECTORS = [
        'div[class="playable-wrapper"]',
        'div[class="video-desc-rebuild"]'
    ];

    const MODE_KEY = 'tmQQEpisodeMode';
    let savedMode = 'page';
    try {
        const m = localStorage.getItem(MODE_KEY);
        if (m === 'scroll' || m === 'page') savedMode = m;
    } catch (e) {}

    const RE_PURE_NUM = /^\d+$/;
    const RE_EPISODE = /^第\d+([集话話期])/;
    const RE_EPISODE_NUM = /第\s*(\d+)\s*([集话話期])/;
    const RE_SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;
    const RE_PLAY_PAGE = /^https?:\/\/m\.v\.qq\.com\/x\/m\/play/;
    const RE_STRIP_ATTR = /[^\w\u4e00-\u9fa5]+/g;
    const RE_TAG_3X = /3X\s*?=\s*?([^;]+)/;
    const RE_TAG_2X = /2X\s*?=\s*?([^;]+)/;
    const RE_TAG_1X = /1X\s*?=\s*?([^;]+)/;
    const RE_YEAR = /^\s*?[12]\d{3}\s*?$/;
    const RE_DATE_DASH = /-/g;

    const EXTRA_KEYWORDS = [
        '预告', '特辑', '剧场版', '客栈', '花絮', '彩蛋', '前瞻', '回顾', 'PV', 'MV', '定档', '旅行', '陪看', '纯享', '名场面', '直播回放', '幕后故事', '解锁一系列',
        /定[档檔]|[专專][访訪]|解[读讀]|[试試]看|解[说說]|彩蛋|看[点點]|花絮|[预預]告|片[花段]|神[剧劇]亮了/, /^[^:：]+?(?:[抢搶]先看|先[导導]片)[^:：]*?[:：]/
    ];
    const FALLBACK_PREFIXES = ['先导片', '抢先看'];

    function escapeReg(s) {
        return s.replace(RE_STRIP_ATTR, '\\$&');
    }

    const EXTRA_PATTERNS = EXTRA_KEYWORDS.map(k =>
        k instanceof RegExp ? k : new RegExp(escapeReg(k))
    );
    const FALLBACK_PATTERNS = FALLBACK_PREFIXES.map(k =>
        k instanceof RegExp ? k : new RegExp('^' + escapeReg(k))
    );

    function makeGuid() {
        let s = '';
        for (let i = 0; i < 16; i++) s += ((Math.random() * 16) | 0).toString(16);
        return s;
    }

    function isSafeId(v) {
        return typeof v === 'string' && RE_SAFE_ID.test(v);
    }

    function extractEpisodeNumber(title) {
        if (typeof title !== 'string') return 0;
        const t = title.trim();
        if (!t) return 0;

        if (RE_PURE_NUM.test(t)) return parseInt(t, 10);

        let m = t.match(RE_EPISODE_NUM);
        if (m) return parseInt(m[1], 10);

        m = t.match(/^(\d+)\s*(?:[上下中][：:]?|[：:]|$)/);
        if (m) return parseInt(m[1], 10);

        m = t.match(/^(\d+)\s*[（(][上下中][）)]/);
        if (m) return parseInt(m[1], 10);

        return 0;
    }

    function partWeight(title) {
    if (typeof title !== 'string') return 0;
    const t = title.trim();

    if (/加更上$/.test(t)) return 40;
    if (/加更中$/.test(t)) return 45;
    if (/加更下$/.test(t)) return 50;

    if (/[（(]上[）)]$/.test(t)) return 1;
    if (/[（(]中[）)]$/.test(t)) return 2;
    if (/[（(]下[）)]$/.test(t)) return 3;

    if (/上$/.test(t)) return 1;
    if (/中$/.test(t)) return 2;
    if (/下$/.test(t)) return 3;

    if (/上[：:]$/.test(t)) return 1;
    if (/中[：:]$/.test(t)) return 2;
    if (/下[：:]$/.test(t)) return 3;

    return 0;
    }

    function extractTagImage(imgtagJson) {
        if (typeof imgtagJson !== 'string' || !imgtagJson) return '';
        try {
            const obj = JSON.parse(imgtagJson);
            for (const key in obj) {
                const tag = obj[key];
                if (!tag || typeof tag !== 'object') continue;
                const param = tag.param;
                if (typeof param !== 'string' || !param) continue;
                let m = param.match(RE_TAG_3X);
                if (m) return m[1];
                m = param.match(RE_TAG_2X);
                if (m) return m[1];
                m = param.match(RE_TAG_1X);
                if (m) return m[1];
            }
        } catch (e) {}
        return '';
    }

    function matchesAny(title, patterns) {
        for (let i = 0; i < patterns.length; i++) {
            if (patterns[i].test(title)) return true;
        }
        return false;
    }

    function isNumericTitle(t) {
        if (RE_PURE_NUM.test(t)) return true;
        if (RE_EPISODE.test(t)) return true;
        if (/^\d+\s*[上下中]/.test(t)) return true;
        if (/^\d+\s*[：:]/.test(t)) return true;
        return false;
    }

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
                onload: function(r) { parseResponse(r.responseText, done); },
                onerror: function() { done(null); }
            });
        } else {
            fetch(ch.apiUrl, {
                method: 'POST', headers, body,
                mode: 'cors', credentials: 'omit'
            }).then(r => r.text()).then(t => parseResponse(t, done)).catch(() => done(null));
        }
    }

    function parseResponse(text, done) {
        try {
            const data = JSON.parse(text);
            done(data.ret === 0 && data.data && data.data.CardList ? data.data : null);
        } catch (e) {
            done(null);
        }
    }

    function collectCards(root, cid, episodes, seen, mode, expectedCid) {
        const stack = [root];
        const patternList = mode === 1 ? FALLBACK_PATTERNS : null;
        const isMode0 = mode === 0;
        const isMode1 = mode === 1;

        while (stack.length > 0) {
            const node = stack.pop();
            if (!node || typeof node !== 'object') continue;

            if (Array.isArray(node)) {
                for (let i = 0; i < node.length; i++) {
                    const v = node[i];
                    if (v && typeof v === 'object') stack.push(v);
                }
                continue;
            }

            const type = node.type;
            const params = node.params;
            if (params && (type === 'pc_web_episode_list' || type === 'pc_detail_ep_list')) {
                const vid = params.vid;
                if (vid && isSafeId(vid) && !seen.has(vid)) {
                    const epCid = params.cid || params['report.cid'];
                    if (epCid === expectedCid) {
                        const rawTitle = (params.c_title_output || params.title || '').trim();
                        if (rawTitle) {
                            let accept;
                            if (isMode0) {
                                if (type === 'pc_detail_ep_list') {
                                    accept = false;
                                } else {
                                    const isExtra = matchesAny(rawTitle, EXTRA_PATTERNS);
                                    if (isExtra) {
                                        accept = false;
                                    } else {
                                        const dmt = params.desk_module_type;
                                        if (dmt === 'episode_list' || dmt === undefined) {
                                            accept = true;
                                        } else {
                                            accept = false;
                                        }
                                    }
                                }
                            } else if (isMode1) {
                                accept = matchesAny(rawTitle, patternList);
                            } else {
                                accept = true;
                            }
                            if (accept) {
                                seen.add(vid);
                                episodes.push({
                                    num: extractEpisodeNumber(rawTitle),
                                    title: rawTitle,
                                    originTitle: (params.title || rawTitle).trim(),
                                    vid: vid,
                                    cid: epCid,
                                    image: params.image_url,
                                    date: params.tag_right_text || '',
                                    tagImage: extractTagImage(params.imgtag_all),
                                    isTrailer: params.is_trailer === '1',
                                    _autoAssigned: false
                                });
                            }
                        }
                    }
                }
            }

            for (const key in node) {
                const v = node[key];
                if (v && typeof v === 'object') stack.push(v);
            }
        }
    }

    function findActiveYear(episodeCard) {
        if (!episodeCard || !episodeCard.children_list) return null;
        const cl = episodeCard.children_list;
        for (const key in cl) {
            const group = cl[key];
            if (!group || !group.cards) continue;
            const cards = group.cards;
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                if (!card || !card.params) continue;
                if (card.type !== 'pc_web_episode_list') continue;
                const p = card.params;
                if (p.page_type !== 'detail_operation') continue;
                if (p.selected !== '1') continue;
                const title = (p.title || '').trim();
                if (RE_YEAR.test(title)) return title;
            }
        }
        return null;
    }

    function fetchEpisodes(cid, currentVid, callback) {
        const cached = episodeCache.get(cid);
        if (cached) {
            callback(cached.episodes, cached.year, cached.episodeAll);
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
        let activeYear = null;
        let episodeAll = 0;

        const firstPayload = JSON.parse(JSON.stringify(basePayload));
        firstPayload.page_context = {};

        request(ch, firstPayload, function(data) {
            if (!data) { callback([], activeYear, episodeAll); return; }

            function scanCards(cardList) {
                if (!cardList || cardList.length === 0) return;
                const stack = cardList.slice();
                while (stack.length > 0) {
                    const card = stack.pop();
                    if (!card || typeof card !== 'object') continue;
                    const t = card.type;

                    if (t === 'pc_introduction') {
                        const p = card.params;
                        if (p && p.episode_all) {
                            const epAll = parseInt(p.episode_all, 10);
                            if (Number.isFinite(epAll) && epAll > 0) episodeAll = epAll;
                        }
                    } else if (t === 'pc_web_episode_list') {
                        if (!episodeCard || !episodeCard.params || !episodeCard.params.tabs) {
                            episodeCard = card;
                        }
                        if (!activeYear) {
                            const y = findActiveYear(card);
                            if (y) activeYear = y;
                        }
                        collectCards(card, cid, episodes, seen, 0, cid);
                    } else if (t === 'pc_detail_ep_list') {
                        collectCards(card, cid, episodes, seen, 0, cid);
                    }

                    if (card.children_list) {
                        for (const key in card.children_list) {
                            const group = card.children_list[key];
                            if (group && group.cards) {
                                for (let i = 0; i < group.cards.length; i++) {
                                    stack.push(group.cards[i]);
                                }
                            }
                        }
                    }
                }
            }

            scanCards(data.CardList);

            function tryNextPage(currentData, depth) {
                const hn = currentData.has_next_page;
                const hasNext = hn === true || hn === 1 || hn === '1' || hn === 'true';
                if (!hasNext || depth > 10) { finish(); return; }

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
                    const tabJson = episodeCard.params && episodeCard.params.tabs;
                    tabs = tabJson ? JSON.parse(tabJson) : [];
                } catch (e) { tabs = []; }

                const pageId = (episodeCard.params && episodeCard.params.page_id) || 'web_episode_list';
                const tasks = [];

                if (tabs.length > 0) {
                    for (let i = 0; i < tabs.length; i++) {
                        const tab = tabs[i];
                        if (!tab) continue;
                        const begin = parseInt(tab.begin, 10);
                        const end = parseInt(tab.end, 10);
                        if (!Number.isFinite(begin) || !Number.isFinite(end) || begin > end) continue;
                        const context = tab.page_context;
                        if (typeof context !== 'string' || !context || !isSafeId(pageId)) continue;
                        tasks.push({ context: context, pageId: pageId });
                    }
                }

                if (tasks.length === 0 && episodeCard.children_list) {
                    const seenContexts = new Set();
                    const cl = episodeCard.children_list;
                    for (const key in cl) {
                        const group = cl[key];
                        if (!group || !group.cards) continue;
                        const cards = group.cards;
                        for (let i = 0; i < cards.length; i++) {
                            const card = cards[i];
                            if (!card || !card.params) continue;
                            if (card.type !== 'pc_web_episode_list') continue;
                            if (card.params.page_type !== 'detail_operation') continue;
                            const context = card.params.page_context;
                            if (typeof context !== 'string' || !context || !isSafeId(pageId)) continue;
                            if (seenContexts.has(context)) continue;
                            seenContexts.add(context);
                            tasks.push({ context: context, pageId: pageId });
                        }
                    }
                }

                if (tasks.length === 0) { finalize(); return; }

                let doneCount = 0;
                const totalTasks = tasks.length;

                for (let i = 0; i < totalTasks; i++) {
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
                        if (pageData) {
                            const cl = pageData.CardList;
                            for (let j = 0; j < cl.length; j++) {
                                const card = cl[j];
                                if (!card || typeof card !== 'object') continue;
                                collectCards(card, cid, episodes, seen, 0, cid);
                            }
                        }
                        doneCount++;
                        if (doneCount === totalTasks) finalize();
                    });
                }
            }

            function finalize() {
                const uniqueMap = new Map();
                for (let i = 0; i < episodes.length; i++) {
                    const ep = episodes[i];
                    const pw = partWeight(ep.title);
                    const key = ep.num !== 0
                        ? ('n_' + ep.num + '_' + pw)
                        : ('v_' + ep.vid);

                    const prev = uniqueMap.get(key);
                    if (!prev) {
                        uniqueMap.set(key, ep);
                    } else {
                        if (prev.isTrailer && !ep.isTrailer) uniqueMap.set(key, ep);
                    }
                }

                let finalEpisodes = [];
                uniqueMap.forEach(v => finalEpisodes.push(v));

                const autoAssigned = [];
                for (let i = 0; i < finalEpisodes.length; i++) {
                    const ep = finalEpisodes[i];
                    if (ep.num === 0) {
                        ep._autoAssigned = true;
                        autoAssigned.push(ep);
                    }
                }

                let maxNum = 0;
                for (let i = 0; i < finalEpisodes.length; i++) {
                    const ep = finalEpisodes[i];
                    if (!ep._autoAssigned && ep.num > maxNum) maxNum = ep.num;
                }

                let nextNum = maxNum + 1;
                for (let i = 0; i < autoAssigned.length; i++) {
                    autoAssigned[i].num = nextNum++;
                }

                let allHaveDate = finalEpisodes.length > 0;
                if (allHaveDate) {
                    for (let i = 0; i < finalEpisodes.length; i++) {
                        const d = finalEpisodes[i].date;
                        if (!d || d.trim() === '') { allHaveDate = false; break; }
                    }
                }

                if (allHaveDate) {
                    finalEpisodes.sort((a, b) => {
                        const ta = Date.parse(a.date.replace(RE_DATE_DASH, '/')) || 0;
                        const tb = Date.parse(b.date.replace(RE_DATE_DASH, '/')) || 0;
                        if (ta !== tb) return ta - tb;
                        return partWeight(a.title) - partWeight(b.title);
                    });
                } else {
                    finalEpisodes.sort((a, b) => {
                        if (a.num !== b.num) return a.num - b.num;
                        return partWeight(a.title) - partWeight(b.title);
                    });
                }

                if (finalEpisodes.length > 0) {
                    let firstNonNum = -1;
                    for (let i = 0; i < finalEpisodes.length; i++) {
                        if (!isNumericTitle(finalEpisodes[i].title)) {
                            firstNonNum = i;
                            break;
                        }
                    }
                    if (firstNonNum > 0) {
                        const filtered = [];
                        for (let i = 0; i < finalEpisodes.length; i++) {
                            if (i < firstNonNum) {
                                filtered.push(finalEpisodes[i]);
                            } else if (isNumericTitle(finalEpisodes[i].title)) {
                                filtered.push(finalEpisodes[i]);
                            }
                        }
                        finalEpisodes = filtered;
                    }
                }

                episodeCache.set(cid, {
                    episodes: finalEpisodes,
                    year: activeYear,
                    episodeAll: episodeAll
                });
                callback(finalEpisodes, activeYear, episodeAll);
            }
        });
    }

    let resizeObserver = null;
    let cachedWrapper = null;

    function findTargetWrapper(yearPattern) {
        if (cachedWrapper && cachedWrapper.parentNode) return cachedWrapper;

        for (let i = 0; i < WRAPPER_SELECTORS.length; i++) {
            const el = document.querySelector(WRAPPER_SELECTORS[i]);
            if (el) { cachedWrapper = el; return el; }
        }

        if (yearPattern) {
            const nodes = document.querySelectorAll('h1, h2, h3, div, span');
            for (let i = 0; i < nodes.length; i++) {
                const el = nodes[i];
                const text = el.textContent;
                if (!text) continue;
                const t = text.trim();
                if (t && yearPattern.test(t)) {
                    let parent = el.parentElement;
                    while (parent && parent !== document.body) {
                        if (parent.querySelector('img') || parent.querySelector('video')) {
                            cachedWrapper = parent;
                            return parent;
                        }
                        parent = parent.parentElement;
                    }
                }
            }
        }

        const videoEl = document.querySelector('video');
        if (videoEl) {
            let parent = videoEl.parentElement;
            while (parent && parent !== document.body) {
                if (parent.clientWidth > 200 && parent.clientHeight > 100) {
                    cachedWrapper = parent;
                    return parent;
                }
                parent = parent.parentElement;
            }
        }

        return null;
    }

    function injectSelector(episodes, currentVid, activeYear) {
        let yearPattern = null;
        if (activeYear) {
            yearPattern = new RegExp('^' + activeYear + '$');
        }
        const targetWrapper = findTargetWrapper(yearPattern);
        if (!targetWrapper) return false;

        let next = targetWrapper.nextElementSibling;
        while (next) {
            next.style.display = 'none';
            next = next.nextElementSibling;
        }

        const oldContainer = document.getElementById('tm-qq-episode-panel');
        if (oldContainer) oldContainer.remove();
        if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }

        if (!episodes || episodes.length === 0) return false;

        const totalEpisodes = episodes.length;

        const container = document.createElement('div');
        container.id = 'tm-qq-episode-panel';
        container.style.cssText = 'padding:8px 12px;background:#fff;color:#333;font-size:14px;box-sizing:border-box;';

        const hint = document.createElement('div');
        hint.id = 'tm-qq-episode-hint';
        hint.style.cssText = 'font-size:14px;font-weight:bold;color:#00a1ff;padding:2px 0 6px;border-bottom:1px solid #eee;cursor:pointer;user-select:none;';
        container.appendChild(hint);

        const listContainer = document.createElement('div');
        listContainer.id = 'tm-qq-episode-list';
        container.appendChild(listContainer);

        const pagerContainer = document.createElement('div');
        pagerContainer.id = 'tm-qq-episode-pager';
        pagerContainer.style.cssText = 'margin-top:6px;text-align:center;user-select:none;';
        container.appendChild(pagerContainer);

        let pageSize = 60;
        let totalPages = 1;
        let currentPage = 0;
        let mode = savedMode;
        let switching = false;
        let scrollHandler = null;
        let scrollDirection = '';

        function calcPageSize() {
            const wrapperRect = targetWrapper.getBoundingClientRect();
            const listHeight = window.innerHeight - wrapperRect.bottom - 90;
            if (listHeight < 60) return 12;
            const rows = Math.max(1, Math.floor(listHeight / 34));
            const cols = Math.max(1, Math.floor(container.clientWidth / 80));
            return rows * cols;
        }

        function clearCurrentMark() {
            const marked = listContainer.querySelectorAll('[data-video-idx]');
            for (let i = 0; i < marked.length; i++) {
                marked[i].removeAttribute('data-video-idx');
            }
        }

        function clearList() {
            clearCurrentMark();
            listContainer.textContent = '';
        }

        function detachScrollHandler() {
            if (scrollHandler) {
                listContainer.removeEventListener('scroll', scrollHandler);
                scrollHandler = null;
            }
        }

        function resetListContainerForPage() {
            detachScrollHandler();
            const st = listContainer.style;
            st.cssText = '';
            st.display = 'block';
            st.overflowY = 'auto';
            st.overflowX = 'hidden';
            st.webkitOverflowScrolling = 'touch';
            st.scrollbarWidth = 'none';
            st.msOverflowStyle = 'none';

            const wrapperRect = targetWrapper.getBoundingClientRect();
            const listHeight = window.innerHeight - wrapperRect.bottom - 90;
            if (listHeight > 60) {
                st.maxHeight = listHeight + 'px';
            }
        }

        function resetListContainerForScroll() {
            detachScrollHandler();
            const st = listContainer.style;
            st.cssText = '';
            st.display = 'flex';
            st.flexDirection = 'row';
            st.overflowX = 'auto';
            st.overflowY = 'hidden';
            st.gap = '8px';
            st.padding = '4px 0';
            st.webkitOverflowScrolling = 'touch';
            st.contain = 'layout style paint';
        }

        let ignoreScrollUntil = 0;

        function renderPage(page) {
            currentPage = page;
            clearList();
            resetListContainerForPage();

            const start = page * pageSize;
            const end = Math.min(start + pageSize, totalEpisodes);

            const fragment = document.createDocumentFragment();
            for (let i = start; i < end; i++) {
                const ep = episodes[i];
                const btn = document.createElement('div');
                btn.textContent = ep.title;
                const isCurrent = ep.vid === currentVid;
                btn.style.cssText = `
                    display:inline-block;padding:4px 10px;margin:3px;font-size:13px;
                    border-radius:4px;cursor:pointer;text-align:center;
                    flex:initial;
                    background:${isCurrent ? '#00a1ff' : '#f2f2f2'};
                    color:${isCurrent ? '#fff' : '#333'};
                `;
                btn.onclick = () => {
                    if (isCurrent) return;
                    window.location.href = window.location.href.replace(/vid=[^&]+/, `vid=${ep.vid}`);
                };
                if (isCurrent) {
                    btn.setAttribute('data-video-idx', '当前');
                }
                fragment.appendChild(btn);
            }
            listContainer.appendChild(fragment);
            renderPager();

            ignoreScrollUntil = Date.now() + 250;

            const onPageScroll = function() {
                if (Date.now() < ignoreScrollUntil) return;

                const st = listContainer.scrollTop;
                const ch = listContainer.clientHeight;
                const sh = listContainer.scrollHeight;

                if (st + ch >= sh - 1 && scrollDirection !== 'up' && currentPage < totalPages - 1) {
                    scrollDirection = 'down';
                    ignoreScrollUntil = Date.now() + 250;
                    renderPage(currentPage + 1);
                    listContainer.scrollTop = 0;
                    return;
                }

                if (st <= 0 && scrollDirection !== 'down' && currentPage > 0) {
                    scrollDirection = 'up';
                    ignoreScrollUntil = Date.now() + 250;
                    renderPage(currentPage - 1);
                    requestAnimationFrame(() => {
                        listContainer.scrollTop = listContainer.scrollHeight - listContainer.clientHeight;
                    });
                    return;
                }

                if (scrollDirection === 'down' && st <= 0) scrollDirection = '';
                if (scrollDirection === 'up' && st + ch >= sh - 1) scrollDirection = '';
            };

            listContainer.addEventListener('scroll', onPageScroll, { passive: true });
            scrollHandler = onPageScroll;
        }

        function renderPager() {
            pagerContainer.textContent = '';
            pagerContainer.style.display = 'block';
            if (totalPages <= 1) return;

            const btnStyle = `
                display:inline-block;padding:4px 12px;margin:0 4px;font-size:12px;
                border-radius:4px;cursor:pointer;background:#f2f2f2;color:#333;
                user-select:none;
            `;

            const frag = document.createDocumentFragment();

            const firstBtn = document.createElement('div');
            firstBtn.textContent = '首页';
            firstBtn.style.cssText = btnStyle + (currentPage === 0 ? 'opacity:0.4;cursor:not-allowed;' : '');
            firstBtn.onclick = () => {
                scrollDirection = '';
                if (currentPage > 0) renderPage(0);
            };
            frag.appendChild(firstBtn);

            const prevBtn = document.createElement('div');
            prevBtn.textContent = '上页';
            prevBtn.style.cssText = btnStyle + (currentPage === 0 ? 'opacity:0.4;cursor:not-allowed;' : '');
            prevBtn.onclick = () => {
                scrollDirection = '';
                if (currentPage > 0) renderPage(currentPage - 1);
            };
            frag.appendChild(prevBtn);

            const pageInfo = document.createElement('span');
            pageInfo.textContent = `${currentPage + 1} / ${totalPages}`;
            pageInfo.style.cssText = 'display:inline-block;padding:4px 8px;font-size:12px;color:#666;';
            frag.appendChild(pageInfo);

            const nextBtn = document.createElement('div');
            nextBtn.textContent = '下页';
            nextBtn.style.cssText = btnStyle + (currentPage === totalPages - 1 ? 'opacity:0.4;cursor:not-allowed;' : '');
            nextBtn.onclick = () => {
                scrollDirection = '';
                if (currentPage < totalPages - 1) renderPage(currentPage + 1);
            };
            frag.appendChild(nextBtn);

            const lastBtn = document.createElement('div');
            lastBtn.textContent = '尾页';
            lastBtn.style.cssText = btnStyle + (currentPage === totalPages - 1 ? 'opacity:0.4;cursor:not-allowed;' : '');
            lastBtn.onclick = () => {
                scrollDirection = '';
                if (currentPage < totalPages - 1) renderPage(totalPages - 1);
            };
            frag.appendChild(lastBtn);

            pagerContainer.appendChild(frag);
        }

        function renderScrollMode() {
            clearList();
            resetListContainerForScroll();

            pagerContainer.textContent = '';
            pagerContainer.style.display = 'none';

            const currentIndex = episodes.findIndex(ep => ep.vid === currentVid && ep.image);
            const centerIndex = currentIndex >= 0 ? currentIndex : 0;

            const CHUNK_SIZE = 30;
            const MAX_DOM = 120;

            let renderStart = Math.max(0, centerIndex - Math.floor(CHUNK_SIZE / 2));
            let renderEnd = Math.min(totalEpisodes, renderStart + CHUNK_SIZE);

            function createCard(ep, idx) {
                const isCurrent = ep.vid === currentVid;
                const item = document.createElement('div');
                item.dataset.idx = idx;
                item.style.cssText = `
                    flex:0 0 auto;width:140px;cursor:pointer;text-align:center;
                    border-radius:6px;overflow:hidden;
                    background:${isCurrent ? '#e6f4ff' : '#fff'};
                    border:${isCurrent ? '2px solid #00a1ff' : '2px solid transparent'};
                    box-sizing:border-box;
                    content-visibility:auto;
                    contain-intrinsic-size:140px 114px;
                `;

                const imgWrap = document.createElement('div');
                imgWrap.style.cssText = `position:relative;width:100%;height:80px;background:#f2f2f2;`;

                const img = document.createElement('img');
                img.loading = 'lazy';
                img.decoding = 'async';
                img.src = ep.image;
                img.style.cssText = `width:100%;height:100%;object-fit:cover;display:block;`;
                imgWrap.appendChild(img);

                if (ep.tagImage) {
                    const tagEl = document.createElement('img');
                    tagEl.src = ep.tagImage;
                    tagEl.style.cssText = `position:absolute;top:0;right:0;height:18px;width:auto;pointer-events:none;`;
                    imgWrap.appendChild(tagEl);
                }

                if (ep.date) {
                    const dateEl = document.createElement('div');
                    dateEl.textContent = ep.date;
                    dateEl.style.cssText = `
                        position:absolute;right:0;bottom:0;
                        font-size:11px;color:#fff;font-weight:bold;
                        padding:2px 6px;line-height:1.2;
                        background:linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.55));
                        text-shadow:0 1px 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.7);
                        pointer-events:none;
                    `;
                    imgWrap.appendChild(dateEl);
                }

                item.appendChild(imgWrap);

                const title = document.createElement('div');
                title.textContent = ep.originTitle || ep.title;
                title.style.cssText = `
                    font-size:12px;padding:4px;line-height:1.3;
                    color:${isCurrent ? '#00a1ff' : '#333'};
                    white-space:normal;overflow:hidden;
                    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
                    height:34px;
                `;
                item.appendChild(title);

                item.onclick = () => {
                    if (isCurrent) return;
                    window.location.href = window.location.href.replace(/vid=[^&]+/, `vid=${ep.vid}`);
                };

                if (isCurrent) {
                    item.setAttribute('data-video-idx', '当前');
                }

                return item;
            }

            function renderChunk(start, end) {
                const frag = document.createDocumentFragment();
                for (let i = start; i < end; i++) {
                    const ep = episodes[i];
                    if (!ep.image) continue;
                    frag.appendChild(createCard(ep, i));
                }
                return frag;
            }

            listContainer.appendChild(renderChunk(renderStart, renderEnd));

            if (currentIndex >= 0) {
                requestAnimationFrame(() => {
                    const target = listContainer.querySelector(`[data-idx="${currentIndex}"]`);
                    if (target) listContainer.scrollLeft = target.offsetLeft - 20;
                });
            }

            let loading = false;
            let scrollTimer = null;

            scrollHandler = function() {
                if (scrollTimer) return;
                scrollTimer = requestAnimationFrame(() => {
                    scrollTimer = null;
                    if (loading) return;
                    loading = true;

                    const scrollLeft = listContainer.scrollLeft;
                    const clientWidth = listContainer.clientWidth;
                    const scrollWidth = listContainer.scrollWidth;

                    if (scrollLeft + clientWidth > scrollWidth - 300 && renderEnd < totalEpisodes) {
                        const newEnd = Math.min(totalEpisodes, renderEnd + CHUNK_SIZE);
                        listContainer.appendChild(renderChunk(renderEnd, newEnd));
                        renderEnd = newEnd;
                    }

                    if (scrollLeft < 300 && renderStart > 0) {
                        const oldScrollWidth = scrollWidth;
                        const newStart = Math.max(0, renderStart - CHUNK_SIZE);
                        listContainer.insertBefore(renderChunk(newStart, renderStart), listContainer.firstChild);
                        const newScrollWidth = listContainer.scrollWidth;
                        listContainer.scrollLeft += (newScrollWidth - oldScrollWidth);
                        renderStart = newStart;
                    }

                    const domCount = listContainer.childElementCount;
                    if (domCount > MAX_DOM) {
                        const centerIdx = Math.floor((renderStart + renderEnd) / 2);
                        const firstIdx = parseInt(listContainer.firstChild.dataset.idx, 10);
                        const lastIdx = parseInt(listContainer.lastChild.dataset.idx, 10);

                        if (centerIdx - firstIdx > lastIdx - centerIdx) {
                            const removeCount = Math.floor(CHUNK_SIZE / 2);
                            for (let k = 0; k < removeCount; k++) {
                                const el = listContainer.firstChild;
                                if (!el) break;
                                listContainer.removeChild(el);
                                renderStart++;
                            }
                        } else {
                            const removeCount = Math.floor(CHUNK_SIZE / 2);
                            for (let k = 0; k < removeCount; k++) {
                                const el = listContainer.lastChild;
                                if (!el) break;
                                listContainer.removeChild(el);
                                renderEnd--;
                            }
                        }
                    }

                    loading = false;
                });
            };
            listContainer.addEventListener('scroll', scrollHandler, { passive: true });
        }

        function applyMode() {
            if (switching) return;
            switching = true;
            try {
                if (mode === 'scroll') {
                    hint.textContent = `选集（共${totalEpisodes}集）👉 点击切回分页`;
                    renderScrollMode();
                } else {
                    hint.textContent = `选集（共${totalEpisodes}集）👉 点击切换滑动`;
                    requestAnimationFrame(() => {
                        pageSize = calcPageSize();
                        totalPages = Math.ceil(totalEpisodes / pageSize) || 1;
                        const currentIndex = episodes.findIndex(ep => ep.vid === currentVid);
                        const initialPage = currentIndex >= 0 ? Math.floor(currentIndex / pageSize) : 0;
                        renderPage(initialPage);
                    });
                }
            } finally {
                switching = false;
            }
        }

        hint.onclick = () => {
            if (switching) return;
            mode = mode === 'page' ? 'scroll' : 'page';
            try { localStorage.setItem(MODE_KEY, mode); } catch (e) {}
            applyMode();
        };

        targetWrapper.parentNode.insertBefore(container, targetWrapper.nextElementSibling);
        applyMode();

        let resizeTimer = null;
        resizeObserver = new ResizeObserver(() => {
            if (mode !== 'page') return;
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const newSize = calcPageSize();
                if (newSize !== pageSize) {
                    pageSize = newSize;
                    totalPages = Math.ceil(totalEpisodes / pageSize) || 1;
                    if (currentPage >= totalPages) currentPage = totalPages - 1;
                    renderPage(currentPage);
                }
            }, 250);
        });
        resizeObserver.observe(document.body);

        return true;
    }

    function waitForWrapper(callback) {
        const check = () => {
            for (let i = 0; i < WRAPPER_SELECTORS.length; i++) {
                const el = document.querySelector(WRAPPER_SELECTORS[i]);
                if (el) return el;
            }
            return null;
        };

        const existing = check();
        if (existing) { callback(existing); return; }

        let done = false;
        let observer = null;
        let timer = null;

        const finish = (el) => {
            if (done) return;
            done = true;
            if (observer) observer.disconnect();
            if (timer) clearTimeout(timer);
            callback(el);
        };

        observer = new MutationObserver(() => {
            const el = check();
            if (el) finish(el);
        });
        observer.observe(document.documentElement, { subtree: true, childList: true });

        timer = setTimeout(() => finish(null), 15000);
    }

    let lastHandledKey = '';
    let debounceTimer = null;

    function handlePage() {
        const url = location.href;
        if (!RE_PLAY_PAGE.test(url)) return;

        const urlParams = new URLSearchParams(window.location.search);
        const cid = urlParams.get('cid');
        if (!cid) return;
        const currentVid = urlParams.get('vid');
        const key = cid + '_' + (currentVid || '');

        if (key === lastHandledKey) return;
        lastHandledKey = key;

        waitForWrapper((wrapper) => {
            if (!wrapper) { lastHandledKey = ''; return; }
            cachedWrapper = wrapper;
            fetchEpisodes(cid, currentVid, (episodes, activeYear) => {
                const ok = injectSelector(episodes, currentVid, activeYear);
                if (!ok) lastHandledKey = '';
            });
        });
    }

    function scheduleHandle() {
        const url = location.href;
        if (!RE_PLAY_PAGE.test(url)) return;

        const urlParams = new URLSearchParams(window.location.search);
        const cid = urlParams.get('cid');
        if (!cid) return;
        const currentVid = urlParams.get('vid');
        const key = cid + '_' + (currentVid || '');

        if (key === lastHandledKey) return;

        cachedWrapper = null;

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(handlePage, 200);
    }

    scheduleHandle();

    let lastUrl = location.href;
    const handleUrlChange = () => {
        if (location.href === lastUrl) return;
        lastUrl = location.href;
        scheduleHandle();
    };

    const wrapHistory = (method) => {
        const original = history[method];
        history[method] = function() {
            const result = original.apply(this, arguments);
            setTimeout(handleUrlChange, 0);
            return result;
        };
    };
    wrapHistory('pushState');
    wrapHistory('replaceState');

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('pageshow', handleUrlChange);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') handleUrlChange();
    });

    let clickCheckTimer = null;
    document.addEventListener('click', () => {
        if (clickCheckTimer) clearTimeout(clickCheckTimer);
        clickCheckTimer = setTimeout(() => {
            clickCheckTimer = null;
            handleUrlChange();
        }, 666);
    }, true);

})();