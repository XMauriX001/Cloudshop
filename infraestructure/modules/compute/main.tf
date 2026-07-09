resource "aws_api_gateway_rest_api" "cloudshop_api" {
  name        = "${var.environment}-cloudshop-api"
  description = "API Gateway para la plataforma CloudShop Enterprise"
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

resource "aws_lambda_function" "auth_service" {
  function_name    = "${var.environment}-auth-service"
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  role             = var.lambda_exec_role_arn
  filename         = "../backend/dist/auth/auth_payload.zip"
  source_code_hash = filebase64sha256("../backend/dist/auth/auth_payload.zip")

  environment {
    variables = {
      ENVIRONMENT        = var.environment
      USERS_TABLE_NAME   = var.usuarios_table_name
    }
  }
}

resource "aws_api_gateway_integration" "auth_integration" {
  rest_api_id             = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id             = aws_api_gateway_resource.usuarios_resource.id
  http_method             = aws_api_gateway_method.usuarios_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.auth_service.invoke_arn
}

resource "aws_lambda_permission" "apigw_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.cloudshop_api.execution_arn}/*/*"
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

# Integración del Login con la Lambda
resource "aws_api_gateway_integration" "login_integration" {
  rest_api_id             = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id             = aws_api_gateway_resource.login_resource.id
  http_method             = aws_api_gateway_method.login_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.auth_service.invoke_arn
}

# Catalog service
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
    }
  }
}

# Order Service
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
      # Reemplaza "default" por el nombre exacto de tu bus personalizado
      EVENT_BUS_NAME     = "${var.environment}-cloudshop-bus" 
    }
  }
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

resource "aws_lambda_permission" "apigw_catalog" {
  statement_id  = "AllowExecutionFromAPIGatewayCatalog"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.catalog_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.cloudshop_api.execution_arn}/*/*"
}

resource "aws_api_gateway_resource" "pedidos_resource" {
  rest_api_id = aws_api_gateway_rest_api.cloudshop_api.id
  parent_id   = aws_api_gateway_rest_api.cloudshop_api.root_resource_id
  path_part   = "pedidos"
}

resource "aws_api_gateway_method" "pedidos_post" {
  rest_api_id   = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id   = aws_api_gateway_resource.pedidos_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "pedidos_integration" {
  rest_api_id             = aws_api_gateway_rest_api.cloudshop_api.id
  resource_id             = aws_api_gateway_resource.pedidos_resource.id
  http_method             = aws_api_gateway_method.pedidos_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.order_service.invoke_arn
}

resource "aws_lambda_permission" "apigw_orders" {
  statement_id  = "AllowExecutionFromAPIGatewayOrders"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.order_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.cloudshop_api.execution_arn}/*/*"
}

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
    }
  }
}

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
    }
  }
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
  integration_http_method = "POST" # Lambda siempre recibe POST de API Gateway
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.report_service.invoke_arn
}

resource "aws_lambda_permission" "apigw_reportes" {
  statement_id  = "AllowExecutionFromAPIGatewayReportes"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.report_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.cloudshop_api.execution_arn}/*/*"
}