#!/bin/bash

# Rollback Script
# Usage: ./rollback.sh [environment] [revision]

set -e

ENVIRONMENT="${1:-production}"
REVISION="${2:-}"

case "$ENVIRONMENT" in
  production)
    NAMESPACE="modernreader"
    ;;
  staging)
    NAMESPACE="modernreader-staging"
    ;;
  *)
    echo "Invalid environment: $ENVIRONMENT"
    echo "Usage: ./rollback.sh [production|staging] [revision]"
    exit 1
    ;;
esac

echo "=================================================="
echo "  ModernReader - Rollback"
echo "=================================================="
echo "Environment: $ENVIRONMENT"
echo "Namespace: $NAMESPACE"
echo "=================================================="

# Show rollout history
echo ""
echo "Backend Rollout History:"
kubectl rollout history deployment/backend -n "$NAMESPACE"
echo ""
echo "Frontend Rollout History:"
kubectl rollout history deployment/frontend -n "$NAMESPACE"

# Confirmation
read -p "Are you sure you want to rollback $ENVIRONMENT? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Rollback cancelled."
  exit 0
fi

# Perform rollback
echo ""
echo "Rolling back deployments..."

if [ -n "$REVISION" ]; then
  kubectl rollout undo deployment/backend -n "$NAMESPACE" --to-revision="$REVISION"
  kubectl rollout undo deployment/frontend -n "$NAMESPACE" --to-revision="$REVISION"
else
  kubectl rollout undo deployment/backend -n "$NAMESPACE"
  kubectl rollout undo deployment/frontend -n "$NAMESPACE"
fi

# Wait for rollout
echo ""
echo "Waiting for rollback to complete..."
kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=10m
kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=10m

# Health check
echo ""
echo "Running health checks..."
sleep 10

BACKEND_POD=$(kubectl get pod -n "$NAMESPACE" -l app=backend -o jsonpath="{.items[0].metadata.name}")
kubectl exec -n "$NAMESPACE" "$BACKEND_POD" -- curl -f http://localhost:8001/health || {
  echo "Health check failed after rollback!"
  exit 1
}

echo ""
echo "=================================================="
echo "  Rollback Complete!"
echo "=================================================="
echo "Backend Pods:"
kubectl get pods -n "$NAMESPACE" -l app=backend
echo ""
echo "Frontend Pods:"
kubectl get pods -n "$NAMESPACE" -l app=frontend
echo "=================================================="
