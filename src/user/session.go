package user

import (
	"bytes"
	"cache"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"serverlog"
	"time"
	"tmcs_msg"
	"version"

	"github.com/google/uuid"

	"github.com/golang/protobuf/proto"
	"golang.org/x/crypto/openpgp"

	"github.com/gorilla/websocket"
)

const SessionRenewTime = 1800

type RPCHandler interface {
	handle(rpc *tmcs_msg.RPC)
}

type SessionMessage struct {
	Sender   *User
	Receiver *User
	Msg      *tmcs_msg.SignedMsg
}

type Session struct {
	User       *User
	Connected  bool
	ID         string
	lastActive time.Time
	connection *websocket.Conn
	bufferSize int
	chClose    chan int
}

type IKeyManager interface {
	GetKey(fingerprint string) *Key
	AddKey(key *Key) error
	RemoveKey(fingerprint string)
}

// Receive from client
func (session *Session) recv() {
	defer func() {
		if r := recover(); r != nil {
			serverlog.Error("Error when receiving from {" + session.User.Key.FingerPrint + "}")
			session.Close()
		}
	}()
	for {
		select {
		case <-session.chClose:
			return
		default:
			msgType, buffer, err := session.connection.ReadMessage()
			if err != nil {
				serverlog.Error("Failed to receive from <", session.User.Key.FingerPrint, ">: ", err.Error())
				session.Close()
				continue
			}
			if msgType == websocket.TextMessage {
				session.echo("Invalid message.")
				session.Close()
				return
			}
			msg := new(tmcs_msg.SignedMsg)
			err = proto.Unmarshal(buffer, msg)
			if err != nil {
				session.User.Post(&SessionMessage{
					Sender:   nil,
					Receiver: session.User,
					Msg:      session.errorMessage(tmcs_msg.ErrorCode_InvalidMessage, "Invalid message.", fmt.Sprint(msg.Id)),
				})
				serverlog.Warn("Invalid message from <", session.User.Key.FingerPrint, ">.")
				continue
			}
			if !session.verifyMsg(msg) {
				session.User.Post(&SessionMessage{
					Sender:   nil,
					Receiver: session.User,
					Msg:      session.errorMessage(tmcs_msg.ErrorCode_VerifyError, "Signature verification fail.", fmt.Sprint(msg.Id)),
				})
				serverlog.Warn("Signature verify failed from <", session.User.Key.FingerPrint, ">.")
				continue
			}
			session.dispacth(msg)
			session.lastActive = time.Now()
			session.User.Renew()
		}

	}
}

// Send to client
func (session *Session) send() {
	defer func() {
		if r := recover(); r != nil {
			serverlog.Error("Error when sending to {" + session.User.Key.FingerPrint + "}")
			session.Close()
		}
	}()
	for {
		select {
		case <-session.chClose:
			return
		case msg, ok := <-session.User.chPost:
			if !ok {
				serverlog.Error("Unexpected channel closing in session {", session.ID, "}.")
				session.Close()
				return
			}
			if msg == nil {
				continue
			}
			// Discard messages from blacklist
			if !session.User.CheckContact(msg.Msg.Sender) {
				continue
			}
			buffer, err := proto.Marshal(msg.Msg)
			if err != nil {
				if msg.Sender != nil {
					serverlog.Error("Failed to marshal message from <", msg.Sender.Key.FingerPrint, ">.")
				} else {
					serverlog.Error("Failed to marshal message from internal server.")
				}
				continue
			}
			session.connection.WriteMessage(websocket.BinaryMessage, buffer)
			session.lastActive = time.Now()
			session.User.Renew()
		}
	}
}

func (session *Session) errorMessage(code tmcs_msg.ErrorCode, msg, data string) *tmcs_msg.SignedMsg {
	buffer, err := proto.Marshal(&tmcs_msg.Error{
		Code:    code,
		Message: msg,
		Data:    data,
	})
	if err != nil {
		serverlog.Error("Failed to create error message: ", err.Error())
		return nil
	}
	return &tmcs_msg.SignedMsg{
		Id:       0,
		Sender:   "",
		Receiver: session.User.Key.FingerPrint,
		Type:     tmcs_msg.SignedMsg_Error,
		Body:     buffer,
	}
}

func (session *Session) verify(pubkey openpgp.EntityList, data []byte, sign []byte) bool {
	signer, err := openpgp.CheckDetachedSignature(pubkey, bytes.NewBuffer(data), bytes.NewBuffer(sign))
	if err != nil {
		return false
	}
	if bytes.Compare(signer.PrimaryKey.Fingerprint[0:], pubkey[0].PrimaryKey.Fingerprint[0:]) != 0 {
		return false
	}
	return true
}

func (session *Session) verifyMsg(msg *tmcs_msg.SignedMsg) bool {
	signer, err := openpgp.CheckDetachedSignature(session.User.Key.PublicKey, bytes.NewBuffer(msg.Body), bytes.NewBuffer(msg.Sign))
	if err != nil {
		return false
	}
	if hex.EncodeToString(signer.PrimaryKey.Fingerprint[0:]) != session.User.Key.FingerPrint {
		return false
	}
	return true
}

// Write text message to connection
func (session *Session) echo(text string) {
	if session.connection != nil {
		session.connection.WriteMessage(websocket.TextMessage, bytes.NewBufferString(text).Bytes())
	}
}

func (session *Session) handleMsg(msg *tmcs_msg.SignedMsg) {
	switch msg.Type {
	case tmcs_msg.SignedMsg_Message:
		session.dispacth(msg)
	case tmcs_msg.SignedMsg_Receipt:
		session.dispacth(msg)
	case tmcs_msg.SignedMsg_RPC:
		rpc := new(tmcs_msg.RPC)
		err := proto.Unmarshal(msg.Body, rpc)
		if err != nil {
			session.User.Post(&SessionMessage{
				Msg:      session.errorMessage(tmcs_msg.ErrorCode_InvalidMessage, "Invalid message", ""),
				Receiver: session.User,
				Sender:   nil,
			})
			return
		}
		session.handleRpc(rpc)
	}
}

func (session *Session) handleRpc(rpc *tmcs_msg.RPC) {

}

func (session *Session) dispacth(msg *tmcs_msg.SignedMsg) {
	receiver := session.User.tmcs.GetUser(msg.Receiver)
	if receiver == nil {
		session.User.Post(&SessionMessage{
			Sender:   nil,
			Receiver: session.User,
			Msg:      session.errorMessage(tmcs_msg.ErrorCode_ReceiverUnknown, "Unknown receiver", fmt.Sprint(msg.Id)),
		})
		return
	}
	// Add receiver to contacts
	session.User.Contacts[msg.Receiver] = msg.Receiver
	ok := receiver.Post(&SessionMessage{
		Sender:   session.User,
		Receiver: receiver,
		Msg:      msg,
	})
	if !ok {
		session.User.Post(&SessionMessage{
			Sender:   nil,
			Receiver: session.User,
			Msg:      session.errorMessage(tmcs_msg.ErrorCode_MessageNotDelivered, "Message not delivered", fmt.Sprint(msg.Id)),
		})
		return
	}
}

func (session *Session) handshake(usersLib *cache.ObjectCache) bool {
	msgType, buffer, err := session.connection.ReadMessage()
	if err != nil {
		serverlog.Log("Faild to shake hands with {", session.ID, "}: ", err.Error())
		session.connection.Close()
		return false
	}
	if msgType == websocket.TextMessage {
		session.echo("Invalid message.")
		session.connection.Close()
		return false
	}
	clientHandshake := new(tmcs_msg.ClientHandShake)
	err = proto.Unmarshal(buffer, clientHandshake)
	if err != nil {
		session.echo("Invalid message.")
		session.connection.Close()
		return false
	}
	token := make([]byte, 16)
	rand.Read(token)
	buffer, _ = proto.Marshal(&tmcs_msg.ServerHandShake{
		ServerVersion: version.Version,
		Token:         hex.EncodeToString(token),
	})
	err = session.connection.WriteMessage(websocket.BinaryMessage, buffer)
	if err != nil {
		serverlog.Log("Cannot send handshake to session {", session.ID, "}: ", err.Error())
		session.connection.Close()
		return false
	}

	msgType, buffer, err = session.connection.ReadMessage()
	if err != nil {
		serverlog.Log("Faild to shake hands with {", session.ID, "}: ", err.Error())
		session.connection.Close()
		return false
	}
	if msgType == websocket.TextMessage {
		session.echo("Invalid message.")
		session.connection.Close()
		return false
	}
	signin := new(tmcs_msg.SignIn)
	err = proto.Unmarshal(buffer, signin)
	if err != nil {
		session.echo("Invalid message.")
		session.connection.Close()
		return false
	}

	val, ok := usersLib.Get(signin.FingerPrint)
	if !ok {
		session.echo(fmt.Sprint("Public key of '", signin.FingerPrint, "' not found."))
		session.connection.Close()
		return false
	}
	user := val.(*User)
	if !session.verify(user.Key.PublicKey, token, signin.Sign) {
		session.echo("Signature verification failed.")
		session.connection.Close()
		return false
	}
	session.User = user
	buffer, _ = proto.Marshal(&tmcs_msg.ServerHandShake{
		ServerVersion: version.Version,
		Token:         hex.EncodeToString(token),
	})
	err = session.connection.WriteMessage(websocket.BinaryMessage, buffer)
	if err != nil {
		serverlog.Log("Cannot send handshake to session {", session.ID, "}: ", err.Error())
		session.connection.Close()
		return false
	}
	serverlog.Log("A session connected with fingerprint {", user.Key.FingerPrint, "}.")
	return true
}

func NewSession(connection *websocket.Conn, bufferSize int) *Session {
	session := &Session{
		ID:         uuid.New().String(),
		User:       nil,
		Connected:  false,
		lastActive: time.Now(),
		connection: connection,
		bufferSize: bufferSize,
	}
	return session
}

func (session *Session) Start(keyLib *cache.ObjectCache) bool {
	if session.handshake(keyLib) {
		session.chClose = make(chan int, 2)
		session.Connected = true
		go session.recv()
		go session.send()
		return true
	}
	return false
}

func (session *Session) Join(origin *Session) {
	session.Close()
	session.connection = origin.connection
	session.chClose = make(chan int, 2)
	go session.recv()
	go session.send()
}

// Close the connection
func (session *Session) Close() {
	if session.Connected {
		session.chClose <- 1
		session.chClose <- 1
		if session.connection != nil {
			session.connection.Close()
			session.Connected = false
		}
		close(session.chClose)
	}
}

func (session *Session) Dispose() {
}
