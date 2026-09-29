var rule = {
    title: '有爱爱',
    host: 'https://www.uaa.com',
    // fyclass 为分类标识，fypage 为页码
    url: '/fyclass',
    searchUrl: '/video/list?searchType=1&keyword=**&page=fypage',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
    },
    timeout: 15000,
    class_name: '国产视频&日本AV&无码流出&H动漫',
    class_url: 'chinese-av-porn|1&jav|1&无码流出|2&3',
    play_parse: true,
    lazy: $js.toString(() => {
        input = {
            parse: 0,
            jx: 0,
            url: input,
            header: rule.headers
        };
        input.header['Referer'] = 'https://www.uaa.com/';
        input.header['Origin'] = 'https://www.uaa.com';
    }),
    // 分类页链接动态拼接（对齐原 getCards 逻辑）
    一级: $js.toString(() => {
        let d = [];
        let html = '';
        // MYTYPE 形如 chinese-av-porn|1  或  无码流出|2  或  3
        let parts = MYTYPE.split('|');
        let page = MYPAGE || 1;
        let url = HOST;

        if (parts.length === 2 && !/^\d+$/.test(parts[0])) {
            // tip 模式：/chinese-av-porn  或  /jav
            let tip = parts[0];
            let origin = parts[1];
            url += '/' + tip;
            if (page > 1) {
                url += '?origin=' + origin + '&sort=1&page=' + page;
            }
        } else if (parts.length === 2) {
            // category + origin：无码流出
            let category = parts[0];
            let origin = parts[1];
            url += '/video/list?category=' + encodeURIComponent(category) + '&origin=' + origin;
            if (page > 1) {
                url += '&sort=1&page=' + page;
            }
        } else {
            // 仅 origin：H动漫 origin=3
            let origin = parts[0];
            url += '/video/list?origin=' + origin;
            if (page > 1) {
                url += '&sort=1&page=' + page;
            }
        }

        html = request(url);
        let list = pdfa(html, 'li.video_li');
        list.forEach(it => {
            let href = pdfh(it, '.title a&&href');
            let title = pdfh(it, '.title a&&Text');
            let cover = pdfh(it, '.cover&&src') || pdfh(it, '.cover&&data-cfsrc');
            let pubdate = pdfh(it, 'span&&Text');
            if (href && !href.startsWith('http')) {
                href = HOST + href;
            }
            d.push({
                title: title,
                img: cover,
                desc: pubdate,
                url: href
            });
        });
        setResult(d);
    }),
    二级: $js.toString(() => {
        let html = request(input);
        let playUrl = pdfh(html, '#mui-player&&src') || '';
        let title = pdfh(html, 'h1&&Text') || pdfh(html, 'title&&Text') || '有爱爱';
        let pic = pdfh(html, '.cover&&src') || pdfh(html, 'img&&src') || '';
        VOD = {
            vod_id: input,
            vod_name: title,
            vod_pic: pic,
            vod_content: '',
            vod_play_from: '默认分组',
            vod_play_url: '播放$' + playUrl
        };
    }),
    搜索: $js.toString(() => {
        let d = [];
        let page = MYPAGE || 1;
        let key = KEY;
        let url = HOST + '/video/list?searchType=1&keyword=' + encodeURIComponent(key);
        if (page > 1) {
            url = HOST + '/video/list?keyword=' + encodeURIComponent(key) + '&category=&origin=&tag=&sort=0&page=' + page;
        }
        let html = request(url);
        let list = pdfa(html, 'li.video_li');
        list.forEach(it => {
            let href = pdfh(it, '.title a&&href');
            let title = pdfh(it, '.title a&&Text');
            let cover = pdfh(it, '.cover&&src') || pdfh(it, '.cover&&data-cfsrc');
            let pubdate = pdfh(it, 'span&&Text');
            if (href && !href.startsWith('http')) {
                href = HOST + href;
            }
            d.push({
                title: title,
                img: cover,
                desc: pubdate,
                url: href
            });
        });
        setResult(d);
    }),
};