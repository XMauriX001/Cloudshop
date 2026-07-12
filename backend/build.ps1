$ErrorActionPreference = "Stop"

# Crear directorio dist
New-Item -ItemType Directory -Force -Path dist/auth
New-Item -ItemType Directory -Force -Path dist/catalog
New-Item -ItemType Directory -Force -Path dist/orders
New-Item -ItemType Directory -Force -Path dist/reports
New-Item -ItemType Directory -Force -Path dist/events
New-Item -ItemType Directory -Force -Path dist/tiendas
New-Item -ItemType Directory -Force -Path dist/cart

function Compile-And-Zip {
    param (
        [string]$Entrypoint,
        [string]$OutFile,
        [string]$ZipName
    )
    Write-Host "Compilando $Entrypoint -> $OutFile..."
    npx esbuild $Entrypoint --bundle --platform=node --target=node20 --outfile=$OutFile
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error compilando $Entrypoint"
        exit 1
    }

    $dir = Split-Path -Parent $OutFile
    $fileName = Split-Path -Leaf $OutFile
    $zipPath = Join-Path $dir $ZipName

    if ($fileName -ne "index.js") {
        $tempFile = Join-Path $dir "index.js"
        Copy-Item $OutFile $tempFile -Force
        Write-Host "Empaquetando $tempFile -> $zipPath..."
        Compress-Archive -Path $tempFile -DestinationPath $zipPath -Force
        Remove-Item $tempFile -Force
    } else {
        Write-Host "Empaquetando $OutFile -> $zipPath..."
        Compress-Archive -Path $OutFile -DestinationPath $zipPath -Force
    }
}

# Ejecutar las compilaciones y empaquetados
Compile-And-Zip "src/auth/index.ts" "dist/auth/index.js" "auth_payload.zip"
Compile-And-Zip "src/catalog/index.ts" "dist/catalog/index.js" "catalog_payload.zip"
Compile-And-Zip "src/orders/index.ts" "dist/orders/index.js" "orders_payload.zip"
Compile-And-Zip "src/reports/index.ts" "dist/reports/index.js" "reports_payload.zip"
Compile-And-Zip "src/events/auditoria.ts" "dist/events/auditoria.js" "auditoria_payload.zip"
Compile-And-Zip "src/events/inventario.ts" "dist/events/inventario.js" "inventario_payload.zip"
Compile-And-Zip "src/events/notificaciones.ts" "dist/events/notificaciones.js" "notificaciones_payload.zip"
Compile-And-Zip "src/tiendas/index.ts" "dist/tiendas/index.js" "tiendas_payload.zip"
Compile-And-Zip "src/cart/index.ts" "dist/cart/index.js" "cart_payload.zip"

Write-Host "Compilación y empaquetado finalizados exitosamente."