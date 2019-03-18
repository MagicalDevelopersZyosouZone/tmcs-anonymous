package tmcs

import (
	"manager"
	"user"
)

type TMCSAnonymous struct {
	KeyManager manager.KeyManager
}

func (tmcs *TMCSAnonymous) Register(user *user.User) {

}
