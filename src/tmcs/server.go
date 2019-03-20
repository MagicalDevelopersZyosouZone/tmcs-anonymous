package tmcs

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

const ChannelBufferSize = 100

type TMCSAnonymousServer struct {
	Active   bool
	tmcs     *TMCSAnonymous
	upgrader websocket.Upgrader
	addr     string
	router   *mux.Router
	//http     *http.ServeMux
	server *http.Server
}

func NewTMCSAnonymousServer(tmcs *TMCSAnonymous, maxBufferSize int) *TMCSAnonymousServer {
	server := new(TMCSAnonymousServer)
	server.tmcs = tmcs
	server.upgrader = websocket.Upgrader{
		ReadBufferSize:  maxBufferSize,
		WriteBufferSize: maxBufferSize,
	}
	return server
}

func (server *TMCSAnonymousServer) Start() error {
	//server.http = http.NewServeMux()
	server.router = mux.NewRouter()
	server.server = &http.Server{
		Addr:    server.addr,
		Handler: server.router,
	}
	server.router.HandleFunc("/ws", server.handleWebSocket())
	server.router.HandleFunc("/user/register", server.handleRegister()).Methods("POST")
	server.router.HandleFunc("/session/join/{sessionId}", server.handleJoin()).Methods("GET")
	err := server.server.ListenAndServe()
	if err != nil {
		return err
	}
	server.Active = true
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
