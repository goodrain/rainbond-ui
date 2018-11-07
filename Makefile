all: build dists

build:
	docker build -t local-ui .

dists:
	docker run -it --rm -v ${PWD}/dist:/pythonWork/rainbond-console/www/static/dists local-ui 