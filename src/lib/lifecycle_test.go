package lib

import (
	"fmt"
	"math/rand"
	"testing"
	"time"
)

func testInserItem(t int64, lifecycle *LifeCycleMgr) {
	time.Sleep(time.Duration(t) * time.Millisecond)
	expire := int64(rand.Intn(100) + 300)
	lifecycle.Add(time.Now().Add(time.Duration(expire)*time.Millisecond), expire)

}

func TestLifeCycle(t *testing.T) {
	const N = 10000
	lifecycle := NewLifeCycleMgr(100)
	lifecycle.Start()
	for i := 0; i < N; i++ {
		go testInserItem(rand.Int63n(200), lifecycle)
	}
	fmt.Print("All start")
	maxDelay := time.Duration(0)
	for i := 0; i < N; i++ {
		expired := <-lifecycle.Expire()
		ms := time.Now().Sub(expired.(time.Time)).Round(time.Millisecond)
		if ms > maxDelay {
			maxDelay = ms
		}
		if ms < 0 {
			t.Error("Not Expired.")
		}
	}
	fmt.Println("Max Deley: ", maxDelay)
}
