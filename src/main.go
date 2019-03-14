package main

import (
	"fmt"
	//"golang.org/x/crypto/openpgp"
	"key"
	"time"
)

func f(ch chan int64) {
	ch <- time.Now().UnixNano()

}

func main() {
	ch := make(chan int64)
	for i := 0; i < 10; i++ {
		go f(ch)
	}
	for i := 0; i < 10; i++ {
		fmt.Println(<-ch)
	}
	key.Keeeey()
}
