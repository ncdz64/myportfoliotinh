# Lightweight local web server for TFT Portfolio
$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

$url = "http://localhost:$port/"
Write-Host "=========================================================="
Write-Host " TFT Mythic Arena Portfolio is running at: $url"
Write-Host " Press Ctrl+C in this window to stop the server."
Write-Host "=========================================================="
Start-Process $url

$root = $PSScriptRoot

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $relPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($relPath)) { $relPath = 'index.html' }
        $filePath = Join-Path $root $relPath

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = switch ($ext) {
                '.html' { 'text/html; charset=utf-8' }
                '.css'  { 'text/css; charset=utf-8' }
                '.js'   { 'application/javascript; charset=utf-8' }
                '.mp4'  { 'video/mp4' }
                '.mp3'  { 'audio/mpeg' }
                '.png'  { 'image/png' }
                '.jpg'  { 'image/jpeg' }
                '.jpeg' { 'image/jpeg' }
                default { 'application/octet-stream' }
            }
            $response.ContentType = $mime
            
            # Support byte range requests for smooth video scrubbing
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}
