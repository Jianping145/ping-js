/**
 * pppPorn - 蜂蜜影视 CatVod JS Spider
 * 站点: https://ppp.porn
 */
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1.1 Mobile/15E148 Safari/604.1';
const HOST = 'https://ppp.porn';

const HEADERS = {
  'User-Agent': UA,
  'Referer': HOST + '/pp1/',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

let siteKey = '';
let siteType = 0;
let cachedClasses = null;

function httpGet(url, extra) {
  let html = '';
  const headers = Object.assign({}, HEADERS, extra || {});
  try {
    const res = req(url, {
      method: 'get',
      headers: headers,
      timeout: 20000,
    });
    if (typeof res === 'string') {
      html = res;
    } else if (res) {
      html = res.content || res.body || res.data || '';
      if (typeof html !== 'string') html = String(html);
    }
  } catch (e1) {
    try {
      if (typeof request === 'function') {
        html = request(url, { headers: headers });
      }
    } catch (e2) {}
  }
  return html || '';
}

function absUrl(u) {
  if (!u) return '';
  if (u.indexOf('http') === 0) return u;
  if (u.indexOf('//') === 0) return 'https:' + u;
  if (u.charAt(0) === '/') return HOST + u;
  return HOST + '/' + u;
}

/** 提取真实 m3u8，排除 preview.m3u8.jpg 预览图 */
function extractM3u8(html) {
  if (!html) return '';

  // 1. var stream = 'https://....m3u8'
  let m = html.match(/var\s+stream\s*=\s*['"]([^'"]+\.m3u8[^'"]*)['"]/i);
  if (m && m[1] && m[1].indexOf('preview') < 0 && !/\.m3u8\.jpg/i.test(m[1])) {
    return m[1].replace(/\\\//g, '/');
  }

  // 2. 任意非预览的 m3u8（排除 .m3u8.jpg / screenshots / preview）
  const re = /https?:\/\/[^\s"'<>]+?\.m3u8[^\s"'<>]*/gi;
  let hit;
  while ((hit = re.exec(html)) !== null) {
    const u = hit[0];
    if (/\.m3u8\.jpg/i.test(u)) continue;
    if (/preview\.m3u8/i.test(u)) continue;
    if (/videos_screenshots/i.test(u)) continue;
    if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(u)) continue;
    return u.replace(/\\\//g, '/');
  }

  // 3. 转义形式 https:\/\/...m3u8
  m = html.match(/https?:\\\/\\\/[^"'\\s]+?\.m3u8[^"'\\s]*/i);
  if (m) {
    const u = m[0].replace(/\\\//g, '/');
    if (!/\.m3u8\.jpg/i.test(u) && u.indexOf('preview') < 0) return u;
  }

  return '';
}

function parseCategories(html) {
  const classes = [];
  try {
    if (typeof load === 'function') {
      const $ = load(html);
      $('section.padding-bottom-xl .card-cat-v2, .card-cat-v2').each((_, e) => {
        const title = ($(e).find('.card-cat-v2__title').text() || '').trim();
        const count = ($(e).find('.card-cat-v2__count').text() || '').trim();
        const href = $(e).find('a').attr('href') || '';
        if (!href || !title) return;
        classes.push({
          type_id: absUrl(href),
          type_name: count ? title + '(' + count + ')' : title,
        });
      });
    }
  } catch (e) {}
  if (classes.length > 0) return classes;

  const re = /card-cat-v2[\s\S]{0,400}?href="([^"]+)"[\s\S]{0,200}?card-cat-v2__title[^>]*>([\s\S]*?)<[\s\S]{0,200}?card-cat-v2__count[^>]*>([\s\S]*?)</gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = absUrl(m[1]);
    const title = m[2].replace(/<[^>]+>/g, '').trim();
    const count = m[3].replace(/<[^>]+>/g, '').trim();
    if (!href || !title) continue;
    classes.push({
      type_id: href,
      type_name: count ? title + '(' + count + ')' : title,
    });
  }
  return classes;
}

function parseVideoItems(html) {
  const list = [];
  const seen = {};

  // 优先: h4 > a[href*=/v/]
  try {
    if (typeof load === 'function') {
      const $ = load(html);
      $('h4 a, .item h4 a, .card-video a').each((_, el) => {
        let href = $(el).attr('href') || '';
        let title = ($(el).text() || $(el).attr('title') || '').trim();
        if (!href || href.indexOf('/v/') < 0) return;
        href = absUrl(href);
        if (seen[href]) return;
        // 封面：同卡片里的 img
        let cover = '';
        let duration = '';
        try {
          const $item = $(el).closest('.item, .card-video, article, div');
          cover = $item.find('img').attr('data-src')
            || $item.find('img').attr('src')
            || '';
          duration = ($item.find('.card-video__duration, .duration').text() || '').trim();
        } catch (e2) {}
        if (!title) return;
        seen[href] = 1;
        list.push({
          vod_id: href,
          vod_name: title,
          vod_pic: absUrl(cover),
          vod_remarks: duration,
        });
      });
    }
  } catch (e) {}

  if (list.length > 0) return list;

  // regex: /v/slug/
  const re = /<h4[^>]*>\s*<a[^>]+href="(https?:\/\/[^"]*?\/v\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = absUrl(m[1]);
    const title = m[2].replace(/<[^>]+>/g, '').trim();
    if (!href || !title || seen[href]) continue;
    seen[href] = 1;
    // 向前找封面
    const start = Math.max(0, m.index - 800);
    const chunk = html.substring(start, m.index);
    const coverM = chunk.match(/data-src="([^"]+)"/i) || chunk.match(/src="(https?:\/\/[^"]+(?:jpg|jpeg|png|webp)[^"]*)"/i);
    const durM = chunk.match(/card-video__duration[^>]*>([\s\S]*?)</i);
    list.push({
      vod_id: href,
      vod_name: title,
      vod_pic: absUrl(coverM ? coverM[1] : ''),
      vod_remarks: durM ? durM[1].replace(/<[^>]+>/g, '').trim() : '',
    });
  }
  return list;
}

async function init(cfg) {
  siteKey = (cfg && cfg.skey) || '';
  siteType = (cfg && cfg.stype) || 0;
  cachedClasses = null;
}

async function home(filter) {
  try {
    if (cachedClasses && cachedClasses.length) {
      return JSON.stringify({ class: cachedClasses, filters: {} });
    }
    const html = httpGet(HOST + '/categories/', { 'Referer': HOST + '/pp1/' });
    let classes = parseCategories(html);
    if (classes.length === 0) {
      classes = [
        { type_id: HOST + '/pp1/', type_name: '最新' },
        { type_id: HOST + '/pp1/hot/', type_name: '最热' },
        { type_id: HOST + '/categories/taiwan/', type_name: '台湾' },
        { type_id: HOST + '/categories/korea/', type_name: '韩国' },
      ];
    } else {
      // 头部加最新
      classes.unshift({ type_id: HOST + '/pp1/', type_name: '最新' });
    }
    cachedClasses = classes;
    return JSON.stringify({ class: classes, filters: {} });
  } catch (e) {
    return JSON.stringify({
      class: [{ type_id: HOST + '/pp1/', type_name: '最新' }],
      filters: {},
    });
  }
}

async function homeVod() {
  try {
    const html = httpGet(HOST + '/pp1/');
    const list = parseVideoItems(html);
    return JSON.stringify({ list: list.slice(0, 24) });
  } catch (e) {
    return JSON.stringify({ list: [] });
  }
}

async function category(tid, pg, filter, extend) {
  try {
    const page = parseInt(pg) || 1;
    let base = absUrl(tid || (HOST + '/pp1/'));
    const qIdx = base.indexOf('?');
    if (qIdx > 0) base = base.substring(0, qIdx);
    if (base.charAt(base.length - 1) !== '/') base = base + '/';

    // KVS async 分页
    let url = base + '?mode=async&function=get_block&block_id=list_videos_common_videos_list&sort_by=post_date&from=' + page;
    let html = httpGet(url, {
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': base,
    });
    if (!html || html.length < 80 || html.indexOf('/v/') < 0) {
      // 普通页：第1页 base，第n页 base + n + /
      const normal = page > 1 ? base + page + '/' : base;
      html = httpGet(normal, { 'Referer': HOST + '/pp1/' });
    }
    const list = parseVideoItems(html);
    return JSON.stringify({
      page: page,
      pagecount: list.length >= 10 ? page + 1 : page,
      limit: 24,
      total: 999999,
      list: list,
    });
  } catch (e) {
    return JSON.stringify({
      page: 1, pagecount: 1, limit: 20, total: 0, list: [],
    });
  }
}

async function detail(id) {
  try {
    const url = absUrl(id);
    const html = httpGet(url, { 'Referer': HOST + '/pp1/' });

    let title = '';
    let m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (m) title = m[1].replace(/<[^>]+>/g, '').trim();
    if (!title) {
      m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (m) title = m[1].replace(/<[^>]+>/g, '').trim().replace(/\s*[|\-].*$/, '');
    }

    let pic = '';
    m = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/poster=["']([^"']+)["']/i);
    if (m) pic = m[1];

    const m3u8 = extractM3u8(html);
    // 详情里就给出直链；若抽不到，play 时再解一次
    return JSON.stringify({
      list: [{
        vod_id: url,
        vod_name: title || 'pppPorn',
        vod_pic: pic,
        vod_content: '',
        vod_play_from: '默认分组',
        vod_play_url: '播放$' + (m3u8 || url),
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

    // 已是有效 m3u8（排除假预览）
    if (/\.m3u8/i.test(playUrl)
      && !/\.m3u8\.jpg/i.test(playUrl)
      && playUrl.indexOf('preview') < 0
      && playUrl.indexOf('videos_screenshots') < 0) {
      return JSON.stringify({
        parse: 0,
        jx: 0,
        url: playUrl,
        header: {
          'User-Agent': UA,
          'Referer': HOST + '/',
          'Origin': HOST,
        },
      });
    }

    // 假地址或详情页：重新抓
    const pageUrl = absUrl(playUrl);
    const html = httpGet(pageUrl, { 'Referer': HOST + '/pp1/' });
    const m3u8 = extractM3u8(html);
    if (m3u8) {
      return JSON.stringify({
        parse: 0,
        jx: 0,
        url: m3u8,
        header: {
          'User-Agent': UA,
          'Referer': HOST + '/',
          'Origin': HOST,
        },
      });
    }

    // 嗅探兜底（不要把 preview 图当 url）
    return JSON.stringify({
      parse: 1,
      jx: 0,
      url: pageUrl,
      header: {
        'User-Agent': UA,
        'Referer': HOST + '/',
      },
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
    const text = encodeURIComponent(wd || '');
    let url = HOST + '/search/' + text + '/?mode=async&function=get_block&block_id=list_videos_videos_list_search_result&q=' + text + '&category_ids=&sort_by=&from_videos=' + page + '&from_albums=' + page;
    let html = httpGet(url, {
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': HOST + '/search/' + text + '/',
    });
    if (!html || html.indexOf('/v/') < 0) {
      html = httpGet(HOST + '/search/' + text + '/', { 'Referer': HOST + '/pp1/' });
    }
    const list = parseVideoItems(html);
    return JSON.stringify({
      page: page,
      pagecount: list.length >= 10 ? page + 1 : page,
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
