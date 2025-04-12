# Cargar las variables del archivo .env y exportarlas
while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ ! $line =~ ^\#.* ]] && [[ $line =~ .*=.* ]]; then
        export $line
    fi
done < <(cat ../.env; echo)


kubectl kustomize . | envsubst | kubectl delete -f - 
kubectl kustomize . | envsubst | kubectl apply -f - 