const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/604.1.14 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1'

const SITE = 'https://exporntoons.net'

// ============ 分类定义 ============

// 格式: { type_id, type_name }

// type_id 为 video/关键词 时，category 会自动拼成 SITE/video/关键词

const TAG_CLASSES = [

    { type_id: 'video/shemale+film+retro', type_name: 'Shemale Film Retro' },

    { type_id: 'video/japenese+mom+n+son', type_name: 'Japanese Mom N Son' },

    { type_id: 'video/pis+japen', type_name: 'Pis Japon' },

    { type_id: 'video/sport', type_name: 'Sport' },

    { type_id: 'video/riley+reid+gangbang', type_name: 'Riley Reid Gangbang' },

    { type_id: 'video/full+2010+movies', type_name: 'Full 2010 Movies' },

    { type_id: 'video/mivd+212', type_name: 'Mivd 212' },

    { type_id: 'video/dldss+385+yuko+ono', type_name: 'Dldss 385 Yuko Ono' },

    { type_id: 'video/34+g+tits', type_name: '34 G Tits' },

    { type_id: 'video/lily+blossom', type_name: 'Lily Blossom' },

    { type_id: 'video/cu+ada+infiel', type_name: 'Cu Ada Infiel' },

    { type_id: 'video/voueur+sister', type_name: 'Voyeur Sister' },

    { type_id: 'video/virginty+burden', type_name: 'Virginity Burden' },

    { type_id: 'video/hindhi+oyo+uncut', type_name: 'Hindi Oyo Uncut' },

    { type_id: 'video/liza+evanz', type_name: 'Liza Evanz' },

    { type_id: 'video/sissy+chastity', type_name: 'Sissy Chastity' },

    { type_id: 'video/solo+orgazam', type_name: 'Solo Orgasm' },

    { type_id: 'video/photoshoot+amateur', type_name: 'Photoshoot Amateur' },

    { type_id: 'video/adriana+rodrigues', type_name: 'Adriana Rodrigues' },

    { type_id: 'video/carry+light', type_name: 'Carry Light' },

    { type_id: 'video/all+converter', type_name: 'All Converter' },

    { type_id: 'video/michiru+kujo', type_name: 'Michiru Kujo' },

    { type_id: 'video/kala+khatta', type_name: 'Kala Khatta' },

    { type_id: 'video/graphic+response', type_name: 'Graphic Response' },

    { type_id: 'video/mia+aniston', type_name: 'Mia Aniston' },

    { type_id: 'video/snos+039+yu+tano', type_name: 'Snos 039 Yu Tano' },

    { type_id: 'video/eva+elfie+anal', type_name: 'Eva Elfie Anal' },

    { type_id: 'video/bizarre', type_name: 'Bizarre' },

    { type_id: 'video/shahad+part+1', type_name: 'Shahad Part 1' },

    { type_id: 'video/la+pubertad', type_name: 'La Pubertad' },

    { type_id: 'video/gia+derza+anal', type_name: 'Gia Derza Anal' },

    { type_id: 'video/maneka', type_name: 'Maneka' },

    { type_id: 'video/grateful+girlfriend', type_name: 'Grateful Girlfriend' },

    { type_id: 'video/shay+sights+son', type_name: 'Shay Sights Son' },

    { type_id: 'video/devil+doll+2007', type_name: 'Devil Doll 2007' },

    { type_id: 'video/asia+vargas', type_name: 'Asia Vargas' },

    { type_id: 'video/love+lance', type_name: 'Love Lance' },

    { type_id: 'video/thetm+va', type_name: 'Thetm Va' },

    { type_id: 'video/sissy+hypno', type_name: 'Sissy Hypno' },

    { type_id: 'video/brutal+tough+mature', type_name: 'Brutal Tough Mature' },

    { type_id: 'video/sanvida+part+2', type_name: 'Sanvida Part 2' },

    { type_id: 'video/teanna+trump', type_name: 'Teanna Trump' },

    { type_id: 'video/tiffany+lee+rea', type_name: 'Tiffany Lee Rea' },

    { type_id: 'video/tuscarora+nevada', type_name: 'Tuscarora Nevada' },

    { type_id: 'video/liloostich', type_name: 'Liloostich' },

    { type_id: 'video/diluxe', type_name: 'Diluxe' },

    { type_id: 'video/butte+county', type_name: 'Butte County' },

    { type_id: 'video/j+monte', type_name: 'J Monte' },

    { type_id: 'video/adams', type_name: 'Adams' },

    { type_id: 'video/vec+489+chiharu+ito', type_name: 'Vec 489 Chiharu Ito' },

    { type_id: 'video/asian+daddy', type_name: 'Asian Daddy' },

    { type_id: 'video/dwporn+com', type_name: 'Dwporn Com' },

    { type_id: 'video/fsdss+778', type_name: 'Fsdss 778' },

    { type_id: 'video/m+6month', type_name: 'M 6Month' },

    { type_id: 'video/childhood+games', type_name: 'Childhood Games' },

    { type_id: 'video/lilian+la+virgen', type_name: 'Lilian La Virgen' },

    { type_id: 'video/my+girlfried+mother', type_name: 'My Girlfriend Mother' },

    { type_id: 'video/aiav+004', type_name: 'Aiav 004' },

    { type_id: 'video/angelawhite', type_name: 'Angela White' },

    { type_id: 'video/hot+erotic+2002', type_name: 'Hot Erotic 2002' },

    { type_id: 'video/yoch+012', type_name: 'Yoch 012' },

    { type_id: 'video/video+mp4a', type_name: 'Video Mp4A' },

    { type_id: 'video/lingam+pump', type_name: 'Lingam Pump' },

    { type_id: 'video/homeporn+swx+vid', type_name: 'Homeporn Swx Vid' },

    { type_id: 'video/amandeep', type_name: 'Amandeep' },

    { type_id: 'video/sdmf+052', type_name: 'Sdmf 052' },

    { type_id: 'video/nadia+white', type_name: 'Nadia White' },

    { type_id: 'video/primal+afterparty', type_name: 'Primal Afterparty' },

    { type_id: 'video/seduced+bye+cougar', type_name: 'Seduced By Cougar' },

    { type_id: 'video/amateur+blowjob', type_name: 'Amateur Blowjob' },

    { type_id: 'video/cabina+voyeurs', type_name: 'Cabina Voyeurs' },

    { type_id: 'video/silk1941', type_name: 'Silk1941' },

    { type_id: 'video/ariana+marie+anal', type_name: 'Ariana Marie Anal' },

    { type_id: 'video/female+worship', type_name: 'Female Worship' },

    { type_id: 'video/bully', type_name: 'Bully' },

    { type_id: 'video/cum+inside+mature', type_name: 'Cum Inside Mature' },

    { type_id: 'video/sleeping+loads+cum', type_name: 'Sleeping Loads Cum' },

    { type_id: 'video/asmr+network', type_name: 'Asmr Network' },

    { type_id: 'video/mhs+829', type_name: 'Mhs 829' },

    { type_id: 'video/royd+303', type_name: 'Royd 303' },

    { type_id: 'video/dass+079+uncensored', type_name: 'Dass 079 Uncensored' },

    { type_id: 'video/lexxy+voodoo', type_name: 'Lexxy Voodoo' },

    { type_id: 'video/flm+japon', type_name: 'Flm Japon' },

    { type_id: 'video/nara+ford', type_name: 'Nara Ford' },

    { type_id: 'video/cuckold+vintag', type_name: 'Cuckold Vintage' },

    { type_id: 'video/mimi+lili', type_name: 'Mimi Lili' },

    { type_id: 'video/adolescent+jav', type_name: 'Adolescent Jav' },

    { type_id: 'video/piss+asiticas', type_name: 'Piss Asiticas' },

    { type_id: 'video/fc2ppv+4556190', type_name: 'Fc2Ppv 4556190' }

]

async function init(cfg) {

    return JSON.stringify({ code: 0, msg: 'success' })

}

async function home(filter) {

    let classes = [

        { type_id: 'now', type_name: '最新' },

        { type_id: 'recent', type_name: '最近' }

    ]

    // 追加所有标签分类

    for (let i = 0; i < TAG_CLASSES.length; i++) {

        classes.push(TAG_CLASSES[i])

    }

    return JSON.stringify({ class: classes })

}

async function homeVod() {

    return await category('now', 1, null, null)

}

async function category(tid, pg, filter, extend) {

    try {

        let page = parseInt(pg) || 1

        let url = SITE + '/' + tid

        if (page > 1) url += '?p=' + page

        console.log('category url: ' + url)

        let res = await req(url, {

            headers: { 'User-Agent': UA, 'Referer': SITE + '/' }

        })

        let html = typeof res === 'string' ? res : (res.content || res.data || '')

        let list = parseList(html)

        // 非 video/ 分类且为空时，回退到 now

        if (list.length === 0 && tid.indexOf('video/') !== 0 && tid !== 'now') {

            console.log('category empty, fallback to now')

            let fallbackUrl = SITE + '/now'

            if (page > 1) fallbackUrl += '?p=' + page

            let res2 = await req(fallbackUrl, {

                headers: { 'User-Agent': UA, 'Referer': SITE + '/' }

            })

            let html2 = typeof res2 === 'string' ? res2 : (res2.content || res2.data || '')

            list = parseList(html2)

        }

        console.log('category list count: ' + list.length)

        return JSON.stringify({

            list: list,

            page: page,

            pagecount: list.length > 0 ? page + 1 : page,

            total: list.length > 0 ? 9999 : 0

        })

    } catch (e) {

        console.log('category error: ' + e)

        return JSON.stringify({ list: [], page: 1, pagecount: 1, total: 0 })

    }

}

async function detail(ids) {

    try {

        let id = Array.isArray(ids) ? ids[0] : ids

        let url = id.indexOf('http') === 0 ? id : SITE + '/watch/' + id

        console.log('detail url: ' + url)

        let res = await req(url, {

            headers: { 'User-Agent': UA, 'Referer': SITE + '/' }

        })

        let html = typeof res === 'string' ? res : (res.content || res.data || '')

        console.log('detail html length: ' + html.length)

        let titleMatch = html.match(/<title>([^<]+)<\/title>/i)

        let title = titleMatch ? titleMatch[1].replace(/\s*[-|]\s*ExPornToons.*$/i, '').trim() : 'Video'

        let picMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)

        let pic = picMatch ? picMatch[1] : ''

        let idParts = id.replace(/^.*\/watch\//, '').split('_')

        let idPart1 = idParts[0] || ''

        let idPart2 = idParts[1] || ''

        console.log('filter idPart1: ' + idPart1 + ', idPart2: ' + idPart2)

        let qualityMap = {}

        let cdnRegex = /(https?:\/\/[^"'\s\\<>]*pvvstream\.pro[^"'\s\\<>]*)/g

        let m

        while ((m = cdnRegex.exec(html)) !== null) {

            let u = m[1].replace(/&amp;/g, '&')

            if (idPart1 && u.indexOf(idPart1) === -1) continue

            if (idPart2 && u.indexOf(idPart2) === -1) continue

            let qMatch = u.match(/vid_(\d+)p/) || u.match(/\/(\d+)p\//) || u.match(/_(\d+)p\./)

            if (!qMatch) continue

            let qNum = parseInt(qMatch[1])

            if (!qNum || qNum < 360) continue

            if (!qualityMap[qNum]) qualityMap[qNum] = u

        }

        let qualities = Object.keys(qualityMap).map(function(k) { return parseInt(k) })

        qualities.sort(function(a, b) { return b - a })

        let playUrls = []

        for (let i = 0; i < qualities.length; i++) {

            let q = qualities[i]

            playUrls.push(q + 'p$' + qualityMap[q])

        }

        console.log('detail qualities: ' + qualities.join(','))

        if (playUrls.length === 0) {

            let vfRegex = /(https?:\/\/[^"'\s\\<>]*\/videofile\/[^"'\s\\<>]+\.mp4[^"'\s\\<>]*)/g

            while ((m = vfRegex.exec(html)) !== null) {

                let u = m[1].replace(/&amp;/g, '&')

                if (idPart1 && u.indexOf(idPart1) === -1) continue

                playUrls.push('播放$' + u)

                break

            }

        }

        let vod = {

            vod_id: id,

            vod_name: title,

            vod_pic: pic,

            vod_remarks: '',

            vod_content: '',

            vod_play_from: 'ExPornToons',

            vod_play_url: playUrls.length > 0 ? playUrls.join('#') : '默认$' + id

        }

        return JSON.stringify({ list: [vod] })

    } catch (e) {

        console.log('detail error: ' + e)

        return JSON.stringify({ list: [] })

    }

}

async function play(flag, id, vipFlags) {

    try {

        console.log('play url: ' + id)

        return JSON.stringify({

            url: id,

            header: JSON.stringify({

                'User-Agent': UA,

                'Referer': SITE + '/',

                'Origin': SITE

            })

        })

    } catch (e) {

        return JSON.stringify({ url: '' })

    }

}

async function search(wd, quick) {

    try {

        if (!wd) return JSON.stringify({ list: [] })

        let keyword = wd.replace(/\s+/g, '+')

        let url = SITE + '/video/' + encodeURIComponent(keyword)

        console.log('search url: ' + url)

        let res = await req(url, {

            headers: { 'User-Agent': UA, 'Referer': SITE + '/' }

        })

        let html = typeof res === 'string' ? res : (res.content || res.data || '')

        let list = parseList(html)

        console.log('search list count: ' + list.length)

        return JSON.stringify({ list: list })

    } catch (e) {

        console.log('search error: ' + e)

        return JSON.stringify({ list: [] })

    }

}

function parseList(html) {

    let list = []

    let seen = {}

    let cardRegex = /<a[^>]+href=["']([^"']*\/watch\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi

    let m

    while ((m = cardRegex.exec(html)) !== null) {

        let href = m[1]

        let inner = m[2]

        if (seen[href]) continue

        seen[href] = true

        let imgMatch = inner.match(/<img[^>]+(?:data-src|data-original|src)=["']([^"']+)["']/i)

        let pic = imgMatch ? imgMatch[1].replace(/&amp;/g, '&') : ''

        if (pic.indexOf('data:image/gif') === 0) pic = ''

        let titleMatch = inner.match(/alt=["']([^"']+)["']/i)

                   || inner.match(/title=["']([^"']+)["']/i)

        let title = titleMatch ? titleMatch[1].trim() : ''

        if (!title) {

            let aTitle = m[0].match(/title=["']([^"']+)["']/i)

            if (aTitle) title = aTitle[1].trim()

        }

        if (!title) {

            title = inner.replace(/<[^>]+>/g, '').trim().substring(0, 200)

        }

        if (!title) continue

        let vodId = href.replace(/^.*\/watch\//, '').replace(/[\/?#].*$/, '')

        list.push({

            vod_id: vodId,

            vod_name: title,

            vod_pic: pic,

            vod_remarks: ''

        })

    }

    return list

}

export function __jsEvalReturn() {

    return {

        init: init,

        home: home,

        homeVod: homeVod,

        category: category,

        detail: detail,

        play: play,

        search: search

    }

}