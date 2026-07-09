resource "aws_iam_role" "lambda_exec_role" {
  name = "${var.environment}-lambda-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}


resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.environment}-lambda-least-privilege-policy"
  role = aws_iam_role.lambda_exec_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Permisos exclusivos para CloudWatch Logs
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
        ]
        Resource = concat(
          var.dynamodb_table_arns,
          [for arn in var.dynamodb_table_arns : "${arn}/index/*"]
          
        )
      }, {
        Effect = "Allow"
        Action = ["events:PutEvents","ses:SendEmail",
          "ses:SendRawEmail"]
        Resource = ["arn:aws:events:*:*:event-bus/*", "arn:aws:ses:*:*:identity/*"]
      }
    ]
  })
}