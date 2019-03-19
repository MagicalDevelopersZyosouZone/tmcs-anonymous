package server_interface

import (
	"tmcs_msg"
)

type IKey interface {
}

type IKeyManager interface {
	GetKey(fingerprint string) *IKey
	AddKey(key *IKey) error
	RemoveKey(fingerprint string)
}

type ISession interface {
	Join(session *ISession) error
	Start() error
	Post(msg *tmcs_msg.SignedMsg)
	Close()
}

type ISessionManager interface {
	GetSession(fingerprint string) (*ISession, error)
	Add(session *ISession) error
	Remove(fingerprint string) error
}
