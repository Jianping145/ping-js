// javdb.js - T3 格式（官方 App API 版，绕过网页 Cloudflare）
// API: https://jdforrepam.com  + jdsignature

const API_HOST = 'https://jdforrepam.com'
const CDN_BASE = 'https://c0.jdbstatic.com/covers'
const API_MIDDLE = 'lpw6vgqzsp'
const API_SUFFIX = '71cf27bb3c0bcdf207b64abecddc970098c7421ee7203b9cdae54478478a199e7d5a6e1a57691123c1a931c057842fb73ba3b3c83bcd69c17ccf174081e3d8aa'
const API_UA = 'Dart/3.5 (dart:io)'
const PAGE_SIZE = 24

// ========== MD5 ==========
function md5(string) {
  function safeAdd(x, y) {
    var lsw = (x & 0xffff) + (y & 0xffff)
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xffff)
  }
  function bitRotateLeft(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)) }
  function md5cmn(q, a, b, x, s, t) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b) }
  function md5ff(a, b, c, d, x, s, t) { return md5cmn((b & c) | (~b & d), a, b, x, s, t) }
  function md5gg(a, b, c, d, x, s, t) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t) }
  function md5hh(a, b, c, d, x, s, t) { return md5cmn(b ^ c ^ d, a, b, x, s, t) }
  function md5ii(a, b, c, d, x, s, t) { return md5cmn(c ^ (b | ~d), a, b, x, s, t) }
  function binlMD5(x, len) {
    x[len >> 5] |= 0x80 << (len % 32)
    x[(((len + 64) >>> 9) << 4) + 14] = len
    var i, olda, oldb, oldc, oldd
    var a = 1732584193, b = -271733879, c = -1732584194, d = 271733878
    for (i = 0; i < x.length; i += 16) {
      olda = a; oldb = b; oldc = c; oldd = d
      a = md5ff(a, b, c, d, x[i], 7, -680876936); d = md5ff(d, a, b, c, x[i + 1], 12, -389564586)
      c = md5ff(c, d, a, b, x[i + 2], 17, 606105819); b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330)
      a = md5ff(a, b, c, d, x[i + 4], 7, -176418897); d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426)
      c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341); b = md5ff(b, c, d, a, x[i + 7], 22, -45705983)
      a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416); d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417)
      c = md5ff(c, d, a, b, x[i + 10], 17, -42063); b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162)
      a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682); d = md5ff(d, a, b, c, x[i + 13], 12, -40341101)
      c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290); b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329)
      a = md5gg(a, b, c, d, x[i + 1], 5, -165796510); d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632)
      c = md5gg(c, d, a, b, x[i + 11], 14, 643717713); b = md5gg(b, c, d, a, x[i], 20, -373897302)
      a = md5gg(a, b, c, d, x[i + 5], 5, -701558691); d = md5gg(d, a, b, c, x[i + 10], 9, 38016083)
      c = md5gg(c, d, a, b, x[i + 15], 14, -660478335); b = md5gg(b, c, d, a, x[i + 4], 20, -405537848)
      a = md5gg(a, b, c, d, x[i + 9], 5, 568446438); d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690)
      c = md5gg(c, d, a, b, x[i + 3], 14, -187363961); b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501)
      a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467); d = md5gg(d, a, b, c, x[i + 2], 9, -51403784)
      c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473); b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734)
      a = md5hh(a, b, c, d, x[i + 5], 4, -378558); d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463)
      c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562); b = md5hh(b, c, d, a, x[i + 14], 23, -35309556)
      a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060); d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353)
      c = md5hh(c, d, a, b, x[i + 7], 16, -155497632); b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640)
      a = md5hh(a, b, c, d, x[i + 13], 4, 681279174); d = md5hh(d, a, b, c, x[i], 11, -358537222)
      c = md5hh(c, d, a, b, x[i + 3], 16, -722521979); b = md5hh(b, c, d, a, x[i + 6], 23, 76029189)
      a = md5hh(a, b, c, d, x[i + 9], 4, -640364487); d = md5hh(d, a, b, c, x[i + 12], 11, -421815835)
      c = md5hh(c, d, a, b, x[i + 15], 16, 530742520); b = md5hh(b, c, d, a, x[i + 2], 23, -995338651)
      a = md5ii(a, b, c, d, x[i], 6, -198630844); d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415)
      c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905); b = md5ii(b, c, d, a, x[i + 5], 21, -57434055)
      a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571); d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606)
      c = md5ii(c, d, a, b, x[i + 10], 15, -1051523); b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799)
      a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359); d = md5ii(d, a, b, c, x[i + 15], 10, -30611744)
      c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380); b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649)
      a = md5ii(a, b, c, d, x[i + 4], 6, -145523070); d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379)
      c = md5ii(c, d, a, b, x[i + 2], 15, 718787259); b = md5ii(b, c, d, a, x[i + 9], 21, -343485551)
      a = safeAdd(a, olda); b = safeAdd(b, oldb); c = safeAdd(c, oldc); d = safeAdd(d, oldd)
    }
    return [a, b, c, d]
  }
  function binl2rstr(input) {
    var i, output = ''
    for (i = 0; i < input.length * 32; i += 8) output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xff)
    return output
  }
  function rstr2binl(input) {
    var i, output = []
    output[(input.length >> 2) - 1] = undefined
    for (i = 0; i < output.length; i += 1) output[i] = 0
    for (i = 0; i < input.length * 8; i += 8) output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << (i % 32)
    return output
  }
  function rstrMD5(s) { return binl2rstr(binlMD5(rstr2binl(s), s.length * 8)) }
  function rstr2hex(input) {
    var hexTab = '0123456789abcdef', output = '', x, i
    for (i = 0; i < input.length; i += 1) {
      x = input.charCodeAt(i)
      output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f)
    }
    return output
  }
  function str2rstrUTF8(input) { return unescape(encodeURIComponent(input)) }
  return rstr2hex(rstrMD5(str2rstrUTF8(string)))
}

function apiSignature() {
  var ts = Math.floor(Date.now() / 1000)
  return ts + '.' + API_MIDDLE + '.' + md5(String(ts) + API_SUFFIX)
}

function buildApiHeaders() {
  return {
    'jdsignature': apiSignature(),
    'User-Agent': API_UA,
    'Accept': 'application/json',
    'Accept-Language': 'zh-TW,zh;q=0.9',
    'Host': 'jdforrepam.com'
  }
}

function qs(params) {
  var a = []
  if (!params) return ''
  Object.keys(params).forEach(function (k) {
    var v = params[k]
    if (v !== undefined && v !== null && String(v) !== '') {
      a.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(v)))
    }
  })
  return a.join('&')
}

function parseRes(res) {
  if (typeof res === 'string') return res
  if (res && res.content) return res.content
  if (res && res.body) return res.body
  if (res && res.data) return res.data
  return res
}

async function apiRequest(path, params) {
  var url = API_HOST + path
  var q = qs(params)
  if (q) url += (url.indexOf('?') >= 0 ? '&' : '?') + q
  console.log('apiRequest: ' + url)
  var res = await req(url, { headers: buildApiHeaders() })
  var body = parseRes(res)
  var txt = String(body || '').trim()
  if (!txt) throw new Error('API 空响应')
  var j = JSON.parse(txt)
  if (j && j.success === 1) return j.data || {}
  throw new Error((j && j.message) || '接口异常')
}

function normalizeCover(url, id) {
  url = String(url || '').replace(/&amp;/g, '&').trim()
  if (url) {
    if (url.indexOf('//') === 0) url = 'https:' + url
    url = url.replace(/^https?:\/\/[^/]+\/rhe951l4q/i, 'https://c0.jdbstatic.com')
    url = url.replace(/@Referer=.*$/, '')
    return url
  }
  // 无封面时用 ID 反推
  if (id && String(id).length >= 2) {
    var sid = String(id)
    var prefix = sid.substring(0, 2).toLowerCase()
    return CDN_BASE + '/' + prefix + '/' + sid + '.jpg'
  }
  return ''
}

function mapMovie(x) {
  x = x || {}
  var id = String(x.id || '')
  var number = String(x.number || '').trim()
  var title = String(x.title || x.origin_title || number || id).trim()
  var name = number ? (number + ' ' + title) : title
  var cover = normalizeCover(x.cover_url || x.thumb_url || '', id)
  var remarks = []
  if (x.score || x.rate) remarks.push(String(x.score || x.rate))
  if (x.release_date) remarks.push(String(x.release_date))
  if (x.magnets_count) remarks.push('磁' + x.magnets_count)
  if (x.can_play) remarks.push('可播')
  return {
    vod_id: id,
    vod_name: name,
    vod_pic: cover,
    vod_remarks: remarks.join(' · ')
  }
}

function mapActor(x) {
  x = x || {}
  var id = String(x.id || '')
  var name = String(x.name_zht || x.name || id).trim()
  var raw = String(x.avatar_url || x.cover_url || '').trim()
  var cover = ''
  if (raw) {
    cover = raw.replace(/&amp;/g, '&')
    if (cover.indexOf('//') === 0) cover = 'https:' + cover
    // 加密 CDN → 静态图床，头像目录是 avatars
    cover = cover.replace(/^https?:\/\/[^/]+\/rhe951l4q/i, 'https://c0.jdbstatic.com')
    cover = cover.replace('/covers/', '/avatars/')
    cover = cover.replace(/@Referer=.*$/, '')
  }
  if (!cover && id.length >= 2) {
    cover = 'https://c0.jdbstatic.com/avatars/' + id.substring(0, 2).toLowerCase() + '/' + id + '.jpg'
  }
  var remarks = []
  if (x.videos_count) remarks.push('作品 ' + x.videos_count)
  if (x.other_name) remarks.push(String(x.other_name).split(',')[0])
  return {
    vod_id: 'actor_' + id,
    vod_name: name,
    vod_pic: cover,
    vod_remarks: remarks.join(' · ')
  }
}

function formatSize(v) {
  if (v === undefined || v === null || v === '') return ''
  if (typeof v === 'string' && /[KMGTkmgt]/.test(v)) return v
  var n = Number(v)
  if (!isFinite(n) || n <= 0) return String(v)
  if (n < 1024 * 1024) {
    if (n >= 1024) return (n / 1024).toFixed(1).replace(/\.0$/, '') + ' GB'
    return n + ' MB'
  }
  var u = ['B', 'KB', 'MB', 'GB', 'TB'], i = 0
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++ }
  return (i === 0 ? n : n.toFixed(1).replace(/\.0$/, '')) + ' ' + u[i]
}

// ========== T3 接口 ==========
async function init(cfg) {
  return JSON.stringify({ code: 0, msg: 'success' })
}

async function home(filter) {
  var classes = [
    { type_id: 'hot', type_name: '热播' },
    { type_id: 'censored', type_name: '有码' },
    { type_id: 'uncensored', type_name: '无码' },
    { type_id: 'western', type_name: '欧美' },
    { type_id: 'fc2', type_name: 'FC2' },
    { type_id: 'anime', type_name: '动漫' },
    { type_id: 'actors', type_name: '演员' }
  ]
  return JSON.stringify({ class: classes })
}

async function homeVod() {
  try {
    var data = await apiRequest('/api/v1/movies/recommend', { page: 1, limit: PAGE_SIZE })
    var movies = (data && data.movies) || data || []
    if (!Array.isArray(movies)) movies = []
    var list = movies.map(mapMovie)
    console.log('homeVod: ' + list.length)
    return JSON.stringify({ list: list })
  } catch (e) {
    console.log('homeVod error: ' + e)
    return JSON.stringify({ list: [] })
  }
}

async function category(tid, pg, filter, extend) {
  try {
    var page = parseInt(pg) || 1
    var typeMap = {
      hot: null,
      censored: '0',
      uncensored: '1',
      western: '2',
      fc2: '3',
      anime: '4'
    }

    // 演员分类
    if (tid === 'actors') {
      var actorList = []
      if (page === 1) {
        // 首页用推荐演员（合并三组）
        var adata = await apiRequest('/api/v1/actors/recommend', { page: 1 })
        adata = adata || {}
        var seen = {}
        var groups = ['recommend_actors', 'monthly_actors', 'new_actors']
        for (var g = 0; g < groups.length; g++) {
          var arr = adata[groups[g]] || []
          for (var i = 0; i < arr.length; i++) {
            var a = mapActor(arr[i])
            if (!a.vod_id || seen[a.vod_id]) continue
            seen[a.vod_id] = true
            actorList.push(a)
          }
        }
      } else {
        // 后续页用有码演员列表分页
        var adata2 = await apiRequest('/api/v1/actors', { page: page, limit: PAGE_SIZE, type: '0' })
        var arr2 = (adata2 && adata2.actors) || []
        actorList = arr2.map(mapActor)
      }
      console.log('category actors page ' + page + ': ' + actorList.length)
      return JSON.stringify({
        list: actorList,
        page: page,
        pagecount: actorList.length >= 10 ? page + 1 : page,
        total: actorList.length > 0 ? page * PAGE_SIZE + 1 : 0
      })
    }

    var list = []
    if (!tid || tid === 'hot') {
      var data = await apiRequest('/api/v1/movies/recommend', { page: page, limit: PAGE_SIZE })
      list = ((data && data.movies) || data || [])
    } else {
      var params = {
        page: page,
        limit: PAGE_SIZE,
        type: typeMap[tid] != null ? typeMap[tid] : 'all',
        filter_by: 'all',
        sort_by: 'release'
      }
      var data2 = await apiRequest('/api/v1/movies/latest', params)
      list = ((data2 && data2.movies) || data2 || [])
    }
    if (!Array.isArray(list)) list = []
    var vodList = list.map(mapMovie)
    console.log('category ' + tid + ' page ' + page + ': ' + vodList.length)
    return JSON.stringify({
      list: vodList,
      page: page,
      pagecount: vodList.length >= PAGE_SIZE ? page + 1 : page,
      total: vodList.length > 0 ? page * PAGE_SIZE + 1 : 0
    })
  } catch (e) {
    console.log('category error: ' + e)
    return JSON.stringify({ list: [], page: 1, pagecount: 1, total: 0 })
  }
}

async function detail(ids) {
  try {
    var id = Array.isArray(ids) ? ids[0] : ids
    console.log('detail: ' + id)

    // 演员 → 作品列表（以选集形式展示，每一集是一部作品）
    if (String(id).indexOf('actor_') === 0) {
      var actorId = String(id).replace(/^actor_/, '')
      var actorInfo = {}
      try {
        var ad = await apiRequest('/api/v1/actors/' + encodeURIComponent(actorId), {})
        actorInfo = (ad && ad.actor) || ad || {}
      } catch (_e) {}
      var actorName = String(actorInfo.name_zht || actorInfo.name || actorId).trim()
      var actorCover = ''
      var rawAvatar = String(actorInfo.avatar_url || '').trim()
      if (rawAvatar) {
        actorCover = rawAvatar.replace(/^https?:\/\/[^/]+\/rhe951l4q/i, 'https://c0.jdbstatic.com')
        actorCover = actorCover.replace('/covers/', '/avatars/')
      }
      if (!actorCover && actorId.length >= 2) {
        actorCover = 'https://c0.jdbstatic.com/avatars/' + actorId.substring(0, 2).toLowerCase() + '/' + actorId + '.jpg'
      }

      // 分页拉取作品列表
      var movies = []
      var maxPage = 5
      for (var p = 1; p <= maxPage; p++) {
        try {
          var md = await apiRequest('/api/v1/movies/tags', {
            filter_by: '0:a:' + actorId + ':',
            sort_by: 'release',
            order_by: 'desc',
            page: p,
            limit: PAGE_SIZE
          })
          var arr = (md && md.movies) || []
          if (!arr.length) break
          movies = movies.concat(arr)
          if (arr.length < PAGE_SIZE) break
        } catch (_me) {
          console.log('actor works page ' + p + ' error: ' + _me)
          break
        }
      }

      // 每一部作品作为一集：名称$movie:id
      // 用户在选集列表里看到作品名，点选后 play() 自动取磁链
      var playUrls = []
      for (var i = 0; i < movies.length; i++) {
        var m = movies[i] || {}
        var mid = String(m.id || '')
        if (!mid) continue
        var num = String(m.number || '').trim()
        var title = String(m.title || m.origin_title || '').trim()
        var label = num ? (num + ' ' + title) : (title || mid)
        // 去掉会破坏 T3 分隔符的字符
        label = label.replace(/\$/g, ' ').replace(/#/g, ' ').trim()
        if (!label) label = mid
        playUrls.push(label + '$movie:' + mid)
      }
      if (playUrls.length === 0) {
        playUrls.push('暂无作品$')
      }

      var vod = {
        vod_id: id,
        vod_name: actorName + ' 的作品',
        vod_pic: actorCover,
        vod_remarks: '共 ' + playUrls.length + ' 部',
        vod_year: '',
        vod_area: '',
        vod_actor: actorName,
        vod_director: '',
        vod_content: (actorInfo.other_name ? ('又名：' + actorInfo.other_name + '\\n') : '') + '共 ' + movies.length + ' 部作品，请在下方选集中选择',
        vod_play_from: '作品列表',
        vod_play_url: playUrls.join('#')
      }
      console.log('actor ' + actorId + ' works: ' + playUrls.length)
      return JSON.stringify({ list: [vod] })
    }

    var data = await apiRequest('/api/v4/movies/' + encodeURIComponent(id), {})
    var x = (data && data.movie) || data || {}
    var number = String(x.number || '').trim()
    var title = String(x.title || x.origin_title || number || id).trim()
    var name = number ? (number + ' ' + title) : title
    var cover = normalizeCover(x.cover_url || x.thumb_url || '', id)

    var actors = []
    if (Array.isArray(x.actors)) {
      actors = x.actors.map(function (a) { return a.name_zht || a.name || '' }).filter(Boolean)
    }

    // 磁链
    var magnets = []
    try {
      var magData = await apiRequest('/api/v1/movies/' + encodeURIComponent(id) + '/magnets', {})
      var mlist = (magData && magData.magnets) || []
      for (var i = 0; i < mlist.length; i++) {
        var m = mlist[i] || {}
        var hash = String(m.hash || '').trim().replace(/^magnet:\?xt=urn:btih:/i, '')
        if (!hash && !m.magnet_url && !m.url) continue
        var url = hash ? ('magnet:?xt=urn:btih:' + hash) : (m.magnet_url || m.url)
        var label = String(m.name || m.title || hash || ('磁力' + (i + 1))).trim()
        var tags = []
        if (m.cnsub || m.has_cnsub || m.is_subtitle) tags.push('中字')
        if (m.hd) tags.push('HD')
        var size = formatSize(m.size)
        if (size) tags.push(size)
        if (tags.length) label = label + ' [' + tags.join('/') + ']'
        magnets.push(label + '$' + url)
      }
    } catch (me) {
      console.log('magnets error: ' + me)
    }

    if (magnets.length === 0) {
      magnets.push('暂无磁链$')
    }

    var remarks = []
    if (x.score || x.rate) remarks.push('评分 ' + (x.score || x.rate))
    if (x.release_date) remarks.push(String(x.release_date))
    if (x.duration) remarks.push(x.duration + ' 分钟')
    if (x.magnets_count) remarks.push('磁链 ' + x.magnets_count)

    var vod = {
      vod_id: id,
      vod_name: name,
      vod_pic: cover,
      vod_remarks: remarks.join(' · '),
      vod_year: String(x.release_date || '').slice(0, 4),
      vod_area: '',
      vod_actor: actors.join(' / '),
      vod_director: (x.director && (x.director.name_zht || x.director.name)) || '',
      vod_content: String(x.summary || x.title || '').trim(),
      vod_play_from: 'JAVDB磁力',
      vod_play_url: magnets.join('#')
    }
    return JSON.stringify({ list: [vod] })
  } catch (e) {
    console.log('detail error: ' + e)
    return JSON.stringify({ list: [] })
  }
}

async function play(flag, id, vipFlags) {
  try {
    console.log('play: ' + id)
    var playId = String(id || '')

    // 演员作品入口：movie:影片ID → 取第一条磁链播放
    if (playId.indexOf('movie:') === 0) {
      var mid = playId.replace(/^movie:/, '')
      try {
        var magData = await apiRequest('/api/v1/movies/' + encodeURIComponent(mid) + '/magnets', {})
        var mlist = (magData && magData.magnets) || []
        // 优先中字 / HD
        mlist.sort(function (a, b) {
          var sa = (a.cnsub || a.has_cnsub ? 2 : 0) + (a.hd ? 1 : 0)
          var sb = (b.cnsub || b.has_cnsub ? 2 : 0) + (b.hd ? 1 : 0)
          return sb - sa
        })
        for (var i = 0; i < mlist.length; i++) {
          var m = mlist[i] || {}
          var hash = String(m.hash || '').trim().replace(/^magnet:\?xt=urn:btih:/i, '')
          if (hash) {
            return JSON.stringify({
              url: 'magnet:?xt=urn:btih:' + hash,
              header: JSON.stringify({ 'User-Agent': 'Mozilla/5.0' })
            })
          }
          if (m.magnet_url || m.url) {
            return JSON.stringify({
              url: m.magnet_url || m.url,
              header: JSON.stringify({ 'User-Agent': 'Mozilla/5.0' })
            })
          }
        }
      } catch (me) {
        console.log('play movie magnets error: ' + me)
      }
      return JSON.stringify({ url: '', message: '该作品暂无磁链' })
    }

    if (playId.indexOf('magnet:') === 0) {
      return JSON.stringify({
        url: playId,
        header: JSON.stringify({ 'User-Agent': 'Mozilla/5.0' })
      })
    }
    return JSON.stringify({
      url: playId,
      header: JSON.stringify({ 'User-Agent': 'Mozilla/5.0' })
    })
  } catch (e) {
    console.log('play error: ' + e)
    return JSON.stringify({ url: '' })
  }
}

async function search(wd, quick, pg) {
  try {
    if (!wd) return JSON.stringify({ list: [] })
    var page = parseInt(pg) || 1
    console.log('search: ' + wd + ' page ' + page)
    var data = await apiRequest('/api/v2/search', {
      q: wd,
      page: page,
      type: 'movie',
      movie_type: 'all',
      movie_sort_by: 'relevance',
      movie_filter_by: 'all'
    })
    var movies = (data && data.movies) || []
    if (!Array.isArray(movies)) movies = []
    var list = movies.map(mapMovie)
    console.log('search result: ' + list.length)
    return JSON.stringify({ list: list })
  } catch (e) {
    console.log('search error: ' + e)
    return JSON.stringify({ list: [] })
  }
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
