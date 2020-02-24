#!/bin/bash
HOME=/home/travis/build/goodrain/rainbond-ui
docker run -it --rm -v "$(pwd)":${HOME} -w=${HOME} node:10 yarn install && yarn run build

if [ "$TRAVIS_PULL_REQUEST" == "false" ]; then ./release.sh ;fi