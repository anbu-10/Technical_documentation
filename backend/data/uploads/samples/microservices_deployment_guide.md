# Production Microservices Deployment Manual

## 1. System Overview & Container Architecture
This manual outlines the continuous delivery pipeline and Helm deployment strategy for enterprise containerized services running on managed Kubernetes (EKS/GKE).

## 2. Infrastructure & Ingress Configuration
- **Ingress Controller**: Traefik v2.10 with automated Let's Encrypt TLS cert-manager.
- **Service Mesh**: Istio ambient mesh for zero-trust mTLS encryption and distributed tracing.
- **Horizontal Pod Autoscaler (HPA)**: Configured to autoscale pods when CPU utilization exceeds 75% or p99 latency exceeds 250ms.

## 3. Deployment Steps and CLI Commands
Run the following deployment commands:
1. Initialize namespace: `kubectl create namespace production`
2. Apply Helm chart: `helm upgrade --install techdoc-services ./helm/techdoc --namespace production --values values-prod.yaml`
3. Verify rollouts: `kubectl rollout status deployment/techdoc-backend -n production`
4. Inspect running pods: `kubectl get pods -n production -l app.kubernetes.io/name=techdoc`

## 4. Environment Variables and Secrets Management
All secrets are injected using HashiCorp Vault sidecar or SealedSecrets:
- `DATABASE_URL`: Connection string with SSL mode required.
- `JWT_SECRET`: 256-bit cryptographic key rotated quarterly.
- `OLLAMA_BASE_URL`: Endpoint for internal model inference nodes.

## 5. Monitoring, Health Checks & Diagnostics
- **Liveness Probe**: `/api/health` checked every 15s. Failure threshold: 3.
- **Readiness Probe**: `/api/health/ready` verifying DB connectivity before admitting ingress traffic.
- **Common Failure**: `CrashLoopBackOff` usually caused by missing secrets or database migration lock.
