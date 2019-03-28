package user

type User struct {
	Name         string
	Contacts     map[string]*User
	ContactLimit int
	Key          *Key
	Renew        func()
	Session      *Session
	chPost       chan *SessionMessage
}

func NewUser(name string, key *Key) *User {
	user := new(User)
	user.Name = name
	user.Contacts = make(map[string]*User)
	key.User = user
	user.Key = key
	user.ContactLimit = 1
	user.chPost = make(chan *SessionMessage, 100)
	return user
}

func (user *User) AddContact(contact *User) bool {
	if len(user.Contacts) >= user.ContactLimit {
		return false
	}
	user.Contacts[contact.Key.FingerPrint] = contact
	return true
}

func (user *User) GetContect(fingerprint string) *User {
	contact, ok := user.Contacts[fingerprint]
	if !ok {
		return nil
	}
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
