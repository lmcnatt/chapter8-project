# Always include both public and private subnets so that toggling publicly_accessible
# doesn't try to remove the subnet the running instance sits in.
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet"
  subnet_ids = concat(aws_subnet.public[*].id, aws_subnet.private[*].id)

  tags = {
    Name = "${local.name_prefix}-db-subnet"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "${local.name_prefix}-db"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.rds_instance_class

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 3306

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = var.allowed_mysql_cidr != ""
  apply_immediately      = true
  multi_az              = false

  allocated_storage     = 20
  max_allocated_storage = 20
  storage_encrypted     = true

  skip_final_snapshot = true

  tags = {
    Name = "${local.name_prefix}-rds"
  }
}
