FROM nodejs:8-alpine as builder
ADD . /build
RUN npm install && npm run build

FROM goodrainapps/python:2.7.9 as runner
COPY --from=builder /build/dist /dist

