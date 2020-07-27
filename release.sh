#!/bin/bash
IMAGE_DOMAIN=${IMAGE_DOMAIN:-docker.io}
IMAGE_NAMESPACE=${IMAGE_DOMAIN:-rainbond}
if [ -z "$VERSION" ];then
	if [ -z "$TRAVIS_TAG" ]; then
		VERSION=$TRAVIS_BRANCH-dev
	else
		VERSION=$TRAVIS_TAG
	fi
fi

echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin 
docker build -t "${IMAGE_DOMAIN}/${IMAGE_NAMESPACE}/rainbond-ui:$VERSION" .
docker push "${IMAGE_DOMAIN}/${IMAGE_NAMESPACE}/rainbond-ui:$VERSION"

sed -i "s/VERSION/$VERSION/g" ./build/Dockerfile
sed -i "s/IMAGE_DOMAIN/$IMAGE_DOMAIN/g" ./build/Dockerfile
sed -i "s/IMAGE_NAMESPACE/$IMAGE_NAMESPACE/g" ./build/Dockerfile
mv dist build/dist
docker build -t "${IMAGE_DOMAIN}/${IMAGE_NAMESPACE}/rbd-app-ui:$VERSION" ./build
docker push "${IMAGE_DOMAIN}/${IMAGE_NAMESPACE}/rbd-app-ui:$VERSION"

if [ ${DOMESTIC_BASE_NAME} ];
then
	newTag="${DOMESTIC_BASE_NAME}/${DOMESTIC_NAMESPACE}/rbd-app-ui:${VERSION}"
	docker tag "${IMAGE_DOMAIN}/${IMAGE_NAMESPACE}/rbd-app-ui:$VERSION" "${newTag}"
	docker login -u "$DOMESTIC_DOCKER_USERNAME" -p "$DOMESTIC_DOCKER_PASSWORD" ${DOMESTIC_BASE_NAME}
	docker push "${newTag}"
fi