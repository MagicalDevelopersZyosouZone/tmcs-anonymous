package tmcs

import (
	"cache"
	"user"
)

type TMCSAnonymous struct {
	RegistedKeys *cache.ObjectCache
	Users        *cache.ObjectCache
	Server       *TMCSAnonymousServer
}

func NewTMCSAnonymous() *TMCSAnonymous {
	tmcs := new(TMCSAnonymous)
	tmcs.Server = NewTMCSAnonymousServer(tmcs, TMCSAnonymousServerOptions{
		Address:       "localhost:57321",
		MaxBufferSize: 8192,
	})
	tmcs.RegistedKeys = cache.NewObjectCache(100)
	tmcs.Users = cache.NewObjectCache(100)
	return tmcs
}

func (tmcs *TMCSAnonymous) Start() {
	tmcs.RegistedKeys.Start()
	tmcs.Users.Start()
	tmcs.Server.Start()
}

func (tmcs *TMCSAnonymous) GetUser(key string) *user.User {
	usr, ok := tmcs.Users.Get(key)
	if !ok {
		return nil
	}
	return usr.(*user.User)
}
