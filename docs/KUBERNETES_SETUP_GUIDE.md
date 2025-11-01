# Kubernetes 集群設置完整指南

## 📋 目錄

1. [雲端平台選擇](#雲端平台選擇)
2. [前置需求](#前置需求)
3. [安裝 kubectl](#安裝-kubectl)
4. [集群創建](#集群創建)
5. [配置 kubectl](#配置-kubectl)
6. [安裝 Nginx Ingress Controller](#安裝-nginx-ingress-controller)
7. [安裝 Cert Manager](#安裝-cert-manager)
8. [DNS 配置](#dns-配置)
9. [驗證集群](#驗證集群)
10. [疑難排解](#疑難排解)

---

## 🌐 雲端平台選擇

ModernReader 支援三大主流雲端平台,以下是各平台的比較與建議:

### Google Cloud Platform (GKE) - **推薦用於開發與測試**

**優勢:**
- 最容易上手的 Kubernetes 平台
- 自動化程度最高 (自動升級、修復、擴展)
- 300 美元免費額度 (新用戶)
- 每月一個 Zonal 集群免費 ($74.40 價值)
- 最佳的 Kubernetes 支援 (Google 創建了 K8s)
- 優秀的文檔和社群支援

**定價示例 (us-central1):**
- 小型集群: ~$80-100/月 (3x e2-small nodes)
- 中型集群: ~$150-200/月 (3x e2-medium nodes)
- 生產集群: ~$300-400/月 (3x e2-standard-2 nodes)

**適合場景:**
- 開發和測試環境
- MVP 和原型開發
- 小型到中型生產環境
- 需要快速部署的項目

### Amazon Web Services (EKS)

**優勢:**
- 最完善的生態系統
- 與 AWS 服務深度整合
- 最多的企業客戶
- 豐富的第三方整合

**定價示例:**
- 集群控制平面: $72/月 (固定費用)
- 工作節點: 依 EC2 實例類型計費
- 總計: ~$150-200/月起 (小型配置)

**適合場景:**
- 已使用 AWS 生態系統
- 企業級生產環境
- 需要合規認證的項目

### Microsoft Azure (AKS)

**優勢:**
- 免費控制平面
- 與 Azure 服務整合
- 良好的 Windows 容器支援
- 適合 .NET 應用

**定價示例:**
- 控制平面: 免費
- 工作節點: 依 VM 類型計費
- 總計: ~$120-180/月起 (小型配置)

**適合場景:**
- 已使用 Azure 生態系統
- .NET 或 Windows 應用
- 混合雲部署

### 🎯 本指南的建議

**對於 ModernReader 項目:**
- **開發/測試**: 使用 **GKE** (容易上手,有免費額度)
- **生產環境**: 根據現有雲端服務選擇,或使用 **GKE** (性價比最好)

---

## 📦 前置需求

### 系統需求
- macOS 10.15+ / Linux / Windows 10+
- 8GB+ RAM
- 穩定的網路連接
- 雲端平台帳號

### 必需工具
- Cloud CLI (gcloud / aws / az)
- kubectl (Kubernetes 命令列工具)
- Helm 3+ (Kubernetes 套件管理器)

---

## 🔧 安裝 kubectl

### macOS (使用 Homebrew)

```bash
# 安裝 kubectl
brew install kubectl

# 驗證安裝
kubectl version --client
```

### Linux

```bash
# 下載最新版本
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# 設置執行權限
chmod +x kubectl

# 移動到 PATH
sudo mv kubectl /usr/local/bin/

# 驗證安裝
kubectl version --client
```

### Windows (使用 Chocolatey)

```powershell
# 安裝 kubectl
choco install kubernetes-cli

# 驗證安裝
kubectl version --client
```

---

## 🚀 集群創建

以下提供三個平台的完整創建步驟:

### 方案 A: Google Kubernetes Engine (GKE) - 推薦

#### 1. 安裝 Google Cloud SDK

```bash
# macOS
brew install --cask google-cloud-sdk

# 初始化 gcloud
gcloud init

# 設置默認專案
gcloud config set project YOUR_PROJECT_ID

# 啟用必要的 API
gcloud services enable container.googleapis.com
gcloud services enable compute.googleapis.com
```

#### 2. 創建 GKE 集群

```bash
# 創建生產級集群 (推薦配置)
gcloud container clusters create modernreader-cluster \
  --region=us-central1 \
  --num-nodes=1 \
  --node-locations=us-central1-a \
  --machine-type=e2-medium \
  --disk-size=30 \
  --disk-type=pd-standard \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=5 \
  --enable-autorepair \
  --enable-autoupgrade \
  --maintenance-window-start="2024-01-01T00:00:00Z" \
  --maintenance-window-duration=4h \
  --addons=HorizontalPodAutoscaling,HttpLoadBalancing,GcePersistentDiskCsiDriver

# 創建預算友好的開發集群 (最小配置)
gcloud container clusters create modernreader-dev \
  --zone=us-central1-a \
  --num-nodes=1 \
  --machine-type=e2-small \
  --disk-size=20 \
  --disk-type=pd-standard \
  --enable-autorepair \
  --no-enable-autoupgrade

# 查看集群狀態
gcloud container clusters list

# 獲取集群憑證
gcloud container clusters get-credentials modernreader-cluster --region=us-central1
```

**成本優化建議:**
- 使用 `e2-small` 或 `e2-medium` 實例類型
- 使用單個 Zonal 集群 (免費)
- 啟用自動擴展,低流量時縮減到 1 個節點
- 使用 Preemptible 節點可節省 60-80% 成本

#### 3. 安裝 Helm

```bash
# macOS
brew install helm

# 驗證安裝
helm version
```

---

### 方案 B: Amazon Elastic Kubernetes Service (EKS)

#### 1. 安裝 AWS CLI 和 eksctl

```bash
# macOS
brew install awscli
brew tap weaveworks/tap
brew install weaveworks/tap/eksctl

# 配置 AWS 憑證
aws configure

# 驗證配置
aws sts get-caller-identity
```

#### 2. 創建 EKS 集群

```bash
# 創建集群配置文件
cat > modernreader-eks.yaml <<EOF
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: modernreader-cluster
  region: us-east-1
  version: "1.28"

managedNodeGroups:
  - name: ng-1
    instanceType: t3.medium
    desiredCapacity: 2
    minSize: 1
    maxSize: 5
    volumeSize: 30
    ssh:
      allow: false
    labels:
      role: worker
    tags:
      Environment: production
      Project: modernreader

cloudWatch:
  clusterLogging:
    enableTypes: ["api", "audit", "authenticator"]
EOF

# 創建集群 (需要 15-20 分鐘)
eksctl create cluster -f modernreader-eks.yaml

# 查看集群狀態
eksctl get cluster --name=modernreader-cluster

# 更新 kubeconfig
aws eks update-kubeconfig --name modernreader-cluster --region us-east-1
```

#### 3. 安裝 AWS Load Balancer Controller

```bash
# 創建 IAM OIDC provider
eksctl utils associate-iam-oidc-provider \
  --cluster modernreader-cluster \
  --region us-east-1 \
  --approve

# 安裝 AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=modernreader-cluster \
  --set serviceAccount.create=true
```

---

### 方案 C: Azure Kubernetes Service (AKS)

#### 1. 安裝 Azure CLI

```bash
# macOS
brew install azure-cli

# 登入 Azure
az login

# 設置訂閱
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

#### 2. 創建 AKS 集群

```bash
# 創建資源群組
az group create \
  --name modernreader-rg \
  --location eastus

# 創建 AKS 集群
az aks create \
  --resource-group modernreader-rg \
  --name modernreader-cluster \
  --node-count 2 \
  --node-vm-size Standard_B2s \
  --enable-addons monitoring \
  --enable-managed-identity \
  --generate-ssh-keys \
  --network-plugin azure \
  --enable-cluster-autoscaler \
  --min-count 1 \
  --max-count 5 \
  --kubernetes-version 1.28.0

# 獲取集群憑證
az aks get-credentials \
  --resource-group modernreader-rg \
  --name modernreader-cluster

# 查看節點
kubectl get nodes
```

---

## ⚙️ 配置 kubectl

無論使用哪個平台,確保 kubectl 正確配置:

```bash
# 查看當前 context
kubectl config current-context

# 查看所有 contexts
kubectl config get-contexts

# 切換 context (如果有多個集群)
kubectl config use-context YOUR_CONTEXT_NAME

# 測試連接
kubectl cluster-info
kubectl get nodes
kubectl get namespaces
```

---

## 🌐 安裝 Nginx Ingress Controller

Nginx Ingress Controller 是用於管理外部訪問的關鍵組件。

### 使用 Helm 安裝

```bash
# 添加 Nginx Ingress Helm repository
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# 安裝 Nginx Ingress Controller
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.replicaCount=2 \
  --set controller.nodeSelector."kubernetes\.io/os"=linux \
  --set defaultBackend.nodeSelector."kubernetes\.io/os"=linux \
  --set controller.service.externalTrafficPolicy=Local \
  --set controller.metrics.enabled=true

# 等待 Ingress Controller 就緒
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# 查看 Ingress Controller 狀態
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

### 獲取 Load Balancer IP

```bash
# 查看 External IP (需要等待 1-2 分鐘)
kubectl get svc -n ingress-nginx

# 或使用此命令持續監控
kubectl get svc -n ingress-nginx -w

# 獲取 External IP 並保存
EXTERNAL_IP=$(kubectl get svc nginx-ingress-ingress-nginx-controller \
  -n ingress-nginx \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "External IP: $EXTERNAL_IP"
```

**注意:** 記錄這個 IP 地址,稍後需要用於 DNS 配置。

---

## 🔒 安裝 Cert Manager

Cert Manager 用於自動管理 SSL/TLS 證書 (Let's Encrypt)。

### 1. 安裝 Cert Manager

```bash
# 安裝 Cert Manager CRDs
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.crds.yaml

# 使用 Helm 安裝 Cert Manager
helm repo add jetstack https://charts.jetstack.io
helm repo update

helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.3

# 驗證安裝
kubectl get pods -n cert-manager
kubectl wait --namespace cert-manager \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/instance=cert-manager \
  --timeout=120s
```

### 2. 創建 Let's Encrypt ClusterIssuer

```bash
# 創建生產環境 ClusterIssuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com  # 替換為您的郵箱
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# 創建測試環境 ClusterIssuer (用於測試,無速率限制)
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: your-email@example.com  # 替換為您的郵箱
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# 驗證 ClusterIssuer
kubectl get clusterissuer
kubectl describe clusterissuer letsencrypt-prod
```

**重要:** 將 `your-email@example.com` 替換為您的真實郵箱地址,Let's Encrypt 會發送證書到期通知到此郵箱。

---

## 🌍 DNS 配置

配置域名指向您的 Kubernetes 集群。

### 1. 獲取 Load Balancer IP

```bash
# 獲取 Ingress Controller 的 External IP
kubectl get svc -n ingress-nginx nginx-ingress-ingress-nginx-controller

# 或使用命令直接提取
EXTERNAL_IP=$(kubectl get svc nginx-ingress-ingress-nginx-controller \
  -n ingress-nginx \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "External IP: $EXTERNAL_IP"
```

### 2. 配置 DNS 記錄

在您的域名提供商 (Cloudflare, GoDaddy, Route53 等) 添加以下 DNS 記錄:

#### A 記錄配置

| 類型 | 名稱 | 值 | TTL |
|-----|------|-----|-----|
| A | @ | `YOUR_EXTERNAL_IP` | 300 |
| A | www | `YOUR_EXTERNAL_IP` | 300 |
| A | api | `YOUR_EXTERNAL_IP` | 300 |

#### 示例 (使用 Cloudflare CLI)

```bash
# 安裝 Cloudflare CLI (可選)
npm install -g cloudflare-cli

# 或使用 API
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/dns_records" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "A",
    "name": "@",
    "content": "'"$EXTERNAL_IP"'",
    "ttl": 300,
    "proxied": false
  }'
```

### 3. 驗證 DNS 解析

```bash
# 等待 DNS 傳播 (通常 5-10 分鐘,最多 48 小時)
dig modernreader.app +short
dig www.modernreader.app +short
dig api.modernreader.app +short

# 或使用 nslookup
nslookup modernreader.app
nslookup www.modernreader.app
nslookup api.modernreader.app

# 測試 HTTP 訪問
curl -I http://modernreader.app
```

**注意:** DNS 傳播可能需要幾分鐘到幾小時,請耐心等待。

---

## ✅ 驗證集群

完成所有設置後,執行以下檢查:

### 1. 集群健康檢查

```bash
# 檢查節點狀態
kubectl get nodes

# 檢查系統 pods
kubectl get pods -n kube-system

# 檢查 Ingress Controller
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx

# 檢查 Cert Manager
kubectl get pods -n cert-manager

# 檢查 ClusterIssuers
kubectl get clusterissuer
```

### 2. 創建測試部署

```bash
# 創建測試 namespace
kubectl create namespace test

# 部署測試應用
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-test
  namespace: test
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx-test
  template:
    metadata:
      labels:
        app: nginx-test
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-test
  namespace: test
spec:
  selector:
    app: nginx-test
  ports:
  - port: 80
    targetPort: 80
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx-test
  namespace: test
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-staging
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - test.modernreader.app
    secretName: test-tls
  rules:
  - host: test.modernreader.app
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nginx-test
            port:
              number: 80
EOF

# 等待 pods 就緒
kubectl wait --namespace test \
  --for=condition=ready pod \
  --selector=app=nginx-test \
  --timeout=120s

# 檢查 Ingress
kubectl get ingress -n test

# 檢查證書狀態
kubectl describe certificate test-tls -n test

# 測試訪問
curl -I http://test.modernreader.app
curl -I https://test.modernreader.app
```

### 3. 清理測試資源

```bash
# 刪除測試 namespace
kubectl delete namespace test
```

---

## 🎯 下一步:部署 ModernReader

集群設置完成!現在可以部署 ModernReader 應用:

### 1. 創建 namespace

```bash
kubectl create namespace modernreader
```

### 2. 創建 Secrets

```bash
# 創建 API keys secret
kubectl create secret generic api-keys \
  --namespace=modernreader \
  --from-literal=OPENAI_API_KEY='your-openai-key' \
  --from-literal=ANTHROPIC_API_KEY='your-anthropic-key' \
  --from-literal=GOOGLE_API_KEY='your-google-key' \
  --from-literal=SECRET_KEY='your-jwt-secret-key'

# 驗證 secret
kubectl get secrets -n modernreader
```

### 3. 部署應用

```bash
# 部署 ModernReader
kubectl apply -f ops/deployment/kubernetes.yml

# 查看部署狀態
kubectl get deployments -n modernreader
kubectl get pods -n modernreader
kubectl get svc -n modernreader
kubectl get ingress -n modernreader

# 查看 pods 日誌
kubectl logs -n modernreader -l app=backend --tail=50
kubectl logs -n modernreader -l app=frontend --tail=50
```

### 4. 更新 Ingress 配置

編輯 `ops/deployment/kubernetes.yml` 的 Ingress 部分,添加您的域名和 TLS 配置:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: modernreader-ingress
  namespace: modernreader
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - modernreader.app
    - www.modernreader.app
    - api.modernreader.app
    secretName: modernreader-tls
  rules:
  - host: modernreader.app
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
  - host: api.modernreader.app
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 8001
```

應用更新:

```bash
kubectl apply -f ops/deployment/kubernetes.yml
```

---

## 🔧 疑難排解

### 問題 1: 無法獲取 External IP

**症狀:** Ingress Service 的 EXTERNAL-IP 顯示 `<pending>`

**解決方案:**

```bash
# 檢查 service 狀態
kubectl describe svc -n ingress-nginx nginx-ingress-ingress-nginx-controller

# 檢查雲端 LoadBalancer 配額
# GCP
gcloud compute project-info describe --project=YOUR_PROJECT_ID

# AWS
aws service-quotas list-service-quotas --service-code elasticloadbalancing

# 等待更長時間 (有時需要 5-10 分鐘)
kubectl get svc -n ingress-nginx -w
```

### 問題 2: Cert Manager 證書申請失敗

**症狀:** Certificate 狀態為 `False` 或 `Pending`

**解決方案:**

```bash
# 檢查 Certificate 狀態
kubectl describe certificate -n modernreader

# 檢查 CertificateRequest
kubectl get certificaterequest -n modernreader
kubectl describe certificaterequest -n modernreader

# 檢查 Cert Manager logs
kubectl logs -n cert-manager -l app=cert-manager --tail=100

# 常見原因:
# 1. DNS 未正確配置 - 驗證 DNS 解析
# 2. 郵箱格式錯誤 - 檢查 ClusterIssuer
# 3. Let's Encrypt 速率限制 - 使用 staging issuer 測試
```

### 問題 3: Pods 無法啟動

**症狀:** Pods 狀態為 `CrashLoopBackOff` 或 `Error`

**解決方案:**

```bash
# 查看 pod 詳細信息
kubectl describe pod POD_NAME -n modernreader

# 查看 logs
kubectl logs POD_NAME -n modernreader
kubectl logs POD_NAME -n modernreader --previous  # 查看上一個容器的日誌

# 常見原因:
# 1. 環境變量未設置 - 檢查 secrets 和 configmaps
# 2. 鏡像拉取失敗 - 檢查鏡像是否存在於 GHCR
# 3. 資源不足 - 檢查節點資源

# 檢查節點資源
kubectl describe nodes
kubectl top nodes
kubectl top pods -n modernreader
```

### 問題 4: 無法訪問應用

**症狀:** 瀏覽器無法訪問 `https://modernreader.app`

**解決方案:**

```bash
# 1. 檢查 DNS 解析
dig modernreader.app +short
nslookup modernreader.app

# 2. 檢查 Ingress 配置
kubectl get ingress -n modernreader
kubectl describe ingress -n modernreader

# 3. 測試從集群內部訪問
kubectl run -it --rm debug --image=busybox --restart=Never -- sh
# 在容器內
wget -O- http://frontend.modernreader.svc.cluster.local
wget -O- http://backend.modernreader.svc.cluster.local:8001/health

# 4. 檢查 Ingress Controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller --tail=100
```

### 問題 5: 持久化存儲問題

**症狀:** PVC 狀態為 `Pending`

**解決方案:**

```bash
# 檢查 PVC 狀態
kubectl get pvc -n modernreader
kubectl describe pvc -n modernreader

# 檢查 StorageClass
kubectl get storageclass
kubectl describe storageclass standard

# 手動創建 PV (如果需要)
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolume
metadata:
  name: chroma-db-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: standard
  hostPath:
    path: /mnt/data/chroma-db
EOF
```

---

## 📊 監控與管理

### 基本監控命令

```bash
# 查看集群資源使用
kubectl top nodes
kubectl top pods -n modernreader

# 查看事件
kubectl get events -n modernreader --sort-by='.lastTimestamp'

# 實時監控 pods
watch kubectl get pods -n modernreader

# 實時查看日誌
kubectl logs -n modernreader -l app=backend -f
kubectl logs -n modernreader -l app=frontend -f
```

### 安裝 Kubernetes Dashboard (可選)

```bash
# 部署 Dashboard
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml

# 創建管理員用戶
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: admin-user
  namespace: kubernetes-dashboard
EOF

# 獲取訪問 token
kubectl -n kubernetes-dashboard create token admin-user

# 啟動代理
kubectl proxy

# 訪問 Dashboard
# http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

---

## 🎓 有用的資源

### 官方文檔
- [Kubernetes 官方文檔](https://kubernetes.io/docs/)
- [GKE 文檔](https://cloud.google.com/kubernetes-engine/docs)
- [EKS 文檔](https://docs.aws.amazon.com/eks/)
- [AKS 文檔](https://docs.microsoft.com/azure/aks/)
- [Nginx Ingress 文檔](https://kubernetes.github.io/ingress-nginx/)
- [Cert Manager 文檔](https://cert-manager.io/docs/)

### 學習資源
- [Kubernetes 基礎教程](https://kubernetes.io/docs/tutorials/kubernetes-basics/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Helm 文檔](https://helm.sh/docs/)

### 社群支援
- [Kubernetes Slack](https://slack.k8s.io/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/kubernetes)

---

## ✅ 驗證清單

完成以下所有項目後,您的 Kubernetes 集群已準備好用於生產:

- [ ] 已選擇雲端平台並創建帳號
- [ ] 已安裝 kubectl 和 cloud CLI
- [ ] 已創建 Kubernetes 集群
- [ ] 已配置 kubectl 並能連接到集群
- [ ] 已安裝 Nginx Ingress Controller
- [ ] Ingress Controller 有 External IP
- [ ] 已安裝 Cert Manager
- [ ] 已創建 Let's Encrypt ClusterIssuers
- [ ] 已配置 DNS A 記錄
- [ ] DNS 解析正確
- [ ] 已創建 modernreader namespace
- [ ] 已創建 API keys secrets
- [ ] 測試部署成功
- [ ] 測試證書申請成功
- [ ] 能夠通過 HTTPS 訪問測試應用
- [ ] 已清理測試資源
- [ ] 已閱讀疑難排解部分
- [ ] 準備好部署 ModernReader 應用

---

## 📝 總結

您已完成:

1. ✅ 選擇並設置雲端平台
2. ✅ 創建 Kubernetes 集群
3. ✅ 安裝和配置 kubectl
4. ✅ 部署 Nginx Ingress Controller
5. ✅ 安裝 Cert Manager 並配置 Let's Encrypt
6. ✅ 配置 DNS 解析
7. ✅ 驗證集群功能

**下一步:** 執行首次生產環境部署!

查看部署指南: `DEPLOYMENT_GUIDE.md`

---

**文檔版本:** 1.0.0  
**最後更新:** 2025-11-01  
**維護者:** ModernReader Team
