/**
 * JavMove - 蜂蜜影视 CatVod JS Spider
 * 播放直链需 Referer=javmove.com + Cookie，部分播放器要 URL 内嵌头
 */
const UA = 'Mozilla/5.0 (Linux; Android 16; LMR-AL00 Build/HUAWEILMR-AL00) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.196 Mobile Safari/537.36';
const UA_WEB = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0.1 Mobile/15E148 Safari/604.1';
const HOST = 'https://javmove.com';

const HEADERS = {
  'User-Agent': UA_WEB,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': HOST + '/',
};

let siteKey = '';
let siteType = 0;
let siteCookie = '';

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function randStr(n) {
  const s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let r = '';
  for (let i = 0; i < n; i++) r += s.charAt(Math.floor(Math.random() * s.length));
  return r;
}

/** 浏览器样例同款 Cookie；没有真实 cookie 时生成可用占位 */
function ensureCookie() {
  if (siteCookie && siteCookie.indexOf('_juid=') >= 0) return siteCookie;
  const t = nowSec();
  const juid = randStr(12) + '.' + String(t) + '000';
  const yuid = String(t) + String(Math.floor(Math.random() * 1e12)).slice(0, 12);
  const gen = '_juid=' + juid + '; _ym_uid=' + yuid + '; _ym_d=' + t + '; _ym_isad=2; _wc=1';
  if (siteCookie) return siteCookie + '; ' + gen;
  return gen;
}

function httpGet(url, extra) {
  let html = '';
  const headers = Object.assign({}, HEADERS, extra || {});
  const ck = ensureCookie();
  if (ck) headers['Cookie'] = ck;
  try {
    const res = req(url, {
      method: 'get',
      headers: headers,
      timeout: 25000,
    });
    if (typeof res === 'string') {
      html = res;
    } else if (res) {
      html = res.content || res.body || res.data || res.text || '';
      try {
        const setCk = res.headers && (res.headers['set-cookie'] || res.headers['Set-Cookie'] || res.headers['cookie']);
        if (setCk) mergeCookie(setCk);
      } catch (e) {}
      if (typeof html !== 'string') {
        try { html = JSON.stringify(html); } catch (e2) { html = String(html); }
      }
    }
  } catch (e1) {
    try {
      if (typeof request === 'function') html = request(url, { headers: headers });
    } catch (e2) {}
  }
  return html == null ? '' : String(html);
}

function mergeCookie(setCk) {
  try {
    const map = {};
    ensureCookie().split(';').forEach((p) => {
      const kv = p.trim().split('=');
      if (kv[0]) map[kv[0].trim()] = kv.slice(1).join('=').trim();
    });
    String(setCk).split(/,(?=\s*[^;]+=)/).forEach((p) => {
      const first = p.split(';')[0].trim();
      const i = first.indexOf('=');
      if (i > 0) map[first.slice(0, i).trim()] = first.slice(i + 1).trim();
    });
    siteCookie = Object.keys(map).map((k) => k + '=' + map[k]).join('; ');
  } catch (e) {}
}

function absUrl(u) {
  if (!u) return '';
  if (u.indexOf('http') === 0) return u;
  if (u.indexOf('//') === 0) return 'https:' + u;
  if (u.charAt(0) === '/') return HOST + u;
  return HOST + '/' + u;
}

function isChallenge(html) {
  if (!html || html.length < 40) return true;
  return /Just a moment|cf-mitigated|challenge-platform|Checking your browser/i.test(html);
}

function parseList(html) {
  const list = [];
  const seen = {};
  try {
    if (typeof load === 'function') {
      const $ = load(html);
      $('#movie-list article, article').each((_, el) => {
        const $el = $(el);
        let href = $el.find('a[rel="bookmark"]').attr('href')
          || $el.find('a[href*="/movie/"]').attr('href')
          || '';
        let title = $el.find('h2').attr('title') || ($el.find('h2').text() || '').trim();
        if (title) {
          title = title.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
          const code = title.match(/([A-Z]{2,15}-?\d{2,6})/i);
          title = code ? code[1].toUpperCase() : title.split(/\s+/)[0];
        }
        let cover = $el.find('.movie-image').attr('data-srcset')
          || $el.find('.movie-image').attr('data-src')
          || $el.find('.movie-image').attr('src')
          || $el.find('img').attr('src')
          || '';
        if (cover && cover.indexOf(' ') > 0) cover = cover.split(/\s+/)[0].replace(/,$/, '');
        let pub = '';
        const dt = $el.find('time').first().attr('datetime') || '';
        if (dt) pub = dt.split('T')[0];
        if (!href || !title) return;
        href = absUrl(href);
        if (seen[href]) return;
        seen[href] = 1;
        list.push({ vod_id: href, vod_name: title, vod_pic: absUrl(cover), vod_remarks: pub });
      });
    }
  } catch (e) {}
  if (list.length > 0) return list;

  const artRe = /<article[\s\S]*?<\/article>/gi;
  let m;
  while ((m = artRe.exec(html)) !== null) {
    const block = m[0];
    const hrefM = block.match(/href="([^"]+)"[^>]*rel="bookmark"/i)
      || block.match(/href="(\/movie\/[^"]+)"/i);
    const titleM = block.match(/<h2[^>]*title="([^"]+)"/i)
      || block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const coverM = block.match(/movie-image[^>]*(?:data-srcset|data-src|src)="([^"]+)"/i)
      || block.match(/(?:src)="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
    const timeM = block.match(/datetime="([^"]+)"/i);
    if (!hrefM || !titleM) continue;
    let title = titleM[1].replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').trim();
    const code = title.match(/([A-Z]{2,15}-?\d{2,6})/i);
    title = code ? code[1].toUpperCase() : (title.split(/\s+/)[0] || title);
    const href = absUrl(hrefM[1]);
    if (seen[href]) continue;
    seen[href] = 1;
    list.push({
      vod_id: href,
      vod_name: title,
      vod_pic: absUrl(coverM ? coverM[1].split(/\s+/)[0] : ''),
      vod_remarks: timeM ? timeM[1].split('T')[0] : '',
    });
  }
  return list;
}

function getDataId(html) {
  if (!html) return '';
  let m = html.match(/id=["']video-player["'][^>]*data-id=["']([^"']+)["']/i);
  if (m) return m[1];
  m = html.match(/data-id=["']([^"']+)["'][^>]*id=["']video-player["']/i);
  if (m) return m[1];
  m = html.match(/data-id=["']([A-Za-z0-9_-]{5,})["']/);
  return m ? m[1] : '';
}

function resolveWatch(token) {
  if (!token) return '';
  token = String(token).trim();
  if (/^https?:\/\//i.test(token) && /\.(m3u8|mp4)/i.test(token)) return token;

  const watchUrl = HOST + '/watch?token=' + token;
  const refs = [HOST + '/', HOST + '/release', 'https://javquick.com/'];
  for (let i = 0; i < refs.length; i++) {
    const body = httpGet(watchUrl, {
      'User-Agent': UA_WEB,
      'Referer': refs[i],
      'Accept': '*/*',
      'Origin': HOST,
    }).trim();
    if (!body) continue;
    if (/^https?:\/\//i.test(body) && body.indexOf('<') < 0) {
      return body.replace(/^["'\s]+|["'\s]+$/g, '').split(/\s+/)[0];
    }
    const m = body.match(/https?:\/\/[^\s"'<>\\]+?\.(?:m3u8|mp4)[^\s"'<>\\]*/i);
    if (m) return m[0].replace(/\\\//g, '/');
  }
  return '';
}

function parseFormats(html) {
  const groups = [];
  const mainId = getDataId(html);
  const blocks = html.split(/class="[^"]*video-format[^"]*"/i);

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].slice(0, 3000);
    const hm = block.match(/video-format-header[^>]*>([\s\S]*?)<\//i);
    let format = hm ? hm[1].replace(/<[^>]+>/g, '').trim() : ('线路' + i);
    if (!format) format = '线路' + i;

    const tracks = [];
    const btnRe = /<a([^>]*class="[^"]*video-source-btn[^"]*"[^>]*)>/gi;
    let bm;
    let partIdx = 0;
    while ((bm = btnRe.exec(block)) !== null) {
      const tag = bm[1] || bm[0];
      const hrefM = tag.match(/href="([^"]*)"/i);
      let href = hrefM ? hrefM[1] : '';
      partIdx++;
      let partNum = partIdx;
      const p2 = href.match(/[?&]p=(\d+)/i);
      if (p2) partNum = parseInt(p2[1], 10);

      let dataID = '';
      if (!href || href === '#' || href.charAt(0) === '#') dataID = mainId;
      else dataID = 'page:' + absUrl(href);
      if (!dataID) continue;
      tracks.push({ name: 'P' + partNum, part: partNum, dataID: dataID });
    }
    if (tracks.length === 0 && mainId) {
      tracks.push({ name: '播放', part: 1, dataID: mainId });
    }
    if (tracks.length > 0) {
      tracks.sort((a, b) => a.part - b.part);
      groups.push({ title: format, tracks: tracks });
    }
  }
  if (groups.length === 0 && mainId) {
    groups.push({ title: '默认', tracks: [{ name: '播放', part: 1, dataID: mainId }] });
  }
  function pri(t) {
    if (/^FullHD/i.test(t)) return 1;
    if (/^HD/i.test(t)) return 2;
    if (/^SD/i.test(t)) return 3;
    return 9;
  }
  groups.sort((a, b) => pri(a.title) - pri(b.title));
  return groups;
}

/**
 * 构造播放结果：
 * 1) header 对象（标准）
 * 2) 同时把头信息拼进 url（兼容只认 url 内嵌头的播放器）
 * 格式与浏览器可播样例一致：
 * mp4;{Cookie@...&&User-Agent@...&&Referer@https://javmove.com/&&Accept-Encoding@identity;q=1, *;q=0}
 */
function buildPlayResult(mediaUrl) {
  // 去掉可能误拼的内嵌头，只留纯媒体地址
  let u = String(mediaUrl || '').trim();
  const cut = u.indexOf(';{');
  if (cut > 0) u = u.slice(0, cut);
  const ck = ensureCookie();
  const header = {
    'User-Agent': UA,
    'Referer': HOST + '/',
    'Origin': HOST,
    'Accept': '*/*',
    'Accept-Encoding': 'identity;q=1, *;q=0',
    'Cookie': ck,
  };
  // 蜂蜜影视 / FongMi：纯 URL + header 对象（不要把 Cookie 拼进 url，否则播放器当非法地址）
  return JSON.stringify({
    parse: 0,
    jx: 0,
    url: u,
    header: header,
  });
}

function buildPlayResultEmbedded(mediaUrl) {
  const ck = ensureCookie();
  const ckEmbed = ck.replace(/;\s*/g, '；； ');
  const header = {
    'User-Agent': UA,
    'Referer': HOST + '/',
    'Origin': HOST,
    'Accept': '*/*',
    'Accept-Encoding': 'identity;q=1, *;q=0',
    'Cookie': ck,
  };
  const embedded =
    mediaUrl +
    ';{Cookie@' + ckEmbed +
    '&&User-Agent@' + UA +
    '&&Referer@' + HOST + '/' +
    '&&Accept-Encoding@identity；；q=1, *；；q=0}';
  return JSON.stringify({
    parse: 0,
    jx: 0,
    url: embedded,
    header: header,
  });
}

function tip(msg) {
  return { vod_id: 'tip', vod_name: msg, vod_pic: '', vod_remarks: '提示' };
}

async function init(cfg) {
  siteKey = (cfg && cfg.skey) || '';
  siteType = (cfg && cfg.stype) || 0;
  siteCookie = '';
  try { httpGet(HOST + '/'); } catch (e) {}
}

async function home(filter) {
  return JSON.stringify({
    class: [
      { type_id: 'release', type_name: '最新AV' },
      { type_id: 'upcoming', type_name: '即将上映' },
    ],
    filters: {},
  });
}

async function homeVod() {
  try {
    const html = httpGet(HOST + '/release?page=1');
    if (isChallenge(html)) return JSON.stringify({ list: [tip('站点无法访问')] });
    return JSON.stringify({ list: parseList(html).slice(0, 24) });
  } catch (e) {
    return JSON.stringify({ list: [] });
  }
}

async function category(tid, pg, filter, extend) {
  try {
    const page = parseInt(pg) || 1;
    const html = httpGet(HOST + '/' + (tid || 'release') + '?page=' + page);
    if (isChallenge(html)) {
      return JSON.stringify({ page: page, pagecount: 1, limit: 24, total: 0, list: [tip('分类无法访问')] });
    }
    const list = parseList(html);
    return JSON.stringify({
      page: page,
      pagecount: list.length >= 10 ? page + 1 : page,
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
    const url = absUrl(id);
    const html = httpGet(url, { 'Referer': HOST + '/release' });
    if (isChallenge(html)) {
      return JSON.stringify({
        list: [{
          vod_id: url, vod_name: '详情无法访问', vod_pic: '', vod_content: '',
          vod_play_from: '默认', vod_play_url: '播放$',
        }],
      });
    }
    let title = '';
    let m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (m) title = m[1].replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').trim();
    if (!title) {
      m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (m) title = m[1].replace(/<[^>]+>/g, '').trim();
    }
    const codeM = title.match(/([A-Z]{2,15}-?\d{2,6})/i);
    if (codeM) title = codeM[1].toUpperCase();
    let pic = '';
    m = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (m) pic = m[1];

    const groups = parseFormats(html);
    const fromParts = [];
    const urlParts = [];
    for (let i = 0; i < groups.length; i++) {
      fromParts.push(groups[i].title);
      const eps = [];
      for (let j = 0; j < groups[i].tracks.length; j++) {
        eps.push(groups[i].tracks[j].name + '$' + groups[i].tracks[j].dataID);
      }
      urlParts.push(eps.join('#'));
    }
    if (!fromParts.length) {
      fromParts.push('默认');
      urlParts.push('播放$');
    }
    return JSON.stringify({
      list: [{
        vod_id: url,
        vod_name: title || 'JavMove',
        vod_pic: pic,
        vod_content: '',
        vod_play_from: fromParts.join('$$$'),
        vod_play_url: urlParts.join('$$$'),
      }],
    });
  } catch (e) {
    return JSON.stringify({
      list: [{
        vod_id: id, vod_name: '详情失败', vod_pic: '', vod_content: String(e),
        vod_play_from: '默认', vod_play_url: '播放$',
      }],
    });
  }
}

async function play(flag, id, flags) {
  try {
    let key = (id || '').trim();
    if (key.indexOf('token:') === 0) key = key.slice(6);

    if (key.indexOf('page:') === 0) {
      const pageUrl = key.slice(5);
      const sub = httpGet(pageUrl, { 'Referer': HOST + '/' });
      key = getDataId(sub);
      if (!key) {
        return JSON.stringify({ parse: 1, jx: 0, url: pageUrl, header: { 'User-Agent': UA, 'Referer': HOST + '/' } });
      }
    }

    let mediaUrl = key;
    if (!(/^https?:\/\//i.test(key) && /\.(m3u8|mp4)/i.test(key))) {
      mediaUrl = resolveWatch(key);
    }
    if (!mediaUrl) mediaUrl = key;

    return buildPlayResult(mediaUrl);
  } catch (e) {
    return JSON.stringify({
      parse: 0,
      jx: 0,
      url: id,
      header: { 'User-Agent': UA, 'Referer': HOST + '/' },
    });
  }
}

async function search(wd, quick, pg) {
  try {
    const page = parseInt(pg) || 1;
    const html = httpGet(HOST + '/search?q=' + encodeURIComponent(wd || '') + '&page=' + page);
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
