FROM golang:1.12-stretch
WORKDIR /go/src/tmcs-anonymous
SHELL ["bash", "-c"]
ENV GOPATH=/go/src/tmcs-anonymous
EXPOSE 57321/tcp
RUN git clone https://github.com/MagicalDevelopersZyosouZone/tmcs-anonymous.git /go/src/tmcs-anonymous && \
    cd /go/src/tmcs-anonymous && \
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash && \
    export NVM_DIR=/root/.nvm && \
    source /root/.nvm/nvm.sh && \
    nvm install 10 && \
    npm install && \
    npm run build
CMD /go/src/tmcs-anonymous/bin/tmcs-anonymous
