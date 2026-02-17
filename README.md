# Ice Cream Parlor – Chapter 8 DevOps Project

Node.js ice cream parlor API (flavors table on RDS), deployed on EC2 in an Auto Scaling Group behind an ALB, with Terraform IaC and GitHub Actions CI/CD.

## Stack

- **App:** Node.js 24 (Express), MySQL (`ice_cream_flavors` table)
- **Infra:** Terraform (VPC, RDS, ALB, ASG, security groups). Default region: **us-west-2** (Oregon). EC2: Amazon Linux 2023, t3.micro. RDS: MySQL 8.0, db.t3.micro, 20 GB storage.
- **CI/CD:** GitHub Actions (test on PR/push, deploy on push to `main`)

## Where to put credentials (and keep them secure)

| Use case | Where | Never commit |
|----------|--------|----------------|
| **Terraform / RDS** (create RDS, EC2 user data) | `terraform/terraform.tfvars` — set `db_password`, optional `db_username` | Yes — `terraform.tfvars` is in `.gitignore` |
| **Local app** (run `npm start` against RDS or local MySQL) | `.env` in project root — set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Yes — `.env` is in `.gitignore` |
| **GitHub Actions** (deploy job runs `terraform apply`) | Repo **Settings → Secrets and variables → Actions** — add secret `DB_PASSWORD` (same value as `db_password` in tfvars) | N/A — secrets are not in the repo |

**Staying secure:** Do not commit `.env` or `terraform/terraform.tfvars` (both are in `.gitignore`). Use a strong password for the DB. In GitHub, store the RDS password only as the **DB_PASSWORD** Actions secret.

---

## Commands to run (in order) and where to store credentials

### 1. Store credentials — Terraform (local file)

Create the Terraform vars file and put your RDS password (and optional username) there. **Do not commit this file.**

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform/terraform.tfvars`. Set at least:

- **`db_password`** = a strong password you choose (e.g. `MyStr0ng!RDS_Pass`). This will be the RDS master password.
- Optionally **`db_username`** (default is `admin`).

Leave or adjust other values (e.g. `aws_region = "us-west-2"`).

---

### 2. Store credentials — GitHub Actions (browser)

In your GitHub repo:

1. Go to **Settings → Secrets and variables → Actions**.
2. Click **New repository secret**.
3. **Name:** `DB_PASSWORD`
4. **Value:** the **exact same** password you set for `db_password` in `terraform.tfvars`.

(Optional, for deploy.) Add AWS access — **either**:

- **OIDC:** secret **`AWS_ROLE_ARN`**, value = your IAM role ARN; optional **`AWS_REGION`** = `us-west-2`.
- **Access keys:** **`AWS_ACCESS_KEY_ID`**, **`AWS_SECRET_ACCESS_KEY`**; optional **`AWS_REGION`** = `us-west-2`.

---

### 3. Store credentials — local app (local file)

For running the app locally or for MySQL Workbench, use a `.env` file in the **project root**. **Do not commit this file.**

```bash
# from project root
cp .env.example .env
```

Edit **`.env`** in the project root. Set:

- **`DB_HOST`** = `localhost` for a local MySQL; for RDS, use the value from `terraform output rds_endpoint` (after step 5).
- **`DB_PORT`** = `3306`
- **`DB_NAME`** = `icecream`
- **`DB_USER`** = same as `db_username` in terraform.tfvars (e.g. `admin`)
- **`DB_PASSWORD`** = same as `db_password` in terraform.tfvars

---

### 4. Commands — install app and deploy infrastructure

From the **project root**:

```bash
npm install
```

From the **terraform** directory:

```bash
cd terraform
terraform init
terraform plan -var="db_password=YOUR_ACTUAL_PASSWORD"
terraform apply -var="db_password=YOUR_ACTUAL_PASSWORD" -auto-approve
```

Replace `YOUR_ACTUAL_PASSWORD` with the same password you put in `terraform.tfvars` for `db_password`.

---

### 5. Get RDS endpoint (for MySQL Workbench and .env)

```bash
cd terraform
terraform output rds_endpoint
```

Copy that value. Use it as:

- **MySQL Workbench:** Connection **Hostname**.
- **`.env`:** `DB_HOST=` that value (when you want the local app to talk to RDS).

---

### 6. Create schema and seed in RDS (MySQL Workbench)

In MySQL Workbench, create a connection:

- **Hostname:** `rds_endpoint` from step 5 (or use an SSH tunnel; see “Managing the database with MySQL Workbench” below).
- **Port:** `3306`
- **Username:** same as `db_username` in terraform.tfvars (e.g. `admin`)
- **Password:** same as `db_password` in terraform.tfvars

Connect, then run **`scripts/schema.sql`** and **`scripts/seed.sql`** (File → Open SQL Script, or paste and execute).

---

### 7. Run the app locally (optional)

From **project root** (with `.env` set, and DB reachable):

```bash
npm start
```

---

### 8. Trigger the pipeline (deploy)

Push to `main` (e.g. commit and push). The workflow will run tests and, on push to `main`, run `terraform apply` (using the `DB_PASSWORD` secret) and refresh the ASG.

---

### Credential summary

| What | Where | Exact name / keys |
|------|--------|--------------------|
| RDS password (and username) for Terraform | **File:** `terraform/terraform.tfvars` | `db_password`, optional `db_username` |
| RDS password for GitHub deploy | **GitHub:** Settings → Secrets and variables → Actions | Secret name: **`DB_PASSWORD`** |
| DB connection for local app / Workbench | **File:** `.env` in project root | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` |

Use the **same** RDS password in all three: `terraform.tfvars` → `DB_PASSWORD` secret → `DB_PASSWORD` in `.env`.

---

## Local setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env: DB_HOST, DB_PORT (3306), DB_NAME (icecream), DB_USER (e.g. admin), DB_PASSWORD.
   # For local MySQL use localhost; for RDS use the terraform output rds_endpoint.
   ```

3. **Database** — use **MySQL Workbench** (see “Managing the database with MySQL Workbench” below) or CLI:
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
   - `rds_endpoint` – RDS host for app/scripts and MySQL Workbench
   - `db_name`, `asg_name`

### Managing the database with MySQL Workbench

After `terraform apply`, create the schema and seed data on RDS using MySQL Workbench from your machine:

1. **Get connection details** (from Terraform):
   ```bash
   cd terraform && terraform output rds_endpoint
   ```
   Use the same **username** and **password** you set in `terraform.tfvars` (`db_username`, `db_password`). Database name: `icecream`. Port: `3306`.

2. **In MySQL Workbench:** Add a new MySQL connection:
   - **Hostname:** the `rds_endpoint` value (e.g. `icecream-db.xxxxx.us-west-2.rds.amazonaws.com`)
   - **Port:** 3306
   - **Username:** same as `db_username` in terraform.tfvars (e.g. `admin`)
   - **Password:** same as `db_password` in terraform.tfvars — store it in the connection or in a vault; do not put it in the repo.

3. **Reaching RDS from your laptop:** RDS is in a **private subnet**, so it is not reachable from the public internet. To use MySQL Workbench locally you need one of:
   - **SSH tunnel (recommended):** Use an EC2 instance in the same VPC (e.g. one of the ASG instances) as a jump host. In Workbench, set the connection to use SSH with that EC2’s public IP/key, then connect to `rds_endpoint:3306`.
   - **VPN / bastion:** If your school or AWS setup provides a VPN or bastion that can reach the VPC, connect through that, then use `rds_endpoint` as host in Workbench.

4. **Run the schema and seed:** Once connected, open and run `scripts/schema.sql`, then `scripts/seed.sql` (or use Workbench’s “Run SQL Script” and point at those files).

## GitHub Actions pipeline

- **Triggers:** Push and pull requests to `main`
- **Jobs:**
  1. **Test:** `npm ci`, `npm test` (skips DB test if no credentials)
  2. **Deploy:** (on push to `main` only) Configure AWS, `terraform init` / `terraform apply`, then trigger ASG instance refresh so new instances pull latest code.

### GitHub secrets

Use one of:

- **OIDC (recommended):** `AWS_ROLE_ARN`, optional `AWS_REGION`
- **Access keys:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, optional `AWS_REGION`

For deploy: `DB_PASSWORD` — use the same RDS master password as in `terraform.tfvars` (`db_password`). See “Where to put credentials” above.

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
