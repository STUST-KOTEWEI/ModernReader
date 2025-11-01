#!/bin/bash

# Deploy to Production Script
# Usage: ./deploy-production.sh [git-tag]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

GIT_TAG="${1:-$(git describe --tags --abbrev=0)}"
NAMESPACE="modernreader"
IMAGE_TAG="$GIT_TAG"

echo "=================================================="
echo "  ModernReader - Deploy to Production"
echo "=================================================="
echo "Git Tag: $GIT_TAG"
echo "Namespace: $NAMESPACE"
echo "Image Tag: $IMAGE_TAG"
echo "=================================================="

# Confirmation prompt
read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Deployment cancelled."
  exit 0
fi

# Ensure we're on the correct tag
cd "$PROJECT_ROOT"
git fetch --tags origin
git checkout "tags/$GIT_TAG"

# Build Docker images
echo ""
echo "Building Docker images..."
docker build -t "ghcr.io/your-org/modernreader-backend:$IMAGE_TAG" ./backend
docker build -t "ghcr.io/your-org/modernreader-frontend:$IMAGE_TAG" ./frontend

# Tag as latest
docker tag "ghcr.io/your-org/modernreader-backend:$IMAGE_TAG" "ghcr.io/your-org/modernreader-backend:latest"
docker tag "ghcr.io/your-org/modernreader-frontend:$IMAGE_TAG" "ghcr.io/your-org/modernreader-frontend:latest"

# Push to registry
echo ""
echo "Pushing images to registry..."
docker push "ghcr.io/your-org/modernreader-backend:$IMAGE_TAG"
docker push "ghcr.io/your-org/modernreader-frontend:$IMAGE_TAG"
docker push "ghcr.io/your-org/modernreader-backend:latest"
docker push "ghcr.io/your-org/modernreader-frontend:latest"

# Create namespace if not exists
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Apply Kubernetes manifests
echo ""
echo "Applying Kubernetes manifests..."

# Update image tags in deployment
cat ops/deployment/kubernetes.yml | \
  sed "s|ghcr.io/your-org/modernreader-backend:latest|ghcr.io/your-org/modernreader-backend:$IMAGE_TAG|g" | \
  sed "s|ghcr.io/your-org/modernreader-frontend:latest|ghcr.io/your-org/modernreader-frontend:$IMAGE_TAG|g" | \
  kubectl apply -f -

# Wait for rollout
echo ""
echo "Waiting for deployment to complete..."
kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=10m
kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=10m

# Run health checks
echo ""
echo "Running health checks..."
sleep 15

BACKEND_POD=$(kubectl get pod -n "$NAMESPACE" -l app=backend -o jsonpath="{.items[0].metadata.name}")
kubectl exec -n "$NAMESPACE" "$BACKEND_POD" -- curl -f http://localhost:8001/health || {
  echo "Backend health check failed!"
  echo "Rolling back..."
  kubectl rollout undo deployment/backend -n "$NAMESPACE"
  kubectl rollout undo deployment/frontend -n "$NAMESPACE"
  exit 1
}

# Run smoke tests
echo ""
echo "Running smoke tests..."
INGRESS_IP=$(kubectl get ingress modernreader-ingress -n "$NAMESPACE" -o jsonpath="{.status.loadBalancer.ingress[0].ip}")
if [ -n "$INGRESS_IP" ]; then
  curl -f "http://$INGRESS_IP/api/health" || {
    echo "Smoke test failed!"
    exit 1
  }
fi

echo ""
echo "=================================================="
echo "  Deployment to Production Complete!"
echo "=================================================="
echo "Deployed Version: $GIT_TAG"
echo ""
echo "Backend Pods:"
kubectl get pods -n "$NAMESPACE" -l app=backend
echo ""
echo "Frontend Pods:"
kubectl get pods -n "$NAMESPACE" -l app=frontend
echo ""
echo "Ingress:"
kubectl get ingress -n "$NAMESPACE"
echo ""
echo "HPA Status:"
kubectl get hpa -n "$NAMESPACE"
echo "=================================================="
