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

type LifeCycleMgrElement struct {
	value      interface{}
	addTime    time.Time
	expireTIme time.Time
}

type lifecycleRequest struct {
	value interface{}
	// expire in miliseconds
	lifeTime int64
	chErr    chan error
}

type listType list.List

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

func (lifecycle *LifeCycleMgr) addInternal(el interface{}, lifeTimeMiliSec int64) error {
	element := LifeCycleMgrElement{
		value:      el,
		addTime:    time.Now(),
		expireTIme: time.Now().Add(time.Duration(lifeTimeMiliSec) * time.Millisecond),
	}
	lifecycle.elements.PushBack(element)
	return nil
	/*
		for p := lifecycle.elements.Front(); p != nil; p = p.Next() {
			el := p.Value.(LifeCycleMgrElement)
			if element.expireTIme.Before(el.expireTIme) {
				lifecycle.elements.InsertBefore(element, p)
				return nil
			}
		}
		lifecycle.elements.PushBack(element)
		return nil*/
}

func (lifecycle *LifeCycleMgr) removeInternal(element interface{}) {
	for p := lifecycle.elements.Front(); p != nil; p = p.Next() {
		el := p.Value.(LifeCycleMgrElement)
		if el.value == element {
			lifecycle.elements.Remove(p)
		}
	}
}

func (lifecycle *LifeCycleMgr) cleanup() {
	now := time.Now()
	for p := lifecycle.elements.Front(); p != nil; {
		elmt := p.Value.(LifeCycleMgrElement)
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
			/*err :=*/ lifecycle.addInternal(req.value, req.lifeTime)
			//req.chErr <- err

		case req, ok := <-lifecycle.chRemove:
			if !ok {
				goto ABORT
			}
			lifecycle.removeInternal(req.value)
			req.chErr <- nil

		case <-time.After(time.Duration(lifecycle.checkInterval) * time.Millisecond):
			lifecycle.cleanup()
		}

	}
ABORT:
}

func (lifecycle *LifeCycleMgr) Add(element interface{}, lifeTimeMiliSec int64) error {
	req := lifecycleRequest{
		lifeTime: lifeTimeMiliSec,
		value:    element,
		//chErr:    make(chan error),
	}
	lifecycle.chAdd <- req
	//err := <-req.chErr
	return nil
}

func (lifecycle *LifeCycleMgr) Remove(element interface{}) {
	req := lifecycleRequest{
		value: element,
		chErr: make(chan error),
	}
	lifecycle.chRemove <- req
	<-req.chErr
}
func (lifecycle *LifeCycleMgr) Expire() chan interface{} {
	return lifecycle.chExpire
}
