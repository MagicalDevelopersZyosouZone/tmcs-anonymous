package config

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"os"
)

type TMCSConfig struct {
	Address          string
	TLS              bool
	Cert             string
	CertKey          string
	KeyPassPhase     string
	MaxBuffer        int
	InviteLinkExpire int
	SessionExpire    int
}

func ReadConfig(file string) (*TMCSConfig, error) {
	config := new(TMCSConfig)
	f, err := os.Open(file)
	if err != nil {
		return nil, errors.New("Cannot read config file '" + file + "': " + err.Error())
	}
	buf, err := ioutil.ReadAll(f)
	if err != nil {
		return nil, errors.New("Cannot read config file '" + file + "'" + err.Error())
	}
	err = json.Unmarshal(buf, config)
	if err != nil {
		return nil, errors.New("Cannot read config file '" + file + "'" + err.Error())
	}
	return config, nil
}
