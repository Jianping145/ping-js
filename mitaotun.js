/**
 * 蜜桃臀 - 蜂蜜影视 CatVod JS Spider
 * 站点: https://mitaotunbbx.xyz
 */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const HOST = 'https://mitaotunbbx.xyz';

const CATEGORIES = {
  guochan: { id: 'ff80808172b90a110172b90dca6c0013', name: '国产情色' },
  ripen: { id: 'ff80808172b90a110172b90dca830017', name: '日本无码' },
  riyou: { id: 'ff80808172b90a110172b90dca8d001b', name: '日本有码' },
  zhongwen: { id: 'ff80808172b90a110172b90dca97001e', name: '中文精品' },
  wanghong: { id: 'ff80808172b90a110172b90dcaa00021', name: '网红主播' },
  chengren: { id: 'ff80808172b90a110172b90dcaaa0024', name: '成人动漫' },
  oumei: { id: 'ff80808172b90a110172b90dcab30027', name: '欧美情色' },
  guomosi: { id: 'ff80808172b90a110172b90dcabb002a', name: '国模私拍' },
  changtui: { id: 'ff80808172b90a110172b90dcac7002d', name: '长腿丝袜' },
  linjia: { id: 'ff80808172b90a110172b90dcace0030', name: '邻家人妻' },
  jingpin: { id: 'ff80808172b90a110172b90dcae80038', name: '精品推荐' },
  wuma: { id: '20230202101612431', name: '无码热门' },
  madou: { id: '20230202101613064', name: '麻豆专区' },
};

const HEADERS = {
  'User-Agent': UA,
  'Referer': HOST + '/',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

let siteKey = '';
let siteType = 0;

function httpGet(url) {
  let html = '';
  try {
    const res = req(url, {
      method: 'get',
      headers: HEADERS,
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
        html = request(url, { headers: HEADERS });
      }
    } catch (e2) {}
  }
  return html || '';
}

function parseListCheerio(html) {
  const list = [];
  try {
    if (typeof load !== 'function') return list;
    const $ = load(html);
    $('li.col-md-2').each((_, el) => {
      const $el = $(el);
      const $a = $el.find('a.video-pic');
      let href = $a.attr('href') || '';
      const style = $a.attr('style') || '';
      let title = $el.find('.title h5 a').first().attr('title')
        || ($el.find('.title h5 a').first().text() || '').trim();
      let pic = '';
      const pm = style.match(/url\(['"]?([^'")]+)['"]?\)/i);
      if (pm) pic = pm[1];
      const idm = href.match(/\/detail\/(\d+)\.html/);
      const detailId = idm ? idm[1] : '';
      if (!detailId || !title) return;
      if (pic && pic.indexOf('//') === 0) pic = 'https:' + pic;
      else if (pic && pic.indexOf('http') !== 0) pic = HOST + pic;
      list.push({
        vod_id: detailId,
        vod_name: title.trim(),
        vod_pic: pic,
        vod_remarks: '',
      });
    });
  } catch (e) {}
  return list;
}

function parseListRegex(html) {
  const list = [];
  const itemRe = /<li[^>]*class="[^"]*col-md-2[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = itemRe.exec(html)) !== null) {
    const block = m[1];
    const hrefM = block.match(/href="(\/detail\/\d+\.html)"/i)
      || block.match(/href="([^"]*detail[^"]*\.html)"/i);
    const titleM = block.match(/title="([^"]+)"/i)
      || block.match(/<h5[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
    const picM = block.match(/url\(['"]?([^'")]+)['"]?\)/i);
    if (!hrefM) continue;
    const idm = hrefM[1].match(/\/detail\/(\d+)\.html/);
    const detailId = idm ? idm[1] : '';
    let title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : '';
    let pic = picM ? picM[1] : '';
    if (!detailId || !title) continue;
    if (pic && pic.indexOf('//') === 0) pic = 'https:' + pic;
    else if (pic && pic.indexOf('http') !== 0) pic = HOST + pic;
    list.push({
      vod_id: detailId,
      vod_name: title,
      vod_pic: pic,
      vod_remarks: '',
    });
  }
  return list;
}

function parseList(html) {
  if (!html || html.length < 50) return [];
  let list = parseListCheerio(html);
  if (list.length === 0) list = parseListRegex(html);
  return list;
}

function tip(msg) {
  return {
    vod_id: 'tip',
    vod_name: msg,
    vod_pic: '',
    vod_remarks: '提示',
  };
}

function listUrl(tid, pg) {
  const cat = CATEGORIES[tid];
  if (!cat) return '';
  const page = parseInt(pg) || 1;
  if (page <= 1) return HOST + '/list/' + cat.id + '.html';
  return HOST + '/list/' + cat.id + '/' + page + '.html';
}

async function init(cfg) {
  siteKey = (cfg && cfg.skey) || '';
  siteType = (cfg && cfg.stype) || 0;
}

async function home(filter) {
  const classes = [];
  const keys = Object.keys(CATEGORIES);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    classes.push({ type_id: k, type_name: CATEGORIES[k].name });
  }
  return JSON.stringify({ class: classes, filters: {} });
}

async function homeVod() {
  try {
    const url = listUrl('jingpin', 1) || listUrl('guochan', 1);
    const html = httpGet(url);
    const list = parseList(html);
    if (list.length === 0) {
      return JSON.stringify({ list: [tip('首页无数据，站点可能无法访问')] });
    }
    return JSON.stringify({ list: list.slice(0, 24) });
  } catch (e) {
    return JSON.stringify({ list: [tip('首页失败')] });
  }
}

async function category(tid, pg, filter, extend) {
  try {
    const page = parseInt(pg) || 1;
    const url = listUrl(tid, page);
    if (!url) {
      return JSON.stringify({
        page: 1, pagecount: 1, limit: 20, total: 0,
        list: [tip('未知分类')],
      });
    }
    const html = httpGet(url);
    if (!html || html.length < 50) {
      return JSON.stringify({
        page, pagecount: 1, limit: 20, total: 0,
        list: [tip('请求返回空')],
      });
    }
    const list = parseList(html);
    if (list.length === 0) {
      const snip = html.replace(/\s+/g, ' ').slice(0, 80);
      return JSON.stringify({
        page, pagecount: 1, limit: 20, total: 0,
        list: [tip('解析0条 | ' + snip)],
      });
    }
    return JSON.stringify({
      page,
      pagecount: list.length >= 8 ? page + 1 : page,
      limit: 24,
      total: 999999,
      list,
    });
  } catch (e) {
    return JSON.stringify({
      page: 1, pagecount: 1, limit: 20, total: 0,
      list: [tip('分类异常: ' + String(e).slice(0, 60))],
    });
  }
}

async function detail(id) {
  try {
    const detailId = String(id).replace(/.*detail\//, '').replace(/\.html.*/, '');
    const url = HOST + '/detail/' + detailId + '.html';
    const html = httpGet(url);

    let title = '';
    let m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
      || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (m) title = m[1].replace(/<[^>]+>/g, '').trim().replace(/\s*[-|_].*$/, '');

    let pic = '';
    m = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (m) pic = m[1];

    // 播放线路：button.button a
    const playNames = [];
    const playUrls = [];
    const btnRe = /<button[^>]*class="[^"]*button[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let bm;
    while ((bm = btnRe.exec(html)) !== null) {
      let href = bm[1];
      let name = bm[2].replace(/<[^>]+>/g, '').trim() || '播放';
      if (!href) continue;
      if (href.indexOf('http') !== 0) href = HOST + href;
      playNames.push(name);
      playUrls.push(href);
    }

    // cheerio 兜底
    if (playUrls.length === 0 && typeof load === 'function') {
      try {
        const $ = load(html);
        $('button.button a').each((_, el) => {
          let href = $(el).attr('href') || '';
          let name = ($(el).text() || '').trim() || '播放';
          if (!href) return;
          if (href.indexOf('http') !== 0) href = HOST + href;
          playNames.push(name);
          playUrls.push(href);
        });
      } catch (e) {}
    }

    if (playUrls.length === 0) {
      playNames.push('播放');
      playUrls.push(HOST + '/vodplay/' + detailId + '.html');
    }

    // vod_play_url: name$url#name2$url2  多线路用 $$$
    // 这里每条线路只有一集
    const fromParts = [];
    const urlParts = [];
    for (let i = 0; i < playUrls.length; i++) {
      fromParts.push(playNames[i] || ('线路' + (i + 1)));
      urlParts.push('正片$' + playUrls[i]);
    }

    return JSON.stringify({
      list: [{
        vod_id: detailId,
        vod_name: title || '蜜桃臀',
        vod_pic: pic,
        vod_content: '',
        vod_play_from: fromParts.join('$$$'),
        vod_play_url: urlParts.join('$$$'),
      }],
    });
  } catch (e) {
    return JSON.stringify({
      list: [{
        vod_id: id,
        vod_name: '详情失败',
        vod_pic: '',
        vod_content: String(e),
        vod_play_from: '播放',
        vod_play_url: '正片$',
      }],
    });
  }
}

async function play(flag, id, flags) {
  try {
    // id 可能是播放页 URL 或直链
    let playPage = id || '';
    if (playPage.indexOf('.m3u8') !== -1 || playPage.indexOf('.mp4') !== -1) {
      return JSON.stringify({
        parse: 0,
        jx: 0,
        url: playPage,
        header: HEADERS,
      });
    }

    if (playPage.indexOf('http') !== 0) {
      playPage = HOST + playPage;
    }

    const html = httpGet(playPage);

    // var playUrl = '...'
    let m = html.match(/var\s+playUrl\s*=\s*['"]([^'"]+)['"]/i);
    if (m && m[1]) {
      return JSON.stringify({
        parse: 0,
        jx: 0,
        url: m[1],
        header: HEADERS,
      });
    }

    m = html.match(/https?:\/\/[^'"\s<>]+?\.m3u8[^'"\s<>]*/i);
    if (m) {
      return JSON.stringify({
        parse: 0,
        jx: 0,
        url: m[0],
        header: HEADERS,
      });
    }

    m = html.match(/https?:\/\/[^'"\s<>]+?\.mp4[^'"\s<>]*/i);
    if (m) {
      return JSON.stringify({
        parse: 0,
        jx: 0,
        url: m[0],
        header: HEADERS,
      });
    }

    // 嗅探兜底
    return JSON.stringify({
      parse: 1,
      jx: 0,
      url: playPage,
      header: HEADERS,
    });
  } catch (e) {
    return JSON.stringify({
      parse: 0,
      jx: 0,
      url: id,
      header: HEADERS,
    });
  }
}

async function search(wd, quick, pg) {
  try {
    const keyword = wd || '';
    if (!keyword) return JSON.stringify({ list: [] });
    const url = HOST + '/search/' + encodeURIComponent(keyword) + '.html';
    const html = httpGet(url);
    const list = parseList(html);
    return JSON.stringify({
      page: 1,
      pagecount: 1,
      list,
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
