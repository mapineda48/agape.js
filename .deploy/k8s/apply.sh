#!/bin/bash

# 
# Load enviroment variables
#

# Comprobar si el archivo existe
if [ ! -f ".env" ]; then
    echo "Error: El archivo .env no existe."
    exit 1
fi

# Cargar las variables del archivo .env y exportarlas
while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ ! $line =~ ^\#.* ]] && [[ $line =~ .*=.* ]]; then
        export $line
    fi
done < <(cat .env; echo)

# 
# Set Kubectl Configs
#

# Verificar si la variable KUBECONFIG_CONTENTS está definida y no está vacía
if [[ ! -z $KUBECONFIG_CONTENTS ]]; then
    echo "terraform set kubectl config contents"

    export KUBECONFIG="$(mktemp /tmp/XXXXXXXXXXXXXX)"
    echo "$KUBECONFIG_CONTENTS" | sed '1d;$d' > $KUBECONFIG
fi

if [[ -f "kube_config" ]] && [[ -z $KUBECONFIG ]]; then
    export KUBECONFIG="$(realpath kube_confi)"
    echo "Take testing kubectl config"
fi

if [[ -z $KUBECONFIG ]]; then
    echo "Missing Kubectl config"
    exit
fi

# 
# Ingress Ngnix
# https://kubernetes.github.io/ingress-nginx/deploy/#azure
#
echo "Desplegando Ingress Ngnix"

kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.7.0/deploy/static/provider/cloud/deploy.yaml

# 
# Cert Manager
# https://cert-manager.io/docs/installation/kubectl/
#

if [[ -z $CLUSTER_ISSUER_CERT ]]; then
    echo "Error al aplicar Cert-manager"
    exit
fi

echo "Desplegando Cert Manager"
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.11.0/cert-manager.yaml

# https://cert-manager.io/docs/configuration/acme/
CLUSTER_ISSUER=$(envsubst < cert-manager/cluster-issuer.yml)

while true; do
    echo "$CLUSTER_ISSUER" | kubectl apply -f -

    if [[ $? -eq 0 ]]; then
        break
    fi

    echo "Error al aplicar el manifiesto cert manager, reintentando en 6 segundos..."
    sleep 6
done

# 
# External DNS
# 
#

if [[ -z $GODADDY_API_KEY ]] || [ -z $GODADDY_API_SECRET ] || [ -z $GODADDY_DOMAIN ]; then
    echo "Omitir External DNS"
    exit
fi

echo "Desplegando External DNS"
kubectl kustomize ./external-dns | envsubst | kubectl apply -f - 


if [[ -z $POSTGRES_URI ]] || [ -z $STORAGE_URI ]; then
    echo "Omitir Agape secret"
    exit
fi

kubectl create secret generic agape-secret \
  --from-literal=jwt-key="$(openssl rand -base64 32)" \
  --from-literal=postgres-uri=$POSTGRES_URI \
  --from-literal=storage-uri=$STORAGE_URI   


echo "Desplegando PgAdmin4"
kubectl kustomize ./pgadmin4 | envsubst | kubectl apply -f - 

echo "Desplegando AgapeApp"
kubectl kustomize ./app | envsubst | kubectl apply -f - 

echo "$KUBECONFIG_CONTENTS" > ~/.kube/config

rm "$KUBECONFIG"
