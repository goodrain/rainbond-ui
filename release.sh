#!/bin/bash

if [ -z "$TRAVIS_TAG" ]; then
	VERSION=$TRAVIS_BRANCH-dev
else
	VERSION=$TRAVIS_TAG
fi
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin 
docker build -t "rainbond/rainbond-ui:$VERSION" .
docker push "rainbond/rainbond-ui:$VERSION"
sed -i "s/VERSION/$VERSION/g" ./build/Dockerfile
mv dist build/dist
docker build -t "rainbond/rbd-app-ui:$VERSION" ./build
docker push "rainbond/rbd-app-ui:$VERSION"