package user

import (
	"bytes"
	"serverlog"
	"time"
	"tmcs_msg"

	"github.com/golang/protobuf/proto"
	"github.com/gorilla/websocket"
)

type SessionMessage struct {
	Sender   *Session
	Receiver *Session
	Msg      *tmcs_msg.SignedMsg
	MsgBody  *tmcs_msg.MsgPackage
}

type Session struct {
	Key        *Key
	Connected  bool
	lastActive time.Time
	connection *websocket.Conn
	chPost     chan *SessionMessage
}

func receipt(messages []*tmcs_msg.Message, state tmcs_msg.MsgReceipt_MsgState) []*tmcs_msg.MsgReceipt {
	receipts := make([]*tmcs_msg.MsgReceipt, len(messages))
	for i := 0; i < len(messages); i++ {
		receipts[i] = &tmcs_msg.MsgReceipt{
			MsgId: messages[i].MsgId,
			State: state,
		}
	}
	return receipts
}

// Receive msg from others for current session
func (current *Session) recv() {
	for msg := range current.chPost {
		buffer, err := proto.Marshal(msg.Msg)
		if err != nil {
			if msg.Sender == nil {
				serverlog.Error("Failed to marshal message from server.")
			} else {
				msg.Sender.Post(genServerReceipt(msg.Sender, receipt(msg.MsgBody.Messages, tmcs_msg.MsgReceipt_Lost)))
			}
			return
		}
		current.connection.WriteMessage(websocket.BinaryMessage, buffer)
	}
}

// Send messages to others
func (session *Session) send() {
	for {
		msgType, msgBuffer, err := session.connection.ReadMessage()
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
		err = proto.Unmarshal(msgBuffer, msg)
		session.dispatch(msg)
	}
}

// Write text message to connection
func (session *Session) echo(text string) {
	if session.connection != nil {
		session.connection.WriteMessage(websocket.TextMessage, bytes.NewBufferString(text).Bytes())
	}
}

func genServerReceipt(receiver *Session, receipts []*tmcs_msg.MsgReceipt) *tmcs_msg.SignedMsg {
	pack := new(tmcs_msg.MsgPackage)
	pack.Receipts = receipts
	buffer, _ := proto.Marshal(pack)

	return &tmcs_msg.SignedMsg{
		FingerPrint: "",
		Sign:        "",
		Message:     buffer,
	}
}

func verifyMsg(msg *tmcs_msg.SignedMsg) {
	manager.
}

func (session *Session) dispatch(msg *tmcs_msg.SignedMsg) {

}

func NewSession(connection *websocket.Conn) (*Session, error) {
	session := &Session{
		Key:        nil,
		lastActive: time.Now(),
		connection: connection,
		chPost:     make(chan *SessionMessage),
	}
	return session, nil
}

func (current *Session) Join(session *Session) error {
	return nil
}

func (current *Session) Start(session *Session) error {
	return nil
}

func (current *Session) Post(msg *tmcs_msg.SignedMsg) {

}

// Close the connection
func (session *Session) Close() {
	if session.connection != nil {
		session.connection.Close()
		session.Connected = false
	}
}
