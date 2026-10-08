@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "ROWER_RUNTIME=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies"
if exist "%ROWER_RUNTIME%\node\bin\node.exe" set "PATH=%ROWER_RUNTIME%\node\bin;%ROWER_RUNTIME%\bin\fallback;%PATH%"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 22.18 或以上。
  pause
  exit /b 1
)
if not exist dist\index.html (
  echo 首次构建，正在准备依赖。
  call pnpm install --frozen-lockfile --store-dir .pnpm-store
  if errorlevel 1 exit /b 1
  call pnpm build
  if errorlevel 1 exit /b 1
)
node scripts\preview.mjs --open
if errorlevel 1 (
  pause
  exit /b 1
)
