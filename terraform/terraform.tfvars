aws_region         = "us-east-1"
project_name       = "cloudretail"
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

# SECRETS - DO NOT COMMIT REAL VALUES
db_password = "cloudretail_pass_123"
jwt_secret  = "super_secret_jwt_key"
