resource "aws_cloudwatch_event_bus" "cloudshop_bus" {
  name = "${var.environment}-cloudshop-bus"
}

resource "aws_cloudwatch_event_rule" "pedido_creado_rule" {
  name           = "${var.environment}-pedido-creado-rule"
  event_bus_name = aws_cloudwatch_event_bus.cloudshop_bus.name
  description    = "Captura eventos de creacion de pedidos"

  # El patrón exacto que emitimos desde el Order Service
  event_pattern = jsonencode({
    source      = ["cloudshop.orders"]
    detail-type = ["Pedido Creado"] 
  })
}

resource "aws_cloudwatch_event_target" "target_inventario" {
  rule           = aws_cloudwatch_event_rule.pedido_creado_rule.name
  event_bus_name = aws_cloudwatch_event_bus.cloudshop_bus.name
  target_id      = "ActualizarInventario"
  arn            = var.lambda_inventario_arn
}

resource "aws_cloudwatch_event_target" "target_auditoria" {
  rule           = aws_cloudwatch_event_rule.pedido_creado_rule.name
  event_bus_name = aws_cloudwatch_event_bus.cloudshop_bus.name
  target_id      = "RegistrarAuditoria"
  arn            = var.lambda_auditoria_arn
}

resource "aws_cloudwatch_event_target" "target_notificaciones" {
  rule           = aws_cloudwatch_event_rule.pedido_creado_rule.name
  event_bus_name = aws_cloudwatch_event_bus.cloudshop_bus.name
  target_id      = "EnviarNotificacionSES"
  arn            = var.lambda_notificaciones_arn
}

resource "aws_lambda_permission" "allow_eventbridge_inventario" {
  statement_id  = "AllowExecutionFromEventBridgeInventario"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_inventario_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.pedido_creado_rule.arn
}

resource "aws_lambda_permission" "allow_eventbridge_auditoria" {
  statement_id  = "AllowExecutionFromEventBridgeAuditoria"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_auditoria_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.pedido_creado_rule.arn
}

resource "aws_lambda_permission" "allow_eventbridge_notificaciones" {
  statement_id  = "AllowExecutionFromEventBridgeNotificaciones"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_notificaciones_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.pedido_creado_rule.arn
}

resource "aws_cloudwatch_event_rule" "pedido_cancelado_rule" {
  name           = "${var.environment}-pedido-cancelado-rule"
  event_bus_name = aws_cloudwatch_event_bus.cloudshop_bus.name
  description    = "Captura eventos de cancelacion de pedidos"

  event_pattern = jsonencode({
    source      = ["cloudshop.orders"]
    detail-type = ["Pedido Cancelado"]
  })
}

resource "aws_cloudwatch_event_target" "target_inventario_cancelado" {
  rule           = aws_cloudwatch_event_rule.pedido_cancelado_rule.name
  event_bus_name = aws_cloudwatch_event_bus.cloudshop_bus.name
  target_id      = "RestaurarInventario"
  arn            = var.lambda_inventario_arn
}

resource "aws_cloudwatch_event_target" "target_auditoria_cancelado" {
  rule           = aws_cloudwatch_event_rule.pedido_cancelado_rule.name
  event_bus_name = aws_cloudwatch_event_bus.cloudshop_bus.name
  target_id      = "RegistrarAuditoriaCancelacion"
  arn            = var.lambda_auditoria_arn
}

resource "aws_cloudwatch_event_target" "target_notificaciones_cancelado" {
  rule           = aws_cloudwatch_event_rule.pedido_cancelado_rule.name
  event_bus_name = aws_cloudwatch_event_bus.cloudshop_bus.name
  target_id      = "NotificarCancelacion"
  arn            = var.lambda_notificaciones_arn
}

resource "aws_lambda_permission" "allow_eventbridge_inventario_cancelado" {
  statement_id  = "AllowExecutionFromEventBridgeInventarioCancelado"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_inventario_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.pedido_cancelado_rule.arn
}

resource "aws_lambda_permission" "allow_eventbridge_auditoria_cancelado" {
  statement_id  = "AllowExecutionFromEventBridgeAuditoriaCancelado"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_auditoria_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.pedido_cancelado_rule.arn
}

resource "aws_lambda_permission" "allow_eventbridge_notificaciones_cancelado" {
  statement_id  = "AllowExecutionFromEventBridgeNotificacionesCancelado"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_notificaciones_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.pedido_cancelado_rule.arn
}