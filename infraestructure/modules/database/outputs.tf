output "usuarios_table_name" {
  value = aws_dynamodb_table.usuarios.name
}

output "usuarios_table_arn" {
  value = aws_dynamodb_table.usuarios.arn
}

output "productos_table_name" {
  value = aws_dynamodb_table.productos.name
}

output "productos_table_arn" {
  value = aws_dynamodb_table.productos.arn
}

output "pedidos_table_name" {
  value = aws_dynamodb_table.pedidos.name
}

output "pedidos_table_arn" {
  value = aws_dynamodb_table.pedidos.arn
}

output "auditoria_table_name" {
  value = aws_dynamodb_table.auditoria.name
}

output "auditoria_table_arn" {
  value = aws_dynamodb_table.auditoria.arn
}

output "tiendas_table_name" {
  value = aws_dynamodb_table.tiendas.name
}

output "tiendas_table_arn" { 
  value = aws_dynamodb_table.tiendas.arn
}