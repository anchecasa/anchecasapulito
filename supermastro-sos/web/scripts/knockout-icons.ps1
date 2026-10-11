Add-Type -AssemblyName System.Drawing

function Remove-GreenScreen([string]$source, [string]$dest) {
  $src = [System.Drawing.Bitmap]::FromFile($source)
  $bmp = New-Object System.Drawing.Bitmap $src.Width, $src.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bmp)
  $graphics.DrawImage($src, 0, 0, $src.Width, $src.Height)
  $graphics.Dispose()
  $src.Dispose()

  $rect = New-Object System.Drawing.Rectangle 0, 0, $bmp.Width, $bmp.Height
  $data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, $bmp.PixelFormat)
  $bytes = New-Object byte[] ($data.Stride * $bmp.Height)
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)

  for ($y = 0; $y -lt $bmp.Height; $y++) {
    $row = $y * $data.Stride
    for ($x = 0; $x -lt $bmp.Width; $x++) {
      $i = $row + ($x * 4)
      $b = $bytes[$i]
      $g = $bytes[$i + 1]
      $r = $bytes[$i + 2]
      $greenness = $g - [Math]::Max($r, $b)
      if ($greenness -gt 36 -and $g -gt 60) {
        $bytes[$i + 3] = 0
        $bytes[$i] = 0
        $bytes[$i + 1] = 0
        $bytes[$i + 2] = 0
      } elseif ($greenness -gt 14) {
        $fade = [Math]::Max(0, [Math]::Min(255, [int](255 * (1 - (($greenness - 14) / 22.0)))))
        $bytes[$i + 3] = [byte]$fade
        $bytes[$i + 1] = [byte]([Math]::Min($g, [Math]::Max($r, $b)))
      }
    }
  }

  [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
  $bmp.UnlockBits($data)
  $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

$root = "C:\Users\palum\.cursor\projects\c-Users-palum-Desktop-04-SuperMastro\assets"
$out = "C:\Users\palum\Desktop\04-SuperMastro\web\public\images"
Remove-GreenScreen "$root\supermastro-icona.jpg" "$out\supermastro-icona.png"
Remove-GreenScreen "$root\procione-1-chiave.jpg" "$out\procione-1.png"
Remove-GreenScreen "$root\procione-2-cassetta.jpg" "$out\procione-2.png"
Remove-GreenScreen "$root\procione-3-stura.jpg" "$out\procione-3.png"
Remove-GreenScreen "$root\procione-4-cacciavite.jpg" "$out\procione-4.png"
Remove-GreenScreen "$root\procione-5-martello.jpg" "$out\procione-5.png"
Write-Output "ok"
