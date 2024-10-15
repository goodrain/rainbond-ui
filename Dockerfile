FROM node:16.15.0 as compile
COPY . /app
WORKDIR /app
RUN yarn install && yarn run build

FROM alpine:3.18
COPY --from=compile /app/dist /dist
