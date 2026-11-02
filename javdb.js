// javdb.js - T3 格式（手动验证破盾版）

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const SITE_BASE = 'https://javdb580.com'
const CDN_BASE = 'https://c0.jdbstatic.com/covers'

// T3: init
async function init(cfg) {
    return JSON.stringify({ code: 0, msg: 'success' })
}

// T3: home
async function home(filter) {
    let classes = [
        { type_id: 'hot', type_name: '热播' },
        { type_id: 'censored', type_name: '有码' },
        { type_id: 'uncensored', type_name: '无码' },
        { type_id: 'western', type_name: '欧美' },
        { type_id: 'anime', type_name: '动漫' }
    ]
    return JSON.stringify({ class: classes })
}

function getHeaders() {
    return {
        'User-Agent': UA,
        'Referer': SITE_BASE + '/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cookie': 'over18=1; locale=zh;'
    }
}

// ==========================================
// 核心：带手动验证延迟的 js 渲染
// ==========================================
async function js(html, url) {
    try {
        // 如果本身就有数据，直接返回
        if (html.includes('/v/') && html.includes('video-title')) {
            return html;
        }

        // 自动点一下 "已满18岁"
        var confirmBtn = document.querySelector('button.confirm, .button.is-success, a[href*="over18"], button[type="submit"]');
        if (confirmBtn) {
            confirmBtn.click();
            await new Promise(r => setTimeout(r, 1000));
        }

        // 滚动页面触发加载
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(r => setTimeout(r, 1000));
        window.scrollTo(0, 0);

        // 🚨 重点来了：这里我们强制等待 8 秒钟！
        // 这 8 秒内，如果在 T3 的可视环境里弹出了 CF 盾的 "Verify you are human" 勾选框，你可以手动去点一下。
        // 如果是单纯的加载慢，这 8 秒也足够它渲染出数据了。
        await new Promise(r => setTimeout(r, 8000));

        return document.documentElement.outerHTML;
    } catch (e) {
        return html;
    }
}
// ==========================================

// T3: homeVod
async function homeVod() {
    try {
        let url = SITE_BASE + '/'
        let res = await req(url, { headers: getHeaders() })
        let html = parseRes(res)

        let renderedHtml = await js(html, url)
        let list = parseVideoList(renderedHtml)
        
        console.log('homeVod parsed: ' + list.length)
        return JSON.stringify({ list: list })
    } catch (e) {
        console.log('homeVod error: ' + e)
        return JSON.stringify({ list: [] })
    }
}

// T3: category
async function category(tid, pg, filter, extend) {
    try {
        let page = parseInt(pg) || 1
        let url = ''

        switch (tid) {
            case 'hot': url = SITE_BASE + '/'; break
            case 'censored': url = SITE_BASE + '/censored'; break
            case 'uncensored': url = SITE_BASE + '/uncensored'; break
            case 'western': url = SITE_BASE + '/western'; break
            case 'anime': url = SITE_BASE + '/anime'; break
            default: url = SITE_BASE + '/'
        }

        if (page > 1) {
            url += (url.includes('?') ? '&' : '?') + 'page=' + page
        }

        console.log('category URL: ' + url)

        let res = await req(url, { headers: getHeaders() })
        let html = parseRes(res)

        let renderedHtml = await js(html, url)
        let list = parseVideoList(renderedHtml)
        
        console.log('category parsed: ' + list.length)

        return JSON.stringify({
            list: list,
            page: page,
            pagecount: page + 1,
            total: list.length > 0 ? page * 21 + 1 : 0
        })
    } catch (e) {
        console.log('category error: ' + e)
        return JSON.stringify({ list: [], page: 1, pagecount: 1, total: 0 })
    }
}

// T3: detail
async function detail(ids) {
    try {
        let id = Array.isArray(ids) ? ids[0] : ids
        let url = SITE_BASE + '/v/' + id

        console.log('detail URL: ' + url)

        let res = await req(url, { headers: getHeaders() })
        let html = parseRes(res)

        // 详情页同样需要等待验证
        let renderedHtml = await js(html, url)

        let title = id
        let titleMatch = renderedHtml.match(/<h2[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h2>/) ||
                         renderedHtml.match(/<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/div>/) ||
                         renderedHtml.match(/<h1[^>]*>([^<]+)<\/h1>/) ||
                         renderedHtml.match(/<title[^>]*>([^<]+)<\/title>/)
        if (titleMatch) {
            title = titleMatch[1].trim().replace(/- JavDB.*/i, '').replace(/^\s*|\s*$/g, '')
        }

        let cover = makeCoverUrl(id)

        let magnets = []
        let magnetMatches = renderedHtml.match(/magnet:\?xt=urn:btih:[^"'\s<>]+/g) || []
        for (let magnet of magnetMatches) {
            let cleanMagnet = magnet
                .replace(/&amp;/g, '&')
                .replace(/["'<>].*$/, '')
                .trim()
            if (!magnets.includes(cleanMagnet)) {
                magnets.push(cleanMagnet)
            }
        }

        let content = ''
        let contentMatch = renderedHtml.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/) ||
                           renderedHtml.match(/<div[^>]*id="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/)
        if (contentMatch) {
            content = contentMatch[1].replace(/<[^>]+>/g, '').trim()
        }

        let playUrls = []
        if (magnets.length > 0) {
            for (let i = 0; i < magnets.length; i++) {
                playUrls.push('磁力链接' + (i + 1) + '$' + magnets[i])
            }
        } else {
            playUrls.push('默认$' + url)
        }

        let vod = {
            vod_id: id,
            vod_name: title,
            vod_pic: cover,
            vod_remarks: '',
            vod_year: '',
            vod_area: '',
            vod_actor: '',
            vod_director: '',
            vod_content: content,
            vod_play_from: 'JAVDB',
            vod_play_url: playUrls.join('#')
        }

        return JSON.stringify({ list: [vod] })
    } catch (e) {
        console.log('detail error: ' + e)
        return JSON.stringify({ list: [] })
    }
}

function makeCoverUrl(id) {
    if (!id || id.length < 3) return ''
    let prefix = id.substring(0, 2).toLowerCase()
    return CDN_BASE + '/' + prefix + '/' + id + '.jpg'
}

// T3: play
async function play(flag, id, vipFlags) {
    try {
        if (id.startsWith('magnet:')) {
            return JSON.stringify({
                url: id,
                header: JSON.stringify({ 'User-Agent': UA })
            })
        }
        return JSON.stringify({
            url: id,
            header: JSON.stringify({ 'User-Agent': UA, 'Referer': SITE_BASE })
        })
    } catch (e) {
        return JSON.stringify({ url: '' })
    }
}

// T3: search
async function search(wd, quick) {
    try {
        if (!wd) return JSON.stringify({ list: [] })
        let url = SITE_BASE + '/search?q=' + encodeURIComponent(wd) + '&f=all'
        
        let res = await req(url, { headers: getHeaders() })
        let html = parseRes(res)
        let renderedHtml = await js(html, url)
        
        let list = parseVideoList(renderedHtml)
        return JSON.stringify({ list: list })
    } catch (e) {
        return JSON.stringify({ list: [] })
    }
}

// 解析视频列表
function parseVideoList(html) {
    let list = []
    let seen = {}

    let boxRegex = /<a[^>]*class="[^"]*(?:box|movie-box|grid-item|item)[^"]*"[^>]*href="([^"]*\/v\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
    let match
    while ((match = boxRegex.exec(html)) !== null) {
        let href = match[1]
        let block = match[2] || ''
        let fullBlock = match[0]

        let idMatch = href.match(/\/v\/([^\/\?]+)/)
        if (!idMatch) continue
        let id = idMatch[1]

        if (seen[id]) continue
        seen[id] = true

        let title = id
        let tMatch = fullBlock.match(/<div[^>]*class="[^"]*video-title[^"]*"[^>]*>([^<]+)<\/div>/) ||
                     fullBlock.match(/<span[^>]*class="[^"]*video-title[^"]*"[^>]*>([^<]+)<\/span>/) ||
                     fullBlock.match(/title="([^"]+)"/) ||
                     fullBlock.match(/alt="([^"]+)"/)
        if (tMatch) title = tMatch[1].trim()

        list.push({
            vod_id: id, vod_name: title, vod_pic: makeCoverUrl(id),
            vod_remarks: '', vod_play_from: 'JAVDB', vod_play_url: '播放$' + id
        })
    }

    if (list.length === 0) {
        let matches = html.match(/href="\/v\/([^"]+)"/g) || []
        console.log('Fallback links found: ' + matches.length)
        for (let match of matches) {
            let idMatch = match.match(/href="\/v\/([^"]+)"/)
            if (!idMatch) continue
            let id = idMatch[1]
            if (seen[id]) continue
            seen[id] = true
            list.push({
                vod_id: id, vod_name: id, vod_pic: makeCoverUrl(id),
                vod_remarks: '', vod_play_from: 'JAVDB', vod_play_url: '播放$' + id
            })
        }
    }

    return list.slice(0, 21)
}

function parseRes(res) {
    if (typeof res === 'string') return res
    if (res && res.content) return res.content
    if (res && res.data) return res.data
    return res
}

// T3: 导出
export function __jsEvalReturn() {
    return {
        init: init, home: home, homeVod: homeVod,
        category: category, detail: detail, play: play, search: search
    }
}