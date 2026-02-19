# RDS endpoint for MySQL Workbench and app config (e.g. .env DB_HOST)
output "rds_endpoint" {
  description = "RDS MySQL hostname (use as Hostname in MySQL Workbench)"
  value       = aws_db_instance.main.address
}

output "db_name" {
  description = "RDS database name"
  value       = var.db_name
}

# For GitHub Actions: instance refresh and ALB URL
output "asg_name" {
  description = "Auto Scaling Group name (for instance refresh after deploy)"
  value       = aws_autoscaling_group.app.name
}

output "alb_url" {
  description = "Application load balancer URL (open in browser)"
  value       = "http://${aws_lb.main.dns_name}"
}

output "alb_dns_name" {
  description = "ALB DNS name (no scheme)"
  value       = aws_lb.main.dns_name
}
