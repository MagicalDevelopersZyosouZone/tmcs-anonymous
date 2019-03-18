package serverlog

import (
	"testing"
)

func Test(t *testing.T) {
	Log("A log.")
	Warn("Warning!")
	Error("Error!")
	t.Error()
}
