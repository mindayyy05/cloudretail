# EventBridge Setup
# This satisfies the "event-driven architecture (using AWS EventBridge)" requirement.

resource "aws_cloudwatch_event_rule" "order_placed" {
  name        = "${var.project_name}-order-placed-rule"
  description = "Triggers on OrderPlaced event from CloudRetail Order Service"

  event_pattern = jsonencode({
    source      = ["com.cloudretail.order"]
    detail-type = ["OrderPlaced"]
  })
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.order_placed.name
  target_id = "TriggerInventoryLambda"
  arn       = aws_lambda_function.inventory.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.inventory.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.order_placed.arn
}
