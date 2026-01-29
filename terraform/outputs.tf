output "vpc_id" {
  value = aws_vpc.main.id
}

output "rds_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "ec2_public_ip" {
  value = aws_instance.app_server.public_ip
}

output "ec2_ssh_command" {
  value = "ssh -i YOUR_KEY.pem ec2-user@${aws_instance.app_server.public_ip}"
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.s3_distribution.domain_name
}

output "s3_bucket_name" {
  value = aws_s3_bucket.frontend.id
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}
