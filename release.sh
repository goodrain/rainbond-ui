#!/bin/bash
if [ -z "$VERSION" ];then
	if [ -z "$TRAVIS_TAG" ]; then
		VERSION=$TRAVIS_BRANCH-dev
	else
		VERSION=$TRAVIS_TAG
	fi
fi
DOMESTIC_BASE_NAME="images.goodrain.com"
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin  ${DOMESTIC_BASE_NAME}
docker build -t "$DOCKER_USERNAME/rainbond-ui:$VERSION" .
docker push "$DOCKER_USERNAME/rainbond-ui:$VERSION"

sed -i "s/VERSION/$VERSION/g" ./build/Dockerfile
mv dist build/dist
docker build -t "$DOCKER_USERNAME/rbd-app-ui:$VERSION" ./build
docker push "$DOCKER_USERNAME/rbd-app-ui:$VERSION"