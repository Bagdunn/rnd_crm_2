Write-Host "R&D CRM System Status" -ForegroundColor Green
Write-Host ""

Write-Host "Docker containers status:" -ForegroundColor Yellow
docker-compose ps

Write-Host ""
Write-Host "Docker images:" -ForegroundColor Yellow
docker images | Select-String "rnd_crm"

Write-Host ""
Write-Host "Docker volumes:" -ForegroundColor Yellow
docker volume ls | Select-String "rnd_crm"

Write-Host ""
Write-Host "System resources:" -ForegroundColor Yellow
docker stats --no-stream

Write-Host ""
