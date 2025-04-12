# Cargar las variables del archivo .env y exportarlas
while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ ! $line =~ ^\#.* ]] && [[ $line =~ .*=.* ]]; then
        export $line
    fi
done < <(cat ../.env; echo)

# kubectl logs agape-deployment-fff9f6d-2s4xn --previous
# kubectl logs agape-deployment-fff9f6d-dspz9 -f
# kubectl describe pod cm-acme-http-solver-4q8sx

# kubectl kustomize . | envsubst | kubectl delete -f - 
kubectl kustomize . | envsubst | kubectl apply -f - 