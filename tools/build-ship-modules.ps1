param(
  [switch]$IncludeWeapons,
  [switch]$IncludeReactors,
  [switch]$IncludeFuelTanks,
  [switch]$IncludeCargoHolds,
  [switch]$IncludeCockpits,
  [switch]$IncludeLandingGears,
  [switch]$IncludeDockers,
  [switch]$IncludeLandingBays,
  [switch]$IncludeHabs,
  [switch]$IncludeStructural,
  [switch]$IncludeEquipment,
  [switch]$IncludeVehicles
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$projectRoot = Split-Path $PSScriptRoot -Parent
$dataPath = Join-Path $projectRoot "data\ship-modules.json"
$seedRoot = Join-Path $PSScriptRoot "module-catalog-seed"

function Convert-ToInt {
  param([string]$Value)
  return [int](($Value -replace ",", "").Trim())
}

function Convert-ToFloat {
  param([string]$Value)
  return [double](($Value -replace ",", "" -replace "%", "").Trim())
}

function Convert-ToSlug {
  param([string]$Value)
  $normalized = $Value.Normalize([Text.NormalizationForm]::FormD)
  $builder = New-Object System.Text.StringBuilder

  foreach ($char in $normalized.ToCharArray()) {
    $unicodeCategory = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($char)
    if ($unicodeCategory -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($char)
    }
  }

  $ascii = $builder.ToString().ToLowerInvariant()
  $ascii = [regex]::Replace($ascii, "[^a-z0-9]+", "-")
  return $ascii.Trim("-")
}

function Get-UniqueArray {
  param([object[]]$Values)

  $seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
  $result = New-Object System.Collections.Generic.List[string]

  foreach ($value in $Values) {
    if ([string]::IsNullOrWhiteSpace([string]$value)) {
      continue
    }

    if ($seen.Add([string]$value)) {
      [void]$result.Add([string]$value)
    }
  }

  return @($result)
}

function Get-EngineManufacturer {
  param([string]$Name)

  if ($Name -match "^(Amun|Dunn)") { return "Amun Dunn" }
  if ($Name -match "^(Ares|Artemis|Hercules|Poseidon)") { return "Panoptes" }
  if ($Name -match "^(SA-|SAE-|SAL-)") { return "Slayton Aerospace" }
  if ($Name -match "^(Nova|Supernova|White Dwarf)") { return "Reladyne" }
  return $null
}

function Get-ShieldManufacturer {
  param([string]$Name)

  if ($Name -match "^Vanguard ") { return "Vanguard" }
  if ($Name -match "(Guardian|Defender|Protector)") { return "Dogstar" }
  if ($Name -match "(Deflector|Warden|Assurance)") { return "Sextant Shield Systems" }
  if ($Name -match "(Marduk|Osiris|Odin)") { return "Protectorate Systems" }
  if ($Name -match "(Bastille|Fortress|Tower)") { return "Nautilus" }
  return $null
}

function Get-GravManufacturer {
  param([string]$Name)

  if ($Name -match "^(Apollo|SGD)") { return "Slayton Aerospace" }
  if ($Name -match "^(Helios|NG|Vanguard Recon)") { return "Nova Galactic" }
  if ($Name -match "^(R-|RD-|Experimental R-|J-5\d Gamma)") { return "Reladyne" }
  if ($Name -match "^Aurora") { return "Panoptes" }
  return $null
}

function Get-WeaponType {
  param([string]$Name)

  if ($Name -match "Missile Launcher") { return "missiles" }
  if ($Name -match "Suppressor") { return "electromagnetic" }
  if ($Name -match "Laser") { return "laser" }
  if ($Name -match "(Beam|Particle Cannon|Autoprojector)") { return "particle" }
  if ($Name -match "(Cannon|Autocannon|Railgun|Gauss Gun|Shot-Cannon)") { return "ballistic" }
  return $null
}

function Get-WeaponManufacturer {
  param([string]$Name)

  if ($Name -match '^(Atlatl|Blaze|Eradicator|Exterminator|Firebolt|Flare|Fulminator|Nullifier|Obliterator|Ravager|Scorch|Singe|Spark|Torch|Vaporizer)') { return "Light Scythe" }
  if ($Name -match '^(CE-|EMP-|KE-|MKE-|PB-|PBO-)') { return "Ballistic Solutions Inc." }
  if ($Name -match '^(Dangan|Jishaku|Reza|Supaku|Tatsu|Tsukisasu)') { return "Shinigami" }
  if ($Name -match '^(Devastator|Disruptor|Dragon|Hunter Mag-|Infiltrator SC-|Marauder|Mauler)') { return "Horizon Defense" }
  if ($Name -match '^Vanguard ') { return "Vanguard" }
  return $null
}

function Get-ReactorManufacturer {
  param([string]$Name)

  if ($Name -match "(Mag Inertial|Toroidal|Sheared Flow)") { return "Dogstar" }
  if ($Name -match "(Stellarator|Z-Machine|Theta Pinch)") { return "Amun Dunn" }
  if ($Name -match "^Tokamak X-(050|200) Reactor$") { return "Amun Dunn" }
  if ($Name -match "(DC\d+|Fusor|Spheromak)") { return "Deep Core" }
  if ($Name -match "(Ion Beam|Pinch)") { return "Xiang" }
  if ($Name -match "^Tokamak X-(100|120S|150|250|300) Reactor$") { return "Xiang" }
  return $null
}

function Get-FuelTankManufacturer {
  param([string]$Name)

  if ($Name -match "^(M\d+ Ulysses|H\d+ Atlas)") { return "Dogstar" }
  if ($Name -match "^(100G He3 Tank|200G He3 Tank|300G He3 Tank|400G He3 Tank|500T He3 Tank|600T He3 Tank|700T He3 Tank|800T He3 Tank|900T He3 Tank)") { return "Ballistic Solutions Inc." }
  if ($Name -match "^Titan") { return "Nautilus" }
  return $null
}

function Get-CargoManufacturer {
  param([string]$Name)

  if ($Name -match "(Ballast|Hauler)") { return "Sextant Shield Systems" }
  if ($Name -match "(Caravel|Galleon)") { return "Protectorate Systems" }
  if ($Name -match "StorMax") { return "Dogstar" }
  if ($Name -match "(da Gama|Polo)") { return "Panoptes" }
  return $null
}

function Get-CockpitManufacturer {
  param([string]$Name)

  if ($Name -match "^(Armstrong|Commander)") { return "Hopetech" }
  if ($Name -match "^(Cabot|Magellan)") { return "Nova Galactic" }
  if ($Name -match "^(Daimyo|Himeji|Samurai|Shogun)") { return "Taiyo Astroneering" }
  if ($Name -match "^(DS|Phobos|Ares|Viking)") { return "Deimos" }
  if ($Name -match "^(Kon-Tiki|Overseer|Drake)") { return "Stroud-Eklund" }
  return $null
}

function Get-LandingGearManufacturer {
  param([string]$Name)

  if ($Name -match "^(220CB|320CB)") { return "Deimos" }
  if ($Name -match "^Accu-Lander") { return "Taiyo Astroneering" }
  if ($Name -match "^Hope") { return "Hopetech" }
  if ($Name -match "^NG-") { return "Nova Galactic" }
  if ($Name -match "^Pinpoint") { return "Taiyo Astroneering" }
  return $null
}

function Get-DockerManufacturer {
  param([string]$Name)

  if ($Name -match "^(100DP|110DP)") { return "Deimos" }
  if ($Name -match "^Connect-Pro") { return "Stroud-Eklund" }
  if ($Name -match "^Extender Port") { return "Taiyo Astroneering" }
  if ($Name -match "^Hope") { return "Hopetech" }
  if ($Name -match "^NG-") { return "Nova Galactic" }
  return $null
}

function Get-LandingBayManufacturer {
  param([string]$Name)

  if ($Name -match "^120LD") { return "Deimos" }
  if ($Name -match "^Hope") { return "Hopetech" }
  if ($Name -match "^NG-") { return "Nova Galactic" }
  if ($Name -match "^Ship Bed") { return "Stroud-Eklund" }
  if ($Name -match "^Stability Pro") { return "Taiyo Astroneering" }
  return $null
}

function Get-HabManufacturer {
  param([string]$Name)

  if ($Name -match "^Deimos") { return "Deimos" }
  if ($Name -match "^HopeTech") { return "Hopetech" }
  if ($Name -match "^Nova ") { return "Nova Galactic" }
  if ($Name -match "^Stroud") { return "Stroud-Eklund" }
  if ($Name -match "^Taiyo") { return "Taiyo Astroneering" }
  return $null
}

function Get-StructuralManufacturer {
  param([string]$Name)

  if ($Name -match "^Deimos") { return "Deimos" }
  if ($Name -match "^Equipment Plate") { return "Taiyo Astroneering" }
  if ($Name -match "^HopeTech") { return "Hopetech" }
  if ($Name -match "^Horizon") { return "Horizon Defense" }
  if ($Name -match "^Nova|^Porthole") { return "Nova Galactic" }
  if ($Name -match "^Stroud") { return "Stroud-Eklund" }
  if ($Name -match "^Taiyo") { return "Taiyo Astroneering" }
  if ($Name -match "^Armor Plating") { return "Nova Galactic" }
  return $null
}

function Get-EquipmentManufacturer {
  param([string]$Name)

  if ($Name -match "^(Advanced Ship Scrap Unit|Anti-Targeting System|Buoyant Insulators|EM Pulse Shielding|Evasive Stealth Drive|Extended Comm Array|Micro-Reactor|Repair System Overdrive|Shield Refractor Unit)$") { return $null }
  if ($Name -match "ComSpike|Conduction Grid") { return "Crimson Fleet" }
  if ($Name -match "^Scan Jammer") { return "Horizon Defense" }
  if ($Name -match "Antenna") { return "Nova Galactic" }
  return $null
}

function Get-VehicleManufacturer {
  param([string]$Name)

  if ($Name -eq "Deimog") { return "Deimos" }
  if ($Name -eq "Moon Jumper") { return "Stroud-Eklund" }
  if ($Name -eq "REV-8") { return "Nova Galactic" }
  return $null
}

function Get-HabVariantSize {
  param([string]$Name)

  $match = [regex]::Match($Name, '(\d+x\d+(x\d+)?)')
  if ($match.Success) {
    return $match.Groups[1].Value
  }

  return $null
}

function Get-UtilityTags {
  param(
    [string]$ModuleType,
    [string]$ModuleClass,
    [string[]]$ExtraTags
  )

  $classTag = if ($ModuleClass) { "class-$($ModuleClass.ToLowerInvariant())" } else { $null }
  return Get-UniqueArray @($ModuleType, $classTag) + $ExtraTags
}

function New-VendorSummary {
  param(
    [string]$Status,
    [string[]]$Locations,
    [string[]]$Notes,
    [string[]]$ReferenceUrls
  )

  $normalizedLocations = Get-UniqueArray $Locations
  $normalizedNotes = Get-UniqueArray $Notes
  $normalizedReferenceUrls = Get-UniqueArray $ReferenceUrls
  $locationList = New-Object System.Collections.ArrayList
  $noteList = New-Object System.Collections.ArrayList
  $referenceUrlList = New-Object System.Collections.ArrayList

  foreach ($location in $normalizedLocations) {
    [void]$locationList.Add($location)
  }

  foreach ($note in $normalizedNotes) {
    [void]$noteList.Add($note)
  }

  foreach ($referenceUrl in $normalizedReferenceUrls) {
    [void]$referenceUrlList.Add($referenceUrl)
  }

  return [pscustomobject]@{
    status = $Status
    locations = $locationList
    notes = $noteList
    referenceUrls = $referenceUrlList
  }
}

function Get-VendorSummaryPriority {
  param([object]$Summary)

  if (-not $Summary) { return 0 }

  switch ($Summary.status) {
    "partially_collected" { return 100 }
    "verified_manufacturer_shop" { return 90 }
    "verified_quest_unlock" { return 85 }
    "verified_various_ship_technicians" { return 80 }
    "free_unlock" { return 75 }
    "inferred_faction_unlock" { return 70 }
    "inferred_smuggling_vendor" { return 65 }
    "inferred_vehicle_vendor" { return 60 }
    "inferred_manufacturer" { return 50 }
    "inferred_general_pool" { return 40 }
    default { return 10 }
  }
}

function Merge-VendorSummary {
  param(
    [object]$ExistingSummary,
    [object]$SeedSummary
  )

  if (-not $ExistingSummary) { return $SeedSummary }
  if (-not $SeedSummary) { return $ExistingSummary }
  if ($ExistingSummary.status -eq "partially_collected") { return $ExistingSummary }

  if ((Get-VendorSummaryPriority $SeedSummary) -ge (Get-VendorSummaryPriority $ExistingSummary)) {
    return $SeedSummary
  }

  return $ExistingSummary
}

function Get-ShipyardVendorLocations {
  param([string]$Manufacturer)

  switch ($Manufacturer) {
    "Deimos" { return @("Sol - Deimos Staryard") }
    "Hopetech" { return @("Valo - Ship Services Technician (HopeTown)") }
    "Nova Galactic" { return @("Sol - Ship Services Technician (New Homestead)") }
    "Stroud-Eklund" { return @("Narion - Stroud-Eklund Staryard") }
    "Taiyo Astroneering" { return @("Volii - Taiyo Astroneering Showroom (Neon)") }
    default { return @() }
  }
}

function Get-GeneralVendorPool {
  param([string]$ModuleType)

  switch ($ModuleType) {
    "reactor" {
      return @(
        "Cheyenne - Ship Services Technician (Akila City)",
        "Narion - Havershaw",
        "Narion - Ship Services Technician (The Clinic)",
        "Porrima - Lon Anderssen",
        "Valo - Inaya Rehman",
        "Volii - Veronica Young"
      )
    }
    "engine" {
      return @(
        "Alpha Centauri - Ship Services Technician (New Atlantis)",
        "Cheyenne - Ship Services Technician (Akila City)",
        "Narion - Ship Services Technician (The Clinic)",
        "Porrima - Ship Services Technician (Paradiso)",
        "Valo - Inaya Rehman",
        "Volii - Veronica Young",
        "Shipbuilder (Outpost)"
      )
    }
    "grav_drive" {
      return @(
        "Alpha Centauri - Ship Services Technician (New Atlantis)",
        "Cheyenne - Ship Services Technician (Akila City)",
        "Narion - Ship Services Technician (The Clinic)",
        "Porrima - Ship Services Technician (Paradiso)",
        "Valo - Inaya Rehman",
        "Volii - Veronica Young",
        "Shipbuilder (Outpost)"
      )
    }
    "shield_generator" {
      return @(
        "Algorab - Danica Volkov",
        "Alpha Centauri - Ship Services Technician (Gagarin)",
        "Alpha Centauri - Ship Services Technician (New Atlantis)",
        "Sol - Ship Services Technician (Cydonia)",
        "Sol - Ship Services Technician (New Homestead)",
        "Wolf - Ship Services Technician (The Den)"
      )
    }
    "weapon" {
      return @(
        "Alpha Centauri - Ship Services Technician (New Atlantis)",
        "Cheyenne - Ship Services Technician (Akila City)",
        "Ixyll - Ship Services Technician (Eleos Retreat)",
        "Narion - Havershaw",
        "Narion - Ship Services Technician (The Clinic)",
        "Porrima - Lon Anderssen",
        "Shipbuilder (Outpost)"
      )
    }
    "fuel_tank" {
      return @(
        "Alpha Centauri - Ship Services Technician (New Atlantis)",
        "Cheyenne - Ship Services Technician (Akila City)",
        "Valo - Ship Services Technician (HopeTown)",
        "Volii - Ship Services Technician (Neon)",
        "Porrima - Ship Services Technician (Paradiso)",
        "Shipbuilder (Outpost)"
      )
    }
    "cargo_hold" {
      return @(
        "Alpha Centauri - Ship Services Technician (New Atlantis)",
        "Cheyenne - Ship Services Technician (Akila City)",
        "Valo - Ship Services Technician (HopeTown)",
        "Volii - Ship Services Technician (Neon)",
        "Porrima - Ship Services Technician (Paradiso)",
        "Shipbuilder (Outpost)"
      )
    }
    "equipment" {
      return @(
        "Alpha Centauri - Ship Services Technician (New Atlantis)",
        "Cheyenne - Ship Services Technician (Akila City)",
        "Porrima - Ship Services Technician (Paradiso)",
        "Volii - Ship Services Technician (Neon)",
        "Shipbuilder (Outpost)"
      )
    }
    "vehicle" {
      return @(
        "Alpha Centauri - Ship Services Technician (New Atlantis)",
        "Cheyenne - Ship Services Technician (Akila City)",
        "Sol - Ship Services Technician (New Homestead)",
        "Volii - Ship Services Technician (Neon)",
        "Shipbuilder (Outpost)"
      )
    }
    default {
      return @(
        "Alpha Centauri - Ship Services Technician (New Atlantis)",
        "Cheyenne - Ship Services Technician (Akila City)",
        "Volii - Ship Services Technician (Neon)",
        "Shipbuilder (Outpost)"
      )
    }
  }
}

function Get-ManufacturerReferenceUrl {
  param([string]$Manufacturer)

  switch ($Manufacturer) {
    "Deimos" { return "https://game8.co/games/Starfield/archives/427373" }
    "Hopetech" { return "https://game8.co/games/Starfield/archives/427364" }
    "Nova Galactic" { return "https://game8.co/games/Starfield/archives/427369" }
    "Taiyo Astroneering" { return "https://game8.co/games/Starfield/archives/427359" }
    "Stroud-Eklund" { return "https://game8.co/games/Starfield/archives/427372" }
    "Amun Dunn" { return "https://game8.co/games/Starfield/archives/427363" }
    "Ballistic Solutions Inc." { return "https://game8.co/games/Starfield/archives/427365" }
    "Deep Core" { return "https://game8.co/games/Starfield/archives/427361" }
    "Dogstar" { return "https://game8.co/games/Starfield/archives/427374" }
    "Horizon Defense" { return "https://game8.co/games/Starfield/archives/427371" }
    "Light Scythe" { return "https://game8.co/games/Starfield/archives/427375" }
    "Nautilus" { return "https://game8.co/games/Starfield/archives/427357" }
    "Panoptes" { return "https://game8.co/games/Starfield/archives/427360" }
    "Protectorate Systems" { return "https://game8.co/games/Starfield/archives/427367" }
    "Reladyne" { return "https://game8.co/games/Starfield/archives/427370" }
    "Sextant Shield Systems" { return "https://game8.co/games/Starfield/archives/427362" }
    "Shinigami" { return "https://game8.co/games/Starfield/archives/427366" }
    "Slayton Aerospace" { return "https://game8.co/games/Starfield/archives/427376" }
    "Vanguard" { return "https://game8.co/games/Starfield/archives/427828" }
    "Xiang" { return "https://game8.co/games/Starfield/archives/427358" }
    default { return $null }
  }
}

function Get-VanguardUnlockReferenceUrls {
  param([string]$Name)

  switch ($Name) {
    "Vanguard Bulwark Shield Generator" { return @("https://game8.co/games/Starfield/archives/427828") }
    "Vanguard Hellfire Autocannon" { return @("https://game8.co/games/Starfield/archives/427871") }
    "Vanguard Tempest CE-13 Missile Launcher" { return @("https://game8.co/games/Starfield/archives/427869") }
    "Vanguard Obliterator Autoprojector" { return @("https://game8.co/games/Starfield/archives/427870") }
    "Vanguard Ares Particle Cannon" { return @("https://game8.co/games/Starfield/archives/427873") }
    "Vanguard Starseeker Pulse Laser" { return @("https://game8.co/games/Starfield/archives/427872") }
    default { return @("https://game8.co/games/Starfield/archives/427828") }
  }
}

function Get-ModuleVendorSummary {
  param(
    [string]$Name,
    [string]$ModuleType,
    [string]$Manufacturer,
    [string]$SpecialTag
  )

  if ($Name -eq "Deimog" -or $SpecialTag -eq "Free Creation") {
    return New-VendorSummary -Status "free_unlock" -Locations @("Creation Club - Free Creation unlock") -Notes @(
      "Este item foi marcado como Free Creation no catalogo base.",
      "Nao segue o mesmo fluxo de compra dos ship technicians."
    ) -ReferenceUrls @("https://inara.cz/starfield/ship-modules-list/994/")
  }

  if ($Name -in @("ComSpike", "Conduction Grid")) {
    return New-VendorSummary -Status "inferred_faction_unlock" -Locations @("Kryx - Jasmine Durand (The Key)") -Notes @(
      "Modulo ligado a conteudo da Crimson Fleet.",
      "Pode depender de progresso de faccao ou desbloqueio especifico."
    ) -ReferenceUrls @("https://inara.cz/starfield/ship-modules-list/993/")
  }

  if ($Name -like "Scan Jammer*") {
    return New-VendorSummary -Status "inferred_smuggling_vendor" -Locations @("Porrima - Lon Anderssen") -Notes @(
      "Pool inferido para modulos de contrabando e evasao de scan.",
      "Estoque e disponibilidade podem variar."
    ) -ReferenceUrls @("https://inara.cz/starfield/ship-modules-list/993/")
  }

  if ($Name -eq "Vanguard Bulwark Shield Generator" -or $Name -like "Vanguard *") {
    return New-VendorSummary -Status "verified_quest_unlock" -Locations @(
      "Alpha Centauri - Ship Services Technician (New Atlantis)",
      "Alpha Centauri - Ship Services Technician (Gagarin)",
      "Cheyenne - Ship Services Technician (Akila City)",
      "Sol - Ship Services Technician (Cydonia)",
      "Sol - Nikau Henderson (Deimos Staryard)",
      "Valo - Ship Services Technician (Hopetown)",
      "Valo - HopeTech Showroom (Hopetown)",
      "Volii - Ship Services Technician (Neon)",
      "Volii - Stroud-Eklund Showroom (Neon)",
      "Volii - Taiyo Astroneering Showroom (Neon)",
      "Porrima - Ship Services Technician (Paradiso)",
      "Porrima - Lon Anderssen (Red Mile)",
      "Narion - Havershaw (Stroud-Eklund Staryard)",
      "Narion - Ship Services Technician (The Clinic)",
      "Wolf - Ship Services Technician (The Den)",
      "Ixyll - Ship Services Technician (The Eleos Retreat)",
      "Kryx - Ship Services (The Key)"
    ) -Notes @(
      "Modulo desbloqueado apos completar Grunt Work na questline UC Vanguard.",
      "Depois do desbloqueio, ele pode aparecer em varios ship technicians e showrooms."
    ) -ReferenceUrls (Get-VanguardUnlockReferenceUrls $Name)
  }

  if ($Manufacturer -eq "Deimos" -and $ModuleType -eq "structural" -and $Name -like "Deimos *") {
    return New-VendorSummary -Status "verified_manufacturer_shop" -Locations @(
      "Alpha Centauri - Ship Services Technician (New Atlantis)",
      "Alpha Centauri - Ship Services Technician (Gagarin)",
      "Sol - Ship Services Technician (Cydonia)",
      "Sol - Nikau Henderson (Deimos Staryard)"
    ) -Notes @(
      "Familia estrutural Deimos confirmada em paginas publicas individuais da Game8.",
      "Os exemplos conferidos mostram o mesmo pool de vendor para belly, bumper, hull, skeg, spine, tail e wing."
    ) -ReferenceUrls @(
      "https://game8.co/games/Starfield/archives/428549",
      "https://game8.co/games/Starfield/archives/428553",
      "https://game8.co/games/Starfield/archives/428556",
      "https://game8.co/games/Starfield/archives/428559",
      "https://game8.co/games/Starfield/archives/428567",
      "https://game8.co/games/Starfield/archives/428569",
      "https://game8.co/games/Starfield/archives/421085"
    )
  }

  $shipyardTypes = @("cockpit", "hab", "landing_gear", "docker", "landing_bay", "structural")
  $shipyardLocations = Get-ShipyardVendorLocations $Manufacturer
  $manufacturerReferenceUrl = Get-ManufacturerReferenceUrl $Manufacturer

  $verifiedManufacturerTypes = @{
    "Deimos" = @("cockpit", "hab", "landing_bay", "docker", "landing_gear")
    "Hopetech" = @("cockpit", "hab", "landing_bay", "docker", "landing_gear", "structural")
    "Nova Galactic" = @("cockpit", "hab", "landing_bay", "docker", "landing_gear", "grav_drive")
    "Stroud-Eklund" = @("cockpit", "hab", "landing_bay", "docker", "structural")
    "Taiyo Astroneering" = @("cockpit", "hab", "landing_bay", "docker", "landing_gear", "structural")
  }

  if ($verifiedManufacturerTypes.ContainsKey($Manufacturer) -and $verifiedManufacturerTypes[$Manufacturer] -contains $ModuleType) {
    $verifiedLocations = switch ($Manufacturer) {
      "Hopetech" { @("Valo - HopeTech Showroom (Hopetown)", "Valo - Ship Services Technician (Hopetown)") }
      "Nova Galactic" { @("Sol - Ship Services Technician (New Homestead)") }
      "Stroud-Eklund" { @("Volii - Stroud-Eklund Showroom (Neon)", "Narion - Stroud-Eklund Staryard") }
      "Taiyo Astroneering" { @("Volii - Taiyo Astroneering Showroom (Neon)") }
      "Deimos" { @("Sol - Deimos Staryard") }
      default { $shipyardLocations }
    }

    return New-VendorSummary -Status "verified_manufacturer_shop" -Locations $verifiedLocations -Notes @(
      "Localizacao confirmada em guia publico por fabricante.",
      "A mesma fonte indica que esse fabricante tambem pode aparecer em alguns ship technicians e showrooms gerais."
    ) -ReferenceUrls @($manufacturerReferenceUrl)
  }

  $verifiedGeneralManufacturers = @(
    "Amun Dunn",
    "Ballistic Solutions Inc.",
    "Deep Core",
    "Dogstar",
    "Horizon Defense",
    "Light Scythe",
    "Nautilus",
    "Panoptes",
    "Protectorate Systems",
    "Reladyne",
    "Sextant Shield Systems",
    "Shinigami",
    "Slayton Aerospace",
    "Xiang"
  )

  if ($verifiedGeneralManufacturers -contains $Manufacturer) {
    return New-VendorSummary -Status "verified_various_ship_technicians" -Locations (Get-GeneralVendorPool $ModuleType) -Notes @(
      "Guia publico por fabricante informa que esses modulos sao vendidos em varios ship technicians, showrooms e staryards.",
      "Nao existe showroom ou shipyard dedicado especifico para esse fabricante."
    ) -ReferenceUrls @($manufacturerReferenceUrl)
  }

  if ($shipyardTypes -contains $ModuleType -and $shipyardLocations.Count -gt 0) {
    $notes = @(
      "Local dedicado do fabricante inferido a partir da familia do modulo.",
      "Parte desse catalogo tambem pode aparecer no shipbuilder de outpost, mas o estoque costuma ser mais limitado."
    )

    if ($SpecialTag) {
      $notes += "Este modulo tambem carrega a tag especial '$SpecialTag' no catalogo."
    }

    return New-VendorSummary -Status "inferred_manufacturer" -Locations $shipyardLocations -Notes $notes -ReferenceUrls @($manufacturerReferenceUrl)
  }

  if ($ModuleType -eq "vehicle") {
    $vehicleLocations = if ($shipyardLocations.Count -gt 0) { $shipyardLocations } else { Get-GeneralVendorPool $ModuleType }
    return New-VendorSummary -Status "inferred_vehicle_vendor" -Locations $vehicleLocations -Notes @(
      "Pool inicial para veiculos e modulos de superficie.",
      "A disponibilidade exata pode variar por atualizacao, DLC e vendor."
    ) -ReferenceUrls @("https://inara.cz/starfield/ship-modules-list/994/")
  }

  $generalLocations = Get-GeneralVendorPool $ModuleType

  if ($generalLocations.Count -gt 0) {
    $notes = @(
      "Pool inicial inferido para esse tipo de modulo a partir de ship technicians e vendors especializados.",
      "A disponibilidade exata pode variar por nivel, progresso e rotacao de estoque."
    )

    if ($shipyardLocations.Count -gt 0 -and $ModuleType -in @("fuel_tank", "cargo_hold")) {
      $generalLocations = @($generalLocations + $shipyardLocations)
      $notes += "Como a familia desse modulo tem fabricante conhecido, o vendor dedicado do fabricante tambem foi incluido como referencia."
    }

    if ($SpecialTag) {
      $notes += "Este modulo tambem carrega a tag especial '$SpecialTag' no catalogo."
    }

    return New-VendorSummary -Status "inferred_general_pool" -Locations $generalLocations -Notes $notes -ReferenceUrls @($manufacturerReferenceUrl)
  }

  return New-VendorSummary -Status "not_collected" -Locations @() -Notes @(
    "Ainda sem pool inicial definido para este modulo."
  ) -ReferenceUrls @()
}

function New-SeedItem {
  param(
    [string]$Name,
    [string]$ModuleType,
    [string]$ModuleClass,
    [string]$SpecialTag,
    [string]$Manufacturer,
    [int]$RequiredLevel,
    [string]$SourceUrl,
    [hashtable]$Stats,
    [string]$WeaponType,
    [string[]]$UtilityTags
  )

  $item = [ordered]@{
    id = "module-$ModuleType-$(Convert-ToSlug $Name)"
    name = $Name
    moduleType = $ModuleType
    moduleClass = $ModuleClass
    manufacturer = $Manufacturer
    requiredLevel = $RequiredLevel
    requiredSkills = @()
    collectionStatus = "cataloged_from_inara_list"
    sourceUrl = $SourceUrl
    stats = [pscustomobject]$Stats
    utilityTags = $UtilityTags
    notes = @()
    vendorSummary = Get-ModuleVendorSummary -Name $Name -ModuleType $ModuleType -Manufacturer $Manufacturer -SpecialTag $SpecialTag
  }

  if ($SpecialTag) {
    $item.specialTag = $SpecialTag
  }

  if ($WeaponType) {
    $item.weaponType = $WeaponType
  }
  return [pscustomobject]$item
}

function Parse-SeedLine {
  param(
    [string]$Name,
    [string]$Line,
    [string]$ModuleType,
    [string]$SourceUrl
  )

  if (-not $Line.Trim()) {
    return $null
  }

  $match = [regex]::Match($Line, '^L\d+:\s+(.+)$')
  if (-not $match.Success) {
    throw "Linha invalida: $Line"
  }
  $tokens = @($match.Groups[1].Value.Trim() -split "\s+")

  $specialTag = $null
  $moduleClass = $null
  $cursor = 0
  $classedTypes = @("reactor", "engine", "shield_generator", "grav_drive", "weapon")

  if ($classedTypes -contains $ModuleType) {
    $moduleClass = $tokens[0]
    $cursor = 1

    if ($moduleClass -notin @("A", "B", "C")) {
      $specialTag = $moduleClass
      $moduleClass = $tokens[1]
      $cursor = 2
    }
  }
  elseif ($tokens[0] -notmatch "^[0-9]") {
    if ($tokens[0] -in @("DLC", "TER")) {
      $specialTag = $tokens[0]
      $cursor = 1
    }
  }

  switch ($ModuleType) {
    "reactor" {
      $statsTokens = $tokens[$cursor..($cursor + 6)]
      return New-SeedItem -Name $name -ModuleType $ModuleType -ModuleClass $moduleClass -SpecialTag $specialTag -Manufacturer (Get-ReactorManufacturer $name) -RequiredLevel (Convert-ToInt $statsTokens[6]) -SourceUrl $SourceUrl -Stats ([ordered]@{
        power = Convert-ToInt $statsTokens[0]
        repairRate = Convert-ToFloat $statsTokens[1]
        health = Convert-ToInt $statsTokens[2]
        hull = Convert-ToInt $statsTokens[3]
        mass = Convert-ToInt $statsTokens[4]
        value = Convert-ToInt $statsTokens[5]
      }) -UtilityTags (Get-UtilityTags -ModuleType $ModuleType -ModuleClass $moduleClass -ExtraTags @("cataloged", "core-module", $(if ($specialTag) { "special-$($specialTag.ToLowerInvariant())" })))
    }
    "engine" {
      $statsTokens = $tokens[$cursor..($cursor + 9)]
      return New-SeedItem -Name $name -ModuleType $ModuleType -ModuleClass $moduleClass -SpecialTag $specialTag -Manufacturer (Get-EngineManufacturer $name) -RequiredLevel (Convert-ToInt $statsTokens[9]) -SourceUrl $SourceUrl -Stats ([ordered]@{
        maxPower = Convert-ToInt $statsTokens[0]
        thrust = Convert-ToInt $statsTokens[1]
        maneuveringThrust = Convert-ToInt $statsTokens[2]
        health = Convert-ToInt $statsTokens[3]
        topSpeed = Convert-ToInt $statsTokens[4]
        thrustPerPower = Convert-ToInt $statsTokens[5]
        maneuveringThrustPerPower = Convert-ToInt $statsTokens[6]
        mass = Convert-ToInt $statsTokens[7]
        value = Convert-ToInt $statsTokens[8]
      }) -UtilityTags (Get-UtilityTags -ModuleType $ModuleType -ModuleClass $moduleClass -ExtraTags @("cataloged", $(if ($specialTag) { "special-$($specialTag.ToLowerInvariant())" })))
    }
    "shield_generator" {
      $statsTokens = $tokens[$cursor..($tokens.Count - 1)]
      $regenToken = $statsTokens[2]
      $regenMatch = [regex]::Match($regenToken, '^([0-9.]+)%([0-9]+)$')
      if (-not $regenMatch.Success) {
        throw "Formato inesperado de regen/per power em shield: $name => $regenToken"
      }

      return New-SeedItem -Name $name -ModuleType $ModuleType -ModuleClass $moduleClass -SpecialTag $specialTag -Manufacturer (Get-ShieldManufacturer $name) -RequiredLevel (Convert-ToInt $statsTokens[5]) -SourceUrl $SourceUrl -Stats ([ordered]@{
        maxPower = Convert-ToInt $statsTokens[0]
        shieldHealth = Convert-ToInt $statsTokens[1]
        shieldRegen = Convert-ToFloat $regenMatch.Groups[1].Value
        shieldHealthPerPower = Convert-ToInt $regenMatch.Groups[2].Value
        mass = Convert-ToInt $statsTokens[3]
        value = Convert-ToInt $statsTokens[4]
      }) -UtilityTags (Get-UtilityTags -ModuleType $ModuleType -ModuleClass $moduleClass -ExtraTags @("cataloged", "defense", $(if ($specialTag) { "special-$($specialTag.ToLowerInvariant())" })))
    }
    "grav_drive" {
      $statsTokens = $tokens[$cursor..($cursor + 5)]
      return New-SeedItem -Name $name -ModuleType $ModuleType -ModuleClass $moduleClass -SpecialTag $specialTag -Manufacturer (Get-GravManufacturer $name) -RequiredLevel (Convert-ToInt $statsTokens[5]) -SourceUrl $SourceUrl -Stats ([ordered]@{
        maxPower = Convert-ToInt $statsTokens[0]
        jumpThrust = Convert-ToInt $statsTokens[1]
        health = Convert-ToInt $statsTokens[2]
        mass = Convert-ToInt $statsTokens[3]
        value = Convert-ToInt $statsTokens[4]
      }) -UtilityTags (Get-UtilityTags -ModuleType $ModuleType -ModuleClass $moduleClass -ExtraTags @("cataloged", "exploration", $(if ($specialTag) { "special-$($specialTag.ToLowerInvariant())" })))
    }
    "weapon" {
      $statsTokens = $tokens[$cursor..($cursor + 8)]
      $weaponType = Get-WeaponType $name
      return New-SeedItem -Name $name -ModuleType $ModuleType -ModuleClass $moduleClass -SpecialTag $specialTag -Manufacturer (Get-WeaponManufacturer $name) -RequiredLevel (Convert-ToInt $statsTokens[8]) -SourceUrl $SourceUrl -Stats ([ordered]@{
        maxPower = Convert-ToInt $statsTokens[0]
        hullDamage = Convert-ToInt $statsTokens[1]
        shieldDamage = Convert-ToInt $statsTokens[2]
        emDamage = Convert-ToInt $statsTokens[3]
        fireRate = Convert-ToFloat $statsTokens[4]
        hullDpsPerPower = Convert-ToInt $statsTokens[5]
        shieldDpsPerPower = Convert-ToInt $statsTokens[6]
        value = Convert-ToInt $statsTokens[7]
      }) -WeaponType $weaponType -UtilityTags (Get-UtilityTags -ModuleType $ModuleType -ModuleClass $moduleClass -ExtraTags @("cataloged", $weaponType, $(if ($specialTag) { "special-$($specialTag.ToLowerInvariant())" })))
    }
    "fuel_tank" {
      $statsTokens = $tokens[$cursor..($cursor + 5)]
      return New-SeedItem -Name $name -ModuleType $ModuleType -ModuleClass $null -SpecialTag $specialTag -Manufacturer (Get-FuelTankManufacturer $name) -RequiredLevel (Convert-ToInt $statsTokens[5]) -SourceUrl $SourceUrl -Stats ([ordered]@{
        fuel = Convert-ToInt $statsTokens[0]
        hull = Convert-ToInt $statsTokens[1]
        fuelPerMass = Convert-ToFloat $statsTokens[2]
        mass = Convert-ToInt $statsTokens[3]
        value = Convert-ToInt $statsTokens[4]
      }) -UtilityTags (Get-UtilityTags -ModuleType $ModuleType -ModuleClass $null -ExtraTags @("cataloged", "exploration", $(if ($specialTag) { "special-$($specialTag.ToLowerInvariant())" })))
    }
    "cargo_hold" {
      $statsTokens = $tokens[$cursor..($cursor + 5)]
      return New-SeedItem -Name $name -ModuleType $ModuleType -ModuleClass $null -SpecialTag $specialTag -Manufacturer (Get-CargoManufacturer $name) -RequiredLevel (Convert-ToInt $statsTokens[5]) -SourceUrl $SourceUrl -Stats ([ordered]@{
        cargo = Convert-ToInt $statsTokens[0]
        hull = Convert-ToInt $statsTokens[1]
        cargoPerMass = Convert-ToFloat $statsTokens[2]
        mass = Convert-ToInt $statsTokens[3]
        value = Convert-ToInt $statsTokens[4]
      }) -UtilityTags (Get-UtilityTags -ModuleType $ModuleType -ModuleClass $null -ExtraTags @("cataloged", "cargo", $(if ($name -match "Shielded") { "shielded-cargo" }), $(if ($specialTag) { "special-$($specialTag.ToLowerInvariant())" })))
    }
    "cockpit" {
      $statsTokens = $tokens[$cursor..($cursor + 5)]
      return New-SeedItem -Name $name -ModuleType $ModuleType -ModuleClass $null -SpecialTag $specialTag -Manufacturer (Get-CockpitManufacturer $name) -RequiredLevel (Convert-ToInt $statsTokens[5]) -SourceUrl $SourceUrl -Stats ([ordered]@{
        cargo = Convert-ToInt $statsTokens[0]
        crewStations = Convert-ToInt $statsTokens[1]
        hull = Convert-ToInt $statsTokens[2]
        mass = Convert-ToInt $statsTokens[3]
        value = Convert-ToInt $statsTokens[4]
      }) -UtilityTags (Get-UtilityTags -ModuleType $ModuleType -ModuleClass $null -ExtraTags @("cataloged", "bridge", $(if ($specialTag) { "special-$($specialTag.ToLowerInvariant())" })))
    }
    "landing_gear" {
      $statsTokens = $tokens[$cursor..($cursor + 4)]
      return New-SeedItem -Name $name -ModuleType $ModuleType -ModuleClass $null -SpecialTag $specialTag -Manufacturer (Get-LandingGearManufacturer $name) -RequiredLevel (Convert-ToInt $statsTokens[4]) -SourceUrl $SourceUrl -Stats ([ordered]@{
        landingThrust = Convert-ToInt $statsTokens[0]
        hull = Convert-ToInt $statsTokens[1]
        mass = Convert-ToInt $statsTokens[2]
        value = Convert-ToInt $statsTokens[3]
      }) -UtilityTags (Get-UtilityTags -ModuleType $ModuleType -ModuleClass $null -ExtraTags @("cataloged", "landing-support", $(if ($specialTag) { "special-$($specialTag.ToLowerInvariant())" })))
    }
    "docker" {
      $statsTokens = $tokens[$cursor..($cursor + 3)]
      return New-SeedItem -Name $name -ModuleType $ModuleType -ModuleClass $null -SpecialTag $specialTag -Manufacturer (Get-DockerManufacturer $name) -RequiredLevel (Convert-ToInt $statsTokens[3]) -SourceUrl $SourceUrl -Stats ([ordered]@{
        hull = Convert-ToInt $statsTokens[0]
        mass = Convert-ToInt $statsTokens[1]
        value = Convert-ToInt $statsTokens[2]
      }) -UtilityTags (Get-UtilityTags -ModuleType $ModuleType -ModuleClass $null -ExtraTags @("cataloged", "required-module", $(if ($specialTag) { "special-$($specialTag.ToLowerInvariant())" })))
    }
    "landing_bay" {
      $statsTokens = $tokens[$cursor..($cursor + 3)]
      return New-SeedItem -Name $name -ModuleType $ModuleType -ModuleClass $null -SpecialTag $specialTag -Manufacturer (Get-LandingBayManufacturer $name) -RequiredLevel (Convert-ToInt $statsTokens[3]) -SourceUrl $SourceUrl -Stats ([ordered]@{
        hull = Convert-ToInt $statsTokens[0]
        mass = Convert-ToInt $statsTokens[1]
        value = Convert-ToInt $statsTokens[2]
      }) -UtilityTags (Get-UtilityTags -ModuleType $ModuleType -ModuleClass $null -ExtraTags @("cataloged", "required-module", $(if ($specialTag) { "special-$($specialTag.ToLowerInvariant())" })))
    }
    "hab" {
      $statStart = $tokens.Count - 6
      $serviceTokens = @()

      if ($statStart -gt $cursor) {
        $serviceTokens = $tokens[$cursor..($statStart - 1)]
      }

      $servicesText = ($serviceTokens -join " ").Trim()
      $statsTokens = $tokens[$statStart..($tokens.Count - 1)]
      $services = @()

      if ($servicesText) {
        $services = @($servicesText -split ",\s*")
      }

      $variantSize = Get-HabVariantSize $name
      return New-SeedItem -Name $name -ModuleType $ModuleType -ModuleClass $null -SpecialTag $specialTag -Manufacturer (Get-HabManufacturer $name) -RequiredLevel (Convert-ToInt $statsTokens[5]) -SourceUrl $SourceUrl -Stats ([ordered]@{
        variantSize = $variantSize
        services = $services
        crewStations = Convert-ToInt $statsTokens[0]
        passengerSlots = Convert-ToInt $statsTokens[1]
        hull = Convert-ToInt $statsTokens[2]
        mass = Convert-ToInt $statsTokens[3]
        value = Convert-ToInt $statsTokens[4]
      }) -UtilityTags (Get-UtilityTags -ModuleType $ModuleType -ModuleClass $null -ExtraTags @("cataloged", "hab", $(if ($specialTag) { "special-$($specialTag.ToLowerInvariant())" })))
    }
    "structural" {
      $statsTokens = $tokens[$cursor..($tokens.Count - 1)]
      return New-SeedItem -Name $name -ModuleType $ModuleType -ModuleClass $null -SpecialTag $specialTag -Manufacturer (Get-StructuralManufacturer $name) -RequiredLevel (Convert-ToInt $statsTokens[2]) -SourceUrl $SourceUrl -Stats ([ordered]@{
        mass = Convert-ToInt $statsTokens[0]
        value = Convert-ToInt $statsTokens[1]
      }) -UtilityTags (Get-UtilityTags -ModuleType $ModuleType -ModuleClass $null -ExtraTags @("cataloged", "cosmetic", $(if ($specialTag) { "special-$($specialTag.ToLowerInvariant())" })))
    }
    "equipment" {
      $statsTokens = $tokens[$cursor..($tokens.Count - 1)]
      return New-SeedItem -Name $name -ModuleType $ModuleType -ModuleClass $null -SpecialTag $specialTag -Manufacturer (Get-EquipmentManufacturer $name) -RequiredLevel (Convert-ToInt $statsTokens[2]) -SourceUrl $SourceUrl -Stats ([ordered]@{
        mass = Convert-ToInt $statsTokens[0]
        value = Convert-ToInt $statsTokens[1]
      }) -UtilityTags (Get-UtilityTags -ModuleType $ModuleType -ModuleClass $null -ExtraTags @("cataloged", "equipment", $(if ($specialTag) { "special-$($specialTag.ToLowerInvariant())" })))
    }
    "vehicle" {
      $specialParts = @()
      while ($cursor -lt $tokens.Count - 3 -and $tokens[$cursor] -notmatch "^[0-9]") {
        $specialParts += $tokens[$cursor]
        $cursor++
      }
      if ($specialParts.Count -gt 0) {
        $specialTag = ($specialParts -join " ")
      }
      $statsTokens = $tokens[$cursor..($tokens.Count - 1)]
      return New-SeedItem -Name $name -ModuleType $ModuleType -ModuleClass $null -SpecialTag $specialTag -Manufacturer (Get-VehicleManufacturer $name) -RequiredLevel (Convert-ToInt $statsTokens[2]) -SourceUrl $SourceUrl -Stats ([ordered]@{
        mass = Convert-ToInt $statsTokens[0]
        value = Convert-ToInt $statsTokens[1]
      }) -UtilityTags (Get-UtilityTags -ModuleType $ModuleType -ModuleClass $null -ExtraTags @("cataloged", "vehicle", $(if ($specialTag) { "special-$($specialTag.ToLowerInvariant().Replace(' ', '-'))" })))
    }
    default {
      throw "Tipo nao suportado: $ModuleType"
    }
  }
}

function Import-SeedCategory {
  param(
    [string]$StatsPath,
    [string]$NamesPath,
    [string]$ModuleType,
    [string]$SourceUrl
  )

  $lines = @(Get-Content $StatsPath)
  $names = @(Get-Content $NamesPath)

  if ($lines.Count -ne $names.Count) {
    throw "Contagem de linhas e nomes nao bate em ${ModuleType}: $($lines.Count) stats vs $($names.Count) nomes."
  }

  $items = for ($index = 0; $index -lt $lines.Count; $index++) {
    Parse-SeedLine -Name $names[$index] -Line $lines[$index] -ModuleType $ModuleType -SourceUrl $SourceUrl
  }

  return @($items | Sort-Object name -Unique)
}

function Get-ExistingItemMap {
  param([object[]]$Items)

  $map = @{}
  foreach ($item in $Items) {
    $map[$item.name] = $item
  }

  return $map
}

function Merge-SeedItems {
  param(
    [object[]]$SeedItems,
    [hashtable]$ExistingItems
  )

  $merged = foreach ($seedItem in $SeedItems) {
    $existingItem = $ExistingItems[$seedItem.name]
    if (-not $existingItem) {
      $seedItem
      continue
    }

    $seedStats = @($seedItem.stats.PSObject.Properties | Where-Object { $_.MemberType -eq "NoteProperty" })
    $existingStats = @($existingItem.stats.PSObject.Properties | Where-Object { $_.MemberType -eq "NoteProperty" })
    $combinedStats = [ordered]@{}

    foreach ($property in $existingStats) {
      $combinedStats[$property.Name] = $property.Value
    }

    foreach ($property in $seedStats) {
      $combinedStats[$property.Name] = $property.Value
    }

    $mergedItem = [ordered]@{
      id = $existingItem.id
      name = $seedItem.name
      moduleType = $seedItem.moduleType
      moduleClass = $existingItem.moduleClass
      manufacturer = if ($seedItem.manufacturer) { $seedItem.manufacturer } else { $existingItem.manufacturer }
      requiredLevel = if ($existingItem.requiredLevel) { $existingItem.requiredLevel } else { $seedItem.requiredLevel }
      requiredSkills = if ($existingItem.requiredSkills.Count -gt 0) { $existingItem.requiredSkills } else { $seedItem.requiredSkills }
      collectionStatus = if ($existingItem.collectionStatus) { $existingItem.collectionStatus } else { $seedItem.collectionStatus }
      sourceUrl = if ($existingItem.sourceUrl) { $existingItem.sourceUrl } else { $seedItem.sourceUrl }
      stats = [pscustomobject]$combinedStats
      utilityTags = Get-UniqueArray @($seedItem.utilityTags + $existingItem.utilityTags)
      notes = if ($existingItem.notes.Count -gt 0) { $existingItem.notes } else { $seedItem.notes }
    }

    if ($seedItem.PSObject.Properties.Name -contains "weaponType") {
      $mergedItem.weaponType = if ($existingItem.PSObject.Properties.Name -contains "weaponType") { $existingItem.weaponType } else { $seedItem.weaponType }
    }

    if ($seedItem.PSObject.Properties.Name -contains "specialTag") {
      $mergedItem.specialTag = if ($existingItem.PSObject.Properties.Name -contains "specialTag") { $existingItem.specialTag } else { $seedItem.specialTag }
    }

    if ($existingItem.PSObject.Properties.Name -contains "vendorSummary" -or $seedItem.PSObject.Properties.Name -contains "vendorSummary") {
      $existingVendorSummary = if ($existingItem.PSObject.Properties.Name -contains "vendorSummary") { $existingItem.vendorSummary } else { $null }
      $seedVendorSummary = if ($seedItem.PSObject.Properties.Name -contains "vendorSummary") { $seedItem.vendorSummary } else { $null }
      $mergedItem.vendorSummary = Merge-VendorSummary -ExistingSummary $existingVendorSummary -SeedSummary $seedVendorSummary
    }

    [pscustomobject]$mergedItem
  }

  return @($merged)
}

function Convert-ToPlainStatsObject {
  param([object]$Stats)

  $normalized = [ordered]@{}
  $ignoredKeys = @("Count", "IsReadOnly", "Keys", "Values", "IsFixedSize", "SyncRoot", "IsSynchronized")

  foreach ($property in ($Stats.PSObject.Properties | Where-Object { $_.MemberType -eq "NoteProperty" -and $ignoredKeys -notcontains $_.Name })) {
    $normalized[$property.Name] = $property.Value
  }

  return [pscustomobject]$normalized
}

$reactors = @()
if ($IncludeReactors) {
  $reactors = Import-SeedCategory -StatsPath (Join-Path $seedRoot "reactors.txt") -NamesPath (Join-Path $seedRoot "reactor-names.txt") -ModuleType "reactor" -SourceUrl "https://inara.cz/starfield/ship-modules-list/990/"
}
$fuelTanks = @()
if ($IncludeFuelTanks) {
  $fuelTanks = Import-SeedCategory -StatsPath (Join-Path $seedRoot "fuel-tanks.txt") -NamesPath (Join-Path $seedRoot "fuel-tank-names.txt") -ModuleType "fuel_tank" -SourceUrl "https://inara.cz/starfield/ship-modules-list/992/"
}
$cargoHolds = @()
if ($IncludeCargoHolds) {
  $cargoHolds = Import-SeedCategory -StatsPath (Join-Path $seedRoot "cargo-holds.txt") -NamesPath (Join-Path $seedRoot "cargo-hold-names.txt") -ModuleType "cargo_hold" -SourceUrl "https://inara.cz/starfield/ship-modules-list/988/"
}
$cockpits = @()
if ($IncludeCockpits) {
  $cockpits = Import-SeedCategory -StatsPath (Join-Path $seedRoot "cockpits.txt") -NamesPath (Join-Path $seedRoot "cockpit-names.txt") -ModuleType "cockpit" -SourceUrl "https://inara.cz/starfield/ship-modules-list/984/"
}
$landingGears = @()
if ($IncludeLandingGears) {
  $landingGears = Import-SeedCategory -StatsPath (Join-Path $seedRoot "landing-gears.txt") -NamesPath (Join-Path $seedRoot "landing-gear-names.txt") -ModuleType "landing_gear" -SourceUrl "https://inara.cz/starfield/ship-modules-list/989/"
}
$dockers = @()
if ($IncludeDockers) {
  $dockers = Import-SeedCategory -StatsPath (Join-Path $seedRoot "dockers.txt") -NamesPath (Join-Path $seedRoot "docker-names.txt") -ModuleType "docker" -SourceUrl "https://inara.cz/starfield/ship-modules-list/987/"
}
$landingBays = @()
if ($IncludeLandingBays) {
  $landingBays = Import-SeedCategory -StatsPath (Join-Path $seedRoot "landing-bays.txt") -NamesPath (Join-Path $seedRoot "landing-bay-names.txt") -ModuleType "landing_bay" -SourceUrl "https://inara.cz/starfield/ship-modules-list/991/"
}
$habs = @()
if ($IncludeHabs) {
  $habs = Import-SeedCategory -StatsPath (Join-Path $seedRoot "habs.txt") -NamesPath (Join-Path $seedRoot "hab-names.txt") -ModuleType "hab" -SourceUrl "https://inara.cz/starfield/ship-modules-list/983/"
}
$structural = @()
if ($IncludeStructural) {
  $structural = Import-SeedCategory -StatsPath (Join-Path $seedRoot "structural.txt") -NamesPath (Join-Path $seedRoot "structural-names.txt") -ModuleType "structural" -SourceUrl "https://inara.cz/starfield/ship-modules-list/985/"
}
$equipment = @()
if ($IncludeEquipment) {
  $equipment = Import-SeedCategory -StatsPath (Join-Path $seedRoot "equipment.txt") -NamesPath (Join-Path $seedRoot "equipment-names.txt") -ModuleType "equipment" -SourceUrl "https://inara.cz/starfield/ship-modules-list/993/"
}
$vehicles = @()
if ($IncludeVehicles) {
  $vehicles = Import-SeedCategory -StatsPath (Join-Path $seedRoot "vehicles.txt") -NamesPath (Join-Path $seedRoot "vehicle-names.txt") -ModuleType "vehicle" -SourceUrl "https://inara.cz/starfield/ship-modules-list/994/"
}
$engines = Import-SeedCategory -StatsPath (Join-Path $seedRoot "engines.txt") -NamesPath (Join-Path $seedRoot "engine-names.txt") -ModuleType "engine" -SourceUrl "https://inara.cz/starfield/ship-modules-list/981/"
$shields = Import-SeedCategory -StatsPath (Join-Path $seedRoot "shields.txt") -NamesPath (Join-Path $seedRoot "shield-names.txt") -ModuleType "shield_generator" -SourceUrl "https://inara.cz/starfield/ship-modules-list/982/"
$gravDrives = Import-SeedCategory -StatsPath (Join-Path $seedRoot "grav-drives.txt") -NamesPath (Join-Path $seedRoot "grav-drive-names.txt") -ModuleType "grav_drive" -SourceUrl "https://inara.cz/starfield/ship-modules-list/986/"
$weapons = @()
if ($IncludeWeapons) {
  $weapons = Import-SeedCategory -StatsPath (Join-Path $seedRoot "weapons.txt") -NamesPath (Join-Path $seedRoot "weapon-names.txt") -ModuleType "weapon" -SourceUrl "https://inara.cz/starfield/ship-modules-list/980/"
}

if ($IncludeReactors -and $reactors.Count -ne 52) { throw "Contagem inesperada de reactors: $($reactors.Count)" }
if ($IncludeFuelTanks -and $fuelTanks.Count -ne 21) { throw "Contagem inesperada de fuel tanks: $($fuelTanks.Count)" }
if ($IncludeCargoHolds -and $cargoHolds.Count -ne 36) { throw "Contagem inesperada de cargo holds: $($cargoHolds.Count)" }
if ($IncludeCockpits -and $cockpits.Count -ne 46) { throw "Contagem inesperada de cockpits: $($cockpits.Count)" }
if ($IncludeLandingGears -and $landingGears.Count -ne 26) { throw "Contagem inesperada de landing gears: $($landingGears.Count)" }
if ($IncludeDockers -and $dockers.Count -ne 8) { throw "Contagem inesperada de dockers: $($dockers.Count)" }
if ($IncludeLandingBays -and $landingBays.Count -ne 5) { throw "Contagem inesperada de landing bays: $($landingBays.Count)" }
if ($IncludeHabs -and $habs.Count -ne 220) { throw "Contagem inesperada de habs: $($habs.Count)" }
if ($IncludeStructural -and $structural.Count -ne 204) { throw "Contagem inesperada de structural: $($structural.Count)" }
if ($IncludeEquipment -and $equipment.Count -ne 18) { throw "Contagem inesperada de equipment: $($equipment.Count)" }
if ($IncludeVehicles -and $vehicles.Count -ne 3) { throw "Contagem inesperada de vehicles: $($vehicles.Count)" }
if ($engines.Count -ne 69) { throw "Contagem inesperada de engines: $($engines.Count)" }
if ($shields.Count -ne 52) { throw "Contagem inesperada de shields: $($shields.Count)" }
if ($gravDrives.Count -ne 41) { throw "Contagem inesperada de grav drives: $($gravDrives.Count)" }
if ($IncludeWeapons -and $weapons.Count -ne 156) { throw "Contagem inesperada de weapons: $($weapons.Count)" }

$current = Get-Content -Raw $dataPath | ConvertFrom-Json
$replaceTypes = @("engine", "shield_generator", "grav_drive")
if ($IncludeReactors) {
  $replaceTypes += "reactor"
}
if ($IncludeFuelTanks) {
  $replaceTypes += "fuel_tank"
}
if ($IncludeCargoHolds) {
  $replaceTypes += "cargo_hold"
}
if ($IncludeCockpits) {
  $replaceTypes += "cockpit"
}
if ($IncludeLandingGears) {
  $replaceTypes += "landing_gear"
}
if ($IncludeDockers) {
  $replaceTypes += "docker"
}
if ($IncludeLandingBays) {
  $replaceTypes += "landing_bay"
}
if ($IncludeHabs) {
  $replaceTypes += "hab"
}
if ($IncludeStructural) {
  $replaceTypes += "structural"
}
if ($IncludeEquipment) {
  $replaceTypes += "equipment"
}
if ($IncludeVehicles) {
  $replaceTypes += "vehicle"
}
if ($IncludeWeapons) {
  $replaceTypes += "weapon"
}
$untouchedItems = @($current.items | Where-Object { $replaceTypes -notcontains $_.moduleType })
$existingItems = Get-ExistingItemMap -Items $current.items

$reactors = Merge-SeedItems -SeedItems $reactors -ExistingItems $existingItems
$fuelTanks = Merge-SeedItems -SeedItems $fuelTanks -ExistingItems $existingItems
$cargoHolds = Merge-SeedItems -SeedItems $cargoHolds -ExistingItems $existingItems
$cockpits = Merge-SeedItems -SeedItems $cockpits -ExistingItems $existingItems
$landingGears = Merge-SeedItems -SeedItems $landingGears -ExistingItems $existingItems
$dockers = Merge-SeedItems -SeedItems $dockers -ExistingItems $existingItems
$landingBays = Merge-SeedItems -SeedItems $landingBays -ExistingItems $existingItems
$habs = Merge-SeedItems -SeedItems $habs -ExistingItems $existingItems
$structural = Merge-SeedItems -SeedItems $structural -ExistingItems $existingItems
$equipment = Merge-SeedItems -SeedItems $equipment -ExistingItems $existingItems
$vehicles = Merge-SeedItems -SeedItems $vehicles -ExistingItems $existingItems
$engines = Merge-SeedItems -SeedItems $engines -ExistingItems $existingItems
$shields = Merge-SeedItems -SeedItems $shields -ExistingItems $existingItems
$gravDrives = Merge-SeedItems -SeedItems $gravDrives -ExistingItems $existingItems
if ($IncludeWeapons) {
  $weapons = Merge-SeedItems -SeedItems $weapons -ExistingItems $existingItems
}

$current.metadata.version = 2
$current.metadata.generatedAt = "2026-04-26"
$current.metadata.notes = if ($IncludeVehicles -or $IncludeEquipment -or $IncludeStructural) {
  @(
    "Dataset inicial para o futuro assistente de construcao de naves.",
    "Todas as categorias publicas de ship modules da INARA agora foram catalogadas no projeto.",
    "O projeto agora traz uma primeira camada de vendors por modulo com pools inferidos e alguns casos parcialmente coletados; a verificacao detalhada ainda pode refinar locais exatos.",
    "Os parametros seguem os valores base mostrados na INARA, sem bonus de skills."
  )
} elseif ($IncludeHabs) {
  @(
    "Dataset inicial para o futuro assistente de construcao de naves.",
    "Reactors, weapons, engines, shield generators, grav drives, fuel tanks, cargo holds, cockpits, landing gears, dockers, landing bays e habs agora foram catalogados por completo a partir das listas publicas da INARA.",
    "O projeto agora traz uma primeira camada de vendors por modulo com pools inferidos e alguns casos parcialmente coletados; a verificacao detalhada ainda pode refinar locais exatos.",
    "Os parametros seguem os valores base mostrados na INARA, sem bonus de skills."
  )
} elseif ($IncludeLandingBays -or $IncludeDockers -or $IncludeLandingGears) {
  @(
    "Dataset inicial para o futuro assistente de construcao de naves.",
    "Reactors, weapons, engines, shield generators, grav drives, fuel tanks, cargo holds, cockpits, landing gears, dockers e landing bays agora foram catalogados por completo a partir das listas publicas da INARA.",
    "O projeto agora traz uma primeira camada de vendors por modulo com pools inferidos e alguns casos parcialmente coletados; a verificacao detalhada ainda pode refinar locais exatos.",
    "Os parametros seguem os valores base mostrados na INARA, sem bonus de skills."
  )
} elseif ($IncludeCockpits -or $IncludeCargoHolds -or $IncludeFuelTanks) {
  @(
    "Dataset inicial para o futuro assistente de construcao de naves.",
    "Reactors, weapons, engines, shield generators, grav drives, fuel tanks, cargo holds e cockpits agora foram catalogados por completo a partir das listas publicas da INARA.",
    "O projeto agora traz uma primeira camada de vendors por modulo com pools inferidos e alguns casos parcialmente coletados; a verificacao detalhada ainda pode refinar locais exatos.",
    "Os parametros seguem os valores base mostrados na INARA, sem bonus de skills."
  )
} elseif ($IncludeReactors) {
  @(
    "Dataset inicial para o futuro assistente de construcao de naves.",
    "Reactors, weapons, engines, shield generators e grav drives agora foram catalogados por completo a partir das listas publicas da INARA.",
    "O projeto agora traz uma primeira camada de vendors por modulo com pools inferidos e alguns casos parcialmente coletados; a verificacao detalhada ainda pode refinar locais exatos.",
    "Os parametros seguem os valores base mostrados na INARA, sem bonus de skills."
  )
} elseif ($IncludeWeapons) {
  @(
    "Dataset inicial para o futuro assistente de construcao de naves.",
    "Weapons, engines, shield generators e grav drives agora foram catalogados por completo a partir das listas publicas da INARA.",
    "O projeto agora traz uma primeira camada de vendors por modulo com pools inferidos e alguns casos parcialmente coletados; a verificacao detalhada ainda pode refinar locais exatos.",
    "Os parametros seguem os valores base mostrados na INARA, sem bonus de skills."
  )
} else {
  @(
    "Dataset inicial para o futuro assistente de construcao de naves.",
    "Engines, shield generators e grav drives agora foram catalogados por completo a partir das listas publicas da INARA.",
    "Weapons ainda seguem em expansao separada para fechar a categoria sem lacunas.",
    "Os parametros seguem os valores base mostrados na INARA, sem bonus de skills."
  )
}

$current.items = @($untouchedItems + $reactors + $fuelTanks + $cargoHolds + $cockpits + $landingGears + $dockers + $landingBays + $habs + $structural + $equipment + $vehicles + $engines + $shields + $gravDrives + $weapons | Sort-Object name)

foreach ($item in $current.items) {
  $item.stats = Convert-ToPlainStatsObject $item.stats
}

$current | ConvertTo-Json -Depth 100 | Set-Content -Path $dataPath -Encoding UTF8

[pscustomobject]@{
  reactors = if ($IncludeReactors) { $reactors.Count } else { 0 }
  fuelTanks = if ($IncludeFuelTanks) { $fuelTanks.Count } else { 0 }
  cargoHolds = if ($IncludeCargoHolds) { $cargoHolds.Count } else { 0 }
  cockpits = if ($IncludeCockpits) { $cockpits.Count } else { 0 }
  landingGears = if ($IncludeLandingGears) { $landingGears.Count } else { 0 }
  dockers = if ($IncludeDockers) { $dockers.Count } else { 0 }
  landingBays = if ($IncludeLandingBays) { $landingBays.Count } else { 0 }
  habs = if ($IncludeHabs) { $habs.Count } else { 0 }
  structural = if ($IncludeStructural) { $structural.Count } else { 0 }
  equipment = if ($IncludeEquipment) { $equipment.Count } else { 0 }
  vehicles = if ($IncludeVehicles) { $vehicles.Count } else { 0 }
  engines = $engines.Count
  shields = $shields.Count
  gravDrives = $gravDrives.Count
  weapons = if ($IncludeWeapons) { $weapons.Count } else { 0 }
  totalItems = $current.items.Count
} | ConvertTo-Json -Depth 5
