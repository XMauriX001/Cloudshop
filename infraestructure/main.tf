provider "aws" {
  region = "us-east-1"
}

module "database" {
  source      = "./modules/database"
  environment = var.environment
}

module "security" {
  source              = "./modules/security"
  environment         = var.environment
  dynamodb_table_arns = [
    module.database.usuarios_table_arn,
    module.database.productos_table_arn,
    module.database.pedidos_table_arn,
    module.database.tiendas_table_arn,
    module.database.carritos_table_arn,
    module.database.auditoria_table_arn
  ]
}

module "compute" {
  source                = "./modules/compute"
  environment            = var.environment
  lambda_exec_role_arn   = module.security.lambda_exec_role_arn
  usuarios_table_name    = module.database.usuarios_table_name
  productos_table_name   = module.database.productos_table_name
  pedidos_table_name     = module.database.pedidos_table_name
  tiendas_table_name     = module.database.tiendas_table_name
  carritos_table_name    = module.database.carritos_table_name
  auditoria_table_name   = module.database.auditoria_table_name
  jwt_secret             = var.jwt_secret
}

module "events" {
  source      = "./modules/events"
  environment = var.environment

  lambda_inventario_arn     = module.compute.lambda_inventario_arn
  lambda_auditoria_arn      = module.compute.lambda_auditoria_arn
  lambda_notificaciones_arn = module.compute.lambda_notificaciones_arn

  lambda_inventario_function_name     = module.compute.lambda_inventario_function_name
  lambda_auditoria_function_name      = module.compute.lambda_auditoria_function_name
  lambda_notificaciones_function_name = module.compute.lambda_notificaciones_function_name
}

module "frontend" {
  source      = "./modules/frontend"
  environment = var.environment
}

output "URL_SITIO_WEB" {
  value = module.frontend.cloudfront_url
}