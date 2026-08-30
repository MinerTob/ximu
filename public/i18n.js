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
    noReason: '未填写原因',
    reportSelected: '检举选中', reportDone: '检举已提交，管理员会尽快处理',
    mailboxEmpty: '邮件箱是空的', processed: '已处理', pending: '待处理', handle: '处理',
    mailSectionReports: '检举信处理', mailSectionNotices: '通知邮件',
    deleteMail: '删除邮件', mailDeleted: '邮件已删除',
    mailReportNewTitle: '收到新举报', mailReportNewBody: '用户 {reporter} 举报了 {target}：{reason}',
    mailReportNotifiedTitle: '检举通知',
    mailReportNotifiedBody:
      '系统通知：您有一条内容被其他用户检举，管理员正在审核中。请遵守平台规范；若确认违规，将依据平台规范处理。',
    mailBanRecordTitle: '账号已封禁', mailBanRecordBody: '用户 {target}（ID {code}）已被永久封禁。原因：{reason}',
    mailDeleteRecordTitle: '账号已注销', mailDeleteRecordBody: '用户 {target}（ID {code}）已被批量注销。原因：{reason}',
    mailReportResultTitle: '举报处理结果', mailReportResultBody: '你举报的「{target}」已有处理结果：\n{reply}',
    mailBanNoticeTitle: '封号通知',
    mailBanNoticeBody:
      '您的账号已被永久封禁，无法登录。\n\n封禁时间：{time}\n封禁原因：{reason}\n执行管理员：{adminName}\n\n我们已移除相关违规内容，并对您的账号进行处罚。\n\n如有疑问，请联系管理员申诉。',
    mailMuteNoticeTitle: '禁言通知',
    mailMuteNoticeBody:
      '您的账号已被禁言。\n\n禁言时间：{time}（UTC+8）\n禁言原因：{reason}\n执行管理员：{adminName}\n\n我们已移除相关违规内容，并对您的账号进行处罚。\n\n如有疑问，请联系管理员申诉。',
    mailPenaltyReplyBan:
      '我们收到了您的检举。我们已移除相关违规内容，并对「{target}」的账号进行处罚：永久封禁（原因：{reason}）。感谢您的监督，欢迎继续反馈。',
    mailPenaltyReplyMute:
      '我们收到了您的检举。我们已移除相关违规内容，并对「{target}」的账号进行处罚：禁言至 {time}（UTC+8）（原因：{reason}）。感谢您的监督，欢迎继续反馈。',
    replyPh: '填写处理结果，回复将发送给举报人', sendResult: '发送处理结果',
    quickPenalty: '快捷处罚', muteNow: '禁言', banNow: '封号',
    noViolation: '未发现违规', noAction: '不做处理',
    noViolationReply: '经核实，您举报的「{target}」暂未发现违规，我们会重点关注该账号，感谢您的监督，欢迎继续反馈。',
    catOtherReplyLabel: '其他（管理员填写）',
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
    banNoticeTitle: '⛔ 封号通知',
    banNoticeBody:
      '您的账号已被永久封禁，无法登录。\n\n封禁时间：{time}\n封禁原因：{reason}\n执行管理员：{admin}\n\n如有疑问，请联系管理员申诉。',
    banWarningPre: '⛔ 封号 = ', banWarningBold: '永久封禁（保留账号）',
    banWarningPost: '：该账号将无法登录，登录时会显示封号通知；只能由管理员手动解封。请谨慎操作。',
    muteQuick5: '5分钟', muteQuick30: '30分钟', muteQuick60: '1小时', muteQuick1440: '1天',
    confirmBanDialog: '确定永久封禁「{username}」吗？该账号将无法登录（保留账号），只能手动解封。',
    banDone: '已永久封禁该账号', muteDurationInvalid: '请输入有效的禁言时长（分钟）',
    muteDone: '已禁言 {minutes} 分钟', confirmUnmuteDialog: '确定解除「{username}」的禁言吗？',
    unmuteDone: '已解除禁言', unmuteFailed: '解封失败', banFailed: '封号失败', muteFailed: '禁言失败',
    myMuteToast: '您当前已被禁言，无法发送消息',
    myMuteForever: '您已被禁言{reasonText}，无法发送消息',
    myMuteUntil: '您已被禁言至 {time}（UTC+8）{reasonText}，无法发送消息',
    muteReasonPrefix: '，原因：', timeUnknown: '（时间未知）',
    cannotMute: '不可禁言', mutedForeverTip: '永久禁言', mutedUntilTip: '禁言至 {time}',
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
    noReason: '未填寫原因',
    reportSelected: '檢舉選中', reportDone: '檢舉已提交，管理員會儘快處理',
    mailboxEmpty: '郵件箱是空的', processed: '已處理', pending: '待處理', handle: '處理',
    mailSectionReports: '檢舉信處理', mailSectionNotices: '通知郵件',
    deleteMail: '刪除郵件', mailDeleted: '郵件已刪除',
    mailReportNewTitle: '收到新檢舉', mailReportNewBody: '使用者 {reporter} 檢舉了 {target}：{reason}',
    mailReportNotifiedTitle: '檢舉通知',
    mailReportNotifiedBody:
      '系統通知：您有一則內容被其他使用者檢舉，管理員正在審核中。請遵守平台規範；若確認違規，將依平台規範處理。',
    mailBanRecordTitle: '帳號已封禁', mailBanRecordBody: '使用者 {target}（ID {code}）已被永久封禁。原因：{reason}',
    mailDeleteRecordTitle: '帳號已註銷', mailDeleteRecordBody: '使用者 {target}（ID {code}）已被批量註銷。原因：{reason}',
    mailReportResultTitle: '檢舉處理結果', mailReportResultBody: '您檢舉的「{target}」已有處理結果：\n{reply}',
    mailBanNoticeTitle: '封號通知',
    mailBanNoticeBody:
      '您的帳號已被永久封禁，無法登入。\n\n封禁時間：{time}\n封禁原因：{reason}\n執行管理員：{adminName}\n\n我們已移除相關違規內容，並對您的帳號進行處罰。\n\n如有疑問，請聯繫管理員申訴。',
    mailMuteNoticeTitle: '禁言通知',
    mailMuteNoticeBody:
      '您的帳號已被禁言。\n\n禁言時間：{time}（UTC+8）\n禁言原因：{reason}\n執行管理員：{adminName}\n\n我們已移除相關違規內容，並對您的帳號進行處罰。\n\n如有疑問，請聯繫管理員申訴。',
    mailPenaltyReplyBan:
      '我們收到了您的檢舉。我們已移除相關違規內容，並對「{target}」的帳號進行處罰：永久封禁（原因：{reason}）。感謝您的監督，歡迎繼續回饋。',
    mailPenaltyReplyMute:
      '我們收到了您的檢舉。我們已移除相關違規內容，並對「{target}」的帳號進行處罰：禁言至 {time}（UTC+8）（原因：{reason}）。感謝您的監督，歡迎繼續回饋。',
    replyPh: '填寫處理結果，回覆將傳送給檢舉人', sendResult: '傳送處理結果',
    quickPenalty: '快速處罰', muteNow: '禁言', banNow: '封號',
    noViolation: '未發現違規', noAction: '不做處理',
    noViolationReply: '經核實，您檢舉的「{target}」暫未發現違規，我們會重點關注該帳號，感謝您的監督，歡迎繼續回饋。',
    catOtherReplyLabel: '其他（管理員填寫）',
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
    banNoticeTitle: '⛔ 封號通知',
    banNoticeBody:
      '您的帳號已被永久封禁，無法登入。\n\n封禁時間：{time}\n封禁原因：{reason}\n執行管理員：{admin}\n\n如有疑問，請聯繫管理員申訴。',
    banWarningPre: '⛔ 封號 = ', banWarningBold: '永久封禁（保留帳號）',
    banWarningPost: '：該帳號將無法登入，登入時會顯示封號通知；只能由管理員手動解封。請謹慎操作。',
    muteQuick5: '5 分鐘', muteQuick30: '30 分鐘', muteQuick60: '1 小時', muteQuick1440: '1 天',
    confirmBanDialog: '確定永久封禁「{username}」嗎？該帳號將無法登入（保留帳號），只能由管理員手動解封。',
    banDone: '已永久封禁該帳號', muteDurationInvalid: '請輸入有效的禁言時長（分鐘）',
    muteDone: '已禁言 {minutes} 分鐘', confirmUnmuteDialog: '確定解除「{username}」的禁言嗎？',
    unmuteDone: '已解除禁言', unmuteFailed: '解除禁言失敗', banFailed: '封號失敗', muteFailed: '禁言失敗',
    myMuteToast: '您當前已被禁言，無法傳送訊息',
    myMuteForever: '您已被禁言{reasonText}，無法傳送訊息',
    myMuteUntil: '您已被禁言至 {time}（UTC+8）{reasonText}，無法傳送訊息',
    muteReasonPrefix: '，原因：', timeUnknown: '（時間未知）',
    cannotMute: '不可禁言', mutedForeverTip: '永久禁言', mutedUntilTip: '禁言至 {time}',
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
    noReason: 'no reason provided',
    reportSelected: 'Report Selected', reportDone: 'Report submitted. An admin will review it soon.',
    mailboxEmpty: 'Inbox is empty', processed: 'Processed', pending: 'Pending', handle: 'Review',
    mailSectionReports: 'Report Handling', mailSectionNotices: 'Notifications',
    deleteMail: 'Delete Email', mailDeleted: 'Email deleted',
    mailReportNewTitle: 'New Report Received', mailReportNewBody: 'User {reporter} reported {target}: {reason}',
    mailReportNotifiedTitle: 'Report Notice',
    mailReportNotifiedBody:
      'System notice: one of your messages has been reported by another user and is under review. Please follow the platform guidelines; if a violation is confirmed, action will be taken accordingly.',
    mailBanRecordTitle: 'Account Banned', mailBanRecordBody: 'User {target} (ID {code}) has been permanently banned. Reason: {reason}',
    mailDeleteRecordTitle: 'Account Deleted', mailDeleteRecordBody: 'User {target} (ID {code}) has been deleted in batch. Reason: {reason}',
    mailReportResultTitle: 'Report Resolution', mailReportResultBody: 'Your report about "{target}" has been resolved:\n{reply}',
    mailBanNoticeTitle: 'Ban Notice',
    mailBanNoticeBody:
      'Your account has been permanently banned and cannot log in.\n\nBanned at: {time}\nReason: {reason}\nHandled by: {adminName}\n\nWe have removed the reported content and taken action against your account.\n\nIf you have questions, please contact an administrator.',
    mailMuteNoticeTitle: 'Mute Notice',
    mailMuteNoticeBody:
      'Your account has been muted.\n\nMuted until: {time} (UTC+8)\nReason: {reason}\nHandled by: {adminName}\n\nWe have removed the reported content and taken action against your account.\n\nIf you have questions, please contact an administrator.',
    mailPenaltyReplyBan:
      'We received your report. We have removed the reported content and taken action against "{target}": permanent ban (Reason: {reason}). Thank you for reporting and please continue to share feedback.',
    mailPenaltyReplyMute:
      'We received your report. We have removed the reported content and taken action against "{target}": muted until {time} (UTC+8) (Reason: {reason}). Thank you for reporting and please continue to share feedback.',
    replyPh: 'Write a resolution for the reporter', sendResult: 'Send Resolution',
    quickPenalty: 'Quick Action', muteNow: 'Mute', banNow: 'Ban',
    noViolation: 'No Violation Found', noAction: 'No Action',
    noViolationReply: 'We reviewed your report about "{target}" and found no violation. We will keep a close eye on this account. Thank you for reporting and please continue to share feedback.',
    catOtherReplyLabel: 'Other (filled in by admin)',
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
    banNoticeTitle: '⛔ Ban Notice',
    banNoticeBody:
      'Your account has been permanently banned and cannot log in.\n\nBanned at: {time}\nReason: {reason}\nHandled by: {admin}\n\nIf you have questions, please contact an administrator.',
    banWarningPre: '⛔ Ban = ', banWarningBold: 'permanent ban (account kept)',
    banWarningPost:
      ': the account cannot log in and will see a ban notice at login; only an admin can manually unban. Please operate with caution.',
    muteQuick5: '5 min', muteQuick30: '30 min', muteQuick60: '1 hour', muteQuick1440: '1 day',
    confirmBanDialog:
      'Permanently ban "{username}"? The account will not be able to log in (account kept) and can only be unbanned manually.',
    banDone: 'Account permanently banned', muteDurationInvalid: 'Enter a valid mute duration (minutes)',
    muteDone: 'Muted for {minutes} minute(s)', confirmUnmuteDialog: 'Unmute "{username}"?',
    unmuteDone: 'Mute lifted', unmuteFailed: 'Failed to unmute', banFailed: 'Ban failed', muteFailed: 'Mute failed',
    myMuteToast: 'You are currently muted and cannot send messages',
    myMuteForever: 'You are muted{reasonText} and cannot send messages',
    myMuteUntil: 'You are muted until {time} (UTC+8){reasonText} and cannot send messages',
    muteReasonPrefix: ', reason: ', timeUnknown: '(time unknown)',
    cannotMute: 'Cannot mute', mutedForeverTip: 'Muted permanently', mutedUntilTip: 'Muted until {time}',
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
