#!/bin/bash

mkdir ./node_modules
chmod 777 ./node_modules
docker run --rm -v "$(pwd)":/app -w=/app node:16.15.0 sh -c "yarn install && yarn run build"

if [ ! -d "./dist" ];then
    exit 1;
fi