package tmcs

import (
	"manager"
)

type TMCSAnonymous struct {
	RegistedKeyManager *manager.KeyManager
	KeyLib             *manager.KeyManager
	SessionManager     *manager.SessionManager
}
