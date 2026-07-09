variable "environment" {
  description = "Entorno global de despliegue"
  type        = string
}

variable "lambda_inventario_arn" {
  description = "ARN de la función Lambda que actualiza el inventario"
  type        = string
}

variable "lambda_auditoria_arn" {
  description = "ARN de la función Lambda que registra la auditoría"
  type        = string
}

variable "lambda_notificaciones_arn" {
  description = "ARN de la función Lambda que envía correos mediante SES"
  type        = string
}

# --- Nombres de las Funciones Lambda ---
variable "lambda_inventario_function_name" {
  description = "Nombre de la función Lambda de inventario"
  type        = string
}

variable "lambda_auditoria_function_name" {
  description = "Nombre de la función Lambda de auditoría"
  type        = string
}

variable "lambda_notificaciones_function_name" {
  description = "Nombre de la función Lambda de notificaciones"
  type        = string
}