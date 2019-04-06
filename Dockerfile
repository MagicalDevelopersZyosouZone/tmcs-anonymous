FROM golang:1.12-stretch
WORKDIR /go/src/tmcs-anonymous
COPY ./src /go/src/tmcs-anonymous/src
COPY ./www /go/src/tmcs-anonymous/www
SHELL ["bash", "-c"]
ENV GOPATH=/go/src/tmcs-anonymous
EXPOSE 3000
CMD cd /go/src/tmcs-anonymous/src/tmcs-anonymous && \
    go build && \
    cd /go/src/tmcs-anonymous/bin && \
    ./tmcs-anonymous
