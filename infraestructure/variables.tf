variable "environment" {
  description = "Entorno global"
  type        = string
  default     = "dev"
}

variable "jwt_secret" {
  description = "Secreto para firmar y verificar JWT"
  type        = string
  sensitive   = true
}