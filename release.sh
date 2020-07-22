#!/bin/bash
if [ -z "$VERSION" ];then
	if [ -z "$TRAVIS_TAG" ]; then
		VERSION=$TRAVIS_BRANCH-dev
	else
		VERSION=$TRAVIS_TAG
	fi
fi
DOMESTIC_BASE_NAME="image.goodrain.com"
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin  ${DOMESTIC_BASE_NAME}
docker build -t "$DOMESTIC_BASE_NAME/rainbond-ui:$VERSION" -f Dockerfile.release .
docker push "$DOMESTIC_BASE_NAME/rainbond-ui:$VERSION"

sed -i "s/VERSION/$VERSION/g" ./build/Dockerfile
sed -i "s/DOMESTIC_BASE_NAME/$DOMESTIC_BASE_NAME/g" ./build/Dockerfile
mv dist build/dist
docker build -t "$DOMESTIC_BASE_NAME/rbd-app-ui:$VERSION" ./build
docker push "$DOMESTIC_BASE_NAME/rbd-app-ui:$VERSION"