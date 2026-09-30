/**
 * 桃花族 / 黄色仓库 - 蜂蜜影视 CatVod JS Spider
 * 播放: POST /static/count.php → base64(m3u8)
 */
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const PORTALS = ['http://hscangku.com', 'http://920ck.us', 'http://7340hsck.cc'];
const FALLBACK_HOSTS = ['https://222.agsck.cc', 'https://444.0ock.cc'];

let HOST = '';
let siteKey = '';
let siteType = 0;

function headers(extra) {
  const h = {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  };
  if (HOST) h['Referer'] = HOST + '/';
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

  // 多种 POST 写法兼容不同壳
  const attempts = [
    () => req(url, { method: 'post', headers: h, body: formBody, data: formBody, postType: 'form', timeout: 20000 }),
    () => req(url, { method: 'POST', headers: h, data: formBody, timeout: 20000 }),
    () => req(url, { headers: h, body: formBody, method: 'post', timeout: 20000 }),
  ];
  if (typeof post === 'function') {
    attempts.push(() => post(url, formBody, { headers: h }));
  }
  if (typeof request === 'function') {
    attempts.push(() => request(url, { method: 'POST', headers: h, body: formBody, data: formBody }));
  }

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

function absUrl(u) {
  if (!u) return '';
  if (u.indexOf('http') === 0) return u;
  if (u.indexOf('//') === 0) return 'https:' + u;
  const base = HOST || FALLBACK_HOSTS[0];
  return base + (u.charAt(0) === '/' ? u : '/' + u);
}

function isChallenge(html) {
  if (!html || html.length < 40) return true;
  return /Just a moment|cf-mitigated|challenge-platform/i.test(html);
}

function probeHost(c) {
  try {
    const test = httpGet(c + '/');
    if (test && (test.indexOf('stui-') >= 0 || test.indexOf('vodtype') >= 0 || test.indexOf('/v5/') >= 0)) {
      return true;
    }
  } catch (e) {}
  return false;
}

function resolveHost() {
  if (HOST && probeHost(HOST)) return HOST;
  for (let i = 0; i < FALLBACK_HOSTS.length; i++) {
    if (probeHost(FALLBACK_HOSTS[i])) {
      HOST = FALLBACK_HOSTS[i];
      return HOST;
    }
  }
  for (let i = 0; i < PORTALS.length; i++) {
    try {
      const portal = PORTALS[i];
      const html = httpGet(portal + '/');
      const m = html.match(/strU\s*=\s*"([^"]+)"/);
      if (!m) continue;
      const jump = m[1] + portal + '/&p=/';
      const page = httpGet(jump, { 'Referer': portal + '/' });
      if (!page) continue;
      for (let j = 0; j < FALLBACK_HOSTS.length; j++) {
        if (probeHost(FALLBACK_HOSTS[j])) {
          HOST = FALLBACK_HOSTS[j];
          return HOST;
        }
      }
    } catch (e) {}
  }
  HOST = FALLBACK_HOSTS[0];
  return HOST;
}

function ensureHost() {
  if (!HOST) resolveHost();
  return HOST;
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
    if (!href || !name) continue;
    if (href.indexOf('vodtype') < 0) continue;
    if (seen[href]) continue;
    seen[href] = 1;
    tabs.push({ type_id: href, type_name: name });
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
      if (pi === 1) {
        title = m[1]; href = m[2]; cover = m[3];
      } else {
        href = m[1]; title = m[2]; cover = m[3];
      }
      if (!href || !title || !isPlayPath(href)) continue;
      href = absUrl(href);
      if (seen[href]) continue;
      seen[href] = 1;
      list.push({ vod_id: href, vod_name: title, vod_pic: cover || '', vod_remarks: '' });
    }
    if (list.length > 0) break;
  }
  try {
    if (typeof load === 'function' && list.length === 0) {
      const $ = load(html);
      $('a.stui-vodlist__thumb').each((_, el) => {
        const $a = $(el);
        let href = $a.attr('href') || '';
        if (!isPlayPath(href)) return;
        const title = $a.attr('title') || '';
        const cover = $a.attr('data-original') || $a.attr('data-src') || '';
        const remarks = ($a.find('.pic-text').text() || '').trim();
        if (!href || !title) return;
        href = absUrl(href);
        if (seen[href]) return;
        seen[href] = 1;
        list.push({ vod_id: href, vod_name: title, vod_pic: cover, vod_remarks: remarks });
      });
    }
  } catch (e) {}
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
  let str = String(s).replace(/[^A-Za-z0-9+/=]/g, '').replace(/=+$/, '');
  let output = '';
  if (str.length % 4 === 1) return '';
  for (let bc = 0, bs, buffer, idx = 0; (buffer = str.charAt(idx++)); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))) : 0) {
    buffer = chars.indexOf(buffer);
  }
  return output;
}

function resolveByCountApi(html, pageUrl) {
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

  const resp = httpPost(HOST + '/static/count.php', body, {
    'Referer': pageUrl,
    'Origin': HOST,
  });
  if (!resp) return '';

  try {
    const j = JSON.parse(resp);
    if (j && j.ok && j.u) {
      const u = b64decode(j.u);
      if (u && u.indexOf('http') === 0) return u;
    }
    // 有的返回直接在 url 字段
    if (j && j.url && String(j.url).indexOf('http') === 0) return j.url;
  } catch (e) {}

  // 非 JSON：整段 base64 或纯链接
  const t = resp.trim().replace(/^"|"$/g, '');
  if (t.indexOf('http') === 0) return t;
  if (/^[A-Za-z0-9+/=]+$/.test(t) && t.length > 20) {
    try {
      const u = b64decode(t);
      if (u && u.indexOf('http') === 0) return u;
    } catch (e) {}
  }
  // 从文本抠
  const m = resp.match(/https?:\/\/[^\s"'<>\\]+?\.(?:m3u8|mp4)[^\s"'<>\\]*/i);
  if (m) return m[0];
  return '';
}

function resolvePlayerAaaa(html) {
  let encrypt = 0;
  const em = html.match(/"encrypt"\s*:\s*(\d+)/);
  if (em) encrypt = parseInt(em[1]) || 0;
  let um = html.match(/player_aaaa[\s\S]{0,1500}?"url"\s*:\s*"([^"]+)"/);
  if (!um) um = html.match(/"url"\s*:\s*"(https?:[^"]+\.(?:m3u8|mp4)[^"]*)"/i);
  if (!um) return '';
  let enc = um[1];
  try {
    if (encrypt === 2) {
      let s = b64decode(enc);
      try { s = decodeURIComponent(s); } catch (e) {}
      return s;
    }
    if (encrypt === 1) {
      try { return decodeURIComponent(enc); } catch (e) { return enc; }
    }
  } catch (e) {}
  return enc;
}

function extractPlayUrl(html, pageUrl) {
  let u = resolveByCountApi(html, pageUrl);
  if (u) return u;
  u = resolvePlayerAaaa(html);
  if (u) return u;
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
  try { ensureHost(); } catch (e) {}
}

async function home(filter) {
  try {
    ensureHost();
    const html = httpGet(HOST + '/');
    let tabs = parseTabs(html || '');
    if (tabs.length === 0) {
      tabs = [
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
    return JSON.stringify({ class: tabs, filters: {} });
  } catch (e) {
    return JSON.stringify({ class: [], filters: {} });
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
    if (typeurl.indexOf('http') !== 0) {
      typeurl = typeurl.charAt(0) === '/' ? typeurl : '/' + typeurl;
    }
    let path = typeurl.replace(/\.html$/i, '-' + page + '.html');
    if (path.indexOf('http') !== 0) path = HOST + path;
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
    const url = absUrl(id);
    const html = httpGet(url, { 'Referer': HOST + '/' });

    let title = '';
    // 避免抓到「目录」菜单
    let m = html.match(/stui-vodlist__thumb[^>]*title="([^"]+)"/i);
    if (!m) m = html.match(/<h3[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i);
    if (!m) m = html.match(/AID\s*=\s*'(\d+)'/);
    if (m) {
      title = m[1].replace(/<[^>]+>/g, '').trim();
      if (title === '目录' || /^\d+$/.test(title)) title = '';
    }
    if (!title) {
      m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (m) title = m[1].replace(/<[^>]+>/g, '').trim().split(/[|\-]/)[0].trim();
    }

    // 在详情阶段就尝试解析播放地址（失败则 play 再试）
    let media = '';
    try { media = extractPlayUrl(html, url); } catch (e) {}

    return JSON.stringify({
      list: [{
        vod_id: url,
        vod_name: title || '桃花族',
        vod_pic: '',
        vod_content: '',
        vod_play_from: '默认分组',
        vod_play_url: '播放$' + (media || url),
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
    ensureHost();
    let key = (id || '').trim();

    if (/\.(m3u8|mp4)(\?|$)/i.test(key) && key.indexOf('http') === 0) {
      return JSON.stringify({
        parse: 0,
        jx: 0,
        url: key,
        header: {
          'User-Agent': UA,
          'Referer': HOST + '/',
          'Origin': HOST,
        },
      });
    }

    const pageUrl = absUrl(key);
    const html = httpGet(pageUrl, { 'Referer': HOST + '/' });
    const media = extractPlayUrl(html, pageUrl);

    if (media && /\.(m3u8|mp4)/i.test(media)) {
      return JSON.stringify({
        parse: 0,
        jx: 0,
        url: media,
        header: {
          'User-Agent': UA,
          'Referer': HOST + '/',
          'Origin': HOST,
        },
      });
    }

    // 解析失败时不要把页面 HTML 地址当媒体源
    return JSON.stringify({
      parse: 0,
      jx: 0,
      url: '',
      message: '播放解析失败，请换节点或稍后重试',
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
    if (isChallenge(html)) return JSON.stringify({ list: [tip('搜索无法访问')] });
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
