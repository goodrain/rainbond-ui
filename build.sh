#!/bin/bash
VERSION=3.7.2
docker run -it --rm -v `pwd`:/app -w=/app node:8 npm install && npm run build
