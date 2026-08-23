// ============================================================
// 析木聊天室 · 谷歌翻译中转 Worker（Cloudflare Workers）
// ------------------------------------------------------------
// 作用：Render 服务器直接调谷歌免费翻译接口会被机房 IP 限流（429），
//       本 Worker 把请求转发到谷歌翻译 API，从而稳定使用谷歌翻译。
//
// 部署（免费，无需绑卡，每日 10 万次请求）：
//   1. 打开 https://dash.cloudflare.com 注册或登录免费账号；
//   2. 左侧「Workers 和 Pages」→「创建」→「创建 Worker」；
//   3. 名称填 ximu-translate（可自定），点「部署」；
//   4. 点「编辑代码」，把本文件内容全部粘贴进去覆盖默认代码，再点「部署」；
//   5. 部署完成后页面会显示 Worker 地址，形如
//      https://ximu-translate.你的子域.workers.dev；
//   6. 把该地址填到 Render 环境变量 TRANSLATE_URL 里（详见 README「自动翻译 Bot」）。
// ============================================================

const GOOGLE_API = 'https://translate.googleapis.com/translate_a/single';

// 可选：加一个访问口令防止别人白嫖你的 Worker。
// 开启后服务器请求需带 ?token=xxx（配合 server.js 的 fetchGoogleTranslation 修改使用），
// 一般家庭/小团体使用不需要，留空即可。
const ACCESS_TOKEN = '';

export default {
  async fetch(request) {
    // 翻译请求都是 GET，其它方法直接拒绝
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(request.url);

    // 可选鉴权：与 ACCESS_TOKEN 不匹配直接 403
    if (ACCESS_TOKEN && url.searchParams.get('token') !== ACCESS_TOKEN) {
      return new Response('Forbidden', { status: 403 });
    }

    // 1) 先走常规翻译接口（把收到的参数原样转发）
    const target = new URL(GOOGLE_API);
    url.searchParams.forEach((value, key) => target.searchParams.append(key, value));
    if (!target.searchParams.has('client')) target.searchParams.set('client', 'gtx');

    let resp = await fetch(target.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'application/json',
        Referer: 'https://translate.google.com/',
      },
    });

    // 2) 被限流(429)或出错时，换 Chrome 扩展接口再试一次
    if (!resp.ok) {
      const c5 = new URL('https://clients5.google.com/translate_a/t');
      c5.searchParams.set('client', 'dict-chrome-ex');
      const sl = target.searchParams.get('sl') || 'auto';
      const tl = target.searchParams.get('tl');
      const q = target.searchParams.get('q');
      if (tl && q) {
        c5.searchParams.set('sl', sl);
        c5.searchParams.set('tl', tl);
        c5.searchParams.set('q', q);
        const retry = await fetch(c5.toString(), {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            Accept: 'application/json',
            Referer: 'https://translate.google.com/',
          },
        });
        if (retry.ok) resp = retry;
      }
    }

    const body = await resp.text();
    return new Response(body, {
      status: resp.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
