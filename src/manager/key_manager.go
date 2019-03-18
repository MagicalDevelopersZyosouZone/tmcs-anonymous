package manager

import (
	// "golang.org/x/crypto/openpgp"
	"container/list"
	"errors"
	"lib"
	"sync"
	"user"
)

type KeyManager struct {
	muKeys       sync.Mutex
	keyLifeCycle *lib.LifeCycleMgr
	keyList      *list.List
	mapedKeys    map[string]*user.Key
	options      KeyManagerOption
	chAddKey     chan request
	chGetKey     chan keyQuery
	chRmKey      chan string
}

type keyQuery struct {
	fingerprint string
	chResult    chan *user.Key
}

type request struct {
	obj   interface{}
	chErr chan error
}

type KeyManagerOption struct {
	ExpireSeconds int
	ChannelBuffer int
	CheckExpire   int
}

func (keymgr *KeyManager) getKeyInternal(fingerprint string) *user.Key {
	if key, ok := keymgr.mapedKeys[fingerprint]; ok {
		return key
	}
	return nil
}

func (keymgr *KeyManager) addKeyInternal(key *user.Key) error {
	if _, ok := keymgr.mapedKeys[key.FingerPrint]; ok {
		return errors.New("Public key existed.")
	}
	keymgr.keyLifeCycle.Add(key, key.LifeTime)
	keymgr.mapedKeys[key.FingerPrint] = key
	return nil
}

func (keymgr *KeyManager) rmKeyInternal(fingerprint string) {
	if key, ok := keymgr.mapedKeys[fingerprint]; ok {
		keymgr.keyLifeCycle.Remove(key)
		delete(keymgr.mapedKeys, fingerprint)
	}
}

func (keymgr *KeyManager) manageKeys() {
	for {
		select {

		case expired := <-keymgr.keyLifeCycle.Expire():
			key := expired.(*user.Key)
			delete(keymgr.mapedKeys, key.FingerPrint)

		case removeKey, ok := <-keymgr.chRmKey:
			if !ok {
				goto STOP_MGR
			}
			keymgr.rmKeyInternal(removeKey)

		case getRequest, ok := <-keymgr.chGetKey:
			if !ok {
				goto STOP_MGR
			}
			key := keymgr.getKeyInternal(getRequest.fingerprint)
			getRequest.chResult <- key

		case addRequest, ok := <-keymgr.chAddKey:
			if !ok {
				goto STOP_MGR
			}
			key := addRequest.obj.(*user.Key)
			err := keymgr.addKeyInternal(key)
			addRequest.chErr <- err

		}
	}
STOP_MGR:
}

func CreateKeyManager(option KeyManagerOption) *KeyManager {
	keymgr := new(KeyManager)
	if option.ChannelBuffer == 0 {
		option.ChannelBuffer = 100
	}
	if option.CheckExpire == 0 {
		option.CheckExpire = 1
	}
	if option.ExpireSeconds == 0 {
		option.ExpireSeconds = 300
	}
	keymgr.options = option
	keymgr.mapedKeys = make(map[string]*user.Key)
	keymgr.keyList = list.New()
	keymgr.chAddKey = make(chan request, option.ChannelBuffer)
	keymgr.chGetKey = make(chan keyQuery, option.ChannelBuffer)
	keymgr.chRmKey = make(chan string, option.ChannelBuffer)
	return keymgr
}

func (keymgr *KeyManager) AddKey(key *user.Key) error {
	req := request{chErr: make(chan error)}
	req.obj = key
	keymgr.chAddKey <- req
	err := <-req.chErr
	return err
}

func (keymgr *KeyManager) GetKey(fingerprint string) *user.Key {
	ch := make(chan *user.Key)
	req := keyQuery{fingerprint: fingerprint, chResult: ch}
	keymgr.chGetKey <- req
	return <-req.chResult
}

func (keymgr *KeyManager) RemoveKey(fingerprint string) {
	keymgr.chRmKey <- fingerprint
}
