variable "environment" {
  description = "Entorno de despliegue para los recursos de seguridad"
  type        = string
}

variable "dynamodb_table_arns" {
  description = "Lista de ARNs de las tablas de DynamoDB que requiere acceder la función Lambda"
  type        = list(string)
}
