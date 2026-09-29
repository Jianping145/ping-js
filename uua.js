/**
 * 有爱爱 - 蜂蜜影视 / CatVod JS Spider
 * 站点: https://www.uaa.com
 */
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const HOST = 'https://www.uaa.com';

const HEADERS = {
    'User-Agent': UA,
    'Referer': HOST + '/',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

let siteKey = '';
let siteType = 0;

function requestHtml(url) {
    const res = req(url, {
        headers: HEADERS,
        timeout: 15000,
    });
    return (res && (res.content || res)) || '';
}

function isChallenge(html) {
    if (!html || html.length < 50) return true;
    return /challenge-platform|Just a moment|cf-mitigated|cf-browser-verification/i.test(html);
}

function parseList(html) {
    const list = [];
    if (!html || isChallenge(html)) return list;

    const itemRe = /<li[^>]*class="[^"]*video_li[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
    let m;
    while ((m = itemRe.exec(html)) !== null) {
        const block = m[1];
        const hrefM = block.match(/class="[^"]*title[^"]*"[\s\S]*?<a[^>]*href="([^"]+)"/i)
            || block.match(/<a[^>]*href="([^"]+)"[^>]*>/i);
        const titleM = block.match(/class="[^"]*title[^"]*"[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i)
            || block.match(/<a[^>]*title="([^"]+)"/i);
        const coverM = block.match(/class="[^"]*cover[^"]*"[^>]*(?:src|data-cfsrc|data-src)="([^"]+)"/i)
            || block.match(/(?:src|data-cfsrc|data-src)="([^"]+)"[^>]*class="[^"]*cover/i)
            || block.match(/<img[^>]*(?:src|data-src|data-cfsrc)="([^"]+)"/i);
        const dateM = block.match(/<span[^>]*>([\s\S]*?)<\/span>/i);

        let href = hrefM ? hrefM[1].trim() : '';
        let title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';
        let cover = coverM ? coverM[1].trim() : '';
        let remark = dateM ? dateM[1].replace(/<[^>]+>/g, '').trim() : '';

        if (!href || !title) continue;
        if (href.indexOf('http') !== 0) href = HOST + href;
        if (cover && cover.indexOf('http') !== 0) cover = HOST + cover;

        list.push({
            vod_id: href,
            vod_name: title,
            vod_pic: cover,
            vod_remarks: remark,
        });
    }
    return list;
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
    siteKey = cfg.skey || '';
    siteType = cfg.stype || 0;
}

async function home(filter) {
    const classes = [
        { type_id: 'chinese-av-porn', type_name: '国产视频' },
        { type_id: 'jav', type_name: '日本AV' },
        { type_id: 'wuma', type_name: '无码流出' },
        { type_id: 'hdongman', type_name: 'H动漫' },
    ];
    return JSON.stringify({
        class: classes,
        filters: {},
    });
}

async function homeVod() {
    try {
        const html = requestHtml(HOST + '/chinese-av-porn');
        const list = parseList(html);
        return JSON.stringify({ list: list.slice(0, 20) });
    } catch (e) {
        return JSON.stringify({ list: [] });
    }
}

async function category(tid, pg, filter, extend) {
    try {
        const page = parseInt(pg) || 1;
        const url = buildCateUrl(tid, page);
        const html = requestHtml(url);
        const list = parseList(html);
        return JSON.stringify({
            page: page,
            pagecount: list.length > 0 ? page + 1 : page,
            limit: 20,
            total: list.length > 0 ? 999999 : 0,
            list: list,
        });
    } catch (e) {
        return JSON.stringify({
            page: 1,
            pagecount: 1,
            limit: 20,
            total: 0,
            list: [],
        });
    }
}

async function detail(id) {
    try {
        const url = id.indexOf('http') === 0 ? id : HOST + id;
        const html = requestHtml(url);

        let playUrl = '';
        let m = html.match(/id=["']mui-player["'][^>]*src=["']([^"']+)["']/i)
            || html.match(/src=["']([^"']+)["'][^>]*id=["']mui-player["']/i);
        if (m) playUrl = m[1];

        if (!playUrl) {
            m = html.match(/https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*/i);
            if (m) playUrl = m[0];
        }
        if (!playUrl) {
            m = html.match(/https?:\/\/[^"'\s<>]+\.mp4[^"'\s<>]*/i);
            if (m) playUrl = m[0];
        }

        let title = '';
        m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        if (m) title = m[1].replace(/<[^>]+>/g, '').trim();
        if (!title) {
            m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            if (m) title = m[1].replace(/<[^>]+>/g, '').trim().replace(/\s*[-|].*$/, '');
        }

        let pic = '';
        m = html.match(/class=["'][^"']*cover[^"']*["'][^>]*(?:src|data-src)=["']([^"']+)["']/i)
            || html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
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
                vod_name: '解析失败',
                vod_pic: '',
                vod_content: String(e),
                vod_play_from: '默认分组',
                vod_play_url: '播放$',
            }],
        });
    }
}

async function play(flag, id, flags) {
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
        const page = parseInt(pg) || 1;
        let url = HOST + '/video/list?searchType=1&keyword=' + encodeURIComponent(wd);
        if (page > 1) {
            url = HOST + '/video/list?keyword=' + encodeURIComponent(wd) + '&category=&origin=&tag=&sort=0&page=' + page;
        }
        const html = requestHtml(url);
        const list = parseList(html);
        return JSON.stringify({
            page: page,
            pagecount: list.length > 0 ? page + 1 : page,
            list: list,
        });
    } catch (e) {
        return JSON.stringify({ list: [] });
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
    };
}
