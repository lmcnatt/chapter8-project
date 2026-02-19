#!/bin/bash
set -e

# Deploy version: ${app_version}

# Install Node.js 24 and git (Amazon Linux 2023)
curl -fsSL https://rpm.nodesource.com/setup_24.x | bash -
dnf install -y nodejs git

# Clone and run app (if repo URL provided)
APP_DIR=/opt/icecream
mkdir -p "$APP_DIR"
if [ -n "${app_repo_url}" ]; then
  git clone --branch "${app_repo_branch}" --depth 1 "${app_repo_url}" "$APP_DIR" 2>/dev/null || true
fi
if [ -d "$APP_DIR" ] && [ -f "$APP_DIR/package.json" ]; then
  cd "$APP_DIR"
  npm ci --omit=dev 2>/dev/null || npm install --omit=dev
  export PORT=3000
  export DB_HOST="${db_host}"
  export DB_PORT="${db_port}"
  export DB_NAME="${db_name}"
  export DB_USER="${db_user}"
  export DB_PASSWORD="${db_password}"
  export DB_SSL=true
  nohup node server.js > /var/log/icecream.log 2>&1 &
  echo $! > /var/run/icecream.pid
fi
