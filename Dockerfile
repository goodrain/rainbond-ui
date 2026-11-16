FROM node:16.15.0 as compile
WORKDIR /app
COPY package.json yarn.lock .npmrc ./
RUN yarn install --network-timeout 10000000
COPY . /app
RUN yarn run build

FROM alpine:3.18
COPY --from=compile /app/dist /dist
