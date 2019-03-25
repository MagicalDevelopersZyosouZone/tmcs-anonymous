package tmcs

import (
	"bytes"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"serverlog"
	"user"

	"github.com/gorilla/mux"

	"golang.org/x/crypto/openpgp"
)

type signUpMsg struct {
	Pubkey string "pubkey"
	Sign   string "sign"
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
		origin, ok := server.tmcs.SessionsLib.Get(session.Key.FingerPrint)
		if ok {
			origin.Join(session)
		} else {
			server.tmcs.SessionsLib.Set(session.Key.FingerPrint, session, 300000)
		}
	}
}

func (server *TMCSAnonymousServer) handleRegister() func(http.ResponseWriter, *http.Request) {
	return func(writer http.ResponseWriter, request *http.Request) {
		msg := new(signUpMsg)
		err := json.NewDecoder(request.Body).Decode(msg)
		if err != nil {
			serverlog.Log("Received invalid sign up request.")
			writer.WriteHeader(http.StatusForbidden)
			return
		}

		keyring, err := openpgp.ReadArmoredKeyRing(bytes.NewBufferString(msg.Pubkey))
		if err != nil || len(keyring) == 0 {
			serverlog.Warn("Sign up with invalid public key.")
			writer.WriteHeader(http.StatusForbidden)
			return
		}
		pubkey := keyring[0]

		sign, err := base64.StdEncoding.DecodeString(msg.Sign)
		if err != nil {
			serverlog.Warn("Sign up with invalid signature.")
			writer.WriteHeader(http.StatusForbidden)
			return
		}
		signer, err := openpgp.CheckDetachedSignature(keyring, bytes.NewBuffer(pubkey.PrimaryKey.Fingerprint[0:]), bytes.NewBuffer(sign))
		if err != nil || bytes.Compare(signer.PrimaryKey.Fingerprint[0:], pubkey.PrimaryKey.Fingerprint[0:]) != 0 {
			serverlog.Warn("Identity verify failed.")
			writer.WriteHeader(http.StatusForbidden)
			return
		}
		keyBuffer := bytes.NewBuffer(nil)
		pubkey.Serialize(keyBuffer)
		key, err := user.NewKey(keyBuffer.Bytes(), 300000)
		server.tmcs.RegistedKeyManager.AddKey(key)
		writer.WriteHeader(http.StatusOK)
		writer.Write(bytes.NewBufferString(hex.EncodeToString(pubkey.PrimaryKey.Fingerprint[0:])).Bytes())
	}
}

func (server *TMCSAnonymousServer) handleJoin() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		session := vars["sessionId"]

	}
}
