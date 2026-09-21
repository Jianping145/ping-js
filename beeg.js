// beeg.js - T4 格式（修复播放问题）

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const API_BASE = 'https://store.externulls.com'

const CHANNELS = [

    { name: 'Blacked', slug: 'blacked' },

    { name: 'Vixen', slug: 'vixencom' },

    { name: 'Team Skeet', slug: 'teamskeet' },

    { name: 'Teen Mega World', slug: 'teenmegaworld' },

    { name: 'Nubiles', slug: 'nubilesporn' },

    { name: 'Wow Girls', slug: 'wowgirls' },

    { name: 'Bratty Sis', slug: 'brattysis' },

    { name: 'Adult Time', slug: 'adulttime' },

    { name: 'Family Strokes', slug: 'familystrokes' },

    { name: 'Ultra Films', slug: 'ultrafilms' },

    { name: 'Nubile Films', slug: 'nubilefilms' },

    { name: 'LetsDoeIt', slug: 'letsdoeit' },

    { name: 'Family XXX', slug: 'familyxxx' },

    { name: 'Tiny 4K', slug: 'tiny4k' },

    { name: 'New Sensations', slug: 'newsensations' },

    { name: 'Naughty America', slug: 'naughtyamerica' },

    { name: 'Sis Loves Me', slug: 'sislovesme' },

    { name: 'Pure Taboo', slug: 'puretaboo' },

    { name: 'Step Siblings Caught', slug: 'stepsiblingscaught' },

    { name: 'Moms Teach Sex', slug: 'momsteachsex' },

    { name: 'Hot Wife XXX', slug: 'hotwifexxx' },

    { name: 'Porn Force', slug: 'pornforce' },

    { name: 'Dorcel Club', slug: 'dorcelclub' },

    { name: 'Vixen Plus', slug: 'vixenplus' },

    { name: 'My Family Pies', slug: 'myfamilypies' },

    { name: "My Friend's Hot Mom", slug: 'myfriendshotmom' },

    { name: 'Bare Back Studios', slug: 'barebackstudios' },

    { name: 'NF Busty', slug: 'nfbusty' },

    { name: 'Passion HD', slug: 'passionhd' },

    { name: '21 Naturals', slug: '21naturals' },

    { name: 'Teen Fidelity', slug: 'teenfidelity' },

    { name: 'Tushy', slug: 'tushy' },

    { name: 'Porn World', slug: 'pornworld' },

    { name: 'Cum 4K', slug: 'cum4k' },

    { name: 'My Pervy Family', slug: 'mypervyfamily' },

    { name: 'Porn Fidelity', slug: 'pornfidelity' },

    { name: 'NVG', slug: 'nvg' },

    { name: 'Exploited College Girls', slug: 'exploitedcollegegirls' },

    { name: 'Deeper', slug: 'deeperofficial' },

    { name: 'Bellesa Plus', slug: 'bellesaplus' },

    { name: 'Princess Cum', slug: 'princesscum' },

    { name: 'White Boxxx', slug: 'whiteboxxx' },

    { name: 'Pure Mature', slug: 'puremature' },

    { name: 'Perv Mom', slug: 'pervmom' },

    { name: 'Blacked Raw', slug: 'blackedraw' },

    { name: 'Mom Wants to Breed', slug: 'momwantstobreed' },

    { name: '21 Sextury', slug: '21sextury' },

    { name: 'Hegre', slug: 'hegre' },

    { name: 'Life Selector', slug: 'lifeselector' },

    { name: 'Exxxtra Small', slug: 'exxtrasmall' },

    { name: 'JAV HD', slug: 'javhd' },

    { name: 'Girl Cum', slug: 'girlcumofficial' },

    { name: 'Sex Art', slug: 'sexart' },

    { name: "Tonight's Girlfriend", slug: 'tonightsgirlfriend' },

    { name: 'Dad Crush', slug: 'dadcrush' },

    { name: 'Lubed', slug: 'lubedcom' },

    { name: 'VIP 4K', slug: 'vip4k' },

    { name: 'Evil Angel', slug: 'evilangel' },

    { name: 'JAV Hub', slug: 'javhub' },

    { name: 'Caribbeancom', slug: 'caribbeancom' },

    { name: "My Sister's Hot Friend", slug: 'mysistershotfriend' },

    { name: 'Daughter Swap', slug: 'daughterswap' },

]

const MODELS = [

    { name: 'Eva Elfie', slug: 'evaelfie' },

    { name: 'Angela White', slug: 'angelawhite' },

    { name: 'Dani Daniels', slug: 'danidaniels' },

    { name: 'Mia Malkova', slug: 'miamalkova' },

    { name: 'Riley Reid', slug: 'rileyreid' },

    { name: 'Mila Lioness', slug: 'milalioness' },

    { name: 'Alexa Grace', slug: 'alexagrace' },

    { name: 'Alina Lopez', slug: 'alinalopez' },

    { name: 'Comatozze', slug: 'comatozze' },

    { name: 'Candy Love', slug: 'candylove' },

    { name: 'Diana Rider', slug: 'dianarider' },

    { name: 'Sweetie Fox', slug: 'sweetiefox' },

    { name: 'Lana Rhoades', slug: 'lanarhoades' },

    { name: 'Julie Jess', slug: 'juliejess' },

    { name: 'Anny Walker', slug: 'annywalker' },

    { name: 'Angel X', slug: 'angelx' },

    { name: 'Shinaryen', slug: 'shinaryen' },

    { name: 'Abella Danger', slug: 'abelladanger' },

    { name: 'Sybil', slug: 'sybil' },

    { name: 'Emilia Bunny', slug: 'emiliabunny' },

    { name: 'Syndicete', slug: 'syndicete' },

    { name: 'Jenny Kitty', slug: 'jennykitty' },

    { name: 'Emily Willis', slug: 'emilywillis' },

    { name: 'Elsa Jean', slug: 'elsajean' },

    { name: 'Nicole Aniston', slug: 'nicoleaniston' },

    { name: 'Fantasy Babe', slug: 'fantasybabe' },

    { name: 'Lena Paul', slug: 'lenapaul' },

    { name: 'Bonnie Blaze', slug: 'bonnieblaze' },

    { name: 'Cory Chase', slug: 'corychase' },

    { name: 'Martin & Paola', slug: 'martinpaola' },

    { name: 'Dick For Lily', slug: 'dickforlily' },

    { name: 'Gabbie Carter', slug: 'gabbiecarter' },

    { name: 'Lexi Lore', slug: 'lexilore' },

    { name: 'Kate Kuray', slug: 'katekuray' },

    { name: 'Blake Blossom', slug: 'blakeblossom' },

    { name: 'Carla Cute', slug: 'carlacute' },

    { name: 'Hotties Two', slug: 'hottiestwo' },

    { name: 'Adriana Chechik', slug: 'adrianachechik' },

    { name: 'Yummy Mira', slug: 'yummymira' },

    { name: 'Reislin', slug: 'reislin' },

    { name: 'Anastangel', slug: 'anastangel' },

    { name: 'Gina Valentina', slug: 'ginavalentina' },

    { name: 'Kenzie Reeves', slug: 'kenzie_reeves' },

    { name: 'Valentina Nappi', slug: 'valentinanappi' },

    { name: 'Leah Meow', slug: 'leahmeow' },

    { name: 'Carry Light', slug: 'carrylight' },

    { name: 'Purple Bitch', slug: 'purplebitch' },

    { name: 'Pink Loving', slug: 'pinkloving' },

    { name: 'My Anny', slug: 'myanny' },

    { name: 'Lil Karina', slug: 'lilkarina' },

    { name: 'Melody Marks', slug: 'melodymarks' },

    { name: 'Luxury Mur', slug: 'luxurymur' },

    { name: 'Diana Daniels', slug: 'danadaniels' },

    { name: 'Stacy Cruz', slug: 'stacycruz' },

    { name: 'Allinika', slug: 'allinika' },

    { name: 'Autumn Falls', slug: 'autumnfalls' },

    { name: 'Sola Zola', slug: 'solazola' },

    { name: 'Krystal Boyd', slug: 'krystalboyd' },

    { name: 'Lexi Luna', slug: 'lexiluna' },

    { name: 'Lauren Phillips', slug: 'laurenphillips' },

    { name: 'Kera Bear', slug: 'kerabear' },

    { name: 'Little Caprice', slug: 'littlecaprice' },

    { name: 'Sia Siberia', slug: 'siasiberia' },

    { name: 'Molly Red Wolf', slug: 'mollyredwolf' },

    { name: 'Samantha Flair', slug: 'samanthaflair' },

    { name: 'Luxury Girl', slug: 'luxurygirl' },

    { name: 'Molly Little', slug: 'mollylittle' },

    { name: 'Kelly Aleman', slug: 'kellyaleman' },

    { name: 'Yinyleon', slug: 'yinyleon' },

    { name: 'Liya Silver', slug: 'liyasilver' },

    { name: 'Telari Love', slug: 'telarilove' },

    { name: 'Skye Young', slug: 'skyeyoung' },

    { name: 'Tru Kait', slug: 'trukait' },

    { name: 'Eliza Ibarra', slug: 'elizaibarra' },

    { name: 'Jenny Lux', slug: 'jennylux' },

    { name: 'Anissa Kate', slug: 'anissakate' },

    { name: 'Haley Reed', slug: 'haleyreed' },

    { name: 'Kyler Quinn', slug: 'kylerquinn' },

    { name: 'Skylar Vox', slug: 'skylarvox' },

    { name: 'Leah Gotti', slug: 'leahgotti' },

    { name: 'Lina Migurtt', slug: 'linamigurtt' },

    { name: 'Dillion Harper', slug: 'dillionharper' },

    { name: 'Brandi Love', slug: 'brandilove' },

    { name: 'Jia Lissa', slug: 'jialissa' },

    { name: 'Brooke Tilli', slug: 'brooketilli' },

    { name: 'Miss Lexa', slug: 'misslexa' },

    { name: 'Bunny Rabbits', slug: 'bunnyrabbits' },

    { name: 'Leo Lulu', slug: 'leolulu' },

    { name: 'Layla Ray', slug: 'laylaray' },

    { name: 'Web To Love', slug: 'webtolove' },

    { name: 'Nancy Ace', slug: 'nancyace' },

    { name: 'Hansel & Grettel', slug: 'hanselgrettel' },

    { name: 'Xreindeers', slug: 'xreindeers' },

    { name: 'Tiffany Tatum', slug: 'tiffanystatum' },

    { name: 'Mirari', slug: 'mirari' },

    { name: 'Adria Rae', slug: 'adriarae' },

    { name: 'Kristel Jack', slug: 'kristeljack' },

    { name: 'Mila Solana', slug: 'milasolana' },

    { name: 'Alexis Fawx', slug: 'alexisfawx' },

]

// T4: init

async function init(cfg) {

    return JSON.stringify({ code: 0, msg: 'success' })

}

// T4: home - 返回分类

async function home(filter) {

    let classes = []

    

    classes.push({ type_id: 'home', type_name: '首页' })

    

    for (let ch of CHANNELS) {

        classes.push({ type_id: ch.slug, type_name: ch.name })

    }

    

    for (let m of MODELS) {

        classes.push({ type_id: m.slug, type_name: m.name })

    }

    

    return JSON.stringify({ class: classes })

}

// T4: homeVod - 首页推荐

async function homeVod() {

    try {

        let url = `${API_BASE}/tag/videos/index?limit=48&offset=0`

        let res = await req(url, { headers: { 'User-Agent': UA } })

        

        let data = parseRes(res)

        let list = []

        

        if (Array.isArray(data)) {

            for (let video of data) {

                let vod = buildVod(video)

                if (vod) list.push(vod)

            }

        }

        

        return JSON.stringify({ list: list })

    } catch (e) {

        console.log('homeVod error: ' + e)

        return JSON.stringify({ list: [] })

    }

}

// T4: category - 分类列表

async function category(tid, pg, filter, extend) {

    try {

        let page = parseInt(pg) || 1

        let offset = (page - 1) * 48

        let url = `${API_BASE}/tag/videos/${tid}?limit=48&offset=${offset}`

        

        let res = await req(url, { headers: { 'User-Agent': UA } })

        let data = parseRes(res)

        let list = []

        

        if (Array.isArray(data)) {

            for (let video of data) {

                let vod = buildVod(video)

                if (vod) list.push(vod)

            }

        }

        

        return JSON.stringify({ 

            list: list, 

            page: page, 

            pagecount: page + 1,

            total: list.length > 0 ? page * 48 + 1 : 0

        })

    } catch (e) {

        console.log('category error: ' + e)

        return JSON.stringify({ list: [], page: 1, pagecount: 1, total: 0 })

    }

}

// T4: detail - 详情（修复：优先 fl_cdn_multi 主播放列表）

async function detail(ids) {

    try {

        let id = Array.isArray(ids) ? ids[0] : ids

        

        let url = `${API_BASE}/facts/file/${id}`

        let res = await req(url, {

            headers: { 

                'User-Agent': UA,

                'Origin': 'https://beeg.com',

                'Referer': 'https://beeg.com/'

            }

        })

        

        let data = parseRes(res)

        let file = data?.file || {}

        let hls = file.hls_resources || {}

        

        // 调试日志：查看 HLS 资源结构

        console.log('hls keys: ' + Object.keys(hls).join(','))

        console.log('fl_cdn_multi: ' + hls.fl_cdn_multi)

        

        let qualities = []

        

        // 1. 优先使用 fl_cdn_multi（主播放列表，包含所有清晰度）

        if (hls.fl_cdn_multi) {

            let multiUrl = buildHlsUrl(hls.fl_cdn_multi)

            if (multiUrl) {

                qualities.push({ name: '自动', url: multiUrl, height: 99999 })

            }

        }

        

        // 2. 其他清晰度作为备选

        for (let [key, value] of Object.entries(hls)) {

            if (value && key.startsWith('fl_cdn_') && key !== 'fl_cdn_multi') {

                let match = key.match(/fl_cdn_(\d+)/)

                let height = match ? parseInt(match[1]) : 0

                let u = buildHlsUrl(value)

                if (u) {

                    qualities.push({ name: `${height}p`, url: u, height: height })

                }

            }

        }

        

        // 排序：高度降序（自动在最高前）

        qualities.sort((a, b) => b.height - a.height)

        

        // 构建 vod_play_url：名称$地址#名称$地址

        let playUrls = []

        for (let q of qualities) {

            playUrls.push(`${q.name}$${q.url}`)

        }

        

        let vod_play_url = playUrls.length > 0 ? playUrls.join('#') : '默认$'

        

        let vod = {

            vod_id: id,

            vod_name: file.fl_name || 'Video',

            vod_pic: '',

            vod_remarks: '',

            vod_year: '',

            vod_area: '',

            vod_actor: '',

            vod_director: '',

            vod_content: '',

            vod_play_from: 'Beeg',

            vod_play_url: vod_play_url

        }

        

        console.log('detail vod_play_url: ' + vod_play_url)

        

        return JSON.stringify({ list: [vod] })

    } catch (e) {

        console.log('detail error: ' + e)

        return JSON.stringify({ list: [] })

    }

}

// 辅助：构建 HLS 完整地址

function buildHlsUrl(v) {

    if (!v) return ''

    if (typeof v !== 'string') return ''

    if (v.startsWith('http://') || v.startsWith('https://')) return v

    return `https://video.beeg.com/${v}`

}

// T4: play - 播放

async function play(flag, id, vipFlags) {

    try {

        console.log('play url: ' + id)

        

        return JSON.stringify({ 

            url: id,

            header: JSON.stringify({

                'User-Agent': UA,

                'Referer': 'https://beeg.com/',

                'Origin': 'https://beeg.com'

            })

        })

    } catch (e) {

        console.log('play error: ' + e)

        return JSON.stringify({ url: '' })

    }

}

// T4: search - 搜索

async function search(wd, quick) {

    try {

        if (!wd) return JSON.stringify({ list: [] })

        

        let queryWords = wd.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 2)

        let cards = []

        let seen = {}

        

        for (let page = 1; page <= 5; page++) {

            let offset = (page - 1) * 48

            let url = `${API_BASE}/tag/videos/index?limit=48&offset=${offset}`

            

            try {

                let res = await req(url, { headers: { 'User-Agent': UA } })

                let data = parseRes(res)

                

                if (!Array.isArray(data)) continue

                

                for (let video of data) {

                    let vod = buildVod(video)

                    if (vod && !seen[vod.vod_id] && titleMatch(vod.vod_name, queryWords)) {

                        seen[vod.vod_id] = true

                        cards.push(vod)

                        if (cards.length >= 48) break

                    }

                }

            } catch (err) {

                console.log('search page error: ' + err)

            }

            

            if (cards.length >= 48) break

        }

        

        return JSON.stringify({ list: cards })

    } catch (e) {

        console.log('search error: ' + e)

        return JSON.stringify({ list: [] })

    }

}

// 辅助函数：解析 req 返回

function parseRes(res) {

    if (typeof res === 'string') return JSON.parse(res)

    if (res && res.content) return JSON.parse(res.content)

    if (res && res.data) return res.data

    return res

}

// 辅助函数：构建视频卡片

function buildVod(video) {

    try {

        let fcFacts = video.fc_facts?.[0]

        let factId = fcFacts?.id

        let fileData = video.file?.data || []

        let fileId = video.file?.id || fileData[0]?.cd_file || factId

        if (!fileId) return null

        

        let duration = video.file?.fl_duration || 0

        let durationStr = formatDuration(duration)

        let height = video.file?.fl_height || 0

        let fcThumbs = fcFacts?.fc_thumbs || []

        

        let title = 'Untitled'

        for (let item of fileData) {

            if (item.cd_column === 'sf_name') {

                title = item.cd_value || title

                break

            }

        }

        

        let cover = ''

        if (fcThumbs.length > 0) {

            cover = `https://thumbs.externulls.com/videos/${fileId}/${fcThumbs[0]}.jpg`

        } else if (fileData[0]?.cd_file) {

            cover = `https://img.externulls.com/${fileData[0].cd_file}/preview_01.jpg`

        }

        

        return {

            vod_id: String(fileId),

            vod_name: title,

            vod_pic: cover,

            vod_remarks: `${height}p ${durationStr}`,

            vod_play_from: 'Beeg',

            vod_play_url: '播放$' + String(fileId)

        }

    } catch (e) {

        console.log('buildVod error: ' + e)

        return null

    }

}

function titleMatch(title, queryWords) {

    let normalized = String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, '')

    if (!normalized) return false

    if (queryWords.length === 0) return true

    return queryWords.every(w => normalized.includes(w))

}

function formatDuration(seconds) {

    if (!seconds || seconds <= 0) return ''

    let h = Math.floor(seconds / 3600)

    let m = Math.floor((seconds % 3600) / 60)

    let s = seconds % 60

    if (h > 0) {

        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`

    }

    return `${m}:${s.toString().padStart(2, '0')}`

}

// T4: 导出

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