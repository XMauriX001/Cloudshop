# Outputs para la Lambda de Inventario
output "lambda_inventario_arn" {
  value = aws_lambda_function.inventario_service.arn
}
output "lambda_inventario_function_name" {
  value = aws_lambda_function.inventario_service.function_name
}

# Outputs para la Lambda de Auditoría
output "lambda_auditoria_arn" {
  value = aws_lambda_function.auditoria_service.arn
}
output "lambda_auditoria_function_name" {
  value = aws_lambda_function.auditoria_service.function_name
}

# Outputs para la Lambda de Notificaciones
output "lambda_notificaciones_arn" {
  value = aws_lambda_function.notificaciones_service.arn
}
output "lambda_notificaciones_function_name" {
  value = aws_lambda_function.notificaciones_service.function_name
}

output "api_invoke_url" {
  value = aws_api_gateway_stage.cloudshop_stage.invoke_url
}