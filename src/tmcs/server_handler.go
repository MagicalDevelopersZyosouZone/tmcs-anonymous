package tmcs

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"serverlog"
	"tmcs_msg"
	"user"

	"github.com/gorilla/mux"
	"golang.org/x/crypto/openpgp"
)

type signUpMsg struct {
	Pubkey string "pubkey"
	Sign   string "sign"
}

type responseMsg struct {
	Error tmcs_msg.ErrorCode
	Msg   string
	Data  string
}

func (msg *responseMsg) ToJSON() []byte {
	obj := make(map[string]interface{})
	obj["error"] = int(msg.Error)
	obj["msg"] = msg.Msg
	obj["data"] = msg.Data
	data, err := json.Marshal(obj)
	if err != nil {
		return nil
	}
	return data
}

func (server *TMCSAnonymousServer) handleWebSocket() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := server.upgrader.Upgrade(w, r, nil)
		if err != nil {
			serverlog.Error("Failed when upgrade to WebSocket: ", err.Error())
			return
		}
		session := user.NewSession(conn, ChannelBufferSize)
		if !session.Start(server.tmcs.KeysLib) {
			return
		}
		origin, ok := server.tmcs.SessionsLib.Get(session.Key.FingerPrint)
		if ok {
			(origin.(*user.Session)).Join(session)
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
			writer.Write((&responseMsg{
				Error: tmcs_msg.ErrorCode_InvalidMessage,
				Msg:   "Invalid request",
			}).ToJSON())
			return
		}

		keyring, err := openpgp.ReadArmoredKeyRing(bytes.NewBufferString(msg.Pubkey))
		if err != nil || len(keyring) == 0 {
			serverlog.Warn("Sign up with invalid public key.")
			writer.WriteHeader(http.StatusForbidden)
			writer.Write((&responseMsg{
				Error: tmcs_msg.ErrorCode_InvalidKey,
				Msg:   "Invalid key",
			}).ToJSON())
			return
		}
		pubkey := keyring[0]

		fingerprint := hex.EncodeToString(pubkey.PrimaryKey.Fingerprint[0:])
		if server.tmcs.RegistedKeys.Has("key:" + fingerprint) {
			writer.WriteHeader(http.StatusForbidden)
			writer.Write((&responseMsg{
				Error: tmcs_msg.ErrorCode_InvalidKey,
				Msg:   "Invalid key",
			}).ToJSON())
			return
		}

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
			writer.Write((&responseMsg{
				Error: tmcs_msg.ErrorCode_VerifyError,
				Msg:   "Identity verify failed",
			}).ToJSON())
			return
		}
		keyBuffer := bytes.NewBuffer(nil)
		pubkey.Serialize(keyBuffer)
		key, err := user.NewKey(keyBuffer.Bytes(), 300000)

	ReGen:
		sessionIdBuffer := make([]byte, 6)
		rand.Read(sessionIdBuffer)
		sessionId := base64.URLEncoding.EncodeToString(sessionIdBuffer)
		if server.tmcs.RegistedKeys.Has("sessionId:" + sessionId) {
			goto ReGen
		}

		server.tmcs.RegistedKeys.Set("sessionId:"+sessionId, key, 300000)
		server.tmcs.RegistedKeys.Set("key:"+key.FingerPrint, key, 300000)
		server.tmcs.KeysLib.Set(key.FingerPrint, key, 300000)

		writer.WriteHeader(http.StatusOK)
		writer.Write((&responseMsg{
			Error: tmcs_msg.ErrorCode_None,
			Msg:   "",
			Data:  sessionId,
		}).ToJSON())
	}
}

func (server *TMCSAnonymousServer) handleJoin() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		session := vars["sessionId"]
		obj, ok := server.tmcs.RegistedKeys.Get("sessionId:" + session)
		if !ok {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		key := obj.(*user.Key)
		server.tmcs.RegistedKeys.Delete("sessionId:" + session)
		server.tmcs.RegistedKeys.Delete("key:" + key.FingerPrint)
		http.Redirect(w, r, "/session/join/"+key.FingerPrint, http.StatusSeeOther)
	}
}
