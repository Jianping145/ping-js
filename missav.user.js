// ==UserScript==
// @name         MissAV
// @namespace    gmspider
// @version      2025.09.20
// @description  MissAV GMSpider (修复分页加载问题)
// @author       Luomo (fixed pagination by AI)
// @match        https://missav.*/*
// @match        https://*.missav.*/*
// @require      https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.slim.min.js
// @grant        unsafeWindow
// ==/UserScript==
console.log(JSON.stringify(GM_info));
(function () {
    const GMSpiderArgs = {};
    if (typeof GmSpiderInject !== 'undefined') {
        let args = JSON.parse(GmSpiderInject.GetSpiderArgs());
        GMSpiderArgs.fName = args.shift();
        GMSpiderArgs.fArgs = args;
    } else {
        GMSpiderArgs.fName = "homeContent";
        GMSpiderArgs.fArgs = [true];
    }
    Object.freeze(GMSpiderArgs);

    // ---------------- 工具 ----------------

    // 从 URL 提取 slug - 处理带前缀的路径
    function getCategoryFromUrl(url) {
        if (!url) return '';
        // 移除域名和查询参数
        const path = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
        // 提取 /cn/ 后面的部分
        const match = path.match(/\/cn\/(.+)/);
        if (match) return match[1];
        // 如果没有 /cn/，取最后两段（处理 /dm278/xxx 这种情况）
        const parts = path.split('/').filter(Boolean);
        return parts.slice(-2).join('/') || parts.pop() || '';
    }

    // 解析视频列表项
    function parseItems($boxes) {
        const list = [];
        const seen = new Set();

        $boxes.each(function () {
            const $box = $(this);
            const $a = $box.find("a[href*='/cn/']").first();
            if ($a.length === 0) return;

            const href = $a.attr("href");
            if (!href) return;

            const slug = getCategoryFromUrl(href);
            if (!slug || seen.has(slug)) return;

            // 过滤分类页
            if (slug.includes('actresses') || slug.includes('makers') || 
                slug.includes('genres') || slug.includes('search')) {
                return;
            }

            // 提取标题
            const title = $box.find(".text-secondary, .title, h3, h4, [class*='title']").first().text().trim() ||
                         $box.find("img[alt]").attr("alt") || "";

            // 提取图片
            const $img = $box.find("img").first();
            const pic = $img.data("src") || $img.data("original") || $img.attr("src") || "";

            // 提取时长
            const duration = $box.find(".absolute, .duration, [class*='duration'], .badge").first().text().trim();

            if (title) {
                seen.add(slug);
                list.push({
                    vod_id: slug, 
                    vod_name: title, 
                    vod_pic: pic, 
                    vod_year: duration,
                    vod_remarks: duration
                });
            }
        });
        return list;
    }

    // 获取总页数 - 关键修复
    function getPageCount() {
        let maxPage = 1;

        // 方法1: 从分页链接找最大页码
        $('.pagination a, [class*="pagination"] a, .page-link, [class*="page"] a').each(function() {
            const text = $(this).text().trim();
            const num = parseInt(text);
            if (!isNaN(num) && num > maxPage) {
                maxPage = num;
            }
            // 也检查 href 中的 page 参数
            const href = $(this).attr('href') || '';
            const match = href.match(/[?&]page=(\d+)/);
            if (match) {
                const pageNum = parseInt(match[1]);
                if (pageNum > maxPage) maxPage = pageNum;
            }
        });

        if (maxPage > 1) {
            console.log("Found max page from pagination:", maxPage);
            return maxPage;
        }

        // 方法2: 检查"下一页"链接
        const $nextBtn = $('a:contains("下一页"), a:contains("Next"), a[rel="next"], .pagination .next a');
        if ($nextBtn.length > 0) {
            const href = $nextBtn.attr('href') || '';
            const match = href.match(/[?&]page=(\d+)/);
            if (match) {
                console.log("Found next page:", match[1]);
                return parseInt(match[1]) + 1;
            }
            // 如果有下一页按钮但没有页码，假设还有很多页
            console.log("Has next button, assuming multiple pages");
            return 999; // 返回一个大数字，让播放器继续尝试
        }

        // 方法3: 从页面文本提取
        const pageText = $('body').text().match(/(\d+)\s*页/);
        if (pageText) {
            console.log("Found page count from text:", pageText[1]);
            return parseInt(pageText[1]);
        }

        // 方法4: 如果当前页有内容，假设至少还有几页
        const currentItems = $('.gap-5 .thumbnail, .video-item, [class*="thumbnail"], [class*="video-item"]').length;
        if (currentItems >= 20) {
            console.log("Current page has many items, assuming more pages");
            return 999;
        }

        console.log("No pagination found, returning 1");
        return 1;
    }

    // 查找视频容器
    function findVideoBoxes() {
        const selectors = [
            ".gap-5 .thumbnail",
            ".video-item", 
            ".card-video",
            ".thumbnail-item",
            "[class*='thumbnail']",
            "[class*='video-item']",
            "[class*='card']"
        ];

        for (let sel of selectors) {
            const $boxes = $(sel);
            if ($boxes.length > 0) {
                console.log("Found boxes with selector:", sel, "count:", $boxes.length);
                return $boxes;
            }
        }

        // 兜底：基于链接找
        console.log("Using fallback link-based selector");
        return $("a[href*='/cn/']").closest('div[class], article, li');
    }

    // ---------------- Spider ----------------
    const GmSpider = {
        homeContent: function (filter) {
            const defaultFilter = [
                {
                    key: "filter", name: "过滤", value: [
                        {n: "所有", v: ""},
                        {n: "单人作品", v: "&filters=individual"},
                        {n: "多人作品", v: "&filters=multiple"},
                        {n: "中文字幕", v: "&filters=chinese-subtitle"}
                    ]
                },
                {
                    key: "sort", name: "排序方式", value: [
                        {n: "发行日期", v: "&sort=released_at"},
                        {n: "最近更新", v: "&sort=published_at"},
                        {n: "收藏数", v: "&sort=saved"},
                        {n: "今日浏览数", v: "&sort=today_views"},
                        {n: "本周浏览数", v: "&sort=weekly_views"},
                        {n: "本月浏览数", v: "&sort=monthly_views"},
                        {n: "总浏览数", v: "&sort=views"}
                    ]
                }
            ];

            const result = {
                class: [
                    {type_id: "new", type_name: "所有影片"},
                    {type_id: "madou", type_name: "麻豆传媒"},
                    {type_id: "chinese-subtitle", type_name: "中文字幕"},
                    {type_id: "uncensored-leak", type_name: "无码流出"},
                    {type_id: "actresses", type_name: "热门女优"},
                    {type_id: "makers", type_name: "发行商"},
                    {type_id: "genres", type_name: "类型"},
                ],
                filters: {
                    "new": defaultFilter,
                    "madou": defaultFilter,
                    "chinese-subtitle": defaultFilter,
                    "uncensored-leak": defaultFilter,
                    "actresses": defaultFilter,
                    "makers": defaultFilter,
                    "genres": defaultFilter
                },
                list: []
            };

            const $boxes = findVideoBoxes();
            result.list = parseItems($boxes);

            console.log("HomeContent result:", result.list.length, "items");
            return result;
        },

        categoryContent: function (tid, pg, filter, extend) {
            console.log("categoryContent called:", {tid, pg, filter, extend});
            const result = {list: [], pagecount: 1};

            if (tid === "actresses" || tid === "actresses/ranking") {
                // 女优列表
                const $items = $("a[href*='/actresses/']").closest('div, li');
                $items.each(function () {
                    const $a = $(this).find("a[href*='/actresses/']").first();
                    const href = $a.attr("href");
                    if (!href) return;
                    const slug = getCategoryFromUrl(href);
                    if (!slug) return;

                    result.list.push({
                        vod_id: slug,
                        vod_name: $a.text().trim() || $(this).find(".truncate, .name, .title").first().text().trim(),
                        vod_pic: $(this).find("img").attr("src") || $(this).find("img").data("src") || "",
                        vod_remarks: $(this).find(".text-sm, .count, .badge").first().text().trim(),
                        vod_tag: "folder",
                        style: {type: "rect", ratio: 1}
                    });
                });
                // 去重
                result.list = result.list.filter((v, i, a) => a.findIndex(t => t.vod_id === v.vod_id) === i);
                result.pagecount = getPageCount();

            } else if (tid === "makers" || tid === "genres") {
                // 发行商/类型目录
                const selector = tid === "makers" ? "a[href*='/makers/']" : "a[href*='/genres/']";
                $(selector).each(function () {
                    const href = $(this).attr("href");
                    if (!href) return;
                    const slug = getCategoryFromUrl(href);
                    if (!slug) return;

                    result.list.push({
                        vod_id: slug,
                        vod_name: $(this).text().trim(),
                        vod_remarks: tid === "makers" ? "发行商" : "类型",
                        vod_tag: "folder",
                        style: {type: "rect", ratio: 2}
                    });
                });
                result.list = result.list.filter((v, i, a) => a.findIndex(t => t.vod_id === v.vod_id) === i);
                result.pagecount = getPageCount();

            } else {
                // 普通视频列表
                const $boxes = findVideoBoxes();
                result.list = parseItems($boxes);
                result.pagecount = getPageCount();
            }

            console.log("categoryContent result:", result.list.length, "items, pagecount:", result.pagecount);
            return result;
        },

        detailContent: function (ids) {
            const slug = ids[0];
            console.log("detailContent for:", slug);

            const detail = {};

            // 解析详情
            $(".space-y-2 .text-secondary, .detail-item, .meta-item").each(function () {
                const $item = $(this);
                const key = $item.find("span:first, dt").first().text().replace(":", "").trim();
                if (!key) return;

                const $links = $item.find("a");
                if ($links.length === 0) {
                    const $clone = $item.clone();
                    $clone.find("span:first, dt").first().remove();
                    detail[key] = $clone.text().trim();
                } else {
                    detail[key] = [];
                    $links.each(function () {
                        const id = getCategoryFromUrl($(this).attr("href"));
                        const name = $(this).text().trim();
                        if (id && name) {
                            detail[key].push(`[a=cr:{"id":"${id}","name":"${name}"}/]${name}[/a]`);
                        }
                    });
                }
            });

            const format = (keys) => keys.map(k => detail[k]).filter(Boolean).join(" ");

            // 获取播放地址
            let playUrl = "";
            if (typeof hls !== "undefined" && hls.url) {
                playUrl = "多视轨$" + hls.url;
            } else {
                const html = document.documentElement.innerHTML;
                const m3u8Match = html.match(/https?:\/\/[^"\s]+\.m3u8[^"\s]*/);
                if (m3u8Match) playUrl = "多视轨$" + m3u8Match[0];
            }

            const vod = {
                vod_id: slug,
                vod_name: slug.toUpperCase(),
                vod_pic: $("meta[property='og:image']").attr("content") || "",
                vod_year: $(".space-y-2 time, .release-date, [class*='date']").first().text().trim(),
                vod_remarks: format(["类型", "标签"]),
                vod_actor: format(["女优", "演员"]),
                vod_content: $("meta[name=description]").attr("content") || "",
                vod_play_from: "MissAV",
                vod_play_url: playUrl
            };

            console.log("detailContent result:", vod);
            return {list: [vod]};
        },

        searchContent: function (key, quick, pg) {
            console.log("searchContent:", {key, quick, pg});

            const result = {
                list: parseItems(findVideoBoxes()),
                pagecount: getPageCount()
            };

            console.log("searchContent result:", result.list.length, "items");
            return result;
        }
    };

    $(document).ready(function () {
        if ($("#cf-wrapper").length > 0 || $("title").text().includes("Just a moment")) {
            console.log("源站不可用:" + $('title').text());
            if (typeof GM_toastLong === "function") GM_toastLong("源站不可用:" + $('title').text());
        } else {
            try {
                const result = GmSpider[GMSpiderArgs.fName](...GMSpiderArgs.fArgs);
                if (typeof GmSpiderInject !== 'undefined') {
                    GmSpiderInject.SetSpiderResult(JSON.stringify(result));
                }
                console.log("Final result:", result);
            } catch (e) {
                console.error("Spider error:", e);
                if (typeof GM_toastLong === "function") GM_toastLong("解析错误: " + e.message);
            }
        }
    });
})();
