// ==UserScript==
// @name         修复uniReporter问题
// @version      1.0
// @description  修复网页中 uniReporter 相关的错误，包括未定义和方法缺失问题
// @author       Kimi
// @match        https://v.qq.com/x/cover/*
// @grant        none
// ==/UserScript==
(function(){'use strict';function f(){if(typeof window.uniReporter==='undefined')window.uniReporter={};['getPublicParams','setPublicParams','log','error'].forEach(m=>{if(typeof window.uniReporter[m]!=='function')window.uniReporter[m]=function(...a){return m==='getPublicParams'?{}:void 0;};});}setInterval(f,5000);})();
