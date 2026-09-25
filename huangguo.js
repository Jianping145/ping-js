// 黄果短剧 - 蜂蜜影视 / CatVod / T4 标准版

// 封面为 AES 加密图，T4 无法直接解密，故 vod_pic 置空（显示默认占位图）

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const SITE = 'https://huangguoai.com'

const HEADERS = {

    'User-Agent': UA,

    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',

    'Accept-Language': 'zh-CN,zh;q=0.9',

    'Referer': SITE + '/',

}

const CLASS_MAP = {

    '首页': 'home',

    'AI成人短剧': 'ai-duanju',

    'AI成人漫剧': 'ai-manju',

    'AI换脸': 'ai-huanlian',

    'AI魔改': 'ai-mogai',

    '排行榜': 'ranks/hot',

}

function log(msg) {

    console.log('[黄果短剧] ' + msg)

}

function fix(u) {

    if (!u) return ''

    if (u.indexOf('//') === 0) return 'https:' + u

    if (u.indexOf('/') === 0) return SITE + u

    return u

}

function stripTags(s) {

    return String(s || '').replace(/<[^>]*>/g, '').trim()

}

// 封面处理：加密图直接返回空，避免 Invalid image data 报错

function imgSrc(u) {

    u = fix(u || '')

    if (!u || u.indexOf('<') !== -1) return ''

    // 黄果加密图域名，T4 无法解密，直接置空

    if (u.indexOf('pic.fisawck.cn') !== -1 || u.indexOf('fisawck') !== -1) {

        return ''

    }

    if (u.indexOf('cover-placeholder') !== -1) return ''

    return u

}

async function http(url, referer) {

    const headers = Object.assign({}, HEADERS)

    if (referer) headers['Referer'] = referer

    try {

        const res = await req(url, {

            method: 'get',

            headers: headers,

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

// ---------- 卡片解析 ----------

function gridSlices(html, allGrids) {

    const re = /<div\s+class="[^"]*\bhg-card-grid\b[^"]*"[^>]*>/g

    const starts = []

    let m

    while ((m = re.exec(html)) !== null) starts.push(m.index + m[0].length)

    if (!starts.length) return []

    const slices = []

    const n = allGrids ? starts.length : Math.min(1, starts.length)

    for (let i = 0; i < n; i++) {

        const to = i + 1 < starts.length ? starts[i + 1] : html.length

        slices.push(html.slice(starts[i], to))

    }

    return slices

}

function cardBlocks(slice) {

    const re = /<div\s+class="[^"]*\bhg-drama-card\b[^"]*"[^>]*>/g

    const starts = []

    let m

    while ((m = re.exec(slice)) !== null) starts.push(m.index)

    const blocks = []

    for (let i = 0; i < starts.length; i++) {

        const to = i + 1 < starts.length ? starts[i + 1] : slice.length

        blocks.push(slice.slice(starts[i], to))

    }

    return blocks

}

function parseCardBlock(block) {

    const a = block.match(/href="[^"]*\/detail\/(\d+)\/[^"]*"/)

    if (!a) return null

    const vid = a[1]

    // 封面（加密图会被 imgSrc 置空）

    let pic = ''

    const dataSrcList = block.match(/data-src="([^"]+)"/g) || []

    for (let i = 0; i < dataSrcList.length; i++) {

        const m = dataSrcList[i].match(/data-src="([^"]+)"/)

        if (!m) continue

        const u = m[1]

        if (/\.(jpe?g|png|webp|gif)/i.test(u) || u.indexOf('upload') !== -1) {

            pic = imgSrc(u)

            if (pic) break

        }

    }

    // 标题

    let title = ''

    const t = block.match(/hg-drama-card__title[^>]*>([\s\S]*?)<\/a>/)

    if (t) title = stripTags(t[1])

    if (!title) {

        const tt = block.match(/<a[^>]+href="[^"]*\/detail\/\d+\/"[^>]*>([\s\S]*?)<\/a>/)

        if (tt) title = stripTags(tt[1])

    }

    if (!title) return null

    // 集数 / 评分

    const ep = block.match(/hg-drama-card__episode[^>]*>([\s\S]*?)<\/span>/)

    const score = block.match(/hg-drama-card__score[^>]*>([\s\S]*?)<\/span>/)

    const rem = ep ? stripTags(ep[1]) : ''

    const sc = score ? stripTags(score[1]) : ''

    let remarks = ''

    if (rem && sc) remarks = rem + ' · ' + sc

    else remarks = rem || sc

    return {

        vod_id: vid,

        vod_name: title,

        vod_pic: pic,

        vod_remarks: remarks,

    }

}

function parseGridCards(html, allGrids) {

    if (!html) return []

    const list = []

    const seen = {}

    const slices = gridSlices(html, allGrids)

    for (const slice of slices) {

        for (const block of cardBlocks(slice)) {

            try {

                const item = parseCardBlock(block)

                if (!item || seen[item.vod_id]) continue

                seen[item.vod_id] = true

                list.push(item)

            } catch (e) {}

        }

    }

    log('解析到 ' + list.length + ' 个')

    return list

}

function parseRanks(html) {

    if (!html) return []

    const listM = html.match(/<div\s+class="[^"]*\bhg-rank-list\b[^"]*"[^>]*>/)

    const from = listM ? listM.index + listM[0].length : 0

    const slice = html.slice(from)

    const re = /<div\s+class="[^"]*\bhg-rank-item\b[^"]*"[^>]*>/g

    const starts = []

    let m

    while ((m = re.exec(slice)) !== null) starts.push(m.index)

    const list = []

    const seen = {}

    for (let i = 0; i < starts.length; i++) {

        const to = i + 1 < starts.length ? starts[i + 1] : slice.length

        const block = slice.slice(starts[i], to)

        try {

            const a = block.match(/href="[^"]*\/detail\/(\d+)\/[^"]*"/)

            if (!a || seen[a[1]]) continue

            seen[a[1]] = true

            let pic = ''

            const dataSrcList = block.match(/data-src="([^"]+)"/g) || []

            for (let j = 0; j < dataSrcList.length; j++) {

                const mm = dataSrcList[j].match(/data-src="([^"]+)"/)

                if (mm && (/\.(jpe?g|png|webp)/i.test(mm[1]) || mm[1].indexOf('upload') !== -1)) {

                    pic = imgSrc(mm[1])

                    if (pic) break

                }

            }

            let title = ''

            const t = block.match(/hg-rank-item__title[^>]*>([\s\S]*?)<\/h2>/)

            if (t) title = stripTags(t[1])

            if (!title) {

                const tt = block.match(/<a[^>]+href="[^"]*\/detail\/\d+\/"[^>]*>([\s\S]*?)<\/a>/)

                if (tt) title = stripTags(tt[1])

            }

            if (!title) continue

            const tags = block.match(/hg-rank-item__tags[^>]*>([\s\S]*?)<\/div>/)

            list.push({

                vod_id: a[1],

                vod_name: title,

                vod_pic: pic,

                vod_remarks: tags ? stripTags(tags[1]) : '',

            })

        } catch (e) {}

    }

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

    return await category('home', '1', false, {})

}

async function category(tid, pg, filter, extend) {

    try {

        const page = parseInt(pg) || 1

        let id = String(tid || 'home').replace(/^\//, '')

        log('category id=' + id + ' page=' + page)

        let html = ''

        let list = []

        if (id === 'home') {

            html = await http(SITE + '/')

            list = parseGridCards(html, true)

        } else {

            const url = SITE + '/' + id + '/' + (page > 1 ? page + '/' : '')

            html = await http(url)

            if (id.indexOf('rank') !== -1) {

                list = parseRanks(html)

            } else {

                list = parseGridCards(html, false)

            }

        }

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

        const vid = Array.isArray(ids) ? ids[0] : ids

        if (!vid) return JSON.stringify({ list: [] })

        log('detail id=' + vid)

        const html = await http(SITE + '/detail/' + vid + '/')

        let title = '未知'

        const titleM = html.match(/<h1[^>]*class="[^"]*hg-web-detail__title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ||

                       html.match(/<title>([\s\S]*?)<\/title>/i)

        if (titleM) title = stripTags(titleM[1]).split('-')[0].trim()

        let pic = ''

        const picM = html.match(/og:image[^>]*content="([^"]+)"/i)

        if (picM) pic = imgSrc(picM[1])

        const tracks = []

        const gridM = html.match(/<div\s+class="[^"]*\bhg-web-detail__ep-grid\b[^"]*"[^>]*>([\s\S]*?)<\/div>/)

        if (gridM) {

            const are = /<a\b[^>]*>[\s\S]*?<\/a>/g

            let m

            while ((m = are.exec(gridM[1])) !== null) {

                const tag = m[0]

                const hrefM = tag.match(/href="([^"]+)"/)

                if (!hrefM) continue

                const href = fix(hrefM[1])

                const eidM = tag.match(/data-ep-id="([^"]*)"/)

                const eid = eidM ? eidM[1] : ''

                const name = eid ? '第' + eid + '集' : stripTags(tag)

                tracks.push(name + '$' + href + '|' + eid)

            }

        }

        if (!tracks.length) {

            const playM = html.match(/<a\b[^>]*class="[^"]*\bhg-web-detail__play\b[^"]*"[^>]*href="([^"]+)"/)

            if (playM) {

                tracks.push('第1集$' + fix(playM[1]) + '|1')

            }

        }

        if (!tracks.length) return JSON.stringify({ list: [] })

        return JSON.stringify({

            list: [{

                vod_id: vid,

                vod_name: title,

                vod_pic: pic,

                vod_play_from: '黄果短剧',

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

        log('play id=' + id)

        let playUrl = id

        let ep = '1'

        if (id.indexOf('|') !== -1) {

            const parts = id.split('|')

            playUrl = parts[0]

            ep = parts[1] || '1'

        }

        const html = await http(playUrl, SITE)

        let realUrl = ''

        const m = html.match(/id="videoInitialData"[^>]*>([\s\S]*?)<\/script>/)

        if (m) {

            try {

                const data = JSON.parse(m[1])

                const srcs = (data && data.epPlaySrcs) || {}

                realUrl = srcs[ep] || (data && data.videoSrc) || ''

            } catch (e) {}

        }

        if (realUrl) {

            realUrl = realUrl.replace(/\\u0026/g, '&')

            if (realUrl.indexOf('http') !== 0) {

                const mm = realUrl.match(/(https?:\/\/[^\s"']+)/)

                realUrl = mm ? mm[1] : ''

            }

        }

        if (!realUrl) {

            return JSON.stringify({

                parse: 1,

                url: playUrl,

                header: JSON.stringify({

                    'User-Agent': UA,

                    'Referer': SITE + '/',

                }),

            })

        }

        return JSON.stringify({

            parse: 0,

            url: realUrl,

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

        const html = await http(SITE + '/search/video/' + encodeURIComponent(wd.trim()) + '/')

        const list = parseGridCards(html, false)

        return JSON.stringify({ list: list })

    } catch (e) {

        log('search error: ' + e)

        return JSON.stringify({ list: [] })

    }

}

async function searchContent(wd, quick, pg) {

    return await search(wd, quick)

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