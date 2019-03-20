package tmcs

import (
	"encoding/json"
	"net/http"
	"serverlog"
	"user"
)

type signUpMsg struct {
	pubkey string
}

func (server *TMCSAnonymousServer) handleWebSocket() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
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
	}
}

func (server *TMCSAnonymousServer) handleRegister() func(http.ResponseWriter, *http.Request) {
	return func(writer http.ResponseWriter, request *http.Request) {
		msg := new(signUpMsg)
		err := json.NewDecoder(request.Body).Decode(msg)
		if err != nil {
			writer.WriteHeader(http.StatusForbidden)
			return
		}
	}
}

func (server *TMCSAnonymousServer) handleJoin() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {

	}
}
