/**
 * 花都影视 (hdys) - 蜂蜜影视 / FongMi QuickJS Spider
 * 域名可按发布页自行修改 host
 *
 * 配置示例:
 * {
 *   "key": "hdys",
 *   "name": "花都",
 *   "type": 3,
 *   "api": "./hdys.js",
 *   "searchable": 1,
 *   "quickSearch": 1,
 *   "changeable": 0
 * }
 */

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
// 打不开时按发布页改域名，例如 https://hd3.huaduys.org
const host = 'https://hd.huaduys.org';

function header(extra) {
    const h = {
        'User-Agent': UA,
        'Referer': host + '/',
        'Accept-Language': 'zh-CN,zh;q=0.9',
    };
    if (extra) {
        for (const k in extra) h[k] = extra[k];
    }
    return h;
}

async function request(url) {
    const res = await req(url, {
        method: 'GET',
        headers: header(),
        timeout: 20000,
    });
    if (typeof res === 'string') return res;
    if (res && typeof res.content === 'string') return res.content;
    if (res && typeof res.data === 'string') return res.data;
    if (res && res.body) return String(res.body);
    return String(res || '');
}

function absUrl(href) {
    if (!href) return '';
    if (href.indexOf('http') === 0) return href;
    if (href.charAt(0) === '/') return host + href;
    return host + '/' + href;
}

function cleanText(s) {
    s = String(s || '');
    // 解码 HTML 数字实体 &#26080; / &#x4e00;
    s = s.replace(/&#(\d+);/g, function (_, n) {
        try { return String.fromCharCode(parseInt(n, 10)); } catch (e) { return ''; }
    });
    s = s.replace(/&#x([0-9a-fA-F]+);/gi, function (_, n) {
        try { return String.fromCharCode(parseInt(n, 16)); } catch (e) { return ''; }
    });
    // 常见命名实体
    s = s.replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&middot;/g, '·');
    s = s.replace(/<[^>]+>/g, '');
    return s.replace(/\s+/g, ' ').trim();
}

function base64Decode(str) {
    if (!str) return '';
    try {
        if (typeof atob === 'function') return atob(str);
    } catch (e) {}
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var output = '';
    str = String(str).replace(/[^A-Za-z0-9+/=]/g, '');
    for (var i = 0; i < str.length; i += 4) {
        var enc1 = chars.indexOf(str.charAt(i));
        var enc2 = chars.indexOf(str.charAt(i + 1));
        var enc3 = chars.indexOf(str.charAt(i + 2));
        var enc4 = chars.indexOf(str.charAt(i + 3));
        var chr1 = (enc1 << 2) | (enc2 >> 4);
        var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        var chr3 = ((enc3 & 3) << 6) | enc4;
        output += String.fromCharCode(chr1);
        if (enc3 !== 64 && enc3 !== -1) output += String.fromCharCode(chr2);
        if (enc4 !== 64 && enc4 !== -1) output += String.fromCharCode(chr3);
    }
    return output;
}

function urlDecode(str) {
    try {
        return decodeURIComponent(str);
    } catch (e) {
        try {
            return unescape(str);
        } catch (e2) {
            return str;
        }
    }
}


/**
 * 解析 stui 列表
 * 优先: .stui-vodlist__detail h4 a 文本
 * 其次: .stui-vodlist__thumb 的 title 属性
 */
function parseList(html) {
    const list = [];
    if (!html || html.length < 200) return list;
    const seen = {};

    // 按 li 拆（兼容有无 class）
    const parts = html.split(/<li(?:\s[^>]*)?>/i);
    for (let i = 1; i < parts.length; i++) {
        const chunk = parts[i].substring(0, 2500);
        // 必须是视频卡片
        if (chunk.indexOf('stui-vodlist__thumb') < 0 && chunk.indexOf('voddetail') < 0) continue;

        // 链接
        let href = '';
        const hrefM = chunk.match(/stui-vodlist__thumb[^>]*href=["']([^"']+)["']/i) ||
            chunk.match(/href=["']([^"']*voddetail[^"']+)["']/i);
        if (hrefM) href = absUrl(hrefM[1]);
        if (!href || seen[href]) continue;

        // 标题：优先 detail 里的 h4/title 链接文字
        let title = '';
        const t1 = chunk.match(/stui-vodlist__detail[\s\S]{0,300}?<h4[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
        if (t1) title = cleanText(t1[1]);
        if (!title) {
            const t2 = chunk.match(/class=["'][^"']*title[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
            if (t2) title = cleanText(t2[1]);
        }
        // 其次 thumb 的 title 属性（属性顺序不限）
        if (!title) {
            const t3 = chunk.match(/stui-vodlist__thumb[^>]*\btitle=["']([^"']+)["']/i);
            if (t3) title = cleanText(t3[1]);
        }
        // 再试 a 标签上的 title
        if (!title) {
            const t4 = chunk.match(/href=["'][^"']*voddetail[^"']+["'][^>]*\btitle=["']([^"']+)["']/i);
            if (t4) title = cleanText(t4[1]);
        }
        if (!title || title.length < 1) continue;
        // 过滤明显广告
        if (/广告|棋牌|葡京|注册送/.test(title)) continue;

        // 封面：优先 data-original，跳过占位图 load.gif
        let pic = '';
        var picCands = [];
        var pm;
        var pre = /data-original=["']([^"']+)["']/gi;
        while ((pm = pre.exec(chunk)) !== null) picCands.push(pm[1]);
        pre = /data-src=["']([^"']+)["']/gi;
        while ((pm = pre.exec(chunk)) !== null) picCands.push(pm[1]);
        pre = /(?:src)=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi;
        while ((pm = pre.exec(chunk)) !== null) picCands.push(pm[1]);
        for (var pi = 0; pi < picCands.length; pi++) {
            var c = picCands[pi];
            if (!c) continue;
            if (/load\.gif|loading|placeholder|data:image/i.test(c)) continue;
            pic = c;
            break;
        }
        if (pic) {
            if (pic.indexOf('//') === 0) pic = 'https:' + pic;
            else if (pic.indexOf('http') !== 0) pic = absUrl(pic);
            pic = pic.replace(/&amp;/g, '&');
            // 图床防盗链：走图片代理，避免蜂蜜影视不带 Referer 导致裂图
            if (/3010\.top|huaduys|pic\d*\./i.test(pic)) {
                pic = 'https://images.weserv.nl/?url=' + encodeURIComponent(pic) + '&output=jpg';
            }
        }

        // 备注 / 时长
        let remark = '';
        const r1 = chunk.match(/pic-tag-t[^>]*>([\s\S]*?)<\//i);
        if (r1) remark = cleanText(r1[1]);
        let duration = '';
        const d1 = chunk.match(/pic-tag-b[^>]*>([\s\S]*?)<\//i);
        if (d1) duration = cleanText(d1[1]);

        seen[href] = true;
        list.push({
            vod_id: href,
            vod_name: title,
            vod_pic: pic,
            vod_remarks: remark || duration,
        });
    }

    return list;
}

async function home(filter) {
    try {
        const html = await request(host + '/');
        const classes = [];
        const ignore = ['首页', 'APP', 'PornDude', '留言', '求片', '专题', '排行'];
        const linkRe = /href=["']([^"']*vodtype\/\d+\.html)["'][^>]*>([\s\S]*?)<\/a>/gi;
        let m;
        const seen = {};
        while ((m = linkRe.exec(html)) !== null) {
            const href = m[1];
            const name = cleanText(m[2]);
            if (!name || seen[name]) continue;
            if (ignore.some(function (x) { return name.indexOf(x) >= 0; })) continue;
            seen[name] = true;
            classes.push({
                type_id: absUrl(href),
                type_name: name,
            });
        }
        if (classes.length === 0) {
            ['1', '2', '3', '4', '20'].forEach(function (id, idx) {
                const names = ['电影', '剧集', '综艺', '动漫', '伦理'];
                classes.push({
                    type_id: host + '/vodtype/' + id + '.html',
                    type_name: names[idx] || ('分类' + id),
                });
            });
        }
        return JSON.stringify({ class: classes });
    } catch (e) {
        return JSON.stringify({ class: [], msg: String(e) });
    }
}

async function homeVod() {
    try {
        const html = await request(host + '/');
        return JSON.stringify({ list: parseList(html).slice(0, 24) });
    } catch (e) {
        return JSON.stringify({ list: [] });
    }
}

async function category(tid, pg, filter, extend) {
    try {
        pg = String(pg || '1');
        let typeurl = String(tid || '');
        let id = '1';
        const idM = typeurl.match(/vodtype\/(\d+)/);
        if (idM) id = idM[1];
        else if (/^\d+$/.test(typeurl)) id = typeurl;

        const url = host + '/vodshow/' + id + '--------' + pg + '---.html';
        const html = await request(url);
        const list = parseList(html);
        return JSON.stringify({
            list: list,
            page: parseInt(pg, 10) || 1,
            pagecount: list.length >= 10 ? 999 : (parseInt(pg, 10) || 1),
            limit: list.length || 20,
            total: list.length > 0 ? 99999 : 0,
        });
    } catch (e) {
        return JSON.stringify({ list: [], page: 1, pagecount: 1, limit: 0, total: 0, msg: String(e) });
    }
}

async function detail(id) {
    try {
        const url = absUrl(String(id));
        const html = await request(url);

        let name = '';
        const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        if (h1) name = cleanText(h1[1]);
        if (!name) {
            const tm = html.match(/<title>([^|<]+)/i);
            if (tm) name = cleanText(tm[1]);
        }

        const eps = [];
        const seen = {};

        // 1) 播放列表
        const playlistBlocks = html.match(/stui-content__playlist[\s\S]*?<\/ul>/gi) || [];
        playlistBlocks.forEach(function (section) {
            const aRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
            let a;
            while ((a = aRe.exec(section)) !== null) {
                var href = absUrl(a[1]);
                var t = cleanText(a[2]) || '播放';
                if (seen[href]) continue;
                seen[href] = true;
                eps.push(t + '$' + href);
            }
        });

        // 2) 任意 vodplay 链接
        if (eps.length === 0) {
            const re = /href=["']([^"']*vodplay\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
            let a;
            while ((a = re.exec(html)) !== null) {
                var href = absUrl(a[1]);
                var t = cleanText(a[2]) || '播放';
                if (seen[href]) continue;
                seen[href] = true;
                eps.push(t + '$' + href);
            }
        }

        // 3) 按钮
        if (eps.length === 0) {
            const btnM = html.match(/stui-pannel-box[\s\S]{0,300}?h5[\s\S]{0,100}?<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
            if (btnM) {
                eps.push((cleanText(btnM[2]) || '播放') + '$' + absUrl(btnM[1]));
            }
        }

        // 4) 由详情页推断播放页: /voddetail/28190.html -> /vodplay/28190-1-1.html
        if (eps.length === 0) {
            const idM = url.match(/voddetail\/(\d+)/) || String(id).match(/voddetail\/(\d+)/) || String(id).match(/(\d{3,})/);
            if (idM) {
                eps.push('第1集$' + host + '/vodplay/' + idM[1] + '-1-1.html');
            } else {
                eps.push('播放$' + url);
            }
        }

        return JSON.stringify({
            list: [{
                vod_id: id,
                vod_name: name || String(id),
                vod_play_from: '花都',
                vod_play_url: eps.join('#'),
            }],
        });
    } catch (e) {
        return JSON.stringify({ list: [] });
    }
}

async function play(flag, id, flags) {
    try {
        let url = absUrl(String(id));
        var playUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
        var playHdr = {
            'User-Agent': playUA,
            'Referer': host + '/',
            'Origin': host,
        };

        // 若误传详情页，转成播放页
        if (/voddetail\/(\d+)/.test(url) && url.indexOf('vodplay') < 0) {
            var mid = url.match(/voddetail\/(\d+)/)[1];
            url = host + '/vodplay/' + mid + '-1-1.html';
        }

        if (/\.m3u8(\?|$)/i.test(url) || /\.mp4(\?|$)/i.test(url)) {
            return JSON.stringify({
                parse: 0,
                jx: 0,
                url: url,
                header: playHdr,
            });
        }

        const html = await request(url);
        let playUrl = '';
        let encrypt = 0;

        // 兼容 player_data / player_aaaa
        let jsonStr = '';
        var m = html.match(/player_data\s*=\s*(\{[\s\S]*?\})\s*;?\s*</) ||
            html.match(/var\s+player_data\s*=\s*(\{[\s\S]*?\})/) ||
            html.match(/player_aaaa\s*=\s*(\{[\s\S]*?\})\s*;?\s*</) ||
            html.match(/var\s+player_aaaa\s*=\s*(\{[\s\S]*?\})/);
        if (m) jsonStr = m[1];
        // 再兜底：整页搜 "encrypt"
        if (!jsonStr) {
            m = html.match(/\{[^{}]*"encrypt"\s*:\s*\d+[^{}]*"url"\s*:\s*"[^"]+"[^{}]*\}/);
            if (!m) m = html.match(/\{[^{}]*"url"\s*:\s*"[^"]+"[^{}]*"encrypt"\s*:\s*\d+[^{}]*\}/);
            if (m) jsonStr = m[0];
        }

        if (jsonStr) {
            const urlM = jsonStr.match(/"url"\s*:\s*"((?:\\.|[^"\\])*)"/);
            if (urlM) {
                playUrl = urlM[1]
                    .replace(/\\u0026/g, '&')
                    .replace(/\\\//g, '/')
                    .replace(/\\"/g, '"')
                    .replace(/\\/g, '');
            }
            const encM = jsonStr.match(/"encrypt"\s*:\s*(\d+)/);
            if (encM) encrypt = parseInt(encM[1], 10) || 0;
        }

        // encrypt 解码：本站 encrypt=2 => base64 后再 URL decode
        if (playUrl && (encrypt >= 1 || (!/^https?:\/\//i.test(playUrl) && !/\.m3u8|\.mp4/i.test(playUrl)))) {
            try {
                var decoded = base64Decode(playUrl);
                if (encrypt >= 2 || encrypt === 0 || /%[0-9a-fA-F]{2}/.test(decoded)) {
                    if (/%[0-9a-fA-F]{2}/.test(decoded)) {
                        decoded = urlDecode(decoded);
                    }
                }
                if (decoded && (/^https?:\/\//i.test(decoded) || /\.m3u8|\.mp4/i.test(decoded))) {
                    playUrl = decoded;
                } else if (decoded && encrypt >= 1) {
                    playUrl = decoded;
                }
            } catch (e) {}
        }

        if (playUrl && playUrl.indexOf('//') === 0) playUrl = 'https:' + playUrl;

        if (!playUrl || !/^https?:\/\//i.test(playUrl)) {
            const m3 = html.match(/(https?:\/\/[^"'\s<>]+?\.m3u8[^"'\s<>]*)/i) ||
                html.match(/(https?:\/\/[^"'\s<>]+?\.mp4[^"'\s<>]*)/i);
            if (m3) playUrl = m3[1];
        }

        if (!playUrl) {
            return JSON.stringify({ parse: 0, url: '', msg: '未解析到播放地址' });
        }

        return JSON.stringify({
            parse: 0,
            jx: 0,
            url: playUrl,
            header: playHdr,
        });
    } catch (e) {
        return JSON.stringify({ parse: 0, url: '', msg: String(e) });
    }
}

async function search(wd, quick, pg) {
    try {
        pg = String(pg || '1');
        const url = host + '/vodsearch/' + encodeURIComponent(wd) + '----------' + pg + '---.html';
        const html = await request(url);
        const list = parseList(html);
        return JSON.stringify({
            list: list,
            page: parseInt(pg, 10) || 1,
            pagecount: list.length >= 10 ? 999 : 1,
            limit: list.length || 20,
            total: list.length > 0 ? 99999 : 0,
        });
    } catch (e) {
        return JSON.stringify({ list: [] });
    }
}

const spider = {
    home: home,
    homeVod: homeVod,
    category: category,
    detail: detail,
    play: play,
    search: search,
};

export default spider;

export function __jsEvalReturn() {
    return spider;
}
