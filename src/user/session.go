package user

import (
	"time"
	"tmcs_msg"

	"github.com/gorilla/websocket"
)

type Session struct {
	Key        *Key
	lastActive time.Time
	connection websocket.Conn
	chPost     chan *tmcs_msg.SignedMsg
}
