#!/usr/bin/env bash
# ModernReader Kubernetes 集群快速設置腳本
# 用途: 自動化 Kubernetes 集群設置和驗證

set -euo pipefail

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置變量
CLUSTER_NAME="${CLUSTER_NAME:-modernreader-cluster}"
CLOUD_PROVIDER="${CLOUD_PROVIDER:-gcp}"  # gcp, aws, azure
REGION="${REGION:-us-central1}"
NODE_COUNT="${NODE_COUNT:-2}"
MACHINE_TYPE="${MACHINE_TYPE:-e2-medium}"

# 輔助函數
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 檢查必需工具
check_prerequisites() {
    print_header "檢查前置需求"
    
    local missing_tools=()
    
    # 檢查 kubectl
    if ! command -v kubectl &> /dev/null; then
        missing_tools+=("kubectl")
        print_error "kubectl 未安裝"
    else
        print_success "kubectl 已安裝: $(kubectl version --client --short 2>/dev/null | head -1)"
    fi
    
    # 檢查 helm
    if ! command -v helm &> /dev/null; then
        missing_tools+=("helm")
        print_error "helm 未安裝"
    else
        print_success "helm 已安裝: $(helm version --short)"
    fi
    
    # 檢查雲端 CLI
    case $CLOUD_PROVIDER in
        gcp)
            if ! command -v gcloud &> /dev/null; then
                missing_tools+=("gcloud")
                print_error "gcloud SDK 未安裝"
            else
                print_success "gcloud 已安裝: $(gcloud version | head -1)"
            fi
            ;;
        aws)
            if ! command -v aws &> /dev/null; then
                missing_tools+=("aws-cli")
                print_error "AWS CLI 未安裝"
            else
                print_success "AWS CLI 已安裝: $(aws --version)"
            fi
            if ! command -v eksctl &> /dev/null; then
                missing_tools+=("eksctl")
                print_error "eksctl 未安裝"
            else
                print_success "eksctl 已安裝: $(eksctl version)"
            fi
            ;;
        azure)
            if ! command -v az &> /dev/null; then
                missing_tools+=("azure-cli")
                print_error "Azure CLI 未安裝"
            else
                print_success "Azure CLI 已安裝: $(az version -o tsv | head -1)"
            fi
            ;;
    esac
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "缺少必需工具: ${missing_tools[*]}"
        echo ""
        echo "安裝說明:"
        echo "  kubectl: brew install kubectl"
        echo "  helm:    brew install helm"
        
        case $CLOUD_PROVIDER in
            gcp)
                echo "  gcloud:  brew install --cask google-cloud-sdk"
                ;;
            aws)
                echo "  aws-cli: brew install awscli"
                echo "  eksctl:  brew install eksctl"
                ;;
            azure)
                echo "  az:      brew install azure-cli"
                ;;
        esac
        
        exit 1
    fi
    
    print_success "所有前置需求已滿足"
}

# 檢查雲端認證
check_cloud_auth() {
    print_header "檢查雲端平台認證"
    
    case $CLOUD_PROVIDER in
        gcp)
            if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q '@'; then
                print_error "未登入 Google Cloud"
                print_info "請執行: gcloud auth login"
                exit 1
            fi
            
            PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
            if [ -z "$PROJECT_ID" ]; then
                print_error "未設置 GCP 專案"
                print_info "請執行: gcloud config set project YOUR_PROJECT_ID"
                exit 1
            fi
            
            print_success "已登入 GCP,專案: $PROJECT_ID"
            ;;
        aws)
            if ! aws sts get-caller-identity &> /dev/null; then
                print_error "AWS 認證失敗"
                print_info "請執行: aws configure"
                exit 1
            fi
            print_success "AWS 認證成功"
            ;;
        azure)
            if ! az account show &> /dev/null; then
                print_error "未登入 Azure"
                print_info "請執行: az login"
                exit 1
            fi
            print_success "已登入 Azure"
            ;;
    esac
}

# 檢查集群是否存在
check_cluster_exists() {
    print_header "檢查集群狀態"
    
    case $CLOUD_PROVIDER in
        gcp)
            if gcloud container clusters describe "$CLUSTER_NAME" --region="$REGION" &> /dev/null; then
                print_warning "集群 $CLUSTER_NAME 已存在於 $REGION"
                return 0
            fi
            ;;
        aws)
            if aws eks describe-cluster --name "$CLUSTER_NAME" --region "$REGION" &> /dev/null; then
                print_warning "集群 $CLUSTER_NAME 已存在於 $REGION"
                return 0
            fi
            ;;
        azure)
            if az aks show --name "$CLUSTER_NAME" --resource-group "${CLUSTER_NAME}-rg" &> /dev/null; then
                print_warning "集群 $CLUSTER_NAME 已存在"
                return 0
            fi
            ;;
    esac
    
    return 1
}

# 創建集群
create_cluster() {
    if check_cluster_exists; then
        read -p "集群已存在,是否要重新創建? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "跳過集群創建"
            return 0
        fi
    fi
    
    print_header "創建 Kubernetes 集群"
    print_info "雲端平台: $CLOUD_PROVIDER"
    print_info "集群名稱: $CLUSTER_NAME"
    print_info "區域: $REGION"
    print_info "節點數量: $NODE_COUNT"
    print_info "機器類型: $MACHINE_TYPE"
    
    case $CLOUD_PROVIDER in
        gcp)
            print_info "開始創建 GKE 集群 (預計需要 3-5 分鐘)..."
            gcloud container clusters create "$CLUSTER_NAME" \
                --region="$REGION" \
                --num-nodes="$NODE_COUNT" \
                --machine-type="$MACHINE_TYPE" \
                --disk-size=30 \
                --disk-type=pd-standard \
                --enable-autoscaling \
                --min-nodes=1 \
                --max-nodes=5 \
                --enable-autorepair \
                --enable-autoupgrade \
                --addons=HorizontalPodAutoscaling,HttpLoadBalancing,GcePersistentDiskCsiDriver
            
            # 獲取集群憑證
            gcloud container clusters get-credentials "$CLUSTER_NAME" --region="$REGION"
            print_success "GKE 集群創建成功"
            ;;
        aws)
            print_info "開始創建 EKS 集群 (預計需要 15-20 分鐘)..."
            
            # 創建臨時配置文件
            cat > /tmp/eks-cluster-config.yaml <<EOF
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: ${CLUSTER_NAME}
  region: ${REGION}
  version: "1.28"

managedNodeGroups:
  - name: ng-1
    instanceType: ${MACHINE_TYPE}
    desiredCapacity: ${NODE_COUNT}
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
            
            eksctl create cluster -f /tmp/eks-cluster-config.yaml
            rm /tmp/eks-cluster-config.yaml
            
            # 更新 kubeconfig
            aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$REGION"
            print_success "EKS 集群創建成功"
            ;;
        azure)
            print_info "開始創建 AKS 集群 (預計需要 5-10 分鐘)..."
            
            # 創建資源群組
            az group create --name "${CLUSTER_NAME}-rg" --location "$REGION"
            
            # 創建集群
            az aks create \
                --resource-group "${CLUSTER_NAME}-rg" \
                --name "$CLUSTER_NAME" \
                --node-count "$NODE_COUNT" \
                --node-vm-size "$MACHINE_TYPE" \
                --enable-addons monitoring \
                --enable-managed-identity \
                --generate-ssh-keys \
                --network-plugin azure \
                --enable-cluster-autoscaler \
                --min-count 1 \
                --max-count 5 \
                --kubernetes-version 1.28.0
            
            # 獲取憑證
            az aks get-credentials --resource-group "${CLUSTER_NAME}-rg" --name "$CLUSTER_NAME"
            print_success "AKS 集群創建成功"
            ;;
    esac
}

# 安裝 Nginx Ingress Controller
install_ingress_controller() {
    print_header "安裝 Nginx Ingress Controller"
    
    # 添加 Helm repository
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo update
    
    # 檢查是否已安裝
    if helm list -n ingress-nginx | grep -q nginx-ingress; then
        print_warning "Nginx Ingress Controller 已安裝"
        return 0
    fi
    
    # 安裝 Nginx Ingress
    helm install nginx-ingress ingress-nginx/ingress-nginx \
        --namespace ingress-nginx \
        --create-namespace \
        --set controller.replicaCount=2 \
        --set controller.nodeSelector."kubernetes\.io/os"=linux \
        --set defaultBackend.nodeSelector."kubernetes\.io/os"=linux \
        --set controller.service.externalTrafficPolicy=Local \
        --set controller.metrics.enabled=true
    
    # 等待就緒
    print_info "等待 Ingress Controller 就緒..."
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=300s
    
    print_success "Nginx Ingress Controller 安裝成功"
    
    # 獲取 External IP
    print_info "等待 Load Balancer IP 分配..."
    for i in {1..30}; do
        EXTERNAL_IP=$(kubectl get svc nginx-ingress-ingress-nginx-controller \
            -n ingress-nginx \
            -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
        
        if [ -n "$EXTERNAL_IP" ]; then
            print_success "Load Balancer IP: $EXTERNAL_IP"
            echo ""
            print_warning "請配置以下 DNS 記錄:"
            echo "  類型: A"
            echo "  名稱: @"
            echo "  值: $EXTERNAL_IP"
            echo "  TTL: 300"
            break
        fi
        
        sleep 10
    done
    
    if [ -z "$EXTERNAL_IP" ]; then
        print_warning "無法獲取 External IP,請稍後手動檢查"
    fi
}

# 安裝 Cert Manager
install_cert_manager() {
    print_header "安裝 Cert Manager"
    
    # 安裝 CRDs
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.crds.yaml
    
    # 添加 Helm repository
    helm repo add jetstack https://charts.jetstack.io
    helm repo update
    
    # 檢查是否已安裝
    if helm list -n cert-manager | grep -q cert-manager; then
        print_warning "Cert Manager 已安裝"
        return 0
    fi
    
    # 安裝 Cert Manager
    helm install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --version v1.13.3
    
    # 等待就緒
    print_info "等待 Cert Manager 就緒..."
    kubectl wait --namespace cert-manager \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/instance=cert-manager \
        --timeout=300s
    
    print_success "Cert Manager 安裝成功"
}

# 創建 ClusterIssuers
create_cluster_issuers() {
    print_header "創建 Let's Encrypt ClusterIssuers"
    
    # 提示輸入郵箱
    read -p "請輸入您的郵箱地址 (用於 Let's Encrypt): " EMAIL
    
    if [ -z "$EMAIL" ]; then
        print_error "郵箱地址不能為空"
        exit 1
    fi
    
    # 創建生產環境 ClusterIssuer
    cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ${EMAIL}
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
    
    # 創建測試環境 ClusterIssuer
    cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: ${EMAIL}
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
    
    print_success "ClusterIssuers 創建成功"
}

# 驗證集群
verify_cluster() {
    print_header "驗證集群設置"
    
    # 檢查節點
    print_info "檢查節點狀態..."
    kubectl get nodes
    
    # 檢查系統 pods
    print_info "檢查系統 pods..."
    kubectl get pods -n kube-system
    
    # 檢查 Ingress Controller
    print_info "檢查 Ingress Controller..."
    kubectl get pods -n ingress-nginx
    kubectl get svc -n ingress-nginx
    
    # 檢查 Cert Manager
    print_info "檢查 Cert Manager..."
    kubectl get pods -n cert-manager
    
    # 檢查 ClusterIssuers
    print_info "檢查 ClusterIssuers..."
    kubectl get clusterissuer
    
    print_success "集群驗證完成"
}

# 創建 ModernReader namespace
create_namespace() {
    print_header "創建 ModernReader Namespace"
    
    if kubectl get namespace modernreader &> /dev/null; then
        print_warning "Namespace modernreader 已存在"
    else
        kubectl create namespace modernreader
        print_success "Namespace modernreader 創建成功"
    fi
}

# 顯示下一步指引
show_next_steps() {
    print_header "設置完成"
    
    echo ""
    print_success "Kubernetes 集群設置成功!"
    echo ""
    echo "下一步:"
    echo ""
    echo "1. 配置 DNS 記錄 (如果尚未完成)"
    echo "   獲取 Load Balancer IP:"
    echo "   kubectl get svc -n ingress-nginx"
    echo ""
    echo "2. 創建 API Keys Secrets:"
    echo "   kubectl create secret generic api-keys \\"
    echo "     --namespace=modernreader \\"
    echo "     --from-literal=OPENAI_API_KEY='your-key' \\"
    echo "     --from-literal=ANTHROPIC_API_KEY='your-key' \\"
    echo "     --from-literal=GOOGLE_API_KEY='your-key' \\"
    echo "     --from-literal=SECRET_KEY='your-jwt-key'"
    echo ""
    echo "3. 部署 ModernReader:"
    echo "   kubectl apply -f ops/deployment/kubernetes.yml"
    echo ""
    echo "4. 查看部署狀態:"
    echo "   kubectl get pods -n modernreader"
    echo "   kubectl get ingress -n modernreader"
    echo ""
    echo "5. 查看完整文檔:"
    echo "   cat docs/KUBERNETES_SETUP_GUIDE.md"
    echo ""
}

# 主函數
main() {
    print_header "ModernReader Kubernetes 集群設置"
    
    echo "本腳本將自動設置 Kubernetes 集群並安裝必要組件"
    echo ""
    echo "配置:"
    echo "  雲端平台: $CLOUD_PROVIDER"
    echo "  集群名稱: $CLUSTER_NAME"
    echo "  區域: $REGION"
    echo "  節點數量: $NODE_COUNT"
    echo "  機器類型: $MACHINE_TYPE"
    echo ""
    
    read -p "繼續? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "取消設置"
        exit 0
    fi
    
    # 執行設置步驟
    check_prerequisites
    check_cloud_auth
    create_cluster
    install_ingress_controller
    install_cert_manager
    create_cluster_issuers
    verify_cluster
    create_namespace
    show_next_steps
}

# 執行主函數
main "$@"
