package tmcs

import (
	"net/http"
	"serverlog"
	"user"

	"github.com/gorilla/websocket"
)

const ChannelBufferSize = 100

type TMCSAnonymousServer struct {
	Active   bool
	tmcs     *TMCSAnonymous
	upgrader websocket.Upgrader
	addr     string
	http     *http.ServeMux
	server   *http.Server
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
	server.http = http.NewServeMux()
	server.server = &http.Server{
		Addr:    server.addr,
		Handler: server.http,
	}
	server.http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := server.upgrader.Upgrade(w, r, nil)
		if err != nil {
			serverlog.Error("Failed when upgrade to WebSocket: ", err.Error())
			return
		}
		session := user.NewSession(conn, ChannelBufferSize)
		if !session.Start(server.tmcs.KeyLib) {
			return
		}
		origin := server.tmcs.SessionManager.GetSession(session.Key.FingerPrint)
		if origin != nil {
			origin.Join(session)
		} else {
			server.tmcs.SessionManager.AddSession(session)
		}
	})
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
