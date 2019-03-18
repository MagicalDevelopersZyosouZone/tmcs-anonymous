package tmcs

import (
	"key"
	"session"
)

type TMCSAnonymous struct {
	KeyManager key.KeyManager
}

func (tmcs *TMCSAnonymous) Register(user *session.User) {

}
