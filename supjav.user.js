// ==UserScript==
// @name         Supjav
// @namespace    gmspider
// @version      2026.10.16.5
// @description  Supjav GMSpider (CF原逻辑 + 按名点击 + ST/VOE data-link跳转)
// @author       Luomo (refactored by Minis, fixed by Kimi)
// @match        https://supjav.com/*
// @match        https://*.supremejav.com/*
// @match        https://streamtape.com/*
// @match        https://*.voe.sx/*
// @match        https://*.voe-network.net/*
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

    function detectCloudflare() {
        const cfSelectors = [
            ".loading-verifying", "#challenge-form", ".cf-browser-verification",
            "#cf-please-wait", ".cf-challenge-running", "[data-translate='checking_browser']",
            ".cf-wrapper", "#challenge-error-title", ".cf-challenge-body", "#cf-challenge-running"
        ];
        const hasCF = cfSelectors.some(s => $(s).length > 0);
        const title = document.title.toLowerCase();
        const isCFTitle = title.includes("cloudflare") || title.includes("checking") ||
            title.includes("verify") || title.includes("attention required") ||
            title.includes("please wait") || title.includes("just a moment");
        const bodyText = document.body?.innerText?.trim() || "";
        const isEmptyBody = bodyText.length < 200;
        const hasContent = $(".post, .video-item, .card-video, .thumbnail").length > 0;
        return (hasCF || isCFTitle || (isEmptyBody && !hasContent)) && !hasContent;
    }

    function getServerButtons() {
        let $btns = $(".video-wrap .cd-server:first a.btn-server, .video-wrap .cd-server:first .btn-server");
        if ($btns.length === 0) $btns = $(".video-wrap a.btn-server, .video-wrap .btn-server");
        if ($btns.length === 0) $btns = $("a.btn-server, .btn-server, .server-btn");
        return $btns;
    }

    function clickServerButton(btn) {
        if (!btn) return false;
        try {
            $(".movv-ad, .play-ad, #lcb, .adsbox, .ad-overlay").remove();
            if (typeof btn.scrollIntoView === "function") {
                try { btn.scrollIntoView({block: "center", inline: "nearest"}); } catch (e) {}
            }
            if (typeof btn.click === "function") btn.click();
            const opts = {bubbles: true, cancelable: true, view: window};
            btn.dispatchEvent(new MouseEvent("mousedown", opts));
            btn.dispatchEvent(new MouseEvent("mouseup", opts));
            btn.dispatchEvent(new MouseEvent("click", opts));
            return true;
        } catch (e) {
            console.warn("clickServerButton:", e);
            return false;
        }
    }

    function findTargetButton(flag, serverIdx) {
        const list = getServerButtons().toArray();
        if (list.length === 0) return null;
        const name = (flag || "").toString().trim().toUpperCase();
        if (name) {
            for (let i = 0; i < list.length; i++) {
                const t = (list[i].textContent || list[i].innerText || "").trim().toUpperCase();
                if (t === name || t.indexOf(name) !== -1 || name.indexOf(t) !== -1) {
                    console.log("matched by name", name, "->", t);
                    return list[i];
                }
            }
        }
        const idx = Math.min(Math.max(0, serverIdx | 0), list.length - 1);
        return list[idx];
    }

    // ST / VOE：data-link 反转后走 supremejav 跳转（与 CloudStream 同逻辑）
    function tryDataLinkJump(btn, flag) {
        if (!btn) return false;
        const name = (flag || (btn.textContent || "")).toString().trim().toUpperCase();
        // EVS/VAS/LUC 站内嗅探更稳，不强制跳转
        if (name.indexOf("EVS") !== -1 || name.indexOf("VAS") !== -1 || name.indexOf("LUC") !== -1) {
            return false;
        }
        let dataLink = btn.getAttribute("data-link") || btn.dataset?.link || "";
        if (!dataLink) {
            const $a = $(btn).closest("a");
            if ($a.length) dataLink = $a.attr("data-link") || "";
        }
        if (!dataLink) {
            console.log("no data-link on button", name);
            return false;
        }
        const reversed = dataLink.split("").reverse().join("");
        const jumpUrl = "https://lk1.supremejav.com/supjav.php?c=" + encodeURIComponent(reversed);
        console.log("ST/VOE data-link jump:", jumpUrl);
        try {
            window.location.href = jumpUrl;
            return true;
        } catch (e) {
            console.warn("jump failed", e);
            return false;
        }
    }

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
            try { $("#vserver, .video-server, .server-list").click(); } catch (e) {}

            const vodActor = [], tags = [];
            $(".post-meta .cats a, .meta .cats a, .actress a").each(function () {
                const $a = $(this);
                const href = $a.attr("href");
                if (!href) return;
                const id = new URL(href, location.origin).pathname.replace("/zh/", "");
                const name = $a.text().trim();
                vodActor.unshift(`[a=cr:{"id":"${id}","name":"${name}"}/]${name}[/a]`);
            });
            $(".post-meta .tags a, .meta .tags a, .tag a").each(function () {
                const $a = $(this);
                const href = $a.attr("href");
                if (!href) return;
                const id = new URL(href, location.origin).pathname.replace("/zh/", "");
                const name = $a.text().trim();
                tags.push(`[a=cr:{"id":"${id}","name":"${name}"}/]#${name}[/a]`);
            });

            let vodContent = $(".post-meta .img, .video-info img, .poster").attr("alt") || "";
            let vodName = vodContent.replace("[无码破解]", "").trim();
            let match = vodName.match(/^[\w|-]+/);
            if (match) {
                vodName = match[0].includes("-") ? match[0] : vodContent.match(/^[\w]+\s[\w]+/)?.[0]?.replace(" ", "-") || vodName;
            }

            const vodPlayData = [];
            getServerButtons().each(function (i) {
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

            return {
                list: [{
                    vod_id: slug,
                    vod_name: vodName,
                    vod_pic: formatImgUrl($(".post-meta .img, .video-info img, .poster").attr("src")),
                    vod_actor: vodActor.join(" "),
                    vod_remarks: tags.join(" "),
                    vod_content: vodContent,
                    vod_play_data: vodPlayData
                }]
            };
        },

        playerContent: function (flag, id, vipFlags) {
            const hashRaw = (window.location.hash || "").replace(/^#/, "");
            const idx = parseInt(hashRaw, 10);
            const serverIdx = isNaN(idx) ? 0 : idx;
            console.log("playerContent: flag=", flag, "index=", serverIdx, "host=", location.hostname);

            // 已跳到外链页（streamtape / voe / supremejav）时直接嗅探
            const host = (location.hostname || "").toLowerCase();
            if (host.indexOf("streamtape") !== -1 || host.indexOf("voe") !== -1 ||
                host.indexOf("supremejav") !== -1 || host.indexOf("turboviplay") !== -1) {
                console.log("on embed host, match only");
                return {type: "match"};
            }

            function doPlay(left) {
                const target = findTargetButton(flag, serverIdx);
                if (!target) {
                    if (left > 0) setTimeout(function () { doPlay(left - 1); }, 400);
                    return;
                }
                const name = (flag || (target.textContent || "")).toString().trim().toUpperCase();
                // ST / VOE：优先 data-link 跳转
                if (name.indexOf("ST") !== -1 || name.indexOf("VOE") !== -1 ||
                    name.indexOf("STREAM") !== -1 || name.indexOf("TAPE") !== -1) {
                    if (tryDataLinkJump(target, flag)) return;
                }
                // 其它线路：站内点击（连点避开预览）
                clickServerButton(target);
                setTimeout(function () { clickServerButton(target); }, 600);
                setTimeout(function () { clickServerButton(target); }, 1500);
            }
            doPlay(20);
            return {type: "match"};
        },

        searchContent: function (key, quick, pg) {
            const result = {list: [], pagecount: 1};
            result.list = parseItems($(".post, .video-item, .card-video, .thumbnail"));
            result.pagecount = getPageCount();
            return result;
        }
    };

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
            console.warn("解析结果为空", document.title, location.href);
        }

        if (typeof GmSpiderInject !== 'undefined') {
            if (GMSpiderArgs.fName !== "playerContent" && typeof GmSpiderInject.HideWebview === 'function') {
                GmSpiderInject.HideWebview();
            }
            GmSpiderInject.SetSpiderResult(JSON.stringify(result));
        }
    }

    function startCloudflareWatch() {
        console.log("检测到 Cloudflare，监控中...");
        if (typeof GmSpiderInject !== 'undefined') GmSpiderInject.ShowWebview();
        checkInterval = setInterval(function () {
            const hasContent = $(".post, .video-item, .card-video, .thumbnail").length > 0;
            if (hasContent && !detectCloudflare()) {
                console.log("CF 完成");
                executeSpider();
            }
        }, 1000);
        setTimeout(function () {
            if (checkInterval) {
                clearInterval(checkInterval);
                checkInterval = null;
                console.warn("CF 超时");
                executeSpider();
            }
        }, 45000);
    }

    $(document).ready(function () {
        setTimeout(function () {
            if (detectCloudflare()) startCloudflareWatch();
        }, 500);
    });

    $(unsafeWindow).on("load", function () {
        setTimeout(function () {
            if (detectCloudflare()) startCloudflareWatch();
            else executeSpider();
        }, 1500);
    });

    setTimeout(function () {
        if (!spiderExecuted) {
            if (detectCloudflare()) startCloudflareWatch();
            else executeSpider();
        }
    }, 8000);
})();
