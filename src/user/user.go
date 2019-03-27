package user

type User struct {
	Name         string
	Contacts     map[string]*User
	ContactLimit int
	Key          *Key
	Renew        func()
	Session      *Session
}

func NewUser(name string, key *Key) *User {
	user := new(User)
	user.Name = name
	user.Contacts = make(map[string]*User)
	key.User = user
	user.Key = key
	user.ContactLimit = 1
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
