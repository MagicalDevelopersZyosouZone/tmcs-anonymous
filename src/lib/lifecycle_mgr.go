package lib

import (
	"container/list"
	"errors"
	"time"
)

const LifeCycleMgrDefaultCheckInterval = 1000

type LifeCycleMgr struct {
	elements      *list.List
	chAdd         chan lifecycleRequest
	chExpire      chan interface{}
	chRemove      chan lifecycleRequest
	checkInterval int64
}

type LifeCycleElement struct {
	value      interface{}
	addTime    time.Time
	expireTIme time.Time
}

type lifecycleRequest struct {
	value interface{}
	// expire in miliseconds
	lifeTime  int64
	chElement chan *LifeCycleElement
}

type listType list.List

func (lifecycleElement *LifeCycleElement) Renew(milliSeconds int64) {
	lifecycleElement.expireTIme = time.Now().Add(time.Duration(milliSeconds) * time.Millisecond)
}

func (lifecycleElement *LifeCycleElement) Expired() bool {
	return lifecycleElement.expireTIme.Sub(time.Now()) < 0
}

func (lt *listType) Remove(cmpr func(el interface{}) bool) {
	var l *list.List
	l = (*list.List)(lt)
	for p := l.Front(); p != nil; p = p.Next() {
		if cmpr(p.Value) {
			l.Remove(p)
			return
		}
	}
}

func (lifecycle *LifeCycleMgr) addInternal(el interface{}, lifeTimeMiliSec int64) (*LifeCycleElement, error) {
	element := &LifeCycleElement{
		value:      el,
		addTime:    time.Now(),
		expireTIme: time.Now().Add(time.Duration(lifeTimeMiliSec) * time.Millisecond),
	}
	lifecycle.elements.PushBack(element)
	return element, nil
}

func (lifecycle *LifeCycleMgr) removeInternal(element interface{}) {
	for p := lifecycle.elements.Front(); p != nil; p = p.Next() {
		el := p.Value.(*LifeCycleElement)
		if el.value == element {
			lifecycle.elements.Remove(p)
		}
	}
}

func (lifecycle *LifeCycleMgr) cleanup() {
	now := time.Now()
	for p := lifecycle.elements.Front(); p != nil; {
		elmt := p.Value.(*LifeCycleElement)
		if elmt.expireTIme.Before(now) {
			next := p.Next()
			lifecycle.elements.Remove(p)
			p = next
			lifecycle.chExpire <- elmt.value
		} else {
			p = p.Next()
		}
	}
}

func NewLifeCycleMgr(chanBuffer int) *LifeCycleMgr {
	lifecycle := new(LifeCycleMgr)
	lifecycle.Init(chanBuffer)
	return lifecycle
}

func (lifecycle *LifeCycleMgr) Init(chanBuffer int) {
	lifecycle.chAdd = make(chan lifecycleRequest, chanBuffer)
	lifecycle.chExpire = make(chan interface{}, chanBuffer)
	lifecycle.chRemove = make(chan lifecycleRequest, chanBuffer)
	lifecycle.elements = list.New()
	lifecycle.checkInterval = LifeCycleMgrDefaultCheckInterval
}

func (lifecycle *LifeCycleMgr) Start() error {
	if lifecycle.chAdd == nil || lifecycle.chExpire == nil || lifecycle.elements == nil {
		return errors.New("Cannot start a lifecycle without init.")
	}
	go lifecycle.process()
	return nil
}

func (lifecycle *LifeCycleMgr) process() {
	for {
		select {
		case req, ok := <-lifecycle.chAdd:
			if !ok {
				goto ABORT
			}
			element, _ := lifecycle.addInternal(req.value, req.lifeTime)
			req.chElement <- element

		case req, ok := <-lifecycle.chRemove:
			if !ok {
				goto ABORT
			}
			lifecycle.removeInternal(req.value)
			req.chElement <- nil

		case <-time.After(time.Duration(lifecycle.checkInterval) * time.Millisecond):
			lifecycle.cleanup()
		}

	}
ABORT:
}

func (lifecycle *LifeCycleMgr) Add(element interface{}, lifeTimeMiliSec int64) (*LifeCycleElement, error) {
	req := lifecycleRequest{
		lifeTime:  lifeTimeMiliSec,
		value:     element,
		chElement: make(chan *LifeCycleElement, 1),
	}
	lifecycle.chAdd <- req
	el := <-req.chElement
	if element == nil {
		return nil, errors.New("Failed to add.")
	}
	return el, nil
}

func (lifecycle *LifeCycleMgr) Remove(element interface{}) {
	req := lifecycleRequest{
		value:     element,
		chElement: make(chan *LifeCycleElement),
	}
	lifecycle.chRemove <- req
	<-req.chElement
}
func (lifecycle *LifeCycleMgr) Expire() chan interface{} {
	return lifecycle.chExpire
}
