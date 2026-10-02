/**
 * AVToday - 蜂蜜影视 / FongMi QuickJS Spider
 * 站点: https://avtoday.io  (默认简体 /chs/)
 *
 * 播放说明:
 * - 无码/FC2 等: 返回直链 mp4 (video_link)
 * - 有码商业片: 站点仅提供预览图流，完整视频需会员，无法解析
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const host = 'https://avtoday.io';
const lang = 'chs';
const base = host + '/' + lang;

function header(extra) {
    const h = {
        'User-Agent': UA,
        'Referer': base + '/',
        'Cookie': 'lang=' + lang,
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    };
    if (extra) {
        for (const k in extra) h[k] = extra[k];
    }
    return h;
}

async function request(url) {
    try {
        const u = new URL(url);
        u.pathname = u.pathname.split('/').map(function (seg) {
            try {
                return encodeURIComponent(decodeURIComponent(seg));
            } catch (e) {
                return encodeURIComponent(seg);
            }
        }).join('/');
        url = u.toString();
    } catch (e) {}

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

function parseList(html) {
    const list = [];
    const seen = {};
    if (!html || html.length < 100) return list;

    const re = /data-spcode="([^"]+)"/g;
    let m;
    while ((m = re.exec(html)) !== null) {
        const code = m[1];
        if (seen[code]) continue;
        seen[code] = true;

        const chunk = html.substring(m.index, m.index + 2500);

        const hrefM = chunk.match(/href="(\/(?:chs|cht)\/video\/[^"]+\.html)"/);
        if (!hrefM) continue;
        const href = hrefM[1];

        let pic = '';
        let sm = chunk.match(/background:\s*url\(['"]([^'"]+)['"]\)/);
        if (!sm) sm = chunk.match(/url\(['"]([^'"]+\.(?:jpg|jpeg|png|webp)[^'"]*)['"]\)/i);
        if (sm) {
            pic = sm[1];
            if (pic.indexOf('http') !== 0) {
                pic = host + (pic.charAt(0) === '/' ? pic : '/' + pic);
            }
        }

        let duration = '';
        const dm = chunk.match(/video-duration[^>]*>\s*([^<]+)/);
        if (dm) duration = dm[1].replace(/\s+/g, ' ').trim();

        let tag = '';
        const tm = chunk.match(/video-tag[^>]*>\s*([^<]+)/);
        if (tm) tag = tm[1].replace(/\s+/g, ' ').trim();

        let title = '';
        const titleM = chunk.match(/video-title[^>]*>[\s\S]*?<a[^>]*>\s*([\s\S]*?)\s*<\/a>/);
        if (titleM) {
            title = titleM[1]
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/\s+/g, ' ')
                .trim();
        }
        if (!title) title = code;
        if (title.indexOf('[廣告]') >= 0 || title.indexOf('[广告]') >= 0) continue;

        list.push({
            vod_id: href,
            vod_name: title,
            vod_pic: pic,
            vod_remarks: tag || duration,
        });
    }
    return list;
}

async function home(filter) {
    try {
        const html = await request(base + '/catalog/%E7%B1%BB%E5%9E%8B%E7%9B%AE%E5%BD%95.html');
        const classes = [];
        const re = /href="((?:https:\/\/avtoday\.io)?\/(?:chs|cht)\/catalog\/[^"]+\.html)"[\s\S]{0,400}?btn-categories__title[^>]*>([^<]+)<[\s\S]{0,300}?btn-categories__info[^>]*>([^<]*)</g;
        let m;
        while ((m = re.exec(html)) !== null) {
            let href = m[1];
            const name = (m[2] || '').trim();
            const info = (m[3] || '').trim().split(/\s/)[0] || '';
            if (!name) continue;
            if (href.indexOf('telegram') >= 0 || href.indexOf('t.me') >= 0) continue;
            if (href.indexOf('http') !== 0) href = host + href;
            href = href.replace(/\/(?:chs|cht)\//, '/' + lang + '/');
            classes.push({
                type_id: href,
                type_name: info ? (name + ' (' + info + ')') : name,
            });
        }

        if (classes.length === 0) {
            const defaults = [
                ['無碼', '无码'],
                ['FC2', 'FC2'],
                ['中文字幕', '中文字幕'],
                ['素人', '素人'],
                ['巨乳', '巨乳'],
                ['熟女', '熟女'],
                ['多人', '多人'],
                ['絲襪', '丝袜'],
                ['制服', '制服'],
                ['人妻', '人妻'],
            ];
            defaults.forEach(function (item) {
                classes.push({
                    type_id: base + '/catalog/' + encodeURIComponent(item[0]) + '.html',
                    type_name: item[1],
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
        const html = await request(base + '/new.html');
        const list = parseList(html);
        return JSON.stringify({ list: list.slice(0, 24) });
    } catch (e) {
        return JSON.stringify({ list: [] });
    }
}

async function category(tid, pg, filter, extend) {
    try {
        pg = String(pg || '1');
        let url = String(tid || '');
        if (!url || url === 'undefined') {
            return JSON.stringify({ list: [], page: 1, pagecount: 1, limit: 0, total: 0 });
        }
        if (url.indexOf('http') !== 0) url = absUrl(url);
        url = url.replace(/\/(?:chs|cht)\//, '/' + lang + '/');

        if (pg !== '1') {
            url += (url.indexOf('?') >= 0 ? '&' : '?') + 'page=' + pg;
        }

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
        let href = String(id || '');
        if (href.indexOf('http') !== 0) href = absUrl(href);
        href = href.replace(/\/(?:chs|cht)\//, '/' + lang + '/');

        const codeMatch = href.match(/\/video\/([^/.]+)/);
        const code = codeMatch ? codeMatch[1] : href;
        // 把番号和详情页一起传给 play，方便带 Referer
        const playId = code + '|' + href;

        let name = code;
        try {
            const html = await request(href);
            const tm = html.match(/<title>([^|<]+)/);
            if (tm) name = tm[1].trim();
        } catch (e) {}

        return JSON.stringify({
            list: [{
                vod_id: id,
                vod_name: name,
                vod_play_from: '默认',
                vod_play_url: '播放$' + playId,
            }],
        });
    } catch (e) {
        return JSON.stringify({ list: [] });
    }
}

async function play(flag, id, flags) {
    try {
        let code = String(id || '');
        let referer = base + '/';
        // detail 传过来的格式: 番号|详情页url
        if (code.indexOf('|') >= 0) {
            const parts = code.split('|');
            code = parts[0];
            if (parts[1]) referer = parts[1];
        }
        // 兼容旧格式直接是 player url
        if (code.indexOf('player?s=') >= 0) {
            const cm = code.match(/[?&]s=([^&]+)/);
            if (cm) code = decodeURIComponent(cm[1]);
        }
        if (code.indexOf('/video/') >= 0) {
            const cm = code.match(/\/video\/([^/.]+)/);
            if (cm) code = cm[1];
        }

        const playerUrl = host + '/player?s=' + encodeURIComponent(code);
        const html = await request(playerUrl);

        // 优先取直链 mp4 (无码/FC2 等免费片)
        let videoLink = '';
        const vl = html.match(/video_link\s*=\s*['"]([^'"]+)['"]/);
        if (vl && vl[1]) videoLink = vl[1].trim();

        let m3u8 = '';
        const ml = html.match(/m3u8_url\s*=\s*['"]([^'"]+)['"]/);
        if (ml && ml[1]) m3u8 = ml[1].trim();

        const playHeader = header({
            'Referer': playerUrl,
            'Origin': host,
        });

        if (videoLink) {
            return JSON.stringify({
                parse: 0,
                url: videoLink,
                header: playHeader,
            });
        }

        if (m3u8) {
            // 有码片的 m3u8 多半是预览图流，仍尝试返回；若无法播放属于站点限制
            return JSON.stringify({
                parse: 0,
                url: m3u8,
                header: playHeader,
            });
        }

        return JSON.stringify({ parse: 0, url: '', msg: '未获取到播放地址' });
    } catch (e) {
        return JSON.stringify({ parse: 0, url: '', msg: String(e) });
    }
}

async function search(wd, quick, pg) {
    try {
        pg = String(pg || '1');
        const url = host + '/search?s=' + encodeURIComponent(wd) + '&page=' + pg;
        const html = await request(url);
        if (html.indexOf('Just a moment') >= 0 || html.indexOf('cf-browser-verification') >= 0 || html.indexOf('challenge-platform') >= 0) {
            return JSON.stringify({ list: [] });
        }
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
