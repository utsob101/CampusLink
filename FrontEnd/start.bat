@echo off
echo.
echo 🚀 Starting CampusLink Frontend
echo.
echo 📝 Make sure the backend is running first!
echo    In another terminal: cd Backend ^&^& npm run dev
echo.

REM Check if server-config.json exists
if exist server-config.json (
  echo ✅ Backend config found - IP will be auto-detected
) else (
  echo ⚠️  No server-config.json found. Start the backend first!
)

echo.
echo Starting Expo...
npm start
