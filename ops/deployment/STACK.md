# Deployment Stack Overview

## Environments
- `dev`: local docker-compose with mocked peripherals
- `staging`: cloud sandbox with anonymized datasets
- `prod`: community-approved deployment with restricted access

## Components
- FastAPI backend (containerized)
- Vector store (Chroma or pgvector)
- Event streaming (Redpanda/Kafka)
- Device bridge (MQTT/WebSocket)
- Frontend SPA (Static hosting + CDN)

## Infrastructure as Code
- Terraform modules for network, compute, storage
- GitHub Actions pipeline triggering deploys on tagged releases
