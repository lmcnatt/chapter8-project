output "alb_dns_name" {
  description = "ALB DNS name (use for browser)"
  value       = aws_lb.main.dns_name
}

output "alb_url" {
  description = "App URL (HTTP)"
  value       = "http://${aws_lb.main.dns_name}"
}

output "rds_endpoint" {
  description = "RDS instance endpoint (host:port)"
  value       = aws_db_instance.main.address
}

output "rds_port" {
  value = aws_db_instance.main.port
}

output "db_name" {
  value = aws_db_instance.main.db_name
}

output "asg_name" {
  description = "Auto Scaling Group name (for instance refresh)"
  value       = aws_autoscaling_group.app.name
}
