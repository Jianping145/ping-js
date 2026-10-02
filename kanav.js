/**
 * KanAV - 蜂蜜影视 / FongMi QuickJS Spider
 * 永久域名: https://kanav.ad
 * 备用: https://m1.kanav.fun
 *
 * 配置示例:
 * {
 *   "key": "kanav",
 *   "name": "KanAV",
 *   "type": 3,
 *   "api": "https://raw.githubusercontent.com/xxx/kanav.js",
 *   "searchable": 1,
 *   "quickSearch": 1,
 *   "changeable": 0,
 *   "header": "{\"User-Agent\":\"Mozilla/5.0\",\"Referer\":\"https://kanav.ad/\"}"
 * }
 */

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1';
const host = 'https://kanav.ad';

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
    s = s.replace(/&#(\d+);/g, function (_, n) {
        try { return String.fromCharCode(parseInt(n, 10)); } catch (e) { return ''; }
    });
    s = s.replace(/&#x([0-9a-fA-F]+);/gi, function (_, n) {
        try { return String.fromCharCode(parseInt(n, 16)); } catch (e) { return ''; }
    });
    s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
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
    try { return decodeURIComponent(str); } catch (e) {
        try { return unescape(str); } catch (e2) { return str; }
    }
}

function parseList(html) {
    const list = [];
    if (!html || html.length < 200) return list;
    const seen = {};

    // 按 col-md-3 / video-item 拆
    var parts = html.split(/class="[^"]*col-md-3[^"]*"/i);
    if (parts.length < 2) parts = html.split(/class="[^"]*video-item[^"]*"/i);

    for (var i = 1; i < parts.length; i++) {
        var chunk = parts[i].substring(0, 3000);

        var href = '';
        var hrefM = chunk.match(/entry-title[\s\S]{0,80}?<a[^>]+href=["']([^"']+)["']/i) ||
            chunk.match(/href=["']([^"']*vod\/(?:detail|play)\/[^"']+)["']/i);
        if (hrefM) href = absUrl(hrefM[1]);
        if (!href || seen[href]) continue;

        var title = '';
        var tM = chunk.match(/entry-title[\s\S]{0,120}?<a[^>]*title=["']([^"']+)["']/i);
        if (tM) title = cleanText(tM[1]);
        if (!title) {
            tM = chunk.match(/entry-title[\s\S]{0,120}?<a[^>]*>([\s\S]*?)<\/a>/i);
            if (tM) title = cleanText(tM[1]);
        }
        if (!title) continue;

        var pic = '';
        var pM = chunk.match(/data-original=["']([^"']+)["']/i) ||
            chunk.match(/data-src=["']([^"']+)["']/i);
        if (pM) pic = pM[1].replace(/&amp;/g, '&');
        if (pic && /load\.gif|loading|placeholder/i.test(pic)) pic = '';
        if (!pic) {
            pM = chunk.match(/src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
            if (pM && !/load\.gif/i.test(pM[1])) pic = pM[1];
        }
        if (pic) {
            if (pic.indexOf('//') === 0) pic = 'https:' + pic;
            else if (pic.indexOf('http') !== 0) pic = absUrl(pic);
            // 图床代理（防盗链）
            if (/11yun\.|kanav|img\./i.test(pic)) {
                pic = pic.replace(/^https?:\/\//i, 'https://i0.wp.com/');
            }
        }

        var remark = '';
        var rM = chunk.match(/model-view-left[^>]*>([\s\S]*?)<\//i);
        if (rM) remark = cleanText(rM[1]);
        var duration = '';
        var dM = chunk.match(/span[^>]*class=["'][^"']*model-view["'][^>]*>([\s\S]*?)<\//i);
        if (dM) duration = cleanText(dM[1]);

        seen[href] = true;
        list.push({
            vod_id: href,
            vod_name: title,
            vod_pic: pic,
            vod_remarks: remark || duration,
        });
    }

    // 兜底：全局正则
    if (list.length === 0) {
        var re = /href=["']([^"']*vod\/(?:detail|play)\/[^"']+)["'][^>]*title=["']([^"']+)["'][\s\S]{0,800}?data-original=["']([^"']+)["']/gi;
        var m;
        while ((m = re.exec(html)) !== null) {
            var h = absUrl(m[1]);
            if (seen[h]) continue;
            seen[h] = true;
            var pic2 = m[3].replace(/&amp;/g, '&');
            if (/11yun\.|img\./i.test(pic2)) {
                pic2 = pic2.replace(/^https?:\/\//i, 'https://i0.wp.com/');
            }
            list.push({
                vod_id: h,
                vod_name: cleanText(m[2]),
                vod_pic: pic2,
                vod_remarks: '',
            });
        }
    }

    return list;
}

async function home(filter) {
    return JSON.stringify({
        class: [
            { type_id: '1', type_name: '中文字幕' },
            { type_id: '2', type_name: '日韩有码' },
            { type_id: '3', type_name: '日韩无码' },
            { type_id: '4', type_name: '国产AV' },
            { type_id: '30', type_name: '自拍泄密' },
            { type_id: '31', type_name: '探花约炮' },
            { type_id: '32', type_name: '主播录制' },
            { type_id: '20', type_name: '动漫番剧' },
        ],
    });
}

async function homeVod() {
    try {
        const html = await request(host + '/index.php/vod/type/id/1/page/1.html');
        return JSON.stringify({ list: parseList(html).slice(0, 24) });
    } catch (e) {
        return JSON.stringify({ list: [] });
    }
}

async function category(tid, pg, filter, extend) {
    try {
        pg = String(pg || '1');
        const id = String(tid || '1');
        const url = host + '/index.php/vod/type/id/' + id + '/page/' + pg + '.html';
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
        let url = absUrl(String(id));
        // 列表直接给的是 play 页，也可从 detail 转 play
        if (/vod\/detail\/id\/(\d+)/.test(url)) {
            const mid = url.match(/vod\/detail\/id\/(\d+)/)[1];
            url = host + '/index.php/vod/play/id/' + mid + '/sid/1/nid/1.html';
        }

        let name = '';
        try {
            const html = await request(url);
            const tm = html.match(/<title>([^|<]+)/i);
            if (tm) name = cleanText(tm[1]);
            const nm = html.match(/"vod_name"\s*:\s*"((?:\\.|[^"\\])*)"/);
            if (nm) {
                try {
                    name = JSON.parse('"' + nm[1] + '"');
                } catch (e) {
                    name = cleanText(nm[1]);
                }
            }
        } catch (e) {}

        return JSON.stringify({
            list: [{
                vod_id: id,
                vod_name: name || String(id),
                vod_play_from: 'KanAV',
                vod_play_url: '播放$' + url,
            }],
        });
    } catch (e) {
        return JSON.stringify({ list: [] });
    }
}

async function play(flag, id, flags) {
    try {
        let url = absUrl(String(id));
        if (/\.m3u8(\?|$)/i.test(url) || /\.mp4(\?|$)/i.test(url)) {
            return JSON.stringify({
                parse: 0,
                jx: 0,
                url: url,
                header: header({ Referer: host + '/' }),
            });
        }

        // detail -> play
        if (/vod\/detail\/id\/(\d+)/.test(url)) {
            const mid = url.match(/vod\/detail\/id\/(\d+)/)[1];
            url = host + '/index.php/vod/play/id/' + mid + '/sid/1/nid/1.html';
        }

        const html = await request(url);
        let playUrl = '';
        let encrypt = 0;

        let jsonStr = '';
        var m = html.match(/player_aaaa\s*=\s*(\{[\s\S]*?\})\s*;?\s*</) ||
            html.match(/var\s+player_aaaa\s*=\s*(\{[\s\S]*?\})/);
        if (m) jsonStr = m[1];

        if (jsonStr) {
            // 取真正的播放 url（可能有多个 "url" 字段，取含 base64/长串的）
            var urlMatches = jsonStr.match(/"url"\s*:\s*"((?:\\.|[^"\\])*)"/g) || [];
            for (var ui = 0; ui < urlMatches.length; ui++) {
                var um = urlMatches[ui].match(/"url"\s*:\s*"((?:\\.|[^"\\])*)"/);
                if (um && um[1] && um[1].length > 20) {
                    playUrl = um[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/\\/g, '');
                }
            }
            if (!playUrl && urlMatches.length) {
                var um0 = urlMatches[0].match(/"url"\s*:\s*"((?:\\.|[^"\\])*)"/);
                if (um0) playUrl = um0[1];
            }
            var encM = jsonStr.match(/"encrypt"\s*:\s*(\d+)/);
            if (encM) encrypt = parseInt(encM[1], 10) || 0;
        }

        // encrypt=2: base64 + urldecode
        if (playUrl && (encrypt >= 1 || (!/^https?:\/\//i.test(playUrl) && !/\.m3u8|\.mp4/i.test(playUrl)))) {
            try {
                var decoded = base64Decode(playUrl);
                if (/%[0-9a-fA-F]{2}/.test(decoded) || encrypt >= 2) {
                    decoded = urlDecode(decoded);
                }
                if (decoded && (/^https?:\/\//i.test(decoded) || /\.m3u8|\.mp4/i.test(decoded))) {
                    playUrl = decoded;
                }
            } catch (e) {}
        }

        if (playUrl && playUrl.indexOf('//') === 0) playUrl = 'https:' + playUrl;

        if (!playUrl || !/^https?:\/\//i.test(playUrl)) {
            var m3 = html.match(/(https?:\/\/[^"'\s<>]+?\.m3u8[^"'\s<>]*)/i);
            if (m3) playUrl = m3[1];
        }

        if (!playUrl) {
            return JSON.stringify({ parse: 0, url: '', msg: '未解析到播放地址' });
        }

        return JSON.stringify({
            parse: 0,
            jx: 0,
            url: playUrl,
            header: {
                'User-Agent': UA,
                'Referer': host + '/',
                'Origin': host,
            },
        });
    } catch (e) {
        return JSON.stringify({ parse: 0, url: '', msg: String(e) });
    }
}

async function search(wd, quick, pg) {
    try {
        pg = String(pg || '1');
        const url = host + '/index.php/vod/search/by/time_add/page/' + pg + '/wd/' + encodeURIComponent(wd) + '.html';
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
