// pornhub.js - T4 蜂蜜影视完整版

// 排序/分类走 Webmaster API；teen、hd 等走网页路径

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const API = 'https://www.pornhub.com/webmasters'

const SITE = 'https://cn.pornhub.com'

const HEADERS = {

    'User-Agent': UA,

    'Accept': 'application/json, text/plain, */*',

    'Referer': 'https://www.pornhub.com/',

}

const PAGE_HEADERS = {

    'User-Agent': UA,

    'Cookie': 'age_verified=1; accessAgeDisclaimerPH=1; accessPH=1; platform=pc',

    'Referer': SITE + '/',

}

// type_id:

//   o:xxx              排序 (featured/newest/mostviewed/rating)

//   cat:name           Webmaster 分类名

//   path:/xxx          网页路径

//   q:keyword          搜索词

const TABS = [

    { type_id: 'o:featured', type_name: '精选' },

    { type_id: 'o:newest', type_name: '最新' },

    { type_id: 'o:mostviewed', type_name: '最多观看' },

    { type_id: 'o:rating', type_name: '最高评分' },

    { type_id: 'path:/categories/teen', type_name: 'Teen' },

    { type_id: 'path:/hd', type_name: 'HD' },

    { type_id: 'cat:college-18', type_name: 'College' },

    { type_id: 'cat:pornstar', type_name: 'Pornstar' },

    { type_id: 'cat:babe', type_name: 'Babe' },

    { type_id: 'cat:hentai', type_name: 'Hentai' },

    { type_id: 'cat:sfw', type_name: 'SFW' },

    { type_id: 'cat:popular-with-women', type_name: '女生爱看' },

    { type_id: 'cat:transgender', type_name: 'Transgender' },

    { type_id: 'q:深喉', type_name: '深喉' },

    { type_id: 'q:ai生成', type_name: 'AI生成' },

    { type_id: 'cat:60fps-1', type_name: '60FPS' },

    { type_id: 'cat:threesome', type_name: '3P' },

    { type_id: 'cat:orgy', type_name: '群交' },

    { type_id: 'cat:asian', type_name: '亚洲' },

    { type_id: 'cat:japanese', type_name: '日本' },

    { type_id: 'cat:cosplay', type_name: 'Cosplay' },

    { type_id: 'cat:russian', type_name: '俄罗斯' },

    { type_id: 'cat:creampie', type_name: '内射' },

    { type_id: 'cat:public', type_name: '公开' },

    { type_id: 'cat:hardcore', type_name: '重口' },

    { type_id: 'cat:indian', type_name: '印度' },

    { type_id: 'cat:bisexual-male', type_name: '双性恋男' },

    { type_id: 'cat:casting', type_name: '选角' },

    { type_id: 'cat:gaming', type_name: '游戏' },

    { type_id: 'cat:double-penetration', type_name: '双插' },

    { type_id: 'cat:blowjob', type_name: '口交' },

    { type_id: 'cat:behind-the-scenes', type_name: '花絮' },

    { type_id: 'cat:compilation', type_name: '合集' },

    { type_id: 'cat:lesbian', type_name: '女同' },

    { type_id: 'cat:solo-female', type_name: '女独' },

    { type_id: 'cat:female-orgasm', type_name: '高潮' },

    { type_id: 'cat:cuckold', type_name: '绿帽' },

    { type_id: 'cat:cumshot', type_name: '颜射' },

    { type_id: 'cat:big-tits', type_name: '巨乳' },

    { type_id: 'cat:big-dick', type_name: '大鸡吧' },

    { type_id: 'cat:verified-couples', type_name: '认证情侣' },

    { type_id: 'cat:verified-models', type_name: '认证模特' },

    { type_id: 'cat:verified-amateurs', type_name: '认证素人' },

    { type_id: 'cat:brazilian', type_name: '巴西' },

    { type_id: 'cat:german', type_name: '德国' },

    { type_id: 'cat:toys', type_name: '玩具' },

    { type_id: 'cat:fetish', type_name: '恋物' },

    { type_id: 'cat:italian', type_name: '意大利' },

    { type_id: 'cat:handjob', type_name: '手交' },

    { type_id: 'cat:masturbation', type_name: '自慰' },

    { type_id: 'cat:latina', type_name: '拉丁' },

    { type_id: 'cat:fisting', type_name: '拳交' },

    { type_id: 'cat:bondage', type_name: '束缚' },

    { type_id: 'cat:czech', type_name: '捷克' },

    { type_id: 'cat:school-18', type_name: '学校' },

    { type_id: 'cat:euro', type_name: '欧洲' },

    { type_id: 'cat:french', type_name: '法国' },

    { type_id: 'cat:romantic', type_name: '浪漫' },

    { type_id: 'cat:brunette', type_name: '黑发' },

    { type_id: 'cat:parody', type_name: '恶搞' },

    { type_id: 'cat:squirt', type_name: '潮吹' },

    { type_id: 'cat:babysitter-18', type_name: '保姆' },

    { type_id: 'cat:anal', type_name: '肛交' },

    { type_id: 'cat:exclusive', type_name: '独家' },

    { type_id: 'cat:reality', type_name: '真实' },

    { type_id: 'cat:pov', type_name: 'POV' },

    { type_id: 'cat:rough-sex', type_name: '粗暴' },

    { type_id: 'cat:amateur', type_name: '业余' },

    { type_id: 'cat:red-head', type_name: '红发' },

    { type_id: 'cat:tattooed-women', type_name: '纹身女' },

    { type_id: 'cat:step-fantasy', type_name: '继亲幻想' },

    { type_id: 'cat:old-young-18', type_name: '老少' },

    { type_id: 'cat:muscular-men', type_name: '肌肉男' },

    { type_id: 'cat:big-ass', type_name: '大屁股' },

    { type_id: 'cat:pussy-licking', type_name: '舔阴' },

    { type_id: 'cat:british', type_name: '英国' },

    { type_id: 'cat:webcam', type_name: 'Webcam' },

    { type_id: 'cat:role-play', type_name: '角色扮演' },

    { type_id: 'cat:small-tits', type_name: '贫乳' },

    { type_id: 'cat:interracial', type_name: '跨种族' },

    { type_id: 'cat:gangbang', type_name: '轮奸' },

    { type_id: 'cat:milf', type_name: '熟女' },

    { type_id: 'cat:blonde', type_name: '金发' },

    { type_id: 'cat:arab', type_name: '阿拉伯' },

    { type_id: 'cat:bukkake', type_name: 'Bukkake' },

    { type_id: 'cat:korean', type_name: '韩国' },

    { type_id: 'cat:ebony', type_name: '黑人女' },

    { type_id: 'cat:music', type_name: '音乐' },

    { type_id: 'cat:vintage', type_name: '复古' },

    { type_id: 'cat:deepthroat', type_name: '深喉分类' },

    { type_id: 'cat:ai', type_name: 'AI分类' },

]

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

    return await category('o:featured', '1', false, {})

}

async function category(tid, pg, filter, extend) {

    try {

        var page = parseInt(pg) || 1

        var id = String(tid == null ? '' : tid).trim()

        if (!id || id === 'undefined' || id === 'null') id = 'o:featured'

        var url = ''

        if (id.indexOf('o:') === 0) {

            var ordering = id.slice(2)

            url = API + '/search?ordering=' + encodeURIComponent(ordering) + '&page=' + page + '&thumbsize=large'

        } else if (id.indexOf('q:') === 0) {

            var kw = id.slice(2)

            url = API + '/search?search=' + encodeURIComponent(kw) + '&page=' + page + '&thumbsize=large'

        } else if (id.indexOf('path:') === 0) {

            var path = id.slice(5)

            if (path.charAt(0) !== '/') path = '/' + path

            url = SITE + path

            if (page > 1) {

                url = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'page=' + page

            }

            return await categoryByHtml(url, page)

        } else if (id.indexOf('cat:') === 0) {

            var cat = id.slice(4)

            url = API + '/search?category=' + encodeURIComponent(cat) + '&page=' + page + '&thumbsize=large'

        } else if (id.indexOf('c:') === 0 || /^\d+$/.test(id)) {

            var cid = id.indexOf('c:') === 0 ? id.slice(2) : id

            url = SITE + '/video?c=' + encodeURIComponent(cid)

            if (page > 1) url = url + '&page=' + page

            return await categoryByHtml(url, page)

        } else {

            if (id === 'featured' || id === 'sy' || id === 'home') id = 'featured'

            if (id === 'cm') id = 'newest'

            if (id === 'mv') id = 'mostviewed'

            if (id === 'tr' || id === 'ht') id = 'rating'

            url = API + '/search?ordering=' + encodeURIComponent(id) + '&page=' + page + '&thumbsize=large'

        }

        console.log('[PH] category url=' + url)

        var res = await req(url, { headers: HEADERS })

        var data = parseJson(res)

        var videos = []

        if (data && Array.isArray(data.videos)) videos = data.videos

        else if (Array.isArray(data)) videos = data

        var list = videosToList(videos)

        console.log('[PH] list=' + list.length)

        return JSON.stringify({

            list: list,

            page: page,

            pagecount: list.length >= 20 ? page + 1 : page,

            limit: 30,

            total: list.length > 0 ? page * 30 + 1 : 0,

        })

    } catch (e) {

        console.log('[PH] category error: ' + e)

        return JSON.stringify({ list: [], page: 1, pagecount: 1, total: 0 })

    }

}

async function categoryContent(tid, pg, filter, extend) {

    return await category(tid, pg, filter, extend)

}

async function categoryByHtml(url, page) {

    try {

        console.log('[PH] html url=' + url)

        var res = await req(url, { headers: PAGE_HEADERS })

        var html = getHtml(res)

        var list = parseHtmlList(html)

        console.log('[PH] html list=' + list.length)

        return JSON.stringify({

            list: list,

            page: page,

            pagecount: list.length >= 20 ? page + 1 : page,

            limit: 40,

            total: list.length > 0 ? page * 40 + 1 : 0,

        })

    } catch (e) {

        console.log('[PH] html error: ' + e)

        return JSON.stringify({ list: [], page: 1, pagecount: 1, total: 0 })

    }

}

async function detail(ids) {

    try {

        var id = Array.isArray(ids) ? ids[0] : ids

        id = String(id).replace(/^.*viewkey=/i, '').replace(/[^a-z0-9]/gi, '')

        console.log('[PH] detail id=' + id)

        var title = 'Pornhub'

        var pic = ''

        try {

            var infoRes = await req(API + '/video_by_id?id=' + id, { headers: HEADERS })

            var info = parseJson(infoRes)

            var video = (info && info.video) ? info.video : (info || {})

            if (video.title) title = video.title

            if (video.thumb) pic = video.thumb

            else if (video.default_thumb) pic = video.default_thumb

        } catch (e1) {

            console.log('[PH] video_by_id fail: ' + e1)

        }

        var pageUrl = SITE + '/view_video.php?viewkey=' + id

        var pageRes = await req(pageUrl, { headers: PAGE_HEADERS })

        var html = getHtml(pageRes)

        var playUrls = []

        var m = html.match(/var\s+flashvars_\d+\s*=\s*(\{[\s\S]*?\});/)

        if (m) {

            var json = JSON.parse(m[1])

            if (json.video_title) title = json.video_title

            if (json.image_url) pic = json.image_url

            var defs = json.mediaDefinitions || []

            var hls = []

            for (var i = 0; i < defs.length; i++) {

                if (defs[i].format === 'hls' && defs[i].videoUrl) hls.push(defs[i])

            }

            hls.sort(function (a, b) {

                return (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0)

            })

            for (var j = 0; j < hls.length; j++) {

                playUrls.push(hls[j].quality + 'p$' + hls[j].videoUrl)

            }

        }

        if (playUrls.length === 0) playUrls.push('网页$' + pageUrl)

        return JSON.stringify({

            list: [{

                vod_id: id,

                vod_name: title,

                vod_pic: pic,

                vod_remarks: '',

                vod_content: '',

                vod_play_from: 'Pornhub',

                vod_play_url: playUrls.join('#'),

            }],

        })

    } catch (e) {

        console.log('[PH] detail error: ' + e)

        return JSON.stringify({ list: [] })

    }

}

async function detailContent(ids) {

    return await detail(ids)

}

async function play(flag, id, vipFlags) {

    try {

        console.log('[PH] play ' + id)

        if (String(id).indexOf('view_video.php') >= 0) {

            return JSON.stringify({ parse: 1, url: id })

        }

        return JSON.stringify({

            parse: 0,

            url: id,

            header: JSON.stringify({

                'User-Agent': UA,

                'Referer': SITE + '/',

                'Origin': SITE,

            }),

        })

    } catch (e) {

        console.log('[PH] play error: ' + e)

        return JSON.stringify({ url: '' })

    }

}

async function playerContent(flag, id, vipFlags) {

    return await play(flag, id, vipFlags)

}

async function search(wd, quick) {

    try {

        if (!wd) return JSON.stringify({ list: [] })

        var url = API + '/search?search=' + encodeURIComponent(wd) + '&page=1&thumbsize=large'

        console.log('[PH] search url=' + url)

        var res = await req(url, { headers: HEADERS })

        var data = parseJson(res)

        var videos = (data && data.videos) ? data.videos : []

        return JSON.stringify({ list: videosToList(videos) })

    } catch (e) {

        console.log('[PH] search error: ' + e)

        return JSON.stringify({ list: [] })

    }

}

async function searchContent(wd, quick, pg) {

    return await search(wd, quick)

}

function videosToList(videos) {

    var list = []

    for (var i = 0; i < videos.length; i++) {

        var v = videos[i]

        var id = ''

        if (v.video_id) id = String(v.video_id)

        else if (v.vkey) id = String(v.vkey)

        else if (v.url) {

            var m = String(v.url).match(/viewkey=([a-z0-9]+)/i)

            if (m) id = m[1]

        }

        if (!id) continue

        list.push({

            vod_id: id,

            vod_name: v.title || 'Video',

            vod_pic: v.thumb || v.default_thumb || '',

            vod_remarks: formatMeta(v),

        })

    }

    return list

}

function parseHtmlList(html) {

    var list = []

    if (!html) return list

    var blocks = html.split(/<li[^>]*class="[^"]*(?:videoBox|pcVideoListItem)[^"]*"/i)

    for (var i = 1; i < blocks.length; i++) {

        var block = blocks[i]

        var end = block.indexOf('</li>')

        if (end > 0 && end < 10000) block = block.slice(0, end)

        var hrefM = block.match(/href="(\/view_video\.php\?viewkey=[a-z0-9]+)"/i)

        if (!hrefM) continue

        var href = hrefM[1]

        var idM = href.match(/viewkey=([a-z0-9]+)/i)

        var id = idM ? idM[1] : href

        var titleM = block.match(/title="([^"]{2,})"/i)

        var title = titleM ? decodeHtml(titleM[1]) : 'Video'

        var cover = ''

        var imgM = block.match(/data-mediumthumb="(https?:\/\/[^"]+)"/i)

            || block.match(/data-image="(https?:\/\/[^"]+)"/i)

            || block.match(/src="(https?:\/\/[^"]*(?:phncdn|pix-)[^"]*)"/i)

        if (imgM) cover = imgM[1]

        list.push({

            vod_id: id,

            vod_name: title,

            vod_pic: cover,

            vod_remarks: '',

        })

    }

    return list

}

function parseJson(res) {

    var text = getHtml(res)

    if (!text) {

        if (res && typeof res === 'object') {

            if (res.videos) return res

            if (res.data) return res.data

        }

        return {}

    }

    try {

        return JSON.parse(text)

    } catch (e) {

        console.log('[PH] json fail: ' + text.slice(0, 100))

        return {}

    }

}

function getHtml(res) {

    if (typeof res === 'string') return res

    if (res && typeof res.content === 'string') return res.content

    if (res && typeof res.data === 'string') return res.data

    if (res && res.body) return String(res.body)

    return ''

}

function formatMeta(v) {

    var parts = []

    if (v.duration) parts.push(String(v.duration))

    if (v.views) parts.push(String(v.views))

    if (v.rating) parts.push(String(v.rating))

    return parts.join(' · ')

}

function decodeHtml(s) {

    return String(s || '')

        .replace(/&amp;/g, '&')

        .replace(/&lt;/g, '<')

        .replace(/&gt;/g, '>')

        .replace(/&quot;/g, '"')

        .replace(/&#39;/g, "'")

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