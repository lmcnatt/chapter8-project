# RDS endpoint for MySQL Workbench and app config (e.g. .env DB_HOST)
output "rds_endpoint" {
  description = "RDS MySQL hostname (use as Hostname in MySQL Workbench)"
  value       = aws_db_instance.main.address
}

output "db_name" {
  description = "RDS database name"
  value       = var.db_name
}
