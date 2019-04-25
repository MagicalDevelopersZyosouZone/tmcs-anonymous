FROM golang:1.12-stretch
WORKDIR /go/src/tmcs-anonymous
COPY ./src /go/src/tmcs-anonymous/src
COPY ./www /go/src/tmcs-anonymous/www
COPY ./tmcs-config.json /go/src/tmcs-anonymous/tmcs-config.json
SHELL ["bash", "-c"]
RUN cd /go/src/tmcs-anonymous/src/tmcs-anonymous && \
    export GOPATH=/go/src/tmcs-anonymous && \
    go get
ENV GOPATH=/go/src/tmcs-anonymous
EXPOSE 3000
CMD cd /go/src/tmcs-anonymous &&\
    go install tmcs-anonymous && \
    ./bin/tmcs-anonymous
