#!/bin/bash
VERSION=master
docker run -it --rm -v `pwd`:/app -w=/app node:8 npm install && npm run build