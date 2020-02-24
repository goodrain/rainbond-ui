#!/bin/bash
HOME=/build/goodrain/rainbond-ui
mkdir ./node_modules
chmod 777 ./node_modules
docker run -it --rm -v "$(pwd)":${HOME} -w=${HOME} node:12 yarn install && yarn run build

if [ ! -d "./dist" ];then
    exit 1;
fi

if [ "$TRAVIS_PULL_REQUEST" == "false" ]; then ./release.sh ;fi