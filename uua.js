/**
 * 有爱爱 - 蜂蜜影视 CatVod JS Spider（经 Cloudflare Worker 代理）
 *
 * 使用前：把 PROXY 改成你部署的 Worker 地址，例如：
 *   const PROXY = 'https://uaa-proxy.你的子域.workers.dev';
 *
 * 接口配置示例：
 * {
 *   "key": "uaa",
 *   "name": "有爱爱",
 *   "type": 3,
 *   "api": "https://xxx/有爱爱.js",
 *   "ext": "https://uaa-proxy.xxx.workers.dev"
 * }
 */
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const HOST = 'https://www.uaa.com';

// 默认代理（部署后务必改成你自己的；也可通过 ext 传入）
let PROXY = '';

const BASE_HEADERS = {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

let siteKey = '';
let siteType = 0;

function joinProxy(targetUrl) {
    if (!PROXY) return targetUrl;
    const base = PROXY.replace(/\/$/, '');
    // 优先 query 模式，兼容性最好
    return base + '/?url=' + encodeURIComponent(targetUrl);
}

function httpGet(url) {
    const real = joinProxy(url);
    let html = '';
    const headers = Object.assign({}, BASE_HEADERS, {
        'Referer': HOST + '/',
        'Origin': HOST,
    });
    try {
        let res = req(real, {
            method: 'get',
            headers: headers,
            timeout: 25000,
        });
        if (typeof res === 'string') {
            html = res;
        } else if (res) {
            html = res.content || res.body || res.data || '';
            if (typeof html !== 'string') html = String(html);
        }
    } catch (e1) {
        try {
            if (typeof request === 'function') {
                html = request(real, { headers: headers });
            }
        } catch (e2) {}
    }
    return html || '';
}

function isChallenge(html) {
    if (!html || html.length < 80) return true;
    return /challenge-platform|Just a moment|cf-mitigated|cf-browser-verification|Checking your browser|Enable JavaScript and cookies|Verify you are human|Perform.*security verification/i.test(html);
}

function parseWithCheerio(html) {
    const list = [];
    try {
        if (typeof load !== 'function') return list;
        const $ = load(html);
        $('li.video_li').each((_, el) => {
            const a = $(el).find('.title a').first();
            let href = a.attr('href') || '';
            let title = (a.text() || '').trim();
            let cover = $(el).find('.cover').attr('src')
                || $(el).find('.cover').attr('data-cfsrc')
                || $(el).find('.cover').attr('data-src')
                || $(el).find('img').attr('src')
                || $(el).find('img').attr('data-src')
                || '';
            let remark = ($(el).find('span').first().text() || '').trim();
            if (!href || !title) return;
            if (href.indexOf('http') !== 0) href = HOST + href;
            if (cover && cover.indexOf('//') === 0) cover = 'https:' + cover;
            else if (cover && cover.indexOf('http') !== 0) cover = HOST + cover;
            list.push({
                vod_id: href,
                vod_name: title,
                vod_pic: cover,
                vod_remarks: remark,
            });
        });
    } catch (e) {}
    return list;
}

function parseWithRegex(html) {
    const list = [];
    const itemRe = /<li[^>]*class="[^"]*video_li[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
    let m;
    while ((m = itemRe.exec(html)) !== null) {
        const block = m[1];
        const hrefM = block.match(/class="[^"]*title[^"]*"[\s\S]{0,200}?<a[^>]*href="([^"]+)"/i)
            || block.match(/<a[^>]*href="([^"]+)"[^>]*>/i);
        const titleM = block.match(/class="[^"]*title[^"]*"[\s\S]{0,200}?<a[^>]*>([\s\S]*?)<\/a>/i)
            || block.match(/<a[^>]*title="([^"]+)"/i);
        const coverM = block.match(/(?:data-cfsrc|data-src|src)="([^"]+)"/i);
        const dateM = block.match(/<span[^>]*>([\s\S]*?)<\/span>/i);
        let href = hrefM ? hrefM[1].trim() : '';
        let title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';
        let cover = coverM ? coverM[1].trim() : '';
        let remark = dateM ? dateM[1].replace(/<[^>]+>/g, '').trim() : '';
        if (!href || !title) continue;
        if (href.indexOf('http') !== 0) href = HOST + href;
        if (cover && cover.indexOf('//') === 0) cover = 'https:' + cover;
        else if (cover && cover.indexOf('http') !== 0) cover = HOST + cover;
        list.push({
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_remarks: remark,
        });
    }
    return list;
}

function parseList(html) {
    if (!html) return [];
    if (isChallenge(html)) return [];
    let list = parseWithCheerio(html);
    if (list.length === 0) list = parseWithRegex(html);
    return list;
}

function tipItem(msg) {
    return {
        vod_id: HOST,
        vod_name: msg,
        vod_pic: '',
        vod_remarks: '提示',
    };
}

function buildCateUrl(tid, pg) {
    const page = parseInt(pg) || 1;
    let url = HOST;
    if (tid === 'chinese-av-porn' || tid === 'jav') {
        url += '/' + tid;
        if (page > 1) url += '?origin=1&sort=1&page=' + page;
    } else if (tid === 'wuma') {
        url += '/video/list?category=' + encodeURIComponent('无码流出') + '&origin=2';
        if (page > 1) url += '&sort=1&page=' + page;
    } else if (tid === 'hdongman') {
        url += '/video/list?origin=3';
        if (page > 1) url += '&sort=1&page=' + page;
    } else {
        url += '/video/list?origin=1';
        if (page > 1) url += '&sort=1&page=' + page;
    }
    return url;
}

async function init(cfg) {
    siteKey = (cfg && cfg.skey) || '';
    siteType = (cfg && cfg.stype) || 0;
    // ext 可传 Worker 地址
    try {
        const ext = (cfg && (cfg.ext || cfg.extend)) || '';
        if (typeof ext === 'string' && /^https?:\/\//i.test(ext)) {
            PROXY = ext.replace(/\/$/, '');
        } else if (ext && typeof ext === 'object' && ext.proxy) {
            PROXY = String(ext.proxy).replace(/\/$/, '');
        }
    } catch (e) {}
}

async function home(filter) {
    return JSON.stringify({
        class: [
            { type_id: 'chinese-av-porn', type_name: '国产视频' },
            { type_id: 'jav', type_name: '日本AV' },
            { type_id: 'wuma', type_name: '无码流出' },
            { type_id: 'hdongman', type_name: 'H动漫' },
        ],
        filters: {},
    });
}

async function homeVod() {
    try {
        if (!PROXY) {
            return JSON.stringify({ list: [tipItem('未配置Worker代理：请在ext填入Worker地址')] });
        }
        const html = httpGet(HOST + '/chinese-av-porn');
        if (isChallenge(html)) {
            return JSON.stringify({ list: [tipItem('代理后仍被CF拦截，需换节点或带Cookie')] });
        }
        const list = parseList(html);
        if (list.length === 0) {
            return JSON.stringify({ list: [tipItem('代理通了但解析0条，检查Worker返回')] });
        }
        return JSON.stringify({ list: list.slice(0, 24) });
    } catch (e) {
        return JSON.stringify({ list: [tipItem('首页失败: ' + String(e).slice(0, 80))] });
    }
}

async function category(tid, pg, filter, extend) {
    try {
        if (!PROXY) {
            return JSON.stringify({
                page: 1, pagecount: 1, limit: 20, total: 0,
                list: [tipItem('未配置Worker：ext填 https://你的.workers.dev')],
            });
        }
        const page = parseInt(pg) || 1;
        const url = buildCateUrl(tid, page);
        const html = httpGet(url);
        if (!html || html.length < 50) {
            return JSON.stringify({
                page, pagecount: 1, limit: 20, total: 0,
                list: [tipItem('代理返回空，检查Worker是否部署成功')],
            });
        }
        if (isChallenge(html)) {
            return JSON.stringify({
                page, pagecount: 1, limit: 20, total: 0,
                list: [tipItem('Worker出口仍触发CF，尝试绑定自定义域名或加Cookie')],
            });
        }
        const list = parseList(html);
        if (list.length === 0) {
            const snip = html.replace(/\s+/g, ' ').slice(0, 100);
            return JSON.stringify({
                page, pagecount: 1, limit: 20, total: 0,
                list: [tipItem('解析0条 | ' + snip)],
            });
        }
        return JSON.stringify({
            page,
            pagecount: list.length >= 10 ? page + 1 : page,
            limit: 20,
            total: 999999,
            list,
        });
    } catch (e) {
        return JSON.stringify({
            page: 1, pagecount: 1, limit: 20, total: 0,
            list: [tipItem('分类异常: ' + String(e).slice(0, 80))],
        });
    }
}

async function detail(id) {
    try {
        const url = (id && id.indexOf('http') === 0) ? id : HOST + id;
        const html = httpGet(url);
        if (isChallenge(html)) {
            return JSON.stringify({
                list: [{
                    vod_id: url,
                    vod_name: '详情被CF拦截',
                    vod_pic: '',
                    vod_content: '',
                    vod_play_from: '默认分组',
                    vod_play_url: '重试$',
                }],
            });
        }
        let playUrl = '';
        let m = html.match(/id=["']mui-player["'][^>]*src=["']([^"']+)["']/i)
            || html.match(/src=["']([^"']+)["'][^>]*id=["']mui-player["']/i);
        if (m) playUrl = m[1];
        if (!playUrl) {
            m = html.match(/https?:\/\/[^"'\s<>]+?\.m3u8[^"'\s<>]*/i);
            if (m) playUrl = m[0];
        }
        if (!playUrl) {
            m = html.match(/https?:\/\/[^"'\s<>]+?\.mp4[^"'\s<>]*/i);
            if (m) playUrl = m[0];
        }
        if (!playUrl && typeof load === 'function') {
            try {
                const $ = load(html);
                playUrl = $('#mui-player').attr('src') || $('video').attr('src') || $('source').attr('src') || '';
            } catch (e) {}
        }
        let title = '';
        m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        if (m) title = m[1].replace(/<[^>]+>/g, '').trim();
        if (!title) {
            m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            if (m) title = m[1].replace(/<[^>]+>/g, '').trim().replace(/\s*[-|·].*$/, '');
        }
        let pic = '';
        m = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
        if (m) pic = m[1];

        return JSON.stringify({
            list: [{
                vod_id: url,
                vod_name: title || '有爱爱',
                vod_pic: pic,
                vod_content: '',
                vod_play_from: '默认分组',
                vod_play_url: '播放$' + (playUrl || ''),
            }],
        });
    } catch (e) {
        return JSON.stringify({
            list: [{
                vod_id: id,
                vod_name: '详情失败',
                vod_pic: '',
                vod_content: String(e),
                vod_play_from: '默认分组',
                vod_play_url: '播放$',
            }],
        });
    }
}

async function play(flag, id, flags) {
    // 播放地址一般是 CDN，通常不必走 Worker；若也被拦可再改
    return JSON.stringify({
        parse: 0,
        jx: 0,
        url: id,
        header: {
            'User-Agent': UA,
            'Referer': HOST + '/',
            'Origin': HOST,
        },
    });
}

async function search(wd, quick, pg) {
    try {
        if (!PROXY) {
            return JSON.stringify({ list: [tipItem('未配置Worker代理')] });
        }
        const page = parseInt(pg) || 1;
        let url = HOST + '/video/list?searchType=1&keyword=' + encodeURIComponent(wd);
        if (page > 1) {
            url = HOST + '/video/list?keyword=' + encodeURIComponent(wd) + '&category=&origin=&tag=&sort=0&page=' + page;
        }
        const html = httpGet(url);
        if (isChallenge(html)) {
            return JSON.stringify({ list: [tipItem('搜索仍被CF拦截')] });
        }
        const list = parseList(html);
        return JSON.stringify({
            page,
            pagecount: list.length >= 10 ? page + 1 : page,
            list,
        });
    } catch (e) {
        return JSON.stringify({ list: [tipItem('搜索失败')] });
    }
}

export function __jsEvalReturn() {
    return {
        init,
        home,
        homeVod,
        category,
        detail,
        play,
        search,
    };
}
