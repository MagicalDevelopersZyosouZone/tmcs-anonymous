package tmcs

import (
	"manager"
	"user"
)

type TMCSAnonymous struct {
	RegistedKeyManager *manager.KeyManager
	KeyLib             *manager.KeyManager
	SessionManager     *manager.SessionManager
}

func (tmcs *TMCSAnonymous) Register(user *user.User) {

}
