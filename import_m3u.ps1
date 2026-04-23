$loginBody = '{"username":"admin","password":"admin123"}'
$loginResp = Invoke-WebRequest -Uri 'http://localhost:3002/api/admin/login' -Method Post -ContentType 'application/json' -Body $loginBody -UseBasicParsing
$loginData = $loginResp.Content | ConvertFrom-Json
$token = $loginData.data.accessToken

$m3uContent = Get-Content 'E:\Proyectos_AI\iptv-saas-devbyte\backend\import_m3u.txt' -Raw
$escapedContent = $m3uContent -replace '"', '\"'

$importBody = "{\`"content\`":\`"$escapedContent\`"}"

$importResp = Invoke-WebRequest -Uri 'http://localhost:3002/api/admin/channels/import-m3u' -Method Post -ContentType 'application/json' -Headers @{Authorization="Bearer $token"} -Body $importBody -UseBasicParsing

Write-Host "Status:" $importResp.StatusCode
Write-Host "Response:" $importResp.Content