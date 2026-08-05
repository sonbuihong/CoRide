$login = Invoke-RestMethod -Method POST -Uri "http://localhost:5001/api/auth/login" -ContentType "application/json" -Body '{"email":"admin@coride.com","password":"admin123"}'
$token = $login.accessToken
Write-Host "Got token: $($token.Substring(0,[Math]::Min(20,$token.Length)))..."

$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

$bikeBody = '{"vehicleType":"BIKE","baseFare":12000,"pricePerKm":4500,"pricePerMinute":0,"baseDistance":0,"minFare":12000,"isActive":true}'
$bikeResult = Invoke-RestMethod -Method PUT -Uri "http://localhost:5001/api/pricing/configs" -Headers $headers -Body $bikeBody
Write-Host "BIKE config:" ($bikeResult | ConvertTo-Json -Depth 3)

$carBody = '{"vehicleType":"CAR","baseFare":20000,"pricePerKm":7000,"pricePerMinute":0,"baseDistance":0,"minFare":20000,"isActive":true}'
$carResult = Invoke-RestMethod -Method PUT -Uri "http://localhost:5001/api/pricing/configs" -Headers $headers -Body $carBody
Write-Host "CAR config:" ($carResult | ConvertTo-Json -Depth 3)

Write-Host "Done!"
