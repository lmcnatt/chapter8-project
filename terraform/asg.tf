locals {
  user_data = var.app_repo_url != "" ? templatefile("${path.module}/user_data.sh.tpl", {
    app_repo_url    = var.app_repo_url
    app_repo_branch = var.app_repo_branch
    app_version     = var.app_version
    db_host         = aws_db_instance.main.address
    db_port         = "3306"
    db_name         = var.db_name
    db_user         = var.db_username
    db_password     = var.db_password
  }) : "#!/bin/bash\n# No app_repo_url set; configure and deploy app manually.\nexit 0"
}

resource "aws_launch_template" "app" {
  name_prefix   = "${local.name_prefix}-"
  image_id      = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type
  key_name      = var.key_name

  network_interfaces {
    associate_public_ip_address = true
    security_groups            = [aws_security_group.ec2.id]
  }
  user_data = base64encode(local.user_data)

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${local.name_prefix}-app"
    }
  }

  tags = {
    Name = "${local.name_prefix}-lt"
  }
}

resource "aws_autoscaling_group" "app" {
  name                = "${local.name_prefix}-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type  = "ELB"
  min_size           = var.asg_min_size
  max_size           = var.asg_max_size
  desired_capacity   = var.asg_desired_capacity

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-app"
    propagate_at_launch  = true
  }

  instance_refresh {
    strategy = "Rolling"
  }
}
