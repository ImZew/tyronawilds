# =============================================================================
# TyronaWilds (PlataformaTurismoSM) - Script Maestro de Parada Limpia (PowerShell)
# Universidad del Magdalena - Arquitectura de Software
# =============================================================================

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootDir

Write-Host "==================================================================" -ForegroundColor Yellow
Write-Host "  DETENIENDO ECOSISTEMA TYRONAWILDS™                              " -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Yellow

# 1. Detener procesos en los puertos del ecosistema (3000 y 8080..8087)
$Puertos = @(3000, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087)

foreach ($p in $Puertos) {
    $Conexiones = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    if ($null -ne $Conexiones) {
        foreach ($conn in $Conexiones) {
            $ProcId = $conn.OwningProcess
            if ($ProcId -gt 0) {
                Write-Host "  -> Deteniendo proceso PID $ProcId en puerto :$p ..." -ForegroundColor Cyan
                Stop-Process -Id $ProcId -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# 2. Detener contenedores Docker
Write-Host "`nDeteniendo contenedores Docker (docker compose stop)..." -ForegroundColor Cyan
docker compose stop

Write-Host "`n[OK] Todos los servicios de TyronaWilds han sido detenidos limpiamente." -ForegroundColor Green
