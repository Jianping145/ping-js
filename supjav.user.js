// ==UserScript==
// @name         Supjav
// @namespace    gmspider
// @version      2026.10.16.2
// @description  Supjav GMSpider (播放修复: 不提前隐藏WebView + 可靠点击 + CF检测)
// @author       Luomo (refactored by Minis, fixed by Kimi)
// @match        https://supjav.com/*
// @require      https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.slim.min.js
// @grant        GM_cookie
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
        GMSpiderArgs.fArgs = ["tag"];
    }
    Object.freeze(GMSpiderArgs);

    // ---------------- cf_clearance 处理 ----------------
    let cf_clearance = null;

    function initCfClearance() {
        if (cf_clearance) return;
        try {
            GM_cookie.list({name: "cf_clearance"}, function (cookies, error) {
                if (!error && cookies?.length > 0) {
                    cf_clearance = cookies[0].value;
                    localStorage.setItem("cf_clearance", cf_clearance);
                } else {
                    const cached = localStorage.getItem("cf_clearance");
                    if (cached) cf_clearance = cached;
                }
            });
        } catch (e) {
            const cached = localStorage.getItem("cf_clearance");
            if (cached) cf_clearance = cached;
        }
    }

    function formatImgUrl(url) {
        initCfClearance();
        if (!url) return "";
        if (cf_clearance) {
            return url + "@User-Agent=" + encodeURIComponent(navigator.userAgent) +
                "@Cookie=cf_clearance=" + encodeURIComponent(cf_clearance);
        }
        return url;
    }

    // ---------------- Cloudflare 检测 ----------------
    function detectCloudflare() {
        const cfSelectors = [
            ".loading-verifying",
            "#challenge-form",
            ".cf-browser-verification",
            "#cf-please-wait",
            ".cf-challenge-running",
            "[data-translate='checking_browser']",
            ".cf-wrapper",
            "#challenge-error-title",
            ".cf-challenge-body",
            "#cf-challenge-running",
            "#cf-turnstile",
            ".cf-turnstile",
            "input[name='cf-turnstile-response']"
        ];
        const hasCF = cfSelectors.some(s => $(s).length > 0);

        const title = document.title.toLowerCase();
        const isCFTitle = title.includes("cloudflare") ||
            title.includes("checking") ||
            title.includes("verify") ||
            title.includes("attention required") ||
            title.includes("please wait") ||
            title.includes("just a moment") ||
            title.includes("security verification") ||
            title.includes("performing security");

        const bodyText = document.body?.innerText?.trim() || "";
        const isEmptyBody = bodyText.length < 300;
        const hasVerifyHuman = /verify you are human|security verification|checking your browser/i.test(bodyText);

        const hasContent = $(".post, .video-item, .card-video, .thumbnail, a.btn-server, .btn-server").length > 0;

        return (hasCF || isCFTitle || hasVerifyHuman || (isEmptyBody && !hasContent)) && !hasContent;
    }

    // 获取所有可用的播放服务器按钮（兼容多 CD 分组）
    function getServerButtons() {
        let $btns = $(".video-wrap .cd-server:first a.btn-server, .video-wrap .cd-server:first .btn-server");
        if ($btns.length === 0) {
            $btns = $(".video-wrap a.btn-server, .video-wrap .btn-server, .server-list a.btn-server");
        }
        if ($btns.length === 0) {
            $btns = $("a.btn-server, .btn-server, .server-btn");
        }
        return $btns;
    }

    // 更可靠地点击服务器按钮
    function clickServerButton(btn) {
        if (!btn) return false;
        try {
            // 先移除可能挡住点击的遮罩
            $(".movv-ad, .play-ad, #lcb, [class*='root--'], [class*='bottomRight']").remove();

            if (typeof btn.click === "function") {
                btn.click();
            }
            const opts = {bubbles: true, cancelable: true, view: window, buttons: 1};
            btn.dispatchEvent(new MouseEvent("pointerdown", opts));
            btn.dispatchEvent(new MouseEvent("mousedown", opts));
            btn.dispatchEvent(new MouseEvent("pointerup", opts));
            btn.dispatchEvent(new MouseEvent("mouseup", opts));
            btn.dispatchEvent(new MouseEvent("click", opts));
            return true;
        } catch (e) {
            console.warn("clickServerButton failed:", e);
            return false;
        }
    }

    // ---------------- 通用列表解析 ----------------
    function parseItems($boxes) {
        const list = [];
        $boxes.each(function () {
            const $box = $(this);
            const $a = $box.find(".img, a").first();
            const href = $a.attr("href");
            if (!href) return;
            const url = new URL(href, location.origin);
            const slug = url.pathname.split('/').filter(Boolean).pop();
            const title = $a.attr("title") || $box.find(".title, h3, h4").first().text().trim();
            const pic = formatImgUrl($box.find("img").data("original") || $box.find("img").attr("src"));
            const remarks = $box.find(".date, .time").first().text().trim();
            const year = $box.find(".meta").children().remove().end().text().trim() ||
                $box.find(".year, .duration").first().text().trim();
            if (title && slug) {
                list.push({vod_id: slug, vod_name: title, vod_pic: pic, vod_remarks: remarks, vod_year: year});
            }
        });
        return list;
    }

    function getPageCount() {
        const txt = $(".pagination li").not(".next-page").last().text().trim();
        const n = parseInt(txt.replace(/[^0-9]/g, ''));
        return isNaN(n) ? 1 : n;
    }

    // ---------------- Spider ----------------
    const GmSpider = {
        homeContent: function (filter) {
            const defaultFilter = [{
                key: "sort", name: "排序", value: [
                    {n: "观看数", v: "views"},
                    {n: "更新时间", v: ""}
                ]
            }];
            const result = {
                class: [
                    {type_id: "popular", type_name: "热门"},
                    {type_id: "category/censored-jav", type_name: "有码"},
                    {type_id: "category/uncensored-jav", type_name: "无码"},
                    {type_id: "category/amateur", type_name: "素人"},
                    {type_id: "category/chinese-subtitles", type_name: "中文字幕"},
                    {type_id: "category/reducing-mosaic", type_name: "无码破解"},
                    {type_id: "category/english-subtitles", type_name: "英文字幕"},
                    {type_id: "tag", type_name: "类别"},
                ],
                filters: {
                    popular: [{
                        key: "sort", name: "时间", value: [
                            {n: "本月热门", v: "month"},
                            {n: "本周热门", v: "week"},
                            {n: "今日热门", v: ""}
                        ]
                    }]
                },
                list: []
            };
            result.class.forEach(item => {
                if (!result.filters[item.type_id]) result.filters[item.type_id] = defaultFilter;
            });
            result.list = parseItems($(".post, .video-item, .card-video, .thumbnail"));
            return result;
        },

        categoryContent: function (tid, pg, filter, extend) {
            const result = {list: [], pagecount: 1};

            if (tid === "tag") {
                $(".categorys .child, .tag-item, .category-item").each(function () {
                    const $a = $(this).find("a").first();
                    const href = $a.attr("href");
                    if (!href) return;
                    const url = new URL(href, location.origin);
                    const parts = url.pathname.split('/').filter(Boolean);
                    if (parts.length < 3) return;
                    const text = $(this).text().trim().split("(");
                    result.list.push({
                        vod_id: parts[1] + "/" + parts[2],
                        vod_name: text[0],
                        vod_remarks: (text[1] || "").replace(")", "").trim() + " 部影片",
                        vod_tag: "folder",
                        style: {type: "rect", ratio: 1}
                    });
                });
                result.pagecount = getPageCount();
            } else {
                result.list = parseItems($(".post, .video-item, .card-video, .thumbnail"));
                result.pagecount = getPageCount();
            }
            return result;
        },

        detailContent: function (ids) {
            const slug = ids[0];

            try {
                $("#vserver, .video-server, .server-list").click();
            } catch (e) {}

            const vodActor = [], tags = [];
            const stripLang = (path) => path.replace(/^\/(zh|ja|en|zh-tw|zh-cn)\//, "/").replace(/^\//, "");

            $(".post-meta .cats a, .meta .cats a, .actress a").each(function () {
                const $a = $(this);
                const href = $a.attr("href");
                if (!href) return;
                const id = stripLang(new URL(href, location.origin).pathname);
                const name = $a.text().trim();
                vodActor.unshift(`[a=cr:{"id":"${id}","name":"${name}"}/]${name}[/a]`);
            });
            $(".post-meta .tags a, .meta .tags a, .tag a").each(function () {
                const $a = $(this);
                const href = $a.attr("href");
                if (!href) return;
                const id = stripLang(new URL(href, location.origin).pathname);
                const name = $a.text().trim();
                tags.push(`[a=cr:{"id":"${id}","name":"${name}"}/]#${name}[/a]`);
            });

            let vodContent = $(".post-meta .img, .video-info img, .poster").attr("alt") ||
                $("h1").first().text().trim() || "";
            let vodName = vodContent.replace("[无码破解]", "").trim();
            let match = vodName.match(/^[\w|-]+/);
            if (match) {
                vodName = match[0].includes("-") ? match[0] : vodContent.match(/^[\w]+\s[\w]+/)?.[0]?.replace(" ", "-") || vodName;
            }

            // 播放源：link 只用数字索引，兼容 loadUrl 的 #${link}
            const vodPlayData = [];
            const btnServers = getServerButtons();
            if (btnServers.length === 0) {
                console.warn("detailContent: 未找到任何 .btn-server 按钮");
            }
            btnServers.each(function (i) {
                const from = ($(this).text() || "").trim() || `线路${i + 1}`;
                vodPlayData.push({
                    from: from,
                    media: [{
                        name: vodName,
                        type: "webview",
                        ext: {replace: {pathname: slug, link: i}}
                    }]
                });
            });

            const picSrc = $(".post-meta .img, .video-info img, .poster, .img img").first().attr("src") ||
                $(".post-meta .img, .video-info img, .poster").attr("data-src") ||
                $(".post-meta .img, .video-info img, .poster").attr("data-original");

            return {
                list: [{
                    vod_id: slug,
                    vod_name: vodName,
                    vod_pic: formatImgUrl(picSrc),
                    vod_actor: vodActor.join(" "),
                    vod_remarks: tags.join(" "),
                    vod_content: vodContent,
                    vod_play_data: vodPlayData
                }]
            };
        },

        playerContent: function (flag, id, vipFlags) {
            // hash 格式: #0 / #1 / ... 对应服务器索引（保持纯数字）
            const hashRaw = (window.location.hash || "").replace(/^#/, "");
            const idx = parseInt(hashRaw, 10);
            const serverIdx = isNaN(idx) ? 0 : idx;

            console.log("playerContent: 目标服务器索引 =", serverIdx);

            function doClick(attemptsLeft) {
                const btns = getServerButtons().toArray();
                console.log("playerContent: 按钮数=", btns.length, "剩余尝试=", attemptsLeft);

                if (btns.length > 0) {
                    const target = btns[Math.min(serverIdx, btns.length - 1)];
                    console.log("playerContent: 点击按钮 =", (target.textContent || "").trim());
                    clickServerButton(target);

                    // 0.8s 后再点一次，确保 iframe 加载
                    setTimeout(function () {
                        const hasIframe = document.querySelector(
                            "iframe#video, iframe[allowfullscreen], .video-player iframe, #player iframe, .video-wrap iframe"
                        );
                        if (!hasIframe) {
                            console.log("playerContent: 无 iframe，二次点击");
                            clickServerButton(target);
                        }
                    }, 800);
                    return;
                }

                if (attemptsLeft > 0) {
                    setTimeout(function () { doClick(attemptsLeft - 1); }, 400);
                } else {
                    console.warn("playerContent: 超时仍无服务器按钮");
                }
            }

            doClick(20); // 最多约 8 秒

            // type:match 时宿主会继续嗅探，不要立刻 HideWebview
            return {type: "match"};
        },

        searchContent: function (key, quick, pg) {
            const result = {list: [], pagecount: 1};
            result.list = parseItems($(".post, .video-item, .card-video, .thumbnail"));
            result.pagecount = getPageCount();
            return result;
        }
    };

    // ---------------- 启动逻辑 ----------------
    let spiderExecuted = false;
    let checkInterval = null;

    function executeSpider() {
        if (spiderExecuted) return;
        spiderExecuted = true;

        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }

        console.log("执行 Spider:", GMSpiderArgs.fName);
        const result = GmSpider[GMSpiderArgs.fName](...GMSpiderArgs.fArgs);
        console.log("Spider 结果:", result);

        if ((!result.list || result.list.length === 0) && GMSpiderArgs.fName !== "playerContent") {
            console.warn("解析结果为空！可能原因：");
            console.warn("1. Cloudflare 验证未通过");
            console.warn("2. 网站结构改版，选择器失效");
            console.warn("3. 页面未完全加载");
            console.warn("当前页面标题:", document.title);
            console.warn("当前页面 URL:", location.href);
            console.warn("页面 body 长度:", document.body?.innerHTML?.length);
        }

        if (typeof GmSpiderInject !== 'undefined') {
            // 播放嗅探阶段不要隐藏 WebView，否则 iframe/m3u8 来不及加载
            const isPlayer = GMSpiderArgs.fName === "playerContent";
            if (!isPlayer && typeof GmSpiderInject.HideWebview === 'function') {
                GmSpiderInject.HideWebview();
            }
            GmSpiderInject.SetSpiderResult(JSON.stringify(result));
        }
    }

    function startCloudflareWatch() {
        console.log("检测到 Cloudflare 验证页面，启动监控...");

        if (typeof GmSpiderInject !== 'undefined') {
            GmSpiderInject.ShowWebview();
        }

        checkInterval = setInterval(function () {
            const hasContent = $(".post, .video-item, .card-video, .thumbnail, a.btn-server").length > 0;
            const isCF = detectCloudflare();

            if (hasContent && !isCF) {
                console.log("Cloudflare 验证完成，内容已加载");
                executeSpider();
            }
        }, 1000);

        setTimeout(function () {
            if (checkInterval) {
                clearInterval(checkInterval);
                checkInterval = null;
                console.warn("Cloudflare 验证超时");
                executeSpider();
            }
        }, 45000);
    }

    $(document).ready(function () {
        console.log("Document ready, 检测 Cloudflare...");
        setTimeout(function () {
            if (detectCloudflare()) {
                startCloudflareWatch();
            }
        }, 500);
    });

    $(unsafeWindow).on("load", function () {
        console.log("Window load 事件触发");
        setTimeout(function () {
            if (detectCloudflare()) {
                startCloudflareWatch();
            } else {
                executeSpider();
            }
        }, 1500);
    });

    setTimeout(function () {
        if (!spiderExecuted) {
            console.warn("8 秒超时，强制检查...");
            if (detectCloudflare()) {
                startCloudflareWatch();
            } else {
                executeSpider();
            }
        }
    }, 8000);
})();
