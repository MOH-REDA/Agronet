$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env.docker"
$exampleFile = Join-Path $root ".env.docker.example"

function New-RandomHex([int]$byteCount) {
    $bytes = New-Object byte[] $byteCount
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $generator.GetBytes($bytes)
    } finally {
        $generator.Dispose()
    }
    return ($bytes | ForEach-Object { $_.ToString("x2") }) -join ""
}

if (-not (Test-Path -LiteralPath $envFile)) {
    $config = Get-Content -LiteralPath $exampleFile -Raw

    $keyBytes = New-Object byte[] 32
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $generator.GetBytes($keyBytes)
    } finally {
        $generator.Dispose()
    }

    $appKey = "base64:" + [Convert]::ToBase64String($keyBytes)
    $config = $config.Replace("base64:GENERATED_BY_DOCKER_UP_SCRIPT", $appKey)
    $config = $config.Replace("DB_PASSWORD=GENERATED_BY_DOCKER_UP_SCRIPT", "DB_PASSWORD=$(New-RandomHex 18)")
    $config = $config.Replace("DB_ROOT_PASSWORD=GENERATED_BY_DOCKER_UP_SCRIPT", "DB_ROOT_PASSWORD=$(New-RandomHex 24)")
    Set-Content -LiteralPath $envFile -Value $config -Encoding ascii
    Write-Host "Created .env.docker with local secrets."
}

Push-Location $root
try {
    docker compose --env-file .env.docker up --build -d
    if ($LASTEXITCODE -ne 0) { throw "Docker Compose failed to start AgroNet." }

    Write-Host ""
    docker compose --env-file .env.docker ps
    Write-Host ""
    Write-Host "AgroNet: http://localhost:8080"
    Write-Host "Logs: npm run docker:logs"
} finally {
    Pop-Location
}
