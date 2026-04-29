@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\check-duplicates.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Found duplicates! See above.
) else (
    echo.
    echo All good ^:^)
)
pause
