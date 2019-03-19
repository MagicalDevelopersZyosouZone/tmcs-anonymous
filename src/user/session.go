package user

import (
	"bytes"
	"encoding/hex"
	"fmt"
	"server_interface"
	"serverlog"
	"time"
	"tmcs_msg"

	"github.com/golang/protobuf/proto"
	"golang.org/x/crypto/openpgp"

	"github.com/gorilla/websocket"
)

type SessionMessage struct {
	Sender   *Session
	Receiver *Session
	Msg      *tmcs_msg.SignedMsg
}

type Session struct {
	Key        *Key
	Connected  bool
	ID         string
	sessionMgr *server_interface.ISessionManager
	lastActive time.Time
	connection *websocket.Conn
	chPost     chan *SessionMessage
	chRecv     chan *tmcs_msg.SignedMsg
}

func (session *Session) recv() {
	for {
		msgType, buffer, err := session.connection.ReadMessage()
		if err != nil {
			serverlog.Error("Failed to receive from <", session.Key.FingerPrint, ">: ", err.Error())
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
			session.Post(&SessionMessage{
				Sender:   nil,
				Receiver: session,
				Msg:      session.errorMessage(tmcs_msg.ErrorCode_InvalidMessage, "Invalid message.", fmt.Sprint(msg.Id)),
			})
			serverlog.Warn("Invalid message from <", session.Key.FingerPrint, ">.")
			continue
		}
		if !session.verifyMsg(msg) {
			session.Post(&SessionMessage{
				Sender:   nil,
				Receiver: session,
				Msg:      session.errorMessage(tmcs_msg.ErrorCode_VerifyError, "Signature verification fail.", fmt.Sprint(msg.Id)),
			})
			serverlog.Warn("Signature verify failed from <", session.Key.FingerPrint, ">.")
			continue
		}
		session.dispacth(msg)
	}
}

func (session *Session) send() {
	for msg := range session.chPost {
		if msg == nil {
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
		Receiver: session.Key.FingerPrint,
		Type:     tmcs_msg.SignedMsg_Error,
		Body:     buffer,
	}
}

func (session *Session) verifyMsg(msg *tmcs_msg.SignedMsg) bool {
	signer, err := openpgp.CheckDetachedSignature(session.Key.PublicKey, bytes.NewBuffer(msg.Body), bytes.NewBuffer(msg.Sign))
	if err != nil {
		return false
	}
	if hex.EncodeToString(signer.PrimaryKey.Fingerprint[0:]) != session.Key.FingerPrint {
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

func (session *Session) dispacth(msg *tmcs_msg.SignedMsg) {

}

func NewSession() *Session {

}

func (session *Session) Start() {

}

// Close the connection
func (session *Session) Close() {
	if session.connection != nil {
		session.connection.Close()
		session.Connected = false
	}
}

func (session *Session) Post(msg *SessionMessage) {
	session.chPost <- msg
}

// type SessionMessage struct {
// 	Sender   *Session
// 	Receiver *Session
// 	Msg      *tmcs_msg.SignedMsg
// 	MsgBody  *tmcs_msg.MsgPackage
// }

// type Session struct {
// 	Key        *Key
// 	Connected  bool
// 	sessionMgr *server_interface.ISessionManager
// 	lastActive time.Time
// 	connection *websocket.Conn
// 	chPost     chan *SessionMessage
// 	chRecv     chan *tmcs_msg.SignedMsg
// }

// func receipt(messages []*tmcs_msg.Message, state tmcs_msg.MsgReceipt_MsgState) []*tmcs_msg.MsgReceipt {
// 	receipts := make([]*tmcs_msg.MsgReceipt, len(messages))
// 	for i := 0; i < len(messages); i++ {
// 		receipts[i] = &tmcs_msg.MsgReceipt{
// 			MsgId: messages[i].MsgId,
// 			State: state,
// 		}
// 	}
// 	return receipts
// }

// // Receive msg from others for current session
// func (current *Session) recv() {
// 	for buffer := range current.chWrite {
// 		current.connection.WriteMessage(websocket.BinaryMessage, buffer)
// 	}
// }

// // Send messages to others
// func (session *Session) send() {
// 	for {
// 		msgType, msgBuffer, err := session.connection.ReadMessage()
// 		if err != nil {
// 			serverlog.Error("Failed to receive from <", session.Key.FingerPrint, ">: ", err.Error())
// 			session.Close()
// 			continue
// 		}
// 		if msgType == websocket.TextMessage {
// 			session.echo("Invalid message.")
// 			session.Close()
// 			return
// 		}
// 		msg := new(tmcs_msg.SignedMsg)
// 		err = proto.Unmarshal(msgBuffer, msg)
// 		if !session.verifyMsg(msg) {
// 			buffer, _ := proto.Marshal(errorMessage(int32(tmcs_msg.ErrorCode_VerifyError), "Verify failed.", msg.Hash))
// 			session.write(buffer)
// 			continue
// 		}
// 		session.dispatch(msg)
// 	}
// }

// func (session *Session) msgHandle() {
// 	select {
// 	case msg, ok := <-session.chPost:
// 		if !ok {
// 			return
// 		}

// 	case msg, ok := <-session.chRecv:
// 		if !ok {
// 			return
// 		}

// 	}
// }

// func (session *Session) write(buffer []byte) {
// 	session.chWrite <- buffer
// }

// func genServerReceipt(receipts []*tmcs_msg.MsgReceipt) *tmcs_msg.SignedMsg {
// 	pack := new(tmcs_msg.MsgPackage)
// 	pack.Receipts = receipts
// 	buffer, _ := proto.Marshal(pack)

// 	return &tmcs_msg.SignedMsg{
// 		FingerPrint: "",
// 		Sign:        nil,
// 		Message:     buffer,
// 	}
// }

// func wrapMessage(msg *tmcs_msg.SignedMsg) *tmcs_msg.ServerMsg {
// 	return &tmcs_msg.ServerMsg{
// 		Msg: &tmcs_msg.ServerMsg_Message{
// 			Message: msg,
// 		},
// 	}
// }

// func (session *Session) verifyMsg(msg *tmcs_msg.SignedMsg) bool {
// 	signer, err := openpgp.CheckDetachedSignature(session.Key.PublicKey, bytes.NewBuffer(msg.Message), bytes.NewBuffer(msg.Sign))
// 	if err != nil {
// 		return false
// 	}
// 	if hex.EncodeToString(signer.PrimaryKey.Fingerprint[0:]) != session.Key.FingerPrint {
// 		return false
// 	}
// 	return true
// }

// func (session *Session) dispatch(msg *tmcs_msg.SignedMsg) {

// }

// func NewSession(connection *websocket.Conn) (*Session, error) {
// 	session := &Session{
// 		Key:        nil,
// 		lastActive: time.Now(),
// 		connection: connection,
// 		chPost:     make(chan []byte),
// 	}
// 	return session, nil
// }

// func (current *Session) Join(session *Session) error {
// 	return nil
// }

// func (current *Session) Start(session *Session) error {
// 	return nil
// }

// func (current *Session) Post(msg *SessionMessage) error {
// 	buffer, err := proto.Marshal(wrapMessage(msg.Msg))
// 	if err != nil {
// 		if msg.Sender == nil {
// 			serverlog.Error("Failed to marshal message from server.")
// 			return err
// 		} else {
// 			msg.Sender.Post(&SessionMessage{
// 				Sender:   current,
// 				Receiver: msg.Sender,
// 				Msg:      genServerReceipt(receipt(msg.MsgBody.Messages, tmcs_msg.MsgReceipt_Lost)),
// 			})

// 		}
// 		return nil
// 	}
// 	current.write(buffer)
// }
