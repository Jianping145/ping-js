/**
 * Taiav - 蜂蜜影视 CatVod JS Spider
 * 主站 taiav.com 易被 CF 拦，自动尝试镜像域名
 */
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1.1 Mobile/15E148 Safari/604.1';

// 镜像列表（首页 JS 里声明的 hosts）
const HOSTS = [
  'https://taimadou.com',
  'https://bangerspis.xyz',
  'https://linlinverse.com',
  'https://storyofthepast.xyz',
  'https://taiav.com',
];

const TABS = [
  { type_id: 'category|网红主播', type_name: '网红主播' },
  { type_id: 'category|国产AV', type_name: '国产AV' },
  { type_id: 'category|有码', type_name: '有码' },
  { type_id: 'category|无码', type_name: '无码' },
  { type_id: 'tag|Onlyfans', type_name: 'Onlyfans' },
  { type_id: 'tag|Korean Bj', type_name: 'Korean Bj' },
  { type_id: 'tag|探花', type_name: '探花' },
];

let siteKey = '';
let siteType = 0;
let HOST = HOSTS[0]; // 当前可用主机
let proxyPrefix = ''; // 可选：ext 传入反代前缀

function headers() {
  return {
    'User-Agent': UA,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': HOST + '/',
    'Origin': HOST,
  };
}

function isChallenge(body) {
  if (!body) return true;
  if (body.length < 20) return true;
  return /Just a moment|cf-mitigated|challenge-platform|cf-browser-verification|Checking your browser|Enable JavaScript and cookies/i.test(body);
}

function isJsonOk(body) {
  if (!body) return false;
  const t = body.trim();
  return t.charAt(0) === '[' || t.charAt(0) === '{';
}

function joinUrl(path) {
  if (!path) return '';
  if (path.indexOf('http') === 0) {
    if (proxyPrefix) return proxyPrefix + path;
    return path;
  }
  const full = HOST + (path.charAt(0) === '/' ? path : '/' + path);
  if (proxyPrefix) return proxyPrefix + full;
  return full;
}

function rawGet(url) {
  let body = '';
  try {
    const res = req(url, {
      method: 'get',
      headers: headers(),
      timeout: 18000,
    });
    if (typeof res === 'string') body = res;
    else if (res) {
      body = res.content || res.body || res.data || '';
      if (typeof body !== 'string') body = JSON.stringify(body);
    }
  } catch (e1) {
    try {
      if (typeof request === 'function') body = request(url, { headers: headers() });
    } catch (e2) {}
  }
  return body || '';
}

/** 请求 API 路径，失败自动换镜像 */
function apiGet(apiPath) {
  // 已锁定的 HOST 先试
  const order = [HOST].concat(HOSTS.filter((h) => h !== HOST));
  for (let i = 0; i < order.length; i++) {
    const h = order[i];
    const url = joinUrl(h + apiPath);
    // joinUrl 已处理 proxy；若无 proxy，直接拼
    const real = proxyPrefix
      ? (proxyPrefix + h + apiPath)
      : (h + apiPath);
    const body = rawGet(real);
    if (isJsonOk(body) && !isChallenge(body)) {
      HOST = h;
      return body;
    }
  }
  return '';
}

function parseJson(text) {
  try {
    if (typeof text === 'object' && text !== null) return text;
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

function absUrl(u) {
  if (!u) return '';
  if (u.indexOf('http') === 0) return u;
  if (u.indexOf('//') === 0) return 'https:' + u;
  return HOST + (u.charAt(0) === '/' ? u : '/' + u);
}

function mapItem(e) {
  const id = e._id != null ? String(e._id) : '';
  let pic = '';
  if (e.poster2 && e.poster2.url) pic = absUrl(e.poster2.url);
  else if (e.poster) pic = absUrl(e.poster);
  return {
    vod_id: id,
    vod_name: e.originalname || e.tcOriginalName || e.enOriginalName || '',
    vod_pic: pic,
    vod_remarks: e.duration || 'HD',
  };
}

function tip(msg) {
  return {
    vod_id: 'tip',
    vod_name: msg,
    vod_pic: '',
    vod_remarks: '提示',
  };
}

async function init(cfg) {
  siteKey = (cfg && cfg.skey) || '';
  siteType = (cfg && cfg.stype) || 0;
  try {
    const ext = (cfg && (cfg.ext || cfg.extend)) || '';
    if (typeof ext === 'string' && /^https?:\/\//i.test(ext)) {
      // 整段当反代前缀，或直接指定镜像
      if (/taiav|taimadou|bangerspis|linlinverse|storyofthepast/i.test(ext) && ext.indexOf('workers.dev') < 0 && ext.indexOf('?') < 0) {
        HOST = ext.replace(/\/$/, '');
      } else {
        proxyPrefix = ext.replace(/\/$/, '') + '/?url=';
      }
    } else if (ext && typeof ext === 'object') {
      if (ext.host) HOST = String(ext.host).replace(/\/$/, '');
      if (ext.proxy) proxyPrefix = String(ext.proxy).replace(/\/$/, '') + '/?url=';
    }
  } catch (e) {}
}

async function home(filter) {
  return JSON.stringify({ class: TABS, filters: {} });
}

async function homeVod() {
  try {
    const path = '/api/getcontents?page=1&size=24&category=' + encodeURIComponent('网红主播') + '&type=movie,tv';
    const raw = apiGet(path);
    if (!raw || isChallenge(raw)) {
      return JSON.stringify({
        list: [tip('站点被Cloudflare拦截，可换节点或ext填镜像域名')],
      });
    }
    const data = parseJson(raw);
    const list = [];
    if (data && data.length) {
      for (let i = 0; i < data.length && i < 24; i++) list.push(mapItem(data[i]));
    }
    if (list.length === 0) {
      return JSON.stringify({ list: [tip('接口返回空')] });
    }
    return JSON.stringify({ list: list });
  } catch (e) {
    return JSON.stringify({ list: [tip('首页失败')] });
  }
}

async function category(tid, pg, filter, extend) {
  try {
    const page = parseInt(pg) || 1;
    let tipName = 'category';
    let name = '有码';
    if (tid && tid.indexOf('|') > 0) {
      const parts = tid.split('|');
      tipName = parts[0] || 'category';
      name = parts.slice(1).join('|') || name;
    }
    const path = '/api/getcontents?page=' + page + '&size=12&' + tipName + '=' + encodeURIComponent(name) + '&type=movie,tv';
    const raw = apiGet(path);
    if (!raw || isChallenge(raw)) {
      return JSON.stringify({
        page: page,
        pagecount: 1,
        limit: 12,
        total: 0,
        list: [tip('CF拦截：换VPN节点，或ext填 https://taimadou.com')],
      });
    }
    const data = parseJson(raw);
    const list = [];
    if (data && data.length) {
      for (let i = 0; i < data.length; i++) list.push(mapItem(data[i]));
    }
    return JSON.stringify({
      page: page,
      pagecount: list.length >= 12 ? page + 1 : page,
      limit: 12,
      total: 999999,
      list: list,
    });
  } catch (e) {
    return JSON.stringify({
      page: 1, pagecount: 1, limit: 12, total: 0,
      list: [tip('分类异常')],
    });
  }
}

async function detail(id) {
  try {
    const vid = String(id);
    const path = '/api/getmovie?type=1280&id=' + encodeURIComponent(vid);
    const raw = apiGet(path);
    if (!raw || isChallenge(raw)) {
      return JSON.stringify({
        list: [{
          vod_id: vid,
          vod_name: '播放接口被CF拦截',
          vod_pic: '',
          vod_content: '',
          vod_play_from: '默认分组',
          vod_play_url: '重试$',
        }],
      });
    }
    const data = parseJson(raw) || {};
    let m3u8 = data.m3u8 || '';
    if (m3u8) m3u8 = absUrl(m3u8);

    return JSON.stringify({
      list: [{
        vod_id: vid,
        vod_name: 'Taiav',
        vod_pic: '',
        vod_content: '',
        vod_play_from: '默认分组',
        vod_play_url: '播放$' + (m3u8 || ''),
      }],
    });
  } catch (e) {
    return JSON.stringify({
      list: [{
        vod_id: id,
        vod_name: '详情失败',
        vod_pic: '',
        vod_content: String(e),
        vod_play_from: '默认分组',
        vod_play_url: '播放$',
      }],
    });
  }
}

async function play(flag, id, flags) {
  try {
    let playUrl = id || '';
    if (/\.m3u8/i.test(playUrl)) {
      return JSON.stringify({
        parse: 0,
        jx: 0,
        url: absUrl(playUrl),
        header: {
          'User-Agent': UA,
          'Origin': HOST,
          'Referer': HOST + '/',
        },
      });
    }
    // id 可能是影片 id，再请求 getmovie
    const path = '/api/getmovie?type=1280&id=' + encodeURIComponent(playUrl);
    const raw = apiGet(path);
    const data = parseJson(raw) || {};
    if (data.m3u8) {
      return JSON.stringify({
        parse: 0,
        jx: 0,
        url: absUrl(data.m3u8),
        header: {
          'User-Agent': UA,
          'Origin': HOST,
          'Referer': HOST + '/',
        },
      });
    }
    return JSON.stringify({
      parse: 0,
      jx: 0,
      url: absUrl(playUrl),
      header: { 'User-Agent': UA, 'Origin': HOST, 'Referer': HOST + '/' },
    });
  } catch (e) {
    return JSON.stringify({
      parse: 0,
      jx: 0,
      url: id,
      header: { 'User-Agent': UA },
    });
  }
}

async function search(wd, quick, pg) {
  try {
    const page = parseInt(pg) || 1;
    const path = '/api/getcontents?page=' + page + '&size=48&q=' + encodeURIComponent(wd || '') + '&type=movie,tv';
    const raw = apiGet(path);
    if (!raw || isChallenge(raw)) {
      return JSON.stringify({ list: [tip('搜索被CF拦截')] });
    }
    const data = parseJson(raw);
    const list = [];
    if (data && data.length) {
      for (let i = 0; i < data.length; i++) list.push(mapItem(data[i]));
    }
    return JSON.stringify({
      page: page,
      pagecount: list.length >= 48 ? page + 1 : page,
      list: list,
    });
  } catch (e) {
    return JSON.stringify({ list: [] });
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
    search: search,
  };
}
