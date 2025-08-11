# 🧞 Genie Statusline Wrapper for PowerShell
# Windows PowerShell compatible statusline orchestrator

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$localStatusline = Join-Path $projectRoot "lib" "statusline.js"

# Read stdin data
$stdinData = [System.Console]::In.ReadToEnd()

# Array to collect outputs
$outputs = @()

# Check if running from local development
if (Test-Path $localStatusline) {
    # Local development - use local file
    try {
        $result = $stdinData | node $localStatusline 2>$null
        if ($result) { $outputs += $result }
    } catch {
        $outputs += "🧞 Genie statusline error: $_"
    }
} else {
    # Installed via npm - use npx
    try {
        $result = $stdinData | npx -y automagik-genie statusline 2>$null
        if ($result) { $outputs += $result }
    } catch {
        $outputs += "🧞 Genie statusline not found"
    }
}

# Add empty line separator
$outputs += ""

# Run ccusage statusline if available (optional)
try {
    $ccusageResult = $stdinData | npx -y ccusage statusline 2>$null
    if ($ccusageResult) { $outputs += $ccusageResult }
} catch {
    # Silently ignore if ccusage is not available
}

# Output all results
$outputs -join "`n"