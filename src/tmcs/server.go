package tmcs

import (
	"net/http"
	"serverlog"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

const ChannelBufferSize = 100

type TMCSAnonymousServer struct {
	Active   bool
	Addr     string
	tmcs     *TMCSAnonymous
	upgrader websocket.Upgrader
	router   *mux.Router
	server   *http.Server
	chClose  chan int
}

type TMCSAnonymousServerOptions struct {
	MaxBufferSize int
	Address       string
}

func (server *TMCSAnonymousServer) serverProc() {
	server.Active = true
	err := server.server.ListenAndServe()
	server.Active = false
	if err != nil {
		serverlog.Error("Faild to setup http server: ", err.Error())
	}
	server.chClose <- 1
}

func NewTMCSAnonymousServer(tmcs *TMCSAnonymous, options TMCSAnonymousServerOptions) *TMCSAnonymousServer {
	server := new(TMCSAnonymousServer)
	server.tmcs = tmcs
	server.upgrader = websocket.Upgrader{
		ReadBufferSize:  options.MaxBufferSize,
		WriteBufferSize: options.MaxBufferSize,
	}
	server.Addr = options.Address
	return server
}

func (server *TMCSAnonymousServer) Start() error {
	//server.http = http.NewServeMux()
	server.router = mux.NewRouter()
	server.server = &http.Server{
		Addr:    server.Addr,
		Handler: server.router,
	}
	server.chClose = make(chan int)
	server.router.HandleFunc("/ws", server.handleWebSocket())
	server.router.HandleFunc("/user/register", server.handleRegister()).Methods("POST")
	server.router.HandleFunc("/session/join/{sessionId}", server.handleJoin()).Methods("GET")
	go server.serverProc()
	serverlog.Log("Server listened on", server.Addr)
	<-server.chClose
	serverlog.Log("Server closed.")
	return nil
}

func (server *TMCSAnonymousServer) Stop() error {
	err := server.server.Shutdown(nil)
	if err != nil {
		return err
	}
	server.Active = false
	return nil
}
