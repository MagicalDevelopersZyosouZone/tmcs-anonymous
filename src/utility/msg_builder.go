package utility

import (
	"user"
	"tmcs_msg"
	"github.com/golang/protobuf/proto"
)

func GenServerMsg(receiver *user.Session, msg proto.Message) *tmcs_msg.SignedMsg {
	buffer, err:=proto.Marshal(msg);
	return &tmcs_msg.SignedMsg{
		FingerPrint: receiver.Key.FingerPrint,
		Sign: "",
		Type: tmcs_msg.SignedMsg_ServerMessage,
		Message: buffer
	}
}

