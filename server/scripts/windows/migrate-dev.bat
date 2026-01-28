@echo off
setlocal
cd /d %~dp0\..\..
echo Applying dev migrations to the database...
npx prisma migrate dev --name init || goto :error
echo Done.
goto :eof

:error
echo.
echo [ERROR] Migrate failed. Check the output above.
exit /b 1
