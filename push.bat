@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js tidak dijumpai. Pasang dari https://nodejs.org & pause & exit /b 1)
where git  >nul 2>nul || (echo Git tidak dijumpai. Pasang dari https://git-scm.com & pause & exit /b 1)
node push.js %*
echo.
pause
