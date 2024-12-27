// ==UserScript==
// @name 解析辅助脚本
// @description 脚本功能目前有：给“解析脚本”添加自定义接口（需要配合jxb解析脚本--才有效果）。
// @description:en 2024-12-16
// @version 1
// @author 江小白
// @include /^https?:\/\/(?:(?:movie\.douban\.com|m\.douban\.com\/movie)\/subject\/\d|(?:www\.ixigua\.com\/|m\.ixigua\.com\/video\/)\d{10,}(?:\?id=\d{10,}|$)|(?:v(?:-wb)?|m)\.youku\.com\/.+?\/id_|\w+?\.wasu\.c.+?\/(?:[^\/]+?-detail|[pP]lay\/show\/id)\/\d|www\.fun\.tv\/vplay\/g-|m\.fun\.tv\/mplay\/\?mid=|\w+?\.miguvideo\.com\/(?:p\/detail\/|.+?\/detail\.html\?cid=)\d|[^\/]+?\.tudou\.com\/(?:v\/|.+?\/id_)|v\.qq\.com\/(?:x\/(?:cover|page)|.+?\/p\/topic)\/|(?:3g|m)\.v\.qq\.com|w(?:ww)?\.mgtv\.com\/[a-z]\/|www\.mgtv\.com\/act\/|m\.mgtv\.com\/b\/|www\.iqiyi\.com\/(?:[vw]_|kszt\/)|www\.iq\.com\/play\/|m\.iqiyi\.com\/(?:v_|$)|tw\.iqiyi\.com\/v_|tv\.sohu\.com\/v\/|m\.tv\.sohu\.com\/(?:u\/|v|phone_play_film\?aid=)|film\.sohu\.com\/album\/|www\.le\.com\/ptv\/vplay\/|m\.le\.com\/vplay_|[vm]\.pptv\.com\/show\/|(?:[^\/]+?\.)?1905\.com\/(?:m|.*?play)\/|www\.ixigua\.com\/|(?:player|live)\.bilibili\.com\/|www\.bilibili\.com\/(?:(?:cheese|bangumi)\/play|blackboard|.*?video)\/|m\.bilibili\.com\/bangumi\/play\/|www\.acfun\.cn\/(?:.+?\/ac|bangumi\/)|m\.acfun\.cn\/v\/|.+?(?:\.m(?:3u8|p4)\?\w+?=|(?:search|jx|url|rul|id|v|&[^\/]+?|_\w+?|\.html\?\w+?)[&#=\?]https?(?::\/\/|%3A%2F%2F)[^\/]+?\.(?:youku|fun|miguvideo|wasu|tudou|qq|mgtv|iqiyi|iq|sohu|le|pptv|1905|bilibili|acfun|ixigua)\.))/
// @grant none
// @noframes
// @run-at document-body
// ==/UserScript==


(function(){'use strict';if(location.href.match(/(?:^https?:\/\/(?!.+?https?(?::\/\/|:\\\/\\\/|%3A%2F%2F)).+?\.(?:ts|vob|3gp|rmvb|flac|[fh]lv|og[gv]|m(?:3u8|p[34]|kv|4a|ov|pg|idi|peg)|w(?:[am]v|ma|ebm)|a(?:ac|pe|vi|lac))|\.(?:js(?:on)?|rb|swf|png|xml|bmp|pac|gif|apk|exe|zip|txt|aspx|docx|jpe?g|p(?:y|df|ng)|i(?:co|dx|mage)|r(?:ss|ar|[0-9]{2,2})|s(?:h|vg|rt|ub)|(?:c|le)ss|w(?:ebp|off2)))(?:#|\?|\\|&|$)|\/0\/(?:\d+?_){1,}\d+?\/0$/)||location.href.match(/^https?:\/\/(?:(?:[^\/]+?\/(?!api)){1,}\w+?\?\w*?id=.+?(?<!&key=.+?)[&#=\?]https?(?::\/\/|:\\\/\\\/|%3A%2F%2F)|(?:[^\/]+?\/(?:proxyhttp|[a-zA-Z]*?kv\?)|.+?\.\w+?\/\d+?)$)/)){return false;}else{if(self!=top){return false;}else{if(!document.querySelector("\u6c5f\u5c0f\u767d\u81ea\u5b9a\u4e49\u63a5\u53e3")){document.head.appendChild(document.createElement("\u6c5f\u5c0f\u767d\u81ea\u5b9a\u4e49\u63a5\u53e3"));if(location.href.match(/^https?:\/\/(?:(?:movie\.douban\.com|m\.douban\.com\/movie)\/subject\/\d|(?:www\.ixigua\.com\/|m\.ixigua\.com\/video\/)\d{10,}(?:\?id=\d{10,}|$)|(?:v(?:-wb)?|m)\.youku\.com\/.+?\/id_|\w+?\.wasu\.c.+?\/(?:[^\/]+?-detail|[pP]lay\/show\/id)\/\d|www\.fun\.tv\/vplay\/g-|m\.fun\.tv\/mplay\/\?mid=|\w+?\.miguvideo\.com\/(?:p\/detail\/|.+?\/detail\.html\?cid=)\d|[^\/]+?\.tudou\.com\/(?:v\/|.+?\/id_)|v\.qq\.com\/(?:x\/(?:cover|page)|.+?\/p\/topic)\/|(?:3g|m)\.v\.qq\.com|w(?:ww)?\.mgtv\.com\/[a-z]\/|www\.mgtv\.com\/act\/|m\.mgtv\.com\/b\/|www\.iqiyi\.com\/(?:[vw]_|kszt\/)|www\.iq\.com\/play\/|m\.iqiyi\.com\/(?:v_|$)|tw\.iqiyi\.com\/v_|tv\.sohu\.com\/v\/|m\.tv\.sohu\.com\/(?:u\/|v|phone_play_film\?aid=)|film\.sohu\.com\/album\/|www\.le\.com\/ptv\/vplay\/|m\.le\.com\/vplay_|[vm]\.pptv\.com\/show\/|(?:[^\/]+?\.)?1905\.com\/(?:m|.*?play)\/|www\.ixigua\.com\/|(?:player|live)\.bilibili\.com\/|www\.bilibili\.com\/(?:(?:cheese|bangumi)\/play|blackboard|.*?video)\/|m\.bilibili\.com\/bangumi\/play\/|www\.acfun\.cn\/(?:.+?\/ac|bangumi\/)|m\.acfun\.cn\/v\/|.+?(?:\.m(?:3u8|p4)\?\w+?=|(?:search|jx|url|rul|id|v|&[^\/]+?|_\w+?|\.html\?\w+?)[&#=\?]https?(?::\/\/|%3A%2F%2F)[^\/]+?\.(?:youku|fun|miguvideo|wasu|tudou|qq|mgtv|iqiyi|iq|sohu|le|pptv|1905|bilibili|acfun|ixigua)\.))/)){
/* ** 自定义修改 Josn 全局播放器地址 （必须是 https 类型）** */
let 电脑json全局播放器="https://www.tpvod.com/player.html?uri=";
let 手机json全局播放器="https://www.tpvod.com/player.html?uri=";
/* ********填入想屏蔽的接口名称，屏蔽多个用 | 隔开********** */
let 全局自定义屏蔽接口=/百域阁/i;
/* ****************************************************** */
localStorage.setItem('电脑Json全局播放器',电脑json全局播放器);localStorage.setItem('手机Json全局播放器',手机json全局播放器);if(location.host.match(/(?:youku|fun|miguvideo|wasu|tudou|qq|mgtv|iqiyi|iq|sohu|le|pptv|1905|bilibili|acfun|ixigua|douban)/)){let zdyjkb;try{zdyjkb=[
/* **************** 自定义添加接口 ************************* */
//写法例子：
//{name:"PAR",url:"https://jx.jsonplayer.com/player/?url="},






/* ******************************************************* */
];if(JSON.stringify(zdyjkb).match(/(?<!(?:\*|\/\/)\s*?)[\}\[]\s*?(?:,\s*?)?(?:NaN|null|undefined)/i)){localStorage.setItem('江小白自定义接口','[]');alert('111辅助脚本\n\n请自行检测《自定义添加接口》出错的地方');}else{localStorage.setItem('江小白自定义接口',JSON.stringify(zdyjkb));}}catch(e){localStorage.setItem('江小白自定义接口','[]');alert('111辅助脚本\n\n《自定义添加接口》有问题:\n\n'+e);}let zdyjkpbobj=setInterval(function(){try{if(document.querySelector("ul#httpsvipul>li:last-of-type")){const zdyjkpb=document.querySelectorAll('ul#httpsvipul>li');for(let zdyjkpbi=0;zdyjkpbi<zdyjkpb.length;zdyjkpbi++){const zdyjkpbmsa=zdyjkpb[zdyjkpbi].querySelectorAll('a4');for(let zdyjkpbia=0;zdyjkpbia<zdyjkpbmsa.length;zdyjkpbia++){if(zdyjkpbmsa[zdyjkpbia].innerText.match(全局自定义屏蔽接口)){zdyjkpb[zdyjkpbi].setAttribute('style','display:none!important');}};};clearInterval(zdyjkpbobj);}else{}}catch(e){clearInterval(zdyjkpbobj);}},1234);}}}else{return false;}}}})();