resource "aws_api_gateway_rest_api" "cloudshop_api" {
  name        = "${var.environment}-cloudshop-api"
  description = "API Gateway para la plataforma CloudShop Enterprise"
}


# USUARIOS

resource "aws_lambda_function" "auth_service" {
  function_name    = "${var.environment}-auth-service"
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  role             = var.lambda_exec_role_arn
  filename         = "../backend/dist/auth/auth_payload.zip"
  source_code_hash = filebase64sha256("../backend/dist/auth/auth_payload.zip")

  environment {
    variables = {
      ENVIRONMENT      = var.environment
      USERS_TABLE_NAME = var.usuarios_table_name
      JWT_SECRET       = var.jwt_secret
    }
  }
}

resource "aws_lambda_permission" "apigw_auth" {
  statement_id  = "AllowExecutionFromAPIGatewayAuth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.cloudshop_api.execution_arn}/*/*"
}

resource "aws_api_gateway_resource" "usuarios_resource" {
  rest_api_id = aws_api_gateway_rest_api.cloudshop_api.id
  parent_id   = aws_api_gateway_rest_api.cloudshop_api.root_resource_id
  path_part   = "usuarios"
}

resource "aws_api_gateway_method" "usuarios_post" {
  rest_api_id   = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id   = aws_api_gateway_resource.usuarios_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "usuarios_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id             = aws_api_gateway_resource.usuarios_resource.id
  http_method             = aws_api_gateway_method.usuarios_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.auth_service.invoke_arn
}

resource "aws_api_gateway_method" "usuarios_get" {
  rest_api_id   = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id   = aws_api_gateway_resource.usuarios_resource.id
  http_method   = "GET"
  authorization = "NONE" # la Lambda valida el JWT internamente vía validarAcceso
}

resource "aws_api_gateway_integration" "usuarios_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id             = aws_api_gateway_resource.usuarios_resource.id
  http_method             = aws_api_gateway_method.usuarios_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.auth_service.invoke_arn
}

resource "aws_api_gateway_resource" "login_resource" {
  rest_api_id = aws_api_gateway_rest_api.cloudshop_api.id
  parent_id   = aws_api_gateway_resource.usuarios_resource.id
  path_part   = "login"
}

resource "aws_api_gateway_method" "login_post" {
  rest_api_id   = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id   = aws_api_gateway_resource.login_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "login_integration" {
  rest_api_id             = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id             = aws_api_gateway_resource.login_resource.id
  http_method             = aws_api_gateway_method.login_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.auth_service.invoke_arn
}

resource "aws_api_gateway_resource" "usuario_id_resource" {
  rest_api_id = aws_api_gateway_rest_api.cloudshop_api.id
  parent_id   = aws_api_gateway_resource.usuarios_resource.id
  path_part   = "{id}"
}

resource "aws_api_gateway_method" "usuario_id_any" {
  rest_api_id   = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id   = aws_api_gateway_resource.usuario_id_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "usuario_id_integration" {
  rest_api_id             = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id             = aws_api_gateway_resource.usuario_id_resource.id
  http_method             = aws_api_gateway_method.usuario_id_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.auth_service.invoke_arn
}

# PRODUCTOS

resource "aws_lambda_function" "catalog_service" {
  function_name    = "${var.environment}-catalog-service"
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  role             = var.lambda_exec_role_arn
  filename         = "../backend/dist/catalog/catalog_payload.zip"
  source_code_hash = filebase64sha256("../backend/dist/catalog/catalog_payload.zip")

  environment {
    variables = {
      PRODUCTOS_TABLE_NAME = var.productos_table_name
      TIENDAS_TABLE_NAME   = var.tiendas_table_name
      JWT_SECRET           = var.jwt_secret
    }
  }
}

resource "aws_lambda_permission" "apigw_catalog" {
  statement_id  = "AllowExecutionFromAPIGatewayCatalog"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.catalog_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.cloudshop_api.execution_arn}/*/*"
}

resource "aws_api_gateway_resource" "productos_resource" {
  rest_api_id = aws_api_gateway_rest_api.cloudshop_api.id
  parent_id   = aws_api_gateway_rest_api.cloudshop_api.root_resource_id
  path_part   = "productos"
}

resource "aws_api_gateway_method" "productos_any" {
  rest_api_id   = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id   = aws_api_gateway_resource.productos_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "productos_integration" {
  rest_api_id             = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id             = aws_api_gateway_resource.productos_resource.id
  http_method             = aws_api_gateway_method.productos_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.catalog_service.invoke_arn
}

resource "aws_api_gateway_resource" "producto_id_resource" {
  rest_api_id = aws_api_gateway_rest_api.cloudshop_api.id
  parent_id   = aws_api_gateway_resource.productos_resource.id
  path_part   = "{id}"
}

resource "aws_api_gateway_method" "producto_id_any" {
  rest_api_id   = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id   = aws_api_gateway_resource.producto_id_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "producto_id_integration" {
  rest_api_id             = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id             = aws_api_gateway_resource.producto_id_resource.id
  http_method             = aws_api_gateway_method.producto_id_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.catalog_service.invoke_arn
}

# PEDIDOS

resource "aws_lambda_function" "order_service" {
  function_name    = "${var.environment}-order-service"
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  role             = var.lambda_exec_role_arn
  filename         = "../backend/dist/orders/orders_payload.zip"
  source_code_hash = filebase64sha256("../backend/dist/orders/orders_payload.zip")

  environment {
    variables = {
      PEDIDOS_TABLE_NAME = var.pedidos_table_name
      EVENT_BUS_NAME     = "${var.environment}-cloudshop-bus"
      JWT_SECRET         = var.jwt_secret
    }
  }
}

resource "aws_lambda_permission" "apigw_orders" {
  statement_id  = "AllowExecutionFromAPIGatewayOrders"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.order_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.cloudshop_api.execution_arn}/*/*"
}

resource "aws_api_gateway_resource" "pedidos_resource" {
  rest_api_id = aws_api_gateway_rest_api.cloudshop_api.id
  parent_id   = aws_api_gateway_rest_api.cloudshop_api.root_resource_id
  path_part   = "pedidos"
}

resource "aws_api_gateway_method" "pedidos_any" {
  rest_api_id   = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id   = aws_api_gateway_resource.pedidos_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "pedidos_integration" {
  rest_api_id             = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id             = aws_api_gateway_resource.pedidos_resource.id
  http_method             = aws_api_gateway_method.pedidos_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.order_service.invoke_arn
}

resource "aws_api_gateway_resource" "pedido_id_resource" {
  rest_api_id = aws_api_gateway_rest_api.cloudshop_api.id
  parent_id   = aws_api_gateway_resource.pedidos_resource.id
  path_part   = "{id}"
}

resource "aws_api_gateway_method" "pedido_id_any" {
  rest_api_id   = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id   = aws_api_gateway_resource.pedido_id_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "pedido_id_integration" {
  rest_api_id             = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id             = aws_api_gateway_resource.pedido_id_resource.id
  http_method             = aws_api_gateway_method.pedido_id_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.order_service.invoke_arn
}

# TIENDAS

resource "aws_lambda_function" "tiendas_service" {
  function_name    = "${var.environment}-tiendas-service"
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  role             = var.lambda_exec_role_arn
  filename         = "../backend/dist/tiendas/tiendas_payload.zip"
  source_code_hash = filebase64sha256("../backend/dist/tiendas/tiendas_payload.zip")

  environment {
    variables = {
      TIENDAS_TABLE_NAME = var.tiendas_table_name
      JWT_SECRET          = var.jwt_secret
    }
  }
}

resource "aws_lambda_permission" "apigw_tiendas" {
  statement_id  = "AllowExecutionFromAPIGatewayTiendas"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.tiendas_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.cloudshop_api.execution_arn}/*/*"
}

resource "aws_api_gateway_resource" "tiendas_resource" {
  rest_api_id = aws_api_gateway_rest_api.cloudshop_api.id
  parent_id   = aws_api_gateway_rest_api.cloudshop_api.root_resource_id
  path_part   = "tiendas"
}

resource "aws_api_gateway_method" "tiendas_any" {
  rest_api_id   = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id   = aws_api_gateway_resource.tiendas_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "tiendas_integration" {
  rest_api_id             = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id             = aws_api_gateway_resource.tiendas_resource.id
  http_method             = aws_api_gateway_method.tiendas_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.tiendas_service.invoke_arn
}

resource "aws_api_gateway_resource" "tienda_id_resource" {
  rest_api_id = aws_api_gateway_rest_api.cloudshop_api.id
  parent_id   = aws_api_gateway_resource.tiendas_resource.id
  path_part   = "{id}"
}

resource "aws_api_gateway_method" "tienda_id_any" {
  rest_api_id   = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id   = aws_api_gateway_resource.tienda_id_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "tienda_id_integration" {
  rest_api_id             = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id             = aws_api_gateway_resource.tienda_id_resource.id
  http_method             = aws_api_gateway_method.tienda_id_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.tiendas_service.invoke_arn
}

# CARRITO

resource "aws_lambda_function" "cart_service" {
  function_name    = "${var.environment}-cart-service"
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  role             = var.lambda_exec_role_arn
  filename         = "../backend/dist/cart/cart_payload.zip"
  source_code_hash = filebase64sha256("../backend/dist/cart/cart_payload.zip")

  environment {
    variables = {
      CARRITOS_TABLE_NAME  = var.carritos_table_name
      PRODUCTOS_TABLE_NAME = var.productos_table_name
      JWT_SECRET           = var.jwt_secret
    }
  }
}

resource "aws_lambda_permission" "apigw_cart" {
  statement_id  = "AllowExecutionFromAPIGatewayCart"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cart_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.cloudshop_api.execution_arn}/*/*"
}

resource "aws_api_gateway_resource" "carrito_resource" {
  rest_api_id = aws_api_gateway_rest_api.cloudshop_api.id
  parent_id   = aws_api_gateway_rest_api.cloudshop_api.root_resource_id
  path_part   = "carrito"
}

resource "aws_api_gateway_method" "carrito_any" {
  rest_api_id   = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id   = aws_api_gateway_resource.carrito_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "carrito_integration" {
  rest_api_id             = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id             = aws_api_gateway_resource.carrito_resource.id
  http_method             = aws_api_gateway_method.carrito_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.cart_service.invoke_arn
}

resource "aws_api_gateway_resource" "carrito_producto_id_resource" {
  rest_api_id = aws_api_gateway_rest_api.cloudshop_api.id
  parent_id   = aws_api_gateway_resource.carrito_resource.id
  path_part   = "{producto_id}"
}

resource "aws_api_gateway_method" "carrito_producto_id_any" {
  rest_api_id   = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id   = aws_api_gateway_resource.carrito_producto_id_resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "carrito_producto_id_integration" {
  rest_api_id             = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id             = aws_api_gateway_resource.carrito_producto_id_resource.id
  http_method             = aws_api_gateway_method.carrito_producto_id_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.cart_service.invoke_arn
}

# REPORTES

resource "aws_lambda_function" "report_service" {
  function_name    = "${var.environment}-report-service"
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  role             = var.lambda_exec_role_arn
  filename         = "../backend/dist/reports/reports_payload.zip"
  source_code_hash = filebase64sha256("../backend/dist/reports/reports_payload.zip")

  environment {
    variables = {
      PEDIDOS_TABLE_NAME   = var.pedidos_table_name
      PRODUCTOS_TABLE_NAME = var.productos_table_name
      TIENDAS_TABLE_NAME   = var.tiendas_table_name
      JWT_SECRET           = var.jwt_secret
    }
  }
}

resource "aws_lambda_permission" "apigw_reportes" {
  statement_id  = "AllowExecutionFromAPIGatewayReportes"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.report_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.cloudshop_api.execution_arn}/*/*"
}

resource "aws_api_gateway_resource" "reportes_resource" {
  rest_api_id = aws_api_gateway_rest_api.cloudshop_api.id
  parent_id   = aws_api_gateway_rest_api.cloudshop_api.root_resource_id
  path_part   = "reportes"
}

resource "aws_api_gateway_method" "reportes_get" {
  rest_api_id   = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id   = aws_api_gateway_resource.reportes_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "reportes_integration" {
  rest_api_id             = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id             = aws_api_gateway_resource.reportes_resource.id
  http_method             = aws_api_gateway_method.reportes_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.report_service.invoke_arn
}


# EVENTOS ASÍNCRONOS

resource "aws_lambda_function" "inventario_service" {
  function_name    = "${var.environment}-inventario-service"
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  role             = var.lambda_exec_role_arn
  filename         = "../backend/dist/events/inventario_payload.zip"
  source_code_hash = filebase64sha256("../backend/dist/events/inventario_payload.zip")

  environment {
    variables = {
      PRODUCTOS_TABLE_NAME = var.productos_table_name
    }
  }
}

resource "aws_lambda_function" "auditoria_service" {
  function_name    = "${var.environment}-auditoria-service"
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  role             = var.lambda_exec_role_arn
  filename         = "../backend/dist/events/auditoria_payload.zip"
  source_code_hash = filebase64sha256("../backend/dist/events/auditoria_payload.zip")

  environment {
    variables = {
      AUDITORIA_TABLE_NAME = var.auditoria_table_name
    }
  }
}

resource "aws_lambda_function" "notificaciones_service" {
  function_name    = "${var.environment}-notificaciones-service"
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  role             = var.lambda_exec_role_arn
  filename         = "../backend/dist/events/notificaciones_payload.zip"
  source_code_hash = filebase64sha256("../backend/dist/events/notificaciones_payload.zip")

  environment {
    variables = {
      SES_SENDER_EMAIL = "no-reply@tudominio.com" # Cambiar por un correo verificado en SES
      USERS_TABLE_NAME = var.usuarios_table_name    # necesario para resolver el correo real del cliente
    }
  }
}


resource "aws_api_gateway_deployment" "cloudshop_deployment" {
  rest_api_id = aws_api_gateway_rest_api.cloudshop_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.usuarios_resource.id,
      aws_api_gateway_resource.login_resource.id,
      aws_api_gateway_resource.usuario_id_resource.id,
      aws_api_gateway_resource.productos_resource.id,
      aws_api_gateway_resource.producto_id_resource.id,
      aws_api_gateway_resource.pedidos_resource.id,
      aws_api_gateway_resource.pedido_id_resource.id,
      aws_api_gateway_resource.tiendas_resource.id,
      aws_api_gateway_resource.tienda_id_resource.id,
      aws_api_gateway_resource.carrito_resource.id,
      aws_api_gateway_resource.carrito_producto_id_resource.id,
      aws_api_gateway_resource.reportes_resource.id,
      aws_api_gateway_integration.usuarios_post_integration.id,
      aws_api_gateway_integration.usuarios_get_integration.id,
      aws_api_gateway_integration.login_integration.id,
      aws_api_gateway_integration.usuario_id_integration.id,
      aws_api_gateway_integration.productos_integration.id,
      aws_api_gateway_integration.producto_id_integration.id,
      aws_api_gateway_integration.pedidos_integration.id,
      aws_api_gateway_integration.pedido_id_integration.id,
      aws_api_gateway_integration.tiendas_integration.id,
      aws_api_gateway_integration.tienda_id_integration.id,
      aws_api_gateway_integration.carrito_integration.id,
      aws_api_gateway_integration.carrito_producto_id_integration.id,
      aws_api_gateway_integration.reportes_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.usuarios_post_integration,
    aws_api_gateway_integration.usuarios_get_integration,
    aws_api_gateway_integration.login_integration,
    aws_api_gateway_integration.usuario_id_integration,
    aws_api_gateway_integration.productos_integration,
    aws_api_gateway_integration.producto_id_integration,
    aws_api_gateway_integration.pedidos_integration,
    aws_api_gateway_integration.pedido_id_integration,
    aws_api_gateway_integration.tiendas_integration,
    aws_api_gateway_integration.tienda_id_integration,
    aws_api_gateway_integration.carrito_integration,
    aws_api_gateway_integration.carrito_producto_id_integration,
    aws_api_gateway_integration.reportes_integration,
  ]
}

resource "aws_api_gateway_stage" "cloudshop_stage" {
  deployment_id = aws_api_gateway_deployment.cloudshop_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.cloudshop_api.id
  stage_name    = var.environment
}