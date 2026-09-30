/**
 * 桃花族 / 黄色仓库 - 蜂蜜影视 CatVod JS Spider
 * 入口会跳转最新域名；播放走 POST /static/count.php 取 m3u8
 */
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const PORTALS = [
  'http://hscangku.com',
  'http://920ck.us',
  'http://7340hsck.cc',
];

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
  if (extra) {
    for (const k in extra) h[k] = extra[k];
  }
  return h;
}

function httpGet(url, extra) {
  let html = '';
  try {
    const res = req(url, { method: 'get', headers: headers(extra), timeout: 20000 });
    if (typeof res === 'string') html = res;
    else if (res) {
      html = res.content || res.body || res.data || '';
      if (typeof html !== 'string') html = String(html);
    }
  } catch (e1) {
    try {
      if (typeof request === 'function') html = request(url, { headers: headers(extra) });
    } catch (e2) {}
  }
  return html || '';
}

function httpPost(url, body, extra) {
  let html = '';
  const h = headers(Object.assign({
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
  }, extra || {}));
  try {
    const res = req(url, {
      method: 'post',
      headers: h,
      body: body,
      data: body,
      postType: 'form',
      timeout: 20000,
    });
    if (typeof res === 'string') html = res;
    else if (res) {
      html = res.content || res.body || res.data || '';
      if (typeof html !== 'string') html = String(html);
    }
  } catch (e1) {
    try {
      if (typeof request === 'function') {
        html = request(url, { method: 'POST', headers: h, body: body, data: body });
      }
    } catch (e2) {}
  }
  return html || '';
}

function absUrl(u) {
  if (!u) return '';
  if (u.indexOf('http') === 0) return u;
  if (u.indexOf('//') === 0) return 'https:' + u;
  const base = HOST || PORTALS[0];
  if (u.charAt(0) === '/') return base + u;
  return base + '/' + u;
}

function isChallenge(html) {
  if (!html || html.length < 50) return true;
  return /Just a moment|cf-mitigated|challenge-platform/i.test(html);
}

/** 从门户跳转拿到真实站点域名 */
function resolveHost() {
  if (HOST && HOST.indexOf('http') === 0) return HOST;
  for (let i = 0; i < PORTALS.length; i++) {
    const portal = PORTALS[i];
    try {
      const html = httpGet(portal + '/');
      const m = html.match(/strU\s*=\s*"([^"]+)"/);
      if (!m) continue;
      const jump = m[1] + portal + '/&p=/';
      const page = httpGet(jump, { 'Referer': portal + '/' });
      if (!page || isChallenge(page)) continue;
      // 从页面里的链接猜 host，或用 maccms.url
      let host = '';
      const mu = page.match(/"url"\s*:\s*"(https?:\/\/[^"]+)"/);
      if (mu) host = mu[1].replace(/\/$/, '');
      if (!host) {
        const link = page.match(/href="(https?:\/\/[^"/]+)/);
        if (link) host = link[1];
      }
      // 若跳转页本身已是内容站
      if (page.indexOf('stui-vodlist') >= 0 || page.indexOf('stui-pannel') >= 0) {
        // 尝试从常见结构提取
        const a = page.match(/https?:\/\/[a-z0-9.-]+\.(?:agsck|0ock|hsck|ck)\.[a-z]+/i);
        if (a) host = a[0];
      }
      // 直接探测已知可用域
      const candidates = [];
      if (host) candidates.push(host);
      candidates.push('https://222.agsck.cc', 'https://444.0ock.cc');
      for (let j = 0; j < candidates.length; j++) {
        const c = candidates[j].replace(/\/$/, '');
        const test = httpGet(c + '/');
        if (test && (test.indexOf('stui-') >= 0 || test.indexOf('vodtype') >= 0)) {
          HOST = c;
          return HOST;
        }
      }
    } catch (e) {}
  }
  // 兜底
  HOST = 'https://222.agsck.cc';
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
    let name = m[2].replace(/<[^>]+>/g, '').trim();
    // 去掉数量前缀如 5038无码
    name = name.replace(/^\d+/, '').trim();
    if (!href || !name) continue;
    if (href.indexOf('vodtype') < 0 && href.indexOf('/type/') < 0) continue;
    if (seen[href]) continue;
    seen[href] = 1;
    tabs.push({ type_id: href, type_name: name });
  }
  return tabs;
}

function isPlayPath(href) {
  if (!href) return false;
  // 只要站内播放页，过滤广告外链
  if (/^https?:\/\//i.test(href) && href.indexOf('/v5/') < 0 && href.indexOf('/vodplay') < 0) return false;
  return href.indexOf('/v5/') >= 0 || href.indexOf('/vodplay') >= 0 || href.indexOf('/voddetail') >= 0;
}

function parseList(html) {
  const list = [];
  const seen = {};

  // 优先：明确匹配 /v5/ 播放卡片（带 title + data-original）
  const reV5 = /class="stui-vodlist__thumb[^"]*"[^>]*href="((?:\/v5\/|\/vodplay\/)[^"]+)"[^>]*title="([^"]+)"[^>]*data-original="([^"]*)"/gi;
  let m;
  while ((m = reV5.exec(html)) !== null) {
    const href = absUrl(m[1]);
    if (seen[href]) continue;
    seen[href] = 1;
    list.push({
      vod_id: href,
      vod_name: m[2],
      vod_pic: m[3] || '',
      vod_remarks: '',
    });
  }
  // 属性顺序可能不同
  if (list.length === 0) {
    const re2 = /class="stui-vodlist__thumb[^"]*"[^>]*title="([^"]+)"[^>]*href="((?:\/v5\/|\/vodplay\/)[^"]+)"[^>]*data-original="([^"]*)"/gi;
    while ((m = re2.exec(html)) !== null) {
      const href = absUrl(m[2]);
      if (seen[href]) continue;
      seen[href] = 1;
      list.push({ vod_id: href, vod_name: m[1], vod_pic: m[3] || '', vod_remarks: '' });
    }
  }
  // data-original 在前
  if (list.length === 0) {
    const re3 = /href="((?:\/v5\/|\/vodplay\/)[^"]+)"[^>]*title="([^"]+)"[^>]*(?:data-original|src)="([^"]+)"/gi;
    while ((m = re3.exec(html)) !== null) {
      const href = absUrl(m[1]);
      if (seen[href]) continue;
      seen[href] = 1;
      list.push({ vod_id: href, vod_name: m[2], vod_pic: m[3] || '', vod_remarks: '' });
    }
  }

  try {
    if (typeof load === 'function' && list.length === 0) {
      const $ = load(html);
      $('.stui-vodlist li, .stui-vodlist__box').each((_, el) => {
        const $el = $(el);
        const $a = $el.find('a.stui-vodlist__thumb').first();
        if (!$a.length) return;
        let href = $a.attr('href') || '';
        if (!isPlayPath(href)) return;
        let title = $a.attr('title') || ($el.find('h4.title a').text() || '').trim();
        let cover = $a.attr('data-original') || $a.attr('data-src') || $a.find('img').attr('data-original') || $a.find('img').attr('src') || '';
        const remarks = ($el.find('.pic-text').text() || '').trim();
        if (!href || !title) return;
        href = absUrl(href);
        if (seen[href]) return;
        seen[href] = 1;
        list.push({
          vod_id: href,
          vod_name: title,
          vod_pic: cover,
          vod_remarks: remarks,
        });
      });
    }
  } catch (e) {}

  // 补 duration 备注
  if (list.length > 0) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].vod_remarks) continue;
      try {
        const idPart = (list[i].vod_id.match(/\/v5\/(\d+)/) || [])[1];
        if (!idPart) continue;
        const rm = html.match(new RegExp('href="[^"]*' + idPart + '[^"]*"[\\s\\S]{0,200}?pic-text[^>]*>([^<]+)', 'i'));
        if (rm) list[i].vod_remarks = rm[1].trim();
      } catch (e) {}
    }
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
  // pure js
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let str = String(s).replace(/=+$/, '');
  let output = '';
  if (str.length % 4 === 1) return '';
  for (let bc = 0, bs, buffer, idx = 0; (buffer = str.charAt(idx++)); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))) : 0) {
    buffer = chars.indexOf(buffer);
  }
  return output;
}

/** 新版：POST /static/count.php */
function resolveByCountApi(html, pageUrl) {
  const aid = (html.match(/AID\s*=\s*'(\d+)'/) || [])[1];
  const asid = (html.match(/ASID\s*=\s*'(\d+)'/) || [])[1] || '1';
  const anid = (html.match(/ANID\s*=\s*'(\d+)'/) || [])[1] || '1';
  const ak = (html.match(/AK\s*=\s*'([^']+)'/) || [])[1];
  if (!aid || !ak) return '';

  const body =
    'id=' + encodeURIComponent(aid) +
    '&sid=' + encodeURIComponent(asid) +
    '&nid=' + encodeURIComponent(anid) +
    '&tk=' + encodeURIComponent(ak) +
    '&g=1&x=120&y=340&dt=800&sw=390&sh=844&tz=-480&t=' + Date.now();

  const resp = httpPost(HOST + '/static/count.php', body, {
    'Referer': pageUrl,
    'Origin': HOST,
  });
  try {
    const j = JSON.parse(resp);
    if (j && j.ok && j.u) {
      return b64decode(j.u);
    }
  } catch (e) {}
  // 有时直接返回
  if (resp && resp.indexOf('http') === 0) return resp.trim();
  return '';
}

/** 旧版 player_aaaa */
function resolvePlayerAaaa(html) {
  let enc = '';
  let encrypt = 0;
  const em = html.match(/"encrypt"\s*:\s*(\d+)/);
  if (em) encrypt = parseInt(em[1]) || 0;
  let um = html.match(/"encrypt"\s*:\s*\d+[\s\S]{0,80}?"url"\s*:\s*"([^"]+)"/);
  if (!um) um = html.match(/player_aaaa[\s\S]{0,1200}?"url"\s*:\s*"([^"]+)"/);
  if (!um) um = html.match(/"url"\s*:\s*"(https?:[^"]+)"/);
  if (um) enc = um[1];
  if (!enc) return '';
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
    if (isChallenge(html)) {
      return JSON.stringify({ list: [tip('站点无法访问，可 ext 填最新域名')] });
    }
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
      // full url
    } else {
      typeurl = typeurl.charAt(0) === '/' ? typeurl : '/' + typeurl;
    }
    // /vodtype/8.html -> /vodtype/8-1.html
    let path = typeurl.replace(/\.html$/i, '-' + page + '.html');
    if (path.indexOf('http') === 0) {
      // ok
    } else {
      path = HOST + path;
    }
    const html = httpGet(path);
    if (isChallenge(html)) {
      return JSON.stringify({
        page: page, pagecount: 1, limit: 24, total: 0,
        list: [tip('分类无法访问')],
      });
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
    let url = absUrl(id);
    const html = httpGet(url, { 'Referer': HOST + '/' });
    if (isChallenge(html)) {
      return JSON.stringify({
        list: [{
          vod_id: url,
          vod_name: '详情无法访问',
          vod_pic: '',
          vod_content: '',
          vod_play_from: '默认分组',
          vod_play_url: '播放$',
        }],
      });
    }

    let title = '';
    let m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
      || html.match(/class="title"[^>]*>([\s\S]*?)</i)
      || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (m) title = m[1].replace(/<[^>]+>/g, '').trim().replace(/\s*[|\-].*$/, '');

    // 播放地址在 play 时再解（含 token 时效）
    return JSON.stringify({
      list: [{
        vod_id: url,
        vod_name: title || '桃花族',
        vod_pic: '',
        vod_content: '',
        vod_play_from: '默认分组',
        vod_play_url: '播放$' + url,
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
    let playUrl = (id || '').trim();

    // 已是媒体地址
    if (/\.(m3u8|mp4)(\?|$)/i.test(playUrl) && playUrl.indexOf('http') === 0) {
      return JSON.stringify({
        parse: 0,
        jx: 0,
        url: playUrl,
        header: {
          'User-Agent': UA,
          'Referer': HOST + '/',
        },
      });
    }

    const pageUrl = absUrl(playUrl);
    const html = httpGet(pageUrl, { 'Referer': HOST + '/' });
    const media = extractPlayUrl(html, pageUrl);

    if (media) {
      return JSON.stringify({
        parse: 0,
        jx: 0,
        url: media,
        header: {
          'User-Agent': UA,
          'Referer': HOST + '/',
        },
      });
    }

    return JSON.stringify({
      parse: 1,
      jx: 0,
      url: pageUrl,
      header: { 'User-Agent': UA, 'Referer': HOST + '/' },
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
    ensureHost();
    const page = parseInt(pg) || 1;
    const text = encodeURIComponent(wd || '');
    const url = HOST + '/vodsearch/' + text + '----------' + page + '---.html';
    const html = httpGet(url);
    if (isChallenge(html)) return JSON.stringify({ list: [tip('搜索无法访问')] });
    return JSON.stringify({
      page: page,
      pagecount: 1,
      list: parseList(html),
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
