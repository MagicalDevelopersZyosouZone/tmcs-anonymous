package tmcs

import (
	"cache"
	tmcs_config "config"
	"os"
	"serverlog"
	"user"
)

const MaxChannelBuffer = 100

type TMCSAnonymous struct {
	RegistedKeys *cache.ObjectCache
	Users        *cache.ObjectCache
	Server       *TMCSAnonymousServer
}

func NewTMCSAnonymous(config *tmcs_config.TMCSConfig) *TMCSAnonymous {
	tmcs := new(TMCSAnonymous)
	server, err := NewTMCSAnonymousServer(tmcs, config)
	if err != nil {
		serverlog.Error(err.Error())
		os.Exit(1)
		return nil
	}
	tmcs.Server = server
	tmcs.RegistedKeys = cache.NewObjectCache(MaxChannelBuffer)
	tmcs.Users = cache.NewObjectCache(MaxChannelBuffer)
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
