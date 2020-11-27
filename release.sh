#!/bin/bash
if [ -z "$VERSION" ];then
	if [ -z "$TRAVIS_TAG" ]; then
		VERSION=$TRAVIS_BRANCH-dev
	else
		VERSION=$TRAVIS_TAG
	fi
fi

BUILD_RBD_APP_UI=${BUILD_RBD_APP_UI:-true} 
DOMESTIC_BASE_NAME=${DOMESTIC_BASE_NAME:-'registry.cn-hangzhou.aliyuncs.com'}
DOMESTIC_NAMESPACE=${DOMESTIC_NAMESPACE:-'goodrain'}

echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin 
docker build -t "rainbond/rainbond-ui:$VERSION" .
docker push "rainbond/rainbond-ui:$VERSION"


if [ ${BUILD_RBD_APP_UI} == "true" ];
then
	mv dist build/dist
	docker build --build-arg VERSION="${VERSION}" -t "rainbond/rbd-app-ui:$VERSION" ./build
	docker push "rainbond/rbd-app-ui:$VERSION"

	if [ ${DOMESTIC_BASE_NAME} ];
	then
		newTag="${DOMESTIC_BASE_NAME}/${DOMESTIC_NAMESPACE}/rbd-app-ui:${VERSION}"
		docker tag "rainbond/rbd-app-ui:$VERSION" "${newTag}"
		docker login -u "$DOMESTIC_DOCKER_USERNAME" -p "$DOMESTIC_DOCKER_PASSWORD" ${DOMESTIC_BASE_NAME}
		docker push "${newTag}"
	fi
fi

