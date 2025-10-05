# Script de nettoyage des processus Node orphelins
# Ne tue PAS le serveur dev actuel (port 3000) ni Claude

Write-Host "Recherche des processus Node orphelins..." -ForegroundColor Cyan

# Recuperer tous les processus Node
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Processus Node trouves : $($nodeProcesses.Count)" -ForegroundColor Yellow

    # Identifier le processus du serveur dev (port 3000)
    $devServerPID = $null
    $connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($connections) {
        $devServerPID = $connections[0].OwningProcess
        Write-Host "Serveur dev detecte (PID: $devServerPID) - PROTEGE" -ForegroundColor Green
    }

    # Tuer les processus orphelins (memoire < 50MB = inactifs)
    $killed = 0
    foreach ($proc in $nodeProcesses) {
        # NE PAS tuer le serveur dev
        if ($proc.Id -eq $devServerPID) {
            Write-Host "Processus protege ignore (PID: $($proc.Id))" -ForegroundColor Gray
            continue
        }

        # Tuer les processus avec tres faible memoire (orphelins)
        $memory = [math]::Round($proc.WorkingSet64 / 1MB, 2)

        if ($memory -lt 50) {
            Write-Host "Tue processus orphelin PID $($proc.Id) (Memoire: ${memory}MB)" -ForegroundColor Red
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            $killed++
        } else {
            Write-Host "Garde processus actif PID $($proc.Id) (Memoire: ${memory}MB)" -ForegroundColor Gray
        }
    }

    Write-Host ""
    Write-Host "Nettoyage termine : $killed processus tues" -ForegroundColor Green

} else {
    Write-Host "Aucun processus Node trouve" -ForegroundColor Green
}

# Afficher les processus restants
Write-Host ""
Write-Host "Processus Node restants :" -ForegroundColor Cyan
Get-Process -Name node -ErrorAction SilentlyContinue | Format-Table Id, @{Name="Memory(MB)";Expression={[math]::Round($_.WorkingSet64/1MB,2)}}, CPU -AutoSize
