# TMCS Anonymous

A PGP based anonymous IM platform.

Developed with go as back-end & web as front-end. 

## Content
- [Installation](#installation)
  - [Build front-end](#build-front-end)
  - [Build back-end](#build-back-end)
    - [Directly build](#directly-build)
    - [Build as Docker image](#Build-as-Docker-image)
- [Nginx Configure](#Nginx-Configure)

## Installation

Clone this repo using git and update submodule
```shell
$ git clone --depth=1 https://github.com/MagicalDevelopersZyosouZone/tmcs-anonymous.git

$ cd tmcs-anonymous
$ git submodule update --init --recursive
```

### Build front-end
Resolve npm packages
```shell
$ npm install
```

Build the front-end scripts
```shell
$ npm run build
```

### Build back-end

Back-end server can be simply build into a go program or Docker image. Please choose one you perfer.

#### Directly build

set `$GOPATH` to current directory
```shell
$ export GOPATH=$PWD:$GOPATH
```

Enter the source folder and resolve packages
```shell
$ cd ./src/tmcs-anonymous
$ go get
```

Build project
```shell
$ go install tmcs-anonymous
```

After successfually build, the executable binary can be found in `./bin/tmcs-anonymous`

To run the server, simply run `./bin/tmcs-anonymous` and make sure the work directory is the root directory of this project.
```shell
$ ./bin/tmcs-anonymous
```

The Server will listen on `0.0.0.0:3000` by default.

#### Build as Docker image

Just run the command below to build a docker
```shell
$ docker build -t tmcs-anonymous .
```

Run a Docker container to start the server
```shell
$ docker container run  \
    --name "tmcs"       \
    -p <port>:3000      \
    -it                 \
    tmcs-anonymous      \
```

## Nginx Configure

You might need to configure an nginx to proxy the http request. 

Since we used WebSocket to push & send messages, the nginx config should be a bit complicate.

An example config below, We highly recommend to use HTTPS

```nginx
server {

        listen 443 ssl;
        listen [::]:443 ssl;
        ssl on;

        server_name tmcs-anonymous.yourdomain.com;

        # You might also need to config your ssl certificate here.

        location / {
                proxy_pass http://localhost:3000/;
        }
        location /ws {
                proxy_pass http://localhost:3000;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
                proxy_cache_bypass $http_upgrade;
                proxy_set_header Host $host;
        }
        location ~ /session/[a-f0-9]+/ws {
                proxy_pass http://localhost:3000;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
                proxy_cache_bypass $http_upgrade;
                proxy_set_header Host $host;
        }
}
```