# CloudShop Enterprise

CloudShop es una plataforma web serverless de comercio electrónico diseñada para ser escalable, segura y altamente disponible. Su arquitectura desacoplada utiliza una infraestructura como código (IaC) administrada por **Terraform** y microservicios en **TypeScript/Node.js** desplegados como funciones **AWS Lambda**.

---

## Arquitectura del Sistema

La solución está construida sobre servicios administrados de AWS:
- **Frontend**: Alojado en un bucket de **S3** y distribuido globalmente mediante **CloudFront CDN** con protección perimetral de **WAF (Web Application Firewall)**.
- **API Gateway**: Punto de entrada único REST API para interactuar con los microservicios del backend.
- **Backend (Lambdas)**: Funciones serverless ejecutando Node.js 20.x empaquetadas con `esbuild`.
- **Base de Datos**: Tablas en **DynamoDB** con escalado bajo demanda (`PAY_PER_REQUEST`).
- **Core de Eventos**: Bus de eventos personalizado en **EventBridge** que coordina tareas asíncronas como auditoría, actualización de inventario y envío de notificaciones por correo (vía **SES**).

---

## Estructura del Proyecto

```text
Cloudshop/
├── backend/               # Código fuente del Backend (TypeScript + Node.js)
│   ├── src/               # Lógica de los servicios (auth, catalog, orders, reports, events)
│   ├── dist/              # Código compilado y empaquetado (.zip) listo para AWS Lambda
│   ├── build.ps1          # Script de PowerShell para compilar y empaquetar servicios
│   └── package.json       # Dependencias y scripts de Node.js
├── frontend/              # Archivos estáticos del cliente (HTML, CSS, JS)
└── infraestructure/       # Configuración de IaC con Terraform
    ├── modules/           # Módulos de infraestructura (compute, database, events, frontend, security)
    ├── main.tf            # Configuración principal de Terraform
    ├── variables.tf       # Variables globales de Terraform
    └── terraform.tfstate  # Estado local de Terraform
```

---

## Prerrequisitos

Antes de comenzar, asegúrate de tener instalado y configurado lo siguiente en tu máquina de desarrollo:

1. **Node.js** (Versión `20.x` o superior recomendada) e `npm`.
2. **Terraform CLI** (Instalado y agregado a tus variables de entorno).
3. **AWS CLI** configurado con tus credenciales de acceso:
   ```bash
   aws configure
   ```
4. **PowerShell** (requerido para ejecutar el script de compilación automática en Windows).

---

## Guía de Despliegue Paso a Paso

Sigue las siguientes instrucciones detalladas para compilar el backend y aprovisionar/desplegar la infraestructura:

### Paso 1: Instalar dependencias del Backend
Navega a la carpeta de backend e instala las dependencias de Node.js necesarias para la compilación y desarrollo:
```powershell
cd backend
npm install
```

### Paso 2: Compilar y empaquetar el Backend
Para desplegar las funciones Lambda en AWS, el código TypeScript debe compilarse a JavaScript y empaquetarse en archivos `.zip`.
Ejecuta el script de construcción de PowerShell:
```powershell
./build.ps1
```
> **Nota de permisos en Windows:** Si PowerShell te muestra un error indicando que la ejecución de scripts está deshabilitada, ejecuta:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
> ./build.ps1
> ```

Este script generará la carpeta `backend/dist/` conteniendo subdirectorios para cada servicio junto con sus respectivos paquetes `.zip` (ej. `auth_payload.zip`, `catalog_payload.zip`, etc.).

### Paso 3: Desplegar la Infraestructura con Terraform
Una vez que los archivos `.zip` del paso anterior estén listos en `backend/dist/`, navega al directorio de infraestructura para aprovisionar los recursos en AWS:

1. Dirígete a la carpeta de infraestructura:
   ```powershell
   cd ../infraestructure
   ```
2. Inicializa Terraform para descargar los proveedores necesarios:
   ```powershell
   terraform init
   ```
3. Genera y revisa el plan de ejecución:
   ```powershell
   terraform plan
   ```
4. Aplica el plan para crear toda la arquitectura en tu cuenta de AWS:
   ```powershell
   terraform apply
   ```
   *Escribe `yes` cuando se te solicite confirmación para proceder.*

Al finalizar exitosamente el despliegue, Terraform mostrará en la consola las salidas (**Outputs**). Asegúrate de anotar los valores clave:
- `URL_SITIO_WEB`: La URL pública de tu CloudFront CDN.
- `s3_bucket_name` (del módulo frontend): El nombre del bucket S3 creado para el frontend.

### Paso 4: Desplegar el Frontend (Opcional)
Si ya cuentas con los archivos estáticos en tu carpeta `frontend/` (ej. `index.html`), puedes sincronizarlos con tu bucket S3 utilizando el AWS CLI:
```powershell
aws s3 sync ../frontend/ s3://<NOMBRE_DE_TU_BUCKET_S3>
```
*Reemplaza `<NOMBRE_DE_TU_BUCKET_S3>` con el valor del output correspondiente que arrojó Terraform en el Paso 3.*

---

## Endpoints de la API

La API REST expone los siguientes puntos de entrada a través de Amazon API Gateway:

| Método | Endpoint | Descripción | Microservicio |
|---|---|---|---|
| **POST** | `/usuarios` | Registro de nuevos usuarios | `auth-service` |
| **POST** | `/usuarios/login` | Autenticación y obtención de JWT | `auth-service` |
| **ANY** | `/productos` | Gestión e consulta de catálogo de productos | `catalog-service` |
| **POST** | `/pedidos` | Creación de pedidos (emite eventos al EventBridge) | `order-service` |
| **GET** | `/reportes` | Obtención de reportes e inteligencia de ventas | `report-service` |

---

## Limpieza de Recursos

Para evitar cargos innecesarios en tu cuenta de AWS, puedes destruir toda la infraestructura creada ejecutando el siguiente comando desde la carpeta `infraestructure/`:
```powershell
terraform destroy
```
*Confirma escribiendo `yes` cuando sea solicitado.*
