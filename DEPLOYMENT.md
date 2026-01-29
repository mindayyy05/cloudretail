# 🚀 Ultimate Beginner's Guide to Deploying CloudRetail on AWS Free Tier

This guide will take you from "code on my laptop" to "live on the internet" using **AWS Free Tier** services.

**Cost**: $0.00 (Free Tier eligible for new accounts)
**Architecture**:
*   **Database**: RDS MySQL (`db.t3.micro`) - One instance, 4 logical databases inside.
*   **Backend Application**: EC2 (`t2.micro`) - Running Docker Containers.
*   **Frontend**: S3 Bucket (Static Website Hosting).
*   **FaaS**: AWS Lambda (Inventory Check).

---

## Part 1: Database Setup (RDS)

1.  **Log in to AWS Console** and search for **RDS**.
2.  Click **Create database**. 
3.  **Choose a database creation method**: Standard create.
4.  **Engine options**: MySQL.
5.  **Templates**: Select **Free Tier**.
6.  **Settings**:
    *   **DB instance identifier**: `cloudretail-db`
    *   **Master username**: `admin`
    *   **Master password**: `your_password` (Write this down! e.g., `SecurePass123!`)
    *   **Backup retention period**: `1 day` (Critical for Free Tier eligibility)
7.  **Instance configuration**: `db.t3.micro` (should be selected by default).
8.  **Connectivity**:
    *   **Public access**: **Yes** (Simplifies connecting from your laptop to set up tables).
    *   **VPC Security Group**: Create new called `rds-security-group`.
9.  Click **Create database**. Wait 5-10 minutes for it to say "Available".
10. **Copy Endpoint**: Click on the DB name. Used endpoint: `cloudretail-db.xxxxxxxx.us-east-1.rds.amazonaws.com`.

### Initialize Your Database
We need to create the split databases (`auth_db`, etc.) and tables on this new cloud server.

1.  **Edit your local code**: Open `setup_tables.js` in VS Code.
2.  **Change Config**:
    ```javascript
    const config = {
        host: 'cloudretail-db.xxxxxxxx.us-east-1.rds.amazonaws.com', // <-- PASTE YOUR ENDPOINT HERE
        user: 'admin',
        password: 'SecurePass123!', // <-- YOUR PASSWORD
    };
    ```
3.  **Run the Scripts**:
    Run `setup_local_dbs.js` first to create the databases, then `setup_tables.js` to create tables.
    ```bash
    # IMPORTANT: Update setup_local_dbs.js config first too!
    node setup_local_dbs.js 
    node setup_tables.js
    ```
    *Tip: You might need to change your laptop IP in the RDS Security Group "Inbound Rules" if connection times out.*

---

## Part 2: Backend Setup (EC2)

1.  **Search for EC2** in AWS Console.
2.  Click **Launch Instance**.
3.  **Name**: `CloudRetail-Backend`.
4.  **OS Images**: Amazon Linux 2023 AMI (Free tier eligible).
5.  **Instance Type**: `t2.micro` (Free tier eligible).
6.  **Key Pair**: Create new key pair -> Name: `cloudretail-key` -> Download `.pem`.
7.  **Network settings**:
    *   **Allow SSH traffic from**: My IP.
    *   **Allow HTTP traffic from the internet** (0.0.0.0/0).
8.  Click **Launch instance**.

### Connect to EC2
1.  Open your terminal where you downloaded the key.
2.  Permissions: `chmod 400 cloudretail-key.pem`
3.  Connect: `ssh -i "cloudretail-key.pem" ec2-user@<YOUR-EC2-PUBLIC-IP>`

### Install Software on EC2 (Copy-Paste these commands)
```bash
# Update system
sudo yum update -y

# Install Docker & Git
sudo yum install docker git -y

# Start Docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for permissions to take effect
exit
# (Then SSH back in)
```

### Deploy Code
1.  **On EC2**:
    ```bash
    git clone https://github.com/<YOUR_USER>/cloudretail.git
    cd cloudretail
    ```
2.  **Configure Environment**:
    Inside EC2, go to each service folder (`auth-service`, `product-service`...) and create a `.env` file.
    
    **Example for `auth-service/.env`**:
    ```ini
    DB_HOST_MAIN=cloudretail-db.xxxxxxxx.rds.amazonaws.com
    DB_USER_MAIN=admin
    DB_PASS_MAIN=SecurePass123!
    DB_NAME_MAIN=auth_db
    PORT=4001
    JWT_SECRET=supersecret
    ```
    *Repeat for `product`, `order`, `inventory` changing `DB_NAME_MAIN` and `PORT` accordingly.*
3.  **Start Services**:
    ```bash
    docker-compose up -d --build
    ```

---

## Part 3: Frontend Setup (S3)

1.  **Build React App locally**:
    Open `frontend/cloudretail-frontend/.env`:
    ```ini
    REACT_APP_API_URL=http://<YOUR-EC2-PUBLIC-IP>:80   # Note: Docker Compose maps entry to 80
    ```
    Run: `npm run build`
2.  **AWS Console -> S3**: Create Bucket (e.g., `my-cloudretail-site`).
3.  **Properties**: Enable **Static website hosting**.
    *   Index document: `index.html`
4.  **Permissions**: Uncheck **Block all public access**.
5.  **Bucket Policy**: Add policy to allow public read (Google "S3 bucket policy public read").
6.  **Upload**: Upload the contents of your `build` folder to the bucket.
7.  **Visit**: Go to the bucket website URL!

---

## Part 4: Lambda Setup (Serverless Inventory)

1.  Zip your `lambda-inventory` folder.
2.  **AWS Console -> Lambda** -> Create Function (`inventory-check`).
3.  **Runtime**: Node.js 18.x.
4.  **Upload Code**: Upload your zip.
5.  **Configuration -> Environment variables**:
    *   `DB_HOST`: Your RDS Endpoint
    *   `DB_NAME`: `inventory_db` (Very important!)
    *   `DB_USER`: `admin`
    *   `DB_PASSWORD`: `SecurePass123!`

---

## 🎉 Done!
You now have a fully functional cloud-native microservices app running for $0/month.
