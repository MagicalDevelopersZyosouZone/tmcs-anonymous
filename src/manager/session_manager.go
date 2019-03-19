package manager

import (
	"lib"
	"user"
)

type SessionManager struct {
	sessionLifeCycle *lib.LifeCycleMgr
	sessions         map[string]*user.Session
	maxLifeTime      int64
}

func (sessionMgr *SessionManager) expireHandler() {
	for sessionI := range sessionMgr.sessionLifeCycle.Expire() {
		session := sessionI.(*user.Session)
		session.Close()
		session.Dispose()
		delete(sessionMgr.sessions, session.Key.FingerPrint)
	}
}

func NewSessionManager(chanBuffer int) *SessionManager {
	sessionMgr := new(SessionManager)
	sessionMgr.sessionLifeCycle = lib.NewLifeCycleMgr(chanBuffer)
	sessionMgr.sessionLifeCycle.Start()
	go sessionMgr.expireHandler()
	return sessionMgr
}

func (sessionMgr *SessionManager) GetSession(fingerprint string) *user.Session {
	session, ok := sessionMgr.sessions[fingerprint]
	if !ok {
		return nil
	}
	return session
}

func (sessionMgr *SessionManager) AddSession(session *user.Session) bool {
	_, ok := sessionMgr.sessions[session.Key.FingerPrint]
	if ok {
		return false
	}
	element, _ := sessionMgr.sessionLifeCycle.Add(session, sessionMgr.maxLifeTime)
	session.LifeCycleElement = element
	sessionMgr.sessions[session.Key.FingerPrint] = session
	return true
}

func (sessionMgr *SessionManager) RemoveSession(session *user.Session) {
	sessionMgr.sessionLifeCycle.Remove(session)
	delete(sessionMgr.sessions, session.Key.FingerPrint)
}
