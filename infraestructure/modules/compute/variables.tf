variable "environment" {
  description = "Entorno de despliegue para los recursos de computo"
  type        = string
}

variable "lambda_exec_role_arn" {
  description = "ARN del rol de ejecución de IAM para Lambda"
  type        = string
}

variable "usuarios_table_name" {
  description = "Nombre de la tabla de DynamoDB para usuarios"
  type        = string
}

variable "productos_table_name" {
  description = "Nombre de la tabla de DynamoDB para productos"
  type        = string
}

variable "pedidos_table_name" {
  description = "Nombre de la tabla de DynamoDB para pedidos"
  type        = string
}

variable "auditoria_table_name" {
  description = "Nombre de la tabla de DynamoDB para auditoria"
  type        = string
}

variable "tiendas_table_name" {
  description = "Nombre de la tabla de DynamoDB para tiendas"
  type        = string
}

variable "carritos_table_name" {
  description = "Nombre de la tabla de DynamoDB para carritos"
  type        = string
}

variable "jwt_secret" {
  description = "Secreto compartido para firmar y verificar JWT en todas las Lambdas que autentican"
  type        = string
  sensitive   = true
}