#!/bin/bash

# CloudRetail Mastery Script - Final Fix & Recovery
# This script forcefully corrects the env, database, and admin access.

echo "🚀 Starting CloudRetail MEGA FIX..."

# 1. Update .env with DEFINITIVE variables for us-east-1
echo "📝 Updating .env file..."
cat > .env <<EOF
RDS_ENDPOINT=cloudretail-db.c87oqmc0q2jv.us-east-1.rds.amazonaws.com
RDS_USER=admin
RDS_PASS=cloudretail_pass_123
DB_HOST_MAIN=cloudretail-db.c87oqmc0q2jv.us-east-1.rds.amazonaws.com
DB_USER_MAIN=admin
DB_PASS_MAIN=cloudretail_pass_123
DB_NAME_MAIN=cloudretail
JWT_SECRET=super_secret_jwt_key
REDIS_HOST=redis
REDIS_PORT=6379
EVENT_BUS_NAME=cloudretail-bus
USE_AWS_SDK=true
AWS_REGION=us-east-1
S3_BUCKET_NAME=cloudretail-media-525945693121
EOF

# 2. Restart Services to pickup new ENV
echo "🔄 Restarting containers..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --remove-orphans

# Wait for Auth service
echo "⏳ Waiting for Auth Service to warm up..."
sleep 15

# 3. Initialize Schema (Piped Protocol)
echo "📂 Initializing Database Schema..."
docker exec -i cloudretail-auth node -e "const db=require('./src/db'); let data=''; process.stdin.on('data', chunk => { data += chunk; }); process.stdin.on('end', async () => { try { for(const s of data.split(';')) { if(s.trim()) await db.query(s); } console.log('✅ SCHEMA INITIALIZED SUCCESSFULLY'); process.exit(0); } catch(e) { console.error('❌ Schema Error:', e.message); process.exit(1); } });" < docs/unified-schema.sql

# 4. Force Reset Admin
echo "🔒 Forcing Admin Account creation..."
docker exec -it cloudretail-auth node -e "const db=require('./src/db'); const bcrypt=require('bcryptjs'); async function run(){ try { const h=await bcrypt.hash('admin123', 10); await db.query('DELETE FROM users WHERE email=\"admin@cloudretail.com\"'); await db.query('INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', ['Admin', 'User', 'admin@cloudretail.com', h, 'ADMIN']); console.log('✅ FORCE RESET SUCCESS'); process.exit(0); } catch(e) { console.error('❌ Reset Error:', e.message); process.exit(1); } } run();"

echo "------------------------------------------------"
echo "✨ MEGA FIX COMPLETE! ✨"
echo "Please go to the website and log in with:"
echo "User: admin@cloudretail.com"
echo "Pass: admin123"
echo "------------------------------------------------"
