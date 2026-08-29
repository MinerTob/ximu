/* ---------- 状态 ---------- */
const APP_VERSION = '5.4.4';
console.log(`析木聊天室 v${APP_VERSION}`);

const state = {
  token: getToken(),
  me: null,
  users: [],
  onlineUserIds: new Set(),
  selectedUserId: null,
  conversation: [], // 当前对话
  conversationLoaded: false,
  pendingMessages: [], // 对话加载期间到达的新消息
  unread: new Map(), // userId -> 未读数量
  myWarnings: [],
  unreadWarnings: 0,
  adminUsers: [],
  selectedAdminUserId: null,
  currentAdminUser: null,
  adminMessages: [],
  adminSelected: new Set(),
  adminUserSelected: new Set(),
  muteTarget: null,
  muteMode: 'mute',
  reportMode: false,
  reportSelected: new Set(),
  mailbox: { items: [], unread: 0 },
  mailSelected: null,
  reportPending: null,
  forwardTarget: null,
  socket: null,
};

// 弹窗层级：最新打开的弹窗永远在最上层
let modalZTop = 200;
function bringToFront(el) {
  el.style.zIndex = ++modalZTop;
}

// 选项按钮（圆角矩形文字按钮）：点选高亮，选「其他」时弹出输入框
function bindOptChips(el, otherInput) {
  el.addEventListener('click', (e) => {
    const btn = e.target.closest('.opt-chip');
    if (!btn) return;
    el.querySelectorAll('.opt-chip').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    if (otherInput) otherInput.classList.toggle('hidden', btn.dataset.value !== 'other');
  });
}

function resetOptChips(el, otherInput) {
  el.querySelectorAll('.opt-chip').forEach((b) => b.classList.remove('active'));
  if (otherInput) {
    otherInput.value = '';
    otherInput.classList.add('hidden');
  }
}

function selectedOptValue(el) {
  const btn = el.querySelector('.opt-chip.active');
  return btn ? btn.dataset.value : '';
}

function selectedOptLabel(el) {
  const btn = el.querySelector('.opt-chip.active');
  return btn ? btn.textContent.trim() : '';
}

// 登录状态：本标签页会话优先（支持一台电脑多开），其次才是“记住登录”
function getToken() {
  return sessionStorage.getItem('chat_token') || localStorage.getItem('chat_token') || null;
}

function setToken(token, remember) {
  sessionStorage.setItem('chat_token', token);
  if (remember) localStorage.setItem('chat_token', token);
  else localStorage.removeItem('chat_token');
}

function clearToken() {
  sessionStorage.removeItem('chat_token');
  localStorage.removeItem('chat_token');
}

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);
const authView = $('auth-view');
const chatView = $('chat-view');
const usernameInput = $('username');
const passwordInput = $('password');
const emailField = $('email-field');
const emailInput = $('email');
const codeField = $('code-field');
const verifyCodeInput = $('verify-code');
const sendCodeBtn = $('send-code-btn');
const qrLoginLink = $('qr-login-link');
const qrLoginPanel = $('qr-login-panel');
const qrLoginImage = $('qr-login-image');
const qrExpireText = $('qr-expire-text');
const qrRefresh = $('qr-refresh');
const qrBack = $('qr-back');
const profileScanBtn = $('profile-scan-btn');
const scanModal = $('scan-modal');
const scanVideo = $('scan-video');
const scanCanvas = $('scan-canvas');
const scanUpload = $('scan-upload');
const scanClose = $('scan-close');
const scanFile = $('scan-file');
const authForm = $('auth-form');
const authError = $('auth-error');
const authSubmit = $('auth-submit');
const tabLogin = $('tab-login');
const tabRegister = $('tab-register');
const myAvatar = $('my-avatar');
const myName = $('my-name');
const myId = $('my-id');
const adminBtn = $('admin-btn');
const logoutBtn = $('logout-btn');
const searchInput = $('search');
const userList = $('user-list');
const chatAvatar = $('chat-avatar');
const chatName = $('chat-name');
const chatStatus = $('chat-status');
const chatId = $('chat-id');
const backBtn = $('back-btn');
const messagesEl = $('messages');
const emptyHint = $('empty-hint');
const uploadHint = $('upload-hint');
const jumpPill = $('jump-pill');
const messageInput = $('message-input');
const fileInput = $('file-input');
const sendBtn = $('send-btn');
const toastEl = $('toast');
const lightbox = $('lightbox');
const lightboxImg = $('lightbox-img');
const warningBanner = $('warning-banner');
const warningCount = $('warning-count');
const warningBannerClose = $('warning-banner-close');
const warningModal = $('warning-modal');
const warningList = $('warning-list');
const warningOk = $('warning-ok');
const myMuteBanner = $('my-mute-banner');
const muteModal = $('mute-modal');
const muteTabs = $('mute-tabs');
const muteCustom = $('mute-custom');
const muteQuick = $('mute-quick');
const muteReasonOpts = $('mute-reason-opts');
const muteReasonOther = $('mute-reason-other');
const muteCancel = $('mute-cancel');
const muteConfirm = $('mute-confirm');
const profileBtn = $('profile-btn');
const profileView = $('profile-view');
const profileAvatar = $('profile-avatar');
const profileUploadBtn = $('profile-upload-btn');
const profileFile = $('profile-file');
const profileEmojis = $('profile-emojis');
const profileUsername = $('profile-username');
const profileBio = $('profile-bio');
const profileMeta = $('profile-meta');
const profileCancel = $('profile-cancel');
const profileSave = $('profile-save');
const admBatchBar = $('adm-batch-bar');
const admBatchCount = $('adm-batch-count');
const admBatchBan = $('adm-batch-ban');
const reportBtn = $('report-btn');
const reportBar = $('report-bar');
const reportCount = $('report-count');
const reportSend = $('report-send');
const reportCancelMode = $('report-cancel-mode');
const reportModal = $('report-modal');
const reportTarget = $('report-target');
const reportEvidence = $('report-evidence');
const reportReasonOpts = $('report-reason-opts');
const reportReasonOther = $('report-reason-other');
const reportCancel = $('report-cancel');
const reportSubmit = $('report-submit');
const mailboxBtn = $('mailbox-btn');
const mailboxBadge = $('mailbox-badge');
const mailboxView = $('mailbox-view');
const mailboxClose = $('mailbox-close');
const mailboxList = $('mailbox-list');
const banNoticeModal = $('ban-notice-modal');
const banNoticeText = $('ban-notice-text');
const banNoticeClose = $('ban-notice-close');
/* ---------- 多语言 ---------- */
function syncLangSelects() {
  const lang = I18N.getLang();
  document.querySelectorAll('.lang-select').forEach((sel) => {
    sel.value = lang;
  });
}

function onLangSelect(e) {
  I18N.setLang(e.target.value);
  syncLangSelects();
  refreshLangUI();
}

function refreshLangUI() {
  const isAdmin = state.me && (state.me.role === 'owner' || state.me.role === 'admin');
  $('mailbox-title').textContent = isAdmin ? I18N.t('adminMailbox') : I18N.t('mailboxButton');
  renderUserList();
  updateChatHead();
  if (state.reportMode) updateReportBar();
  if (state.me && state.me.role !== 'user') renderAdminUsers();
  if (state.currentAdminUser) refreshAdminHeadButtons(state.currentAdminUser);
  if (!mailboxView.classList.contains('hidden')) renderMailbox();
}

document.querySelectorAll('.lang-select').forEach((sel) => {
  sel.value = I18N.getLang();
  sel.addEventListener('change', onLangSelect);
});
window.afterLangChange = refreshLangUI;
const userProfileView = $('user-profile-view');
const upAvatar = $('up-avatar');
const upName = $('up-name');
const upStatus = $('up-status');
const upMeta = $('up-meta');
const upBio = $('up-bio');
const upClose = $('up-close');
const msgMenu = $('msg-menu');
const msgMenuRecall = $('msg-menu-recall');
const msgMenuForward = $('msg-menu-forward');
const msgMenuCancel = $('msg-menu-cancel');
const forwardModal = $('forward-modal');
const forwardSelect = $('forward-select');
const forwardCancel = $('forward-cancel');
const forwardSubmit = $('forward-submit');
const adminView = $('admin-view');
const adminClose = $('admin-close');
const adminSearch = $('admin-search');
const adminUserList = $('admin-user-list');
const adminDetail = $('admin-detail');

/* ---------- 移动端切换 ---------- */
const mobileQuery = window.matchMedia('(max-width: 768px)');
let mobileMode = mobileQuery.matches;

function updateMobileMode() {
  mobileMode = mobileQuery.matches;
  if (!mobileMode) {
    chatView.classList.remove('chat-open');
    backBtn.classList.add('hidden');
    const panel = document.querySelector('.admin-panel');
    if (panel) panel.classList.remove('admin-detail-open');
  }
}

mobileQuery.addEventListener('change', updateMobileMode);
backBtn.addEventListener('click', () => {
  chatView.classList.remove('chat-open');
  backBtn.classList.add('hidden');
});

const AVATAR_COLORS = [
  'linear-gradient(135deg,#4c7dff,#8b5cf6)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#0ea5e9)',
  'linear-gradient(135deg,#ec4899,#f97316)',
  'linear-gradient(135deg,#6366f1,#22d3ee)',
  'linear-gradient(135deg,#84cc16,#10b981)',
];

function avatarStyle(name) {
  let hash = 0;
  for (const ch of String(name)) hash = (hash * 31 + ch.codePointAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initialOf(name) {
  return String(name).trim().charAt(0).toUpperCase();
}

function roleSuffix(role) {
  if (role === 'owner') return '（站主）';
  if (role === 'admin') return '（OP）';
  return '';
}

function displayName(user) {
  return user ? String(user.username) + roleSuffix(user.role) : '';
}

function setAvatar(el, name) {
  el.textContent = initialOf(name);
  el.style.background = avatarStyle(name);
}

// 渲染头像：支持上传的图片（/api/file/…）或表情
function renderAvatar(el, user) {
  setAvatar(el, user.username);
  if (!user.avatar) return;
  if (/^\/api\/file\//.test(user.avatar)) {
    resolveMediaUrl(user.avatar)
      .then((url) => {
        el.textContent = '';
        el.style.background = 'transparent';
        el.innerHTML = '';
        const img = document.createElement('img');
        img.src = url;
        img.alt = '头像';
        el.appendChild(img);
      })
      .catch(() => {});
  } else {
    el.textContent = user.avatar;
  }
}

let toastTimer = null;
function toast(text) {
  toastEl.textContent = text;
  toastEl.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2600);
}

// 图片灯箱：点击图片全屏查看，点任意处关闭
function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.classList.remove('hidden');
  bringToFront(lightbox);
}

lightbox.addEventListener('click', () => lightbox.classList.add('hidden'));

const SERVER_ERR_ZH = {
  '用户名需为 2-20 位中文、字母、数字、下划线或短横线': 'usernameInvalid',
  '密码长度需为 4-64 位': 'passwordInvalid',
  '该用户名已被占用': 'usernameTaken',
  '用户名或密码错误': 'wrongCred',
  '该账号已被封禁，无法登录': 'bannedLogin',
  '未登录或登录已过期': 'notLoggedIn',
  '内容不能为空': 'emptyContent',
  '超过 2 分钟，无法撤回': 'recallTimeout',
  '不能撤回别人发送的消息': 'noRecallOther',
  '不能禁言自己': 'noSelfMute',
  '不能封禁自己的账号': 'noSelfBan',
  '不能举报自己': 'noSelfReport',
  '请选择要检举的消息': 'selectReportMsg',
  '包含无效的举报消息': 'badReportMsg',
  '邮箱格式不正确': 'emailInvalid',
  '该邮箱已被注册': 'emailTaken',
  '请输入 6 位数字验证码': 'badCode',
  '验证码错误或已过期': 'codeExpired',
  '发送太频繁，请 60 秒后再试': 'codeFrequent',
};

function translateServerError(msg) {
  const key = SERVER_ERR_ZH[msg];
  return key ? I18N.t(key) : msg;
}

function toastErr(msg) {
  toast(translateServerError(msg));
}

/* ---------- 视图切换 ---------- */
function showAuth() {
  chatView.classList.add('hidden');
  authView.classList.remove('hidden');
  stopQrPolling();
  stopCamera();
  if (state.socket) {
    state.socket.disconnect();
    state.socket = null;
  }
}

function showChat() {
  authView.classList.add('hidden');
  chatView.classList.remove('hidden');
  myName.textContent = displayName(state.me);
  myId.textContent = `ID ${state.me.userCode} · ${state.me.handle}`;
  adminBtn.classList.toggle('hidden', state.me.role === 'user');
  renderAvatar(myAvatar, state.me);
  loadUsers();
  connectSocket();
  loadMyWarnings();
  applyMyMute();
  loadMailbox();
}

/* ---------- 登录 / 注册 ---------- */
let authMode = 'login';

function setAuthMode(mode) {
  authMode = mode;
  const isLogin = mode === 'login';
  tabLogin.classList.toggle('active', isLogin);
  tabRegister.classList.toggle('active', !isLogin);
  authSubmit.textContent = I18N.t(isLogin ? 'loginBtn' : 'registerBtn');
  passwordInput.autocomplete = isLogin ? 'current-password' : 'new-password';
  emailField.classList.toggle('hidden', isLogin);
  codeField.classList.toggle('hidden', isLogin);
  clearInterval(sendCodeTimer);
  sendCodeBtn.disabled = false;
  sendCodeBtn.textContent = I18N.t('sendCode');
  stopQrPolling();
  if (qrCountdownTimer) clearInterval(qrCountdownTimer);
  qrLoginPanel.classList.add('hidden');
  authForm.classList.remove('hidden');
  qrLoginLink.classList.toggle('hidden', !isLogin);
  authError.classList.add('hidden');
}

tabLogin.addEventListener('click', () => setAuthMode('login'));
tabRegister.addEventListener('click', () => setAuthMode('register'));

let sendCodeTimer = null;
sendCodeBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showAuthError('邮箱格式不正确');
  sendCodeBtn.disabled = true;
  try {
    const res = await fetch('/api/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(translateServerError(data.error || '发送失败'));
    toast(I18N.t('codeSent'));
    let left = 60;
    sendCodeBtn.textContent = `${left}s`;
    clearInterval(sendCodeTimer);
    sendCodeTimer = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(sendCodeTimer);
        sendCodeBtn.disabled = false;
        sendCodeBtn.textContent = I18N.t('sendCode');
      } else {
        sendCodeBtn.textContent = `${left}s`;
      }
    }, 1000);
  } catch (err) {
    sendCodeBtn.disabled = false;
    showAuthError(err.message);
  }
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const remember = $('remember').checked;
  if (!username || !password) {
    showAuthError('请输入用户名/邮箱和密码');
    return;
  }
  authSubmit.disabled = true;
  authSubmit.textContent = '请稍候…';
  try {
    const body = { username, password };
    if (authMode === 'register') {
      body.email = emailInput.value.trim();
      body.code = verifyCodeInput.value.trim();
    }
    const res = await fetch(`/api/${authMode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.banned) {
        showBanNotice(data);
        return;
      }
      throw new Error(translateServerError(data.error || '操作失败'));
    }
    setToken(data.token, remember);
    state.token = getToken();
    state.me = data.user;
    showChat();
  } catch (err) {
    showAuthError(err.message);
  } finally {
    authSubmit.disabled = false;
    authSubmit.textContent = authMode === 'login' ? '登录' : '注册';
  }
});

/* ---------- 二维码登录（登录页生成 / 个人资料扫码确认） ---------- */
let qrPollTimer = null;
let qrCountdownTimer = null;
let qrToken = null;

qrLoginLink.addEventListener('click', () => {
  if (authMode !== 'login') return;
  authForm.classList.add('hidden');
  qrLoginLink.classList.add('hidden');
  qrLoginPanel.classList.remove('hidden');
  startQrLogin();
});

qrBack.addEventListener('click', () => {
  stopQrPolling();
  if (qrCountdownTimer) clearInterval(qrCountdownTimer);
  qrLoginPanel.classList.add('hidden');
  authForm.classList.remove('hidden');
  qrLoginLink.classList.remove('hidden');
});

qrRefresh.addEventListener('click', () => {
  stopQrPolling();
  if (qrCountdownTimer) clearInterval(qrCountdownTimer);
  startQrLogin();
});

async function startQrLogin() {
  qrExpireText.textContent = '';
  try {
    const res = await fetch('/api/qr/login/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: location.origin }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || '二维码生成失败');
    qrToken = d.token;
    qrLoginImage.src = `/api/qr/login/image/${d.token}`;
    const expiresAt = new Date(d.expiresAt).getTime();
    const tick = () => {
      const left = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      const mm = String(Math.floor(left / 60)).padStart(2, '0');
      const ss = String(left % 60).padStart(2, '0');
      qrExpireText.textContent = left <= 0 ? I18N.t('qrExpired') : I18N.t('qrCountdown', { time: `${mm}:${ss}` });
    };
    tick();
    qrCountdownTimer = setInterval(tick, 1000);
    qrPollTimer = setInterval(pollQrStatus, 2000);
  } catch (err) {
    toastErr(err.message);
  }
}

async function pollQrStatus() {
  if (!qrToken) return;
  try {
    const res = await fetch('/api/qr/login/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: qrToken }),
    });
    const d = await res.json();
    if (d.status === 'confirmed' && d.token && d.user) {
      stopQrPolling();
      if (qrCountdownTimer) clearInterval(qrCountdownTimer);
      const remember = $('remember').checked;
      setToken(d.token, remember);
      state.token = getToken();
      state.me = d.user;
      showChat();
    } else if (d.status === 'expired') {
      stopQrPolling();
      if (qrCountdownTimer) clearInterval(qrCountdownTimer);
      qrExpireText.textContent = I18N.t('qrExpired');
    }
  } catch (_) {
    /* 网络异常下次再轮询 */
  }
}

function stopQrPolling() {
  if (qrPollTimer) clearInterval(qrPollTimer);
  if (qrCountdownTimer) clearInterval(qrCountdownTimer);
  qrPollTimer = null;
  qrCountdownTimer = null;
  qrToken = null;
}

/* ---------- 个人资料扫码（识别二维码并确认登录） ---------- */
let scanStream = null;
let scanRAF = null;
let lastScanAt = 0;
let lastHandledData = null;
let lastHandledAt = 0;

function openScanModal() {
  scanModal.classList.remove('hidden');
  bringToFront(scanModal);
  startCamera();
}

function closeScanModal() {
  stopCamera();
  scanModal.classList.add('hidden');
}

profileScanBtn.addEventListener('click', openScanModal);
scanClose.addEventListener('click', closeScanModal);

async function startCamera() {
  try {
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  } catch (_) {
    toastErr(I18N.t('scanCameraFail'));
    return;
  }
  scanVideo.srcObject = scanStream;
  scanVideo.classList.remove('hidden');
  scanVideo.play().catch(() => {});
  const loop = () => {
    scanRAF = requestAnimationFrame(loop);
    const now = Date.now();
    if (now - lastScanAt < 600) return;
    lastScanAt = now;
    if (scanVideo.readyState >= 2 && scanVideo.videoWidth > 0) {
      scanCanvas.width = scanVideo.videoWidth;
      scanCanvas.height = scanVideo.videoHeight;
      const ctx = scanCanvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(scanVideo, 0, 0);
      const data = decodeFromCanvas(scanCanvas);
      if (data) handleDecoded(data);
    }
  };
  scanRAF = requestAnimationFrame(loop);
}

function stopCamera() {
  if (scanRAF) cancelAnimationFrame(scanRAF);
  scanRAF = null;
  if (scanStream) {
    scanStream.getTracks().forEach((t) => t.stop());
    scanStream = null;
  }
  if (scanVideo.srcObject) {
    scanVideo.srcObject = null;
  }
}

function decodeFromCanvas(canvas) {
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
    return code ? code.data : null;
  } catch (_) {
    return null;
  }
}

function handleDecoded(data) {
  const now = Date.now();
  if (data === lastHandledData && now - lastHandledAt < 5000) return;
  lastHandledData = data;
  lastHandledAt = now;
  const m = String(data || '').match(/\/qr-login\?t=([A-Za-z0-9]+)/);
  if (!m) {
    toastErr(I18N.t('scanNotOurs'));
    return;
  }
  confirmQrToken(m[1]);
}

async function confirmQrToken(token) {
  try {
    const res = await fetch('/api/qr/login/confirm', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const d = await res.json();
    if (!res.ok) return toastErr(d.error || '确认失败');
    toast(I18N.t('scanDone'));
    closeScanModal();
  } catch (_) {
    toastErr('确认失败');
  }
}

scanUpload.addEventListener('click', () => scanFile.click());

scanFile.addEventListener('change', () => {
  const file = scanFile.files && scanFile.files[0];
  scanFile.value = '';
  if (!file) return;
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    scanCanvas.width = img.width;
    scanCanvas.height = img.height;
    scanCanvas.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const data = decodeFromCanvas(scanCanvas);
    if (!data) return toastErr(I18N.t('scanNotFound'));
    handleDecoded(data);
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
});

function showAuthError(text) {
  authError.textContent = text;
  authError.classList.remove('hidden');
}

logoutBtn.addEventListener('click', async () => {
  try {
    await fetch('/api/logout', { method: 'POST', headers: authHeaders() });
  } catch (_) {
    /* 忽略网络错误 */
  }
  clearToken();
  state.token = null;
  state.me = null;
  state.users = [];
  state.unread.clear();
  resetChatArea();
  state.adminUsers = [];
  state.selectedAdminUserId = null;
  state.currentAdminUser = null;
  state.adminMessages = [];
  state.adminSelected.clear();
  state.adminUserSelected.clear();
  state.myWarnings = [];
  state.unreadWarnings = 0;
  warningBanner.classList.add('hidden');
  profileView.classList.add('hidden');
  userProfileView.classList.add('hidden');
  reportBar.classList.add('hidden');
  reportModal.classList.add('hidden');
  mailboxView.classList.add('hidden');
  state.reportMode = false;
  state.reportSelected.clear();
  state.reportPending = null;
  state.mailbox = { items: [], unread: 0 };
  updateMailboxBadge();
  document.body.classList.remove('muted-visible');
  myMuteBanner.classList.add('hidden');
  clearMediaCache();
  showAuth();
});

function authHeaders() {
  return { Authorization: `Bearer ${state.token}` };
}

/* ---------- Socket.IO ---------- */
function connectSocket() {
  if (state.socket) state.socket.disconnect();
  const socket = io({ auth: { token: state.token } });
  state.socket = socket;

  socket.on('connect_error', () => {
    toast('连接服务器失败，请刷新重试');
  });

  socket.on('presence', ({ onlineUserIds }) => {
    state.onlineUserIds = new Set(onlineUserIds);
    renderUserList();
    updateChatHead();
  });

  socket.on('chat:message', ({ message }) => {
    handleIncomingMessage(message);
  });

  socket.on('warning:new', ({ warning }) => {
    state.myWarnings.unshift(warning);
    state.unreadWarnings += 1;
    showWarningBanner();
    toast('您收到一条新的违规警告，请注意查看');
  });

  socket.on('warning:deleted', ({ warningId }) => {
    const idx = state.myWarnings.findIndex((w) => w.id === warningId);
    if (idx >= 0) {
      const removed = state.myWarnings.splice(idx, 1)[0];
      if (!removed.readAt) state.unreadWarnings = Math.max(0, state.unreadWarnings - 1);
      if (state.unreadWarnings === 0) warningBanner.classList.add('hidden');
      else showWarningBanner();
      if (!warningModal.classList.contains('hidden')) renderWarningList();
    }
  });

  socket.on('message:deleted', ({ messageId }) => {
    // 若删除的消息正在当前对话中，立即从界面移除
    const idx = state.conversation.findIndex((m) => m.id === messageId);
    if (idx >= 0) {
      state.conversation.splice(idx, 1);
      renderMessages();
    }
    state.pendingMessages = state.pendingMessages.filter((m) => m.id !== messageId);
  });

  socket.on('message:recalled', ({ message }) => {
    const idx = state.conversation.findIndex((m) => m.id === message.id);
    if (idx >= 0) {
      state.conversation[idx] = { ...state.conversation[idx], recalledAt: message.recalledAt };
      const row = messagesEl.querySelector(`.msg-row[data-msg-id="${message.id}"]`);
      if (row) {
        const bubble = row.querySelector('.bubble');
        if (bubble) {
          bubble.classList.add('recalled');
          bubble.textContent = message.senderId === state.me.id ? '你撤回了一条消息' : '对方撤回了一条消息';
        }
        // 撤回后：翻译框、「转发自」、未读/已读一并移除
        const tr = row.querySelector('.msg-trans');
        if (tr) tr.remove();
        const fw = row.querySelector('.msg-forward-from');
        if (fw) fw.remove();
        const rec = row.querySelector('.msg-receipt');
        if (rec) rec.remove();
        if (msgMenuTarget && msgMenuTarget.id === message.id) hideMsgMenu();
      }
    }
    const pIdx = state.pendingMessages.findIndex((m) => m.id === message.id);
    if (pIdx >= 0) {
      state.pendingMessages[pIdx] = { ...state.pendingMessages[pIdx], recalledAt: message.recalledAt };
    }
  });

  socket.on('messages:read', ({ byUserId }) => {
    // 对方打开了和我的对话：把我发给 ta 的消息实时标记为已读
    if (state.selectedUserId !== byUserId) return;
    let changed = false;
    for (const m of state.conversation) {
      if (m.senderId === state.me.id && m.receiverId === byUserId && !m.readAt) {
        m.readAt = new Date().toISOString();
        changed = true;
      }
    }
    if (!changed) return;
    const rows = messagesEl.querySelectorAll('.msg-row[data-msg-id]');
    for (const row of rows) {
      const id = Number(row.dataset.msgId);
      const m = state.conversation.find((x) => x.id === id);
      if (m && m.senderId === state.me.id && m.readAt) {
        const rec = row.querySelector('.msg-receipt');
        if (rec) {
          rec.textContent = I18N.t('readReceipt');
          rec.classList.add('read');
        }
      }
    }
  });

  socket.on('roles:changed', refreshRoles);

  socket.on('session:revoked', ({ reason }) => {
    toast(reason || '您的账号已被封禁');
    forceLogout();
  });

  socket.on('user:deleted', ({ userId, username }) => {
    const wasSelected = state.selectedUserId === userId;
    state.users = state.users.filter((u) => u.id !== userId);
    state.unread.delete(userId);
    if (wasSelected) {
      state.selectedUserId = null;
      state.conversation = [];
      state.conversationLoaded = false;
      messagesEl.innerHTML = '';
      emptyHint.classList.remove('hidden');
      updateChatHead();
    }
    renderUserList();
    if (!adminView.classList.contains('hidden')) {
      loadAdminUsers();
      if (state.currentAdminUser && state.currentAdminUser.id === userId) {
        state.currentAdminUser = null;
        state.adminMessages = [];
        state.adminSelected.clear();
        adminDetail.innerHTML = '<div class="admin-empty">该用户已注销删除，请选择其他用户</div>';
        const panel = document.querySelector('.admin-panel');
        if (panel) panel.classList.remove('admin-detail-open');
        toast(`用户 ${username || ''} 已被注销删除`);
      }
    }
  });

  socket.on('mute:changed', ({ userId, mutedUntil, mutedBy, mutedReason }) => {
    if (userId === state.me.id) {
      state.me.mutedUntil = mutedUntil;
      state.me.mutedBy = mutedBy || null;
      state.me.mutedReason = mutedReason || null;
      state.me.muted = !!mutedUntil;
      applyMyMute();
    }
    const u = state.users.find((x) => x.id === userId);
    if (u) {
      u.mutedUntil = mutedUntil;
      u.mutedBy = mutedBy || null;
      u.mutedReason = mutedReason || null;
      u.muted = !!mutedUntil;
      renderUserList();
      updateChatHead();
    }
    if (!adminView.classList.contains('hidden')) loadAdminUsers();
  });

  socket.on('mailbox:new', () => {
    loadMailbox();
    toast('邮件箱有新消息');
  });

}

/* ---------- 用户列表 ---------- */
async function loadUsers() {
  try {
    const res = await fetch('/api/users', { headers: authHeaders() });
    if (res.status === 401) return forceLogout();
    const data = await res.json();
    state.users = data.users;
    // 同步服务端未读数（离线期间收到的消息也会亮红点）
    for (const u of state.users) {
      if (u.unread > 0) state.unread.set(u.id, u.unread);
      else if (!state.unread.has(u.id)) state.unread.set(u.id, 0);
    }
    renderUserList();
  } catch (_) {
    toast('用户列表加载失败');
  }
}

function renderUserList() {
  const keyword = searchInput.value.trim().toLowerCase();
  const filtered = state.users.filter(
    (u) =>
      u.username.toLowerCase().includes(keyword) ||
      String(u.handle || '').toLowerCase().includes(keyword) ||
      String(u.userCode || '').includes(keyword)
  );

  if (filtered.length === 0) {
    userList.innerHTML = '<li class="empty-list">没有匹配的用户</li>';
    return;
  }

  userList.innerHTML = '';
  for (const user of filtered) {
    const online = state.onlineUserIds.has(user.id);
    const unreadCount = state.unread.get(user.id) || 0;
    const li = document.createElement('li');
    li.className = 'user-item' + (user.id === state.selectedUserId ? ' active' : '');
    li.dataset.userId = user.id;
    li.title = `${displayName(user)} · ID ${user.userCode} · 邀请码 ${user.handle}`;

    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    renderAvatar(avatar, user);

    const info = document.createElement('div');
    info.className = 'user-item-info';
    const name = document.createElement('span');
    name.className = 'user-item-name';
    name.textContent = displayName(user);
    const status = document.createElement('span');
    status.className = 'user-item-status' + (online ? ' online' : '');
    status.textContent = online ? I18N.t('online') : I18N.t('offline');
    info.append(name, status);

    const dot = document.createElement('span');
    dot.className = 'dot' + (online ? ' online' : '');
    dot.title = online ? '在线' : '离线';

    li.append(avatar, info, dot);
    if (user.banned) {
      const tag = document.createElement('span');
      tag.className = 'ban-tag';
      tag.textContent = '⛔ ' + I18N.t('banned');
      tag.title = user.bannedReason ? `封禁原因：${user.bannedReason}` : '永久封禁';
      li.appendChild(tag);
    }
    if (user.muted) {
      const tag = document.createElement('span');
      tag.className = 'mute-tag';
      tag.textContent = '🔇 ' + I18N.t('muted');
      tag.title = user.mutedUntil === 'forever' ? '永久禁言' : `禁言至 ${formatDateTime(user.mutedUntil)}`;
      li.appendChild(tag);
    }
    if (unreadCount > 0) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
      li.appendChild(badge);
    }
    li.addEventListener('click', () => selectUser(user));
    userList.appendChild(li);
  }
}

searchInput.addEventListener('input', renderUserList);

/* ---------- 选择用户 ---------- */
function selectUser(user) {
  // 微信电脑版手感：再点一次当前用户，收起对话回到初始界面
  if (state.selectedUserId === user.id && !mobileMode) {
    closeConversation();
    return;
  }
  exitReportMode();
  state.selectedUserId = user.id;
  state.unread.delete(user.id);
  state.conversationLoaded = false;
  if (mobileMode) {
    chatView.classList.add('chat-open');
    backBtn.classList.remove('hidden');
  }
  renderUserList();
  updateChatHead();
  loadConversation();
}

function closeConversation() {
  exitReportMode();
  resetChatArea();
  renderUserList();
  updateChatHead();
}

function selectedUser() {
  return state.users.find((u) => u.id === state.selectedUserId) || null;
}

function updateChatHead() {
  const user = selectedUser();
  if (!user) {
    resetChatArea();
    reportBtn.classList.add('hidden');
    chatName.textContent = I18N.t('selectUser');
    chatStatus.textContent = '';
    chatStatus.className = 'status';
    chatId.textContent = '';
    setAvatar(chatAvatar, '?');
    chatAvatar.style.background = 'linear-gradient(135deg,#9aa4b8,#6b768a)';
    return;
  }
  reportBtn.classList.remove('hidden');
  const online = state.onlineUserIds.has(user.id);
  chatName.textContent = displayName(user);
  if (user.banned) {
    chatStatus.textContent = I18N.t('banned') + '（' + I18N.t('offline') + '）';
    chatStatus.className = 'status';
    chatId.textContent = `${I18N.t('idLabel')} ${user.userCode} · ${I18N.t('inviteCode')} ${user.handle}`;
    renderAvatar(chatAvatar, user);
    return;
  }
  const muteText = user.muted ? ' · 🔇 ' + I18N.t('muted') : '';
  chatStatus.textContent = (online ? I18N.t('online') : I18N.t('offline')) + muteText;
  chatStatus.className = 'status' + (online ? ' online' : '');
  chatId.textContent = `${I18N.t('idLabel')} ${user.userCode} · ${I18N.t('inviteCode')} ${user.handle}`;
  renderAvatar(chatAvatar, user);
}

/* ---------- 对方个人主页 ---------- */
function openUserProfile(user) {
  if (!user) return;
  renderAvatar(upAvatar, user);
  upName.textContent = displayName(user);
  const online = state.onlineUserIds.has(user.id);
  upStatus.textContent = online ? '在线' : '离线';
  upStatus.className = 'up-status' + (online ? ' online' : '');
  const roleText = user.role === 'owner' ? '站主' : user.role === 'admin' ? '管理员（OP）' : '普通用户';
  upMeta.textContent = `ID ${user.userCode} · 邀请码 ${user.handle}\n角色：${roleText}`;
  upBio.textContent = user.bio || '这个人很懒，还没有写简介';
  userProfileView.classList.remove('hidden');
  bringToFront(userProfileView);
}

chatAvatar.addEventListener('click', () => openUserProfile(selectedUser()));
chatName.addEventListener('click', () => openUserProfile(selectedUser()));
upClose.addEventListener('click', () => userProfileView.classList.add('hidden'));

function adminStatusText(user) {
  if (user.banned) return I18N.t('banned');
  return user.online ? I18N.t('online') : I18N.t('offline');
}

/* ---------- 消息加载与渲染 ---------- */
function ensureEmptyHintInDom() {
  if (!emptyHint.isConnected) messagesEl.prepend(emptyHint);
}

function resetChatArea() {
  state.conversation = [];
  state.pendingMessages = [];
  state.conversationLoaded = false;
  state.selectedUserId = null;
  state.forwardTarget = null;
  messagesEl.innerHTML = '';
  ensureEmptyHintInDom();
  emptyHint.classList.remove('hidden');
  jumpPill.classList.add('hidden');
}

async function loadConversation() {
  if (state.selectedUserId == null) return;
  const uid = state.selectedUserId;
  state.pendingMessages = [];
  try {
    const res = await fetch(`/api/conversation/${uid}`, { headers: authHeaders() });
    if (res.status === 401) return forceLogout();
    const data = await res.json();
    if (state.selectedUserId !== uid) return; // 防止切换后旧数据覆盖
    state.conversation = data.messages || [];
    // 合并加载期间到达的新消息（按 id 去重）
    const knownIds = new Set(state.conversation.map((m) => m.id));
    for (const msg of state.pendingMessages) {
      if (!knownIds.has(msg.id)) {
        state.conversation.push(msg);
        knownIds.add(msg.id);
      }
    }
    state.pendingMessages = [];
    state.conversationLoaded = true;
    await renderMessages();
  } catch (_) {
    toast('历史消息加载失败');
  }
}

function fmtTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function renderMessages() {
  messagesEl.innerHTML = '';
  ensureEmptyHintInDom();
  emptyHint.classList.toggle('hidden', state.conversation.length > 0);
  jumpPill.classList.add('hidden');

  // 记录本次渲染对应的对话；收起或切换用户后立即中止，
  // 防止异步渲染把旧消息追加回已清空的界面
  const uid = state.selectedUserId;
  const msgs = [...state.conversation];
  let lastDate = null;
  for (const msg of msgs) {
    if (state.selectedUserId !== uid) return;
    const date = fmtDate(msg.createdAt);
    if (date && date !== lastDate) {
      const sep = document.createElement('div');
      sep.className = 'msg-date-sep';
      sep.textContent = date;
      messagesEl.appendChild(sep);
      lastDate = date;
    }
    const el = await buildMessageEl(msg);
    if (state.selectedUserId !== uid) return;
    messagesEl.appendChild(el);
  }
  if (state.selectedUserId !== uid) return;
  scrollToBottom(true);
}

// 图片/视频是加密存储的，需要带登录状态取回后临时解码展示
const mediaCache = new Map();

async function resolveMediaUrl(content) {
  if (mediaCache.has(content)) return mediaCache.get(content);
  const res = await fetch(content, { headers: authHeaders() });
  if (!res.ok) throw new Error('媒体加载失败');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  mediaCache.set(content, url);
  return url;
}

function clearMediaCache() {
  for (const url of mediaCache.values()) URL.revokeObjectURL(url);
  mediaCache.clear();
}

async function buildMessageEl(msg) {
  const mine = msg.senderId === state.me.id;
  const row = document.createElement('div');
  row.className = 'msg-row' + (mine ? ' mine' : '');
  row.dataset.msgId = msg.id;

  const sender = mine
    ? state.me
    : state.users.find((u) => u.id === msg.senderId) || { username: msg.senderName || '用户' };
  const avatar = document.createElement('span');
  avatar.className = 'avatar';
  renderAvatar(avatar, sender);
  avatar.title = mine ? '查看我的资料' : '查看对方资料';
  avatar.addEventListener('click', () => {
    if (mine) openProfile();
    else openUserProfile(sender);
  });

  const body = document.createElement('div');
  body.className = 'msg-body';

  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  meta.textContent = mine ? `我 · ${fmtTime(msg.createdAt)}` : `${displayName(sender)} · ${fmtTime(msg.createdAt)}`;

  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  if (msg.recalledAt) {
    bubble.classList.add('recalled');
    bubble.textContent = mine ? '你撤回了一条消息' : '对方撤回了一条消息';
  } else if (msg.type === 'text') {
    bubble.textContent = msg.content;
  } else if (msg.type === 'image') {
    const img = document.createElement('img');
    img.alt = '图片';
    img.loading = 'lazy';
    img.title = '点击查看原图';
    try {
      img.src = await resolveMediaUrl(msg.content);
      img.addEventListener('click', () => openLightbox(img.src));
      bubble.appendChild(img);
    } catch (_) {
      bubble.textContent = '[图片加载失败]';
    }
  } else if (msg.type === 'video') {
    const video = document.createElement('video');
    video.controls = true;
    video.preload = 'metadata';
    try {
      video.src = await resolveMediaUrl(msg.content);
      bubble.appendChild(video);
    } catch (_) {
      bubble.textContent = '[视频加载失败]';
    }
  }

  // 长按 1 秒弹菜单（转发/撤回）；电脑端右键同样弹出
  if (!msg.recalledAt) {
    let timer = null;
    let longPressed = false;
    body.addEventListener('pointerdown', (e) => {
      longPressed = false;
      clearTimeout(timer);
      timer = setTimeout(() => {
        longPressed = true;
        openMsgMenu(e.clientX, e.clientY, msg);
      }, 1000);
    });
    body.addEventListener('pointerup', () => clearTimeout(timer));
    body.addEventListener('pointerleave', () => clearTimeout(timer));
    body.addEventListener('pointercancel', () => clearTimeout(timer));
    body.addEventListener('click', (e) => {
      if (longPressed) {
        e.preventDefault();
        e.stopPropagation();
        longPressed = false;
      }
    });
    body.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      clearTimeout(timer);
      openMsgMenu(e.clientX, e.clientY, msg);
    });
  }

  if (state.reportMode && msg.senderId === state.selectedUserId && !msg.recalledAt) {
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'report-check';
    cb.checked = state.reportSelected.has(msg.id);
    cb.addEventListener('change', () => toggleReportSelect(msg.id, cb.checked));
    row.prepend(cb);
  }

  body.append(meta, bubble);
  if (mine && !msg.recalledAt) {
    const rec = document.createElement('span');
    rec.className = 'msg-receipt' + (msg.readAt ? ' read' : '');
    rec.textContent = msg.readAt ? I18N.t('readReceipt') : I18N.t('unreadReceipt');
    body.appendChild(rec);
  }
  if (msg.forwardFrom && !msg.recalledAt) {
    const fw = document.createElement('div');
    fw.className = 'msg-forward-from';
    fw.textContent = I18N.t('forwardFromLabel') + msg.forwardFrom;
    body.appendChild(fw);
  }
  maybeTranslate(msg, body);
  row.append(avatar, body);
  return row;
}

// 自动翻译 Bot：中→英 / 英→简中，结果显示在消息下方（本地缓存，不重复请求）
async function maybeTranslate(msg, body) {
  if (msg.type !== 'text' || msg.recalledAt || !msg.content) return;
  const cacheKey = `msg_tr_${msg.id}`;
  let cached = null;
  try {
    cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
  } catch (_) {
    /* 忽略缓存损坏 */
  }
  const apply = (tr) => {
    if (!tr) return;
    let line = body.querySelector('.msg-trans');
    if (!line) {
      line = document.createElement('div');
      line.className = 'msg-trans';
      line.title = I18N.t('transCollapseTip');
      line.addEventListener('click', () => {
        line.classList.add('hidden');
        const toggle = body.querySelector('.msg-trans-toggle');
        if (toggle) toggle.classList.remove('hidden');
      });
      // 微信式顺序：气泡 → 翻译框 → 未读/已读 → 转发自
      const forwardFrom = body.querySelector('.msg-forward-from');
      const receipt = body.querySelector('.msg-receipt');
      if (forwardFrom) body.insertBefore(line, forwardFrom);
      else if (receipt) body.insertBefore(line, receipt);
      else body.appendChild(line);

      const toggle = document.createElement('div');
      toggle.className = 'msg-trans-toggle hidden';
      toggle.textContent = I18N.t('translateBtn');
      toggle.addEventListener('click', () => {
        toggle.classList.add('hidden');
        line.classList.remove('hidden');
      });
      line.insertAdjacentElement('afterend', toggle);
    }
    line.textContent = tr;
  };
  if (cached && cached.t) {
    apply(cached.t);
    return;
  }
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: msg.content }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.translation) {
      localStorage.setItem(cacheKey, JSON.stringify({ t: data.translation }));
      apply(data.translation);
    }
  } catch (_) {
    /* 翻译失败不影响聊天 */
  }
}

function withinRecallWindow(msg) {
  const sentAt = new Date(msg.createdAt).getTime();
  return Number.isFinite(sentAt) && Date.now() - sentAt <= 2 * 60 * 1000;
}

let msgMenuTarget = null;

function openMsgMenu(x, y, msg) {
  msgMenuTarget = msg;
  msgMenuForward.classList.remove('hidden');
  msgMenuRecall.classList.toggle('hidden', !(msg.senderId === state.me.id && withinRecallWindow(msg)));
  msgMenu.classList.remove('hidden');
  bringToFront(msgMenu);
  const menuW = msgMenu.offsetWidth || 150;
  const menuH = msgMenu.offsetHeight || 100;
  const pad = 8;
  const left = Math.min(Math.max(pad, x - menuW / 2), window.innerWidth - menuW - pad);
  const top = Math.min(Math.max(pad, y - menuH - 10), window.innerHeight - menuH - pad);
  msgMenu.style.left = left + 'px';
  msgMenu.style.top = top + 'px';
}

function hideMsgMenu() {
  msgMenu.classList.add('hidden');
  msgMenuTarget = null;
}

msgMenuRecall.addEventListener('click', () => {
  const msg = msgMenuTarget;
  hideMsgMenu();
  if (msg) recallMessage(msg);
});

msgMenuForward.addEventListener('click', () => {
  const msg = msgMenuTarget;
  hideMsgMenu();
  if (msg) openForwardModal(msg);
});

function openForwardModal(msg) {
  state.forwardTarget = msg;
  forwardSelect.innerHTML = '';
  for (const u of state.users) {
    if (u.id === state.me.id) continue;
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = displayName(u);
    forwardSelect.appendChild(opt);
  }
  if (forwardSelect.options.length === 0) return toast(I18N.t('forwardNoUser'));
  forwardModal.classList.remove('hidden');
  bringToFront(forwardModal);
}

forwardCancel.addEventListener('click', () => forwardModal.classList.add('hidden'));

forwardSubmit.addEventListener('click', async () => {
  const msg = state.forwardTarget;
  const targetId = Number(forwardSelect.value);
  forwardModal.classList.add('hidden');
  if (!msg || !targetId) return;
  try {
    const res = await fetch('/api/forward', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: msg.id, targetUserId: targetId }),
    });
    const data = await res.json();
    if (!res.ok) return toastErr(data.error || '转发失败');
    toast(I18N.t('forwardDone'));
  } catch (_) {
    toastErr('转发失败');
  }
});

msgMenuCancel.addEventListener('click', hideMsgMenu);
document.addEventListener('click', (e) => {
  if (!msgMenu.classList.contains('hidden') && !msgMenu.contains(e.target)) hideMsgMenu();
});
document.addEventListener('scroll', hideMsgMenu, true);
window.addEventListener('resize', hideMsgMenu);

async function recallMessage(msg) {
  const res = await fetch(`/api/message/${msg.id}/recall`, { method: 'POST', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) return toast(data.error || '撤回失败');
}

async function handleIncomingMessage(msg) {
  if (msg.senderId === state.me.id) {
    // 多开场景：自己其它标签页发的消息，只在自己正开着这段对话时追加
    if (state.selectedUserId == null || msg.receiverId !== state.selectedUserId) return;
    state.conversation.push(msg);
    await renderAppend(msg);
    return;
  }
  // 正在看这个对话时，收到的新消息立即在服务器端标记已读（发送方实时看到“已读”）
  if (msg.senderId === state.selectedUserId && state.conversationLoaded) {
    postConversationRead(msg.senderId);
  }
  // 未读计数：别人的消息且当前没在看这个对话
  if (msg.senderId !== state.selectedUserId) {
    state.unread.set(msg.senderId, (state.unread.get(msg.senderId) || 0) + 1);
    renderUserList();
    const sender = state.users.find((u) => u.id === msg.senderId);
    toast(`收到 ${displayName(sender) || msg.senderName || '用户'} 的新消息`);
    return;
  }
  if (!state.conversationLoaded) {
    state.pendingMessages.push(msg);
    return;
  }
  state.conversation.push(msg);
  await renderAppend(msg);
}

let lastReadPost = 0;
function postConversationRead(partnerId) {
  const now = Date.now();
  if (now - lastReadPost < 800) return;
  lastReadPost = now;
  fetch(`/api/conversation/${partnerId}/read`, { method: 'POST', headers: authHeaders() }).catch(() => {});
}

async function renderAppend(msg) {
  const uid = state.selectedUserId;
  const el = await buildMessageEl(msg);
  if (state.selectedUserId !== uid) return;
  const dateSep = document.createElement('div');
  dateSep.className = 'msg-date-sep';
  const date = fmtDate(msg.createdAt);
  const lastDateSep = messagesEl.querySelector('.msg-date-sep:last-of-type');
  if (!lastDateSep || lastDateSep.textContent !== date) {
    dateSep.textContent = date;
    messagesEl.appendChild(dateSep);
  }
  messagesEl.appendChild(el);
  emptyHint.classList.add('hidden');
  maybeScroll();
}

/* ---------- 滚动 ---------- */
function scrollToBottom(force = false) {
  if (force) {
    messagesEl.scrollTop = messagesEl.scrollHeight;
    jumpPill.classList.add('hidden');
  }
}

function maybeScroll() {
  const dist = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight;
  if (dist < 140) {
    scrollToBottom(true);
  } else {
    jumpPill.classList.remove('hidden');
  }
}

jumpPill.addEventListener('click', () => scrollToBottom(true));

/* ---------- 发送文本 ---------- */
async function sendText() {
  if (state.me && state.me.muted) return toast('您当前已被禁言，无法发送消息');
  const text = messageInput.value.trim();
  if (!text || state.selectedUserId == null) return;
  // 微信式服务器加密：明文经 HTTPS 传输，服务器加密后入库，任何设备登录都能看
  state.socket.emit('chat:send', { receiverId: state.selectedUserId, type: 'text', content: text }, (res) => {
    if (res && res.ok === false) toast(res.error || '发送失败');
  });
  messageInput.value = '';
  autoResize();
}

sendBtn.addEventListener('click', sendText);

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendText();
  }
});

messageInput.addEventListener('input', autoResize);

function autoResize() {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 140) + 'px';
}

/* ---------- 上传图片 / 视频 ---------- */
fileInput.addEventListener('change', async () => {
  const file = fileInput.files && fileInput.files[0];
  fileInput.value = '';
  if (!file) return;
  if (state.selectedUserId == null) {
    toast('请先选择一个聊天对象');
    return;
  }
  if (state.me && state.me.muted) return toast('您当前已被禁言，无法发送消息');
  if (!/^(image|video)\//.test(file.type)) {
    toast('仅支持图片或视频文件');
    return;
  }
  if (file.size > 150 * 1024 * 1024) {
    toast('文件过大（最大 150MB）');
    return;
  }

  uploadHint.textContent = `正在上传「${file.name}」…`;
  uploadHint.classList.remove('hidden');
  sendBtn.disabled = true;

  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', headers: authHeaders(), body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '上传失败');
    const type = data.type;
    // 微信式服务器加密：文件由服务器加密落盘，任何设备登录都能看
    state.socket.emit(
      'chat:send',
      { receiverId: state.selectedUserId, type, content: data.url, meta: null },
      (ack) => {
        if (ack && ack.ok === false) {
          toast(ack.error || '发送失败');
        }
      }
    );
  } catch (err) {
    toast(err.message);
  } finally {
    uploadHint.classList.add('hidden');
    sendBtn.disabled = false;
  }
});

/* ---------- 违规警告（普通用户侧） ---------- */
async function loadMyWarnings() {
  try {
    const res = await fetch('/api/my/warnings', { headers: authHeaders() });
    if (res.status === 401) return forceLogout();
    const data = await res.json();
    state.myWarnings = data.warnings;
    state.unreadWarnings = data.unread;
    if (state.unreadWarnings > 0) showWarningBanner();
  } catch (_) {
    /* 忽略加载失败 */
  }
}

function showWarningBanner() {
  warningCount.textContent = String(state.unreadWarnings);
  warningBanner.classList.remove('hidden');
}

warningBanner.addEventListener('click', openWarningModal);

warningBannerClose.addEventListener('click', (e) => {
  e.stopPropagation();
  warningBanner.classList.add('hidden');
});

async function openWarningModal() {
  // 打开弹窗时重新拉取，保证显示最新警告
  try {
    const res = await fetch('/api/my/warnings', { headers: authHeaders() });
    if (res.status === 401) return forceLogout();
    const data = await res.json();
    state.myWarnings = data.warnings;
    state.unreadWarnings = data.unread;
    if (state.unreadWarnings === 0) warningBanner.classList.add('hidden');
  } catch (_) {
    /* 拉取失败时沿用本地缓存 */
  }
  renderWarningList();
  warningModal.classList.remove('hidden');
  bringToFront(warningModal);
}

function renderWarningList() {
  warningList.innerHTML = '';
  if (state.myWarnings.length === 0) {
    const li = document.createElement('li');
    li.textContent = '暂无警告记录';
    warningList.appendChild(li);
    return;
  }
  for (const w of state.myWarnings) {
    const li = document.createElement('li');
    li.textContent = w.reason;
    if (w.quote) {
      const quote = document.createElement('pre');
      quote.className = 'warn-quote';
      quote.textContent = w.quote;
      li.appendChild(quote);
    }
    const meta = document.createElement('span');
    meta.className = 'warn-meta';
    meta.textContent = `由管理员 ${w.opName} 发布于 ${formatDateTime(w.createdAt)}`;
    li.appendChild(meta);
    warningList.appendChild(li);
  }
}

warningOk.addEventListener('click', async () => {
  warningModal.classList.add('hidden');
  warningBanner.classList.add('hidden');
  state.unreadWarnings = 0;
  try {
    await fetch('/api/my/warnings/read', { method: 'POST', headers: authHeaders() });
  } catch (_) {
    /* 忽略 */
  }
});

function formatDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 封号时间固定格式：2026.08.10.22:56(UTC+8)-∞
function formatBanTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).formatToParts(d);
  const get = (t) => (parts.find((p) => p.type === t) || {}).value || '00';
  return `${get('year')}.${get('month')}.${get('day')}.${get('hour')}:${get('minute')}(UTC+8)-∞`;
}

function showBanNotice(data) {
  const time = formatBanTime(data.bannedAt);
  banNoticeText.textContent =
    `您的账号已被永久封禁，无法登录。\n\n` +
    `封禁时间：${time}\n` +
    `封禁原因：${data.bannedReason || '违规'}\n` +
    `执行管理员：${data.bannedBy || '站主'}\n\n` +
    `如有疑问，请联系管理员申诉。`;
  banNoticeModal.classList.remove('hidden');
  bringToFront(banNoticeModal);
}

banNoticeClose.addEventListener('click', () => banNoticeModal.classList.add('hidden'));

// UTC+8 时间，精确到秒（用于禁言/封号提示）
function formatDateTimeCN(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).formatToParts(d);
  const get = (t) => (parts.find((p) => p.type === t) || {}).value || '00';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

/* ---------- 禁言（普通用户侧） ---------- */
function buildMyMuteText(user) {
  const reason = user.mutedReason ? `，原因：${user.mutedReason}` : '';
  if (user.mutedUntil === 'forever') return `您已被禁言${reason}，无法发送消息`;
  const time = formatDateTimeCN(user.mutedUntil);
  return `您已被禁言至 ${time || '（时间未知）'}（UTC+8）${reason}，无法发送消息`;
}

function applyMyMute() {
  const muted = state.me && state.me.muted;
  if (muted) {
    document.body.classList.add('muted-visible');
    myMuteBanner.textContent = '🔇 ' + buildMyMuteText(state.me);
    myMuteBanner.classList.remove('hidden');
  } else {
    document.body.classList.remove('muted-visible');
    myMuteBanner.classList.add('hidden');
  }
  messageInput.disabled = !!muted;
  sendBtn.disabled = !!muted;
  $('attach-btn').classList.toggle('disabled', !!muted);
}

/* ---------- 个人资料 ---------- */
const PROFILE_EMOJIS = ['😀', '😎', '🥰', '😜', '🤔', '😴', '🐱', '🐶', '🦊', '🐼', '🐸', '🐯', '🦁', '🐨', '🐷', '🦄', '🐙', '🦋', '🌻', '🍀', '🔥', '⭐', '🌈', '👻', '🤖', '👑'];
let selectedEmoji = '';

function openProfile() {
  renderAvatar(profileAvatar, state.me);
  profileUsername.value = state.me.username;
  profileBio.value = state.me.bio || '';
  selectedEmoji = state.me.avatar && !/^\/api\/file\//.test(state.me.avatar) ? state.me.avatar : '';
  renderProfileEmojis();
  const roleText =
    state.me.role === 'owner'
      ? I18N.t('ownerRole')
      : state.me.role === 'admin'
        ? I18N.t('adminRole')
        : I18N.t('userRole');
  profileMeta.textContent = `${I18N.t('idLabel')} ${state.me.userCode} · ${I18N.t('inviteCode')} ${state.me.handle} · ${roleText}`;
  profileView.classList.remove('hidden');
  bringToFront(profileView);
}

function closeProfile() {
  profileView.classList.add('hidden');
}

function renderProfileEmojis() {
  profileEmojis.innerHTML = '';
  for (const emoji of PROFILE_EMOJIS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = emoji;
    btn.classList.toggle('active', emoji === selectedEmoji);
    btn.addEventListener('click', () => {
      selectedEmoji = emoji;
      renderProfileEmojis();
      renderAvatar(profileAvatar, { ...state.me, avatar: emoji });
    });
    profileEmojis.appendChild(btn);
  }
}

profileBtn.addEventListener('click', openProfile);
profileCancel.addEventListener('click', closeProfile);
profileSave.addEventListener('click', saveProfile);

async function saveProfile() {
  const body = {
    username: profileUsername.value.trim(),
    bio: profileBio.value.trim(),
    avatar: selectedEmoji,
  };
  const res = await fetch('/api/profile', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) return toast(data.error || '保存失败');
  state.me = data.user;
  myName.textContent = displayName(state.me);
  myId.textContent = `ID ${state.me.userCode} · ${state.me.handle}`;
  renderAvatar(myAvatar, state.me);
  renderAvatar(profileAvatar, state.me);
  loadUsers();
  toast('资料已保存');
}

profileUploadBtn.addEventListener('click', () => profileFile.click());

profileFile.addEventListener('change', async () => {
  const file = profileFile.files && profileFile.files[0];
  profileFile.value = '';
  if (!file) return;
  if (!/^image\//.test(file.type)) return toast('请选择图片文件');
  if (file.size > 5 * 1024 * 1024) return toast('头像图片不能超过 5MB');
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', headers: authHeaders(), body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '上传失败');
    if (data.type !== 'image') return toast('头像必须是图片');
    selectedEmoji = data.url;
    renderProfileEmojis();
    renderAvatar(profileAvatar, { ...state.me, avatar: data.url });
    toast('头像已选择，点击保存生效');
  } catch (err) {
    toast(err.message);
  }
});

/* ---------- 管理后台（OP） ---------- */
adminBtn.addEventListener('click', openAdmin);
adminClose.addEventListener('click', closeAdmin);
adminSearch.addEventListener('input', renderAdminUsers);

function openAdmin() {
  adminView.classList.remove('hidden');
  bringToFront(adminView);
  // 手机端每次打开都回到用户列表，避免卡在上次选中的详情页
  document.querySelector('.admin-panel').classList.remove('admin-detail-open');
  state.selectedAdminUserId = null;
  adminDetail.classList.remove('admin-empty');
  adminDetail.innerHTML = '<div class="admin-empty">选择左侧用户，查看聊天记录与警告</div>';
  loadAdminUsers();
}

function closeAdmin() {
  adminView.classList.add('hidden');
  document.querySelector('.admin-panel').classList.remove('admin-detail-open');
  state.adminUserSelected.clear();
  updateAdminBatchBar();
}

// 管理详情头部统计：手机端只显示关键信息，完整信息放在悬停提示里
function setAdminStats(user) {
  const full = `ID ${user.userCode} · 邀请码 ${user.handle} · ${adminStatusText(user)} · 消息 ${user.msgCount} 条 · 警告 ${user.warningCount} 条`;
  const el = $('adm-stats');
  if (!el) return;
  el.title = full;
  el.textContent = mobileMode
    ? `ID ${user.userCode} · 消息 ${user.msgCount} 条 · 警告 ${user.warningCount} 条`
    : full;
}

async function loadAdminUsers() {
  try {
    const res = await fetch('/api/op/users', { headers: authHeaders() });
    if (res.status === 403) {
      toast('无管理员权限');
      return closeAdmin();
    }
    if (res.status === 401) return forceLogout();
    state.adminUsers = (await res.json()).users;
    renderAdminUsers();
  } catch (_) {
    toast('管理后台加载失败');
  }
}

function renderAdminUsers() {
  const keyword = adminSearch.value.trim().toLowerCase();
  const filtered = state.adminUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(keyword) ||
      String(u.handle || '').toLowerCase().includes(keyword) ||
      String(u.userCode || '').includes(keyword)
  );
  adminUserList.innerHTML = '';
  for (const user of filtered) {
    const li = document.createElement('li');
    li.className = 'admin-user-item' + (user.id === state.selectedAdminUserId ? ' active' : '');

    if (user.id !== state.me.id) {
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'batch-check';
      cb.checked = state.adminUserSelected.has(user.id);
      cb.addEventListener('click', (e) => e.stopPropagation());
      cb.addEventListener('change', () => toggleAdminUserSelect(user.id, cb.checked));
      li.appendChild(cb);
    }

    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    renderAvatar(avatar, user);

    const info = document.createElement('div');
    info.className = 'admin-user-info';
    const name = document.createElement('span');
    name.className = 'admin-user-name';
    name.textContent = displayName(user);
    const sub = document.createElement('span');
    sub.className = 'admin-user-sub';
    sub.textContent = `${adminStatusText(user)} · ${user.msgCount} 条消息`;
    info.append(name, sub);

    const dot = document.createElement('span');
    dot.className = 'dot' + (user.online ? ' online' : '');

    li.append(avatar, info, dot);
    if (user.banned) {
      const tag = document.createElement('span');
      tag.className = 'ban-tag';
      tag.textContent = '⛔';
      tag.title = user.bannedReason ? `封禁原因：${user.bannedReason}` : '永久封禁';
      li.appendChild(tag);
    }
    if (user.muted) {
      const tag = document.createElement('span');
      tag.className = 'mute-tag';
      tag.textContent = '🔇';
      tag.title = user.mutedUntil === 'forever' ? '永久禁言' : `禁言至 ${formatDateTime(user.mutedUntil)}`;
      li.appendChild(tag);
    }
    if (user.warningCount > 0) {
      const chip = document.createElement('span');
      chip.className = 'warn-chip';
      chip.textContent = String(user.warningCount);
      chip.title = `${user.warningCount} 条警告`;
      li.appendChild(chip);
    }
    li.addEventListener('click', () => selectAdminUser(user));
    adminUserList.appendChild(li);
  }
}

function toggleAdminUserSelect(userId, checked) {
  if (checked) state.adminUserSelected.add(userId);
  else state.adminUserSelected.delete(userId);
  updateAdminBatchBar();
}

function updateAdminBatchBar() {
  const n = state.adminUserSelected.size;
  admBatchBar.classList.toggle('hidden', n === 0);
  admBatchCount.textContent = `已选 ${n} 人`;
  admBatchBan.textContent = n > 0 ? `${I18N.t('batchDelete')}（${n}）` : I18N.t('batchDelete');
}

admBatchBan.addEventListener('click', async () => {
  const ids = [...state.adminUserSelected];
  if (ids.length === 0) return toast('请先勾选用户');
  if (!window.confirm(`确定批量注销选中的 ${ids.length} 个账号吗？账号及聊天记录将被永久删除，不可恢复。`)) return;
  const res = await fetch('/api/op/ban-batch', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIds: ids }),
  });
  const data = await res.json();
  if (!res.ok) return toast(data.error || '操作失败');
  state.adminUserSelected.clear();
  updateAdminBatchBar();
  const skipText = data.skipped && data.skipped.length ? `，跳过 ${data.skipped.length} 个（${data.skipped.map((s) => s.reason).join('；')}）` : '';
  toast(`已注销 ${data.deleted.length} 个账号${skipText}`);
  loadAdminUsers();
});

function selectAdminUser(user) {
  state.selectedAdminUserId = user.id;
  state.currentAdminUser = user;
  state.adminMessages = [];
  state.adminSelected.clear();
  if (mobileMode) document.querySelector('.admin-panel').classList.add('admin-detail-open');
  renderAdminUsers();
  renderAdminDetail(user);
}

// 刷新管理后台顶部的授权 / 禁言按钮状态（用 onclick 避免重复绑定）
function refreshAdminHeadButtons(user) {
  const roleBtn = $('adm-role-btn');
  if (!roleBtn) return;
  if (user.role === 'owner') {
    roleBtn.textContent = I18N.t('ownerRole');
    roleBtn.disabled = true;
    roleBtn.onclick = null;
  } else {
    roleBtn.textContent = user.role === 'admin' ? I18N.t('cancelAdmin') : I18N.t('setAdmin');
    roleBtn.disabled = false;
    roleBtn.onclick = () => toggleAdminRole(user);
  }

  const muteBtn = $('adm-mute-btn');
  if (!muteBtn) return;
  if (user.id === state.me.id) {
    // 站主/管理员查看自己时，不显示禁言/封号选项
    muteBtn.style.display = 'none';
    muteBtn.onclick = null;
  } else {
    muteBtn.style.display = '';
    const canMute = state.me.role === 'owner' || user.role !== 'owner';
    if (!canMute) {
      muteBtn.textContent = '不可禁言';
      muteBtn.disabled = true;
      muteBtn.onclick = null;
    } else if (user.muted || user.banned) {
      muteBtn.textContent = (user.banned ? '⛔ ' : '🔇 ') + I18N.t('unmute');
      muteBtn.disabled = false;
      muteBtn.onclick = () => unmuteUser(user);
    } else {
      muteBtn.textContent = '🔇 ' + I18N.t('mute');
      muteBtn.disabled = false;
      muteBtn.onclick = () => openMuteModal(user);
    }
  }
}

async function renderAdminDetail(user) {
  adminDetail.classList.remove('admin-empty');
  adminDetail.innerHTML = `
    <div class="admin-chat">
      <header class="admin-chat-head">
        <button class="back-btn" id="adm-back" title="返回用户列表">‹</button>
        <span class="avatar" id="adm-avatar"></span>
        <div class="admin-chat-head-info">
          <h3 id="adm-name"></h3>
          <div class="admin-stats" id="adm-stats"></div>
        </div>
        <button class="logout-btn role-btn" id="adm-role-btn"></button>
        <button class="logout-btn role-btn" id="adm-mute-btn"></button>
        <button class="logout-btn" id="adm-refresh">刷新</button>
      </header>
      <div class="admin-msgs" id="admin-msgs">加载中…</div>
      <div class="adm-select-bar hidden" id="adm-select-bar">
        <span id="adm-select-count">已选 0 条</span>
        <button class="send-btn" id="adm-warn-selected">警告选中</button>
        <button class="send-btn danger-btn" id="adm-delete-selected">删除选中</button>
      </div>
      <div class="adm-warn-panel collapsed" id="adm-warn-panel">
        <div class="adm-warn-title" id="adm-warn-title">
          <button class="adm-warn-toggle" id="adm-warn-toggle" title="展开/收起违规警告">▸</button>
          <span>违规警告（<span id="adm-warn-count">0</span>）</span>
        </div>
        <div class="admin-warnings" id="admin-warnings">加载中…</div>
        <div class="warn-form">
          <textarea id="warn-textarea" rows="2" maxlength="500" placeholder="填写警告原因；勾选该用户自己发送的消息可附带违规内容（收到的消息只能删除）"></textarea>
          <button class="send-btn" id="warn-send">发送警告</button>
        </div>
      </div>
    </div>`;

  renderAvatar($('adm-avatar'), user);
  $('adm-name').textContent = displayName(user);
  setAdminStats(user);
  $('adm-back').addEventListener('click', () =>
    document.querySelector('.admin-panel').classList.remove('admin-detail-open')
  );
  refreshAdminHeadButtons(user);
  $('adm-warn-toggle').addEventListener('click', () => {
    const panel = $('adm-warn-panel');
    panel.classList.toggle('collapsed');
    $('adm-warn-toggle').textContent = panel.classList.contains('collapsed') ? '▸' : '▾';
  });
  $('adm-refresh').addEventListener('click', () => refreshAdminDetail(user));
  $('adm-warn-selected').addEventListener('click', () => {
    if (state.adminSelected.size === 0) return toast('请先勾选要警告的消息');
    // 展开违规警告面板，让填写框显示出来并聚焦
    const panel = $('adm-warn-panel');
    panel.classList.remove('collapsed');
    $('adm-warn-toggle').textContent = '▾';
    const ta = $('warn-textarea');
    ta.focus();
    ta.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast(`已选中 ${state.adminSelected.size} 条消息，填写原因后发送`);
  });
  $('adm-delete-selected').addEventListener('click', deleteAdminSelected);
  $('warn-send').addEventListener('click', () => sendWarning(user.id));
  $('warn-textarea').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendWarning(user.id);
    }
  });

  await refreshAdminDetail(user, true);
}

async function refreshAdminDetail(user, initial = false) {
  const [msgRes, warnRes, userRes] = await Promise.all([
    fetch(`/api/op/messages?userId=${user.id}`, { headers: authHeaders() }),
    fetch(`/api/op/warnings?userId=${user.id}`, { headers: authHeaders() }),
    fetch('/api/op/users', { headers: authHeaders() }),
  ]);
  if (msgRes.status === 401 || warnRes.status === 401 || userRes.status === 401) return forceLogout();

  const latest = (await userRes.json()).users.find((u) => u.id === user.id);
  if (latest) {
    Object.assign(user, latest);
    const idx = state.adminUsers.findIndex((u) => u.id === user.id);
    if (idx >= 0) state.adminUsers[idx] = latest;
    renderAdminUsers();
    setAdminStats(user);
    refreshAdminHeadButtons(user);
  } else {
    // 用户已被注销删除
    state.currentAdminUser = null;
    state.adminMessages = [];
    state.adminSelected.clear();
    adminDetail.innerHTML = '<div class="admin-empty">该用户已注销删除，请选择其他用户</div>';
    return;
  }

  state.adminMessages = (await msgRes.json()).messages;
  renderAdminMessages();
  renderAdminWarnings((await warnRes.json()).warnings);
  if (initial) {
    const box = $('admin-msgs');
    box.scrollTop = box.scrollHeight;
  }
}

// 管理后台按用户 id 查找用户资料（含自定义头像）
function adminUserById(id) {
  return (
    (state.adminUsers || []).find((u) => u.id === id) ||
    (state.users || []).find((u) => u.id === id) ||
    null
  );
}

async function renderAdminMessages() {
  const box = $('admin-msgs');
  box.innerHTML = '';
  const messages = state.adminMessages;
  if (messages.length === 0) {
    box.innerHTML = '<div class="admin-empty">该用户暂无消息</div>';
    return;
  }
  for (const msg of messages) {
    const mine = msg.senderId === state.selectedAdminUserId;
    const row = document.createElement('div');
    row.className = 'adm-msg-row' + (mine ? ' mine' : '');
    row.dataset.msgId = msg.id;

    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    const senderUser = adminUserById(msg.senderId) || { username: msg.senderName || '用户' };
    renderAvatar(avatar, senderUser);

    const body = document.createElement('div');
    body.className = 'adm-msg-body';

    const meta = document.createElement('div');
    meta.className = 'adm-msg-meta';
    meta.textContent = mine
      ? `${formatDateTime(msg.createdAt)} · 发给 ${msg.receiverName}`
      : `${formatDateTime(msg.createdAt)} · 来自 ${msg.senderName}`;

    const bubble = document.createElement('div');
    bubble.className = 'adm-bubble';

    if (msg.recalledAt) {
      bubble.textContent = '（该消息已撤回）';
    } else if (msg.type === 'text') {
      bubble.textContent = String(msg.content).startsWith('e2e:v')
        ? '（端到端加密消息，内容不可见）'
        : msg.content;
    } else if (msg.meta) {
      bubble.textContent = msg.type === 'image' ? '[图片（端到端加密）]' : '[视频（端到端加密）]';
    } else {
      try {
        const url = await resolveMediaUrl(msg.content);
        if (msg.type === 'image') {
          const img = document.createElement('img');
          img.src = url;
          img.alt = '图片';
          img.loading = 'lazy';
          img.title = '点击查看原图';
          img.addEventListener('click', () => openLightbox(url));
          bubble.appendChild(img);
        } else {
          const video = document.createElement('video');
          video.src = url;
          video.controls = true;
          video.preload = 'metadata';
          bubble.appendChild(video);
        }
      } catch (_) {
        bubble.textContent = msg.type === 'image' ? '[图片加载失败]' : '[视频加载失败]';
      }
    }

    const actions = document.createElement('div');
    actions.className = 'adm-msg-actions';
    // 警告只针对该用户自己发送的消息；查看自己时、以及收到的消息都不提供警告选项
    if (mine && state.selectedAdminUserId !== state.me.id) {
      const label = document.createElement('label');
      label.className = 'adm-check';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = state.adminSelected.has(msg.id);
      cb.addEventListener('change', () => toggleAdminSelect(msg.id, cb.checked));
      const checkText = document.createElement('span');
      checkText.textContent = '警告';
      label.append(cb, checkText);
      actions.appendChild(label);
    }
    const delBtn = document.createElement('button');
    delBtn.className = 'adm-del-btn';
    delBtn.textContent = '删除';
    delBtn.addEventListener('click', () => deleteAdminMessage(msg.id));
    actions.appendChild(delBtn);

    body.append(meta, bubble, actions);
    row.append(avatar, body);
    // 手机端友好：点消息整行即可勾选警告（图片/视频/按钮点击除外）
    row.addEventListener('click', (e) => {
      if (e.target.closest('.adm-check') || e.target.closest('.adm-del-btn')) return;
      if (e.target.closest('img, video, button, input, label, a')) return;
      if (!mine || state.selectedAdminUserId === state.me.id) return;
      const cb = row.querySelector('.adm-check input');
      if (cb) {
        cb.checked = !cb.checked;
        toggleAdminSelect(msg.id, cb.checked);
      }
    });
    box.appendChild(row);
  }
}

function renderAdminWarnings(warnings) {
  const box = $('admin-warnings');
  const countEl = $('adm-warn-count');
  if (countEl) countEl.textContent = String(warnings.length);
  box.innerHTML = '';
  if (warnings.length === 0) {
    box.innerHTML = '<div class="admin-warning">暂无警告</div>';
    return;
  }
  for (const w of warnings) {
    const div = document.createElement('div');
    div.className = 'admin-warning';
    const p = document.createElement('div');
    p.textContent = w.reason;
    div.appendChild(p);
    if (w.quote) {
      const quote = document.createElement('pre');
      quote.className = 'warn-quote';
      quote.textContent = w.quote;
      div.appendChild(quote);
    }
    const footer = document.createElement('div');
    footer.className = 'warn-footer';
    const meta = document.createElement('span');
    meta.className = 'warn-meta';
    meta.textContent = `由 ${w.opName} 发布于 ${formatDateTime(w.createdAt)}${w.messageIds && w.messageIds.length ? ` · 涉及 ${w.messageIds.length} 条消息` : ''}`;
    const delBtn = document.createElement('button');
    delBtn.className = 'adm-del-btn warn-del-btn';
    delBtn.textContent = '删除';
    delBtn.title = '删除这条警告记录';
    delBtn.addEventListener('click', () => deleteWarning(w.id));
    footer.append(meta, delBtn);
    div.appendChild(footer);
    box.appendChild(div);
  }
}

async function deleteWarning(warningId) {
  if (!window.confirm('确定删除这条警告记录吗？对方将同时看不到这条警告。')) return;
  const res = await fetch(`/api/op/warning/${warningId}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return toast(data.error || '删除失败');
  }
  toast('警告已删除，对方界面已同步移除');
  const user = state.currentAdminUser;
  if (user) {
    user.warningCount = Math.max(0, user.warningCount - 1);
    const li = state.adminUsers.find((u) => u.id === user.id);
    if (li) li.warningCount = user.warningCount;
    renderAdminUsers();
    setAdminStats(user);
  }
  const warnRes = await fetch(`/api/op/warnings?userId=${state.currentAdminUser.id}`, { headers: authHeaders() });
  renderAdminWarnings((await warnRes.json()).warnings);
}

async function sendWarning(userId) {
  const textarea = $('warn-textarea');
  const reason = textarea.value.trim();
  if (!reason) return toast('请填写警告原因');
  const messageIds = [...state.adminSelected];
  const res = await fetch('/api/op/warn', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, reason, messageIds }),
  });
  const data = await res.json();
  if (!res.ok) return toast(data.error || '发送失败');

  toast(messageIds.length ? `警告已发送（含 ${messageIds.length} 条违规消息）` : '警告已发送');
  state.adminSelected.clear();
  updateSelectBar();
  textarea.value = '';
  refreshAdminDetail(state.currentAdminUser);
}

function toggleAdminSelect(id, checked) {
  if (checked) state.adminSelected.add(id);
  else state.adminSelected.delete(id);
  updateSelectBar();
  const row = document.querySelector(`.adm-msg-row[data-msg-id="${id}"]`);
  if (row) row.classList.toggle('selected', checked);
}

function updateSelectBar() {
  const bar = $('adm-select-bar');
  if (!bar) return;
  const n = state.adminSelected.size;
  bar.classList.toggle('hidden', n === 0);
  $('adm-select-count').textContent = `已选 ${n} 条`;
  $('adm-warn-selected').textContent = n > 0 ? `警告选中（${n}）` : '警告选中';
}

async function deleteAdminMessage(id) {
  if (!window.confirm('确定删除这条消息吗？双方界面会立即移除，且不可恢复。')) return;
  const res = await fetch(`/api/op/message/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return toast(data.error || '删除失败');
  }
  state.adminMessages = state.adminMessages.filter((m) => m.id !== id);
  state.adminSelected.delete(id);
  updateSelectBar();
  renderAdminMessages();
  adjustAdminUserStats(-1);
  toast('已删除，对方界面已自动刷新');
}

async function deleteAdminSelected() {
  const ids = [...state.adminSelected];
  if (ids.length === 0) return;
  if (!window.confirm(`确定删除选中的 ${ids.length} 条消息吗？不可恢复。`)) return;
  for (const id of ids) {
    await fetch(`/api/op/message/${id}`, { method: 'DELETE', headers: authHeaders() });
  }
  state.adminMessages = state.adminMessages.filter((m) => !state.adminSelected.has(m.id));
  state.adminSelected.clear();
  updateSelectBar();
  renderAdminMessages();
  adjustAdminUserStats(-ids.length);
  toast(`已删除 ${ids.length} 条，用户端已自动刷新`);
}

function adjustAdminUserStats(delta) {
  const user = state.currentAdminUser;
  if (!user) return;
  user.msgCount = Math.max(0, user.msgCount + delta);
  const li = state.adminUsers.find((u) => u.id === user.id);
  if (li) li.msgCount = user.msgCount;
  renderAdminUsers();
  setAdminStats(user);
}

async function toggleAdminRole(user) {
  const target = user.role === 'admin' ? 'user' : 'admin';
  const action = target === 'admin' ? '设为管理员' : '取消管理员';
  if (!window.confirm(`确定${action}「${user.username}」吗？`)) return;
  const res = await fetch('/api/op/set-role', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id, role: target }),
  });
  const data = await res.json();
  if (!res.ok) return toast(data.error || '操作失败');
  toast(`已${action}`);
  refreshAdminDetail(state.currentAdminUser);
  refreshRoles();
}

/* ---------- 禁言管理（OP） ---------- */
function openMuteModal(user, opts) {
  state.muteTarget = user;
  state.reportPending = opts && opts.report ? opts.report : null;
  muteCustom.value = '30';
  resetOptChips(muteReasonOpts, muteReasonOther);
  setMuteMode('mute');
  muteModal.classList.remove('hidden');
  bringToFront(muteModal);
}

function setMuteMode(mode) {
  state.muteMode = mode;
  muteTabs.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  $('mute-body').classList.toggle('hidden', mode !== 'mute');
  $('ban-body').classList.toggle('hidden', mode !== 'ban');
  muteConfirm.textContent = mode === 'ban' ? I18N.t('confirmBan') : I18N.t('confirmMute');
  muteConfirm.classList.toggle('danger-btn', mode === 'ban');
}

muteTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-mode]');
  if (btn) setMuteMode(btn.dataset.mode);
});

muteQuick.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-min]');
  if (btn) muteCustom.value = btn.dataset.min;
});

bindOptChips(muteReasonOpts, muteReasonOther);

// 只允许数字输入（兼容各种键盘/输入法）
muteCustom.addEventListener('input', () => {
  muteCustom.value = muteCustom.value.replace(/[^\d]/g, '');
});

muteCancel.addEventListener('click', () => {
  muteModal.classList.add('hidden');
  state.muteTarget = null;
  state.reportPending = null;
});

muteConfirm.addEventListener('click', confirmMute);

async function confirmMute() {
  const target = state.muteTarget;
  if (!target) return;
  const reasonKey = selectedOptValue(muteReasonOpts);
  const reason = reasonKey
    ? reasonKey === 'other'
      ? muteReasonOther.value.trim() || I18N.t('catOther')
      : selectedOptLabel(muteReasonOpts)
    : '';
  const pendingReport = state.reportPending;
  if (state.muteMode === 'ban') {
    if (
      !window.confirm(
        `确定永久封禁「${target.username}」吗？该账号将无法登录（保留账号），只能手动解封。`
      )
    )
      return;
    const res = await fetch('/api/op/ban', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: target.id, reason }),
    });
    const data = await res.json();
    if (!res.ok) return toast(data.error || '封号失败');
    toast('已永久封禁该账号');
    if (pendingReport) {
      const reply =
        `我们收到了您的检举。我们已移除相关违规内容，并对「${pendingReport.targetName}」的账号进行处罚：永久封禁` +
        `${reason ? '（原因：' + reason + '）' : ''}。感谢您的监督，欢迎继续反馈。`;
      const targetBody =
        `您的账号已被永久封禁，无法登录。\n\n` +
        `封禁时间：${formatBanTime(data.bannedAt)}\n` +
        `封禁原因：${reason || '违规'}\n` +
        `执行管理员：${state.me ? state.me.username : '站主'}\n\n` +
        `我们已移除相关违规内容，并对您的账号进行处罚。\n\n` +
        `如有疑问，请联系管理员申诉。`;
      await resolveReport(pendingReport.id, { reply, targetBody, targetTitle: '封号通知', removeContent: true });
    }
  } else {
    const minutes = Number(muteCustom.value);
    if (!Number.isFinite(minutes) || minutes <= 0) return toast('请输入有效的禁言时长（分钟）');
    const res = await fetch('/api/op/mute', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: target.id, minutes, reason }),
    });
    const data = await res.json();
    if (!res.ok) return toast(data.error || '禁言失败');
    toast(`已禁言 ${minutes} 分钟`);
    if (pendingReport) {
      const until = formatDateTimeCN(data.mutedUntil) + '（UTC+8）';
      const reply =
        `我们收到了您的检举。我们已移除相关违规内容，并对「${pendingReport.targetName}」的账号进行处罚：禁言至 ${until}` +
        `${reason ? '（原因：' + reason + '）' : ''}。感谢您的监督，欢迎继续反馈。`;
      const targetBody =
        `您的账号已被禁言。\n\n` +
        `禁言时间：${until}\n` +
        `禁言原因：${reason || '未填写'}\n` +
        `执行管理员：${state.me ? state.me.username : '站主'}\n\n` +
        `我们已移除相关违规内容，并对您的账号进行处罚。\n\n` +
        `如有疑问，请联系管理员申诉。`;
      await resolveReport(pendingReport.id, { reply, targetBody, targetTitle: '禁言通知', removeContent: true });
    }
  }
  muteModal.classList.add('hidden');
  state.muteTarget = null;
  state.reportPending = null;
  refreshAdminDetail(state.currentAdminUser);
}

async function unmuteUser(user) {
  if (!window.confirm(`确定解除「${user.username}」的禁言吗？`)) return;
  const res = await fetch('/api/op/unmute', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id }),
  });
  const data = await res.json();
  if (!res.ok) return toast(data.error || '解封失败');
  toast('已解除禁言');
  refreshAdminDetail(state.currentAdminUser);
}

// 权限变化后刷新自己的身份与所有列表（被授权/取消授权实时生效）
async function refreshRoles() {
  try {
    const res = await fetch('/api/me', { headers: authHeaders() });
    if (res.status === 401) return forceLogout();
    const data = await res.json();
    state.me = data.user;
    myName.textContent = displayName(state.me);
    renderAvatar(myAvatar, state.me);
    adminBtn.classList.toggle('hidden', state.me.role === 'user');
    applyMyMute();
    if (state.me.role === 'user' && !adminView.classList.contains('hidden')) {
      closeAdmin();
      toast('您的管理员权限已被取消');
    }
    await loadUsers();
    updateChatHead();
    if (!adminView.classList.contains('hidden')) loadAdminUsers();
  } catch (_) {
    /* 忽略 */
  }
}

/* ---------- 检举（Report） ---------- */
function enterReportMode() {
  if (!selectedUser()) return toast('请先选择聊天对象');
  state.reportMode = true;
  state.reportSelected.clear();
  reportBtn.classList.add('active');
  updateReportBar();
  renderMessages();
}

function exitReportMode() {
  state.reportMode = false;
  state.reportSelected.clear();
  reportBtn.classList.remove('active');
  reportBar.classList.add('hidden');
  reportModal.classList.add('hidden');
  renderMessages();
}

function updateReportBar() {
  const n = state.reportSelected.size;
  reportBar.classList.toggle('hidden', n === 0 || !state.reportMode);
  reportCount.textContent = I18N.t('selectedCount', { n });
  reportSend.textContent = n > 0 ? `${I18N.t('reportSelected')}（${n}）` : I18N.t('reportSelected');
}

function toggleReportSelect(id, checked) {
  if (checked) state.reportSelected.add(id);
  else state.reportSelected.delete(id);
  updateReportBar();
}

reportBtn.addEventListener('click', () => {
  if (state.reportMode) exitReportMode();
  else enterReportMode();
});
reportCancelMode.addEventListener('click', exitReportMode);
reportSend.addEventListener('click', () => {
  if (state.reportSelected.size === 0) return toast('请先勾选要检举的消息');
  openReportModal();
});
reportCancel.addEventListener('click', () => reportModal.classList.add('hidden'));

bindOptChips(reportReasonOpts, reportReasonOther);

function openReportModal() {
  const user = selectedUser();
  if (!user) return;
  reportTarget.textContent = `检举对象：${displayName(user)}`;
  const lines = [];
  for (const m of state.conversation) {
    if (state.reportSelected.has(m.id)) {
      const t = formatDateTime(m.createdAt);
      if (m.type === 'text') lines.push(`[${t}] ${m.content}`);
      else lines.push(`[${t}] ${m.type === 'image' ? '[图片]' : '[视频]'}`);
    }
  }
  reportEvidence.textContent = lines.join('\n');
  resetOptChips(reportReasonOpts, reportReasonOther);
  reportModal.classList.remove('hidden');
  bringToFront(reportModal);
}

reportSubmit.addEventListener('click', async () => {
  const user = selectedUser();
  if (!user || state.reportSelected.size === 0) return;
  const messageIds = [...state.reportSelected];
  const reasonKey = selectedOptValue(reportReasonOpts);
  const reason = reasonKey
    ? reasonKey === 'other'
      ? reportReasonOther.value.trim() || I18N.t('catOther')
      : selectedOptLabel(reportReasonOpts)
    : '';
  const evidence = reportEvidence.textContent;
  const res = await fetch('/api/report', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUserId: user.id, messageIds, reason, evidence }),
  });
  const data = await res.json();
  if (!res.ok) return toast(data.error || '提交失败');
  toast(I18N.t('reportDone'));
  exitReportMode();
});

/* ---------- 邮件箱 ---------- */
async function loadMailbox() {
  try {
    const res = await fetch('/api/mailbox', { headers: authHeaders() });
    if (res.status === 401) return forceLogout();
    const data = await res.json();
    state.mailbox = data;
    updateMailboxBadge();
    if (!mailboxView.classList.contains('hidden')) renderMailbox();
  } catch (_) {
    /* 忽略 */
  }
}

function updateMailboxBadge() {
  const n = state.mailbox.unread || 0;
  if (n > 0) {
    mailboxBadge.textContent = n > 99 ? '99+' : String(n);
    mailboxBadge.classList.remove('hidden');
  } else {
    mailboxBadge.classList.add('hidden');
  }
}

mailboxBtn.addEventListener('click', openMailbox);
mailboxClose.addEventListener('click', () => mailboxView.classList.add('hidden'));

async function openMailbox() {
  mailboxView.classList.remove('hidden');
  bringToFront(mailboxView);
  state.mailSelected = null;
  const isAdmin = state.me && (state.me.role === 'owner' || state.me.role === 'admin');
  $('mailbox-title').textContent = isAdmin ? I18N.t('adminMailbox') : I18N.t('mailboxButton');
  $('mailbox-detail').innerHTML = '<div class="mail-empty">' + I18N.t('mailboxEmpty') + '</div>';
  await loadMailbox();
  renderMailbox();
  try {
    await fetch('/api/mailbox/read', { method: 'POST', headers: authHeaders() });
    state.mailbox.unread = 0;
    updateMailboxBadge();
  } catch (_) {
    /* 忽略 */
  }
}

function renderMailbox() {
  mailboxList.innerHTML = '';
  const items = state.mailbox.items || [];
  if (items.length === 0) {
    mailboxList.innerHTML = '<div class="mail-empty">' + I18N.t('mailboxEmpty') + '</div>';
    $('mailbox-detail').innerHTML = '<div class="mail-empty">' + I18N.t('mailboxEmpty') + '</div>';
    return;
  }
  const isAdmin = state.me && (state.me.role === 'owner' || state.me.role === 'admin');
  const sections = [];
  if (isAdmin) {
    sections.push({
      key: 'reports',
      label: I18N.t('mailSectionReports'),
      list: items.filter((i) => i.kind === 'report'),
    });
    sections.push({
      key: 'notices',
      label: I18N.t('mailSectionNotices'),
      list: items.filter((i) => i.kind !== 'report'),
    });
  } else {
    sections.push({ key: 'notices', label: I18N.t('mailSectionNotices'), list: items });
  }
  for (const section of sections) {
    const secTitle = document.createElement('div');
    secTitle.className = 'mail-section-title';
    secTitle.textContent = section.label;
    mailboxList.appendChild(secTitle);
    if (section.list.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'mail-empty mail-empty-section';
      empty.textContent = I18N.t('mailboxEmpty');
      mailboxList.appendChild(empty);
      continue;
    }
    for (const item of section.list) {
    const div = document.createElement('div');
    div.className = 'mail-item' + (item.readAt ? '' : ' unread') + (state.mailSelected === item.id ? ' active' : '');

    const head = document.createElement('div');
    head.className = 'mail-item-head';
    const kindIcon = document.createElement('span');
    kindIcon.className = 'mail-item-kind';
    kindIcon.textContent = item.kind === 'report' ? '⚠️' : item.kind === 'reply' ? '↩️' : '📢';
    const title = document.createElement('span');
    title.textContent = item.title;
    head.append(kindIcon, title);
    if (item.kind === 'report') {
      const badge = document.createElement('span');
      badge.className = 'report-status' + (item.processed ? ' done' : '');
      badge.textContent = item.processed ? I18N.t('processed') : I18N.t('pending');
      head.appendChild(badge);
    }
    const del = document.createElement('button');
    del.className = 'mail-item-del';
    del.title = I18N.t('deleteMail');
    del.textContent = '×';
    del.addEventListener('click', (ev) => {
      ev.stopPropagation();
      deleteMail(item.id);
    });
    head.appendChild(del);

    const body = document.createElement('div');
    body.className = 'mail-item-body';
    body.textContent = item.body.length > 50 ? item.body.slice(0, 50) + '…' : item.body;

    const time = document.createElement('span');
    time.className = 'mail-item-time';
    time.textContent = formatDateTime(item.createdAt);

    div.append(head, body, time);

    div.addEventListener('click', () => {
      state.mailSelected = item.id;
      renderMailbox();
      showMailDetail(item);
    });
    mailboxList.appendChild(div);
    }
  }
  if (!state.mailSelected) {
    $('mailbox-detail').innerHTML = '<div class="mail-empty">' + I18N.t('mailboxEmpty') + '</div>';
  }
}

async function deleteMail(id) {
  try {
    const res = await fetch('/api/mailbox/delete', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return toastErr(d.error || '删除邮件失败');
    }
    toast(I18N.t('mailDeleted'));
    if (state.mailSelected === id) state.mailSelected = null;
    await loadMailbox();
  } catch (_) {
    toastErr('删除邮件失败');
  }
}

async function showMailDetail(item) {
  const box = $('mailbox-detail');
  box.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'mail-detail-wrap';
  const head = document.createElement('div');
  head.className = 'mail-detail-title';
  head.textContent = (item.kind === 'report' ? '⚠️ ' : item.kind === 'reply' ? '↩️ ' : '📢 ') + item.title;
  const time = document.createElement('div');
  time.className = 'mail-item-time';
  time.textContent = formatDateTime(item.createdAt);
  const body = document.createElement('div');
  body.className = 'mail-detail-body';
  body.textContent = item.body;
  const actions = document.createElement('div');
  actions.className = 'mail-detail-actions';
  const delBtn = document.createElement('button');
  delBtn.className = 'mail-del-btn';
  delBtn.textContent = '🗑 ' + I18N.t('deleteMail');
  delBtn.addEventListener('click', () => deleteMail(item.id));
  actions.appendChild(delBtn);
  wrap.append(head, time, body, actions);
  box.appendChild(wrap);

  if (item.kind === 'report' && item.refId && (state.me.role === 'owner' || state.me.role === 'admin')) {
    const res = await fetch(`/api/op/report/${item.refId}`, { headers: authHeaders() });
    if (res.ok) {
      const { report } = await res.json();
      renderReportReview(box, report, !!item.processed);
    }
  }
}

async function resolveReport(reportId, payload) {
  const r = await fetch(`/api/op/report/${reportId}/resolve`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const d = await r.json();
  if (!r.ok) return toastErr(d.error || '处理失败');
  toast(I18N.t('resultSent'));
  state.mailSelected = null;
  loadMailbox();
}

function renderReportReview(box, report, processed) {
  const rev = document.createElement('div');
  rev.className = 'mail-review';
  const info = document.createElement('div');
  info.className = 'report-target';
  info.textContent =
    `${I18N.t('reportTarget')}${report.targetName} · ${report.reporterName} · ${report.messageIds.length} 条 · ` +
    (processed ? I18N.t('processed') : I18N.t('pending'));
  const ev = document.createElement('div');
  ev.className = 'report-evidence';
  ev.textContent = report.evidence || '';

  // “发送处理结果”按钮：点一下展开三个处罚选项（禁言 / 封号 / 无违规）
  const actions = document.createElement('div');
  actions.className = 'mail-reply-actions';
  const send = document.createElement('button');
  send.className = 'send-btn';
  send.textContent = I18N.t('sendResult') + ' ▾';
  send.addEventListener('click', () => {
    quick.classList.toggle('hidden');
    send.textContent = I18N.t('sendResult') + (quick.classList.contains('hidden') ? ' ▾' : ' ▴');
  });
  actions.appendChild(send);

  const quick = document.createElement('div');
  quick.className = 'quick-penalty hidden';
  const qLabel = document.createElement('span');
  qLabel.textContent = I18N.t('quickPenalty');
  const muteBtn = document.createElement('button');
  muteBtn.className = 'send-btn';
  muteBtn.textContent = '🔇 ' + I18N.t('muteNow');
  muteBtn.addEventListener('click', () => {
    quick.classList.add('hidden');
    send.textContent = I18N.t('sendResult') + ' ▾';
    openMuteModal({ id: report.targetUserId, username: report.targetName }, { report });
    setMuteMode('mute');
  });
  const banBtn = document.createElement('button');
  banBtn.className = 'send-btn danger-btn';
  banBtn.textContent = '⛔ ' + I18N.t('banNow');
  banBtn.addEventListener('click', () => {
    quick.classList.add('hidden');
    send.textContent = I18N.t('sendResult') + ' ▾';
    openMuteModal({ id: report.targetUserId, username: report.targetName }, { report });
    setMuteMode('ban');
  });
  const noViolationBtn = document.createElement('button');
  noViolationBtn.className = 'send-btn';
  noViolationBtn.textContent = I18N.t('noViolation');
  noViolationBtn.addEventListener('click', () => {
    quick.classList.add('hidden');
    send.textContent = I18N.t('sendResult') + ' ▾';
    const reply = I18N.t('noViolationReply', { target: report.targetName });
    resolveReport(report.id, { reply });
  });
  quick.append(qLabel, muteBtn, banBtn, noViolationBtn);
  rev.append(info, ev, actions, quick);
  box.appendChild(rev);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- 初始化 ---------- */
async function init() {
  if (!state.token) {
    setAuthMode('login');
    showAuth();
    return;
  }
  try {
    const res = await fetch('/api/me', { headers: authHeaders() });
    if (res.status === 401) throw new Error('unauthorized');
    const data = await res.json();
    state.me = data.user;
    state.onlineUserIds = new Set(data.onlineUserIds);
    showChat();
  } catch (_) {
    forceLogout();
  }
}

function forceLogout() {
  clearToken();
  state.token = null;
  state.me = null;
  resetChatArea();
  clearMediaCache();
  setAuthMode('login');
  showAuth();
  toast('登录已过期，请重新登录');
}

init();
