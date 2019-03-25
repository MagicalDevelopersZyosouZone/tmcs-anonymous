package tmcs

import (
	"lib"
)

type TMCSAnonymous struct {
	RegistedKeys *lib.ObjectCache
	KeysLib      *lib.ObjectCache
	SessionsLib  *lib.ObjectCache
	Server       *TMCSAnonymousServer
}

func NewTMCSAnonymous() *TMCSAnonymous {
	tmcs := new(TMCSAnonymous)
	tmcs.Server = NewTMCSAnonymousServer(tmcs, TMCSAnonymousServerOptions{
		Address:       "localhost:5325",
		MaxBufferSize: 8192,
	})
	tmcs.RegistedKeys = lib.NewObjectCache(100)
	tmcs.KeysLib = lib.NewObjectCache(100)
	tmcs.SessionsLib = lib.NewObjectCache(100)
	return tmcs
}

func (tmcs *TMCSAnonymous) Start() {
	tmcs.RegistedKeys.Start()
	tmcs.KeysLib.Start()
	tmcs.SessionsLib.Start()
	tmcs.Server.Start()
}
