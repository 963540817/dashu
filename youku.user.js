// ==UserScript==
// @name         优酷新地址转换器
// @description  自动转换每一个优酷新地址并提醒
// @version      1.0
// @author       江小白
// @match        https://v.youku.com/video?*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let lastUrl = window.location.href;
    let urlMonitor;

    window.addEventListener('load', function() {
        extractAndShowVideoId();
        urlMonitor = setInterval(function() {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                extractAndShowVideoId();
            }
        }, 1680);
    });

    window.addEventListener('beforeunload', function() {
        if (urlMonitor) {
            clearInterval(urlMonitor);
        }
    });

    function getUrlParameter(url, paramName) {
        try {
            const urlObj = new URL(url);
            const paramValue = urlObj.searchParams.get(paramName);
            return paramValue ? decodeURIComponent(paramValue) : null;
        } catch (e) {
            return null;
        }
    }

    function extractAndShowVideoId() {
        const vidParam = getUrlParameter(window.location.href, 'vid');
        if (vidParam) {
            const videoId = vidParam.endsWith('=') ? vidParam : vidParam + '==';
            const url = 'https://v.youku.com/v_show/id_' + videoId + '.html';
            alert('浏览器实际地址: \n' + url);
            return;
        }

        const youkuPattern = /["']\s*?extra\s*?["']\s*?:\s*?{\s*?["']\s*?videoId["']\s*?:\s*?["']\s*?([^"']+?)\s*?["']/i;
        const match = document.body.innerHTML.match(youkuPattern);

        if (match && match[1]) {
            const videoId = match[1].endsWith('=') ? match[1] : match[1] + '==';
            const url = 'https://v.youku.com/v_show/id_' + videoId + '.html';
            alert('浏览器实际地址: \n' + url);
        }
    }
})();