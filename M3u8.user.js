// ==UserScript==
// @name M3u8
// @description:en 不推荐手机浏览器使用，特别是没有安装 猴子 的 那种套壳浏览器
// @description 解析 或 破解 vip影视 的时候，使用的 《在线播放器》 和 《在线VIP解析接口》 和 《第三方影视野鸡网站》 全局通用 拦截和过滤 （解析资源/采集资源） 的 插播广告切片
// @version 20260922
// @author 江小白
// @match *://*/*
// @exclude /\/(?:history|outlook|register|activity\/.+?\.s?htm)/
// @exclude /^https?:\/\/(?:[^\/]+?)?(?:pan|yun|cloud|chat|game|mail|regex)/
// @exclude /^https?:\/\/(?:bbs|.+?\/(?:thread|forum|read|viewthread\.php\?tid=\d))/
// @exclude /^https?:\/\/(?!.+?https?(?::\/\/|:\\\/\\\/|%(?:3A|25)[^\/]+?)).+?[^a-zA-Z\d](?:log|cookie)[^a-zA-Z\d]*?[^\/\.]*?\.s?htm/
// @exclude /^https?:\/\/(?:[^\/]+?\.)?(?:ixigua|youku|miguvideo|fun|wasu|tudou|qq|mgtv|iqiyi|iq|sohu|le|pptv|1905|hdslb|bili[^\.]+?|acfun)\./
// @exclude /^https?:\/\/(?:68\.31\.26|(?:100\.64|109\.249|141\.207|169\.254|172\.160|192\.18|192\.255)\.0|129\.192\.166|192\.168|192\.0\.2|192\.88\.99|208\.54\.0|217\.116\.96|2(?:23|55)\.255\.255)\./
// @exclude /^https?:\/\/(?:.+?\]|(?:[^\/]+?\/{1,}(?!api)){1,}\w+?\?\w*?id=.+?(?<!&key=.+?)[&#=\?]https?(?::\/\/|:\\\/\\\/|%(?:3A|25)[^\/]+?)|(?:[^\/]+?\/{1,}(?:proxyhttp|[a-zA-Z]*?kv\?)|.+?\.\w+?\/{1,}(?!\d{4,8})\d+?)$)/
// @exclude /^https?:\/\/(?!.+?https?(?::(?:(?:\/){2,}|(?:\\\/){1,})|%3A%))(?:[^\/]+?\/){0,}[^\/]+?\.(?!.+?(?:\/tab\/|playurl|\/log\/|_img_|\.js,.+?\.js)).+?[=&\/\_\-\.\?](?:dm|[a-z]*?(?:danm[au]|barrage)[a-z]*?)[=&\/\_\-\.\?]/
// @exclude /^https?:\/\/(?:[^\/]+?\.)?(?:(?:scriptcat|greasyfork|sleazyfork|pcloud|(?:cow|we)transfer|mediafire|mega|drive|onedrive|dropbox|quark|aliyundrive|115|1[38]9|ctfile|lanzou|xunlei|jianguoyun|github|deepseek|doubao|yuanbao|kimi|yhgfb|douyin|kuaishou|hongguo|mddcloud|ggpht|qpic|gstatic|[yg]timg|youtu|google|cloudflare)|(?:roajsdl|vvvdj|bing|baidu|jd|tmall|taobao|meizu|asus|nike|vmall|fliggy|adidas|gome|\w*?suning|liangxinyao|xiaomiyoupin|mmstat|\w*?video\w*?\.qq)\.)/
// @exclude /(?:^https?:\/\/(?!.+?https?(?::\/\/|:\\\/\\\/|%(?:3A|25)[^\/]+?)).+?\.(?:ts|vob|3gp|rmvb|flac|[fh]lv|og[gv]|m(?:3u8|p[34]|kv|4a|ov|pg|idi|peg)|w(?:[am]v|ma|ebm)|a(?:ac|pe|vi|lac))|\.(?:js(?:on)?|rb|swf|png|xml|bmp|pac|gif|apk|exe|zip|txt|aspx|docx?|jpe?g|p(?:y|df|ng)|i(?:co|dx|mage)|r(?:ss|ar|[0-9]{2,2})|s(?:h|vg|rt|ub)|(?:c|le)ss|w(?:ebp|off2)))(?:\b|$)|\/0\/(?:\d+?_){1,}\d+?\/0$/
// @run-at document-start
// ==/UserScript==

