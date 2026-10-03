/**
 * 91JAV - 猫源 JS（参考可用 Python 版改写）
 * 特点：
 * 1) 自动从 GitLab README / 发布页解析最新可用 host
 * 2) 图片走 localProxy 代理并尝试 AES 解密（与 Python 版一致）
 * 3) 列表/详情/搜索/播放逻辑对齐 Python 版
 */
const HOSTS = [
    'https://cabin.zbywlcc.com',
    'https://born.zbywlcc.com',
    'https://d1nqsse6ono4lc.cloudfront.net',
];
let host = HOSTS[0];
const READMES = [
    'https://gitlab.com/91JAV2/dz/-/raw/main/README.md',
    'https://gitlab.com/91jav1/dz/-/raw/main/README.md',
];
const AES_KEY = 'f5d965df75336270';
const AES_IV = '97b60394abc2fbe1';
const UA = 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
let _readmeDone = false;
let _imgCache = {};

function headers() {
    return {
        'User-Agent': UA,
        Referer: host + '/',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
    };
}

function abs(p) {
    if (!p) return '';
    if (/^https?:\/\//i.test(p)) return p;
    return host + (p.startsWith('/') ? p : '/' + p);
}

function b64encode(str) {
    try {
        if (typeof btoa === 'function') return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {}
    return '';
}

function b64decode(str) {
    try {
        if (typeof atob === 'function') return decodeURIComponent(escape(atob(str)));
    } catch (e) {}
    return '';
}

function aesDecryptBytes(data) {
    try {
        if (typeof CryptoJS !== 'undefined' && CryptoJS.AES) {
            const key = CryptoJS.enc.Utf8.parse(AES_KEY);
            const iv = CryptoJS.enc.Utf8.parse(AES_IV);
            const decrypted = CryptoJS.AES.decrypt({ ciphertext: CryptoJS.lib.WordArray.create(data) }, key, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            });
            const arr = CryptoJS.enc.Uint8 ? CryptoJS.enc.Uint8.stringify ? null : null : null;
            // 兼容写法：转 hex 再转 bytes
            const hex = decrypted.toString(CryptoJS.enc.Hex);
            const out = new Uint8Array(hex.length / 2);
            for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
            return out;
        }
    } catch (e) {}
    return null;
}

function isValidHtml(body) {
    return !!body && (
        body.indexOf('/videos/') >= 0 ||
        body.indexOf('bind_video_img') >= 0 ||
        body.indexOf('video-img-box') >= 0 ||
        body.indexOf('video-img') >= 0
    );
}

async function rawRequest(url) {
    const res = await req(url, { headers: headers() });
    return typeof res === 'string' ? res : res && res.content ? res.content : '';
}

async function request(url) {
    url = String(url || '');
    let last = '';
    for (let attempt = 0; attempt < 2; attempt++) {
        for (const h of HOSTS) {
            try {
                const u = url.startsWith('http') ? url.replace(/^https?:\/\/[^/]+/, h) : h + (url.startsWith('/') ? url : '/' + url);
                const body = await rawRequest(u);
                if (isValidHtml(body)) {
                    host = h;
                    return body;
                }
                if (body) last = body;
            } catch (e) {}
        }
        if (attempt === 0) await resolveReadme();
    }
    return last;
}

async function resolveReadme() {
    if (_readmeDone) return;
    _readmeDone = true;
    for (const ru of READMES) {
        try {
            const txt = await rawRequest(ru);
            if (!txt) continue;
            const targets = [];
            let m = txt.match(/91JAV\s*国内备用地址\s*[：:]\s*(https?:\/\/[^\s<>"')]+)/);
            if (m) targets.push(['redirect', m[1].replace(/\/$/, '')]);
            m = txt.match(/91JAV\s*国内最新网址\s+(https?:\/\/[^\s<>"')]+)/);
            if (m) targets.push(['publish', m[1].replace(/\/$/, '')]);
            m = txt.match(/91JAV\s*海外永久地址[^v]*?（需要VPN）\s*(https?:\/\/[^\s<>"')]+)/);
            if (m) targets.push(['direct', m[1].replace(/\/$/, '')]);
            for (const [typ, u] of targets) {
                if (!u || HOSTS.indexOf(u) >= 0 || /gitlab|t\.me|app|msugpac|pm\.me/i.test(u)) continue;
                try {
                    if (typ === 'redirect') {
                        const body = await rawRequest(u);
                        const fm = u.match(/^(https?:\/\/[^/]+)/);
                        const final = fm ? fm[1] : u;
                        if (body && (body.indexOf('bind_video_img') >= 0 || body.indexOf('/videos/') >= 0) && HOSTS.indexOf(final) < 0) HOSTS.push(final);
                    } else if (typ === 'publish') {
                        const body = await rawRequest(u);
                        if (!body) continue;
                        const urls = body.match(/https?:\/\/[^"'<>\s]+/g) || [];
                        for (let lu of urls) {
                            lu = lu.replace(/['".,;]+$/, '');
                            if ((lu.indexOf('cloudfront') >= 0 || lu.indexOf('zbywlcc') >= 0 || lu.indexOf('okknubyz') >= 0 || lu.indexOf('gyqspl') >= 0 || lu.indexOf('ehmcfx') >= 0) && HOSTS.indexOf(lu) < 0) HOSTS.push(lu);
                        }
                    } else {
                        const body = await rawRequest(u + '/theme/detail/3/update/');
                        const fm = u.match(/^(https?:\/\/[^/]+)/);
                        const final = fm ? fm[1] : u;
                        if (body && (body.indexOf('bind_video_img') >= 0 || body.indexOf('/videos/') >= 0) && HOSTS.indexOf(final) < 0) HOSTS.push(final);
                    }
                } catch (e) {}
            }
        } catch (e) {}
    }
}

function proxyPic(url) {
    const u = abs(url);
    if (!u) return '';
    if (u.indexOf('assets/images/categories') >= 0) return u;
    const b64 = b64encode(u);
    try {
        const proxy = getProxyUrl() + '&url=' + b64 + '&type=img';
        if (proxy && proxy.indexOf('http') === 0) return proxy;
    } catch (e) {}
    return 'localProxy?type=img&url=' + b64;
}

function localProxy(param) {
    const type = (param && param.type) || '';
    if (type !== 'img') return [404, 'text/plain', '', ''];
    try {
        const u = b64decode(String(param.url || ''));
        if (!u) return [404, 'text/plain', '', ''];
        if (_imgCache[u]) return [200, 'image/jpeg', _imgCache[u], ''];
        // JS 环境无法直接 requests，这里依赖 req 抓二进制
        const res = req(u, { headers: { 'User-Agent': UA, Referer: host + '/' }, binary: true });
        const data = typeof res === 'string' ? res : res && res.content ? res.content : '';
        if (!data) return [404, 'text/plain', '', ''];
        let out = data;
        const dec = aesDecryptBytes(data);
        if (dec && dec.length > 4) {
            const jpg = dec[0] === 0xFF && dec[1] === 0xD8 && dec[2] === 0xFF;
            const png = dec[0] === 0x89 && dec[1] === 0x50 && dec[2] === 0x4E && dec[3] === 0x47;
            const gif = dec[0] === 0x47 && dec[1] === 0x49 && dec[2] === 0x46;
            if (jpg || png || gif) out = dec;
        }
        _imgCache[u] = out;
        return [200, 'image/jpeg', out, ''];
    } catch (e) {
        return [500, 'text/plain', '', ''];
    }
}

function parseList(html) {
    const out = [];
    const seen = {};
    const parts = String(html || '').split('bind_video_img');
    for (let i = 1; i < parts.length; i++) {
        const b = parts[i];
        const m = b.match(/<a\s+href="([^"]*videos\/[^"]+)"[^>]*>/);
        if (!m) continue;
        const href = abs(m[1]);
        if (seen[href]) continue;
        seen[href] = 1;
        const im = b.match(/<img[^>]*?(?:z-image-loader-url|data-src|src)="([^"]*)"/);
        const pic = im ? proxyPic(im[1]) : '';
        let name = '';
        const nm = b.match(/<h3[^>]*class="[^"]*title[^"]*"[^>]*>\s*<a[^>]*>([^<]+)<\/a>/);
        if (nm) name = nm[1].replace(/\s+/g, ' ').trim();
        if (!name) {
            const am = b.match(/<img[^>]*alt="([^"]*)"/);
            if (am) name = am[1];
        }
        if (!name) name = href.split('/').pop();
        let remarks = '';
        const rm = b.match(/<span class="label">([^<]+)<\/span>/);
        if (rm && rm[1].indexOf('广告') < 0) remarks = rm[1];
        out.push({ vod_id: href, vod_name: name, vod_pic: pic, vod_remarks: remarks });
    }
    return out;
}

function parseTheme(html) {
    const out = [];
    const seen = {};
    const re = /<a href="\/theme\/detail\/(\d+)\/([a-z]*)"[^>]*>\s*<div class="overlay"><\/div>\s*<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"(.*?)<\/a>/gs;
    let m;
    while ((m = re.exec(html || '')) !== null) {
        const tid = m[1];
        if (seen[tid]) continue;
        seen[tid] = 1;
        const name = (m[4] || '').trim();
        const pic = abs(m[3]);
        const seg = m[5] || '';
        const cm = seg.match(/<span class="label">(\d+)\s*部影片<\/span>/);
        const remarks = cm ? cm[1] + ' 部影片' : '';
        out.push({ vod_id: 'theme$' + tid, vod_name: name, vod_pic: pic, vod_remarks: remarks, vod_tag: 'folder' });
    }
    return out;
}

function parseActress(html) {
    const out = [];
    const seen = {};
    const re = /<a href="\/actress\/detail\/(\d+)\/([a-z]+)"[^>]*>\s*<div class="media">(.*?)<\/a>/gs;
    let m;
    while ((m = re.exec(html || '')) !== null) {
        const aid = m[1];
        if (seen[aid]) continue;
        seen[aid] = 1;
        const seg = m[3] || '';
        const nm = seg.match(/alt="([^"]*)"/);
        const name = nm ? nm[1] : '女优' + aid;
        const pm = seg.match(/z-image-loader-url="([^"]*)"/);
        const pic = pm ? proxyPic(pm[1]) : '';
        const cm = seg.match(/<span>(\d+)\s*部影片<\/span>/);
        const remarks = cm ? cm[1] + ' 部影片' : '';
        out.push({ vod_id: 'actress$' + aid, vod_name: name, vod_pic: pic, vod_remarks: remarks, vod_tag: 'folder' });
    }
    return out;
}

function pageUrl(tid, pg, sort) {
    pg = parseInt(pg || 1, 10) || 1;
    tid = String(tid || '/new');
    sort = sort || '';
    if (tid.startsWith('theme$')) {
        const t = tid.split('$')[1];
        const st = ['hot', 'update', 'watch', 'favorite'].indexOf(sort) >= 0 ? sort : 'update';
        return pg > 1 ? '/theme/detail/' + t + '/' + st + '/' + pg + '/' : '/theme/detail/' + t + '/' + st + '/';
    }
    if (tid.startsWith('actress$')) {
        const a = tid.split('$')[1];
        const st = ['hot', 'latest', 'watch', 'favorite'].indexOf(sort) >= 0 ? sort : 'latest';
        return pg > 1 ? '/actress/detail/' + a + '/' + st + '/' + pg + '/' : '/actress/detail/' + a + '/' + st + '/';
    }
    if (tid === '/theme') {
        const st = ['sort', 'check_num', 'count'].indexOf(sort) >= 0 ? sort : 'sort';
        return pg > 1 ? '/theme/' + st + '/' + pg + '/' : '/theme/' + st + '/';
    }
    if (tid === '/actress/hot') {
        const st = ['hot', 'count'].indexOf(sort) >= 0 ? sort : 'hot';
        return pg > 1 ? '/actress/' + st + '/' + pg + '/' : '/actress/' + st + '/';
    }
    let base = tid.replace(/\/$/, '');
    if (['hot', 'update', 'watch', 'favorite'].indexOf(sort) >= 0) {
        base = base.replace(/\/(hot|update|watch|favorite)$/, '/' + sort);
    }
    return pg > 1 ? base + '/' + pg + '/' : base + '/';
}

async function init(cfg) {
    try {
        if (cfg && cfg.ext) {
            const e = typeof cfg.ext === 'string' ? JSON.parse(cfg.ext) : cfg.ext;
            if (e && e.host) {
                host = e.host;
                HOSTS.unshift(host);
            }
        }
    } catch (e) {}
    await resolveReadme();
}

async function home(filter) {
    const classes = [
        { type_id: '/new', type_name: '最新更新' },
        { type_id: '/theme/detail/3/update', type_name: '中文字幕' },
        { type_id: '/theme/detail/11/hot', type_name: '无码高清' },
        { type_id: '/theme', type_name: '专题合集' },
        { type_id: '/actress/hot', type_name: '热门女优' },
    ];
    const filters = {
        '/theme/detail/3/update': [{ key: 'sort', name: '排序', value: [{ n: '近期最佳', v: 'hot' }, { n: '今日更新', v: 'update' }, { n: '最多观看', v: 'watch' }, { n: '最高收藏', v: 'favorite' }] }],
        '/theme/detail/11/hot': [{ key: 'sort', name: '排序', value: [{ n: '近期最佳', v: 'hot' }, { n: '今日更新', v: 'update' }, { n: '最多观看', v: 'watch' }, { n: '最高收藏', v: 'favorite' }] }],
        '/theme': [{ key: 'sort', name: '排序', value: [{ n: '预设排序', v: 'sort' }, { n: '热度优先', v: 'check_num' }, { n: '最多影片', v: 'count' }] }],
        '/actress/hot': [{ key: 'sort', name: '排序', value: [{ n: '热度优先', v: 'hot' }, { n: '最多影片', v: 'count' }] }],
    };
    const html = await request('/new');
    return JSON.stringify({ class: classes, list: parseList(html), filters: filters });
}

async function homeVod() {
    const html = await request('/new');
    return JSON.stringify({ list: parseList(html) });
}

async function category(tid, pg, filter, extend) {
    pg = parseInt(pg || 1, 10) || 1;
    tid = String(tid || '/new');
    let sort = '';
    try {
        const ex = typeof extend === 'string' ? JSON.parse(extend || '{}') : (extend || {});
        sort = ex.sort || '';
    } catch (e) {}
    const html = await request(pageUrl(tid, pg, sort));
    let list = [];
    if (tid === '/actress/hot') list = parseActress(html);
    else if (tid === '/theme') list = parseTheme(html);
    else list = parseList(html);
    const nums = [];
    let m;
    const re1 = /<a[^>]*class="[^"]*page-link[^"]*"[^>]*href="([^"]*)"/g;
    while ((m = re1.exec(html)) !== null) {
        const mm = m[1].match(/\/(\d+)(?:[;?]|$)/);
        if (mm) nums.push(parseInt(mm[1], 10));
    }
    const re2 = /<a[^>]*class="[^"]*page-link[^"]*"[^>]*>\s*(\d+)\s*<\/a>/g;
    while ((m = re2.exec(html)) !== null) nums.push(parseInt(m[1], 10));
    const hasNext = /<a[^>]*rel="next"[^>]*>/.test(html) || html.indexOf('下一页') >= 0;
    let pc = Math.max.apply(null, nums.concat([hasNext ? pg + 1 : pg]));
    if (list.length && pc <= pg) pc = pg + 1;
    return JSON.stringify({ page: pg, pagecount: pc, limit: list.length || 24, total: 0, list: list });
}

async function detail(id) {
    id = String(id || '');
    if (id.startsWith('theme$') || id.startsWith('actress$')) {
        const html = await request(pageUrl(id, 1, ''));
        const list = parseList(html);
        if (list.length) {
            const urls = list.map((v) => v.vod_name + '$' + v.vod_id).join('#');
            return JSON.stringify({
                list: [{
                    vod_id: id,
                    vod_name: id,
                    vod_pic: list[0].vod_pic || '',
                    vod_content: '',
                    vod_play_from: '91JAV',
                    vod_play_url: urls,
                }],
            });
        }
    }
    const url = id.startsWith('http') ? id : abs(id);
    const html = await request(url);
    let title = '';
    let pic = '';
    let desc = '';
    let tags = '';
    let dur = '';
    const v = html.match(/<video[^>]*id="player"[^>]*>/) || html.match(/<video[^>]*class="[^"]*dplayer[^"]*"[^>]*>/);
    if (v) {
        const tag = v[0];
        const tm = tag.match(/data-video_title="([^"]*)"/);
        if (tm) title = tm[1];
        const pm = tag.match(/data-src="([^"]*)"/);
        if (pm) pic = pm[1];
        const tg = tag.match(/data-video_tag_name="([^"]*)"/);
        if (tg) tags = tg[1];
    }
    if (!title) {
        const hm = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
        if (hm) title = hm[1].replace(/<[^>]+>/g, '').trim();
    }
    if (!title) title = id;
    if (!pic) {
        const pm = html.match(/<img[^>]*?z-image-loader-url="([^"]*)"/);
        if (pm) pic = pm[1];
    }
    const jd = html.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/);
    if (jd) {
        const m2 = jd[1].match(/"description"\s*:\s*"([^"]+)"/);
        if (m2) desc = m2[1];
        const m3 = jd[1].match(/"duration"\s*:\s*"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"/);
        if (m3) {
            const hh = parseInt(m3[1] || '0', 10);
            const mm = parseInt(m3[2] || '0', 10);
            const ss = parseInt(m3[3] || '0', 10);
            dur = hh ? ('0' + hh).slice(-2) + ':' + ('0' + mm).slice(-2) + ':' + ('0' + ss).slice(-2) : ('0' + mm).slice(-2) + ':' + ('0' + ss).slice(-2);
        }
    }
    if (!desc) {
        const m2 = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/);
        if (m2) desc = m2[1];
    }
    const remarks = [dur, tags].filter(Boolean).join(' ');
    return JSON.stringify({
        list: [{
            vod_id: id,
            vod_name: title,
            vod_pic: proxyPic(pic),
            vod_content: (desc || '').slice(0, 500),
            vod_remarks: remarks,
            vod_play_from: '91JAV',
            vod_play_url: '正片$' + url,
        }],
    });
}

function extractM3U8(body) {
    const m = body.match(/var\s+hlsUrl\s*=\s*["']([^"']+)/);
    if (m) return m[1].replace(/&amp;/g, '&');
    const ms = body.match(/https?:\/\/[^"'<>\s]+\.(?:m3u8|mp4)[^"'<>\s]*/i);
    if (ms) return ms[0].replace(/&amp;/g, '&');
    return '';
}

async function play(flag, id, flags) {
    let url = String(id || '');
    let last = '';
    const hd = headers();
    for (const h of HOSTS) {
        try {
            let u = url.startsWith('http') ? url : h + url;
            if (u.indexOf('.m3u8') >= 0 || u.indexOf('.mp4') >= 0) {
                return JSON.stringify({ parse: 0, url: u, header: hd });
            }
            const body = await request(u);
            const got = extractM3U8(body);
            if (got) {
                const full = got.startsWith('http') ? got : h + got;
                return JSON.stringify({ parse: 0, url: full, header: hd });
            }
        } catch (e) {}
    }
    return JSON.stringify({ parse: 0, url: url, header: hd });
}

async function search(wd, quick, pg) {
    pg = parseInt(pg || 1, 10) || 1;
    try {
        const key = encodeURIComponent(String(wd || ''));
        let html = await request('/cn/search/' + key);
        const i = html.indexOf('list_videos_common_videos_list');
        if (i >= 0) {
            const j = html.indexOf('</section>', i);
            if (j > i) html = html.slice(i, j);
        }
        return JSON.stringify({ list: parseList(html), page: pg });
    } catch (e) {
        return JSON.stringify({ list: [], page: pg });
    }
}

export function __jsEvalReturn() {
    return {
        init: init,
        home: home,
        homeVod: homeVod,
        category: category,
        detail: detail,
        play: play,
        search: search,
        localProxy: localProxy,
    };
}
