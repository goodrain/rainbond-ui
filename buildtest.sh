#!/bin/bash

npm run build

mv dist ./build/dist

cd build && docker build -t uitest . -f Dockerfile.nginx

docker run -it --rm -p 8088:80 uitest

