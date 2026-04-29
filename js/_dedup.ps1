$raw = Get-Content "js/data.js" -Raw

# Split into word entries by matching {en:...}
$pattern = [regex]'\{[^{}]+\}'
$matches = $pattern.Matches($raw)

$allWords = @()
$seen = @{}  # key = en|ms lowercase
$dupsRemoved = @()

foreach ($m in $matches) {
    $entry = $m.Value
    # Extract en and ms
    if ($entry -match 'en:"([^"]+)"') { $en = $matches[1] } else { $en = "" }
    if ($entry -match 'ms:"([^"]+)"') { $ms = $matches[1] } else { $ms = "" }
    $key = ($en + "|" + $ms).ToLower().Trim()
    
    if ($seen.ContainsKey($key)) {
        $dupsRemoved += "'$en' | '$ms'"
    } else {
        $seen[$key] = $true
        $allWords += $entry
    }
}

Write-Host "Original entries: $($matches.Count)"
Write-Host "Unique entries: $($allWords.Count)"
Write-Host "Duplicates removed: $($dupsRemoved.Count)"
Write-Host ""
Write-Host "Removed:"
$dupsRemoved | ForEach-Object { Write-Host "  $_" }

# Generate the new file content
$newContent = "var WORDS = [`n  " + ($allWords -join ",`n  ") + "`n];"

# Read the CATEGORIES part
$catMatch = [regex]::Match($raw, '(var CATEGORIES[\s\S]*)$')
if ($catMatch.Success) {
    $newContent += "`n`n" + $catMatch.Value
}

Set-Content "js/data.js" $newContent
Write-Host "`nDone! Clean file written."
