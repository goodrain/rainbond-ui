FROM node:8-alpine as builder
ADD . /build
WORKDIR /build
RUN npm install -g cnpm --registry=https://registry.npm.taobao.org 
RUN cnpm install && cnpm run build

FROM goodrainapps/python:2.7.9 as runner
COPY --from=builder /build/dist /dist

