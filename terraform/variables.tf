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

variable "key_name" {
  description = "EC2 key pair name for SSH (e.g. DevOps); must exist in the region"
  type        = string
  default     = "DevOps"
}

variable "ssh_cidr" {
  description = "CIDR allowed to SSH to EC2 (e.g. 0.0.0.0/0 or your IP/32)"
  type        = string
  default     = "0.0.0.0/0"
}

# Optional: allow direct MySQL (3306) from this CIDR for local MySQL Workbench. Leave empty to keep RDS private.
variable "allowed_mysql_cidr" {
  description = "CIDR allowed to connect to RDS on 3306 (e.g. your IP/32 for Workbench). If set, RDS becomes publicly_accessible."
  type        = string
  default     = ""
}
