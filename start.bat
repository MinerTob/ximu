@echo off
chcp 65001 >nul
title 析木聊天室
cd /d "%~dp0"

rem ===== 邮箱验证码（Brevo）=====
set EMAIL_VERIFY=1
set MAIL_PROVIDER=brevo
rem 注意：真实密钥不要写进代码仓库！本地测试请在下面粘贴你的 Brevo 密钥
set BREVO_API_KEY=你的Brevo密钥
set MAIL_FROM=minertob114@gmail.com

rem ===== 服务器 =====
set PORT=3000
set HOST=0.0.0.0

npm start
pause
