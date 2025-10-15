# advantage-backend

# atualizar o env no s3: 
aws s3 cp ./prd.env s3://cartaobeneficios/advantage-backend/prd.env --region us-east-1 --sse AES256 --content-type text/plain

# verificar se deu certo (pela dt da atualização):
aws s3 ls s3://cartaobeneficios/advantage-backend/prd.env --region us-east-1