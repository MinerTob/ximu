/* 三语言（简中 / 繁中 / 美式英语） */
window.I18N = (function () {
  const zhCN = {
    appName: '析木聊天室', login: '登录', register: '注册', username: '用户名 / 邮箱', password: '密码',
    authSub: '注册登录后，即可挑选在线用户实时聊天，支持图片和视频',
    remember: '记住登录状态（同电脑多开时建议取消勾选）', loginBtn: '登录', registerBtn: '注册',
    searchUsers: '搜索用户…', userList: '用户列表', online: '在线', offline: '离线',
    muted: '禁言中', banned: '已封禁', chatPlaceholder: '点击编辑文字',
    selectUser: '选择一个用户开始聊天', sendFile: '发送图片或视频（最大 150MB）',
    logout: '退出', manage: '管理', profile: '个人资料', editProfile: '点击编辑个人资料',
    userNameLabel: '用户名（2-20 位中文、字母、数字）', bioLabel: '个人简介（最多 200 字）',
    uploadAvatar: '上传头像图片', avatarHint: '也可以从下面选一个表情头像',
    inviteCode: '邀请码', ownerRole: '站主', adminRole: '管理员（OP）', userRole: '普通用户',
    reportButton: '检举', mailboxButton: '邮件箱', adminMailbox: '管理员邮箱',
    reportTitle: '检举违规内容', reportTarget: '检举对象：', reportReasonPh: '例如：发送骚扰内容 / 刷屏',
    reportReasonLabel: '补充说明（可选）', reportReasonOtherPh: '请输入补充说明',
    reportSubmit: '提交检举', cancel: '取消', close: '关闭', save: '保存', send: '发送',
    reportSelected: '检举选中', reportDone: '检举已提交，管理员会尽快处理',
    mailboxEmpty: '邮件箱是空的', processed: '已处理', pending: '待处理', handle: '处理',
    mailSectionReports: '检举信处理', mailSectionNotices: '通知邮件',
    deleteMail: '删除邮件', mailDeleted: '邮件已删除',
    replyPh: '填写处理结果，回复将发送给举报人', sendResult: '发送处理结果',
    quickPenalty: '快捷处罚', muteNow: '禁言', banNow: '封号',
    noViolation: '未发现违规', noAction: '不做处理',
    noViolationReply: '经核实，您举报的「{target}」暂未发现违规，我们会重点关注该账号，感谢您平台规范的维护。',
    reportNoMail: '已标记处理，未发送任何邮件',
    readReceipt: '已读', unreadReceipt: '未读',
    forward: '转发', recallMenu: '撤回消息', forwardTitle: '转发消息',
    forwardToLabel: '转发给', forwardBtn: '转发', forwardDone: '已转发',
    forwardNoUser: '暂无可转发的用户', forwardFromLabel: '转发自 ',
    email: '邮箱', verifyCode: '验证码', sendCode: '获取验证码', codeSent: '验证码已发送，请查收邮箱',
    emailInvalid: '邮箱格式不正确', emailTaken: '该邮箱已被注册', badCode: '请输入 6 位数字验证码',
    codeExpired: '验证码错误或已过期', codeFrequent: '发送太频繁，请 60 秒后再试',
    qrLoginLink: '使用二维码登录', qrLoginHint: '请打开析木聊天室，在个人资料里点击扫码图标扫描',
    qrRefresh: '刷新二维码', qrCountdown: '二维码 {time} 后失效', qrExpired: '二维码已过期，请点击刷新',
    scanQrTitle: '扫码登录', scanQrHint: '将登录页的二维码放入框内',
    scanLoginBtn: '扫描二维码登录',
    scanUpload: '选择图片识别', scanCameraFail: '无法使用摄像头，可点击“选择图片识别”',
    scanNotOurs: '这不是析木聊天室的登录二维码', scanNotFound: '未识别到二维码',
    scanDone: '已确认登录', back: '返回',
    translateBtn: '翻译', transCollapseTip: '点击收起翻译',
    feedbackCategory: '反馈类别', catPorn: '色情低俗', catPolitical: '涉政敏感', catRights: '侵犯权益',
    catFraud: '诈骗骚扰', catOther: '其他',
    muteReasonLabel: '原因（可选）', muteReasonOtherPh: '请输入原因',
    adminTitle: '管理后台', adminSub: '查看用户聊天记录、发送违规警告', refresh: '刷新',
    setAdmin: '设为管理员', cancelAdmin: '取消管理员', mute: '禁言', unmute: '解封',
    batchDelete: '批量删除', warn: '警告', delete: '删除', myStatus: '在线',
    emptyHint: '💬 在左侧选择一位用户，开始你们的对话',
    selectedCount: '已选 {n} 条', editing: '（已编辑）', recalledSelf: '你撤回了一条消息', recalledOther: '对方撤回了一条消息',
    usernamePh: '用户名或邮箱', passwordPh: '至少 4 位', accountAction: '账号处理',
    muteTab: '🔇 禁言', banTab: '⛔ 封号', profileTitle: '个人资料', userProfile: '个人主页',
    warningTitle: '违规警告', warningOk: '我知道了', muteDuration: '自定义禁言时长（分钟，可直接输入编辑）',
    muteReasonPh: '例如：刷屏骚扰 / 严重违规', confirmMute: '确认禁言', confirmBan: '确认封号',
    idLabel: 'ID', langSwitch: '切换语言', myWarnings: '我的警告',
    usernameInvalid: '用户名需为 2-20 位中文、字母、数字、下划线或短横线',
    passwordInvalid: '密码长度需为 4-64 位', usernameTaken: '该用户名已被占用',
    wrongCred: '用户名或密码错误', bannedLogin: '该账号已被封禁，无法登录',
    notLoggedIn: '未登录或登录已过期', emptyContent: '内容不能为空',
    recallTimeout: '超过 2 分钟，无法撤回', noRecallOther: '不能撤回别人发送的消息',
    noSelfMute: '不能禁言自己', noSelfBan: '不能封禁自己', noSelfReport: '不能举报自己',
    selectReportMsg: '请选择要检举的消息', badReportMsg: '包含无效的举报消息',
    replyTemplate: '经核实，您举报的「{target}」涉及【{category}】，已按平台规范对相关账号进行处理。感谢您的监督，欢迎继续反馈。',
    resultSent: '处理结果已发送给举报人',
  };

  const zhTW = {
    appName: '析木聊天室', login: '登入', register: '註冊', username: '使用者名稱 / 郵箱', password: '密碼',
    authSub: '註冊登入後，即可挑選線上使用者即時聊天，支援圖片與影片',
    remember: '記住登入狀態（同電腦多開時建議取消勾選）', loginBtn: '登入', registerBtn: '註冊',
    searchUsers: '搜尋使用者…', userList: '使用者列表', online: '線上', offline: '離線',
    muted: '禁言中', banned: '已封禁', chatPlaceholder: '點擊編輯文字',
    selectUser: '選擇一位使用者開始聊天', sendFile: '傳送圖片或影片（最大 150MB）',
    logout: '登出', manage: '管理', profile: '個人資料', editProfile: '點擊編輯個人資料',
    userNameLabel: '使用者名稱（2-20 位中文、字母、數字）', bioLabel: '個人簡介（最多 200 字）',
    uploadAvatar: '上傳頭像圖片', avatarHint: '也可以從下面選一個表情頭像',
    inviteCode: '邀請碼', ownerRole: '站主', adminRole: '管理員（OP）', userRole: '普通使用者',
    reportButton: '檢舉', mailboxButton: '郵件箱', adminMailbox: '管理員信箱',
    reportTitle: '檢舉違規內容', reportTarget: '檢舉對象：', reportReasonPh: '例如：傳送騷擾內容 / 刷屏',
    reportReasonLabel: '補充說明（可選）', reportReasonOtherPh: '請輸入補充說明',
    reportSubmit: '提交檢舉', cancel: '取消', close: '關閉', save: '儲存', send: '傳送',
    reportSelected: '檢舉選中', reportDone: '檢舉已提交，管理員會儘快處理',
    mailboxEmpty: '郵件箱是空的', processed: '已處理', pending: '待處理', handle: '處理',
    mailSectionReports: '檢舉信處理', mailSectionNotices: '通知郵件',
    deleteMail: '刪除郵件', mailDeleted: '郵件已刪除',
    replyPh: '填寫處理結果，回覆將傳送給檢舉人', sendResult: '傳送處理結果',
    quickPenalty: '快速處罰', muteNow: '禁言', banNow: '封號',
    noViolation: '未發現違規', noAction: '不做處理',
    noViolationReply: '經核實，您檢舉的「{target}」暫未發現違規，我們會重點關注該帳號，感謝您維護平台規範。',
    reportNoMail: '已標記處理，未發送任何郵件',
    readReceipt: '已讀', unreadReceipt: '未讀',
    forward: '轉發', recallMenu: '撤回訊息', forwardTitle: '轉發訊息',
    forwardToLabel: '轉發給', forwardBtn: '轉發', forwardDone: '已轉發',
    forwardNoUser: '暫無可轉發的使用者', forwardFromLabel: '轉發自 ',
    email: '信箱', verifyCode: '驗證碼', sendCode: '獲取驗證碼', codeSent: '驗證碼已發送，請查收信箱',
    emailInvalid: '信箱格式不正確', emailTaken: '該信箱已被註冊', badCode: '請輸入 6 位數字驗證碼',
    codeExpired: '驗證碼錯誤或已過期', codeFrequent: '發送太頻繁，請 60 秒後再試',
    qrLoginLink: '使用二維碼登入', qrLoginHint: '請開啟析木聊天室，在個人資料裡點擊掃碼圖示掃描',
    qrRefresh: '刷新二維碼', qrCountdown: '二維碼 {time} 後失效', qrExpired: '二維碼已過期，請點擊重新整理',
    scanQrTitle: '掃碼登入', scanQrHint: '將登入頁的二維碼放入框內',
    scanLoginBtn: '掃描二維碼登入',
    scanUpload: '選擇圖片辨識', scanCameraFail: '無法使用相機，可點擊「選擇圖片辨識」',
    scanNotOurs: '這不是析木聊天室的登入二維碼', scanNotFound: '未識別到二維碼',
    scanDone: '已確認登入', back: '返回',
    translateBtn: '翻譯', transCollapseTip: '點擊收起翻譯',
    feedbackCategory: '回饋類別', catPorn: '色情低俗', catPolitical: '涉政敏感', catRights: '侵犯權益',
    catFraud: '詐騙騷擾', catOther: '其他',
    muteReasonLabel: '原因（可選）', muteReasonOtherPh: '請輸入原因',
    adminTitle: '管理後台', adminSub: '查看使用者聊天記錄、傳送違規警告', refresh: '重新整理',
    setAdmin: '設為管理員', cancelAdmin: '取消管理員', mute: '禁言', unmute: '解封',
    batchDelete: '批次刪除', warn: '警告', delete: '刪除', myStatus: '線上',
    emptyHint: '💬 在左側選擇一位使用者，開始你們的對話',
    selectedCount: '已選 {n} 條', editing: '（已編輯）', recalledSelf: '你撤回了一則訊息', recalledOther: '對方撤回了一則訊息',
    usernamePh: '使用者名稱或郵箱', passwordPh: '至少 4 位', accountAction: '帳號處理',
    muteTab: '🔇 禁言', banTab: '⛔ 封號', profileTitle: '個人資料', userProfile: '個人主頁',
    warningTitle: '違規警告', warningOk: '我知道了', muteDuration: '自訂禁言時長（分鐘，可直接輸入編輯）',
    muteReasonPh: '例如：刷屏騷擾 / 嚴重違規', confirmMute: '確認禁言', confirmBan: '確認封號',
    idLabel: 'ID', langSwitch: '切換語言', myWarnings: '我的警告',
    usernameInvalid: '使用者名稱需為 2-20 位中文、字母、數字、底線或短橫線',
    passwordInvalid: '密碼長度需為 4-64 位', usernameTaken: '該使用者名稱已被佔用',
    wrongCred: '使用者名稱或密碼錯誤', bannedLogin: '該帳號已被封鎖，無法登入',
    notLoggedIn: '未登入或登入已過期', emptyContent: '內容不能為空',
    recallTimeout: '超過 2 分鐘，無法撤回', noRecallOther: '不能撤回別人傳送的訊息',
    noSelfMute: '不能禁言自己', noSelfBan: '不能封鎖自己', noSelfReport: '不能檢舉自己',
    selectReportMsg: '請選擇要檢舉的訊息', badReportMsg: '包含無效的檢舉訊息',
    replyTemplate: '經核實，您檢舉的「{target}」涉及【{category}】，已依平台規範對相關帳號進行處理。感謝您的監督，歡迎繼續回饋。',
    resultSent: '處理結果已傳送給檢舉人',
  };

  const en = {
    appName: 'Cloud Chat', login: 'Log In', register: 'Sign Up', username: 'Username / Email', password: 'Password',
    authSub: 'Sign up and chat in real time with images and videos',
    remember: 'Remember me (uncheck for multi-account)', loginBtn: 'Log In', registerBtn: 'Sign Up',
    searchUsers: 'Search users…', userList: 'Users', online: 'Online', offline: 'Offline',
    muted: 'Muted', banned: 'Banned', chatPlaceholder: 'Click to type',
    selectUser: 'Select a user to start chatting', sendFile: 'Send images or videos (max 150MB)',
    logout: 'Log Out', manage: 'Admin', profile: 'Profile', editProfile: 'Edit your profile',
    userNameLabel: 'Username (2-20 chars)', bioLabel: 'Bio (max 200 chars)',
    uploadAvatar: 'Upload avatar', avatarHint: 'Or pick an emoji below',
    inviteCode: 'Invite code', ownerRole: 'Owner', adminRole: 'Admin (OP)', userRole: 'User',
    reportButton: 'Report', mailboxButton: 'Inbox', adminMailbox: 'Admin Inbox',
    reportTitle: 'Report Violation', reportTarget: 'Report target: ', reportReasonPh: 'e.g. harassment or spam',
    reportReasonLabel: 'Additional info (optional)', reportReasonOtherPh: 'Type additional info',
    reportSubmit: 'Submit Report', cancel: 'Cancel', close: 'Close', save: 'Save', send: 'Send',
    reportSelected: 'Report Selected', reportDone: 'Report submitted. An admin will review it soon.',
    mailboxEmpty: 'Inbox is empty', processed: 'Processed', pending: 'Pending', handle: 'Review',
    mailSectionReports: 'Report Handling', mailSectionNotices: 'Notifications',
    deleteMail: 'Delete Email', mailDeleted: 'Email deleted',
    replyPh: 'Write a resolution for the reporter', sendResult: 'Send Resolution',
    quickPenalty: 'Quick Action', muteNow: 'Mute', banNow: 'Ban',
    noViolation: 'No Violation Found', noAction: 'No Action',
    noViolationReply: 'After review, we found no violation in your report about "{target}". We will keep a close eye on this account. Thank you for helping us maintain our platform standards.',
    reportNoMail: 'Marked as processed, no email sent',
    readReceipt: 'Read', unreadReceipt: 'Unread',
    forward: 'Forward', recallMenu: 'Recall', forwardTitle: 'Forward Message',
    forwardToLabel: 'Forward to', forwardBtn: 'Forward', forwardDone: 'Forwarded',
    forwardNoUser: 'No users to forward to', forwardFromLabel: 'Forwarded from ',
    email: 'Email', verifyCode: 'Verification Code', sendCode: 'Get Code', codeSent: 'Code sent. Check your email',
    emailInvalid: 'Invalid email address', emailTaken: 'Email already registered', badCode: 'Enter the 6-digit code',
    codeExpired: 'Wrong or expired code', codeFrequent: 'Too frequent. Try again in 60 seconds',
    qrLoginLink: 'Log in with QR code', qrLoginHint: 'Open 析木聊天室 and tap the scan icon in your profile',
    qrRefresh: 'Refresh QR code', qrCountdown: 'QR code expires in {time}', qrExpired: 'QR code expired. Tap to refresh',
    scanQrTitle: 'Scan to Log In', scanQrHint: 'Place the QR code inside the frame',
    scanLoginBtn: 'Scan QR to Log In',
    scanUpload: 'Choose Image', scanCameraFail: 'Camera unavailable. Tap "Choose Image" instead',
    scanNotOurs: 'This is not a 析木聊天室 login QR code', scanNotFound: 'No QR code found',
    scanDone: 'Login confirmed', back: 'Back',
    translateBtn: 'Translate', transCollapseTip: 'Click to collapse translation',
    feedbackCategory: 'Feedback Category', catPorn: 'Explicit content', catPolitical: 'Political sensitivity',
    catRights: 'Rights infringement', catFraud: 'Scam & harassment', catOther: 'Other',
    muteReasonLabel: 'Reason (optional)', muteReasonOtherPh: 'Type a reason',
    adminTitle: 'Admin Panel', adminSub: 'View records & send warnings', refresh: 'Refresh',
    setAdmin: 'Make Admin', cancelAdmin: 'Revoke Admin', mute: 'Mute', unmute: 'Unban',
    batchDelete: 'Batch Delete', warn: 'Warn', delete: 'Delete', myStatus: 'Online',
    emptyHint: '💬 Select a user on the left to start chatting',
    selectedCount: '{n} selected', editing: '（Edited）', recalledSelf: 'You recalled a message', recalledOther: 'Message recalled',
    usernamePh: 'Username or email', passwordPh: 'At least 4 characters', accountAction: 'Account Action',
    muteTab: '🔇 Mute', banTab: '⛔ Ban', profileTitle: 'Profile', userProfile: 'Profile Page',
    warningTitle: 'Warnings', warningOk: 'Got it', muteDuration: 'Mute duration (minutes, editable)',
    muteReasonPh: 'e.g. spam / serious violation', confirmMute: 'Confirm Mute', confirmBan: 'Confirm Ban',
    idLabel: 'ID', langSwitch: 'Switch language', myWarnings: 'My warnings',
    usernameInvalid: 'Username must be 2-20 Chinese/letters/numbers/_/-',
    passwordInvalid: 'Password must be 4-64 characters', usernameTaken: 'Username already taken',
    wrongCred: 'Wrong username or password', bannedLogin: 'This account has been banned',
    notLoggedIn: 'Not logged in or session expired', emptyContent: 'Content cannot be empty',
    recallTimeout: 'Over 2 minutes, cannot recall', noRecallOther: 'You cannot recall others\' messages',
    noSelfMute: 'You cannot mute yourself', noSelfBan: 'You cannot ban yourself', noSelfReport: 'You cannot report yourself',
    selectReportMsg: 'Select messages to report', badReportMsg: 'Contains invalid messages',
    replyTemplate: 'We reviewed your report about "{target}" regarding {category} and have taken action per our guidelines. Thank you for reporting.',
    resultSent: 'Resolution sent to the reporter',
  };

  const dicts = { 'zh-CN': zhCN, 'zh-TW': zhTW, en };
  const ORDER = ['zh-CN', 'zh-TW', 'en'];
  const STORE_KEY = 'chat_lang';
  let current = localStorage.getItem(STORE_KEY) || 'zh-CN';
  if (!dicts[current]) current = 'zh-CN';

  function t(key, vars) {
    let s = dicts[current][key];
    if (s === undefined) s = zhCN[key] !== undefined ? zhCN[key] : key;
    if (vars) {
      for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(String(vars[k]));
    }
    return s;
  }

  function applyStatic() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
  }

  function setLang(lang) {
    if (!dicts[lang]) return;
    current = lang;
    localStorage.setItem(STORE_KEY, lang);
    document.documentElement.lang = lang === 'en' ? 'en-US' : lang;
    applyStatic();
    if (window.afterLangChange) window.afterLangChange();
  }

  function nextLang() {
    const i = ORDER.indexOf(current);
    return ORDER[(i + 1) % ORDER.length];
  }

  return { t, setLang, getLang: () => current, nextLang, applyStatic };
})();
