// 91porn.js - T4 最终优化版（播放正确 + 分类稳定）

// 适配 CatVod / T4 / TVBox / 蜂蜜影视 JS 引擎

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

const HOSTS = [

    'https://91porn.com/',

    'https://www.91porn.com/',

]

let currentHost = HOSTS[0]

const CLASS_MAP = {

    '最新': 'watch',

    '91原创': 'ori',

    '当前最热': 'hot',

    '本月最热': 'top',

    '10分钟以上': 'long',

    '20分钟以上': 'longer',

    '本月收藏': 'tf',

    '最近加精': 'rf',

    '高清': 'hd',

    '每月最热': 'top_m',

    '本月讨论': 'md',

    '收藏最多': 'mf'

}

function log(msg) {

    console.log('[91Porn] ' + msg)

}

// 请求包装（避免和全局 req 冲突）

async function http(url, options) {

    options = options || {}

    var headers = {

        'User-Agent': UA,

        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',

        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',

        'Cookie': 'language=cn_CN; over18=1; CLIPSHARE=1'

    }

    if (options.headers) {

        for (var k in options.headers) {

            headers[k] = options.headers[k]

        }

    }

    if (options.referer) {

        headers['Referer'] = options.referer

    }

    try {

        var res = await req(url, {

            method: 'get',

            headers: headers,

            timeout: 15000

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

// 多域名轮询

async function fetchWithFailover(pathOrUrl) {

    for (var i = 0; i < HOSTS.length; i++) {

        var host = HOSTS[i]

        var targetUrl = pathOrUrl

        if (targetUrl.indexOf('http') !== 0) {

            targetUrl = host.replace(/\/$/, '') + '/' + targetUrl.replace(/^\//, '')

        } else {

            for (var j = 0; j < HOSTS.length; j++) {

                var old = HOSTS[j].replace(/\/$/, '')

                if (targetUrl.indexOf(old) !== -1) {

                    targetUrl = targetUrl.replace(old, host.replace(/\/$/, ''))

                    break

                }

            }

        }

        for (var attempt = 0; attempt < 2; attempt++) {

            try {

                var data = await http(targetUrl)

                if (data && data.length > 500) {

                    currentHost = host

                    log('成功: ' + host)

                    return data

                }

            } catch (e) {

                if (attempt === 0) {

                    await new Promise(function (r) { setTimeout(r, 400) })

                }

            }

        }

    }

    throw new Error('所有域名都失败')

}

function absHref(href) {

    if (!href) return ''

    if (href.indexOf('http') === 0) return href

    if (href.indexOf('//') === 0) return 'https:' + href

    return currentHost.replace(/\/$/, '') + '/' + href.replace(/^\//, '')

}

function isVideoFormat(url) {

    if (!url) return false

    var lower = url.toLowerCase()

    return lower.indexOf('.m3u8') !== -1 || lower.indexOf('.mp4') !== -1 || lower.indexOf('.ts') !== -1

}

// 解析列表

function parseVideoItems(html) {

    var vlist = []

    var seenIds = {}

    if (!html) return vlist

    var itemRegex = /<div[^>]*class="[^"]*col-xs-12[^"]*col-sm-4[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*col-xs-12|$)/gi

    var match

    while ((match = itemRegex.exec(html)) !== null) {

        var containerHtml = match[1]

        if (containerHtml.length > 6000) continue

        try {

            var aMatch = containerHtml.match(/<a[^>]*href="([^"]*view_video\.php[^"]*)"[^>]*>/i)

            if (!aMatch) continue

            var href = absHref(aMatch[1].replace(/&amp;/g, '&'))

            if (href.indexOf('viewkey=') === -1) continue

            var vkMatch = href.match(/viewkey=([a-zA-Z0-9]+)/)

            var vkId = vkMatch ? vkMatch[1] : href

            if (seenIds[vkId]) continue

            // 标题

            var title = ''

            var titleMatch = containerHtml.match(/<span[^>]*class="[^"]*video-title[^"]*"[^>]*>([\s\S]*?)<\/span>/i)

            if (titleMatch) {

                title = titleMatch[1]

                    .replace(/<[^>]+>/g, '')

                    .replace(/&amp;/g, '&')

                    .replace(/&quot;/g, '"')

                    .replace(/&#39;/g, "'")

                    .replace(/&lt;/g, '<')

                    .replace(/&gt;/g, '>')

                    .trim()

            }

            if (!title || /广告|sponsor|推广|赞助/i.test(title)) continue

            // 封面

            var pic = ''

            var imgMatch = containerHtml.match(/<img[^>]*src="([^"]+)"[^>]*>/i)

            if (imgMatch) {

                pic = absHref(imgMatch[1])

            }

            if (pic && /loading|blank|default/i.test(pic)) pic = ''

            // 时长

            var duration = ''

            var durMatch = containerHtml.match(/<span[^>]*class="[^"]*duration[^"]*"[^>]*>([\s\S]*?)<\/span>/i)

            if (durMatch) {

                duration = durMatch[1].replace(/<[^>]+>/g, '').trim()

            }

            seenIds[vkId] = true

            vlist.push({

                vod_id: href,

                vod_name: title,

                vod_pic: pic,

                vod_remarks: duration || '未知'

            })

        } catch (e) {

            continue

        }

    }

    log('解析到 ' + vlist.length + ' 个视频')

    return vlist

}

function parsePageCount(html) {

    var maxPage = 1

    var matches = html.match(/[?&]page=(\d+)/g) || []

    for (var i = 0; i < matches.length; i++) {

        var num = parseInt(matches[i].match(/(\d+)/)[1])

        if (num > maxPage) maxPage = num

    }

    return maxPage > 1 ? maxPage : 999

}

// 强化版视频地址提取（优先真实视频，严格过滤广告）

function extractVideoUrl(html) {

    if (!html) return null

    var adKeywords = [

        'ad-i18n-dsp', 'kwai.net', 'googleads', 'popads', 'doubleclick',

        'analytics', 'adsystem', 'googlesyndication', 'pagead'

    ]

    // 1. 最优先：strencode2 解码

    var stRegex = /strencode2\s*\(\s*["']([^"']+)["']\s*\)/g

    var stMatch

    while ((stMatch = stRegex.exec(html)) !== null) {

        try {

            var decoded = decodeURIComponent(stMatch[1])

            var srcMatch = decoded.match(/src\s*=\s*["']([^"']+)["']/i)

            if (srcMatch) {

                var url = srcMatch[1].replace(/&amp;/g, '&').trim()

                var lower = url.toLowerCase()

                var isAd = false

                for (var k = 0; k < adKeywords.length; k++) {

                    if (lower.indexOf(adKeywords[k]) !== -1) {

                        isAd = true

                        break

                    }

                }

                if (!isAd && isVideoFormat(url)) {

                    log('strencode2 提取成功')

                    return absHref(url)

                }

            }

        } catch (e) {}

    }

    // 2. 直接匹配 + 打分（带 st= / 正规CDN 优先）

    var urlRegex = /https?:\/\/[^\s"'<>]+\.(?:mp4|m3u8)[^\s"'<>]*/gi

    var allUrls = html.match(urlRegex) || []

    var candidates = []

    for (var i = 0; i < allUrls.length; i++) {

        var clean = allUrls[i].replace(/&amp;/g, '&').trim()

        var lower = clean.toLowerCase()

        var isAd = false

        for (var k = 0; k < adKeywords.length; k++) {

            if (lower.indexOf(adKeywords[k]) !== -1) {

                isAd = true

                break

            }

        }

        if (isAd) continue

        var score = 0

        if (lower.indexOf('st=') !== -1 || lower.indexOf('key=') !== -1) score += 10

        if (lower.indexOf('btc620') !== -1 || lower.indexOf('91p') !== -1 || lower.indexOf('cdn') !== -1 || lower.indexOf('rsc.cdn') !== -1) score += 5

        if (lower.indexOf('.mp4') !== -1) score += 2

        candidates.push({ score: score, url: clean })

    }

    if (candidates.length > 0) {

        candidates.sort(function (a, b) { return b.score - a.score })

        log('直接匹配提取成功，得分: ' + candidates[0].score)

        return candidates[0].url

    }

    return null

}

function getEvUrl(html, detailUrl) {

    var textareaMatch = html.match(/<textarea[^>]*>\s*(https?:\/\/[^<]+\/ev\.php\?VID=[^<\s]+)/i)

    if (textareaMatch) return textareaMatch[1].trim()

    var evMatches = html.match(/(https?:\/\/[^"'\s<>]+\/ev\.php\?VID=[a-zA-Z0-9_\-]+)/gi)

    if (evMatches && evMatches.length > 0) return evMatches[0]

    var vidMatch = html.match(/viewkey=([a-zA-Z0-9]+)/) || detailUrl.match(/viewkey=([a-zA-Z0-9]+)/)

    if (vidMatch) return currentHost.replace(/\/$/, '') + '/ev.php?VID=' + vidMatch[1]

    return null

}

// ===== T4 标准接口 =====

async function init(cfg) {

    log('init')

    return JSON.stringify({ code: 0, msg: 'success' })

}

async function home(filter) {

    log('home')

    var classes = []

    for (var name in CLASS_MAP) {

        classes.push({

            type_id: CLASS_MAP[name],

            type_name: name

        })

    }

    return JSON.stringify({ class: classes })

}

async function homeContent(filter) {

    return await home(filter)

}

async function homeVod() {

    log('homeVod')

    return await category('watch', '1', false, {})

}

async function category(tid, pg, filter, extend) {

    try {

        var page = parseInt(pg) || 1

        var id = String(tid == null ? '' : tid).trim()

        if (!id || id === 'undefined' || id === 'null') id = 'watch'

        var url

        if (id === 'top_m') {

            url = 'v.php?category=top&m=-1&viewtype=basic&page=' + page

        } else {

            url = 'v.php?category=' + id + '&viewtype=basic&page=' + page

        }

        log('category url=' + url)

        var html = await fetchWithFailover(url)

        var list = parseVideoItems(html)

        return JSON.stringify({

            list: list,

            page: page,

            pagecount: parsePageCount(html),

            limit: 24,

            total: 999999

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

        var vod_id = Array.isArray(ids) ? ids[0] : ids

        if (!vod_id) return JSON.stringify({ list: [] })

        log('detail id=' + vod_id)

        var detailUrl = String(vod_id).indexOf('http') === 0 ? vod_id : absHref(vod_id)

        var html = await fetchWithFailover(detailUrl)

        if (!html) return JSON.stringify({ list: [] })

        var videoUrl = extractVideoUrl(html)

        if (!videoUrl) {

            var evUrl = getEvUrl(html, detailUrl)

            if (evUrl) {

                try {

                    var evHtml = await http(evUrl, { referer: currentHost })

                    videoUrl = extractVideoUrl(evHtml)

                } catch (e) {}

            }

        }

        if (!videoUrl) videoUrl = detailUrl

        // 标题

        var title = '未知标题'

        var titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i)

        if (titleMatch) {

            title = titleMatch[1].split('- 91porn')[0]

                .replace(/&#39;/g, "'")

                .replace(/&amp;/g, '&')

                .replace(/&quot;/g, '"')

                .trim()

        }

        // 封面

        var pic = ''

        var ogMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)

        if (ogMatch) {

            pic = absHref(ogMatch[1])

        } else {

            var posterMatch = html.match(/poster="([^"]+)"/i)

            if (posterMatch) pic = absHref(posterMatch[1])

        }

        // 时长

        var duration = '未知'

        var durMatch = html.match(/\d{2}:\d{2}:\d{2}|\d{2}:\d{2}/)

        if (durMatch) duration = durMatch[0]

        log('最终播放地址: ' + (videoUrl ? videoUrl.substring(0, 80) : '无') + '...')

        return JSON.stringify({

            list: [{

                vod_id: vod_id,

                vod_name: title,

                vod_pic: pic,

                vod_play_from: '91Porn',

                vod_play_url: '高清$' + videoUrl,

                vod_remarks: duration,

                vod_content: title

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

        var isVideo = isVideoFormat(id)

        return JSON.stringify({

            parse: isVideo ? 0 : 1,

            playUrl: '',

            url: id,

            header: JSON.stringify({

                'User-Agent': UA,

                'Referer': currentHost,

                'Origin': currentHost.replace(/\/$/, '')

            })

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

        var encodedKey = encodeURIComponent(wd.trim())

        var url = 'search_result.php?search_id=' + encodedKey + '&search_type=search_videos&min_duration=&page=1'

        var html = await fetchWithFailover(url)

        var list = parseVideoItems(html)

        return JSON.stringify({ list: list })

    } catch (e) {

        log('search error: ' + e)

        return JSON.stringify({ list: [] })

    }

}

async function searchContent(wd, quick, pg) {

    return await search(wd, quick)

}

// ===== T4 标准导出 =====

export function __jsEvalReturn() {

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