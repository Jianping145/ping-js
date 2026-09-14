/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '18av',
  '类型': '影视',
  mergeList: true,
  more: {
    mergeList: 1
  },
  logo: 'https://18av.mm-cg.com/favicon.ico',
  lang: 'ds'
})
*/

var rule = {
    title: '18av',
    logo: 'https://mjv012.com/favicon.ico',
    host: 'https://mjv012.com',
    homeUrl: '/zh/',
    // 多分类支持：使用 fyclass 占位符替换分类路径
    url: '/zh/fyclass/all/fypage.html',
    searchUrl: '/zh/fc_search/all/**/fypage.html',
    searchable: 2,
    quickSearch: 0,
    // 分类名称与对应的路径片段
    class_name: '中文字幕&有碼AV&無碼AV&素人AV&無碼破解&H動畫&國產自拍',
    class_url: 'chinese_list&censored_list&uncensored_list&amateurjav_list&reducing-mosaic_list&animation_list&dt_list',
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4.1 Mobile/15E148 Safari/604.1',
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cookie': 'YES_Eighteen=IamOverEighteenYearsOld;PHPSESSID=ti945stmtto483t5t6ur8nj0t1'   // ⚠️ 务必替换！
    },
    timeout: 10000,
    play_parse: false,
    lazy: '',
    limit: 6,
    推荐: '.post;h3 a&&Text;img&&src;.meta&&Text;h3 a&&href',
    double: false,
    一级: '.post;h3 a&&Text;img&&src;.meta&&Text;h3 a&&href',
    二级: async function(ids) {
        let idStr = Array.isArray(ids) ? ids[0] : ids;
        if (idStr && typeof idStr !== 'string') idStr = String(idStr);
        if (!idStr) return { vod_id: '', vod_play_from: '', vod_play_url: '' };

        const atIndex = idStr.lastIndexOf('@');
        const detailId = atIndex > -1 ? idStr.substring(0, atIndex) : idStr;
        const url = detailId.startsWith('http') ? detailId : this.host + detailId;

        let html;
        try {
            html = await request(url, { headers: this.headers });
        } catch (e) {
            return { vod_id: idStr, vod_play_from: '', vod_play_url: '' };
        }

        // 提取预览视频（data-src）
        const playUrlList = [];
        const playFromList = [];
        let $ = cheerio.load(html);
        $('video[data-src]').each((i, el) => {
            let src = $(el).attr('data-src');
            if (src && src.startsWith('http')) {
                playUrlList.push(src);
                playFromList.push(`预览${i + 1}`);
            }
        });

        if (playUrlList.length > 0) {
            return {
                vod_id: idStr,
                vod_play_from: playFromList.join('$$$'),
                vod_play_url: playUrlList.join('$$$')
            };
        }
        return { vod_id: idStr, vod_play_from: '', vod_play_url: '' };
    },
    搜索: '*'
};