$loginBody = '{"username":"admin","password":"admin123"}'
$loginResp = Invoke-WebRequest -Uri 'http://localhost:3002/api/admin/login' -Method Post -ContentType 'application/json' -Body $loginBody -UseBasicParsing
$loginResp.StatusCode
Write-Host "Login response:"
$loginResp.Content