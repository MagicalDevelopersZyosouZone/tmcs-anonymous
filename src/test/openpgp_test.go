package test

import (
	"bytes"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"github.com/golang/protobuf/proto"
	"golang.org/x/crypto/openpgp"
	"golang.org/x/crypto/openpgp/armor"
	"strings"
	"testing"
	"tmcs_msg"
)

func TestOpenPGP(t *testing.T) {
	prvkey, err := openpgp.ReadArmoredKeyRing(strings.NewReader(testPrivateKey))
	if err != nil {
		t.Error(err.Error())
	}
	pubkey, err := openpgp.ReadArmoredKeyRing(strings.NewReader(testPublicKey))
	if err != nil {
		t.Error(err.Error())
	}
	out := new(bytes.Buffer)
	pubkey[0].Serialize(out)

	fmt.Println(prvkey)
	fmt.Println(pubkey)
	t.Error()
}

func TestSign(t *testing.T) {
	pubkey, _ := openpgp.ReadArmoredKeyRing(strings.NewReader(testPublicKey))
	sign, _ := base64.StdEncoding.DecodeString(`wsBcBAABCAAGBQJciPCtAAoJEL6mTlDBaNP4GrkH/ApPy9c3OYLqBIwoLVRk
q0TmY936zwkXsUmSddFyHYCqbZpBXJxO2IZ9nWrW1A6vAKz4E0nh8DyTXCB/
fP2XKmiZfRKiKJMJSqZ6RzUfV4gsiNGrs9663sNSy5Pt0GXojtLn3CNG+Zn0
Eq7bfYpRan+Mq3IQdpkthLoa4UAPINYVV6e7FHcYt826TdQz39vk0bXhcuPb
KwsuHxT55uygiybCH5OuHDMYXQYUdI/kveY2TdYXmVUv+eoWISIRDlnf159/
+eofc5Y/qAulecUD0yJVI35LWOmohlUecRukgvKXo/Ebny/s5xcHR9cMGOkE
bc/pfvtx8YH+PAb+q9Y5IV4=`)

	buf := bytes.NewBuffer(nil)
	w, _ := armor.Encode(buf, "PGP SIGNATURE", make(map[string]string))
	w.Write(sign)
	w.Close()
	fmt.Println(string(buf.Bytes()))
	data := bytes.NewBuffer([]byte{1, 1, 4, 5, 1, 4, 1, 9, 1, 9})
	//signer, err := openpgp.CheckDetachedSignature(pubkey, data, bytes.NewBuffer(sign))

	//block, _ := armor.Decode(strings.NewReader(testSign))
	signer, err := openpgp.CheckDetachedSignature(pubkey, data, bytes.NewBuffer(sign))
	if err != nil {
		t.Error(err.Error())
	}
	fmt.Println(hex.EncodeToString(signer.PrimaryKey.Fingerprint[0:]))
	if signer.PrimaryKey.KeyId != pubkey[0].PrimaryKey.KeyId {
		t.Error("Verify failed")
	}
}

func TestProtobufAndOpenPGP(t *testing.T) {
	const msgB64 = `ChIKClBVQkxJQyBLRVkQsOoBGAESKDBlYzkzNDgyN2E3ZGU4NDIxYjg1ZDZj
YWJlYTY0ZTUwYzE2OGQzZjgakAQtLS0tLUJFR0lOIFBHUCBTSUdOQVRVUkUt
LS0tLQ0KVmVyc2lvbjogT3BlblBHUC5qcyB2NC40LjEwDQpDb21tZW50OiBo
dHRwczovL29wZW5wZ3Bqcy5vcmcNCg0Kd3NCY0JBQUJDQUFHQlFKY2lPOHdB
QW9KRUw2bVRsREJhTlA0bU9zSC9qZmNBdzI1b2tES0UwcHBGZmdzDQo0aXUz
VTlYRE96Nk4rY3B2aVlva2t5RHorcjc3N29FaVhKMU5qSHdZQjRYbWZHOFJX
cVZzby9HN0V4VlcNCjQrQkpIbjdHQ2cvMG1IVWZnanhnNkpBdmY4ZHQvQ1M4
cmRiMXo2Qm1tcHM5MmVpNjlmMXBjbEdnM29CdA0Kc2k0M2QvRXMrWUU0WU5v
N3pqazJRUjViQjZ4aURHdHpRMnh6QVliNmZIRFY5T24yejZqUzkzc0FwS3BC
DQo0REFRL3p0ZjlwZThKMVlVaE5TTWV0S0FpbHRRSUVKdFBOUCsveDY3dnFr
S3NmQlVoUHh4ZDEzc2ZxVmcNCkFSc1FBemVLalRmR3IyVmd0b1VuRFdVSkVq
TU9OUGZtWWpkVVN5cUx2K2JHQlNudmRTYXlvSXJscUY3Mw0KMTlmbmVpbkFG
dU1FLzFQLzgzU2Era1U9DQo9clkxdw0KLS0tLS1FTkQgUEdQIFNJR05BVFVS
RS0tLS0tDQo=`
	pubkey, _ := openpgp.ReadArmoredKeyRing(strings.NewReader(testPublicKey))
	buf, _ := base64.StdEncoding.DecodeString(msgB64)
	signedMsg := new(tmcs_msg.SignedMsg)
	err := proto.Unmarshal(buf, signedMsg)
	if err != nil {
		t.Error(err.Error())
	}

	signBlock, _ := armor.Decode(strings.NewReader(signedMsg.Sign))
	signer, err := openpgp.CheckDetachedSignature(pubkey, bytes.NewBuffer(signedMsg.Message), signBlock.Body)
	if err != nil {
		t.Error(err.Error())
	}
	fmt.Println(hex.EncodeToString(signer.PrimaryKey.Fingerprint[0:]))
	fmt.Println(signedMsg.FingerPrint)
	if hex.EncodeToString(signer.PrimaryKey.Fingerprint[0:]) != signedMsg.FingerPrint {
		t.Error("Verify failed.")
	}

	msg := new(tmcs_msg.JoinSession)
	proto.Unmarshal(signedMsg.Message, msg)
	if msg.Pubkey != "PUBLIC KEY" {
		t.Error("Unmashal failed.")
	}
}
