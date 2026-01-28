@echo off
echo ========================================
echo   Starting Auth Service
echo ========================================
echo.

cd services\auth-service

if not exist package.json (
    echo ERROR: package.json not found!
    echo Make sure you are running this from the project root.
    pause
    exit /b 1
)

echo Current directory: %CD%
echo.

echo Checking if node_modules exists...
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting auth service...
echo.
call npm start

pause
