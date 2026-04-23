$body = '{"username":"admin","password":"admin123"}'
$resp = Invoke-WebRequest -Uri 'http://localhost:3002/api/auth/login' -Method Post -ContentType 'application/json' -Body $body -UseBasicParsing
$resp.Content