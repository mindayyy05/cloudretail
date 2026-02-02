# ☁️ Advanced AWS Infrastructure Guide

To make your assignment stand out, you can add these "Enterprise-Grade" features manually in the AWS Console. These will show that you understand production architecture, security, and scalability.

---

## 🏗️ 1. Application Load Balancer (ALB)
*Why?* Instead of users hitting your EC2 directly, they hit the ALB. This allows you to scale to 10+ EC2 instances later without changing your URL.

### Step 1: Create a Target Group
1.  Go to **EC2 Console** -> **Target Groups** (left menu).
2.  Click **Create target group**.
3.  Choose **Instances**.
4.  **Target group name**: `cloudretail-api-tg`.
5.  **Protocol**: HTTP, **Port**: 80 (This is where your Gateway is).
6.  **Health checks**: Path `/health`.
7.  Click **Next**, select your **CloudRetail-Backend** instance, click **Include as pending below**, and click **Create target group**.

### Step 2: Create the Load Balancer
1.  Go to **EC2 Console** -> **Load Balancers**.
2.  Click **Create load balancer** -> **Application Load Balancer**.
3.  **Name**: `cloudretail-alb`.
4.  **Network mapping**: Select your VPC and at least **two** Availability Zones (e.g., us-east-1a and 1b).
5.  **Security groups**: Create a new one called `alb-sg` that allows **HTTP (Port 80)** from everywhere.
6.  **Listeners and routing**: 
    - Protocol: HTTP, Port: 80.
    - Default action: Forward to `cloudretail-api-tg`.
7.  Click **Create load balancer**.

> [!TIP]
> Once active, you'll get a **DNS Name** (e.g., `cloudretail-alb-123.us-east-1.elb.amazonaws.com`). 
> Update your frontend `.env`'s `REACT_APP_API_URL` to use this DNS Name!

---

## 🛡️ 2. CloudFront + WAF (Security & Speed)
*Why?* CloudFront caches your React site globally. WAF (Web Application Firewall) blocks bad bots and hackers.

### Step 1: Create a CloudFront Distribution
1.  Go to **CloudFront Console** -> **Create distribution**.
2.  **Origin domain**: Select your S3 bucket endpoint.
3.  **Viewer protocol policy**: Redirect HTTP to HTTPS.
4.  Under **Web Application Firewall (WAF)**: Click **Enable security protections** (this creates the WAF for you).
5.  Click **Create distribution**. It will take ~5 mins to deploy.

---

## 📊 3. CloudWatch Dashboards (Observability)
*Why?* It allows you to see the "health" of your servers in one beautiful screen.

1.  Go to **CloudWatch Console** -> **Dashboards**.
2.  Click **Create dashboard** -> Name: `CloudRetail-Overview`.
3.  **Add widget**:
    - **Line**: Search for `EC2` -> `Per-Instance Metrics` -> Select your instance's **CPUUtilization**.
    - **Number**: Search for `RDS` -> Select **FreeStorageSpace** or **DatabaseConnections**.
4.  Click **Save dashboard**.

---

## 🔐 4. Systems Manager (Secret Storage)
*Why?* Hardcoding passwords in `.env` is a security risk. Real apps use Parameter Store.

1.  Go to **Systems Manager** -> **Parameter Store**.
2.  Click **Create parameter**.
3.  **Name**: `/cloudretail/db_password`.
4.  **Type**: SecureString.
5.  **Value**: Your RDS password. 
6.  *Repeat for JWT_SECRET.*

> [!IMPORTANT]
> This shows your professor you know how to handle sensitive data according to AWS Best Practices.
---

## 💰 5. AWS Budgets (Cost Management)
*Why?* Real cloud engineers *always* set up alerts to avoid surprise bills. This shows you are responsible with project costs.

1.  Search for **Budgets**.
2.  Click **Create budget** -> **Cost budget**.
3.  **Amount**: Set it to $1.00.
4.  **Threshold**: Set an alert to email you if you reach 80% ($0.80).
5.  Click **Create budget**.

---

## ✉️ 6. SNS (Simple Notification Service)
*Why?* This is for system-to-human communication (Emails/SMS).

1.  Search for **SNS**.
2.  Click **Topics** -> **Create topic**.
3.  **Name**: `CloudRetail-Alerts`.
4.  Click **Create topic**.
5.  Click **Create subscription**.
    - **Protocol**: Email.
    - **Endpoint**: Your email address.
6.  *Important*: Check your inbox and click "Confirm Subscription" in the AWS email.

---

## 🏷️ 7. Resource Groups & Tagging
*Why?* Helps you find all parts of your assignment (S3, EC2, RDS, Lambda) in one single list.

1.  Search for **Resource Groups & Tag Editor**.
2.  Click **Create Resource Group**.
3.  **Group type**: Tag-based.
4.  **Query**: 
    - Tag key: `Project`.
    - Tag value: `cloudretail`.
5.  Click **Preview group resources** to see everything we've built together!
6.  **Group name**: `Assignment-CloudRetail`.
7.  Click **Create group**.

> [!TIP]
> This "assignment dashboard" is a great screenshot for your final report to show how organized your infrastructure is.
---

## 🔐 8. IAM Principle of Least Privilege
*Why?* Never use your Root account for daily work. Real companies create "DevOps" users with only the permissions they need.

1.  Search for **IAM**.
2.  Click **Users** -> **Create user**.
3.  **User name**: `CloudRetail-Admin`.
4.  **Permissions**: Select **Attach policies directly**.
5.  Search for and attach: `AmazonEC2FullAccess`, `AmazonRDSFullAccess`, `AmazonS3FullAccess`.
6.  *This shows you understand how to delegate access safely!*

---

## 📦 9. S3 Lifecycle Policies
*Why?* Cloud costs add up. Lifecycle policies automatically move old files to cheaper storage or delete them.

1.  Go to your **S3 Bucket** -> **Management** tab.
2.  Click **Create lifecycle rule**.
3.  **Rule name**: `AutoArchiveOldLogs`.
4.  **Scope**: Apply to all objects.
5.  **Lifecycle rule actions**: Select **Move noncurrent versions to Glacier**.
6.  This proves you can optimize cloud storage costs for a business!

---

## 💾 10. RDS Backup & Snapshots
*Why?* If your database gets hacked or accidentally deleted, you need a backup.

1.  Go to **RDS Console** -> **Databases**.
2.  Select `cloudretail-db`.
3.  Click the **Maintenance & backups** tab.
4.  Notice that **Automated backups** are already enabled by default.
5.  **Pro Tip**: Click **Actions** -> **Take snapshot** to create a manual restore point before any major submission.

---

> [!IMPORTANT]
> By completing these 10 steps, you have implemented a **Production-Ready, Enterprise-Grade Cloud Architecture**. This is significantly beyond what is expected for a standard University assignment! 🚀
