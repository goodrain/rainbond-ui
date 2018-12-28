#!/bin/bash
VERSION=5.0
docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD
docker build -t rainbond/rainbond-ui:$VERSION .
docker push rainbond/rainbond-ui:$VERSION
sed -i "s/VERSION/$VERSION/g" ./build/Dockerfile
docker build -t rainbond/rbd-app-ui:$VERSION ./build
docker push rainbond/rbd-app-ui:$VERSION