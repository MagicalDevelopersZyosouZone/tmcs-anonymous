package test

import (
	"fmt"
	"regexp"
	"testing"
)

func TestTest(t *testing.T) {
	reg := regexp.MustCompile(`^.*session/[0-9a-fA-F]+(.*)$`)
	match := reg.FindSubmatch([]byte("session/1a2b3c/boy/next/door"))
	for i := 0; i < len(match); i++ {
		fmt.Println(string(match[i]))
	}
	t.Error()
}
