docker rmi -f $(docker images -q)
docker tag builderfloor:latest nu:builderfloor
docker-compose up -d --build
