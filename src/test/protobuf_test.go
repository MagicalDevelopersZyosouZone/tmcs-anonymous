package test

import (
	"encoding/base64"
	//"fmt"
	"github.com/golang/protobuf/proto"
	"testing"
	"tmcs_msg"
)

func TestMarshal(t *testing.T) {
	msg := &tmcs_msg.NewSession{
		Group:    false,
		LifeTime: 3000,
		Pubkey:   "PUBLIC KEY FROM GO!",
	}
	buffer, _ := proto.Marshal(msg)
	msgT := new(tmcs_msg.NewSession)
	proto.Unmarshal(buffer, msgT)
	if msg.Pubkey != msgT.Pubkey {
		t.Error("Serialize failed.")
	}

	//fmt.Println(base64.StdEncoding.EncodeToString(buffer))
}

func TestFromJs(t *testing.T) {
	dataStr := "CgpQVUJMSUMgS0VZELDqAQ=="
	dataBin, _ := base64.StdEncoding.DecodeString(dataStr)
	msg := new(tmcs_msg.NewSession)
	proto.Unmarshal(dataBin, msg)

	if msg.Pubkey != "PUBLIC KEY" {
		t.Error("Deserialize failed.")
	}
}
