@echo off
setlocal
cd /d %~dp0\..\..
echo [1/3] Installing packages...
npm i || goto :error

echo [2/3] Generating Prisma Client...
npx prisma generate || goto :error

echo [3/3] Starting server (watch)...
npm run start:dev
goto :eof

:error
echo.
echo [ERROR] Setup failed. Check the output above.
exit /b 1
