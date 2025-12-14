# Deployment Guide (AWS)

## Architecture Overview

```
┌─────────────────┐
│   CloudFront    │  ← React App (S3)
└────────┬────────┘
         │
┌────────▼────────┐
│   ALB / API GW  │
└────────┬────────┘
         │
┌────────▼────────┐
│   ECS/Fargate   │  ← Node.js API (Docker)
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼───┐ ┌──▼──┐  ┌────▼────┐ ┌──▼──────┐
│  RDS  │ │ S3  │  │Textract │ │  SQS    │
│  PG   │ │     │  │         │ │(optional)│
└───────┘ └─────┘  └─────────┘ └─────────┘
```

---

## 1. Backend Deployment (Node.js API)

### Option A: ECS Fargate (Recommended for MVP)

**Pros:** Serverless containers, auto-scaling, no server management  
**Cons:** Slightly higher cost than EC2

#### Step 1: Dockerize the Application

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]
```

#### Step 2: Push to ECR

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Create ECR repository
aws ecr create-repository --repository-name invoice-ocr-api

# Build and tag image
docker build -t invoice-ocr-api .
docker tag invoice-ocr-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/invoice-ocr-api:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/invoice-ocr-api:latest
```

#### Step 3: Create ECS Cluster & Service

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name invoice-ocr-cluster

# Create task definition (see task-definition.json below)
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster invoice-ocr-cluster \
  --service-name invoice-ocr-api \
  --task-definition invoice-ocr-api:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=invoice-ocr-api,containerPort=3000"
```

**task-definition.json:**
```json
{
  "family": "invoice-ocr-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "invoice-ocr-api",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/invoice-ocr-api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..." },
        { "name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:..." },
        { "name": "AWS_ACCESS_KEY_ID", "valueFrom": "arn:aws:secretsmanager:..." },
        { "name": "AWS_SECRET_ACCESS_KEY", "valueFrom": "arn:aws:secretsmanager:..." }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/invoice-ocr-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Option B: EC2 with Docker Compose (Lower cost)

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: unless-stopped
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=invoice_ocr
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## 2. Frontend Deployment (React App)

### Option A: S3 + CloudFront (Recommended)

#### Step 1: Build React App

```bash
# Build for production
npm run build

# Output will be in dist/ folder
```

#### Step 2: Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://invoice-ocr-app

# Enable static website hosting
aws s3 website s3://invoice-ocr-app --index-document index.html --error-document index.html

# Upload build files
aws s3 sync dist/ s3://invoice-ocr-app --delete

# Set bucket policy (public read)
aws s3api put-bucket-policy --bucket invoice-ocr-app --policy file://bucket-policy.json
```

**bucket-policy.json:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::invoice-ocr-app/*"
    }
  ]
}
```

#### Step 3: Create CloudFront Distribution

```bash
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

**cloudfront-config.json:**
```json
{
  "CallerReference": "invoice-ocr-app-2025",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-invoice-ocr-app",
        "DomainName": "invoice-ocr-app.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-invoice-ocr-app",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": { "Forward": "none" }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "Enabled": true
}
```

### Option B: Vercel / Netlify (Easiest for MVP)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Or connect GitHub repo for auto-deployment
```

---

## 3. Database Setup (RDS PostgreSQL)

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier invoice-ocr-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username admin \
  --master-user-password <strong-password> \
  --allocated-storage 20 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-xxx \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --publicly-accessible false

# Run migrations
npm run migrate:prod
```

---

## 4. Environment Variables

### Backend (.env.production)

```bash
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://admin:password@invoice-ocr-db.xxx.rds.amazonaws.com:5432/invoice_ocr

# JWT
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRES_IN=7d

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>
S3_BUCKET_NAME=invoice-ocr-files
S3_PRESIGNED_URL_EXPIRY=900

# Textract
TEXTRACT_ENABLED=true

# Optional: SQS
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/xxx/invoice-processing

# CORS
CORS_ORIGIN=https://app.yourdomain.com
```

### Frontend (.env.production)

```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

---

## 5. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to ECR
        run: |
          aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${{ secrets.ECR_REGISTRY }}
      
      - name: Build and push Docker image
        run: |
          docker build -t invoice-ocr-api .
          docker tag invoice-ocr-api:latest ${{ secrets.ECR_REGISTRY }}/invoice-ocr-api:latest
          docker push ${{ secrets.ECR_REGISTRY }}/invoice-ocr-api:latest
      
      - name: Update ECS service
        run: |
          aws ecs update-service --cluster invoice-ocr-cluster --service invoice-ocr-api --force-new-deployment

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend
      
      - name: Build
        run: npm run build
        working-directory: ./frontend
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
      
      - name: Deploy to S3
        run: |
          aws s3 sync dist/ s3://invoice-ocr-app --delete
        working-directory: ./frontend
      
      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
```

---

## 6. Database Backup Strategy

### Automated RDS Backups

```bash
# RDS automatically creates daily snapshots (configured during creation)
# Retention: 7 days (configurable up to 35 days)

# Manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier invoice-ocr-db \
  --db-snapshot-identifier invoice-ocr-db-manual-$(date +%Y%m%d)

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier invoice-ocr-db-restored \
  --db-snapshot-identifier invoice-ocr-db-manual-20250115
```

### Export to S3 (Long-term archival)

```bash
# Create export task
aws rds start-export-task \
  --export-task-identifier invoice-ocr-export-$(date +%Y%m%d) \
  --source-arn arn:aws:rds:us-east-1:xxx:snapshot:invoice-ocr-db-snapshot \
  --s3-bucket-name invoice-ocr-backups \
  --iam-role-arn arn:aws:iam::xxx:role/rds-s3-export-role \
  --kms-key-id arn:aws:kms:us-east-1:xxx:key/xxx
```

### Point-in-Time Recovery

RDS supports PITR within the backup retention window:

```bash
# Restore to specific time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier invoice-ocr-db \
  --target-db-instance-identifier invoice-ocr-db-pitr \
  --restore-time 2025-01-15T10:30:00Z
```

---

## 7. Monitoring & Logging

### CloudWatch Logs

```bash
# Create log groups
aws logs create-log-group --log-group-name /ecs/invoice-ocr-api
aws logs create-log-group --log-group-name /aws/lambda/invoice-processor

# Set retention
aws logs put-retention-policy --log-group-name /ecs/invoice-ocr-api --retention-in-days 30
```

### CloudWatch Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name invoice-ocr-api-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ServiceName,Value=invoice-ocr-api

# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name invoice-ocr-api-high-errors \
  --alarm-description "Alert when 5xx errors exceed 10 per minute" \
  --metric-name 5XXError \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 60 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

### Application Performance Monitoring (Optional)

Consider integrating:
- **Datadog:** Full-stack monitoring
- **New Relic:** APM + infrastructure
- **Sentry:** Error tracking

```typescript
// Example: Sentry integration
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Error handler middleware
app.use(Sentry.Handlers.errorHandler());
```

---

## 8. Security Checklist

### Infrastructure Security

- [ ] Enable VPC for RDS (no public access)
- [ ] Use security groups to restrict access
- [ ] Enable encryption at rest (RDS, S3)
- [ ] Enable encryption in transit (HTTPS, SSL for DB)
- [ ] Use AWS Secrets Manager for sensitive credentials
- [ ] Enable CloudTrail for audit logging
- [ ] Configure WAF rules on CloudFront/ALB
- [ ] Enable MFA for AWS root account
- [ ] Use IAM roles (not access keys) for ECS tasks

### Application Security

- [ ] Implement rate limiting (express-rate-limit)
- [ ] Validate all inputs (Zod, Joi)
- [ ] Sanitize user inputs (prevent XSS)
- [ ] Use parameterized queries (prevent SQL injection)
- [ ] Set secure HTTP headers (helmet.js)
- [ ] Implement CORS properly
- [ ] Hash passwords with bcrypt (10+ rounds)
- [ ] Use short-lived JWT tokens
- [ ] Implement refresh token rotation
- [ ] Validate file uploads (type, size, content)
- [ ] Use signed S3 URLs with short expiry
- [ ] Implement audit logging for admin actions

```typescript
// Example: Security middleware
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

---

## 9. Cost Estimation (Monthly)

### MVP Scale (100 users, 500 invoices/month)

| Service | Configuration | Cost |
|---------|--------------|------|
| **ECS Fargate** | 2 tasks, 0.5 vCPU, 1GB RAM | ~$30 |
| **RDS PostgreSQL** | db.t3.micro, 20GB storage | ~$15 |
| **S3** | 10GB storage, 1000 requests | ~$1 |
| **CloudFront** | 10GB data transfer | ~$1 |
| **Textract** | 500 pages @ $0.05/page | ~$25 |
| **ALB** | 1 ALB, minimal traffic | ~$20 |
| **Data Transfer** | Minimal | ~$5 |
| **CloudWatch** | Logs + metrics | ~$5 |
| **Total** | | **~$102/month** |

### Optimization Tips

1. **Use Reserved Instances** for RDS (save 30-40%)
2. **Implement caching** to reduce Textract calls
3. **Use S3 Intelligent-Tiering** for old invoices
4. **Compress images** before OCR (reduce Textract cost)
5. **Use spot instances** for non-critical workloads

---

## 10. Scaling Strategy

### Phase 1: MVP (0-100 users)
- Single ECS task
- db.t3.micro RDS
- Synchronous OCR processing

### Phase 2: Growth (100-1000 users)
- Auto-scaling ECS (2-10 tasks)
- db.t3.small RDS with read replica
- Async OCR processing with SQS
- Redis cache for product matching

### Phase 3: Scale (1000+ users)
- Multi-region deployment
- db.r5.large RDS with multi-AZ
- Dedicated OCR worker fleet
- ElastiCache Redis cluster
- CDN for static assets

```typescript
// Example: Auto-scaling configuration
{
  "scalingPolicies": [
    {
      "policyName": "cpu-scaling",
      "targetTrackingScalingPolicyConfiguration": {
        "targetValue": 70.0,
        "predefinedMetricSpecification": {
          "predefinedMetricType": "ECSServiceAverageCPUUtilization"
        },
        "scaleOutCooldown": 60,
        "scaleInCooldown": 300
      }
    }
  ]
}
```

---

## 11. Disaster Recovery Plan

### RTO (Recovery Time Objective): 4 hours
### RPO (Recovery Point Objective): 1 hour

### Backup Strategy
- **Database:** Automated daily snapshots + PITR
- **Files (S3):** Versioning enabled + cross-region replication
- **Code:** Git repository (GitHub)
- **Infrastructure:** Terraform/CloudFormation templates

### Recovery Procedures

1. **Database Failure:**
   - Restore from latest snapshot (~15 min)
   - Or use PITR to specific time (~30 min)

2. **Application Failure:**
   - Redeploy from ECR image (~5 min)
   - Or rollback to previous task definition (~2 min)

3. **Region Failure:**
   - Failover to secondary region (~2 hours)
   - Update DNS to point to backup region

4. **Data Corruption:**
   - Restore database from snapshot
   - Replay transactions from audit logs

### Testing
- Quarterly disaster recovery drills
- Monthly backup restoration tests
- Automated health checks every 5 minutes

---

## 12. Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Run database migrations
- [ ] Test API health endpoint
- [ ] Test file upload to S3
- [ ] Test OCR processing end-to-end
- [ ] Verify CloudFront serves React app
- [ ] Test authentication flow
- [ ] Verify CORS configuration
- [ ] Check CloudWatch logs are flowing
- [ ] Set up monitoring alerts
- [ ] Test backup restoration
- [ ] Document runbook for common issues
- [ ] Set up on-call rotation
- [ ] Perform load testing
- [ ] Security scan (OWASP ZAP, Snyk)
- [ ] Update DNS records
- [ ] Enable SSL certificate (ACM)
- [ ] Configure custom domain
