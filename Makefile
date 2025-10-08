AWS_REGION ?= us-east-1
AWS_ACCOUNT_ID ?= 816582314863
ECR_REPO ?= gar/advantage-backend
ECR_URI := $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com/$(ECR_REPO)
IMAGE_NAME ?= gar/advantage-backend
CLUSTER ?= cartao-beneficios
SERVICE ?= advantage-service-pxiniwz3
TASK_FAMILY ?= advantage
CONTAINER_NAME ?= advantage-backend

DATE := $(shell date +%Y%m%d-%H%M)
# Usa a TAG do arquivo .tag se existir; caso contrário, gera pela data
TAG ?= $(shell if [ -f .tag ]; then cat .tag; else echo $(DATE); fi)

.PHONY: lock-tag tag-clean build ecr-login docker-build docker-push ecs-deploy deploy status

# Grava a TAG resolvida em .tag para manter consistência entre os alvos
lock-tag:
	@echo "$(TAG)" > .tag
	@echo "> TAG travada: $(TAG)"

# Remove o arquivo de TAG travada
tag-clean:
	rm -f .tag

build:
	npm ci
	npm run build

ecr-login:
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com

docker-build:
	docker build --platform linux/amd64 -t $(IMAGE_NAME):$(TAG) .

docker-push:
	docker tag $(IMAGE_NAME):$(TAG) $(ECR_URI):$(TAG)
	docker push $(ECR_URI):$(TAG)

taskdef:
	@echo "> Gerando task definition para imagem: $(ECR_URI):$(TAG)"
	@if command -v jq >/dev/null; then \
		jq --arg img "$(ECR_URI):$(TAG)" '.containerDefinitions[0].image=$$img' task-definition-final.json > td.$(TAG).json; \
	else \
		sed -e 's#"image": ".*"#"image": "$(ECR_URI):$(TAG)"#' task-definition-final.json > td.$(TAG).json; \
	fi

ecs-deploy:
	@echo "> Registrando nova task definition"
	@TD_ARN=$$(aws ecs register-task-definition --cli-input-json file://td.$(TAG).json --region $(AWS_REGION) --query 'taskDefinition.taskDefinitionArn' --output text); \
		echo "Nova task: $$TD_ARN"; \
		aws ecs update-service --cluster $(CLUSTER) --service $(SERVICE) --task-definition $$TD_ARN --region $(AWS_REGION); \
		aws ecs wait services-stable --cluster $(CLUSTER) --services $(SERVICE) --region $(AWS_REGION)

deploy: lock-tag build ecr-login docker-build docker-push taskdef ecs-deploy

status:
	aws ecr describe-images --repository-name $(ECR_REPO) --region $(AWS_REGION) --image-ids imageTag=$(TAG) --query 'imageDetails[0].{tag:$(TAG),digest:imageDigest,pushed:imagePushedAt}'