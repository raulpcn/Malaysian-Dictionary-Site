$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dataFile = Join-Path (Join-Path $scriptDir "..") "js/data.js"
$dataFile = Resolve-Path $dataFile
$raw = Get-Content $dataFile -Raw

$pattern = '{en:"([^"]*)",\s*ms:"([^"]*)",\s*cat:"([^"]*)"'
$allMatches = [regex]::Matches($raw, $pattern)
$matches = $allMatches | Where-Object { $_.Index -gt $raw.IndexOf("var WORDS = [") }

$seen = @{}
$duplicates = @()
$index = 0

foreach ($m in $matches) {
    $en = $m.Groups[1].Value.Trim()
    $ms = $m.Groups[2].Value.Trim()
    $key = ($en + "|" + $ms).ToLower()

    if ($seen.ContainsKey($key)) {
        $duplicates += [PSCustomObject]@{
            en = $en
            ms = $ms
            firstLine = $seen[$key].line
            thisLine = $index
            firstFileLine = $seen[$key].firstFileLine
        }
    } else {
        # Find the actual line number in the file
        $lineNum = $raw.Substring(0, $m.Index).Split("`n").Length
        $seen[$key] = @{ line = $index; firstFileLine = $lineNum }
    }
    $index++
}

if ($duplicates.Count -eq 0) {
    Write-Host "No duplicates found! All $index words are unique." -ForegroundColor Green
} else {
    Write-Host "$($duplicates.Count) duplicate(s) found:" -ForegroundColor Yellow
    $duplicates | ForEach-Object {
        Write-Host ("  #$($_.thisLine) '$($_.en)' / '$($_.ms)'  ←  already at #$($_.firstLine)")
    }
    exit 1
}
