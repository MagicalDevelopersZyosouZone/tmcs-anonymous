package user

type User struct {
	Name string
	Key  *Key
}

func NewUser(name string, keydata []byte, lifetime int64) (*User, error) {
	user := new(User)
	user.Name = name
	key, err := NewKey(keydata, lifetime)
	if err != nil {
		return nil, err
	}
	user.Key = key
	key.User = user
	return user, nil
}
