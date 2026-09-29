var rule = {
    title: '有爱爱',
    host: 'https://www.uaa.com',
    url: '/fyclass-fypage',
    searchUrl: '/video/list?searchType=1&keyword=**&page=fypage',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
        'Referer': 'https://www.uaa.com/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    },
    timeout: 15000,
    class_name: '国产视频&日本AV&无码流出&H动漫',
    class_url: 'chinese-av-porn&jav&wuma&hdongman',
    play_parse: true,
    lazy: $js.toString(() => {
        input = {
            parse: 0,
            jx: 0,
            url: input,
            header: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
                'Referer': 'https://www.uaa.com/',
                'Origin': 'https://www.uaa.com'
            }
        };
    }),
    一级: $js.toString(() => {
        let d = [];
        try {
            // input 形如 https://www.uaa.com/chinese-av-porn-1
            let path = (input || '').replace(HOST, '').replace(/^\//, '');
            let m = path.match(/^([a-zA-Z0-9\u4e00-\u9fa5]+)-(\d+)$/);
            let cate = m ? m[1] : 'chinese-av-porn';
            let page = m ? parseInt(m[2]) : 1;
            if (isNaN(page) || page < 1) page = 1;

            let url = HOST;
            if (cate === 'chinese-av-porn' || cate === 'jav') {
                url += '/' + cate;
                if (page > 1) url += '?origin=1&sort=1&page=' + page;
            } else if (cate === 'wuma') {
                url += '/video/list?category=' + encodeURIComponent('无码流出') + '&origin=2';
                if (page > 1) url += '&sort=1&page=' + page;
            } else if (cate === 'hdongman') {
                url += '/video/list?origin=3';
                if (page > 1) url += '&sort=1&page=' + page;
            } else {
                url += '/' + cate;
                if (page > 1) url += '?sort=1&page=' + page;
            }

            let html = request(url);
            if (!html || html.length < 100) {
                setResult([]);
                return;
            }
            // Cloudflare 挑战页直接返回空
            if (html.indexOf('cf-mitigated') > -1 || html.indexOf('Just a moment') > -1 || html.indexOf('challenge-platform') > -1) {
                setResult([]);
                return;
            }

            let list = pdfa(html, 'li.video_li');
            if (!list || list.length === 0) {
                // 兼容其它可能的列表结构
                list = pdfa(html, '.video_li') || [];
            }
            list.forEach(it => {
                let href = pdfh(it, '.title a&&href') || pdfh(it, 'a&&href');
                let title = pdfh(it, '.title a&&Text') || pdfh(it, 'a&&Text');
                let cover = pdfh(it, '.cover&&src') || pdfh(it, '.cover&&data-cfsrc') || pdfh(it, 'img&&src') || pdfh(it, 'img&&data-src');
                let pubdate = pdfh(it, 'span&&Text') || '';
                if (!href) return;
                if (href.indexOf('http') !== 0) href = HOST + href;
                d.push({
                    title: (title || '').trim(),
                    img: cover || '',
                    desc: (pubdate || '').trim(),
                    url: href
                });
            });
        } catch (e) {
            // 避免整个 categoryContent 变成 {error: ...}
        }
        setResult(d);
    }),
    二级: $js.toString(() => {
        try {
            let html = request(input);
            let playUrl = pdfh(html, '#mui-player&&src') || pdfh(html, 'video&&src') || pdfh(html, 'source&&src') || '';
            // 尝试从页面脚本里抠 m3u8 / mp4
            if (!playUrl) {
                let m = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/);
                if (m) playUrl = m[0];
            }
            if (!playUrl) {
                let m2 = html.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/);
                if (m2) playUrl = m2[0];
            }
            let title = pdfh(html, 'h1&&Text') || pdfh(html, '.title&&Text') || pdfh(html, 'title&&Text') || '有爱爱';
            let pic = pdfh(html, '.cover&&src') || pdfh(html, 'img&&src') || '';
            VOD = {
                vod_id: input,
                vod_name: (title || '').trim().replace(/\s*-\s*有爱爱.*$/, ''),
                vod_pic: pic,
                vod_content: '',
                vod_play_from: '默认分组',
                vod_play_url: '播放$' + playUrl
            };
        } catch (e) {
            VOD = {
                vod_id: input,
                vod_name: '解析失败',
                vod_pic: '',
                vod_content: String(e),
                vod_play_from: '默认分组',
                vod_play_url: '播放$'
            };
        }
    }),
    搜索: $js.toString(() => {
        let d = [];
        try {
            let page = 1;
            try { page = parseInt(MYPG || MYPAGE || 1); } catch (e) {}
            if (isNaN(page) || page < 1) page = 1;
            let key = KEY || '';
            let url = HOST + '/video/list?searchType=1&keyword=' + encodeURIComponent(key);
            if (page > 1) {
                url = HOST + '/video/list?keyword=' + encodeURIComponent(key) + '&category=&origin=&tag=&sort=0&page=' + page;
            }
            let html = request(url);
            if (!html || html.indexOf('challenge-platform') > -1) {
                setResult([]);
                return;
            }
            let list = pdfa(html, 'li.video_li') || [];
            list.forEach(it => {
                let href = pdfh(it, '.title a&&href') || pdfh(it, 'a&&href');
                let title = pdfh(it, '.title a&&Text') || pdfh(it, 'a&&Text');
                let cover = pdfh(it, '.cover&&src') || pdfh(it, '.cover&&data-cfsrc') || pdfh(it, 'img&&src');
                let pubdate = pdfh(it, 'span&&Text') || '';
                if (!href) return;
                if (href.indexOf('http') !== 0) href = HOST + href;
                d.push({
                    title: (title || '').trim(),
                    img: cover || '',
                    desc: (pubdate || '').trim(),
                    url: href
                });
            });
        } catch (e) {}
        setResult(d);
    }),
};
