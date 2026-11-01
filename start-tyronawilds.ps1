# =============================================================================
# TyronaWilds (PlataformaTurismoSM) - Script Maestro de Arranque (Windows PowerShell)
# Universidad del Magdalena - Arquitectura de Software
# =============================================================================

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootDir

Write-Host "==================================================================" -ForegroundColor Red
Write-Host "  TYRONAWILDS™ (PIERDE EL MAPA) - INICIANDO ECOSISTEMA COMPLETO  " -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Red

# 1. Levantar contenedores Docker (PostgreSQL 16 + pgvector, Redis 7, RabbitMQ 3.13)
Write-Host "`n[1/4] Levantando infraestructura Docker (PostgreSQL, Redis, RabbitMQ)..." -ForegroundColor Cyan
docker compose up -d

Write-Host "Esperando a que tyronawilds-postgres, tyronawilds-redis y tyronawilds-rabbitmq esten healthy..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# 2. Compilar e instalar artefactos del Backend (si no están compilados)
Write-Host "`n[2/4] Compilando e instalando artefactos Maven en backend/..." -ForegroundColor Cyan
Push-Location "$RootDir\backend"
mvn clean install -DskipTests -q
Pop-Location

# 3. Iniciar los 8 microservicios Spring Boot en procesos en segundo plano
$LogDir = "$RootDir\.logs"
if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

$Servicios = @(
    @{ Nombre = "identidad-service";     Puerto = 8081 },
    @{ Nombre = "auditoria-service";     Puerto = 8087 },
    @{ Nombre = "oferta-service";        Puerto = 8082 },
    @{ Nombre = "integracion-service";   Puerto = 8085 },
    @{ Nombre = "reservas-service";      Puerto = 8083 },
    @{ Nombre = "recomendacion-service"; Puerto = 8084 },
    @{ Nombre = "indicadores-service";   Puerto = 8086 },
    @{ Nombre = "api-gateway";           Puerto = 8080 }
)

Write-Host "`n[3/4] Iniciando los 8 microservicios Spring Boot en segundo plano..." -ForegroundColor Cyan
foreach ($svc in $Servicios) {
    $Nombre = $svc.Nombre
    $Puerto = $svc.Puerto
    Write-Host "  -> Iniciando $Nombre en puerto :$Puerto ..." -ForegroundColor Green
    Start-Process -FilePath "mvn.cmd" `
        -ArgumentList "spring-boot:run", "-q" `
        -WorkingDirectory "$RootDir\backend\$Nombre" `
        -RedirectStandardOutput "$LogDir\$Nombre.out.log" `
        -RedirectStandardError "$LogDir\$Nombre.err.log" `
        -WindowStyle Hidden
}

# 4. Iniciar el Frontend Next.js (ClienteWebMovil en http://localhost:3000)
Write-Host "`n[4/4] Iniciando ClienteWebMovil (Next.js) en http://localhost:3000 ..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" `
    -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "cd '$RootDir\frontend'; npm.cmd run dev"

Write-Host "`n==================================================================" -ForegroundColor Green
Write-Host "  TYRONAWILDS™ ACTIVO:" -ForegroundColor Green
Write-Host "  - Frontend Editorial UI : http://localhost:3000" -ForegroundColor White
Write-Host "  - API Gateway           : http://localhost:8080" -ForegroundColor White
Write-Host "  - RabbitMQ Management   : http://localhost:15672 (guest / guest)" -ForegroundColor White
Write-Host "  - Logs de microservicios: $LogDir" -ForegroundColor Gray
Write-Host "  Para detener todo ejecuta: .\stop-tyronawilds.ps1" -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Green
