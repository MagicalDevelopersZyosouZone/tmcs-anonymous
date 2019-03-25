package lib

import (
	"container/list"
	"errors"
	"time"
)

const ObjectCacheDefaultCheckInterval = 1000

type ObjectCache struct {
	ExpireHandler func(*CachedElement)
	elements      *list.List
	elementsMap   map[string]*CachedElement
	chSet         chan CacheRequest
	chRemove      chan CacheRequest
	checkInterval int64
}

type CachedElement struct {
	key        string
	value      interface{}
	updateTime time.Time
	expireTIme time.Time
}

type CacheRequest struct {
	key      string
	value    interface{}
	lifeTime int64
}

func (objCache *ObjectCache) setInternal(key string, value interface{}, lifeTimeMiliSec int64) (*CachedElement, error) {
	if element, ok := objCache.elementsMap[key]; ok {
		element.value = value
		element.expireTIme = time.Now().Add(time.Duration(lifeTimeMiliSec) * time.Millisecond)
		return element, nil
	}
	element := &CachedElement{
		key:        key,
		value:      value,
		updateTime: time.Now(),
		expireTIme: time.Now().Add(time.Duration(lifeTimeMiliSec) * time.Millisecond),
	}
	objCache.elements.PushBack(element)
	objCache.elementsMap[key] = element
	return element, nil
}

func (objCache *ObjectCache) removeInternal(key string) {
	if _, ok := objCache.elementsMap[key]; ok {
		for p := objCache.elements.Front(); p != nil; p = p.Next() {
			el := p.Value.(*CachedElement)
			if el.key == key {
				objCache.elements.Remove(p)
				break
			}
		}
		delete(objCache.elementsMap, key)
	}
}

func (objCache *ObjectCache) cleanup() {
	now := time.Now()
	for p := objCache.elements.Front(); p != nil; {
		elmt := p.Value.(*CachedElement)
		if elmt.expireTIme.Before(now) {
			next := p.Next()
			if objCache.ExpireHandler != nil {
				objCache.ExpireHandler(elmt)
			}
			objCache.elements.Remove(p)
			delete(objCache.elementsMap, elmt.key)
			p = next
		} else {
			p = p.Next()
		}
	}
}

func NewObjectCache(chanBuffer int) *ObjectCache {
	objCache := new(ObjectCache)
	objCache.Init(chanBuffer)
	return objCache
}

func (objCache *ObjectCache) Init(chanBuffer int) {
	objCache.chSet = make(chan CacheRequest, chanBuffer)
	objCache.chRemove = make(chan CacheRequest, chanBuffer)
	objCache.elements = list.New()
	objCache.elementsMap = make(map[string]*CachedElement)
	objCache.checkInterval = ObjectCacheDefaultCheckInterval
}

func (objCache *ObjectCache) Start() error {
	if objCache.chSet == nil || objCache.elements == nil {
		return errors.New("Cannot start a objCache without init.")
	}
	go objCache.process()
	return nil
}

func (objCache *ObjectCache) process() {
	for {
		select {
		case req, ok := <-objCache.chSet:
			if !ok {
				goto ABORT
			}
			objCache.setInternal(req.key, req.value, req.lifeTime)
		case req, ok := <-objCache.chRemove:
			if !ok {
				goto ABORT
			}
			objCache.removeInternal(req.key)
		case <-time.After(time.Duration(objCache.checkInterval) * time.Millisecond):
			objCache.cleanup()
		}

	}
ABORT:
}

func (cache *ObjectCache) Renew(key string, milliSeconds int64) bool {
	obj, ok := cache.Get(key)
	if !ok {
		return false
	}
	cache.Set(key, obj, milliSeconds)
	return true
}

func (cache *ObjectCache) Set(key string, element interface{}, expireMilliSec int64) {
	req := CacheRequest{
		key:      key,
		lifeTime: expireMilliSec,
		value:    element,
	}
	cache.chSet <- req
}

func (cache *ObjectCache) Get(key string) (interface{}, bool) {
	element, ok := cache.elementsMap[key]
	if !ok {
		return nil, false
	}
	return element, true
}

func (cache *ObjectCache) Has(key string) bool {
	_, ok := cache.elementsMap[key]
	return ok
}

func (cache *ObjectCache) Delete(key string) (interface{}, bool) {
	obj, ok := cache.elementsMap[key]
	if !ok {
		return nil, false
	}
	req := CacheRequest{
		key: key,
	}
	cache.chRemove <- req
	return obj, true
}
