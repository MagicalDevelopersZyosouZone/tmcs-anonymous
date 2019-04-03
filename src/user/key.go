package user

import (
	"bytes"
	"encoding/hex"
	"time"

	"golang.org/x/crypto/openpgp"
)

type Key struct {
	PublicKey   openpgp.EntityList
	FingerPrint string
	UploadTime  time.Time
	LifeTime    int64
	User        *User
	pubkey      []byte
}

func NewKey(pubkeyData []byte, lifeTime int64) (*Key, error) {
	key := new(Key)
	pubkey, err := openpgp.ReadKeyRing(bytes.NewBuffer(pubkeyData))
	if err != nil {
		return nil, err
	}
	key.PublicKey = pubkey
	key.pubkey = pubkeyData
	key.FingerPrint = hex.EncodeToString(pubkey[0].PrimaryKey.Fingerprint[0:])
	key.UploadTime = time.Now()
	key.LifeTime = lifeTime
	return key, nil
}

func (key *Key) Serialize() []byte {
	buffer := bytes.NewBuffer(nil)
	key.PublicKey[0].Serialize(buffer)
	return buffer.Bytes()
}
