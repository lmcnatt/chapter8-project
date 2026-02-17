# Ice Cream Parlor – Chapter 8 DevOps Project

Node.js ice cream parlor API (flavors table on RDS), deployed on EC2 in an Auto Scaling Group behind an ALB, with Terraform IaC and GitHub Actions CI/CD.

## Stack

- **App:** Node.js 24 (Express), MySQL (`ice_cream_flavors` table)
- **Infra:** Terraform (VPC, RDS, ALB, ASG, security groups). Default region: **us-west-2** (Oregon). EC2: Amazon Linux 2023, t3.micro. RDS: MySQL 8.0, db.t3.micro, 20 GB storage.
- **CI/CD:** GitHub Actions (test on PR/push, deploy on push to `main`)

## Local setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your DB_HOST, DB_USER, DB_PASSWORD, etc.
   ```

3. **Database**
   - Create a MySQL database and run:
   ```bash
   mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p $DB_NAME < scripts/schema.sql
   mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p $DB_NAME < scripts/seed.sql
   ```

4. **Run the app**
   ```bash
   npm start
   ```
   - App: http://localhost:3000  
   - API: GET /flavors, POST /flavors, GET /health

## Terraform (infrastructure)

1. **Configure**
   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   # Set db_password and optionally app_repo_url (Git URL for EC2 to clone)
   ```

2. **Apply**
   ```bash
   terraform init
   terraform plan -var="db_password=YOUR_PASSWORD"
   terraform apply -var="db_password=YOUR_PASSWORD"
   ```

3. **Outputs**
   - `alb_url` – app URL (HTTP)
   - `rds_endpoint` – RDS host for app/scripts
   - `db_name`, `asg_name`

After first apply, create the DB schema on RDS (e.g. connect via bastion or from a machine with access) and run `scripts/schema.sql` and `scripts/seed.sql`.

## GitHub Actions pipeline

- **Triggers:** Push and pull requests to `main`
- **Jobs:**
  1. **Test:** `npm ci`, `npm test` (skips DB test if no credentials)
  2. **Deploy:** (on push to `main` only) Configure AWS, `terraform init` / `terraform apply`, then trigger ASG instance refresh so new instances pull latest code.

### GitHub secrets

Use one of:

- **OIDC (recommended):** `AWS_ROLE_ARN`, optional `AWS_REGION`
- **Access keys:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, optional `AWS_REGION`

For deploy: `DB_PASSWORD` (RDS master password used in `terraform apply -var="db_password=..."`).

### First-time OIDC

In AWS IAM: create an OIDC identity provider for `token.actions.githubusercontent.com`, then a role that trusts your repo and grants needed permissions (e.g. Terraform + ASG). Put the role ARN in `AWS_ROLE_ARN`.

## Code flow

1. Push to `main` → GitHub Actions runs test then deploy.
2. Deploy runs `terraform apply` (if needed) and starts an ASG instance refresh.
3. New/replaced EC2 instances run user data: install Node, clone repo (`app_repo_url`), `npm ci`, start app with RDS env vars.
4. ALB targets instances on port 3000; health check uses `/health`.

## Project layout

| Path | Description |
|------|-------------|
| `server.js` | App entry, routes, health |
| `db/connection.js`, `db/queries.js` | DB connection and flavor queries |
| `scripts/schema.sql`, `scripts/seed.sql` | Table and sample data |
| `terraform/` | VPC, RDS, ALB, ASG, security groups |
| `.github/workflows/deploy.yml` | CI/CD workflow |
| `.env.example` | Example env vars (copy to `.env`) |

## Rubric alignment (Chapter 8)

- Code pipeline: GitHub Actions (alternative to CodePipeline/CodeDeploy)
- IaC including RDS: Terraform (VPC, RDS, ALB, ASG)
- EC2 in ASG: Yes
- Load balancer by IaC: ALB in Terraform
- Alternative tech: GitHub Actions for CI/CD
