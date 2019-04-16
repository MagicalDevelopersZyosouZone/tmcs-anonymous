package user

type iTMCSAnonymous interface {
	GetUser(key string) *User
}

type User struct {
	Name         string
	Contacts     map[string]string
	BlackList    map[string]string
	ContactLimit int
	Key          *Key
	Renew        func()
	Session      *Session
	tmcs         iTMCSAnonymous
	chPost       chan *SessionMessage
}

func NewUser(name string, key *Key, tmcs iTMCSAnonymous) *User {
	user := new(User)
	user.Name = name
	user.Contacts = make(map[string]string)
	user.BlackList = make(map[string]string)
	key.User = user
	user.Key = key
	user.ContactLimit = 100
	user.chPost = make(chan *SessionMessage, 100)
	user.tmcs = tmcs

	return user
}

func (user *User) AddContact(contact *User) bool {
	if len(user.Contacts) >= user.ContactLimit {
		return false
	}
	user.Contacts[contact.Key.FingerPrint] = contact.Key.FingerPrint
	return true
}

func (user *User) GetContect(fingerprint string) *User {
	key, ok := user.Contacts[fingerprint]
	if !ok {
		return nil
	}
	contact := user.tmcs.GetUser(key)
	return contact
}

func (user *User) Post(msg *SessionMessage) bool {
	select {
	case user.chPost <- msg:
		return true
	default:
		return false
	}
}

func (user *User) CheckContact(key string) bool {
	_, ok := user.BlackList[key]
	if ok {
		return false
	}
	usr := user.tmcs.GetUser(key)
	if usr != nil {
		return true
	}
	return false
}
