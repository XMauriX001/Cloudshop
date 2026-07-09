resource "aws_s3_bucket" "frontend_bucket" {
  bucket        = "${var.environment}-cloudshop-frontend-bucket"
  force_destroy = true 
}


resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI para el frontend de CloudShop"
}

# Política de S3 para permitir lectura solo desde CloudFront
resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "s3:GetObject"
      Effect    = "Allow"
      Resource  = "${aws_s3_bucket.frontend_bucket.arn}/*"
      Principal = {
        AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
      }
    }]
  })
}

resource "aws_wafv2_web_acl" "frontend_waf" {
  name        = "${var.environment}-cloudshop-waf"
  description = "WAF base para proteger CloudFront"
  scope       = "CLOUDFRONT" # Vital: Debe ser CLOUDFRONT, no REGIONAL
  
  default_action {
    allow {}
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "cloudshopWafMetrics"
    sampled_requests_enabled   = true
  }
}

resource "aws_cloudfront_distribution" "frontend_cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  web_acl_id          = aws_wafv2_web_acl.frontend_waf.arn # Vinculación del WAF[cite: 1]

  origin {
    domain_name = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.frontend_bucket.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.frontend_bucket.id}"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}