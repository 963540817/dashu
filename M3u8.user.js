// ==UserScript==
// @name M3u8
// @description 解析 或 破解 vip影视 的时候，使用的 《在线播放器》 和 《在线VIP解析接口》 和 《第三方影视野鸡网站》 全局通用 拦截和过滤 （解析资源/采集资源） 的 插播广告切片  个人自用脚本
// @version 20241221
// @author 江小白
// @match https://v.68sou.com/
// @include /\/\?id=[a-zA-Z\d]+?$/
// @include /\/[pP]lay(?:\/|\?id=\d)/
// @include /(?:lay|ideo).*?\.html/
// @include /^https?:\/\/(?:movie\.douban\.com\/subject|m\.douban\.com\/movie)\//
// @include /^https?:\/\/.+?(?<!(?:refer(?:rer)?|ori(?:gin)?))[&#=\?]https?(?::\/\/|:\\\/\\\/|%3A%2F%2F)/
// @include /^https?:\/\/(?!.+?https?(?::\/\/|:\\\/\\\/|%3A%2F%2F)).+?[\?&](?:url|rul)=(?!http).{5,}/
// @include /^https?:\/\/[^\/]+?\/(?:play|share)\/[a-z0-9]+?\/?\s*?$/
// @include /^https?:\/\/[^\/]+?\/vod(?:\/[^\/]+?(?:\/\d[^\/]+?\d)?\.html|detail\/\d[^\/]+?\d\.html)/
// @include /^https?:\/\/(?!.+?https?(?::\/\/|:\\\/\\\/|%3A%2F%2F)).+?\/(?:index\.php\/vod\/detail\/id\/\d+?|p\/\d[^\.]+?\d)\.html/
// @include /\/\d+?[Kk]b\/hls\/index\.m3u8|\.m3u8\?[^=]+?=[^\/]*?(?:info|llq)|\.m3u8$/
// @exclude /^https?:\/\/(?:[^\/]+?\.)?(?:(?:ggpht|qpic|gstatic|[yg]timg|youtu|google|cloudflare)|(?:roajsdl|vvvdj|bing|jd|tmall|taobao|meizu|asus|nike|vmall|fliggy|adidas|gome|\w*?suning|liangxinyao|xiaomiyoupin|mmstat|\w*?video\w*?\.qq)\.)/
// @exclude /^https?:\/\/(?:.+?\]|(?:[^\/]+?\/(?!api)){1,}\w+?\?\w*?id=.+?(?<!&key=.+?)[&#=\?]https?(?::\/\/|:\\\/\\\/|%3A%2F%2F)|(?:[^\/]+?\/(?:proxyhttp|[a-zA-Z]*?kv\?)|.+?\.\w+?\/\d+?)$)/
// @exclude /(?:^https?:\/\/(?!.+?https?(?::\/\/|:\\\/\\\/|%3A%2F%2F)).+?\.(?:ts|vob|3gp|rmvb|flac|[fh]lv|og[gv]|m(?:3u8|p[34]|kv|4a|ov|pg|idi|peg)|w(?:[am]v|ma|ebm)|a(?:ac|pe|vi|lac))|\.(?:js(?:on)?|rb|swf|png|xml|bmp|pac|gif|apk|exe|zip|txt|aspx|docx|jpe?g|p(?:y|df|ng)|i(?:co|dx|mage)|r(?:ss|ar|[0-9]{2,2})|s(?:h|vg|rt|ub)|(?:c|le)ss|w(?:ebp|off2)))(?:#|\?|\\|&|$)|\/0\/(?:\d+?_){1,}\d+?\/0$/
// @grant unsafeWindow
// @run-at document-start
// ==/UserScript==

(function() {
    try {
        if (typeof location['m3u8去插播广告'] === 'undefined') {
            try {
                Object.defineProperty(location, 'm3u8去插播广告', {
                    value: 'm3u8去插播广告',
                    writable: false,
                    enumerable: false,
                    configurable: false
                });
            } catch (e) {}
            let self, urlvip, m3u8wz, wzm3u8, mp4wz, flvwz, tswz, playsharewz, urlFromArgBy, ggbmd, shouldStopExecution, 打印, spbfurl, ggtspd, gggzdp, gggzpd, ggsjgg, ggzlhx, ggljbmd, ggljdmb, hhzz, bhhzz, dypd, m3u8gglj, m3u8ggljdypd, m3u8bflj;
            urlvip = location.href;
            m3u8gglj = '';
            m3u8bflj = '';
            hhzz = '[\\n\\r\\u0085\\u2028\\u2029]';
            bhhzz = '[^\\n\\r\\u0085\\u2028\\u2029]';
            wzm3u8 = /\/\d+?kb\/hls\/index\.m3u8|\.m3u8\?[^=]+?=[^\/]*?(?:info|llq)|\.m3u8$/i;
            m3u8wz = /\.(?:m3u8|png|css)(?:#|\?|\\|&|$)|(?<!thread|forum|read)\.php(?!(?:[a-z0-9\/]|\?\w+?=.+?\.(?:m(?:p4|kv)|flv|ts)(?:#|\?|\\|&|$)))|\/(?!.+?\.m(?:3u8|p4)(?:#|\?|\\|&|$)).+?(?<![a-z0-9])m(?:3u8|p4)(?![a-z0-9])/i;
            mp4wz = /\.m(?:p4|kv)(?:#|\?|\\|&|$)|^https?:\/\/(?:[^\/]+?\.)?pstatp.+?\/obj\/[^\.]+?$|type=video_mp4&(?!.+\.[a-z]{2,5}(?:#|\?|\\|&|$))|\.php\?\w+?=.+?\.mp4/i;
            flvwz = /\.flv(?:#|\?|\\|&|$)/i;
            tswz = /\.ts(?:#|\?|\\|&|$)/i;
            playsharewz = /^https?:\/\/[^\/]+?\/{1,}(?:play|share)\/{1,}[a-zA-Z0-9]+?(?:\/{1,})?$/i;
            dypd = /^\s*?(?:0{1,}|(?<!开\s*?)关(?:\s*?[闭掉])?)\s*?$/;
            打印 = '开';
            ggsjgg = '4|20';
            ggzlhx = 'ts|png|jpe?g|txt';
            ggljbmd = /&[a-z]*?(?:sign|token|version)=/i;
            ggbmd = /(?:\.php|\_(?:ts|mp4)\/.+?\.m3u8)(?:#|\?|\\|&|$)/i;
            ggljdmb = new RegExp('\\.(?:' + ggzlhx + ')' + hhzz + '+?#EXTINF','i');
            try {
                if (!shouldStopExecution) {
                    try {
                        self = typeof unsafeWindow !== 'undefined' ? unsafeWindow : self;
                    } catch (e) {}
                    /*以下是 M3U8 插播广告 过滤核心代码 不懂勿动*/
                    const tyad1 = '#EXTINF\\s*?:\\s*?'
                      , tyad2 = '#EXT-X-DISCONTINUITY'
                      , tyad3 = tyad2 + hhzz
                      , tyad4 = '(?:' + ggzlhx + ')'
                      , tyad5 = '\\.' + tyad4
                      , tyad6 = tyad5 + hhzz + '+'
                      , tyada = bhhzz + '+?' + tyad6
                      , tyadb = tyad1 + '\\d+?(?:\\.\\d+?)?\\s*?,' + hhzz + '+?'
                      , tyadc = tyad3 + '+'
                      , tyadd = tyadc + '?' + tyadb
                      , tyade = tyada + '?[\\s\\S]*?' + tyadc
                      , tyadf = '(?<=#EXT-X-TARGETDURATION\\s*?:\\s*?'
                      , tyadg = ')(?:\\.0{1,})?\\s*?,'
                      , tyadh = '(?:#EXT-X-[^:]+?:\\s*?'
                      , tyadi = tyad1 + '\\d+?\\.\\d+?'
                      , tyad100 = ggsjgg + tyadg
                      , tyad101 = hhzz + '+?' + tyadh + bhhzz
                      , tyad102 = tyad1 + '(?:' + tyad100 + hhzz
                      , tyad103 = tyad101 + '+?' + hhzz
                      , tyad104 = tyad1 + '\\d+?(?:\\.\\d+?)?,'
                      , tyad105 = 'https?:\\\/\\\/'
                      , tyad106 = '+?\\\/\\d+?_\\w{1,10}\\.ts'
                      , tyad107 = /^\s*#EXTM3U/i
                      , tyad108 = '[a-z\\d]{10,}0{2}\\d+?\\.'
                      , tyad109 = '(?:(?=#EXT-X-ENDLIST)|' + tyad3 + ')'
                      , tyad1010 = '^\\s*?#EXTM3U\\s*?'
                      , tyad1011 = hhzz + '+?' + bhhzz + '+?'
                      , tyad1012 = tyad1011 + hhzz + '+?'
                      , tyad1013 = tyad104 + tyad1012 + ')'
                      , tyad1014 = tyad3 + '+?'
                      , tyad1015 = tyad104 + hhzz + '+?'
                      , tyad1016 = tyad6 + '?'
                      , tyad1017 = bhhzz + '+?' + hhzz + '+?'
                      , tyad1018 = '0{3}'
                      , tyad1019 = tyad1011 + hhzz + '+?'
                      , tyad1020 = tyad104 + tyad1019
                      , tyad1021 = '#EXT-X-KEY\\s*?:\\s*?METHOD=NONE'
                      , tyad1022 = bhhzz + '+?' + tyad5
                      , tyad1023 = '(?<=' + hhzz + '+)' + tyad1022
                      , tyad1024 = tyad105 + bhhzz
                      , tyad1025 = tyad1022 + hhzz + '+?'
                      , tyad1026 = '(?<=' + hhzz + '+)' + tyad1014 + tyad1
                      , tyad1027 = hhzz + '+?' + tyad105
                      , tyad1028 = tyad1027 + tyad1017
                      , tyad1029 = tyad1011 + tyad1016
                      , tyad1030 = tyad1015 + tyad1024 + tyad106 + hhzz
                      , tyad1031 = tyad1010 + hhzz + '+?'
                      , tyad1032 = tyad1031 + '(?:#EXT-X-' + tyad1017 + '){1,}('
                      , tyad1033 = tyad1011 + '(?<!' + tyad1018 + bhhzz + '+?)'
                      , tyad1034 = tyad1033 + hhzz + '+?'
                      , tyad1035 = tyad1033 + tyad5 + hhzz + '+?'
                      , tyad1036 = tyadb + tyad1025
                      , tyad1037 = tyad1028 + '(?:' + tyad1
                      , tyad1038 = hhzz + '+?' + tyad1024 + '+?' + hhzz + '+?'
                      , tyad1039 = tyadb + tyad1024 + '+?'
                      , tyad1040 = tyad1029 + tyad1
                      , tyad1041 = tyad1 + '\\d+?(?:\\.0{1,})?,'
                      , tyad1042 = '(?:' + tyad1041 + tyad1038 + ')'
                      , tyad1043 = tyadi + '\\s*?,' + hhzz
                      , tyad1044 = '+?[a-z\\d]+?' + tyad6 + '?'
                      , tyad1045 = tyad1043 + tyad1044 + '){'
                      , tyad1046 = '\\s*?,' + hhzz + tyad1044
                      , tyad1047 = '(?=#EXT-X-)'
                      , tyad1048 = '){0,}'
                      , tyad1049 = tyad1048 + tyad1 + '\\d+?\\.3{3,}\\s*?,'
                      , tyad1050 = tyad1046 + '(?:' + tyad1043 + tyad1044 + tyad1048 + ')'
                      , itemsdpgza = tyad1026 + '(?<!0)(3)\\.\\1(?:((?<!0)\\d)\\2){2,}\\d+?,' + tyad1028 + '(?:' + tyad104 + tyad1028 + tyad1048 + tyad109
                      , itemspdgza = '(?:' + tyad1015 + '[a-z\\d]{10,}0{2}\\d+?' + tyad1016 + '){5,}'
                      , itemstygza = '(?<=(?:' + tyad1015 + tyad108 + tyad4 + hhzz + '+?){1,})' + tyad1014 + '(?:' + tyad1015 + '(?!' + tyad108 + tyad4 + ')' + tyada + '?){1,}' + tyad109
                      , itemstygza1 = '(?<=' + tyad1020 + ')' + tyad1014 + tyadb + tyad1017 + tyad1 + '3\\.3{3,}\\s*?,' + tyad1034 + '(?:' + tyadb + tyad1017 + tyad1049 + tyad1034 + tyad109
                      , itemstygza2 = new RegExp(tyad1032 + tyadb + '(\\\/' + bhhzz + '+?\\\/)[^\\\/]+?' + tyad1016 + '(?:' + tyadb + '\\2[^\\\/]+?' + tyad1016 + '){3,})' + tyad1014 + '#EXT-X-KEY\\s*?:\\s*?METHOD=NONE' + hhzz + '+?' + tyad1039 + tyad1016,'i')
                      , itemstygza3 = new RegExp(tyad1039 + tyad6,'igm')
                      , itemstygza4 = new RegExp(tyad1032 + '?:' + tyadb + '(?<!' + tyad105 + ')[a-z0-9\\\/]+?' + tyad6 + '?){3,}' + tyad1014 + '(?:' + tyad1039 + tyad6 + '){3,}','i')
                      , itemstygza5 = new RegExp('(?<=(?<=' + hhzz + '+)' + tyad1014 + tyadi + tyad1018 + tyad1050 + tyad2 + '(?:' + hhzz + '+?' + tyad1045 + '1,}(?:' + tyadi + '3{5}' + tyad1050 + '{2,}' + tyad1047,'gi')
                      , itemsPaichu = [/*动态排除指定资源 正规则表达式,以达到智能删除插播广告的效果*/
                    new RegExp(tyad1031 + '(?![\\S\\s]*?(?:' + tyad1015 + '[a-z\\d]{10,}0{2}\\d+?' + tyad1016 + '){2,})[\\S\\s]*?' + tyad1014 + '(?:' + tyad1015 + '(?:[a-z]+?\\d+?|\\d+?[a-z]+?){10,}' + tyad1016 + '){2,}','i')]
                      , itemsHandle = [{
                        reUrl: wzm3u8,
                        reAds: [new RegExp(itemsdpgza,'gim'), new RegExp(itemstygza,'gim'), new RegExp(itemstygza1,'gim'), /*动态拼接采集资源 正规则表达式,以达到智能删除插播广告的效果*/
                        new RegExp(tyad1026 + '((?<!0)\\d\\.([1-9])(?!\\2)\\d{4,5}(?<!\\2)\\2),' + tyad1037 + '\\1,' + tyad1028 + '){2,6}' + tyad109,'gim'), new RegExp(tyad1014 + tyad1036 + tyad1 + '3\\.3{3,}\\s*?,' + tyad1035 + '(?:' + tyad1036 + tyad1049 + tyad1035 + '(?:' + tyad1036 + tyad1048 + tyad109,'gim'), new RegExp('(?<=' + tyad1030 + '+?(?:' + tyad1014 + tyad1048 + ')' + tyad1014 + '(?:' + tyad104 + hhzz + tyad1024 + '+?\\\/\\w{50,}\\.ts' + hhzz + '+?){1,}' + tyad1014 + '(?=' + tyad1030 + ')','gim'), new RegExp(tyadf + '(?:' + tyad100 + '?' + bhhzz + '+?' + tyad103 + '+?' + tyad1048 + ')' + tyad102 + '+?' + bhhzz + '+?-' + bhhzz + '+?\\d' + tyad1016 + '(?=' + tyad1 + ')','gim'), new RegExp(tyadf + bhhzz + '+?' + tyad103 + '+' + tyad1048 + ')(?:' + tyad1014 + ')?' + tyad102 + '+?[a-z\\d]+?0{4,}' + tyad1016 + '[\\s\\S]+?' + hhzz + '+[a-z\\d]+?0{2,}\\d' + tyad1016 + '(?<![\\s\\S]+?10' + tyad5 + '\\n*?[\\s\\S]*?' + hhzz + '+)(?=(?:' + tyad3 + '+|' + tyad1 + '\\d+(?:\\.\\d+)?\\s*?,' + hhzz + '+?[a-z\\d]+?10' + tyad1016 + '))','gi'), ],
                    }]
                      , itemsHandleby = [/*播放黑木耳采集资源的时候,额外增加该数组规则,避免其他的误杀*/
                    {
                        reUrl: /^https?:\/\/(?:[^\/]+?\.)?(?:hmr|heimuer)/i,
                        reAds: [new RegExp('(?<=' + tyad1014 + ')' + tyad1039 + tyad5 + tyad1017 + tyad1047,'gim'), new RegExp(tyad1026 + '((?<!0)\\d\\.(?!0)\\d{4,5}[1-9]),' + tyad1037 + '\\1,' + tyad1028 + '){2,6}' + tyad109,'gim'), new RegExp(tyad1026 + '(\\d+?(?:\\.(?!0{1,},)\\d+?)?),' + tyad1037 + '\\1,' + tyad1028 + '){1,}' + tyad109,'gim'), ]
                    }, /*播放华为采集资源的时候,额外增加该数组规则,避免其他资源误杀*/
                    {
                        reUrl: /^https?:\/\/(?:[^\/]+?\.)?nikanba/i,
                        reAds: [new RegExp('(?<=' + tyad2 + ')' + hhzz + '+?' + tyad1 + '10,' + tyad1027 + tyada + '?' + tyad2 + '(?=' + hhzz + ')','gim'), new RegExp(tyad1014 + tyad1 + '2,' + tyad1040 + '3,' + tyad1040 + '1,' + tyad1029 + '(?:' + tyad104 + tyad1011 + tyad6 + '?' + tyad1048 + tyad3 + '+','gim'), ]
                    }, ];
                    /*以上是 M3U8 插播广告 过滤核心代码 不懂勿动*/
                    const logysa = '%c[江小白-'
                      , logysb = '-已经发现] ✂\n%c对比'
                      , logysc = '-已经发现] ✂\n%c已经生效的广告正则：\n%c'
                      , logysd = "的广告正则：\n%c"
                      , logyse = '\n%c已经删除的广告内容：\n'
                      , logysf = 'border-left:5px solid #A0B;color:#A0B;padding:3px'
                      , logysg = 'color:blue;'
                      , logysh = 'color:red;'
                      , logysi = 'color:black;'
                      , logysj = '广告标识';
                    const urlFromArg = arg=>typeof arg === 'string' ? arg : arg instanceof Request ? arg.url : String(arg);
                    const matchM3u = url=>{
                        spbfurl = url;
                        const matchedItem = itemsHandle.find(item=>item.reUrl.test(url) && !mp4wz.test(url) && !flvwz.test(url) && !tswz.test(url) && !playsharewz.test(url) && !ggbmd.test(url));
                        itemsHandleby.forEach(byItem=>byItem.reUrl.test(url) && byItem.reAds.forEach(newReAd=>matchedItem.reAds.find(ad=>ad.source === newReAd.source && ad.flags === newReAd.flags) || matchedItem.reAds.push(newReAd)));
                        return matchedItem;
                    }
                    ;
                    const M3umatch = text=>{
                        try {
                            if (!text || !new RegExp(tyad5,'i').test(text) || !tyad107.test(text)) {
                                return true;
                            } else {
                                return false;
                            }
                        } catch (e) {
                            return false;
                        }
                    }
                    ;
                    const M3umatchu3M = (array,regExp)=>{
                        return array.some(function(item) {
                            return item.toString() === regExp.toString();
                        });
                    }
                    ;
                    const m3u8text = (text)=>{
                        try {
                            const regex = /^[a-z\d]{20,}/i;
                            const extensionRegex = new RegExp(tyad5,'i');
                            const lines = text.split('\n');
                            let count = 0;
                            for (let line of lines) {
                                const trimmedLine = line.trim();
                                if (extensionRegex.test(trimmedLine)) {
                                    const match = trimmedLine.match(extensionRegex);
                                    if (match) {
                                        const extension = match[0];
                                        const fileName = trimmedLine.slice(0, -extension.length);
                                        if (!regex.test(fileName)) {
                                            return false;
                                        }
                                    }
                                }
                                if (/0{2,}\d+$/.test(trimmedLine)) {
                                    count++;
                                    if (count >= 20) {
                                        return false;
                                    }
                                }
                            }
                            return true;
                        } catch (e) {
                            return false;
                        }
                    }
                    ;
                    const deleteAbnormalTs = (text,jxbgza,jxbgzb,jxbgzc,jxbgzd,jxbgze)=>{
                        try {
                            if (!shouldStopExecution) {
                                if (text) {
                                    if (!tyad107.test(text)) {
                                        return text;
                                    } else {
                                        if (ggljbmd.test(text)) {
                                            shouldStopExecution = true;
                                            return text;
                                        } else {
                                            if (ggljdmb.test(text)) {
                                                if (new RegExp(tyad1022,'i').test(text)) {
                                                    if (!new RegExp(tyad5 + '\\?','i').test(text)) {
                                                        if (new RegExp(tyad5 + hhzz,'i').test(text)) {
                                                            if (!jxbgzd) {
                                                                jxbgzd = /^\s*?(?:[a-z]+?(?:\s*?-\s*?)?)?\d+?\s*?$/i;
                                                            } else if (jxbgzd == '空') {
                                                                jxbgzd = /^\s*?空\s*?$/;
                                                            }
                                                            try {
                                                                const rgtya = tyad1015
                                                                  , rgtyb = jxbgza + tyad1016
                                                                  , regex = '(?<=' + rgtya + ')(' + jxbgzb + ')(?=' + rgtyb + ')'
                                                                  , regexx = new RegExp(regex,'gi')
                                                                  , tsPaths = text.match(new RegExp('(?:(?<=' + tyad1015 + '))?' + bhhzz + '+?(?=' + tyad1016 + ')','gi'))
                                                                  , matches = text.match(regexx)
                                                                  , paths = {};
                                                                if (!jxbgze || jxbgze == '空' || (Number.isInteger(Number(jxbgze)) && tsPaths && tsPaths.length < jxbgze)) {
                                                                    for (let i = 0; i < matches.length; i++) {
                                                                        const path = matches[i];
                                                                        if (!paths[path]) {
                                                                            paths[path] = [];
                                                                        }
                                                                        paths[path].push(path);
                                                                    }
                                                                    let maxCount = 0
                                                                      , maxPath = '';
                                                                    for (const path in paths) {
                                                                        if (paths[path].length > maxCount) {
                                                                            maxCount = paths[path].length;
                                                                            maxPath = path;
                                                                        }
                                                                    }
                                                                    for (const path in paths) {
                                                                        if (path !== maxPath) {
                                                                            paths[path].forEach(p=>{
                                                                                if (!jxbgzd.test(p)) {
                                                                                    text = text.replace(new RegExp(rgtya + p + rgtyb,'gi'), (match)=>{
                                                                                        try {
                                                                                            if (!dypd.test(打印)) {
                                                                                                try {
                                                                                                    console.log(logysa + "广告资源" + logysb + jxbgzc + logysd + regexx + logyse + "%c" + match.replace(new RegExp(tyad1023,'gi'), tsLink=>{
                                                                                                        if (!tsLink.startsWith('http')) {
                                                                                                            if (m3u8gglj) {
                                                                                                                return new URL(tsLink,m3u8gglj).href;
                                                                                                            } else {
                                                                                                                return tsLink;
                                                                                                            }
                                                                                                        } else {
                                                                                                            return tsLink;
                                                                                                        }
                                                                                                    }
                                                                                                    ), logysf, logysg, logysh, logysg, logysi);
                                                                                                } catch (e) {
                                                                                                    try {
                                                                                                        console.log(logysa + "广告资源" + logysb + jxbgzc + logysd + regexx + logyse + "%c" + match, logysf, logysg, logysh, logysg, logysi);
                                                                                                    } catch (e) {}
                                                                                                }
                                                                                            }
                                                                                        } catch (e) {}
                                                                                        try {
                                                                                            if (!ggtspd) {
                                                                                                ggtspd = true;
                                                                                            }
                                                                                        } catch (e) {}
                                                                                        return '';
                                                                                    }
                                                                                    );
                                                                                }
                                                                            }
                                                                            );
                                                                        }
                                                                    }
                                                                }
                                                            } catch (e) {}
                                                        }
                                                    }
                                                }
                                                return text;
                                            } else {
                                                return text;
                                            }
                                        }
                                    }
                                } else {
                                    return text;
                                }
                            } else {
                                return text;
                            }
                        } catch (e) {
                            return text;
                        }
                    }
                    ;
                    const pruner = (text,item)=>{
                        try {
                            if (!shouldStopExecution) {
                                if (text) {
                                    if (!tyad107.test(text)) {
                                        return text;
                                    } else {
                                        if (ggljbmd.test(text)) {
                                            shouldStopExecution = true;
                                            return text;
                                        } else {
                                            try {
                                                if ((!(new RegExp(itemsdpgza,'i').test(text) && ggljdmb.test(text))) && !new RegExp(tyad1014 + tyad1021,'i').test(text)) {
                                                    gggzdp = true;
                                                } else {
                                                    try {
                                                        itemsHandle.forEach(item=>{
                                                            item.reAds = item.reAds.filter(re=>re.source !== itemsdpgza);
                                                        }
                                                        );
                                                    } catch (e) {}
                                                    gggzdp = false;
                                                }
                                            } catch (e) {
                                                gggzdp = false;
                                            }
                                            if (ggljdmb.test(text) || !!gggzdp) {
                                                try {
                                                    if (!gggzpd) {
                                                        gggzpd = true;
                                                        try {
                                                            if (new RegExp(itemspdgza,'i').test(text) && new RegExp(itemstygza1,'i').test(text)) {
                                                                itemsHandle.forEach(item=>{
                                                                    item.reAds = item.reAds.filter(re=>re.source !== itemstygza1);
                                                                }
                                                                );
                                                            }
                                                        } catch (e) {}
                                                        try {
                                                            if (!(new RegExp(itemspdgza,'i').test(text) && new RegExp(itemstygza,'i').test(text))) {
                                                                itemsHandle.forEach(item=>{
                                                                    item.reAds = item.reAds.filter(re=>re.source !== itemstygza);
                                                                }
                                                                );
                                                            }
                                                        } catch (e) {}
                                                        if (!dypd.test(打印)) {
                                                            console.table(itemsPaichu);
                                                            console.table(itemsHandle);
                                                            console.log("播放链接：" + spbfurl);
                                                        }
                                                    }
                                                } catch (e) {}
                                                let modifiedText;
                                                try {
                                                    if (itemsPaichu.some(regex=>regex.test(text))) {
                                                        try {
                                                            if (!M3umatchu3M(itemsHandle[0].reAds, itemstygza5)) {
                                                                itemsHandle[0].reAds.push(itemstygza5);
                                                            }
                                                        } catch (e) {}
                                                        modifiedText = text;
                                                    } else {
                                                        if (new RegExp(tyadb + bhhzz + '+?\\.(?:' + ggzlhx + ')\\?' + tyad1017,'i').test(text)) {
                                                            modifiedText = text;
                                                        } else {
                                                            if (m3u8text(text)) {
                                                                modifiedText = text;
                                                            } else {
                                                                try {
                                                                    if (text.match(itemstygza2)) {
                                                                        const matchessc = text.match(itemstygza3);
                                                                        if (matchessc) {
                                                                            try {
                                                                                if (!dypd.test(打印)) {
                                                                                    console.log(logysa + "资源广告" + logysc + itemstygza3 + logyse, logysf, logysg, logysh, logysg);
                                                                                    matchessc.forEach(match=>{
                                                                                        console.log(match);
                                                                                    }
                                                                                    );
                                                                                }
                                                                            } catch (e) {}
                                                                            modifiedText = text.replace(itemstygza3, '');
                                                                        } else {
                                                                            modifiedText = deleteAbnormalTs(text, '[^\\.]+?', '(?:' + bhhzz + '+\\\/|\\b)', '路径');
                                                                        }
                                                                    } else {
                                                                        modifiedText = deleteAbnormalTs(text, '[^\\.]+?', '(?:' + bhhzz + '+\\\/|\\b)', '路径');
                                                                    }
                                                                } catch (e) {
                                                                    modifiedText = text;
                                                                }
                                                                try {
                                                                    if (!text.match(itemstygza4)) {
                                                                        modifiedText = deleteAbnormalTs(modifiedText, '(?:\\d+?|[a-z]+?)', '\\w+?(?:[^\\d]\\d{2})?', '名称');
                                                                    }
                                                                } catch (e) {}
                                                                try {
                                                                    modifiedText = deleteAbnormalTs(modifiedText, '\\d+?', '\\w+(?=\\d{3})', '名称', '空', 100);
                                                                } catch (e) {}
                                                                try {
                                                                    modifiedText = deleteAbnormalTs(modifiedText, '\\d+?', '\\w+(?=\\d{4})', '名称', '空');
                                                                } catch (e) {}
                                                                try {
                                                                    modifiedText = deleteAbnormalTs(modifiedText, '\\d+?', '[^0]\\d+[^0]0{2,}\\d0', '名称', /(?<=[^0]0{3,})\d+$/);
                                                                } catch (e) {}
                                                            }
                                                        }
                                                    }
                                                } catch (e) {
                                                    modifiedText = text;
                                                }
                                                for (const reAd of item.reAds) {
                                                    const matches = modifiedText.match(reAd);
                                                    if (matches) {
                                                        matches.forEach(match=>{
                                                            try {
                                                                if (!dypd.test(打印)) {
                                                                    try {
                                                                        console.log(logysa + "资源广告" + logysc + reAd + logyse + "%c" + match.replace(new RegExp(tyad1023,'gi'), tsLink=>{
                                                                            if (!tsLink.startsWith('http')) {
                                                                                if (m3u8gglj) {
                                                                                    return new URL(tsLink,m3u8gglj).href;
                                                                                } else {
                                                                                    return tsLink;
                                                                                }
                                                                            } else {
                                                                                return tsLink;
                                                                            }
                                                                        }
                                                                        ), logysf, logysg, logysh, logysg, logysi);
                                                                    } catch (e) {
                                                                        try {
                                                                            console.log(logysa + "资源广告" + logysc + reAd + logyse + "%c" + match, logysf, logysg, logysh, logysg, logysi);
                                                                        } catch (e) {}
                                                                    }
                                                                }
                                                            } catch (e) {}
                                                        }
                                                        );
                                                        try {
                                                            if (!ggtspd) {
                                                                ggtspd = true;
                                                            }
                                                        } catch (e) {}
                                                    }
                                                    modifiedText = modifiedText.replace(reAd, "");
                                                }
                                                if (modifiedText.length < text.length) {
                                                    return modifiedText;
                                                }
                                                return text;
                                            } else {
                                                return text;
                                            }
                                        }
                                    }
                                } else {
                                    return text;
                                }
                            } else {
                                return text;
                            }
                        } catch (e) {
                            return text;
                        }
                    }
                    ;
                    const prunerm3u8 = (text)=>{
                        try {
                            if (!shouldStopExecution) {
                                if (text) {
                                    if (!tyad107.test(text)) {
                                        return text;
                                    } else {
                                        if (ggljbmd.test(text)) {
                                            shouldStopExecution = true;
                                            return text;
                                        } else {
                                            if (!shouldStopExecution) {
                                                const extensionRegex = new RegExp(tyad2,'i');
                                                const lines = text.split('\n');
                                                let discontinuityCount = 0;
                                                const filteredLines = lines.filter(line=>{
                                                    if (extensionRegex.test(line)) {
                                                        discontinuityCount++;
                                                        return false;
                                                    }
                                                    return true;
                                                }
                                                );
                                                const result = filteredLines.join('\n');
                                                try {
                                                    if (discontinuityCount > 1) {
                                                        if (!dypd.test(打印)) {
                                                            console.log(logysa + logysj + "-已经发现] ✂" + '已删除《' + discontinuityCount + '》个' + tyad2 + logysj, logysf);
                                                        }
                                                    }
                                                } catch (e) {}
                                                return result;
                                            } else {
                                                return text;
                                            }
                                        }
                                    }
                                } else {
                                    return text;
                                }
                            } else {
                                return text;
                            }
                        } catch (e) {
                            return text;
                        }
                    }
                    ;
                    const realFetch = self.fetch;
                    self.fetch = new Proxy(self.fetch,{
                        apply(target, thisArg, args) {
                            const item = matchM3u(urlFromArg(args[0]));
                            if (!item) {
                                return Reflect.apply(target, thisArg, args);
                            }
                            if (!shouldStopExecution) {
                                return realFetch(...args).then(realResponse=>realResponse.text().then(text=>{
                                    const modifiedText = pruner(text, item);
                                    try {
                                        if (M3umatch(modifiedText)) {
                                            return realResponse;
                                        }
                                    } catch (e) {}
                                    return new Response(modifiedText,{
                                        status: realResponse.status,
                                        statusText: realResponse.statusText,
                                        headers: realResponse.headers
                                    });
                                }
                                ));
                            } else {
                                return Reflect.apply(target, thisArg, args);
                            }
                        }
                    });
                    self.XMLHttpRequest.prototype.open = new Proxy(self.XMLHttpRequest.prototype.open,{
                        apply: async(target,thisArg,args)=>{
                            try {
                                if (!shouldStopExecution) {
                                    urlFromArgBy = urlFromArg(args[1]);
                                    const item = matchM3u(urlFromArgBy);
                                    if (item) {
                                        if (ggljbmd.test(urlFromArgBy) || !!shouldStopExecution) {
                                            shouldStopExecution = true;
                                            return Reflect.apply(target, thisArg, args);
                                        } else {
                                            m3u8gglj = urlFromArgBy;
                                            try {
                                                if (wzm3u8.test(m3u8gglj) && !mp4wz.test(m3u8gglj) && !flvwz.test(m3u8gglj) && !tswz.test(m3u8gglj) && !playsharewz.test(m3u8gglj)) {
                                                    m3u8bflj = m3u8gglj;
                                                }
                                            } catch (e) {}
                                            thisArg.addEventListener('readystatechange', async function() {
                                                if (thisArg.readyState !== 4) {
                                                    return;
                                                }
                                                const type = thisArg.responseType;
                                                if (type !== '' && type !== 'text') {
                                                    return;
                                                }
                                                const textin = thisArg.responseText;
                                                try {
                                                    if (M3umatch(textin)) {
                                                        return;
                                                    }
                                                } catch (e) {}
                                                const textout = pruner(textin, item);
                                                try {
                                                    if (M3umatch(textout)) {
                                                        return;
                                                    }
                                                } catch (e) {}
                                                try {
                                                    textout = prunerm3u8(textout);
                                                } catch (e) {}
                                                if (textout !== textin) {
                                                    Reflect.defineProperty(thisArg, 'response', {
                                                        value: textout
                                                    });
                                                    Reflect.defineProperty(thisArg, 'responseText', {
                                                        value: textout
                                                    });
                                                }
                                            });
                                            return Reflect.apply(target, thisArg, args);
                                        }
                                    } else {
                                        return Reflect.apply(target, thisArg, args);
                                    }
                                } else {
                                    return Reflect.apply(target, thisArg, args);
                                }
                            } catch (e) {
                                return Reflect.apply(target, thisArg, args);
                            }
                        }
                    });
                }
            } catch (e) {}
        }
    } catch (e) {}
}
)();