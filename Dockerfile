FROM node:8.11.4

COPY . /app

WORKDIR /app

RUN chmod +x /app/build.sh

#RUN npm install && npm run buildtest

ENTRYPOINT [ "/app/build.sh" ]