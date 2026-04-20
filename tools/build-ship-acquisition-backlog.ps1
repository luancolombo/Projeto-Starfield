$ErrorActionPreference = "Stop"

$shipsPath = Join-Path $PSScriptRoot "..\data\ships.json"
$outputPath = Join-Path $PSScriptRoot "..\data\ship-acquisition-backlog.json"

$ships = Get-Content $shipsPath -Raw | ConvertFrom-Json

$items = $ships.items |
  Where-Object { $_.acquisition.status -eq "not_collected" } |
  Sort-Object name |
  ForEach-Object {
    [ordered]@{
      shipId = $_.id
      name = $_.name
      class = $_.class
      value = $_.value
      suggestedSearch = "site:inara.cz/starfield/ship/ `"Where to get $($_.name)`""
      status = "pending"
    }
  }

$backlog = [ordered]@{
  metadata = [ordered]@{
    game = "Starfield"
    dataset = "ship_acquisition_backlog"
    generatedAt = "2026-04-20"
    notes = @(
      "Lista de naves que ainda precisam de coleta de purchase/acquisition.",
      "A coleta automatizada direta da INARA via PowerShell retornou 503 neste ambiente.",
      "Use este backlog para continuar a coleta em lotes sem perder quais naves faltam."
    )
    remainingCount = @($items).Count
  }
  items = @($items)
}

$backlog | ConvertTo-Json -Depth 8 | Set-Content -Path $outputPath -Encoding UTF8
Write-Host "Generated acquisition backlog with $(@($items).Count) ships."
