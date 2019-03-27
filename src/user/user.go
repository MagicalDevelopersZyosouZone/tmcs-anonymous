package user

type User struct {
	Name    string
	Contacs map[string]*User
	Key     *Key
	Renew   func()
	Session *Session
}

func NewUser(name string, key *Key) *User {
	user := new(User)
	user.Name = name
	/*
		key, err := NewKey(keydata, lifetime)
		if err != nil {
			return nil, err
		}
		user.Key = key*/
	key.User = user
	user.Key = key
	return user
}
