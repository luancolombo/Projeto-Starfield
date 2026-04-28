param(
  [Parameter(Mandatory = $true)]
  [string]$Url,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$headers = @{
  "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
  "Accept" = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  "Accept-Language" = "en-US,en;q=0.9"
}

$maxAttempts = 5

for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
  try {
    $response = Invoke-WebRequest -Uri $Url -Headers $headers -UseBasicParsing
    $response.Content | Set-Content -Path $OutputPath -Encoding UTF8
    exit 0
  }
  catch {
    if ($attempt -eq $maxAttempts) {
      throw
    }

    Start-Sleep -Seconds (2 * $attempt)
  }
}
