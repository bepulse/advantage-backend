# advantage-backend

# atualizar o env no s3: 
aws s3 cp ./prd.env s3://cartaobeneficios/advantage-backend/prd.env --region us-east-1 --sse AES256 --content-type text/plain

# verificar se deu certo (pela dt da atualização):
aws s3 ls s3://cartaobeneficios/advantage-backend/prd.env --region us-east-1

# reiniciar task na ecs:
aws ecs update-service --cluster cartao-beneficios --service advantage-service-pxiniwz3 --force-new-deployment --region us-east-1

# conferir rollout:
aws ecs describe-services --cluster cartao-beneficios --services advantage-service-pxiniwz3 --region us-east-1 --query "services[0].deployments[].{id:id,rolloutState:rolloutState,taskDef:taskDefinition,desired:desiredCount,running:runningCount}"