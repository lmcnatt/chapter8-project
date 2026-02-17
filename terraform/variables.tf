variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "icecream"
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "RDS database name"
  type        = string
  default     = "icecream"
}

variable "db_username" {
  description = "RDS master username (MySQL)"
  type        = string
  default     = "admin"
}

variable "app_repo_url" {
  description = "Git URL to clone the app (for EC2 user data)"
  type        = string
  default     = ""
}

variable "app_repo_branch" {
  description = "Branch to clone"
  type        = string
  default     = "main"
}

variable "asg_min_size" {
  type    = number
  default = 1
}

variable "asg_max_size" {
  type    = number
  default = 3
}

variable "asg_desired_capacity" {
  type    = number
  default = 1
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "rds_instance_class" {
  type    = string
  default = "db.t3.micro"
}
