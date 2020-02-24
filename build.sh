#!/bin/bash

docker run -it --rm -v "$(pwd)":/app -w=/app node:10 yarn install && yarn run build