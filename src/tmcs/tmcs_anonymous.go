package tmcs

import (
	"manager"
)

type TMCSAnonymous struct {
	RegistedKeyManager *manager.KeyManager
	KeyLib             *manager.KeyManager
	SessionManager     *manager.SessionManager
	Server             *TMCSAnonymousServer
}

func NewTMCSAnonymous() *TMCSAnonymous {
	tmcs := new(TMCSAnonymous)
	tmcs.Server = NewTMCSAnonymousServer(tmcs, TMCSAnonymousServerOptions{
		Address:       "localhost:5325",
		MaxBufferSize: 8192,
	})
	tmcs.RegistedKeyManager = manager.CreateKeyManager(manager.KeyManagerOption{
		ChannelBuffer:   100,
		DefaultLifeTime: 300,
		CheckInterval:   1,
	})
	tmcs.KeyLib = manager.CreateKeyManager(manager.KeyManagerOption{
		ChannelBuffer:   100,
		DefaultLifeTime: 1800,
		CheckInterval:   1,
	})
	tmcs.SessionManager = manager.NewSessionManager(100)
	return tmcs
}

func (tmcs *TMCSAnonymous) Start() {
	tmcs.Server.Start()
}
