@echo off
echo ========================================
echo MongoDB Connection Helper
echo ========================================
echo.

REM Check if .env file exists
if not exist ".env" (
    echo Error: .env file not found!
    echo Please create a .env file with your MONGODB_URI
    echo.
    echo Example .env content:
    echo MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/intellispec?retryWrites=true^&w=majority
    echo.
    pause
    exit /b 1
)

REM Read MongoDB URI from .env file
for /f "tokens=2 delims==" %%a in ('findstr "MONGODB_URI" .env') do set MONGODB_URI=%%a

if "%MONGODB_URI%"=="" (
    echo Error: MONGODB_URI not found in .env file!
    echo Please add MONGODB_URI to your .env file
    pause
    exit /b 1
)

echo Found MongoDB URI in .env file
echo.
echo Choose an option:
echo 1. Connect to MongoDB shell (mongosh)
echo 2. Run Node.js cleanup script for t_pk_inspections
echo 3. Analyze tenant data only (no deletion)
echo 4. Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Connecting to MongoDB shell...
    echo You can then run: load("scripts/cleanup-tenant-mongo-shell.js")
    echo Then: cleanupTenant("t_pk_inspections")
    echo.
    mongosh "%MONGODB_URI%"
) else if "%choice%"=="2" (
    echo.
    echo Running Node.js cleanup script for t_pk_inspections...
    echo WARNING: This will delete ALL data for tenant t_pk_inspections
    echo.
    set /p confirm="Are you sure? Type YES to continue: "
    if /i "%confirm%"=="YES" (
        node scripts/cleanup-tenant-data.js t_pk_inspections
    ) else (
        echo Operation cancelled.
    )
) else if "%choice%"=="3" (
    echo.
    echo Analyzing tenant data (no deletion)...
    echo Connecting to MongoDB shell with analysis script...
    echo.
    echo In the MongoDB shell, run: analyzeTenant("t_pk_inspections")
    echo.
    mongosh "%MONGODB_URI%" --eval "load('scripts/cleanup-tenant-mongo-shell.js'); analyzeTenant('t_pk_inspections');"
) else if "%choice%"=="4" (
    echo Goodbye!
    exit /b 0
) else (
    echo Invalid choice. Please run the script again.
)

echo.
pause
