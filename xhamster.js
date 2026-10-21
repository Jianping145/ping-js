// xhamster.js - T4 蜂蜜影视完整版
// 修复4K、频道二级、类别三级、明星二级

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'

const SITE = 'https://zh.xhamster1.desi'

const HEADERS = {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': SITE + '/',
}

const TABS = [
    { type_id: '/newest', type_name: '最新' },
    { type_id: '/best', type_name: '最佳' },
    { type_id: '/4k', type_name: '4K' },
    { type_id: '/categories', type_name: '类别' },
    { type_id: '/channels', type_name: '频道' },
    { type_id: '/pornstars', type_name: '明星' },
]

// 缓存类别数据
var categoriesCache = null

async function init(cfg) {
    return JSON.stringify({ code: 0, msg: 'success' })
}

async function home(filter) {
    return JSON.stringify({ class: TABS })
}

async function homeContent(filter) {
    return await home(filter)
}

async function homeVod() {
    return await category('/newest', '1', false, {})
}

async function category(tid, pg, filter, extend) {
    try {
        var page = parseInt(pg) || 1
        var id = String(tid || '').trim()
        if (!id) id = '/newest'

        console.log('[XH] category id=' + id + ' page=' + page)

        // 处理二级分类前缀
        if (id.indexOf('two_click_') === 0) {
            id = id.replace('two_click_', '')
            // 频道二级或类别三级
            return await categoryDetail(id, page)
        } else if (id.indexOf('one_click_') === 0) {
            var catId = id.replace('one_click_', '')
            return await categorySub(catId)
        }

        var url = SITE + id
        if (page > 1) {
            url = url + (url.indexOf('?') >= 0 ? '&' : '/') + page
        }

        console.log('[XH] url=' + url)

        var res = await req(url, { headers: HEADERS })
        var html = getHtml(res)
        var data = getInitialData(html)

        var list = []

        if (id === '/channels') {
            list = parseChannels(data)
        } else if (id === '/categories') {
            list = parseCategories(data)
        } else if (id === '/pornstars') {
            list = parsePornstars(data)
        } else if (id === '/4k') {
            // 4K视频在 trendingVideoListProps
            list = parseVideosFrom(data, 'layoutPage.trendingVideoListProps.videoThumbProps')
        } else {
            // 普通视频列表
            list = parseVideosFrom(data, 'layoutPage.videoListProps.videoThumbProps')
        }

        console.log('[XH] list=' + list.length)

        // 频道/明星等列表较多，有数据就允许继续翻页；视频列表按数量判断
        var hasMore = false
        if (id === '/channels' || id === '/pornstars') {
            hasMore = list.length > 0
        } else {
            hasMore = list.length >= 20
        }

        return JSON.stringify({
            list: list,
            page: page,
            pagecount: hasMore ? page + 1 : page,
            limit: 30,
            total: list.length > 0 ? page * 30 + 1 : 0,
        })
    } catch (e) {
        console.log('[XH] category error: ' + e)
        return JSON.stringify({ list: [], page: 1, pagecount: 1, total: 0 })
    }
}

async function categoryContent(tid, pg, filter, extend) {
    return await category(tid, pg, filter, extend)
}

// 处理类别二级分类（显示子类别）
async function categorySub(catId) {
    try {
        console.log('[XH] categorySub id=' + catId)

        if (!categoriesCache) {
            var res = await req(SITE + '/categories', { headers: HEADERS })
            var html = getHtml(res)
            categoriesCache = getInitialData(html)
        }

        var list = []
        var assignable = categoriesCache.layoutPage.store.popular.assignable || []

        for (var i = 0; i < assignable.length; i++) {
            if (String(assignable[i].id) === String(catId)) {
                var items = assignable[i].items || []
                for (var j = 0; j < items.length; j++) {
                    list.push({
                        vod_id: 'two_click_' + (items[j].url || ''),
                        vod_name: items[j].name || '',
                        vod_pic: items[j].thumb || '',
                        vod_tag: 'folder',
                    })
                }
                break
            }
        }

        console.log('[XH] categorySub list=' + list.length)

        return JSON.stringify({
            list: list,
            page: 1,
            pagecount: 1,
            limit: 30,
            total: list.length,
        })
    } catch (e) {
        console.log('[XH] categorySub error: ' + e)
        return JSON.stringify({ list: [], page: 1, pagecount: 1, total: 0 })
    }
}

// 处理频道二级、类别三级、明星二级（显示视频列表）
async function categoryDetail(path, page) {
    try {
        var url = path.startsWith('http') ? path : SITE + path
        if (page > 1) {
            url = url + (url.indexOf('?') >= 0 ? '&' : '/') + page
        }

        console.log('[XH] categoryDetail url=' + url)

        var res = await req(url, { headers: HEADERS })
        var html = getHtml(res)
        var data = getInitialData(html)

        var list = []

        // 根据页面类型从不同位置提取视频
        if (path.indexOf('/channels/') >= 0) {
            // 频道视频
            list = parseVideosFrom(data, 'layoutPage.videoListProps.videoThumbProps')
        } else if (path.indexOf('/categories/') >= 0) {
            // 类别三级视频
            list = parseVideosFrom(data, 'pagesCategoryComponent.trendingVideoListProps.videoThumbProps')
        } else if (path.indexOf('/pornstars/') >= 0) {
            // 明星视频
            list = parseVideosFrom(data, 'newestVideoSectionComponent.videoListProps.videoThumbProps')
            // 如果newest没有，尝试trending
            if (list.length === 0) {
                list = parseVideosFrom(data, 'trendingVideoSectionComponent.videoListProps.videoThumbProps')
            }
        } else {
            // 通用：尝试多个位置
            list = parseVideosFrom(data, 'layoutPage.videoListProps.videoThumbProps')
            if (list.length === 0) list = parseVideosFrom(data, 'layoutPage.trendingVideoListProps.videoThumbProps')
            if (list.length === 0) list = parseVideosFrom(data, 'pagesCategoryComponent.trendingVideoListProps.videoThumbProps')
            if (list.length === 0) list = parseVideosFrom(data, 'newestVideoSectionComponent.videoListProps.videoThumbProps')
        }

        console.log('[XH] categoryDetail list=' + list.length)

        return JSON.stringify({
            list: list,
            page: page,
            pagecount: list.length >= 20 ? page + 1 : page,
            limit: 30,
            total: list.length > 0 ? page * 30 + 1 : 0,
        })
    } catch (e) {
        console.log('[XH] categoryDetail error: ' + e)
        return JSON.stringify({ list: [], page: 1, pagecount: 1, total: 0 })
    }
}

async function detail(ids) {
    try {
        var id = Array.isArray(ids) ? ids[0] : ids
        id = String(id).trim()

        console.log('[XH] detail id=' + id)

        var url = id.startsWith('http') ? id : SITE + id
        var res = await req(url, { headers: HEADERS })
        var html = getHtml(res)

        var title = 'Xhamster'
        var titleM = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
        if (titleM) title = decodeHtml(titleM[1])

        var pic = ''
        var picM = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
        if (picM) pic = picM[1]

        var playUrl = ''
        // 更灵活地匹配preload link
        var linkM = html.match(/<link[^>]*rel=["']preload["'][^>]*href=["']([^"']*m3u8[^"']*)["']/i)
        if (!linkM) linkM = html.match(/href=["']([^"']*m3u8[^"']*)["']/i)
        if (linkM) playUrl = linkM[1]

        var playUrls = []
        if (playUrl) {
            // 检测可用分辨率
            var qualities = ['2160p', '1080p', '720p', '480p', '360p', '240p']
            var availableQualities = []
            for (var i = 0; i < qualities.length; i++) {
                var q = qualities[i]
                var qUrl = playUrl.replace('_TPL_', q)
                if (await testUrl(qUrl)) {
                    playUrls.push(q + '$666_' + qUrl)
                    availableQualities.push(q)
                }
            }
            // 如果没有4K，添加提示
            if (availableQualities.indexOf('2160p') < 0) {
                title = title + ' [无4K]'
            }
            // 如果都没有，使用默认480p
            if (playUrls.length === 0) {
                playUrls.push('480p$666_' + playUrl.replace('_TPL_', '480p'))
            }
        } else {
            playUrls.push('嗅探$' + url)
        }

        return JSON.stringify({
            list: [{
                vod_id: id,
                vod_name: title,
                vod_pic: pic,
                vod_remarks: '',
                vod_content: '',
                vod_play_from: 'Xhamster',
                vod_play_url: playUrls.join('#'),
            }],
        })
    } catch (e) {
        console.log('[XH] detail error: ' + e)
        return JSON.stringify({ list: [] })
    }
}

async function detailContent(ids) {
    return await detail(ids)
}

async function play(flag, id, vipFlags) {
    try {
        console.log('[XH] play ' + id)

        var parse = 1
        var url = id

        if (id.indexOf('666_') === 0) {
            parse = 0
            url = id.substring(4)
        }

        return JSON.stringify({
            parse: parse,
            url: url,
            header: JSON.stringify({
                'User-Agent': UA,
                'Origin': SITE,
                'Referer': SITE + '/',
            }),
        })
    } catch (e) {
        console.log('[XH] play error: ' + e)
        return JSON.stringify({ url: '' })
    }
}

async function playerContent(flag, id, vipFlags) {
    return await play(flag, id, vipFlags)
}

async function search(wd, quick) {
    try {
        if (!wd) return JSON.stringify({ list: [] })

        var url = SITE + '/search/' + encodeURIComponent(wd) + '?page=1'
        console.log('[XH] search url=' + url)

        var res = await req(url, { headers: HEADERS })
        var html = getHtml(res)
        var data = getInitialData(html)

        var list = parseVideosFrom(data, 'layoutPage.videoListProps.videoThumbProps')

        return JSON.stringify({ list: list })
    } catch (e) {
        console.log('[XH] search error: ' + e)
        return JSON.stringify({ list: [] })
    }
}

async function searchContent(wd, quick, pg) {
    return await search(wd, quick)
}

// 从指定路径解析视频列表
function parseVideosFrom(data, path) {
    var list = []
    if (!data) return list

    try {
        var keys = path.split('.')
        var obj = data
        for (var i = 0; i < keys.length; i++) {
            if (!obj) break
            obj = obj[keys[i]]
        }

        if (obj && Array.isArray(obj)) {
            for (var j = 0; j < obj.length; j++) {
                var v = obj[j]
                list.push({
                    vod_id: v.pageURL || '',
                    vod_name: v.title || 'Video',
                    vod_pic: v.thumbURL || v.imageURL || '',
                    vod_remarks: formatDuration(v.duration),
                    vod_year: v.views ? String(v.views) : '',
                })
            }
        }
    } catch (e) {
        console.log('[XH] parseVideosFrom error: ' + e)
    }

    return list
}

// 解析频道列表（channels 在 layoutPage 下）
function parseChannels(data) {
    var list = []
    if (!data) return list

    // 优先 layoutPage.channels，再兼容根节点
    var channels = null
    if (data.layoutPage && data.layoutPage.channels) {
        channels = data.layoutPage.channels
    } else if (data.channels) {
        channels = data.channels
    }
    if (!channels || !Array.isArray(channels)) return list

    for (var i = 0; i < channels.length; i++) {
        var ch = channels[i]
        if (!ch) continue
        list.push({
            vod_id: 'two_click_' + (ch.channelURL || ch.pageURL || ch.url || ''),
            vod_name: ch.channelName || ch.name || '',
            vod_pic: ch.siteLogoURL || ch.thumbURL || ch.imageURL || '',
            vod_remarks: 'videos:' + (ch.videoCount || 0),
            vod_tag: 'folder',
        })
    }
    return list
}

// 解析类别列表
function parseCategories(data) {
    var list = []
    if (!data || !data.layoutPage) return list

    try {
        var assignable = data.layoutPage.store.popular.assignable || []
        for (var i = 0; i < assignable.length; i++) {
            list.push({
                vod_id: 'one_click_' + assignable[i].id,
                vod_name: assignable[i].name || '',
                vod_pic: '',
                vod_tag: 'folder',
            })
        }
        categoriesCache = data
    } catch (e) {
        console.log('[XH] parseCategories error: ' + e)
    }
    return list
}

// 解析明星列表
function parsePornstars(data) {
    var list = []
    if (!data || !data.layoutPage) return list

    try {
        var stars = data.layoutPage.pornstarListProps.pornstars || []
        for (var i = 0; i < stars.length; i++) {
            list.push({
                vod_id: 'two_click_' + (stars[i].pageURL || ''),
                vod_name: stars[i].name || '',
                vod_pic: stars[i].imageThumbUrl || stars[i].logoThumbUrl || '',
                vod_remarks: stars[i].translatedCountryName || '',
                vod_tag: 'folder',
            })
        }
    } catch (e) {
        console.log('[XH] parsePornstars error: ' + e)
    }
    return list
}

// 获取页面初始化数据（括号平衡，防止大JSON被截断）
function getInitialData(html) {
    try {
        if (!html) return null
        var start = -1
        var markers = ['window.initials=', 'initials=']
        for (var mi = 0; mi < markers.length; mi++) {
            var pos = html.indexOf(markers[mi])
            if (pos !== -1) {
                start = pos + markers[mi].length
                break
            }
        }
        if (start === -1) return null

        while (start < html.length && ' \t\n\r'.indexOf(html.charAt(start)) >= 0) start++
        if (start >= html.length || html.charAt(start) !== '{') return null

        var depth = 0
        var inStr = false
        var escape = false
        for (var i = start; i < html.length; i++) {
            var c = html.charAt(i)
            if (inStr) {
                if (escape) {
                    escape = false
                } else if (c === '\\') {
                    escape = true
                } else if (c === '"') {
                    inStr = false
                }
            } else {
                if (c === '"') {
                    inStr = true
                } else if (c === '{') {
                    depth++
                } else if (c === '}') {
                    depth--
                    if (depth === 0) {
                        return JSON.parse(html.substring(start, i + 1))
                    }
                }
            }
        }
    } catch (e) {
        console.log('[XH] getInitialData error: ' + e)
    }
    return null
}

function formatDuration(seconds) {
    if (!seconds) return ''
    var m = Math.floor(seconds / 60)
    var s = seconds % 60
    return m + ':' + (s < 10 ? '0' + s : s)
}

function getHtml(res) {
    if (typeof res === 'string') return res
    if (res && typeof res.content === 'string') return res.content
    if (res && typeof res.data === 'string') return res.data
    if (res && res.body) return String(res.body)
    return ''
}

function decodeHtml(s) {
    return String(s || '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
}

// 测试URL是否可访问
async function testUrl(url) {
    try {
        var res = await req(url, { 
            headers: HEADERS,
            method: 'HEAD'
        })
        return true
    } catch (e) {
        return false
    }
}

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
