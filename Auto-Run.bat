@echo off
echo Starting the casino API servers...

REM Change to the project directory
cd /d "c:\Users\holli\Desktop\casino-api-main"

echo Attempting to start Python server (api.server.py)...
REM Start the Python server in the background
if exist "api.server.py" (
    echo Found api.server.py, starting...
    start /min python api.server.py
    timeout /t 3 /nobreak >nul
) else (
    echo Warning: api.server.py not found in the project directory.
    echo To use this feature, create a Python Flask/FastAPI server file named api.server.py
)

echo.
echo Starting Node.js server (index.js)...
REM Start the Node.js server
node index.js

pause