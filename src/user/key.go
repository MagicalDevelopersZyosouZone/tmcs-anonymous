package user

import (
	"bytes"
	"encoding/hex"
	"errors"
	"serverlog"
	"time"

	"golang.org/x/crypto/openpgp/armor"

	"golang.org/x/crypto/openpgp"
)

type Key struct {
	PublicKey   openpgp.EntityList
	FingerPrint string
	UploadTime  time.Time
	User        *User
	pubkey      []byte
}

func NewKey(pubkeyData []byte) (*Key, error) {
	key := new(Key)
	pubkey, err := openpgp.ReadKeyRing(bytes.NewBuffer(pubkeyData))
	if err != nil {
		return nil, err
	}
	key.PublicKey = pubkey
	key.pubkey = pubkeyData
	key.FingerPrint = hex.EncodeToString(pubkey[0].PrimaryKey.Fingerprint[0:])
	key.UploadTime = time.Now()
	return key, nil
}

func (key *Key) Serialize() []byte {
	buffer := bytes.NewBuffer(nil)
	key.PublicKey[0].Serialize(buffer)
	return buffer.Bytes()
}

func (key *Key) Armor() (string, error) {
	buffer := key.Serialize()
	armorBuffer := bytes.NewBuffer(nil)
	writer, err := armor.Encode(armorBuffer, "PGP PUBLIC KEY BLOCK", make(map[string]string))
	_, err = writer.Write(buffer)
	if err != nil {
		serverlog.Error("Failed to armor pubkey of", key.FingerPrint)
		return "", errors.New("Failed to armor pubkey.")
	}
	writer.Close()
	return string(armorBuffer.Bytes()), nil
}
