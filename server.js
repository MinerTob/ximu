const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const QRCode = require('qrcode');

const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
// 自动翻译：默认用 Google 免费翻译接口；可用 TRANSLATE_URL 换成自建/其他服务，TRANSLATE_DISABLED=1 关闭
const TRANSLATE_URL = process.env.TRANSLATE_URL || 'https://translate.googleapis.com/translate_a/single';
const TRANSLATE_DISABLED = process.env.TRANSLATE_DISABLED === '1';
// MyMemory 备用源：带邮箱参数可走独立每日额度，避免共享 IP 额度被用尽（默认用发件邮箱）
const TRANSLATE_MYMEMORY_EMAIL = process.env.TRANSLATE_MYMEMORY_EMAIL || process.env.MAIL_FROM || '';
const translateMemCache = new Map();
// 邮箱动态验证码：EMAIL_VERIFY=1 时注册必须验证邮箱；MAIL_PROVIDER=console（默认，验证码打印到控制台/存库便于调试）或 resend / brevo（真实发信，任意邮箱可收到）
const EMAIL_VERIFY = process.env.EMAIL_VERIFY !== '0';
const MAIL_PROVIDER = process.env.MAIL_PROVIDER || 'console';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const MAIL_FROM = process.env.MAIL_FROM || 'Chat App <onboarding@resend.dev>';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
db.init();

// ---------- 角色（QQ 群式权限） ----------
// owner = 站主（第一个注册的用户），admin = 管理员（OP），user = 普通用户
function isOpUser(user) {
  return user.role === 'owner' || user.role === 'admin';
}

function isUserMuted(user) {
  if (!user) return false;
  if (!user.muted_until) return false;
  if (user.muted_until === 'forever') return true;
  return new Date(user.muted_until).getTime() > Date.now();
}

function buildMuteMessage(user) {
  const reason = user.muted_reason ? `，原因：${user.muted_reason}` : '';
  if (user.muted_until === 'forever') return `您已被禁言${reason}，当前无法发送消息`;
  const d = new Date(user.muted_until);
  const pad = (n) => String(n).padStart(2, '0');
  const time = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `您已被禁言至 ${time}${reason}，当前无法发送消息`;
}

// ---------- 在线状态 ----------
// userId -> Set<socketId>（同一用户可能开多个标签页）
const onlineSockets = new Map();

function addSocket(userId, socketId) {
  if (!onlineSockets.has(userId)) onlineSockets.set(userId, new Set());
  onlineSockets.get(userId).add(socketId);
}

function removeSocket(userId, socketId) {
  const set = onlineSockets.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) onlineSockets.delete(userId);
}

function onlineUserIds() {
  return [...onlineSockets.keys()];
}

function broadcastPresence() {
  io.emit('presence', { onlineUserIds: onlineUserIds() });
}

// 自动识别局域网 IPv4 地址（用于打印访问地址）
function getLanIPv4() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const item of ifaces[name] || []) {
      if (item.family === 'IPv4' && !item.internal) return item.address;
    }
  }
  return '127.0.0.1';
}

// ---------- 基础中间件 ----------
app.use(express.json());
// 兼容不稳定的内网穿透（TCP 隧道）：每次请求都用新连接，避免残留连接导致 Failed to fetch
// WebSocket 升级请求除外，不受影响
app.use((req, res, next) => {
  if (!req.headers.upgrade) res.setHeader('Connection', 'close');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
// Render 健康检查
app.get('/health', (req, res) => {
  res.json({ ok: true, uptime: Math.floor(process.uptime()) });
});
// 二维码识别库（浏览器端扫码用）
app.get('/vendor/jsqr.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'node_modules', 'jsqr', 'dist', 'jsQR.js'));
});

function getAuthUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const user = db.getUserByToken(token);
  if (!user || user.banned) return null;
  return user;
}

function requireAuth(req, res, next) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: '未登录或登录已过期' });
  req.user = user;
  next();
}

function requireOp(req, res, next) {
  if (!isOpUser(req.user)) return res.status(403).json({ error: '无权限：仅网站管理员可操作' });
  next();
}

const USERNAME_RE = /^[\w\u4e00-\u9fa5-]{2,20}$/;

function validateCredentials(username, password) {
  if (!USERNAME_RE.test(username || '')) return '用户名需为 2-20 位中文、字母、数字、下划线或短横线';
  if (typeof password !== 'string' || password.length < 4 || password.length > 64) return '密码长度需为 4-64 位';
  return null;
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    userCode: user.user_code,
    handle: user.handle,
    role: user.role || 'user',
    isOp: isOpUser(user),
    banned: !!user.banned,
    bannedAt: user.banned_at || null,
    bannedBy: user.banned_by || null,
    bannedReason: user.banned_reason || null,
    bio: user.bio || '',
    avatar: user.avatar || '',
    publicKey: user.public_key || null,
    mutedUntil: user.muted_until || null,
    mutedBy: user.muted_by || null,
    mutedReason: user.muted_reason || null,
    muted: isUserMuted(user),
    createdAt: user.created_at,
  };
}

// ---------- 上传配置 ----------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^(image|video)\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('仅支持图片或视频文件'));
  },
});

const FILE_MIME_MAP = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.m4v': 'video/mp4',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
};

function deleteUploadedFile(url) {
  if (typeof url !== 'string' || !/^\/api\/file\/[A-Za-z0-9._-]+$/.test(url)) return;
  try {
    const filePath = path.join(UPLOAD_DIR, path.basename(url));
    if (filePath.startsWith(UPLOAD_DIR + path.sep)) fs.unlinkSync(filePath);
  } catch (_) {
    /* 文件可能已不存在，忽略 */
  }
}

// 清理上传目录里的孤儿文件：数据库里没有任何消息/头像引用的文件直接物理删除
function sweepOrphanUploads() {
  let files = [];
  try {
    files = fs.readdirSync(UPLOAD_DIR);
  } catch (_) {
    return;
  }
  if (files.length === 0) return;
  const referenced = new Set(db.listReferencedUploads().map((u) => path.basename(u)));
  const graceMs = 10 * 60 * 1000; // 最近 10 分钟内的新文件先不动，避免误删正在上传的
  const cutoff = Date.now() - graceMs;
  let removed = 0;
  for (const f of files) {
    if (referenced.has(f)) continue;
    const full = path.join(UPLOAD_DIR, f);
    try {
      const st = fs.statSync(full);
      if (st.mtimeMs > cutoff) continue;
      fs.unlinkSync(full);
      removed += 1;
    } catch (_) {
      /* 忽略单个失败 */
    }
  }
  return removed;
}

// ---------- REST API ----------
// 发送邮箱验证码
function deliverEmailCode(email, code) {
  if (MAIL_PROVIDER === 'resend' && RESEND_API_KEY) {
    return fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [email],
        subject: '您的聊天室注册验证码',
        html: `<p>您的注册验证码是：<b>${code}</b></p><p>验证码 10 分钟内有效，请勿泄露给他人。</p>`,
      }),
      signal: AbortSignal.timeout(10000),
    });
  }
  if (MAIL_PROVIDER === 'brevo' && BREVO_API_KEY) {
    // Brevo 的 sender.email 只要纯邮箱；兼容 "名字 <邮箱>" 格式
    const senderEmail = (MAIL_FROM.match(/<([^>]+)>/) || [])[1] || MAIL_FROM;
    return fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: senderEmail.trim() },
        to: [{ email }],
        subject: '您的聊天室注册验证码',
        htmlContent: `<p>您的注册验证码是：<b>${code}</b></p><p>验证码 10 分钟内有效，请勿泄露给他人。</p>`,
      }),
      signal: AbortSignal.timeout(10000),
    });
  }
  // console 模式：验证码打印到服务器控制台（并写入数据库，便于本地调试）
  console.log(`[邮箱验证码] ${email} -> ${code}（10 分钟内有效）`);
  return Promise.resolve({ ok: true });
}

app.post('/api/send-code', (req, res) => {
  if (!EMAIL_VERIFY) return res.status(400).json({ error: '未开启邮箱验证' });
  const email = String((req.body && req.body.email) || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: '邮箱格式不正确' });
  if (db.emailExists(email)) return res.status(409).json({ error: '该邮箱已被注册' });
  const last = db.latestEmailCodeTime(email);
  if (last && Date.now() - new Date(last).getTime() < 60 * 1000) {
    return res.status(429).json({ error: '发送太频繁，请 60 秒后再试' });
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  db.createEmailCode(email, code, new Date(Date.now() + 10 * 60 * 1000).toISOString());
  deliverEmailCode(email, code).catch(() => {
    console.error('邮件发送失败（验证码仍可在调试模式使用）');
  });
  res.json({ ok: true, sent: true });
});

// ---------- 二维码登录 ----------
const QR_LOGIN_TTL_MS = 10 * 60 * 1000; // 二维码每 10 分钟随机生成并失效

app.post('/api/qr/login/start', (req, res) => {
  db.deleteExpiredQrLogins(new Date().toISOString());
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + QR_LOGIN_TTL_MS).toISOString();
  let origin = String((req.body && req.body.origin) || '').trim();
  if (!/^https?:\/\/[^\s"'<>]+$/.test(origin)) {
    origin = `${req.protocol}://${req.get('host')}`;
  }
  const qrUrl = `${origin.replace(/\/+$/, '')}/qr-login?t=${token}`;
  db.createQrLogin(token, qrUrl, expiresAt);
  res.json({ token, expiresAt });
});

app.get('/api/qr/login/image/:token', (req, res) => {
  const row = db.getQrLogin(String(req.params.token || ''));
  if (!row) return res.status(404).json({ error: '二维码不存在' });
  QRCode.toBuffer(row.qr_url, { type: 'png', width: 360, margin: 1, errorCorrectionLevel: 'M' })
    .then((buf) => {
      res.set('Content-Type', 'image/png');
      res.set('Cache-Control', 'no-store');
      res.send(buf);
    })
    .catch(() => res.status(500).json({ error: '二维码生成失败' }));
});

app.post('/api/qr/login/confirm', requireAuth, (req, res) => {
  const token = String((req.body && req.body.token) || '');
  const row = token ? db.getQrLogin(token) : null;
  if (!row) return res.status(404).json({ error: '二维码不存在' });
  if (row.status !== 'pending') return res.status(400).json({ error: '二维码已被使用或已失效' });
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return res.status(400).json({ error: '二维码已过期，请刷新后重试' });
  }
  const loginToken = db.createSession(req.user.id);
  db.confirmQrLogin(token, req.user.id, loginToken, new Date().toISOString());
  res.json({ ok: true });
});

app.post('/api/qr/login/status', (req, res) => {
  const token = String((req.body && req.body.token) || '');
  const row = token ? db.getQrLogin(token) : null;
  if (!row) return res.json({ status: 'expired' });
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.deleteExpiredQrLogins(new Date().toISOString());
    return res.json({ status: 'expired' });
  }
  if (row.status === 'confirmed' && row.login_token) {
    const user = db.getUserByToken(row.login_token);
    if (user) {
      return res.json({ status: 'confirmed', token: row.login_token, user: publicUser(user) });
    }
  }
  res.json({ status: row.status });
});

// 误扫提示页：其他扫码器打开二维码链接时看到的说明
app.get('/qr-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'qr-login.html'));
});

app.post('/api/register', (req, res) => {
  const { username, password } = req.body || {};
  const error = validateCredentials(username, password);
  if (error) return res.status(400).json({ error });
  if (db.getUserByName(username)) return res.status(409).json({ error: '用户名已被占用' });

  let email = null;
  if (EMAIL_VERIFY) {
    email = String((req.body && req.body.email) || '').trim().toLowerCase();
    const code = String((req.body && req.body.code) || '').trim();
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: '邮箱格式不正确' });
    if (db.emailExists(email)) return res.status(409).json({ error: '该邮箱已被注册' });
    if (!/^\d{6}$/.test(code)) return res.status(400).json({ error: '请输入 6 位数字验证码' });
    if (!db.consumeEmailCode(email, code, new Date().toISOString())) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }
  }

  const user = db.createUser(username, password, email);
  const token = db.createSession(user.id);
  res.status(201).json({ token, user: publicUser(user) });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const loginId = String(username || '').trim();
  if (!loginId || !password) return res.status(400).json({ error: '请输入用户名/邮箱和密码' });
  // 支持用用户名或注册邮箱登录（邮箱统一转小写匹配）
  const user = db.getUserByName(loginId) || db.getUserByEmail(loginId.toLowerCase());
  if (!user || !db.verifyPassword(user, password)) return res.status(401).json({ error: '用户名或密码错误' });
  if (user.banned) {
    return res.status(403).json({
      error: '该账号已被封禁，无法登录',
      banned: true,
      bannedAt: user.banned_at,
      bannedBy: user.banned_by,
      bannedReason: user.banned_reason,
    });
  }
  const token = db.createSession(user.id);
  res.json({ token, user: publicUser(user) });
});

app.post('/api/logout', requireAuth, (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  db.deleteSession(token);
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req, res) => {
  // 与 publicUser 保持一致的字段格式（驼峰命名），避免客户端取不到禁言信息
  res.json({ user: publicUser(req.user), onlineUserIds: onlineUserIds() });
});

// 修改个人资料：用户名 / 简介 / 头像
app.post('/api/profile', requireAuth, (req, res) => {
  const body = req.body || {};
  const fields = {};

  if (body.username !== undefined) {
    const username = String(body.username).trim();
    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({ error: '用户名需为 2-20 位中文、字母、数字、下划线或短横线' });
    }
    if (db.usernameExists(username, req.user.id)) {
      return res.status(409).json({ error: '该用户名已被占用' });
    }
    fields.username = username;
  }
  if (body.bio !== undefined) {
    const bio = String(body.bio).trim();
    if (bio.length > 200) return res.status(400).json({ error: '简介不能超过 200 字' });
    fields.bio = bio;
  }
  if (body.avatar !== undefined) {
    const avatar = String(body.avatar).trim();
    if (avatar.length > 100) return res.status(400).json({ error: '头像内容无效' });
    if (avatar && !/^\/api\/file\/[A-Za-z0-9._-]+$/.test(avatar) && avatar.length > 12) {
      return res.status(400).json({ error: '头像内容无效' });
    }
    const me = db.getUserById(req.user.id);
    if (me.avatar && me.avatar !== avatar) deleteUploadedFile(me.avatar);
    fields.avatar = avatar;
  }

  if (Object.keys(fields).length === 0) return res.status(400).json({ error: '没有需要修改的内容' });
  db.updateUserProfile(req.user.id, fields);
  io.emit('roles:changed', {});
  res.json({ user: publicUser(db.getUserById(req.user.id)) });
});

// 上传端到端加密公钥（密钥只在本浏览器生成，服务器只保存公钥）
app.post('/api/key', requireAuth, (req, res) => {
  const publicKey = String((req.body && req.body.publicKey) || '').trim();
  if (!publicKey || publicKey.length > 2000) {
    return res.status(400).json({ error: '公钥无效' });
  }
  db.setUserPublicKey(req.user.id, publicKey);
  io.emit('roles:changed', {});
  res.json({ ok: true });
});

// ---------- 自动翻译 Bot ----------
// 规则：包含中文（简/繁）→ 翻译成英语；纯英文 → 翻译成简体中文；其他语言不翻译
function hasHan(text) {
  return /[\u3400-\u9fff]/.test(text);
}

function translatePair(text) {
  if (hasHan(text)) return { from: 'zh', to: 'en' };
  if (/[A-Za-z]/.test(text)) return { from: 'en', to: 'zh-CN' };
  return null;
}

function extractGoogleTranslation(data) {
  if (!Array.isArray(data) || !Array.isArray(data[0])) return '';
  return data[0]
    .map((seg) => (Array.isArray(seg) ? String(seg[0] || '') : ''))
    .join('');
}

// 谷歌翻译：优先用 Chrome 扩展接口（clients5，机房 IP 下不易被 429 限流），
// 再用可配置的常规接口兜底。两种返回格式都能被 extractGoogleTranslation 解析。
async function fetchGoogleTranslation(text, toLang) {
  const urls = [];
  if (TRANSLATE_URL === 'https://translate.googleapis.com/translate_a/single') {
    urls.push(
      `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=${encodeURIComponent(toLang)}&q=${encodeURIComponent(text)}`
    );
  }
  const sep = TRANSLATE_URL.includes('?') ? '&' : '?';
  urls.push(`${TRANSLATE_URL}${sep}client=gtx&sl=auto&tl=${encodeURIComponent(toLang)}&dt=t&q=${encodeURIComponent(text)}`);
  let lastErr = null;
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) throw new Error('google translate http ' + r.status);
      const t = extractGoogleTranslation(await r.json());
      if (!t) throw new Error('google translate empty');
      return t;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('google translate failed');
}

// 备用翻译源：Google 免费接口被限流（429）时自动切换 MyMemory
async function fetchMyMemoryTranslation(text, fromLang, toLang) {
  let url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`;
  if (TRANSLATE_MYMEMORY_EMAIL) url += `&de=${encodeURIComponent(TRANSLATE_MYMEMORY_EMAIL)}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('mymemory http ' + r.status);
  const data = await r.json();
  const t = data && data.responseData ? String(data.responseData.translatedText || '').trim() : '';
  if (!t || /no query|invalid|exceeded/i.test(t)) throw new Error('mymemory empty');
  return t;
}

app.post('/api/translate', requireAuth, async (req, res) => {
  const text = String((req.body && req.body.text) || '').trim().slice(0, 1000);
  if (!text) return res.json({ text, translation: '', needsTranslation: false });
  const pair = translatePair(text);
  if (!pair) return res.json({ text, translation: '', needsTranslation: false });
  if (TRANSLATE_DISABLED) return res.json({ text, translation: '', needsTranslation: true, disabled: true });

  const cacheKey = `${pair.from}|${pair.to}|${text}`;
  if (translateMemCache.has(cacheKey)) {
    return res.json({ text, translation: translateMemCache.get(cacheKey), from: pair.from, to: pair.to, cached: true });
  }
  const dbHit = db.getTranslation(text, pair.from, pair.to);
  if (dbHit) {
    translateMemCache.set(cacheKey, dbHit);
    return res.json({ text, translation: dbHit, from: pair.from, to: pair.to, cached: true });
  }

  let translation = '';
  const mmFrom = pair.from === 'zh' ? 'zh-CN' : pair.from;
  const mmTo = pair.to === 'zh-CN' ? 'zh-CN' : pair.to;
  const attempts = [];
  attempts.push(() => fetchGoogleTranslation(text, pair.to));
  attempts.push(() => fetchMyMemoryTranslation(text, mmFrom, mmTo));
  for (const attempt of attempts) {
    try {
      translation = await attempt();
      if (translation) break;
    } catch (_) {
      translation = '';
    }
  }
  if (!translation) return res.json({ text, translation: '', from: pair.from, to: pair.to, error: true });
  translateMemCache.set(cacheKey, translation);
  db.saveTranslation(text, pair.from, pair.to, translation);
  res.json({ text, translation, from: pair.from, to: pair.to });
});

app.get('/api/users', requireAuth, (req, res) => {
  const users = db
    .listUsers()
    .filter((u) => u.id !== req.user.id)
    .map((u) => ({
      ...publicUser(u),
      online: onlineSockets.has(u.id),
      unread: db.unreadCountFor(req.user.id, u.id),
    }));
  res.json({ users });
});

app.get('/api/conversation/:userId', requireAuth, (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || !db.getUserById(userId)) {
    return res.status(404).json({ error: '用户不存在' });
  }
  // 打开对话即标记已读，并实时通知对方“已读”
  const changed = db.markConversationRead(req.user.id, userId, new Date().toISOString());
  if (changed > 0) {
    io.to(`user:${userId}`).emit('messages:read', { byUserId: req.user.id });
  }
  res.json({ messages: db.getConversation(req.user.id, userId) });
});

// 正在对话时收到新消息：立即标记已读（限流由客户端控制）
app.post('/api/conversation/:userId/read', requireAuth, (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || !db.getUserById(userId)) {
    return res.status(404).json({ error: '用户不存在' });
  }
  const changed = db.markConversationRead(req.user.id, userId, new Date().toISOString());
  if (changed > 0) {
    io.to(`user:${userId}`).emit('messages:read', { byUserId: req.user.id });
  }
  res.json({ ok: true });
});

// 撤回自己发送的消息（微信式，2 分钟内可撤回）
const RECALL_WINDOW_MS = 2 * 60 * 1000;

app.post('/api/message/:id/recall', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const msg = Number.isInteger(id) ? db.getMessageById(id) : null;
  if (!msg) return res.status(404).json({ error: '消息不存在或已删除' });
  if (msg.senderId !== req.user.id) return res.status(403).json({ error: '只能撤回自己发送的消息' });
  if (msg.recalledAt) return res.status(400).json({ error: '该消息已撤回' });
  const sentAt = new Date(msg.createdAt).getTime();
  if (!Number.isFinite(sentAt) || Date.now() - sentAt > RECALL_WINDOW_MS) {
    return res.status(400).json({ error: '超过 2 分钟，无法撤回' });
  }

  // 撤回 = 物理删除：数据库记录连同媒体文件一起抹除（不是软删除）
  const result = db.recallMessage(id);
  if (!result) return res.status(404).json({ error: '消息不存在或已删除' });
  // 内容已从数据库抹除；媒体文件从磁盘物理删除（只留撤回标记）
  if (result.fileUrl) deleteUploadedFile(result.fileUrl);
  const updated = result.message;
  updated.senderName = req.user.username;
  io.to(`user:${msg.senderId}`).to(`user:${msg.receiverId}`).emit('message:recalled', { message: updated });
  res.json({ message: updated });
});

// 转发消息：文字复制内容，图片/视频复制一份加密文件；新消息和普通消息一样，只是带「转发自」
function copyUploadedFile(url) {
  const name = path.basename(url);
  const srcPath = path.join(UPLOAD_DIR, name);
  const newName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(name)}`;
  const dstPath = path.join(UPLOAD_DIR, newName);
  fs.copyFileSync(srcPath, dstPath);
  return `/api/file/${newName}`;
}

app.post('/api/forward', requireAuth, (req, res) => {
  const messageId = Number(req.body && req.body.messageId);
  const targetUserId = Number(req.body && req.body.targetUserId);
  const msg = Number.isInteger(messageId) ? db.getMessageById(messageId) : null;
  const target = Number.isInteger(targetUserId) ? db.getUserById(targetUserId) : null;
  if (!msg) return res.status(404).json({ error: '消息不存在或已删除' });
  if (msg.recalledAt) return res.status(400).json({ error: '已撤回的消息不能转发' });
  if (msg.senderId !== req.user.id && msg.receiverId !== req.user.id) {
    return res.status(403).json({ error: '只能转发自己参与的消息' });
  }
  if (!target) return res.status(404).json({ error: '用户不存在' });
  if (target.id === req.user.id) return res.status(400).json({ error: '不能转发给自己' });

  let content = msg.content;
  let type = msg.type;
  if (type === 'text') {
    content = db.decryptText(content);
  } else if (/^\/api\/file\/[A-Za-z0-9._-]+$/.test(content)) {
    try {
      content = copyUploadedFile(content);
    } catch (_) {
      return res.status(400).json({ error: '原文件已不存在' });
    }
  } else {
    return res.status(400).json({ error: '该消息无法转发' });
  }

  const originalSender = db.getUserById(msg.senderId);
  const message = db.saveMessage({
    senderId: req.user.id,
    receiverId: target.id,
    type,
    content,
    meta: null,
    forwardFrom: originalSender ? originalSender.username : '未知用户',
  });
  message.senderName = req.user.username;
  io.to(`user:${req.user.id}`).to(`user:${target.id}`).emit('chat:message', { message });
  res.status(201).json({ message });
});

// 用户自己的警告
app.get('/api/my/warnings', requireAuth, (req, res) => {
  res.json({
    warnings: db.getWarningsByUser(req.user.id, 50),
    unread: db.getUnreadWarningsCount(req.user.id),
  });
});

app.post('/api/my/warnings/read', requireAuth, (req, res) => {
  db.markWarningsRead(req.user.id);
  res.json({ ok: true });
});

// 邮件箱（站内信）：举报通知、处理结果、系统通知
app.get('/api/mailbox', requireAuth, (req, res) => {
  res.json({ items: db.getMailbox(req.user.id), unread: db.unreadMailboxCount(req.user.id) });
});

app.post('/api/mailbox/read', requireAuth, (req, res) => {
  db.markMailboxRead(req.user.id);
  res.json({ ok: true });
});

app.post('/api/mailbox/delete', requireAuth, (req, res) => {
  const id = Number(req.body && req.body.id);
  if (!Number.isInteger(id) || !db.deleteMailbox(req.user.id, id)) {
    return res.status(404).json({ error: '邮件不存在' });
  }
  res.json({ ok: true });
});

// 提交举报（全加密模式下由用户主动提交证据）
app.post('/api/report', requireAuth, (req, res) => {
  const targetUserId = Number(req.body && req.body.targetUserId);
  const messageIds = Array.isArray(req.body && req.body.messageIds)
    ? req.body.messageIds.map(Number).filter(Number.isInteger)
    : [];
  const reason = String((req.body && req.body.reason) || '').trim().slice(0, 500);
  const evidence = String((req.body && req.body.evidence) || '').trim().slice(0, 4000);
  const target = Number.isInteger(targetUserId) ? db.getUserById(targetUserId) : null;
  if (!target) return res.status(404).json({ error: '用户不存在' });
  if (targetUserId === req.user.id) return res.status(400).json({ error: '不能举报自己' });
  if (messageIds.length === 0) return res.status(400).json({ error: '请选择要举报的消息' });
  if (messageIds.length > 20) return res.status(400).json({ error: '单次最多举报 20 条消息' });
  for (const id of messageIds) {
    const m = db.getMessageById(id);
    if (!m || m.senderId !== targetUserId) return res.status(400).json({ error: '包含无效的举报消息' });
  }

  const report = db.addReport({ reporterId: req.user.id, targetUserId, messageIds, evidence, reason });
  const reporter = db.getUserById(req.user.id);
  notifyAdmins('report', '收到新举报', `用户 ${reporter.username} 举报了 ${target.username}：${reason || '（未填写原因）'}`, report.id);
  // 被举报人收到匿名系统通知：不透露举报人身份与具体内容
  db.addMailbox({
    userId: targetUserId,
    kind: 'notified',
    title: '检举通知',
    body: '系统通知：您有一条内容被其他用户检举，管理员正在审核中。请遵守平台规范；若确认违规，将依据平台规范处理。',
    refId: report.id,
  });
  io.to(`user:${targetUserId}`).emit('mailbox:new', {});
  res.status(201).json({ report });
});

// 给所有管理员/站主发送站内信
function notifyAdmins(kind, title, body, refId) {
  const adminIds = db.getAdminUserIds();
  for (const id of adminIds) {
    db.addMailbox({ userId: id, kind, title, body, refId });
    io.to(`user:${id}`).emit('mailbox:new', {});
  }
}

// ---------- 管理后台（仅 OP） ----------
app.get('/api/op/users', requireAuth, requireOp, (req, res) => {
  const users = db.getUserStats().map((u) => ({
    ...publicUser(u),
    msgCount: u.msg_count,
    lastActive: u.last_active,
    warningCount: u.warning_count,
    online: onlineSockets.has(u.id),
  }));
  res.json({ users });
});

app.get('/api/op/messages', requireAuth, requireOp, (req, res) => {
  const userId = Number(req.query.userId);
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  if (!Number.isInteger(userId) || !db.getUserById(userId)) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json({ messages: db.getUserMessages(userId, limit) });
});

app.get('/api/op/warnings', requireAuth, requireOp, (req, res) => {
  const userId = Number(req.query.userId);
  if (!Number.isInteger(userId) || !db.getUserById(userId)) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json({ warnings: db.getWarningsByUser(userId, 100) });
});

app.post('/api/op/warn', requireAuth, requireOp, (req, res) => {
  const userId = Number(req.body && req.body.userId);
  const reason = String((req.body && req.body.reason) || '').trim();
  const messageIds = Array.isArray(req.body && req.body.messageIds)
    ? req.body.messageIds.map(Number).filter(Number.isInteger)
    : [];
  if (!Number.isInteger(userId) || !db.getUserById(userId)) {
    return res.status(404).json({ error: '用户不存在' });
  }
  if (userId === req.user.id) return res.status(400).json({ error: '不能警告自己' });
  if (!reason || reason.length > 500) return res.status(400).json({ error: '警告原因不能为空且不超过 500 字' });

  // 把选中的违规消息整理成引用文本，方便对方查看
  let quote = '';
  if (messageIds.length > 0) {
    const lines = [];
    for (const id of messageIds) {
      const msg = db.getMessageById(id);
      if (!msg) {
        return res.status(400).json({ error: '部分消息不存在或已被删除，请刷新后重试' });
      }
      if (msg.senderId !== userId) {
        return res.status(400).json({ error: '只能选中该用户自己发送的消息进行警告' });
      }
      const d = new Date(msg.createdAt);
      const pad = (n) => String(n).padStart(2, '0');
      const time = `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      let body;
      if (msg.type === 'text') {
        const plain = db.decryptText(msg.content);
        body = String(plain).startsWith('e2e:v') ? '（端到端加密消息，内容不可见）' : plain;
      } else {
        body = msg.type === 'image' ? '[图片（端到端加密）]' : '[视频（端到端加密）]';
      }
      lines.push(`[${time}] 你发送：${body}`);
    }
    quote = lines.join('\n');
  }

  const warning = db.addWarning({ userId, reason, opName: req.user.username, messageIds, quote });
  io.to(`user:${userId}`).emit('warning:new', { warning });
  res.status(201).json({ warning });
});

app.delete('/api/op/message/:id', requireAuth, requireOp, (req, res) => {
  const id = Number(req.params.id);
  const msg = Number.isInteger(id) ? db.getMessageById(id) : null;
  if (!msg) return res.status(404).json({ error: '消息不存在或已删除' });

  db.deleteMessage(id);
  // 如果是图片/视频，一并删除磁盘上的加密文件
  if (msg.type !== 'text' && /^\/api\/file\/[A-Za-z0-9._-]+$/.test(msg.content)) {
    const filePath = path.join(UPLOAD_DIR, path.basename(msg.content));
    try {
      if (filePath.startsWith(UPLOAD_DIR + path.sep)) fs.unlinkSync(filePath);
    } catch (_) {
      /* 文件可能已不存在，忽略 */
    }
  }

  // 实时通知双方刷新（删除用户端已展示的消息）
  io.to(`user:${msg.senderId}`).to(`user:${msg.receiverId}`).emit('message:deleted', { messageId: id });
  res.json({ ok: true, messageId: id });
});

// 授予 / 取消管理员权限（站主和管理员均可操作，站主不可被修改）
app.post('/api/op/set-role', requireAuth, requireOp, (req, res) => {
  const targetId = Number(req.body && req.body.userId);
  const role = req.body && req.body.role;
  const target = Number.isInteger(targetId) ? db.getUserById(targetId) : null;
  if (!target) return res.status(404).json({ error: '用户不存在' });
  if (target.role === 'owner') return res.status(400).json({ error: '不能修改站主的权限' });
  if (role !== 'admin' && role !== 'user') return res.status(400).json({ error: '无效的权限' });
  db.setUserRole(targetId, role);
  io.emit('roles:changed', {});
  res.json({ ok: true, userId: targetId, role });
});

// 删除违规警告（站主和管理员均可），对方界面实时移除
app.delete('/api/op/warning/:id', requireAuth, requireOp, (req, res) => {
  const id = Number(req.params.id);
  const warnedUserId = db.deleteWarning(id);
  if (!warnedUserId) return res.status(404).json({ error: '警告不存在或已删除' });
  io.to(`user:${warnedUserId}`).emit('warning:deleted', { warningId: id });
  res.json({ ok: true, warningId: id });
});

// 禁言 / 解封（站主可禁言任何人；管理员不能禁言站主）
app.post('/api/op/mute', requireAuth, requireOp, (req, res) => {
  const targetId = Number(req.body && req.body.userId);
  const minutes = Number(req.body && req.body.minutes);
  const reason = String((req.body && req.body.reason) || '').trim().slice(0, 200);
  const target = Number.isInteger(targetId) ? db.getUserById(targetId) : null;
  if (!target) return res.status(404).json({ error: '用户不存在' });
  if (targetId === req.user.id) return res.status(400).json({ error: '不能禁言自己' });
  if (req.user.role !== 'owner' && target.role === 'owner') {
    return res.status(403).json({ error: '无权禁言站主' });
  }
  if (!Number.isFinite(minutes) || minutes < 0) return res.status(400).json({ error: '无效的禁言时长' });

  const mutedUntil = minutes > 0 ? new Date(Date.now() + minutes * 60000).toISOString() : 'forever';
  db.setUserMute(targetId, { until: mutedUntil, by: req.user.username, reason });
  io.emit('mute:changed', { userId: targetId, mutedUntil, mutedBy: req.user.username, mutedReason: reason });
  res.json({ ok: true, mutedUntil, mutedBy: req.user.username, mutedReason: reason });
});

app.post('/api/op/unmute', requireAuth, requireOp, (req, res) => {
  const targetId = Number(req.body && req.body.userId);
  const target = Number.isInteger(targetId) ? db.getUserById(targetId) : null;
  if (!target) return res.status(404).json({ error: '用户不存在' });
  db.setUserBanned(targetId, 0);
  db.clearUserMute(targetId);
  io.emit('mute:changed', { userId: targetId, mutedUntil: null });
  res.json({ ok: true });
});

// 手动清理磁盘孤儿文件（没人引用的上传文件直接物理删除）
app.post('/api/op/cleanup-files', requireAuth, requireOp, (req, res) => {
  const removed = sweepOrphanUploads();
  res.json({ ok: true, removed });
});

// 封号 = 永久封禁（保留账号）：无法登录，登录时弹出固定格式封号通知；只能手动解封
app.post('/api/op/ban', requireAuth, requireOp, (req, res) => {
  const targetId = Number(req.body && req.body.userId);
  const reason = String((req.body && req.body.reason) || '').trim().slice(0, 200);
  const target = Number.isInteger(targetId) ? db.getUserById(targetId) : null;
  if (!target) return res.status(404).json({ error: '用户不存在' });
  if (targetId === req.user.id) return res.status(400).json({ error: '不能封禁自己的账号' });
  if (req.user.role !== 'owner' && target.role === 'owner') {
    return res.status(403).json({ error: '无权封禁站主' });
  }
  if (target.banned) return res.status(400).json({ error: '该账号已被封禁' });

  // 保留账号：永久封禁 + 记录封号时间/执行人/原因
  db.setUserBan(targetId, { at: new Date().toISOString(), by: req.user.username, reason: reason || '违规' });
  db.deleteSessionsByUser(targetId);

  // 强制对方下线：通知后断开所有连接
  const sockets = onlineSockets.get(targetId);
  if (sockets) {
    for (const sid of sockets) {
      const s = io.sockets.sockets.get(sid);
      if (s) {
        s.emit('session:revoked', { reason: '账号已被永久封禁' });
        s.disconnect(true);
      }
    }
  }

  // 通知所有在线用户刷新列表（被封禁账号显示封禁状态）
  io.emit('roles:changed', {});
  notifyAdmins('system', '账号已封禁', `用户 ${target.username}（ID ${target.user_code}）已被永久封禁。原因：${reason || '未填写'}`);
  res.json({ ok: true, banned: true, bannedAt: new Date().toISOString(), bannedBy: req.user.username, bannedReason: reason || '违规' });
});

// 批量注销：一次处理多个账号（防止恶意注册刷号）
app.post('/api/op/ban-batch', requireAuth, requireOp, (req, res) => {
  const ids = Array.isArray(req.body && req.body.userIds)
    ? req.body.userIds.map(Number).filter(Number.isInteger)
    : [];
  if (ids.length === 0) return res.status(400).json({ error: '请选择要注销的用户' });
  const reason = String((req.body && req.body.reason) || '').trim().slice(0, 200);

  const deleted = [];
  const skipped = [];
  for (const targetId of ids) {
    const target = db.getUserById(targetId);
    if (!target) {
      skipped.push({ id: targetId, reason: '用户不存在' });
      continue;
    }
    if (targetId === req.user.id) {
      skipped.push({ id: targetId, reason: '不能注销自己' });
      continue;
    }
    if (req.user.role !== 'owner' && target.role === 'owner') {
      skipped.push({ id: targetId, reason: '不能注销站主' });
      continue;
    }

    const fileUrls = db.deleteUser(targetId);
    for (const url of fileUrls) deleteUploadedFile(url);
    const sockets = onlineSockets.get(targetId);
    if (sockets) {
      for (const sid of sockets) {
        const s = io.sockets.sockets.get(sid);
        if (s) {
          s.emit('session:revoked', { reason: '账号已被注销' });
          s.disconnect(true);
        }
      }
    }
    io.emit('user:deleted', { userId: targetId, username: target.username, reason: '批量注销' });
    notifyAdmins('system', '账号已注销', `用户 ${target.username}（ID ${target.user_code}）已被批量注销。原因：${reason || '未填写'}`);
    deleted.push(targetId);
  }
  res.json({ ok: true, deleted, skipped });
});

// 举报审核（管理员/站主）
app.get('/api/op/reports', requireAuth, requireOp, (req, res) => {
  res.json({ reports: db.listReports() });
});

app.get('/api/op/report/:id', requireAuth, requireOp, (req, res) => {
  const id = Number(req.params.id);
  const report = db.getReportById(id);
  if (!report) return res.status(404).json({ error: '举报不存在' });
  res.json({ report });
});

app.post('/api/op/report/:id/reply', requireAuth, requireOp, (req, res) => {
  const id = Number(req.params.id);
  const reply = String((req.body && req.body.reply) || '').trim().slice(0, 1000);
  const report = db.getReportById(id);
  if (!report) return res.status(404).json({ error: '举报不存在' });
  if (!reply) return res.status(400).json({ error: '回复内容不能为空' });
  const updated = db.replyReport(id, reply);
  db.markReportMailboxProcessed(id);
  db.addMailbox({
    userId: report.reporterId,
    kind: 'reply',
    title: '举报处理结果',
    body: `你举报的「${report.targetName}」已有处理结果：\n${reply}`,
    refId: id,
  });
  io.to(`user:${report.reporterId}`).emit('mailbox:new', {});
  res.json({ report: updated });
});

// 举报一键处理：reply 发给举报人，targetBody 发给被举报人；两者都为空 = 不做处理，不发任何邮件
app.post('/api/op/report/:id/resolve', requireAuth, requireOp, (req, res) => {
  const id = Number(req.params.id);
  const report = db.getReportById(id);
  if (!report) return res.status(404).json({ error: '举报不存在' });
  const reply = String((req.body && req.body.reply) || '').trim().slice(0, 1000);
  const targetBody = String((req.body && req.body.targetBody) || '').trim().slice(0, 1000);
  const targetTitle = String((req.body && req.body.targetTitle) || '').trim().slice(0, 60) || '账号处理通知';
  const removeContent = !!(req.body && req.body.removeContent);

  // 禁言/封号时：移除被举报的内容，并实时通知聊天双方刷新
  if (removeContent) {
    for (const mid of report.messageIds || []) {
      const msg = db.getMessageById(mid);
      if (!msg) continue;
      db.deleteMessage(mid);
      if (msg.type !== 'text' && /^\/api\/file\/[A-Za-z0-9._-]+$/.test(msg.content)) {
        const filePath = path.join(UPLOAD_DIR, path.basename(msg.content));
        try {
          if (filePath.startsWith(UPLOAD_DIR + path.sep)) fs.unlinkSync(filePath);
        } catch (_) {
          /* 文件可能已不存在，忽略 */
        }
      }
      io.to(`user:${msg.senderId}`).to(`user:${msg.receiverId}`).emit('message:deleted', { messageId: mid });
    }
  }

  db.replyReport(id, reply || null);
  db.markReportMailboxProcessed(id);
  if (reply) {
    db.addMailbox({
      userId: report.reporterId,
      kind: 'reply',
      title: '举报处理结果',
      body: reply,
      refId: id,
    });
    io.to(`user:${report.reporterId}`).emit('mailbox:new', {});
  }
  if (targetBody) {
    db.addMailbox({
      userId: report.targetUserId,
      kind: 'system',
      title: targetTitle,
      body: targetBody,
      refId: id,
    });
    io.to(`user:${report.targetUserId}`).emit('mailbox:new', {});
  }
  res.json({ ok: true });
});

app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请选择文件' });
  // 文件加密后落盘，磁盘上的内容不可直接查看
  const rawExt = path.extname(req.file.originalname || '').toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 10);
  const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${rawExt}.enc`;
  const encrypted = db.encryptFile(req.file.buffer);
  fs.writeFileSync(path.join(UPLOAD_DIR, name), encrypted.data);
  const type = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
  res.status(201).json({ url: `/api/file/${name}`, type });
});

app.get('/api/file/:name', requireAuth, (req, res) => {
  const name = req.params.name;
  if (!/^[A-Za-z0-9._-]+$/.test(name)) return res.status(400).json({ error: '非法文件名' });
  const filePath = path.join(UPLOAD_DIR, name);
  if (!filePath.startsWith(UPLOAD_DIR + path.sep)) return res.status(400).json({ error: '非法文件名' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' });
  try {
    const decrypted = db.decryptFile(fs.readFileSync(filePath));
    const ext = path.extname(name.replace(/\.enc$/, '')).toLowerCase();
    const mime = FILE_MIME_MAP[ext] || 'application/octet-stream';
    res.set('Content-Type', mime);
    res.set('Cache-Control', 'private, max-age=3600');
    res.send(decrypted);
  } catch (_) {
    res.status(500).json({ error: '文件解密失败' });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? '文件过大（最大 150MB）' : '上传失败：' + err.code;
    return res.status(400).json({ error: msg });
  }
  if (err && err.message) return res.status(400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: '服务器内部错误' });
});

// ---------- Socket.IO 实时通信 ----------
io.use((socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  const user = token ? db.getUserByToken(token) : null;
  if (!user || user.banned) return next(new Error('unauthorized'));
  socket.data.user = user;
  next();
});

io.on('connection', (socket) => {
  const user = socket.data.user;
  socket.join(`user:${user.id}`);
  addSocket(user.id, socket.id);
  broadcastPresence();

  socket.on('chat:send', (payload, ack) => {
    try {
      const receiverId = Number(payload && payload.receiverId);
      const type = payload.type === 'image' || payload.type === 'video' ? payload.type : 'text';
      const content = String(payload.content || '').trim();
      const meta = typeof payload.meta === 'string' && payload.meta.length <= 4000 ? payload.meta : null;

      if (!Number.isInteger(receiverId) || receiverId === user.id) throw new Error('无效的接收者');
      if (!db.getUserById(receiverId)) throw new Error('用户不存在');
      const me = db.getUserById(user.id);
      if (isUserMuted(me)) throw new Error(buildMuteMessage(me));
      if (type === 'text') {
        if (!content || content.length > 4000) throw new Error('消息内容无效');
      } else {
        if (!/^\/api\/file\/[A-Za-z0-9._-]+$/.test(content)) throw new Error('文件地址无效');
      }

      const message = db.saveMessage({ senderId: user.id, receiverId, type, content, meta });
      message.senderName = user.username;
      io.to(`user:${user.id}`).to(`user:${receiverId}`).emit('chat:message', { message });
      if (typeof ack === 'function') ack({ ok: true, message });
    } catch (err) {
      if (typeof ack === 'function') ack({ ok: false, error: err.message });
    }
  });

  socket.on('disconnect', () => {
    removeSocket(user.id, socket.id);
    broadcastPresence();
  });
});

server.listen(PORT, HOST, () => {
  const lanIp = getLanIPv4();
  console.log(`聊天应用已启动：http://localhost:${PORT}`);
  console.log(`局域网访问（手机/平板等同一 WiFi 设备）：http://${lanIp}:${PORT}`);
});

// 优雅关闭：Ctrl+C 时先断开连接、再正常落盘退出，确保数据不丢
function shutdown() {
  console.log('\n正在关闭服务器，保存数据…');
  io.close();
  server.close(() => {
    try {
      db.close();
    } catch (_) {
      /* 忽略 */
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 3000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// 定时检查临时禁言是否到期，到期自动解封并实时通知
setInterval(() => {
  const expiredIds = db.clearExpiredMutes(new Date().toISOString());
  for (const id of expiredIds) {
    io.emit('mute:changed', { userId: id, mutedUntil: null });
  }
}, 30000);

// 启动时 + 每小时清理一次磁盘孤儿文件，避免上传目录无限占用空间
setTimeout(sweepOrphanUploads, 1500);
setInterval(sweepOrphanUploads, 60 * 60 * 1000);
