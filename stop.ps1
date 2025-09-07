Write-Host "Stopping R&D CRM System..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Stopping Docker containers..." -ForegroundColor Yellow
docker-compose down

Write-Host ""
Write-Host "System stopped successfully!" -ForegroundColor Green
Write-Host ""
