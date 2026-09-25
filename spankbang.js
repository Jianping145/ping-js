// SpankBang - 蜂蜜影视 / CatVod / T4 标准版

// 站点: https://jp.spankbang.com

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/604.1.14 (KHTML, like Gecko)'

const SITE = 'https://jp.spankbang.com'

const CLASS_MAP = {

    '最新': 'new_videos',

    '热门': 'trending_videos',

    '正在观看': 'upcoming',

    '高清': 'high_resolution',

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

async function http(url) {

    try {

        const res = await req(url, {

            method: 'get',

            headers: {

                'User-Agent': UA,

                'Accept-Language': 'ja,en;q=0.9',

                'Referer': SITE + '/',

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

// 解析列表

function parseList(html) {

    const list = []

    if (!html) return list

    // 匹配 video-item

    const itemRe = /<div[^>]*class="[^"]*video-item[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*video-item|$)/gi

    let m

    const seen = {}

    while ((m = itemRe.exec(html)) !== null) {

        const block = m[1]

        try {

            const hrefM = block.match(/<a[^>]*class="[^"]*thumb[^"]*"[^>]*href="([^"]+)"/i) ||

                          block.match(/href="(\/[^"]*\/video\/[^"]+)"/i)

            if (!hrefM) continue

            const href = hrefM[1]

            if (seen[href]) continue

            seen[href] = true

            const titleM = block.match(/<img[^>]*class="[^"]*cover[^"]*"[^>]*alt="([^"]*)"/i) ||

                           block.match(/alt="([^"]*)"/i)

            const title = titleM ? titleM[1].trim() : ''

            const picM = block.match(/data-src="([^"]+)"/i) ||

                         block.match(/src="([^"]+)"/i)

            const pic = picM ? fix(picM[1]) : ''

            if (!title) continue

            list.push({

                vod_id: fix(href),

                vod_name: title,

                vod_pic: pic,

                vod_remarks: '',

            })

        } catch (e) {}

    }

    // 搜索页兜底 js-video-item

    if (list.length === 0) {

        const itemRe2 = /<div[^>]*class="[^"]*js-video-item[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*js-video-item|$)/gi

        while ((m = itemRe2.exec(html)) !== null) {

            const block = m[1]

            try {

                const hrefM = block.match(/href="([^"]*\/video\/[^"]+)"/i)

                if (!hrefM) continue

                const href = hrefM[1]

                if (seen[href]) continue

                seen[href] = true

                const titleM = block.match(/alt="([^"]*)"/i)

                const title = titleM ? titleM[1].trim() : ''

                const picM = block.match(/data-src="([^"]+)"/i) || block.match(/src="([^"]+)"/i)

                const pic = picM ? fix(picM[1]) : ''

                if (!title) continue

                list.push({

                    vod_id: fix(href),

                    vod_name: title,

                    vod_pic: pic,

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

        const url = SITE + '/' + id + '/' + page

        const html = await http(url)

        // Cloudflare 检测

        if (html && html.indexOf('Just a moment') !== -1) {

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

            title = titleM[1].replace(/-\s*SpankBang.*$/i, '').trim()

        }

        const h1M = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)

        if (h1M) title = h1M[1].replace(/<[^>]+>/g, '').trim() || title

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

                } else if (tracks.length > 0) {

                    // 已有清晰度就不额外加

                }

            } catch (e) {

                log('stream_data 解析失败: ' + e)

            }

        }

        if (tracks.length === 0) {

            // 兜底：尝试直接匹配 mp4/m3u8

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