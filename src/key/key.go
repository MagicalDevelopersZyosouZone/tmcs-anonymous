package key

import (
	"time"
)

type SessionKey struct {
	PublicKey     []byte
	FingerPrint   string
	GeneratedTime time.Time
	LifeTime      int64
}
