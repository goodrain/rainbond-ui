#!/bin/bash
HOME=/home/travis/build/goodrain/rainbond-ui
docker run -it --rm -v "$(pwd)":${HOME} -w=${HOME} node:12 yarn install && yarn run build

if [ ! -d "./dist" ];then
    exit 1;
fi

if [ "$TRAVIS_PULL_REQUEST" == "false" ]; then ./release.sh ;fi