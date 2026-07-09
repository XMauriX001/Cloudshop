# Tabla de Usuarios
resource "aws_dynamodb_table" "usuarios" {
  name           = "${var.environment}-usuarios"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "usuario_id"

  attribute {
    name = "usuario_id"
    type = "S"
  }

  attribute {
    name = "correo"
    type = "S"
  }

  global_secondary_index {
    name               = "CorreoIndex"
    hash_key           = "correo"
    projection_type    = "ALL"
  }
}

# Tabla de Tiendas
resource "aws_dynamodb_table" "tiendas" {
  name           = "${var.environment}-tiendas"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "tienda_id"

  attribute {
    name = "tienda_id"
    type = "S"
  }
}

# Tabla de Productos
resource "aws_dynamodb_table" "productos" {
  name           = "${var.environment}-productos"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "producto_id"

  attribute {
    name = "producto_id"
    type = "S"
  }

  attribute {
    name = "tienda_id"
    type = "S"
  }

  attribute {
    name = "categoria"
    type = "S"
  }

  global_secondary_index {
    name               = "TiendaIndex"
    hash_key           = "tienda_id"
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "CategoriaIndex"
    hash_key           = "categoria"
    projection_type    = "ALL"
  }
}

# Tabla de Pedidos
resource "aws_dynamodb_table" "pedidos" {
  name           = "${var.environment}-pedidos"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "pedido_id"

  attribute {
    name = "pedido_id"
    type = "S"
  }

  attribute {
    name = "usuario_id"
    type = "S"
  }

  attribute {
    name = "estado"
    type = "S"
  }

  global_secondary_index {
    name               = "UsuarioIndex"
    hash_key           = "usuario_id"
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "EstadoIndex"
    hash_key           = "estado"
    projection_type    = "ALL"
  }
}

# Tabla de Auditoría
resource "aws_dynamodb_table" "auditoria" {
  name           = "${var.environment}-auditoria"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "auditoria_id"

  attribute {
    name = "auditoria_id"
    type = "S"
  }
}