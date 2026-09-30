/**
 * 桃花族 / 黄色仓库 - 蜂蜜影视 CatVod JS Spider
 * 播放: POST /static/count.php → base64(m3u8)
 * 注意: 部分镜像列表可用但播放页会跳首页，需自动换域
 */
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const HOSTS = [
  'https://444.0ock.cc',
  'https://333.agsck.cc',
  'https://222.agsck.cc',
];
const PORTALS = ['http://hscangku.com', 'http://920ck.us', 'http://7340hsck.cc'];

let HOST = HOSTS[0];
let siteKey = '';
let siteType = 0;

function headers(extra) {
  const h = {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': (HOST || HOSTS[0]) + '/',
  };
  if (extra) for (const k in extra) h[k] = extra[k];
  return h;
}

function httpGet(url, extra) {
  let html = '';
  try {
    const res = req(url, { method: 'get', headers: headers(extra), timeout: 20000 });
    if (typeof res === 'string') html = res;
    else if (res) {
      html = res.content || res.body || res.data || res.text || '';
      if (typeof html !== 'string') html = String(html);
    }
  } catch (e1) {
    try {
      if (typeof request === 'function') html = request(url, { headers: headers(extra) });
    } catch (e2) {}
  }
  return html || '';
}

function httpPost(url, formBody, extra) {
  let html = '';
  const h = headers(Object.assign({
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
  }, extra || {}));
  const attempts = [
    () => req(url, { method: 'post', headers: h, body: formBody, data: formBody, postType: 'form', timeout: 20000 }),
    () => req(url, { method: 'POST', headers: h, data: formBody, timeout: 20000 }),
    () => req(url, { method: 'post', headers: h, body: formBody, timeout: 20000 }),
  ];
  if (typeof post === 'function') attempts.push(() => post(url, formBody, { headers: h }));
  if (typeof request === 'function') attempts.push(() => request(url, { method: 'POST', headers: h, body: formBody, data: formBody }));

  for (let i = 0; i < attempts.length; i++) {
    try {
      const res = attempts[i]();
      if (typeof res === 'string') html = res;
      else if (res) html = res.content || res.body || res.data || res.text || '';
      if (typeof html !== 'string') html = String(html || '');
      if (html && html.length > 5) break;
    } catch (e) {}
  }
  return html || '';
}

function absUrl(u, host) {
  if (!u) return '';
  if (u.indexOf('http') === 0) return u;
  if (u.indexOf('//') === 0) return 'https:' + u;
  const base = host || HOST || HOSTS[0];
  return base + (u.charAt(0) === '/' ? u : '/' + u);
}

/** 把任意镜像上的 /v5/xx 路径统一到当前 HOST */
function rewriteHost(url) {
  if (!url) return url;
  return url.replace(/^https?:\/\/[^/]+/i, HOST);
}

function isChallenge(html) {
  if (!html || html.length < 40) return true;
  return /Just a moment|cf-mitigated|challenge-platform/i.test(html);
}

/** 播放页特征：含 AID/read_zone */
function isPlayHtml(html) {
  return !!(html && (html.indexOf('AID=') >= 0 || html.indexOf('read_zone') >= 0 || html.indexOf('mountPlayer') >= 0));
}

function probeList(host) {
  try {
    const html = httpGet(host + '/vodtype/8-1.html');
    return html && html.length > 5000 && (html.indexOf('/v5/') >= 0 || html.indexOf('stui-vodlist') >= 0);
  } catch (e) {
    return false;
  }
}

function probePlay(host) {
  try {
    // 用列表里随便抽一个 id 测太重，直接看首页是否可进
    const html = httpGet(host + '/');
    return html && html.length > 3000;
  } catch (e) {
    return false;
  }
}

function resolveHost() {
  for (let i = 0; i < HOSTS.length; i++) {
    if (probeList(HOSTS[i])) {
      HOST = HOSTS[i];
      return HOST;
    }
  }
  HOST = HOSTS[0];
  return HOST;
}

function ensureHost() {
  if (!HOST) resolveHost();
  return HOST;
}

/**
 * 拉取播放页：当前 HOST 若被跳成首页（无 AID），自动换其它镜像重试
 */
function fetchPlayPage(pathOrUrl) {
  let path = pathOrUrl || '';
  const m = path.match(/(\/v5\/\d+-\d+-\d+\.html)/i) || path.match(/(\/vodplay\/[^?]+\.html)/i);
  if (m) path = m[1];
  else if (path.indexOf('http') === 0) {
    try {
      const u = path.replace(/^https?:\/\/[^/]+/i, '');
      path = u.charAt(0) === '/' ? u : '/' + u;
    } catch (e) {}
  }

  const order = [HOST].concat(HOSTS.filter((h) => h !== HOST));
  for (let i = 0; i < order.length; i++) {
    const h = order[i];
    const url = h + path;
    const html = httpGet(url, { 'Referer': h + '/' });
    if (isPlayHtml(html)) {
      HOST = h;
      return { html: html, url: url, host: h };
    }
  }
  // 都失败则返回最后一次
  const last = order[order.length - 1];
  return { html: httpGet(last + path), url: last + path, host: last };
}

function parseTabs(html) {
  const tabs = [];
  const seen = {};
  const menu = html.match(/class="[^"]*stui-pannel__menu[^"]*"[\s\S]*?<\/ul>/i);
  const block = menu ? menu[0] : html;
  const re = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(block)) !== null) {
    let href = m[1];
    let name = m[2].replace(/<[^>]+>/g, '').trim().replace(/^\d+/, '').trim();
    if (!href || !name || href.indexOf('vodtype') < 0) continue;
    if (seen[href]) continue;
    seen[href] = 1;
    tabs.push({ type_id: href, type_name: name });
  }
  if (tabs.length === 0) {
    return [
      { type_id: '/vodtype/8.html', type_name: '无码中文字幕' },
      { type_id: '/vodtype/9.html', type_name: '有码中文字幕' },
      { type_id: '/vodtype/10.html', type_name: '日本无码' },
      { type_id: '/vodtype/7.html', type_name: '日本有码' },
      { type_id: '/vodtype/26.html', type_name: '骑兵破解' },
      { type_id: '/vodtype/15.html', type_name: '国产视频' },
      { type_id: '/vodtype/21.html', type_name: '欧美高清' },
      { type_id: '/vodtype/22.html', type_name: '动漫剧情' },
    ];
  }
  return tabs;
}

function isPlayPath(href) {
  if (!href) return false;
  if (/^https?:\/\//i.test(href) && href.indexOf('/v5/') < 0 && href.indexOf('/vodplay') < 0) return false;
  return href.indexOf('/v5/') >= 0 || href.indexOf('/vodplay') >= 0;
}

function parseList(html) {
  const list = [];
  const seen = {};
  const patterns = [
    /class="stui-vodlist__thumb[^"]*"[^>]*href="((?:\/v5\/|\/vodplay\/)[^"]+)"[^>]*title="([^"]+)"[^>]*data-original="([^"]*)"/gi,
    /class="stui-vodlist__thumb[^"]*"[^>]*title="([^"]+)"[^>]*href="((?:\/v5\/|\/vodplay\/)[^"]+)"[^>]*data-original="([^"]*)"/gi,
    /href="((?:\/v5\/|\/vodplay\/)[^"]+)"[^>]*title="([^"]+)"[^>]*(?:data-original|src)="([^"]+)"/gi,
  ];
  for (let pi = 0; pi < patterns.length; pi++) {
    const re = patterns[pi];
    let m;
    while ((m = re.exec(html)) !== null) {
      let href, title, cover;
      if (pi === 1) { title = m[1]; href = m[2]; cover = m[3]; }
      else { href = m[1]; title = m[2]; cover = m[3]; }
      if (!href || !title || !isPlayPath(href)) continue;
      href = absUrl(href);
      if (seen[href]) continue;
      seen[href] = 1;
      list.push({ vod_id: href, vod_name: title, vod_pic: cover || '', vod_remarks: '' });
    }
    if (list.length > 0) break;
  }
  return list;
}

function b64decode(s) {
  try {
    if (typeof base64Decode === 'function') return base64Decode(s);
    if (typeof CryptoJS !== 'undefined' && CryptoJS.enc) {
      return CryptoJS.enc.Base64.parse(s).toString(CryptoJS.enc.Utf8);
    }
  } catch (e) {}
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let str = String(s).replace(/[^A-Za-z0-9+/=]/g, '');
  const pad = str.length % 4;
  if (pad) str += '===='.slice(pad);
  let output = '';
  if (str.length % 4 === 1) return '';
  for (let bc = 0, bs, buffer, idx = 0; (buffer = str.charAt(idx++)); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))) : 0) {
    buffer = chars.indexOf(buffer);
  }
  return output;
}

function resolveByCountApi(html, pageUrl, host) {
  const h = host || HOST;
  const aid = (html.match(/AID\s*=\s*'(\d+)'/) || html.match(/AID\s*=\s*"(\d+)"/) || [])[1];
  const asid = (html.match(/ASID\s*=\s*'(\d+)'/) || html.match(/ASID\s*=\s*"(\d+)"/) || [])[1] || '1';
  const anid = (html.match(/ANID\s*=\s*'(\d+)'/) || html.match(/ANID\s*=\s*"(\d+)"/) || [])[1] || '1';
  const ak = (html.match(/AK\s*=\s*'([0-9a-fA-F]+)'/) || html.match(/AK\s*=\s*"([0-9a-fA-F]+)"/) || [])[1];
  if (!aid || !ak) return '';

  const body =
    'id=' + encodeURIComponent(aid) +
    '&sid=' + encodeURIComponent(asid) +
    '&nid=' + encodeURIComponent(anid) +
    '&tk=' + encodeURIComponent(ak) +
    '&g=1&x=180&y=360&dt=1200&sw=390&sh=844&tz=-480&t=' + Date.now();

  // 对象形式再试一次（部分壳只认 data 对象）
  let resp = httpPost(h + '/static/count.php', body, {
    'Referer': pageUrl,
    'Origin': h,
  });

  if (!resp || resp.length < 5) {
    try {
      const dataObj = {
        id: aid, sid: asid, nid: anid, tk: ak,
        g: 1, x: 180, y: 360, dt: 1200, sw: 390, sh: 844, tz: -480, t: Date.now(),
      };
      const res2 = req(h + '/static/count.php', {
        method: 'post',
        headers: headers({
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': pageUrl,
          'Origin': h,
        }),
        data: dataObj,
        postType: 'form',
        timeout: 20000,
      });
      if (typeof res2 === 'string') resp = res2;
      else if (res2) resp = res2.content || res2.body || res2.data || '';
    } catch (e) {}
  }

  if (!resp) return '';
  try {
    const j = JSON.parse(resp);
    if (j && j.ok && j.u) {
      const u = b64decode(j.u);
      if (u && u.indexOf('http') === 0) return u;
    }
  } catch (e) {}
  const m = String(resp).match(/https?:\/\/[^\s"'<>\\]+?\.(?:m3u8|mp4)[^\s"'<>\\]*/i);
  return m ? m[0] : '';
}

function extractPlayUrl(html, pageUrl, host) {
  let u = resolveByCountApi(html, pageUrl, host);
  if (u) return u;
  // player_aaaa 兜底
  const em = html.match(/"encrypt"\s*:\s*(\d+)/);
  const encrypt = em ? parseInt(em[1]) : 0;
  let um = html.match(/player_aaaa[\s\S]{0,1500}?"url"\s*:\s*"([^"]+)"/);
  if (um) {
    let enc = um[1];
    if (encrypt === 2) {
      try {
        let s = b64decode(enc);
        try { s = decodeURIComponent(s); } catch (e2) {}
        if (s.indexOf('http') === 0) return s;
      } catch (e) {}
    } else if (enc.indexOf('http') === 0) return enc;
  }
  const m = html.match(/https?:\/\/[^\s"'<>]+?\.(?:m3u8|mp4)[^\s"'<>]*/i);
  return m ? m[0] : '';
}

function tip(msg) {
  return { vod_id: 'tip', vod_name: msg, vod_pic: '', vod_remarks: '提示' };
}

async function init(cfg) {
  siteKey = (cfg && cfg.skey) || '';
  siteType = (cfg && cfg.stype) || 0;
  try {
    const ext = (cfg && (cfg.ext || cfg.extend)) || '';
    if (typeof ext === 'string' && /^https?:\/\//i.test(ext)) {
      HOST = ext.replace(/\/$/, '');
    }
  } catch (e) {}
  try { resolveHost(); } catch (e) { HOST = HOSTS[0]; }
}

async function home(filter) {
  try {
    ensureHost();
    const html = httpGet(HOST + '/');
    return JSON.stringify({ class: parseTabs(html || ''), filters: {} });
  } catch (e) {
    return JSON.stringify({ class: parseTabs(''), filters: {} });
  }
}

async function homeVod() {
  try {
    ensureHost();
    const html = httpGet(HOST + '/vodtype/8-1.html');
    if (isChallenge(html)) return JSON.stringify({ list: [tip('站点无法访问')] });
    return JSON.stringify({ list: parseList(html).slice(0, 24) });
  } catch (e) {
    return JSON.stringify({ list: [] });
  }
}

async function category(tid, pg, filter, extend) {
  try {
    ensureHost();
    const page = parseInt(pg) || 1;
    let typeurl = tid || '/vodtype/8.html';
    if (typeurl.indexOf('http') === 0) {
      typeurl = typeurl.replace(/^https?:\/\/[^/]+/i, '');
    }
    if (typeurl.charAt(0) !== '/') typeurl = '/' + typeurl;
    const path = HOST + typeurl.replace(/\.html$/i, '-' + page + '.html');
    const html = httpGet(path);
    if (isChallenge(html)) {
      return JSON.stringify({ page: page, pagecount: 1, limit: 24, total: 0, list: [tip('分类无法访问')] });
    }
    const list = parseList(html);
    return JSON.stringify({
      page: page,
      pagecount: list.length >= 12 ? page + 1 : page,
      limit: 24,
      total: 999999,
      list: list,
    });
  } catch (e) {
    return JSON.stringify({ page: 1, pagecount: 1, limit: 24, total: 0, list: [] });
  }
}

async function detail(id) {
  try {
    ensureHost();
    const fetched = fetchPlayPage(id);
    const html = fetched.html || '';
    const pageUrl = fetched.url;

    let title = '';
    let m = html.match(/class="stui-vodlist__thumb[^"]*"[^>]*title="([^"]+)"/i);
    if (m && m[1] !== '目录') title = m[1];
    if (!title) {
      m = html.match(/AID\s*=\s*'(\d+)'/);
      // 从 title 标签
      const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (t) {
        title = t[1].replace(/<[^>]+>/g, '').trim().split(/[|\-]/)[0].trim();
        if (title.indexOf('黄色仓库') >= 0 || title.indexOf('hsck') >= 0) title = '';
      }
    }
    if (!title) {
      // 用路径里的 id
      const idm = String(id).match(/\/v5\/(\d+)/);
      title = idm ? ('影片' + idm[1]) : '桃花族';
    }

    // 不在详情预解析（token 可能过期），play 时再解
    return JSON.stringify({
      list: [{
        vod_id: pageUrl || absUrl(id),
        vod_name: title,
        vod_pic: '',
        vod_content: isPlayHtml(html) ? '' : '播放页异常，将自动换镜像',
        vod_play_from: '默认分组',
        vod_play_url: '播放$' + (pageUrl || absUrl(id)),
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
        vod_play_url: '播放$' + absUrl(id),
      }],
    });
  }
}

async function play(flag, id, flags) {
  try {
    ensureHost();
    let key = (id || '').trim();

    if (/\.(m3u8|mp4)(\?|$)/i.test(key) && key.indexOf('http') === 0) {
      return JSON.stringify({
        parse: 0,
        jx: 0,
        url: key,
        header: { 'User-Agent': UA, 'Referer': HOST + '/', 'Origin': HOST },
      });
    }

    const fetched = fetchPlayPage(key);
    const media = extractPlayUrl(fetched.html || '', fetched.url, fetched.host);

    if (media && /\.(m3u8|mp4)/i.test(media)) {
      return JSON.stringify({
        parse: 0,
        jx: 0,
        url: media,
        header: {
          'User-Agent': UA,
          'Referer': (fetched.host || HOST) + '/',
          'Origin': fetched.host || HOST,
        },
      });
    }

    return JSON.stringify({
      parse: 0,
      jx: 0,
      url: '',
      message: '播放解析失败(无AID或POST失败)，请换节点/镜像',
      header: { 'User-Agent': UA },
    });
  } catch (e) {
    return JSON.stringify({
      parse: 0,
      jx: 0,
      url: '',
      message: String(e),
      header: { 'User-Agent': UA },
    });
  }
}

async function search(wd, quick, pg) {
  try {
    ensureHost();
    const page = parseInt(pg) || 1;
    const url = HOST + '/vodsearch/' + encodeURIComponent(wd || '') + '----------' + page + '---.html';
    const html = httpGet(url);
    return JSON.stringify({ page: page, pagecount: 1, list: parseList(html) });
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
