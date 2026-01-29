# CloudRetail Platform

CloudRetail is a scalable, cloud-native e-commerce microservices platform.

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Docker & Docker Compose
- MySQL 8.0 (Local) or AWS RDS (Cloud)
- Kubernetes CLI (kubectl) & Terraform (for cloud deploy)

### 💻 Local Development (Quick Start)

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-org/cloudretail.git
    cd cloudretail
    ```

2.  **Environment Setup**
    Copy `.env.example` to `.env` in each service directory (auth, product, order, inventory) and populate credentials.
    *(See [Environment Variables](#-environment-variables) section below).*

3.  **Run with Docker Compose** (Recommended)
    ```bash
    docker-compose up --build
    ```
    This spins up all services, API Gateway, and a local MySQL container.

4.  **Run Manually (No Docker)**
    Start MySQL locally, then run in separate terminals:
    ```bash
    # Auth Service
    cd auth-service && npm install && npm start
    # Product Service
    cd product-service && npm install && npm start
    # Order Service
    cd order-service && npm install && npm start
    # Inventory Service
    cd inventory-service && npm install && npm start
    # API Gateway
    cd gateway-service && npm install && node src/index.js
    ```

### ☁️ Cloud Deployment (AWS)

1.  **Infrastructure Provisioning**
    ```bash
    cd terraform
    terraform init
    terraform apply
    ```
    Creates VPC, ECS Cluster, RDS Aurora, and EventBridge resources.

2.  **Kubernetes Deployment**
    ```bash
    cd k8s
    kubectl apply -f sc-config.yaml
    kubectl apply -f deployment-auth.yaml
    kubectl apply -f deployment-product.yaml
    kubectl apply -f deployment-order.yaml
    kubectl apply -f deployment-inventory.yaml
    kubectl apply -f ingress.yaml
    ```

---

## 🔑 Environment Variables

### Common Variables
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DB_HOST` | Database Hostname | `localhost` or `rds-endpoint` |
| `DB_USER` | Database User | `root` |
| `DB_PASS` | Database Password | `password` |
| `JWT_SECRET` | Secret for signing tokens | `supersecretkey` |

### Service Specifics

**Auth Service** (`/auth-service`)
| Variable | Required |
| :--- | :--- |
| `PORT` | 4001 |

**Product Service** (`/product-service`)
| Variable | Required |
| :--- | :--- |
| `PORT` | 4002 |

**Order Service** (`/order-service`)
| Variable | Required |
| :--- | :--- |
| `PORT` | 4003 |
| `PRODUCT_SERVICE_URL` | `http://product-service:4002` |

**Inventory Service** (`/inventory-service`)
| Variable | Required |
| :--- | :--- |
| `PORT` | 4004 |

---

## 🧪 Testing

### Unit Tests
Run Jest unit tests for individual microservices:
```bash
cd order-service
npm test
```
*Coverage: Business logic, Security, DB interactions (Mocked).*

### Integration / Functional Tests
Run end-to-end user flow verification (Login -> Product -> Order):
```bash
# Requires k6 installed
k6 run tests/k6/functional_api_test.js
```

### Performance Tests
Run load tests to verify system stability:
```bash
k6 run tests/k6/load_test.js
```

### Manual API Testing
Import the **Postman Collection** located at:
`tests/postman/cloudretail.postman_collection.json`

---

## 📚 Documentation

- **Architecture**: [docs/architecture/system_architecture.md](docs/architecture/system_architecture.md)
- **API Spec**: [docs/api/openapi.yaml](docs/api/openapi.yaml)
- **Security**: [docs/api/security_notes.md](docs/api/security_notes.md)
- **Monitoring**: [docs/monitoring/README.md](docs/monitoring/README.md)
