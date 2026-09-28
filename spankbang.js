// SpankBang - 蜂蜜影视 / CatVod / T4 标准版
// 站点: https://jp.spankbang.com
// 修复版：增强列表解析、图片提取、HTML实体解码、分类URL兼容

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/604.1.14 (KHTML, like Gecko)'
const SITE = 'https://jp.spankbang.com'

const CLASS_MAP = {
    // 系统分类
    '最新': 'new_videos',
    '热门': 'trending_videos',
    '正在观看': 'upcoming',
    '高清': 's/hd',
    // 日本相关
    '日本': 's/japanese',
    '日本无码': 's/japanese+uncensored',
    '日本妻子': 's/japanese+wife',
    '人妻出轨': 's/japanese+cheating+wife',
    '人妻出轨英字': 's/japanese+cheating+wife+english+subtitles',
    '妻子与上司': 's/japanese+wife+affair+husband+boss',
    '日本上司': 's/japanese+boss',
    '日本办公室': 's/japanese+office',
    'OL': 's/japanese+office+lady',
    '秘书': 's/japanese+secretary',
    '债务': 's/japanese+debt',
    '妻子还债': 's/japanese+wife+pays+husbands+debt',
    '强制英字': 's/japanese+wife+forsed+eng+sub',
    '强制': 's/japanese+forsed',
    'Attackers': 's/japanese+attackers',
    '新妻Attackers': 's/japanese+new+housewife+attackers+sub+english',
    '主妇': 's/japanese+housewife',
    '已婚女性': 's/japanese+married+woman',
    '当面被操': 's/japanese+wife+fucked+in+front+of',
    'NTR': 's/japanese+ntr',
    'NTR出轨': 's/ntr+wife+cheating',
    'NTR综合': 's/ntr',
    // 日文关键词
    '人妻': 's/' + encodeURIComponent('人妻'),
    '熟女': 's/' + encodeURIComponent('熟女'),
    'おばさん': 's/' + encodeURIComponent('おばさん'),
    'ブス': 's/' + encodeURIComponent('ブス'),
    '地味': 's/' + encodeURIComponent('地味'),
    '田舎': 's/' + encodeURIComponent('田舎'),
    '家出': 's/' + encodeURIComponent('家出'),
    'トー横': 's/' + encodeURIComponent('トー横'),
    '地雷系': 's/' + encodeURIComponent('地雷系'),
    'パパ活': 's/' + encodeURIComponent('パパ活'),
    '援交': 's/' + encodeURIComponent('援交'),
    '美巨乳': 's/' + encodeURIComponent('美巨乳'),
    '极品': 's/' + encodeURIComponent('极品'),
    '女神': 's/' + encodeURIComponent('女神'),
    'ミニマム': 's/' + encodeURIComponent('ミニマム'),
    '低身長': 's/' + encodeURIComponent('低身長'),
    // 中文/其他
    '网红': 's/' + encodeURIComponent('网红'),
    '主播': 's/' + encodeURIComponent('主播'),
    '直播': 's/' + encodeURIComponent('直播'),
    '国产': 's/' + encodeURIComponent('国产'),
    '中国': 's/' + encodeURIComponent('中国'),
    '台湾': 's/' + encodeURIComponent('台湾'),
    '韩国': 's/' + encodeURIComponent('韩国'),
    '中国人': 's/' + encodeURIComponent('中国人'),
    'Chinese': 's/chinese',
    'AI换脸': 's/' + encodeURIComponent('ai换脸'),
    '明星': 's/' + encodeURIComponent('明星'),
    '安可': 's/' + encodeURIComponent('安可'),
    // 厂商/系列
    'HEYZO': 's/heyzo',
    'Tokyo Hot': 's/tokyo+hot',
    'Heydouga': 's/heydouga',
    'FC2': 's/fc2+ppv',
    '无修正流出': 's/' + encodeURIComponent('無修正流出'),
    '流出': 's/' + encodeURIComponent('流出'),
    '日本人': 's/' + encodeURIComponent('日本人'),
    '孕ませマン': 's/' + encodeURIComponent('孕ませマン') + '+japanese',
    '黑ギャル无码': 's/' + encodeURIComponent('黒ギャル') + '+' + encodeURIComponent('無修正'),
    '美少女': 's/' + encodeURIComponent('美少女'),
    '可爱い': 's/' + encodeURIComponent('可愛い'),
    '綺麗': 's/' + encodeURIComponent('綺麗'),
    'かわいい': 's/' + encodeURIComponent('かわいい'),
    '温泉': 's/' + encodeURIComponent('温泉'),
    '盗撮': 's/' + encodeURIComponent('盗撮'),
    '强奸': 's/' + encodeURIComponent('強姦'),
    '鬼畜': 's/' + encodeURIComponent('鬼畜'),
    '无理矢理': 's/' + encodeURIComponent('無理矢理'),
    '无许可': 's/' + encodeURIComponent('無許可'),
    '号泣': 's/' + encodeURIComponent('号泣'),
    '犯す': 's/' + encodeURIComponent('犯す'),
    // 英文热门分类
    'OnlyFans': 's/onlyfans',
    'Babe': 's/babe',
    'Amateur': 's/amateur',
    'Asian': 's/asian',
    'Cowgirl': 's/cowgirl',
    'MILF': 's/milf',
    'Missionary': 's/missionary',
    'Threesome': 's/threesome',
    'Deep Throat': 's/deep+throat',
    'Interracial': 's/interracial',
    'Ebony': 's/ebony',
    'Teen': 's/teen',
    'Teen 18': 's/teen+18',
    'Young': 's/young',
    'Petite Asian': 's/petite+asian',
    'Skinny Asian': 's/skinny+asian',
    'Small Tits': 's/small+tits+teen',
    'Petite': 's/petite+teen',
    'Forced Amateur': 's/forsed+sex+amateur',
    'OnlyFans Teen': 's/onlyfans+teen',
    'Flat Chested': 's/flat+chested',
    '嫌がる': 's/' + encodeURIComponent('嫌がる'),
    'BBW': 's/bbw',
    'Huge Ass': 's/huge+ass',
    'Big Booty': 's/big+booty',
    'Thick': 's/thick',
    'Curvy': 's/curvy',
    'Curvy Teen': 's/curvy+teen',
    'Country Girl': 's/country+girl',
    'White Trash': 's/white+trash',
    'White Trash Whore': 's/white+trash+whore',
    'Gangland': 's/gangland',
    'Trailer Park': 's/trailer+park',
    'Street Whore': 's/street+whore',
    'Hooker': 's/hooker',
    'Hooker BJ': 's/hooker+blowjob',
    // 合集 / PMV
    'Japanese Compilation': 's/japanese+compilation',
    'JAV Compilation': 's/jav+compilation',
    'Asian Compilation': 's/asian+compilation',
    'Asian PMV': 's/asian+pmv',
    'Kpop PMV': 's/kpop+pmv',
    'TikTok': 's/tiktok',
}

function log(msg) {
    console.log('[SpankBang] ' + msg)
}

function fix(u) {
    if (!u) return ''
    if (u.indexOf('//') === 0) return 'https:' + u
    if (u.indexOf('/') === 0) return SITE + u
    return u
}

// HTML 实体解码
function decodeHtml(str) {
    if (!str) return ''
    return str
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
}

async function http(url) {
    try {
        const res = await req(url, {
            method: 'get',
            headers: {
                'User-Agent': UA,
                'Accept-Language': 'ja,en;q=0.9',
                'Referer': SITE + '/',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            timeout: 15000,
        })
        if (typeof res === 'string') return res
        if (res && res.content) return res.content
        if (res && res.data) return res.data
        return res || ''
    } catch (e) {
        log('http error: ' + e)
        throw e
    }
}

// 从一段 HTML 中尽可能提取真实封面图
function extractPic(block) {
    if (!block) return ''

    // 1. 优先常见懒加载属性
    const attrPatterns = [
        /data-src=["']([^"']+)["']/i,
        /data-original=["']([^"']+)["']/i,
        /data-lazy-src=["']([^"']+)["']/i,
        /data-thumb=["']([^"']+)["']/i,
        /data-poster=["']([^"']+)["']/i,
        /data-bg=["']([^"']+)["']/i,
        /srcset=["']([^"'\s,]+)/i,
    ]
    for (let i = 0; i < attrPatterns.length; i++) {
        const m = block.match(attrPatterns[i])
        if (m && m[1] && !/data:image|placeholder|blank|grey|gray|1x1|pixel|svg\+xml|loading\.gif/i.test(m[1])) {
            return fix(m[1].trim())
        }
    }

    // 2. 带真实图片后缀的 src
    const srcM = block.match(/src=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/i)
    if (srcM && srcM[1] && !/data:image|placeholder|1x1|pixel/i.test(srcM[1])) {
        return fix(srcM[1].trim())
    }

    // 3. background-image
    const bgM = block.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i)
    if (bgM && bgM[1] && !/data:image|placeholder/i.test(bgM[1])) {
        return fix(bgM[1].trim())
    }

    // 4. 兜底：块内任意看起来像缩略图的图片链接
    const anyImg = block.match(/(https?:)?\/\/[^"'>\s]+(?:tb|cdn|thumb|image|pic)[^"'>\s]*\.(?:jpg|jpeg|png|webp)[^"'>\s]*/i) ||
                   block.match(/(https?:)?\/\/[^"'>\s]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'>\s]*)?/i)
    if (anyImg && anyImg[0] && !/data:image|placeholder|1x1/i.test(anyImg[0])) {
        return fix(anyImg[0].trim())
    }

    return ''
}

// 稳定列表解析（优先保证能出数据）
function parseList(html) {
    const list = []
    if (!html) return list

    if (html.indexOf('Just a moment') !== -1 || html.indexOf('cf-browser-verification') !== -1) {
        log('触发 Cloudflare 挑战页，解析失败')
        return list
    }

    const seen = {}
    let m

    // 方法1：全局匹配 视频链接 + 附近的 img（最宽松，优先用）
    // 匹配 <a href=".../video/..."> ... <img ... alt="标题" data-src/src="图片">
    const globalRe = /<a[^>]*href=["'](\/[^"']*\/video\/[^"']+)["'][^>]*>[\s\S]{0,1200}?<img[^>]+>/gi
    while ((m = globalRe.exec(html)) !== null) {
        try {
            const href = m[1]
            if (seen[href]) continue
            const chunk = m[0]

            // 标题
            let title = ''
            const altM = chunk.match(/alt=["']([^"']+)["']/i)
            if (altM) title = decodeHtml(altM[1].trim())
            if (!title) {
                const nameM = chunk.match(/class=["'][^"']*name[^"']*["'][^>]*>([^<]+)/i)
                if (nameM) title = decodeHtml(nameM[1].trim())
            }
            if (!title) continue

            seen[href] = true
            const pic = extractPic(chunk)

            list.push({
                vod_id: fix(href),
                vod_name: title,
                vod_pic: pic,
                vod_remarks: '',
            })
        } catch (e) {}
    }

    // 方法2：video-item 块（补充）
    if (list.length < 5) {
        const itemRe = /<div[^>]*class="[^"]*video-item[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*video-item|$)/gi
        while ((m = itemRe.exec(html)) !== null) {
            const block = m[1]
            try {
                const hrefM = block.match(/href=["'](\/[^"']*\/video\/[^"']+)["']/i)
                if (!hrefM) continue
                const href = hrefM[1]
                if (seen[href]) continue

                const titleM = block.match(/alt=["']([^"']+)["']/i) ||
                               block.match(/class=["'][^"']*name[^"']*["'][^>]*>([^<]+)/i)
                if (!titleM) continue
                const title = decodeHtml(titleM[1].trim())
                if (!title) continue

                seen[href] = true
                list.push({
                    vod_id: fix(href),
                    vod_name: title,
                    vod_pic: extractPic(block),
                    vod_remarks: '',
                })
            } catch (e) {}
        }
    }

    log('解析到 ' + list.length + ' 个视频')
    return list
}

// ===== T4 标准接口 =====

async function init(cfg) {
    log('init')
    return JSON.stringify({ code: 0, msg: 'success' })
}

async function home(filter) {
    log('home')
    const classes = []
    for (const name in CLASS_MAP) {
        classes.push({
            type_id: CLASS_MAP[name],
            type_name: name,
        })
    }
    return JSON.stringify({ class: classes })
}

async function homeContent(filter) {
    return await home(filter)
}

async function homeVod() {
    return await category('new_videos', '1', false, {})
}

async function category(tid, pg, filter, extend) {
    try {
        const page = parseInt(pg) || 1
        const id = String(tid || 'new_videos').trim()
        log('category id=' + id + ' page=' + page)

        // 页码兼容：第1页有些路径不需要 /1
        let url
        if (page === 1) {
            url = SITE + '/' + id + '/'
        } else {
            url = SITE + '/' + id + '/' + page + '/'
        }

        const html = await http(url)

        // Cloudflare 检测
        if (html && (html.indexOf('Just a moment') !== -1 || html.indexOf('cf-browser-verification') !== -1)) {
            log('触发 Cloudflare，需要浏览器验证')
        }

        const list = parseList(html)
        return JSON.stringify({
            list: list,
            page: page,
            pagecount: 999,
            limit: 24,
            total: 999999,
        })
    } catch (e) {
        log('category error: ' + e)
        return JSON.stringify({ list: [], page: 1, pagecount: 1, total: 0 })
    }
}

async function categoryContent(tid, pg, filter, extend) {
    return await category(tid, pg, filter, extend)
}

async function detail(ids) {
    try {
        let url = Array.isArray(ids) ? ids[0] : ids
        if (!url) return JSON.stringify({ list: [] })
        url = fix(url)
        log('detail url=' + url)

        const html = await http(url)
        if (!html) return JSON.stringify({ list: [] })

        // 标题
        let title = '未知'
        const titleM = html.match(/<title>([\s\S]*?)<\/title>/i)
        if (titleM) {
            title = decodeHtml(titleM[1].replace(/-\s*SpankBang.*$/i, '').trim())
        }
        const h1M = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
        if (h1M) title = decodeHtml(h1M[1].replace(/<[^>]+>/g, '').trim()) || title

        // 封面
        let pic = ''
        const picM = html.match(/og:image[^>]*content="([^"]+)"/i) ||
                     html.match(/data-src="([^"]+)"/i)
        if (picM) pic = fix(picM[1])

        // 提取 stream_data
        const tracks = []
        const streamM = html.match(/var\s+stream_data\s*=\s*(\{[^;]+\});/)
        if (streamM) {
            try {
                const jsonStr = streamM[1].replace(/'/g, '"')
                const streamData = JSON.parse(jsonStr)
                const qualityOrder = ['240p', '320p', '480p', '720p', '1080p', '4k']
                for (let i = 0; i < qualityOrder.length; i++) {
                    const q = qualityOrder[i]
                    if (streamData[q] && Array.isArray(streamData[q]) && streamData[q].length > 0) {
                        tracks.push(q.toUpperCase() + '$' + streamData[q][0])
                    }
                }
                if (streamData.m3u8 && streamData.m3u8.length > 0) {
                    tracks.push('M3U8$' + streamData.m3u8[0])
                }
                // 自动/主线路
                if (streamData.main && streamData.main.length > 0) {
                    tracks.unshift('自动$' + streamData.main[0])
                }
            } catch (e) {
                log('stream_data 解析失败: ' + e)
            }
        }

        // 兜底：stream_url_xxx 格式（yt-dlp 同款）
        if (tracks.length === 0) {
            const streamUrlRe = /stream_url_([^\s=]+)\s*=\s*['"]([^'"]+)['"]/gi
            let sm
            while ((sm = streamUrlRe.exec(html)) !== null) {
                tracks.push(sm[1].toUpperCase() + '$' + sm[2])
            }
        }

        // 再兜底：直接匹配 mp4/m3u8
        if (tracks.length === 0) {
            const urlRe = /https?:\/\/[^\s"'<>]+\.(?:mp4|m3u8)[^\s"'<>]*/gi
            const urls = html.match(urlRe) || []
            for (let i = 0; i < urls.length; i++) {
                tracks.push('线路' + (i + 1) + '$' + urls[i])
            }
        }

        if (tracks.length === 0) {
            return JSON.stringify({ list: [] })
        }

        return JSON.stringify({
            list: [{
                vod_id: url,
                vod_name: title,
                vod_pic: pic,
                vod_play_from: 'SpankBang',
                vod_play_url: tracks.join('#'),
                vod_content: title,
            }]
        })
    } catch (e) {
        log('detail error: ' + e)
        return JSON.stringify({ list: [] })
    }
}

async function detailContent(ids) {
    return await detail(ids)
}

async function play(flag, id, vipFlags) {
    try {
        log('play ' + id)
        return JSON.stringify({
            parse: 0,
            url: id,
            header: JSON.stringify({
                'User-Agent': UA,
                'Referer': SITE + '/',
            }),
        })
    } catch (e) {
        log('play error: ' + e)
        return JSON.stringify({ url: '' })
    }
}

async function playerContent(flag, id, vipFlags) {
    return await play(flag, id, vipFlags)
}

async function search(wd, quick) {
    try {
        if (!wd) return JSON.stringify({ list: [] })
        log('search ' + wd)
        const url = SITE + '/s/' + encodeURIComponent(wd.trim()) + '/1/'
        const html = await http(url)
        const list = parseList(html)
        return JSON.stringify({ list: list })
    } catch (e) {
        log('search error: ' + e)
        return JSON.stringify({ list: [] })
    }
}

async function searchContent(wd, quick, pg) {
    return await search(wd, quick)
}

// ===== T4 / 蜂蜜影视 / PeekPro 兼容导出 =====
function __jsEvalReturn() {
    return {
        init: init,
        home: home,
        homeContent: homeContent,
        homeVod: homeVod,
        category: category,
        categoryContent: categoryContent,
        detail: detail,
        detailContent: detailContent,
        play: play,
        playerContent: playerContent,
        search: search,
        searchContent: searchContent,
    }
}

// ES module 导出（PeekPro 等）
export { __jsEvalReturn }

// 部分蜂蜜影视 / TVBox 需要挂到 global
try {
    globalThis.__jsEvalReturn = __jsEvalReturn
} catch (e) {}
try {
    if (typeof global !== 'undefined') global.__jsEvalReturn = __jsEvalReturn
} catch (e) {}
try {
    if (typeof self !== 'undefined') self.__jsEvalReturn = __jsEvalReturn
} catch (e) {}
