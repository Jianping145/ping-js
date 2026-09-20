// ==UserScript==
// @name         MissAV
// @namespace    gmspider
// @version      2025.09.20
// @description  MissAV GMSpider (修复版: 更新选择器, 增强兼容性)
// @author       Luomo (refactored by Minis, fixed by AI)
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
    function getCategoryFromUrl(url) {
        if (!url) return '';
        // 处理相对路径
        if (url.startsWith('/')) {
            return url.split('/').filter(Boolean).pop() || '';
        }
        // 处理绝对路径
        const match = url.match(/\/cn\/(.+)/);
        if (match) return match[1];
        return url.split('/').filter(Boolean).pop() || '';
    }

    function parseItems($boxes) {
        const list = [];
        $boxes.each(function () {
            const $box = $(this);
            const $a = $box.find("a").first();
            const href = $a.attr("href");
            if (!href) return;
            const slug = getCategoryFromUrl(href);

            // 尝试多种标题选择器
            const title = $box.find(".text-secondary, .title, h3, h4, .video-title, .card-title, [class*='title']").first().text().trim() ||
                $box.find("img").attr("alt") || "";

            // 尝试多种图片选择器
            const $img = $box.find("img").first();
            const pic = $img.data("src") || $img.data("original") || $img.attr("src") || 
                       $img.attr("data-lazy-src") || "";

            // 尝试多种时长/日期选择器
            const year = $box.find(".absolute, .duration, .year, .right-1, .left-1, .badge, [class*='duration'], [class*='time']").first().text().trim();

            // 尝试多种标签选择器
            const remarks = $box.find(".left-1, .badge, .tag, .label, [class*='tag'], [class*='label']").first().text().trim();

            if (title && slug) {
                list.push({
                    vod_id: slug, 
                    vod_name: title, 
                    vod_pic: pic, 
                    vod_year: year, 
                    vod_remarks: remarks
                });
            }
        });
        return list;
    }

    function getPageCount() {
        // 尝试多种分页选择器
        const selectors = [
            ".pagination .page-item:last a",
            ".pagination li:last a", 
            ".pagination .active + li a",
            "[class*='pagination'] li:last a",
            ".page-item:last a"
        ];

        for (let sel of selectors) {
            const txt = $(sel).text().trim();
            const n = parseInt(txt.replace(/[^0-9]/g, ''));
            if (!isNaN(n) && n > 0) return n;
        }

        // 尝试从页面文本中提取页码
        const pageText = $("body").text().match(/(\d+)\s*页/g);
        if (pageText) {
            const n = parseInt(pageText[0]);
            if (!isNaN(n)) return n;
        }

        return 1;
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
                    {type_id: "actresses/ranking", type_name: "热门女优"},
                    {type_id: "makers", type_name: "发行商"},
                    {type_id: "genres", type_name: "类型"},
                ],
                filters: {
                    "new": defaultFilter,
                    "madou": defaultFilter,
                    "chinese-subtitle": defaultFilter,
                    "uncensored-leak": defaultFilter,
                    "actresses/ranking": defaultFilter,
                    "makers": defaultFilter,
                    "genres": defaultFilter
                },
                list: []
            };

            // 首页推荐区 - 更新选择器
            const selectors = [
                ".gap-5 .thumbnail",
                ".video-item", 
                ".card-video",
                ".thumbnail-item",
                "[class*='thumbnail']",
                "[class*='video-item']",
                "[class*='card']",
                ".grid > div",
                ".container .grid > div"
            ];

            let $boxes = $();
            for (let sel of selectors) {
                $boxes = $(sel);
                if ($boxes.length > 0) break;
            }

            // 如果还是没找到，尝试更通用的选择器
            if ($boxes.length === 0) {
                $boxes = $("a[href*='/cn/']").parent();
            }

            result.list = parseItems($boxes);
            console.log("HomeContent found items:", result.list.length);
            return result;
        },

        categoryContent: function (tid, pg, filter, extend) {
            const result = {list: [], pagecount: 1};

            if (tid === "actresses/ranking") {
                // 女优排行榜 - 更新选择器
                const selectors = [
                    ".gap-4 .space-y-4",
                    ".actress-item", 
                    ".actress-card",
                    "[class*='actress']",
                    "[class*='performer']"
                ];

                let $items = $();
                for (let sel of selectors) {
                    $items = $(sel);
                    if ($items.length > 0) break;
                }

                $items.each(function () {
                    const $a = $(this).find("a").first();
                    const href = $a.attr("href");
                    if (!href) return;
                    result.list.push({
                        vod_id: getCategoryFromUrl(href),
                        vod_name: $(this).find(".truncate, .name, .title, [class*='name']").first().text().trim(),
                        vod_pic: $(this).find("img").attr("src") || $(this).find("img").data("src") || "",
                        vod_remarks: $(this).find(".text-sm, .count, .badge").first().text().trim(),
                        vod_tag: "folder",
                        style: {type: "rect", ratio: 1}
                    });
                });
                result.pagecount = 1;
            } else if (tid === "makers" || tid === "genres") {
                // 发行商/类型目录
                const categoryList = (title) => {
                    if (title) {
                        $(`nav .relative a.group span:contains('${title}')`).parents(".relative:first").find(".py-1 a").each(function () {
                            result.list.push({
                                vod_id: getCategoryFromUrl($(this).attr("href")),
                                vod_name: $(this).text().trim(),
                                vod_remarks: title,
                                vod_tag: "folder",
                                style: {type: "rect", ratio: 2}
                            });
                        });
                    }
                };
                if (pg == 1) {
                    categoryList("国产 AV");
                    categoryList("无码影片");
                    categoryList("素人");
                }
                // 兜底：页面上的分类卡片
                if (result.list.length === 0) {
                    const selectors = [
                        ".gap-4 div",
                        ".genre-item",
                        ".category-item",
                        "[class*='genre']",
                        "[class*='category']"
                    ];

                    let $items = $();
                    for (let sel of selectors) {
                        $items = $(sel);
                        if ($items.length > 0) break;
                    }

                    $items.each(function () {
                        const $a = $(this).find("a").first();
                        const href = $a.attr("href");
                        if (!href) return;
                        result.list.push({
                            vod_id: getCategoryFromUrl(href),
                            vod_name: $(this).find(".text-nord13, .title, .name, [class*='title']").first().text().trim(),
                            vod_remarks: $(this).find(".text-nord10 a, .count").first().text().trim(),
                            vod_tag: "folder",
                            style: {type: "rect", ratio: 2}
                        });
                    });
                }
                result.pagecount = 1;
            } else {
                // 普通视频列表 - 更新选择器
                const selectors = [
                    ".gap-5 .thumbnail",
                    ".video-item",
                    ".card-video", 
                    ".thumbnail-item",
                    ".box-item",
                    "[class*='thumbnail']",
                    "[class*='video']"
                ];

                let $boxes = $();
                for (let sel of selectors) {
                    $boxes = $(sel);
                    if ($boxes.length > 0) break;
                }

                // 兜底
                if ($boxes.length === 0) {
                    $boxes = $("a[href*='/cn/']").parent();
                }

                result.list = parseItems($boxes);
                result.pagecount = getPageCount();
            }
            console.log("CategoryContent found items:", result.list.length);
            return result;
        },

        detailContent: function (ids) {
            const slug = ids[0];
            const detail = {};

            // 解析详情信息 - 更新选择器
            const detailSelectors = [
                ".space-y-2:not(.list-disc) .text-secondary",
                ".detail-item",
                ".meta-item",
                "[class*='detail']",
                "[class*='meta']",
                ".info-item"
            ];

            let $details = $();
            for (let sel of detailSelectors) {
                $details = $(sel);
                if ($details.length > 0) break;
            }

            $details.each(function () {
                const $item = $(this);
                const key = $item.find("span:first, .key, dt, [class*='label']").first().text().replace(":", "").trim();
                if (!key) return;

                const $links = $item.find("a");
                if ($links.length === 0) {
                    const $clone = $item.clone();
                    $clone.find("span:first, .key, dt, [class*='label']").first().remove();
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

            // 获取图片 - 更新选择器
            const pic = $("meta[property='og:image']").attr("content") || 
                       $("head link[as=image]").attr("href") ||
                       $(".video-cover img").attr("src") ||
                       $("img[alt*='cover']").attr("src") || "";

            // 获取年份/日期
            const year = $("#space-y-2 time, .release-date, .date, [class*='date'], [class*='time']").first().text().trim();

            // 获取播放地址 - 增强检测
            let playUrl = "";
            if (typeof hls !== "undefined" && hls.url) {
                playUrl = "多视轨$" + hls.url;
            } else {
                // 尝试从页面中提取 m3u8 地址
                const html = document.documentElement.innerHTML;
                const m3u8Match = html.match(/https?:\/\/[^"\s]+\.m3u8[^"\s]*/);
                if (m3u8Match) {
                    playUrl = "多视轨$" + m3u8Match[0];
                }
            }

            const vod = {
                vod_id: slug,
                vod_name: slug.toUpperCase(),
                vod_pic: pic,
                vod_year: year,
                vod_remarks: format(["类型", "标签", "genre", "Genre"]),
                vod_actor: format(["女优", "演员", "actress", "actor", "Actress", "Actor"]),
                vod_content: $('meta[name=description]').attr('content') || 
                            $('meta[property="og:title"]').attr('content') || 
                            $('.description').text().trim() || '',
                vod_play_from: "MissAV",
                vod_play_url: playUrl
            };
            console.log("DetailContent:", vod);
            return {list: [vod]};
        },

        searchContent: function (key, quick, pg) {
            const result = {list: [], pagecount: 1};

            // 更新选择器
            const selectors = [
                ".gap-5 .thumbnail",
                ".video-item",
                ".card-video",
                ".thumbnail-item",
                "[class*='thumbnail']",
                "[class*='video']"
            ];

            let $boxes = $();
            for (let sel of selectors) {
                $boxes = $(sel);
                if ($boxes.length > 0) break;
            }

            // 兜底
            if ($boxes.length === 0) {
                $boxes = $("a[href*='/cn/']").parent();
            }

            result.list = parseItems($boxes);
            result.pagecount = getPageCount();
            console.log("SearchContent found items:", result.list.length);
            return result;
        }
    };

    $(document).ready(function () {
        // 检测 Cloudflare 拦截
        if ($("#cf-wrapper").length > 0 || $("title").text().includes("Just a moment")) {
            console.log("源站不可用:" + $('title').text());
            if (typeof GM_toastLong === "function") GM_toastLong("源站不可用:" + $('title').text());
        } else {
            try {
                const result = GmSpider[GMSpiderArgs.fName](...GMSpiderArgs.fArgs);
                if (typeof GmSpiderInject !== 'undefined') {
                    GmSpiderInject.SetSpiderResult(JSON.stringify(result));
                }
                console.log("Spider result:", result);
            } catch (e) {
                console.error("Spider error:", e);
                if (typeof GM_toastLong === "function") GM_toastLong("解析错误: " + e.message);
            }
        }
    });
})();
