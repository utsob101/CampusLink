@echo off
echo ============================================
echo CampusLink - Allow Firewall Access
echo ============================================
echo.
echo This will allow Node.js to accept connections on port 4000
echo Required for Expo Go app on your phone to connect
echo.
echo You may need to run this as Administrator
echo.
pause

netsh advfirewall firewall add rule name="CampusLink Backend" dir=in action=allow protocol=TCP localport=4000

echo.
echo ============================================
echo Firewall rule added successfully!
echo ============================================
echo.
echo Your phone can now connect to:
echo http://192.168.0.100:4000
echo.
pause
