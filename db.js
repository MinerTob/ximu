const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'chat.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------- 加密密钥 ----------
// 首次运行时自动生成并保存在 data/secret.key。
// 数据库里的消息和上传的文件都用这把钥匙加密，请勿删除该文件。
const SECRET_FILE = path.join(DATA_DIR, 'secret.key');

function loadSecretKey() {
  try {
    const key = fs.readFileSync(SECRET_FILE, 'utf8').trim();
    if (/^[0-9a-f]{64}$/.test(key)) return Buffer.from(key, 'hex');
  } catch (_) {
    /* 文件不存在时生成新密钥 */
  }
  const key = crypto.randomBytes(32);
  fs.writeFileSync(SECRET_FILE, key.toString('hex'));
  return key;
}

const SECRET_KEY = loadSecretKey();

// 文本加密：enc:v1:<iv>:<authTag>:<密文>，全部 base64
function encryptText(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', SECRET_KEY, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

function decryptText(stored) {
  if (typeof stored !== 'string' || !stored.startsWith('enc:v1:')) return stored;
  const parts = stored.split(':');
  if (parts.length !== 5) return '[无法解密的消息]';
  try {
    const iv = Buffer.from(parts[2], 'base64');
    const tag = Buffer.from(parts[3], 'base64');
    const data = Buffer.from(parts[4], 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', SECRET_KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch (_) {
    return '[无法解密的消息]';
  }
}

// 文件加密：文件内容 = iv(12) + authTag(16) + 密文
function encryptFile(buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', SECRET_KEY, iv);
  const enc = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return { data: Buffer.concat([iv, cipher.getAuthTag(), enc]) };
}

function decryptFile(buffer) {
  if (buffer.length < 28) throw new Error('文件数据损坏');
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const data = buffer.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', SECRET_KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

// ---------- 随机身份 ----------
const HANDLE_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';

function randomHandleGroup() {
  let s = '';
  for (let i = 0; i < 4; i++) {
    s += HANDLE_ALPHABET[crypto.randomInt(HANDLE_ALPHABET.length)];
  }
  return s;
}

function randomHandle() {
  return `${randomHandleGroup()}-${randomHandleGroup()}-${randomHandleGroup()}`;
}

function randomUserCode() {
  return crypto.randomInt(1000000000, 10000000000); // 10 位数字
}

// ---------- 建表 ----------
function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      user_code INTEGER UNIQUE NOT NULL,
      handle TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      banned INTEGER NOT NULL DEFAULT 0,
      banned_at TEXT,
      banned_by TEXT,
      banned_reason TEXT,
      bio TEXT NOT NULL DEFAULT '',
      avatar TEXT NOT NULL DEFAULT '',
      public_key TEXT,
      muted_until TEXT,
      muted_by TEXT,
      muted_reason TEXT,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      receiver_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL DEFAULT 'text',
      content TEXT NOT NULL,
      meta TEXT,
      recalled_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      reason TEXT NOT NULL,
      op_name TEXT NOT NULL,
      message_ids TEXT NOT NULL DEFAULT '[]',
      quote TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      read_at TEXT
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL REFERENCES users(id),
      target_user_id INTEGER NOT NULL REFERENCES users(id),
      message_ids TEXT NOT NULL DEFAULT '[]',
      evidence TEXT NOT NULL DEFAULT '',
      reason TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open',
      admin_reply TEXT,
      created_at TEXT NOT NULL,
      replied_at TEXT
    );

    CREATE TABLE IF NOT EXISTS mailbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      ref_id INTEGER,
      processed INTEGER NOT NULL DEFAULT 0,
      read_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      user_low INTEGER NOT NULL,
      user_high INTEGER NOT NULL,
      mode TEXT NOT NULL DEFAULT 'normal',
      PRIMARY KEY (user_low, user_high)
    );

    CREATE TABLE IF NOT EXISTS translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text_hash TEXT NOT NULL,
      lang_from TEXT NOT NULL,
      lang_to TEXT NOT NULL,
      result TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(text_hash, lang_from, lang_to)
    );

    CREATE TABLE IF NOT EXISTS email_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS qr_logins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      qr_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      user_id INTEGER,
      login_token TEXT,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      confirmed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id, receiver_id);
    CREATE INDEX IF NOT EXISTS idx_warnings_user ON warnings(user_id);
    CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_user_id);
    CREATE INDEX IF NOT EXISTS idx_mailbox_user ON mailbox(user_id);
    CREATE INDEX IF NOT EXISTS idx_email_codes_email ON email_codes(email);
    CREATE INDEX IF NOT EXISTS idx_qr_logins_token ON qr_logins(token);
  `);

  // 旧版本数据库升级：补充 user_code / handle 列
  ensureColumn('users', 'user_code', 'user_code INTEGER');
  ensureColumn('users', 'handle', 'handle TEXT');
  ensureColumn('users', 'role', "role TEXT NOT NULL DEFAULT 'user'");
  ensureColumn('users', 'banned', 'banned INTEGER NOT NULL DEFAULT 0');
  ensureColumn('users', 'banned_at', 'banned_at TEXT');
  ensureColumn('users', 'banned_by', 'banned_by TEXT');
  ensureColumn('users', 'banned_reason', 'banned_reason TEXT');
  ensureColumn('users', 'bio', "bio TEXT NOT NULL DEFAULT ''");
  ensureColumn('users', 'avatar', "avatar TEXT NOT NULL DEFAULT ''");
  ensureColumn('users', 'public_key', 'public_key TEXT');
  ensureColumn('messages', 'meta', 'meta TEXT');
  ensureColumn('users', 'muted_until', 'muted_until TEXT');
  ensureColumn('users', 'muted_by', 'muted_by TEXT');
  ensureColumn('users', 'muted_reason', 'muted_reason TEXT');
  ensureColumn('warnings', 'message_ids', "message_ids TEXT NOT NULL DEFAULT '[]'");
  ensureColumn('warnings', 'quote', "quote TEXT NOT NULL DEFAULT ''");
  ensureColumn('messages', 'recalled_at', 'recalled_at TEXT');
  ensureColumn('messages', 'forward_from', 'forward_from TEXT');
  ensureColumn('users', 'email', 'email TEXT');
  ensureColumn('mailbox', 'processed', 'processed INTEGER NOT NULL DEFAULT 0');

  // 消息已读状态：升级前的旧消息一律视为已读，之后新收到的消息才会计入未读
  const msgCols = db.prepare('PRAGMA table_info(messages)').all().map((c) => c.name);
  if (!msgCols.includes('read_at')) {
    db.exec('ALTER TABLE messages ADD COLUMN read_at TEXT');
    db.prepare('UPDATE messages SET read_at = created_at WHERE read_at IS NULL').run();
  }

  // 为旧用户回填随机身份
  const missing = db.prepare('SELECT id FROM users WHERE user_code IS NULL OR handle IS NULL').all();
  for (const row of missing) {
    db.prepare('UPDATE users SET user_code = ?, handle = ? WHERE id = ?').run(
      randomUserCode(),
      randomHandle(),
      row.id
    );
  }

  // QQ 群式权限：没有任何管理员时，最早的账号自动成为站主
  const ownerCount = db.prepare("SELECT COUNT(*) c FROM users WHERE role = 'owner'").get().c;
  if (ownerCount === 0) {
    const first = db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get();
    if (first) db.prepare("UPDATE users SET role = 'owner' WHERE id = ?").run(first.id);
  }

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_user_code ON users(user_code);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_handle ON users(handle);
  `);
}

function ensureColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
}

// ---------- 用户 ----------
function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 64).toString('hex');
}

function createUser(username, password, email = null) {
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const now = new Date().toISOString();

  // 随机数字 ID 和乱码身份，冲突时自动重试
  for (let i = 0; i < 5; i++) {
    const userCode = randomUserCode();
    const handle = randomHandle();
    try {
      const info = db
        .prepare(
          'INSERT INTO users (username, user_code, handle, role, password_hash, salt, email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .run(username, userCode, handle, 'user', passwordHash, salt, email, now);
      // 第一个注册的用户自动成为站主
      const ownerCount = db.prepare("SELECT COUNT(*) c FROM users WHERE role = 'owner'").get().c;
      if (ownerCount === 0) {
        db.prepare("UPDATE users SET role = 'owner' WHERE id = ?").run(info.lastInsertRowid);
      }
      return getUserById(info.lastInsertRowid);
    } catch (err) {
      if (!String(err.message).includes('UNIQUE')) throw err;
    }
  }
  throw new Error('生成用户标识失败，请重试');
}

const USER_COLUMNS =
  'id, username, user_code, handle, role, banned, banned_at, banned_by, banned_reason, bio, avatar, public_key, muted_until, muted_by, muted_reason, password_hash, salt, email, created_at';

function getUserByName(username) {
  return db.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE username = ?`).get(username);
}

function getUserByEmail(email) {
  return db.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE email = ?`).get(email);
}

function emailExists(email) {
  return !!db.prepare('SELECT id FROM users WHERE email = ?').get(email);
}

function getUserById(id) {
  return db
    .prepare(
      'SELECT id, username, user_code, handle, role, banned, banned_at, banned_by, banned_reason, bio, avatar, public_key, muted_until, muted_by, muted_reason, email, created_at FROM users WHERE id = ?'
    )
    .get(id);
}

function verifyPassword(user, password) {
  return user.password_hash === hashPassword(password, user.salt);
}

function listUsers() {
  return db
    .prepare(
      'SELECT id, username, user_code, handle, role, banned, banned_at, banned_by, banned_reason, bio, avatar, public_key, muted_until, muted_by, muted_reason, created_at FROM users ORDER BY id'
    )
    .all();
}

function setUserRole(userId, role) {
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
}

function setUserPublicKey(userId, publicKey) {
  db.prepare('UPDATE users SET public_key = ? WHERE id = ?').run(publicKey || null, userId);
}

function updateUserProfile(userId, fields) {
  const sets = [];
  const values = [];
  if (fields.username !== undefined) {
    sets.push('username = ?');
    values.push(fields.username);
  }
  if (fields.bio !== undefined) {
    sets.push('bio = ?');
    values.push(fields.bio);
  }
  if (fields.avatar !== undefined) {
    sets.push('avatar = ?');
    values.push(fields.avatar);
  }
  if (sets.length === 0) return;
  values.push(userId);
  db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...values);
}

function usernameExists(username, excludeId) {
  const row = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, excludeId || -1);
  return !!row;
}

function setUserBanned(userId, banned) {
  if (banned) {
    db.prepare('UPDATE users SET banned = 1, banned_at = ?, banned_by = ?, banned_reason = ? WHERE id = ?').run(
      new Date().toISOString(),
      '',
      '',
      userId
    );
  } else {
    db.prepare('UPDATE users SET banned = 0, banned_at = NULL, banned_by = NULL, banned_reason = NULL WHERE id = ?').run(
      userId
    );
  }
}

function setUserBan(userId, { at, by, reason }) {
  db.prepare('UPDATE users SET banned = 1, banned_at = ?, banned_by = ?, banned_reason = ? WHERE id = ?').run(
    at,
    by,
    reason,
    userId
  );
}

function clearUserBan(userId) {
  db.prepare('UPDATE users SET banned = 0, banned_at = NULL, banned_by = NULL, banned_reason = NULL WHERE id = ?').run(
    userId
  );
}

function deleteSessionsByUser(userId) {
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

// 彻底注销账号：删除账号及其全部会话、警告、聊天记录（含收到的），
// 返回该账号涉及的上传文件地址，供服务器清理磁盘文件
function deleteUser(userId) {
  const fileRows = db
    .prepare("SELECT content FROM messages WHERE type != 'text' AND (sender_id = ? OR receiver_id = ?)")
    .all(userId, userId);
  db.prepare('DELETE FROM warnings WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?').run(userId, userId);
  db.prepare('DELETE FROM reports WHERE reporter_id = ? OR target_user_id = ?').run(userId, userId);
  db.prepare('DELETE FROM mailbox WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  return fileRows.map((r) => r.content);
}

// 会话模式：normal = 普通消息（管理员可审），secret = 端到端加密（管理员不可见）
function pairKey(a, b) {
  return a < b ? [a, b] : [b, a];
}

function getConversationMode(userA, userB) {
  const [low, high] = pairKey(userA, userB);
  const row = db
    .prepare('SELECT mode FROM conversations WHERE user_low = ? AND user_high = ?')
    .get(low, high);
  return row ? row.mode : 'normal';
}

function setConversationMode(userA, userB, mode) {
  const [low, high] = pairKey(userA, userB);
  db.prepare(
    'INSERT INTO conversations (user_low, user_high, mode) VALUES (?, ?, ?) ' +
      'ON CONFLICT(user_low, user_high) DO UPDATE SET mode = excluded.mode'
  ).run(low, high, mode);
}

function setUserMute(userId, { until, by, reason }) {
  db.prepare('UPDATE users SET muted_until = ?, muted_by = ?, muted_reason = ? WHERE id = ?').run(
    until,
    by,
    reason,
    userId
  );
}

function clearUserMute(userId) {
  db.prepare('UPDATE users SET muted_until = NULL, muted_by = NULL, muted_reason = NULL WHERE id = ?').run(userId);
}

// 找出并清除已到期的临时禁言，返回被自动解封的用户 id
function clearExpiredMutes(nowIso) {
  const rows = db
    .prepare(
      "SELECT id FROM users WHERE muted_until IS NOT NULL AND muted_until != 'forever' AND muted_until <= ?"
    )
    .all(nowIso);
  if (rows.length > 0) {
    const ph = rows.map(() => '?').join(',');
    db.prepare(
      `UPDATE users SET muted_until = NULL, muted_by = NULL, muted_reason = NULL WHERE id IN (${ph})`
    ).run(...rows.map((r) => r.id));
  }
  return rows.map((r) => r.id);
}

// ---------- 会话 ----------
function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date().toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)').run(token, userId, now);
  return token;
}

function getUserByToken(token) {
  const row = db
    .prepare(
      `SELECT u.id, u.username, u.user_code, u.handle, u.role, u.banned, u.banned_at, u.banned_by, u.banned_reason, u.bio, u.avatar, u.public_key, u.muted_until, u.muted_by, u.muted_reason FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(token);
  return row || null;
}

function deleteSession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// ---------- 消息 ----------
function saveMessage({ senderId, receiverId, type, content, meta = null, forwardFrom = null }) {
  const now = new Date().toISOString();
  // 文本消息加密后入库；文件消息存的是文件地址，文件本体已加密
  const stored = type === 'text' ? encryptText(content) : content;
  const info = db
    .prepare(
      'INSERT INTO messages (sender_id, receiver_id, type, content, meta, forward_from, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(senderId, receiverId, type, stored, meta, forwardFrom, now);
  const row = db
    .prepare(
      'SELECT id, sender_id, receiver_id, type, content, meta, recalled_at, read_at, forward_from, created_at FROM messages WHERE id = ?'
    )
    .get(info.lastInsertRowid);
  const msg = serializeMessage(row);
  if (msg.type === 'text') msg.content = decryptText(msg.content);
  return msg;
}

function serializeMessage(row) {
  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    type: row.type,
    content: row.content,
    meta: row.meta || null,
    recalledAt: row.recalled_at || null,
    readAt: row.read_at || null,
    forwardFrom: row.forward_from || null,
    createdAt: row.created_at,
  };
}

// 标记对方发给我的消息为已读，返回本次新标记的数量
function markConversationRead(readerId, partnerId, at) {
  const info = db
    .prepare('UPDATE messages SET read_at = ? WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL')
    .run(at, partnerId, readerId);
  return info.changes;
}

// 对方发给我但还没读的消息数量（离线期间收到的消息也会计入）
function unreadCountFor(userId, otherId) {
  return db
    .prepare('SELECT COUNT(*) c FROM messages WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL')
    .get(otherId, userId).c;
}

// 撤回消息：内容物理抹除（媒体文件由服务器一并从磁盘删除），
// 但保留一个几字节的「撤回标记」，让双方刷新后仍能看到「撤回了一条消息」
function recallMessage(id) {
  const row = db
    .prepare(
      'SELECT id, sender_id, receiver_id, type, content, meta, recalled_at, read_at, forward_from, created_at FROM messages WHERE id = ?'
    )
    .get(id);
  if (!row) return null;
  const fileUrl =
    row.type !== 'text' && typeof row.content === 'string' && /^\/api\/file\/[A-Za-z0-9._-]+$/.test(row.content)
      ? row.content
      : null;
  const now = new Date().toISOString();
  db.prepare(
    "UPDATE messages SET type = 'text', content = ?, meta = NULL, recalled_at = ?, read_at = COALESCE(read_at, ?) WHERE id = ?"
  ).run(encryptText(''), now, now, id);
  const updatedRow = db
    .prepare(
      'SELECT id, sender_id, receiver_id, type, content, meta, recalled_at, read_at, forward_from, created_at FROM messages WHERE id = ?'
    )
    .get(id);
  const updated = serializeMessage(updatedRow);
  if (updated.type === 'text') updated.content = decryptText(updated.content);
  return { message: updated, fileUrl };
}

function getConversation(userA, userB, limit = 100) {
  const rows = db
    .prepare(
      `SELECT id, sender_id, receiver_id, type, content, meta, recalled_at, read_at, forward_from, created_at,
              (SELECT username FROM users WHERE id = messages.sender_id) AS sender_name
       FROM messages
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
       ORDER BY id DESC LIMIT ?`
    )
    .all(userA, userB, userB, userA, limit);
  const messages = rows.reverse().map((row) => {
    const msg = serializeMessage(row);
    msg.senderName = row.sender_name;
    if (msg.type === 'text') msg.content = decryptText(msg.content);
    return msg;
  });
  return messages;
}

function getMessageById(id) {
  const row = db
    .prepare(
      'SELECT id, sender_id, receiver_id, type, content, meta, recalled_at, read_at, forward_from, created_at FROM messages WHERE id = ?'
    )
    .get(id);
  return row ? serializeMessage(row) : null;
}

function deleteMessage(id) {
  return db.prepare('DELETE FROM messages WHERE id = ?').run(id).changes;
}

// 统计所有仍被引用的上传文件（聊天媒体 + 头像），用于清理磁盘孤儿文件
function listReferencedUploads() {
  const msgs = db.prepare("SELECT content AS url FROM messages WHERE type != 'text'").all();
  const avatars = db.prepare("SELECT avatar AS url FROM users WHERE avatar LIKE '/api/file/%'").all();
  return msgs
    .concat(avatars)
    .map((r) => r.url)
    .filter((u) => typeof u === 'string' && /^\/api\/file\/[A-Za-z0-9._-]+$/.test(u));
}

// ---------- 违规警告 ----------
function addWarning({ userId, reason, opName, messageIds = [], quote = '' }) {
  const now = new Date().toISOString();
  const info = db
    .prepare(
      'INSERT INTO warnings (user_id, reason, op_name, message_ids, quote, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(userId, reason, opName, JSON.stringify(messageIds), quote, now);
  return getWarningById(info.lastInsertRowid);
}

function getWarningById(id) {
  const row = db
    .prepare('SELECT id, user_id, reason, op_name, message_ids, quote, created_at, read_at FROM warnings WHERE id = ?')
    .get(id);
  return row ? serializeWarning(row) : null;
}

function serializeWarning(row) {
  let messageIds = [];
  try {
    messageIds = JSON.parse(row.message_ids || '[]');
  } catch (_) {
    /* 忽略格式错误 */
  }
  return {
    id: row.id,
    userId: row.user_id,
    reason: row.reason,
    opName: row.op_name,
    messageIds,
    quote: row.quote || '',
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

function getWarningsByUser(userId, limit = 50) {
  return db
    .prepare(
      'SELECT id, user_id, reason, op_name, message_ids, quote, created_at, read_at FROM warnings WHERE user_id = ? ORDER BY id DESC LIMIT ?'
    )
    .all(userId, limit)
    .map(serializeWarning);
}

function getUnreadWarningsCount(userId) {
  return db.prepare('SELECT COUNT(*) c FROM warnings WHERE user_id = ? AND read_at IS NULL').get(userId).c;
}

function markWarningsRead(userId) {
  const now = new Date().toISOString();
  db.prepare('UPDATE warnings SET read_at = ? WHERE user_id = ? AND read_at IS NULL').run(now, userId);
}

// 删除警告，返回被警告的用户 id（用于实时通知）；不存在返回 null
function deleteWarning(id) {
  const row = db.prepare('SELECT user_id FROM warnings WHERE id = ?').get(id);
  if (!row) return null;
  db.prepare('DELETE FROM warnings WHERE id = ?').run(id);
  return row.user_id;
}

// ---------- 管理统计 ----------
function getUserStats() {
  return db
    .prepare(
      `SELECT u.id, u.username, u.user_code, u.handle, u.role, u.banned, u.banned_at, u.banned_by, u.banned_reason, u.bio, u.avatar, u.public_key, u.muted_until, u.muted_by, u.muted_reason, u.created_at,
        (SELECT COUNT(*) FROM messages m WHERE m.sender_id = u.id OR m.receiver_id = u.id) AS msg_count,
        (SELECT MAX(m.created_at) FROM messages m WHERE m.sender_id = u.id OR m.receiver_id = u.id) AS last_active,
        (SELECT COUNT(*) FROM warnings w WHERE w.user_id = u.id) AS warning_count
       FROM users u ORDER BY u.id`
    )
    .all();
}

function getUserMessages(userId, limit = 200) {
  const rows = db
    .prepare(
      `SELECT id, sender_id, receiver_id, type, content, meta, recalled_at, read_at, forward_from, created_at,
        (SELECT username FROM users WHERE id = sender_id) AS sender_name,
        (SELECT username FROM users WHERE id = receiver_id) AS receiver_name
       FROM messages
       WHERE sender_id = ? OR receiver_id = ?
       ORDER BY id DESC LIMIT ?`
    )
    .all(userId, userId, limit);
  return rows.reverse().map((row) => {
    const msg = serializeMessage(row);
    msg.senderName = row.sender_name;
    msg.receiverName = row.receiver_name;
    if (msg.type === 'text') msg.content = decryptText(msg.content);
    return msg;
  });
}

function close() {
  db.close();
}

// ---------- 举报与邮件箱 ----------
function addReport({ reporterId, targetUserId, messageIds, evidence, reason }) {
  const now = new Date().toISOString();
  const info = db
    .prepare(
      'INSERT INTO reports (reporter_id, target_user_id, message_ids, evidence, reason, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(reporterId, targetUserId, JSON.stringify(messageIds), evidence, reason, 'open', now);
  return getReportById(info.lastInsertRowid);
}

function getReportById(id) {
  const row = db
    .prepare(
      `SELECT r.*, u1.username AS reporter_name, u2.username AS target_name
       FROM reports r
       JOIN users u1 ON u1.id = r.reporter_id
       JOIN users u2 ON u2.id = r.target_user_id
       WHERE r.id = ?`
    )
    .get(id);
  return row ? serializeReport(row) : null;
}

function serializeReport(row) {
  let messageIds = [];
  try {
    messageIds = JSON.parse(row.message_ids || '[]');
  } catch (_) {
    /* 忽略 */
  }
  return {
    id: row.id,
    reporterId: row.reporter_id,
    reporterName: row.reporter_name,
    targetUserId: row.target_user_id,
    targetName: row.target_name,
    messageIds,
    evidence: row.evidence || '',
    reason: row.reason || '',
    status: row.status,
    adminReply: row.admin_reply || null,
    createdAt: row.created_at,
    repliedAt: row.replied_at || null,
  };
}

function listReports(limit = 200) {
  const rows = db
    .prepare(
      `SELECT r.*, u1.username AS reporter_name, u2.username AS target_name
       FROM reports r
       JOIN users u1 ON u1.id = r.reporter_id
       JOIN users u2 ON u2.id = r.target_user_id
       ORDER BY r.id DESC LIMIT ?`
    )
    .all(limit);
  return rows.map(serializeReport);
}

function replyReport(id, reply) {
  const now = new Date().toISOString();
  db.prepare("UPDATE reports SET status = 'reviewed', admin_reply = ?, replied_at = ? WHERE id = ?").run(reply, now, id);
  return getReportById(id);
}

function getAdminUserIds() {
  return db.prepare("SELECT id FROM users WHERE role IN ('owner','admin')").all().map((r) => r.id);
}

function addMailbox({ userId, kind, title, body, refId = null }) {
  const now = new Date().toISOString();
  const info = db
    .prepare('INSERT INTO mailbox (user_id, kind, title, body, ref_id, processed, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)')
    .run(userId, kind, title, body, refId, now);
  return getMailboxItem(info.lastInsertRowid);
}

function getMailboxItem(id) {
  const row = db.prepare('SELECT * FROM mailbox WHERE id = ?').get(id);
  return row ? serializeMailbox(row) : null;
}

function serializeMailbox(row) {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    refId: row.ref_id || null,
    processed: !!row.processed,
    readAt: row.read_at || null,
    createdAt: row.created_at,
  };
}

function getMailbox(userId, limit = 100) {
  const rows = db.prepare('SELECT * FROM mailbox WHERE user_id = ? ORDER BY id DESC LIMIT ?').all(userId, limit);
  return rows.map(serializeMailbox);
}

function unreadMailboxCount(userId) {
  return db.prepare('SELECT COUNT(*) c FROM mailbox WHERE user_id = ? AND read_at IS NULL').get(userId).c;
}

function markMailboxRead(userId) {
  const now = new Date().toISOString();
  db.prepare('UPDATE mailbox SET read_at = ? WHERE user_id = ? AND read_at IS NULL').run(now, userId);
}

function deleteMailbox(userId, id) {
  // 只删除该收件人自己的这封邮件；举报记录和处罚结果不受影响
  const info = db.prepare('DELETE FROM mailbox WHERE id = ? AND user_id = ?').run(id, userId);
  return info.changes > 0;
}

function markReportMailboxProcessed(reportId) {
  db.prepare("UPDATE mailbox SET processed = 1 WHERE kind = 'report' AND ref_id = ?").run(reportId);
}

// 翻译结果缓存（按原文哈希 + 语言对去重，避免重复调用翻译服务）
function getTranslation(text, from, to) {
  const hash = crypto.createHash('sha256').update(String(text)).digest('hex');
  const row = db
    .prepare('SELECT result FROM translations WHERE text_hash = ? AND lang_from = ? AND lang_to = ?')
    .get(hash, from, to);
  return row ? row.result : null;
}

function saveTranslation(text, from, to, result) {
  const hash = crypto.createHash('sha256').update(String(text)).digest('hex');
  db.prepare(
    'INSERT INTO translations (text_hash, lang_from, lang_to, result, created_at) VALUES (?, ?, ?, ?, ?) ' +
      'ON CONFLICT(text_hash, lang_from, lang_to) DO UPDATE SET result = excluded.result'
  ).run(hash, from, to, result, new Date().toISOString());
}

// ---------- 邮箱验证码 ----------
function createEmailCode(email, code, expiresAt) {
  db.prepare('INSERT INTO email_codes (email, code, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
    email,
    code,
    expiresAt,
    new Date().toISOString()
  );
}

function latestEmailCodeTime(email) {
  const row = db.prepare('SELECT created_at FROM email_codes WHERE email = ? ORDER BY id DESC LIMIT 1').get(email);
  return row ? row.created_at : null;
}

// 校验验证码：取该邮箱最新一条未使用且未过期的记录
function consumeEmailCode(email, code, nowIso) {
  const row = db
    .prepare(
      'SELECT id FROM email_codes WHERE email = ? AND code = ? AND used_at IS NULL AND expires_at > ? ORDER BY id DESC LIMIT 1'
    )
    .get(email, code, nowIso);
  if (!row) return false;
  db.prepare('UPDATE email_codes SET used_at = ? WHERE id = ?').run(nowIso, row.id);
  return true;
}

// ---------- 二维码登录 ----------
function createQrLogin(token, qrUrl, expiresAt) {
  db.prepare('INSERT INTO qr_logins (token, qr_url, status, created_at, expires_at) VALUES (?, ?, ?, ?, ?)').run(
    token,
    qrUrl,
    'pending',
    new Date().toISOString(),
    expiresAt
  );
}

function getQrLogin(token) {
  return db.prepare('SELECT * FROM qr_logins WHERE token = ?').get(token);
}

function confirmQrLogin(token, userId, loginToken, confirmedAt) {
  db.prepare("UPDATE qr_logins SET status = 'confirmed', user_id = ?, login_token = ?, confirmed_at = ? WHERE token = ?").run(
    userId,
    loginToken,
    confirmedAt,
    token
  );
}

function deleteExpiredQrLogins(nowIso) {
  db.prepare('DELETE FROM qr_logins WHERE expires_at < ?').run(nowIso);
}

module.exports = {
  init,
  encryptText,
  decryptText,
  encryptFile,
  decryptFile,
  createUser,
  getUserByName,
  getUserByEmail,
  emailExists,
  getUserById,
  setUserRole,
  setUserPublicKey,
  updateUserProfile,
  usernameExists,
  setUserBanned,
  setUserBan,
  clearUserBan,
  deleteSessionsByUser,
  deleteUser,
  getConversationMode,
  setConversationMode,
  setUserMute,
  clearUserMute,
  clearExpiredMutes,
  verifyPassword,
  listUsers,
  createSession,
  getUserByToken,
  deleteSession,
  saveMessage,
  getConversation,
  getMessageById,
  deleteMessage,
  recallMessage,
  listReferencedUploads,
  markConversationRead,
  unreadCountFor,
  addWarning,
  getWarningsByUser,
  getUnreadWarningsCount,
  markWarningsRead,
  deleteWarning,
  getUserStats,
  getUserMessages,
  addReport,
  getReportById,
  listReports,
  replyReport,
  getAdminUserIds,
  addMailbox,
  getMailbox,
  unreadMailboxCount,
  markMailboxRead,
  deleteMailbox,
  markReportMailboxProcessed,
  getTranslation,
  saveTranslation,
  createEmailCode,
  latestEmailCodeTime,
  consumeEmailCode,
  createQrLogin,
  getQrLogin,
  confirmQrLogin,
  deleteExpiredQrLogins,
  close,
};
