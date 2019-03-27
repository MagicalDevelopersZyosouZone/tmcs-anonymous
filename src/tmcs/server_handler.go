package tmcs

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/url"
	"serverlog"
	"tmcs_msg"
	"user"

	"github.com/gorilla/mux"
	"golang.org/x/crypto/openpgp"
)

type signUpMsg struct {
	Name   string "name"
	Pubkey string "pubkey"
	Sign   string "sign"
}

type responseMsg struct {
	Error tmcs_msg.ErrorCode
	Msg   string
	Data  string
}

const keyExpire = 300000

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

func (server *TMCSAnonymousServer) tryRegister(w http.ResponseWriter, r *http.Request) *user.User {
	msg := new(signUpMsg)
	err := json.NewDecoder(r.Body).Decode(msg)
	if err != nil {
		serverlog.Log("Received invalid sign up request.")
		w.WriteHeader(http.StatusForbidden)
		w.Write((&responseMsg{
			Error: tmcs_msg.ErrorCode_InvalidMessage,
			Msg:   "Invalid request",
		}).ToJSON())
		return nil
	}
	keyring, err := openpgp.ReadArmoredKeyRing(bytes.NewBufferString(msg.Pubkey))
	if err != nil || len(keyring) == 0 {
		serverlog.Warn("Sign up with invalid public key.")
		w.WriteHeader(http.StatusForbidden)
		w.Write((&responseMsg{
			Error: tmcs_msg.ErrorCode_InvalidKey,
			Msg:   "Invalid key",
		}).ToJSON())
		return nil
	}
	pubkey := keyring[0]

	fingerprint := hex.EncodeToString(pubkey.PrimaryKey.Fingerprint[0:])
	if server.tmcs.Users.Has(fingerprint) {
		w.WriteHeader(http.StatusForbidden)
		w.Write((&responseMsg{
			Error: tmcs_msg.ErrorCode_InvalidKey,
			Msg:   "Duplicate key",
		}).ToJSON())
		return nil
	}

	sign, err := base64.StdEncoding.DecodeString(msg.Sign)
	if err != nil {
		serverlog.Warn("Sign up with invalid signature.")
		w.WriteHeader(http.StatusForbidden)
		return nil
	}
	signer, err := openpgp.CheckDetachedSignature(keyring, bytes.NewBuffer(pubkey.PrimaryKey.Fingerprint[0:]), bytes.NewBuffer(sign))
	if err != nil || bytes.Compare(signer.PrimaryKey.Fingerprint[0:], pubkey.PrimaryKey.Fingerprint[0:]) != 0 {
		serverlog.Warn("Identity verify failed.")
		w.WriteHeader(http.StatusForbidden)
		w.Write((&responseMsg{
			Error: tmcs_msg.ErrorCode_VerifyError,
			Msg:   "Identity verify failed",
		}).ToJSON())
		return nil
	}
	keyBuffer := bytes.NewBuffer(nil)
	pubkey.Serialize(keyBuffer)
	key, err := user.NewKey(keyBuffer.Bytes(), keyExpire)
	return user.NewUser(msg.Name, key)
}

func (server *TMCSAnonymousServer) handleWebSocket() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := server.upgrader.Upgrade(w, r, nil)
		if err != nil {
			serverlog.Error("Failed when upgrade to WebSocket: ", err.Error())
			return
		}
		session := user.NewSession(conn, ChannelBufferSize)
		if !session.Start(server.tmcs.Users) {
			return
		}
		userObj, ok := server.tmcs.Users.Get(session.User.Key.FingerPrint)
		if ok {
			(userObj.(*user.User)).Session.Join(session)
		} else {
			(userObj.(*user.User)).Session = session
		}
	}
}

func (server *TMCSAnonymousServer) handleRegister() func(http.ResponseWriter, *http.Request) {
	return func(writer http.ResponseWriter, request *http.Request) {
		usr := server.tryRegister(writer, request)
		if usr == nil {
			return
		}

	ReGen:
		sessionIdBuffer := make([]byte, 6)
		rand.Read(sessionIdBuffer)
		sessionId := base64.URLEncoding.EncodeToString(sessionIdBuffer)
		if server.tmcs.RegistedKeys.Has(sessionId) {
			goto ReGen
		}

		server.tmcs.RegistedKeys.Set(sessionId, usr.Key, keyExpire)
		server.tmcs.Users.Set(usr.Key.FingerPrint, usr, keyExpire)

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
		obj, ok := server.tmcs.RegistedKeys.Get(session)
		if !ok {
			server.errorHandler(w, r, http.StatusNotFound)
			return
		}
		key := obj.(*user.Key)
		server.tmcs.RegistedKeys.Delete(session)
		http.Redirect(w, r, "/session/"+key.FingerPrint+"/", http.StatusSeeOther)
	}
}

func (server *TMCSAnonymousServer) handleSessionJoin() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {

		vars := mux.Vars(r)
		fingerprint := vars["fingerprint"]
		_, ok := server.tmcs.Users.Get(fingerprint)
		if !ok {
			server.errorHandler(w, r, http.StatusNotFound)
			return
		}

		match := server.sessionRegex.FindSubmatch([]byte(r.URL.Path))
		if len(match) < 2 {
			server.errorHandler(w, r, http.StatusNotFound)
			return
		}
		path := string(match[1])
		r.URL, _ = url.Parse(path)
		server.fs.ServeHTTP(w, r)

		return
	}
}

func (server *TMCSAnonymousServer) handleSessionRegister(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	fingerprint := vars["fingerprint"]
	_, ok := server.tmcs.Users.Get(fingerprint)
	if !ok {
		server.errorHandler(w, r, http.StatusNotFound)
		return
	}

	usr := server.tryRegister(w, r)
	if usr == nil {
		return
	}
	server.tmcs.Users.Set(usr.Key.FingerPrint, usr, keyExpire)

	w.WriteHeader(http.StatusOK)
	w.Write((&responseMsg{
		Error: tmcs_msg.ErrorCode_None,
		Msg:   "",
		Data:  usr.Key.FingerPrint,
	}).ToJSON())
}

func (server *TMCSAnonymousServer) errorHandler(w http.ResponseWriter, r *http.Request, status int) {
	w.WriteHeader(status)
}
