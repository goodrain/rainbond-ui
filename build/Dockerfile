FROM registry.cn-hangzhou.aliyuncs.com/goodrain/rbd-app-ui:v5.2.0-enterprise
ADD dist /dist
RUN mv /dist/index.html /app/ui/www/templates/index.html && \
  rm -rf /app/ui/www/static/dists/* && \
  cp -a /dist/* /app/ui/www/static/dists/ && \
  rm -rf /app/ui/static/dists/* && \
  cp -a /dist/* /app/ui/static/dists/ && \
  rm -rf /dist
