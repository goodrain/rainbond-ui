#!/bin/bash
VERSION=5.1.1
docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD
docker build -t rainbond/rainbond-ui:$VERSION .
docker push rainbond/rainbond-ui:$VERSION
sed -i "s/VERSION/$VERSION/g" ./build/Dockerfile
mv dist build/dist
docker build -t rainbond/rbd-app-ui:$VERSION ./build
docker push rainbond/rbd-app-ui:$VERSION
