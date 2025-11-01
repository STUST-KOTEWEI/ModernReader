#!/bin/bash

# Deploy to Staging Script
# Usage: ./deploy-staging.sh [git-ref]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

GIT_REF="${1:-develop}"
NAMESPACE="modernreader-staging"
IMAGE_TAG="staging-$(git rev-parse --short HEAD)"

echo "=================================================="
echo "  ModernReader - Deploy to Staging"
echo "=================================================="
echo "Git Ref: $GIT_REF"
echo "Namespace: $NAMESPACE"
echo "Image Tag: $IMAGE_TAG"
echo "=================================================="

# Ensure we're on the correct branch
cd "$PROJECT_ROOT"
git fetch origin
git checkout "$GIT_REF"
git pull origin "$GIT_REF"

# Build Docker images
echo ""
echo "Building Docker images..."
docker build -t "ghcr.io/your-org/modernreader-backend:$IMAGE_TAG" ./backend
docker build -t "ghcr.io/your-org/modernreader-frontend:$IMAGE_TAG" ./frontend

# Push to registry
echo ""
echo "Pushing images to registry..."
docker push "ghcr.io/your-org/modernreader-backend:$IMAGE_TAG"
docker push "ghcr.io/your-org/modernreader-frontend:$IMAGE_TAG"

# Create namespace if not exists
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Apply Kubernetes manifests
echo ""
echo "Applying Kubernetes manifests..."

# Update image tags in deployment
cat ops/deployment/kubernetes.yml | \
  sed "s|ghcr.io/your-org/modernreader-backend:latest|ghcr.io/your-org/modernreader-backend:$IMAGE_TAG|g" | \
  sed "s|ghcr.io/your-org/modernreader-frontend:latest|ghcr.io/your-org/modernreader-frontend:$IMAGE_TAG|g" | \
  sed "s|namespace: modernreader|namespace: $NAMESPACE|g" | \
  kubectl apply -f -

# Wait for rollout
echo ""
echo "Waiting for deployment to complete..."
kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=5m
kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=5m

# Run health checks
echo ""
echo "Running health checks..."
sleep 10

BACKEND_POD=$(kubectl get pod -n "$NAMESPACE" -l app=backend -o jsonpath="{.items[0].metadata.name}")
kubectl exec -n "$NAMESPACE" "$BACKEND_POD" -- curl -f http://localhost:8001/health || {
  echo "Backend health check failed!"
  exit 1
}

echo ""
echo "=================================================="
echo "  Deployment to Staging Complete!"
echo "=================================================="
echo "Backend Pods:"
kubectl get pods -n "$NAMESPACE" -l app=backend
echo ""
echo "Frontend Pods:"
kubectl get pods -n "$NAMESPACE" -l app=frontend
echo ""
echo "Ingress:"
kubectl get ingress -n "$NAMESPACE"
echo "=================================================="
