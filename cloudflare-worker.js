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
//
// 注意：谷歌 2026 年起对 /translate_a/single?client=gtx 这条老路径封得很严，
//       所以这里改走 /translate_a/t + client=dict-chrome-ex（实测仍可用），
//       并依次换域名、换 client 参数兜底。
// ============================================================

// 依次尝试的组合：[域名+路径, client 参数]
const CANDIDATES = [
  ['https://translate.googleapis.com/translate_a/t', 'dict-chrome-ex'],
  ['https://clients5.google.com/translate_a/t', 'dict-chrome-ex'],
  ['https://translate.googleapis.com/translate_a/t', 'at'],
  ['https://clients5.google.com/translate_a/t', 'at'],
];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://translate.google.com/',
  Origin: 'https://translate.google.com',
};

export default {
  async fetch(request) {
    // 翻译请求都是 GET，其它方法直接拒绝
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const sl = url.searchParams.get('sl') || 'auto';
    const tl = url.searchParams.get('tl');
    const q = url.searchParams.get('q');
    if (!tl || !q) {
      return new Response('missing tl/q', { status: 400 });
    }

    let lastErr = null;
    for (const [base, client] of CANDIDATES) {
      const target = new URL(base);
      target.searchParams.set('client', client);
      target.searchParams.set('sl', sl);
      target.searchParams.set('tl', tl);
      target.searchParams.set('q', q);
      try {
        const resp = await fetch(target.toString(), { headers: HEADERS });
        if (resp.ok) {
          const body = await resp.text();
          return new Response(body, {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Cache-Control': 'no-store',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
        lastErr = new Error('google http ' + resp.status);
      } catch (err) {
        lastErr = err;
      }
    }

    return new Response('translate failed: ' + (lastErr ? lastErr.message : 'unknown'), { status: 502 });
  },
};
