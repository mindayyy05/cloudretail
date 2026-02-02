# AWS X-Ray Group for Distributed Tracing

resource "aws_xray_group" "main" {
  group_name        = "${var.project_name}-xray-group"
  filter_expression = "service(\"${var.project_name}\")"

  insights_configuration {
    insights_enabled      = true
    notifications_enabled = false
  }

  tags = {
    Name = "${var.project_name}-xray-group"
  }
}

resource "aws_xray_sampling_rule" "default" {
  rule_name      = "${var.project_name}-sampling-rule"
  priority       = 1000
  version        = 1
  reservoir_size = 1
  fixed_rate     = 0.05
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"

  tags = {
    Name = "${var.project_name}-sampling-rule"
  }
}
