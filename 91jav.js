/**
 * 91JAV - 猫源 JS（参考可用 Python 版改写）
 * 特点：
 * 1) 自动从 GitLab README / 发布页解析最新可用 host
 * 2) 图片走 localProxy 代理 + 纯 JS AES 解密（不依赖 CryptoJS）
 * 3) 列表/详情/搜索/播放逻辑对齐 Python 版
 *
 * 修复：纯 JS AES 解密 + 二进制字符串返回，兼容更多壳
 */
const HOSTS = [
    'https://www.91jav1.com',
    'https://cabin.zbywlcc.com',
    'https://born.zbywlcc.com',
    'https://d1nqsse6ono4lc.cloudfront.net',
];
let host = HOSTS[0];
const READMES = [
    'https://gitlab.com/91JAV2/dz/-/raw/main/README.md',
    'https://gitlab.com/91jav1/dz/-/raw/main/README.md',
];
const AES_KEY = 'f5d965df75336270';
const AES_IV = '97b60394abc2fbe1';
const UA = 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
let _readmeDone = false;
let _imgCache = {};

function headers() {
    return {
        'User-Agent': UA,
        Referer: host + '/',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
    };
}

function abs(p) {
    if (!p) return '';
    if (/^https?:\/\//i.test(p)) return p;
    return host + (p.startsWith('/') ? p : '/' + p);
}

function b64encode(str) {
    try {
        if (typeof btoa === 'function') return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {}
    return '';
}

function b64decode(str) {
    try {
        if (typeof atob === 'function') return decodeURIComponent(escape(atob(str)));
    } catch (e) {}
    return '';
}

/** 把任意二进制输入统一转成 Uint8Array */
function toUint8Array(data) {
    if (!data) return null;
    if (data instanceof Uint8Array) return data;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(data)) {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
    if (typeof data === 'string') {
        const out = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) out[i] = data.charCodeAt(i) & 0xff;
        return out;
    }
    if (data.content != null) return toUint8Array(data.content);
    if (data.body != null) return toUint8Array(data.body);
    return null;
}

/** Uint8Array -> 二进制字符串（很多壳更认这个） */
function u8ToBinStr(u8) {
    let s = '';
    const len = u8.length;
    const chunk = 8192;
    for (let i = 0; i < len; i += chunk) {
        const end = Math.min(i + chunk, len);
        s += String.fromCharCode.apply(null, u8.subarray(i, end));
    }
    return s;
}

/* ========== 纯 JS AES-128-CBC 解密（不依赖 CryptoJS） ========== */
const SBOX = [
    0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
    0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
    0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
    0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
    0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
    0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
    0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
    0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
    0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
    0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
    0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
    0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
    0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
    0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
    0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
    0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
];
const INV_SBOX = [
    0x52,0x09,0x6a,0xd5,0x30,0x36,0xa5,0x38,0xbf,0x40,0xa3,0x9e,0x81,0xf3,0xd7,0xfb,
    0x7c,0xe3,0x39,0x82,0x9b,0x2f,0xff,0x87,0x34,0x8e,0x43,0x44,0xc4,0xde,0xe9,0xcb,
    0x54,0x7b,0x94,0x32,0xa6,0xc2,0x23,0x3d,0xee,0x4c,0x95,0x0b,0x42,0xfa,0xc3,0x4e,
    0x08,0x2e,0xa1,0x66,0x28,0xd9,0x24,0xb2,0x76,0x5b,0xa2,0x49,0x6d,0x8b,0xd1,0x25,
    0x72,0xf8,0xf6,0x64,0x86,0x68,0x98,0x16,0xd4,0xa4,0x5c,0xcc,0x5d,0x65,0xb6,0x92,
    0x6c,0x70,0x48,0x50,0xfd,0xed,0xb9,0xda,0x5e,0x15,0x46,0x57,0xa7,0x8d,0x9d,0x84,
    0x90,0xd8,0xab,0x00,0x8c,0xbc,0xd3,0x0a,0xf7,0xe4,0x58,0x05,0xb8,0xb3,0x45,0x06,
    0xd0,0x2c,0x1e,0x8f,0xca,0x3f,0x0f,0x02,0xc1,0xaf,0xbd,0x03,0x01,0x13,0x8a,0x6b,
    0x3a,0x91,0x11,0x41,0x4f,0x67,0xdc,0xea,0x97,0xf2,0xcf,0xce,0xf0,0xb4,0xe6,0x73,
    0x96,0xac,0x74,0x22,0xe7,0xad,0x35,0x85,0xe2,0xf9,0x37,0xe8,0x1c,0x75,0xdf,0x6e,
    0x47,0xf1,0x1a,0x71,0x1d,0x29,0xc5,0x89,0x6f,0xb7,0x62,0x0e,0xaa,0x18,0xbe,0x1b,
    0xfc,0x56,0x3e,0x4b,0xc6,0xd2,0x79,0x20,0x9a,0xdb,0xc0,0xfe,0x78,0xcd,0x5a,0xf4,
    0x1f,0xdd,0xa8,0x33,0x88,0x07,0xc7,0x31,0xb1,0x12,0x10,0x59,0x27,0x80,0xec,0x5f,
    0x60,0x51,0x7f,0xa9,0x19,0xb5,0x4a,0x0d,0x2d,0xe5,0x7a,0x9f,0x93,0xc9,0x9c,0xef,
    0xa0,0xe0,0x3b,0x4d,0xae,0x2a,0xf5,0xb0,0xc8,0xeb,0xbb,0x3c,0x83,0x53,0x99,0x61,
    0x17,0x2b,0x04,0x7e,0xba,0x77,0xd6,0x26,0xe1,0x69,0x14,0x63,0x55,0x21,0x0c,0x7d
];
const RCON = [0x00,0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36];

function aesSubWord(w) {
    return (SBOX[(w >>> 24) & 0xff] << 24) | (SBOX[(w >>> 16) & 0xff] << 16) | (SBOX[(w >>> 8) & 0xff] << 8) | SBOX[w & 0xff];
}
function aesRotWord(w) {
    return ((w << 8) | (w >>> 24)) >>> 0;
}
function aesKeyExpansion(key) {
    const Nk = 4;
    const w = new Array(44);
    for (let i = 0; i < Nk; i++) {
        w[i] = ((key[4*i] << 24) | (key[4*i+1] << 16) | (key[4*i+2] << 8) | key[4*i+3]) >>> 0;
    }
    for (let i = Nk; i < 44; i++) {
        let temp = w[i-1];
        if (i % Nk === 0) {
            temp = (aesSubWord(aesRotWord(temp)) ^ (RCON[i/Nk] << 24)) >>> 0;
        }
        w[i] = (w[i-Nk] ^ temp) >>> 0;
    }
    return w;
}
function aesAddRoundKey(state, w, round) {
    for (let c = 0; c < 4; c++) {
        const k = w[round*4 + c];
        state[c*4]   ^= (k >>> 24) & 0xff;
        state[c*4+1] ^= (k >>> 16) & 0xff;
        state[c*4+2] ^= (k >>> 8) & 0xff;
        state[c*4+3] ^= k & 0xff;
    }
}
function aesInvSubBytes(state) {
    for (let i = 0; i < 16; i++) state[i] = INV_SBOX[state[i]];
}
function aesInvShiftRows(state) {
    let t;
    t = state[13]; state[13]=state[9]; state[9]=state[5]; state[5]=state[1]; state[1]=t;
    t = state[2]; state[2]=state[10]; state[10]=t; t = state[6]; state[6]=state[14]; state[14]=t;
    t = state[3]; state[3]=state[7]; state[7]=state[11]; state[11]=state[15]; state[15]=t;
}
function mul(a, b) {
    let p = 0;
    for (let i = 0; i < 8; i++) {
        if (b & 1) p ^= a;
        const hi = a & 0x80;
        a = (a << 1) & 0xff;
        if (hi) a ^= 0x1b;
        b >>>= 1;
    }
    return p & 0xff;
}
function aesInvMixColumns(state) {
    for (let c = 0; c < 4; c++) {
        const i = c * 4;
        const a0 = state[i], a1 = state[i+1], a2 = state[i+2], a3 = state[i+3];
        state[i]   = mul(a0,0x0e) ^ mul(a1,0x0b) ^ mul(a2,0x0d) ^ mul(a3,0x09);
        state[i+1] = mul(a0,0x09) ^ mul(a1,0x0e) ^ mul(a2,0x0b) ^ mul(a3,0x0d);
        state[i+2] = mul(a0,0x0d) ^ mul(a1,0x09) ^ mul(a2,0x0e) ^ mul(a3,0x0b);
        state[i+3] = mul(a0,0x0b) ^ mul(a1,0x0d) ^ mul(a2,0x09) ^ mul(a3,0x0e);
    }
}
function aesDecryptBlock(input, w) {
    const state = new Array(16);
    for (let i = 0; i < 16; i++) state[i] = input[i];
    aesAddRoundKey(state, w, 10);
    for (let round = 9; round >= 1; round--) {
        aesInvShiftRows(state);
        aesInvSubBytes(state);
        aesAddRoundKey(state, w, round);
        aesInvMixColumns(state);
    }
    aesInvShiftRows(state);
    aesInvSubBytes(state);
    aesAddRoundKey(state, w, 0);
    return state;
}

function pureAesDecrypt(cipherBytes, keyStr, ivStr) {
    try {
        const key = new Uint8Array(16);
        const iv = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            key[i] = keyStr.charCodeAt(i) & 0xff;
            iv[i] = ivStr.charCodeAt(i) & 0xff;
        }
        const w = aesKeyExpansion(key);
        const len = cipherBytes.length;
        if (len < 16 || len % 16 !== 0) return null;
        const out = new Uint8Array(len);
        let prev = iv;
        for (let offset = 0; offset < len; offset += 16) {
            const block = cipherBytes.subarray(offset, offset + 16);
            const dec = aesDecryptBlock(block, w);
            for (let i = 0; i < 16; i++) {
                out[offset + i] = dec[i] ^ prev[i];
            }
            prev = block;
        }
        // PKCS7 unpad
        const pad = out[len - 1];
        if (pad < 1 || pad > 16) return out;
        for (let i = 0; i < pad; i++) {
            if (out[len - 1 - i] !== pad) return out;
        }
        return out.subarray(0, len - pad);
    } catch (e) {
        return null;
    }
}

/** AES 解密入口：优先纯 JS，有 CryptoJS 时也可用 */
function aesDecryptBytes(data) {
    const bytes = toUint8Array(data);
    if (!bytes || bytes.length < 16) return null;

    // 1. 纯 JS 实现（不依赖任何库）
    let dec = pureAesDecrypt(bytes, AES_KEY, AES_IV);
    if (dec && dec.length > 4) {
        const jpg = dec[0] === 0xff && dec[1] === 0xd8 && dec[2] === 0xff;
        const png = dec[0] === 0x89 && dec[1] === 0x50 && dec[2] === 0x4e && dec[3] === 0x47;
        const gif = dec[0] === 0x47 && dec[1] === 0x49 && dec[2] === 0x46;
        if (jpg || png || gif) return dec;
    }

    // 2. 兜底：有 CryptoJS 时再试一次
    try {
        if (typeof CryptoJS !== 'undefined' && CryptoJS.AES) {
            const words = [];
            for (let i = 0; i < bytes.length; i += 4) {
                words.push(
                    ((bytes[i] || 0) << 24) |
                    ((bytes[i + 1] || 0) << 16) |
                    ((bytes[i + 2] || 0) << 8) |
                    (bytes[i + 3] || 0)
                );
            }
            const wordArray = CryptoJS.lib.WordArray.create(words, bytes.length);
            const key = CryptoJS.enc.Utf8.parse(AES_KEY);
            const iv = CryptoJS.enc.Utf8.parse(AES_IV);
            const decrypted = CryptoJS.AES.decrypt(
                { ciphertext: wordArray },
                key,
                { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
            );
            const sigBytes = decrypted.sigBytes;
            if (sigBytes > 0) {
                const out = new Uint8Array(sigBytes);
                const ww = decrypted.words;
                for (let i = 0; i < sigBytes; i++) {
                    out[i] = (ww[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                }
                return out;
            }
        }
    } catch (e) {}
    return null;
}

function isValidHtml(body) {
    return !!body && (
        body.indexOf('/videos/') >= 0 ||
        body.indexOf('bind_video_img') >= 0 ||
        body.indexOf('video-img-box') >= 0 ||
        body.indexOf('video-img') >= 0
    );
}

async function rawRequest(url) {
    const res = await req(url, { headers: headers() });
    return typeof res === 'string' ? res : res && res.content ? res.content : '';
}

async function request(url) {
    url = String(url || '');
    let last = '';
    for (let attempt = 0; attempt < 2; attempt++) {
        for (const h of HOSTS) {
            try {
                const u = url.startsWith('http') ? url.replace(/^https?:\/\/[^/]+/, h) : h + (url.startsWith('/') ? url : '/' + url);
                const body = await rawRequest(u);
                if (isValidHtml(body)) {
                    host = h;
                    return body;
                }
                if (body) last = body;
            } catch (e) {}
        }
        if (attempt === 0) await resolveReadme();
    }
    return last;
}

async function resolveReadme() {
    if (_readmeDone) return;
    _readmeDone = true;
    for (const ru of READMES) {
        try {
            const txt = await rawRequest(ru);
            if (!txt) continue;
            const targets = [];
            let m = txt.match(/91JAV\s*国内备用地址\s*[：:]\s*(https?:\/\/[^\s<>"')]+)/);
            if (m) targets.push(['redirect', m[1].replace(/\/$/, '')]);
            m = txt.match(/91JAV\s*国内最新网址\s+(https?:\/\/[^\s<>"')]+)/);
            if (m) targets.push(['publish', m[1].replace(/\/$/, '')]);
            m = txt.match(/91JAV\s*海外永久地址[^v]*?（需要VPN）\s*(https?:\/\/[^\s<>"')]+)/);
            if (m) targets.push(['direct', m[1].replace(/\/$/, '')]);
            for (const [typ, u] of targets) {
                if (!u || HOSTS.indexOf(u) >= 0 || /gitlab|t\.me|app|msugpac|pm\.me/i.test(u)) continue;
                try {
                    if (typ === 'redirect') {
                        const body = await rawRequest(u);
                        const fm = u.match(/^(https?:\/\/[^/]+)/);
                        const final = fm ? fm[1] : u;
                        if (body && (body.indexOf('bind_video_img') >= 0 || body.indexOf('/videos/') >= 0) && HOSTS.indexOf(final) < 0) HOSTS.push(final);
                    } else if (typ === 'publish') {
                        const body = await rawRequest(u);
                        if (!body) continue;
                        const urls = body.match(/https?:\/\/[^"'<>\s]+/g) || [];
                        for (let lu of urls) {
                            lu = lu.replace(/['".,;]+$/, '');
                            if ((lu.indexOf('cloudfront') >= 0 || lu.indexOf('zbywlcc') >= 0 || lu.indexOf('okknubyz') >= 0 || lu.indexOf('gyqspl') >= 0 || lu.indexOf('ehmcfx') >= 0 || lu.indexOf('91jav') >= 0) && HOSTS.indexOf(lu) < 0) HOSTS.push(lu);
                        }
                    } else {
                        const body = await rawRequest(u + '/theme/detail/3/update/');
                        const fm = u.match(/^(https?:\/\/[^/]+)/);
                        const final = fm ? fm[1] : u;
                        if (body && (body.indexOf('bind_video_img') >= 0 || body.indexOf('/videos/') >= 0) && HOSTS.indexOf(final) < 0) HOSTS.push(final);
                    }
                } catch (e) {}
            }
        } catch (e) {}
    }
}

function proxyPic(url) {
    const u = abs(url);
    if (!u) return '';
    if (u.indexOf('assets/images/categories') >= 0) return u;
    const b64 = b64encode(u);
    const q = 'do=js&url=' + encodeURIComponent(b64) + '&type=img';
    // 1. getProxy / getProxyUrl（部分壳提供）
    try {
        if (typeof getProxy === 'function') {
            const p = getProxy(true);
            if (p) return p + (p.indexOf('?') >= 0 ? '&' : '?') + q;
        }
    } catch (e) {}
    try {
        if (typeof getProxyUrl === 'function') {
            const p = getProxyUrl();
            if (p) return p + (p.indexOf('?') >= 0 ? '&' : '?') + q;
        }
    } catch (e) {}
    // 2. js2Proxy（FreeBox 等）
    try {
        if (typeof js2Proxy === 'function') {
            return js2Proxy(true, 3, '91jav', u, { 'User-Agent': UA, Referer: host + '/' });
        }
    } catch (e) {}
    // 3. 硬编码常见本地代理端口（与 Python 版同源写法一致）
    //    9978 是 FongMi/TVBox 默认端口
    return 'http://127.0.0.1:9978/proxy?' + q;
}

function localProxy(param) {
    // param 可能是 {type, url} 或 query map
    const type = (param && (param.type || param['type'])) || '';
    if (type !== 'img') return [404, 'text/plain', ''];
    try {
        let rawUrl = String((param && (param.url || param['url'])) || '');
        // 有的壳会 encode 两次，尝试 decode
        let u = '';
        try { u = b64decode(decodeURIComponent(rawUrl)); } catch (e) { u = b64decode(rawUrl); }
        if (!u) {
            try { u = decodeURIComponent(rawUrl); } catch (e2) { u = rawUrl; }
        }
        if (!u || u.indexOf('http') !== 0) return [404, 'text/plain', ''];
        if (_imgCache[u]) return [200, 'image/jpeg', _imgCache[u]];

        const res = req(u, {
            headers: { 'User-Agent': UA, Referer: host + '/' },
            binary: true,
        });

        let raw = null;
        if (typeof res === 'string') raw = res;
        else if (res && res.content != null) raw = res.content;
        else if (res && res.body != null) raw = res.body;
        else if (res) raw = res;

        const data = toUint8Array(raw);
        if (!data || data.length === 0) return [404, 'text/plain', ''];

        let out = data;
        const dec = aesDecryptBytes(data);
        if (dec && dec.length > 4) {
            const jpg = dec[0] === 0xff && dec[1] === 0xd8 && dec[2] === 0xff;
            const png = dec[0] === 0x89 && dec[1] === 0x50 && dec[2] === 0x4e && dec[3] === 0x47;
            const gif = dec[0] === 0x47 && dec[1] === 0x49 && dec[2] === 0x46;
            if (jpg || png || gif) out = dec;
        }

        // 二进制字符串（QuickJS 最稳）
        const binStr = u8ToBinStr(out);
        _imgCache[u] = binStr;
        // FongMi/QuickJS: [status, mime, body]  或  [status, mime, body, headers, 1] 表示 base64
        return [200, 'image/jpeg', binStr];
    } catch (e) {
        return [500, 'text/plain', ''];
    }
}

function parseList(html) {
    const out = [];
    const seen = {};
    const parts = String(html || '').split('bind_video_img');
    for (let i = 1; i < parts.length; i++) {
        const b = parts[i];
        const m = b.match(/<a\s+href="([^"]*videos\/[^"]+)"[^>]*>/);
        if (!m) continue;
        const href = abs(m[1]);
        if (seen[href]) continue;
        seen[href] = 1;
        const im = b.match(/<img[^>]*?(?:z-image-loader-url|data-src|src)="([^"]*)"/);
        const pic = im ? proxyPic(im[1]) : '';
        let name = '';
        const nm = b.match(/<h3[^>]*class="[^"]*title[^"]*"[^>]*>\s*<a[^>]*>([^<]+)<\/a>/);
        if (nm) name = nm[1].replace(/\s+/g, ' ').trim();
        if (!name) {
            const am = b.match(/<img[^>]*alt="([^"]*)"/);
            if (am) name = am[1];
        }
        if (!name) name = href.split('/').pop();
        let remarks = '';
        const rm = b.match(/<span class="label">([^<]+)<\/span>/);
        if (rm && rm[1].indexOf('广告') < 0) remarks = rm[1];
        out.push({ vod_id: href, vod_name: name, vod_pic: pic, vod_remarks: remarks });
    }
    return out;
}

function parseTheme(html) {
    const out = [];
    const seen = {};
    const re = /<a href="\/theme\/detail\/(\d+)\/([a-z]*)"[^>]*>\s*<div class="overlay"><\/div>\s*<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"(.*?)<\/a>/gs;
    let m;
    while ((m = re.exec(html || '')) !== null) {
        const tid = m[1];
        if (seen[tid]) continue;
        seen[tid] = 1;
        const name = (m[4] || '').trim();
        const pic = abs(m[3]);
        const seg = m[5] || '';
        const cm = seg.match(/<span class="label">(\d+)\s*部影片<\/span>/);
        const remarks = cm ? cm[1] + ' 部影片' : '';
        out.push({ vod_id: 'theme$' + tid, vod_name: name, vod_pic: pic, vod_remarks: remarks, vod_tag: 'folder' });
    }
    return out;
}

function parseActress(html) {
    const out = [];
    const seen = {};
    const re = /<a href="\/actress\/detail\/(\d+)\/([a-z]+)"[^>]*>\s*<div class="media">(.*?)<\/a>/gs;
    let m;
    while ((m = re.exec(html || '')) !== null) {
        const aid = m[1];
        if (seen[aid]) continue;
        seen[aid] = 1;
        const seg = m[3] || '';
        const nm = seg.match(/alt="([^"]*)"/);
        const name = nm ? nm[1] : '女优' + aid;
        const pm = seg.match(/z-image-loader-url="([^"]*)"/);
        const pic = pm ? proxyPic(pm[1]) : '';
        const cm = seg.match(/<span>(\d+)\s*部影片<\/span>/);
        const remarks = cm ? cm[1] + ' 部影片' : '';
        out.push({ vod_id: 'actress$' + aid, vod_name: name, vod_pic: pic, vod_remarks: remarks, vod_tag: 'folder' });
    }
    return out;
}

function pageUrl(tid, pg, sort) {
    pg = parseInt(pg || 1, 10) || 1;
    tid = String(tid || '/new');
    sort = sort || '';
    if (tid.startsWith('theme$')) {
        const t = tid.split('$')[1];
        const st = ['hot', 'update', 'watch', 'favorite'].indexOf(sort) >= 0 ? sort : 'update';
        return pg > 1 ? '/theme/detail/' + t + '/' + st + '/' + pg + '/' : '/theme/detail/' + t + '/' + st + '/';
    }
    if (tid.startsWith('actress$')) {
        const a = tid.split('$')[1];
        const st = ['hot', 'latest', 'watch', 'favorite'].indexOf(sort) >= 0 ? sort : 'latest';
        return pg > 1 ? '/actress/detail/' + a + '/' + st + '/' + pg + '/' : '/actress/detail/' + a + '/' + st + '/';
    }
    if (tid === '/theme') {
        const st = ['sort', 'check_num', 'count'].indexOf(sort) >= 0 ? sort : 'sort';
        return pg > 1 ? '/theme/' + st + '/' + pg + '/' : '/theme/' + st + '/';
    }
    if (tid === '/actress/hot') {
        const st = ['hot', 'count'].indexOf(sort) >= 0 ? sort : 'hot';
        return pg > 1 ? '/actress/' + st + '/' + pg + '/' : '/actress/' + st + '/';
    }
    let base = tid.replace(/\/$/, '');
    if (['hot', 'update', 'watch', 'favorite'].indexOf(sort) >= 0) {
        base = base.replace(/\/(hot|update|watch|favorite)$/, '/' + sort);
    }
    return pg > 1 ? base + '/' + pg + '/' : base + '/';
}

async function init(cfg) {
    try {
        if (cfg && cfg.ext) {
            const e = typeof cfg.ext === 'string' ? JSON.parse(cfg.ext) : cfg.ext;
            if (e && e.host) {
                host = e.host;
                HOSTS.unshift(host);
            }
        }
    } catch (e) {}
    await resolveReadme();
}

async function home(filter) {
    const classes = [
        { type_id: '/new', type_name: '最新更新' },
        { type_id: '/theme/detail/3/update', type_name: '中文字幕' },
        { type_id: '/theme/detail/11/hot', type_name: '无码高清' },
        { type_id: '/theme', type_name: '专题合集' },
        { type_id: '/actress/hot', type_name: '热门女优' },
    ];
    const filters = {
        '/theme/detail/3/update': [{ key: 'sort', name: '排序', value: [{ n: '近期最佳', v: 'hot' }, { n: '今日更新', v: 'update' }, { n: '最多观看', v: 'watch' }, { n: '最高收藏', v: 'favorite' }] }],
        '/theme/detail/11/hot': [{ key: 'sort', name: '排序', value: [{ n: '近期最佳', v: 'hot' }, { n: '今日更新', v: 'update' }, { n: '最多观看', v: 'watch' }, { n: '最高收藏', v: 'favorite' }] }],
        '/theme': [{ key: 'sort', name: '排序', value: [{ n: '预设排序', v: 'sort' }, { n: '热度优先', v: 'check_num' }, { n: '最多影片', v: 'count' }] }],
        '/actress/hot': [{ key: 'sort', name: '排序', value: [{ n: '热度优先', v: 'hot' }, { n: '最多影片', v: 'count' }] }],
    };
    const html = await request('/new');
    return JSON.stringify({ class: classes, list: parseList(html), filters: filters });
}

async function homeVod() {
    const html = await request('/new');
    return JSON.stringify({ list: parseList(html) });
}

async function category(tid, pg, filter, extend) {
    pg = parseInt(pg || 1, 10) || 1;
    tid = String(tid || '/new');
    let sort = '';
    try {
        const ex = typeof extend === 'string' ? JSON.parse(extend || '{}') : (extend || {});
        sort = ex.sort || '';
    } catch (e) {}
    const html = await request(pageUrl(tid, pg, sort));
    let list = [];
    if (tid === '/actress/hot') list = parseActress(html);
    else if (tid === '/theme') list = parseTheme(html);
    else list = parseList(html);
    const nums = [];
    let m;
    const re1 = /<a[^>]*class="[^"]*page-link[^"]*"[^>]*href="([^"]*)"/g;
    while ((m = re1.exec(html)) !== null) {
        const mm = m[1].match(/\/(\d+)(?:[;?]|$)/);
        if (mm) nums.push(parseInt(mm[1], 10));
    }
    const re2 = /<a[^>]*class="[^"]*page-link[^"]*"[^>]*>\s*(\d+)\s*<\/a>/g;
    while ((m = re2.exec(html)) !== null) nums.push(parseInt(m[1], 10));
    const hasNext = /<a[^>]*rel="next"[^>]*>/.test(html) || html.indexOf('下一页') >= 0;
    let pc = Math.max.apply(null, nums.concat([hasNext ? pg + 1 : pg]));
    if (list.length && pc <= pg) pc = pg + 1;
    return JSON.stringify({ page: pg, pagecount: pc, limit: list.length || 24, total: 0, list: list });
}

async function detail(id) {
    id = String(id || '');
    if (id.startsWith('theme$') || id.startsWith('actress$')) {
        const html = await request(pageUrl(id, 1, ''));
        const list = parseList(html);
        if (list.length) {
            const urls = list.map((v) => v.vod_name + '$' + v.vod_id).join('#');
            return JSON.stringify({
                list: [{
                    vod_id: id,
                    vod_name: id,
                    vod_pic: list[0].vod_pic || '',
                    vod_content: '',
                    vod_play_from: '91JAV',
                    vod_play_url: urls,
                }],
            });
        }
    }
    const url = id.startsWith('http') ? id : abs(id);
    const html = await request(url);
    let title = '';
    let pic = '';
    let desc = '';
    let tags = '';
    let dur = '';
    const v = html.match(/<video[^>]*id="player"[^>]*>/) || html.match(/<video[^>]*class="[^"]*dplayer[^"]*"[^>]*>/);
    if (v) {
        const tag = v[0];
        const tm = tag.match(/data-video_title="([^"]*)"/);
        if (tm) title = tm[1];
        const pm = tag.match(/data-src="([^"]*)"/);
        if (pm) pic = pm[1];
        const tg = tag.match(/data-video_tag_name="([^"]*)"/);
        if (tg) tags = tg[1];
    }
    if (!title) {
        const hm = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
        if (hm) title = hm[1].replace(/<[^>]+>/g, '').trim();
    }
    if (!title) title = id;
    if (!pic) {
        const pm = html.match(/<img[^>]*?z-image-loader-url="([^"]*)"/);
        if (pm) pic = pm[1];
    }
    const jd = html.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/);
    if (jd) {
        const m2 = jd[1].match(/"description"\s*:\s*"([^"]+)"/);
        if (m2) desc = m2[1];
        const m3 = jd[1].match(/"duration"\s*:\s*"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"/);
        if (m3) {
            const hh = parseInt(m3[1] || '0', 10);
            const mm = parseInt(m3[2] || '0', 10);
            const ss = parseInt(m3[3] || '0', 10);
            dur = hh ? ('0' + hh).slice(-2) + ':' + ('0' + mm).slice(-2) + ':' + ('0' + ss).slice(-2) : ('0' + mm).slice(-2) + ':' + ('0' + ss).slice(-2);
        }
    }
    if (!desc) {
        const m2 = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/);
        if (m2) desc = m2[1];
    }
    const remarks = [dur, tags].filter(Boolean).join(' ');
    return JSON.stringify({
        list: [{
            vod_id: id,
            vod_name: title,
            vod_pic: proxyPic(pic),
            vod_content: (desc || '').slice(0, 500),
            vod_remarks: remarks,
            vod_play_from: '91JAV',
            vod_play_url: '正片$' + url,
        }],
    });
}

function extractM3U8(body) {
    const m = body.match(/var\s+hlsUrl\s*=\s*["']([^"']+)/);
    if (m) return m[1].replace(/&amp;/g, '&');
    const ms = body.match(/https?:\/\/[^"'<>\s]+\.(?:m3u8|mp4)[^"'<>\s]*/i);
    if (ms) return ms[0].replace(/&amp;/g, '&');
    return '';
}

async function play(flag, id, flags) {
    let url = String(id || '');
    const hd = headers();
    for (const h of HOSTS) {
        try {
            let u = url.startsWith('http') ? url : h + url;
            if (u.indexOf('.m3u8') >= 0 || u.indexOf('.mp4') >= 0) {
                return JSON.stringify({ parse: 0, url: u, header: hd });
            }
            const body = await request(u);
            const got = extractM3U8(body);
            if (got) {
                const full = got.startsWith('http') ? got : h + got;
                return JSON.stringify({ parse: 0, url: full, header: hd });
            }
        } catch (e) {}
    }
    return JSON.stringify({ parse: 0, url: url, header: hd });
}

async function search(wd, quick, pg) {
    pg = parseInt(pg || 1, 10) || 1;
    try {
        const key = encodeURIComponent(String(wd || ''));
        let html = await request('/cn/search/' + key);
        const i = html.indexOf('list_videos_common_videos_list');
        if (i >= 0) {
            const j = html.indexOf('</section>', i);
            if (j > i) html = html.slice(i, j);
        }
        return JSON.stringify({ list: parseList(html), page: pg });
    } catch (e) {
        return JSON.stringify({ list: [], page: pg });
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
        localProxy: localProxy,
        proxy: localProxy, // 部分壳调用 proxy 而不是 localProxy
    };
}
