package test

import (
	"log"
	"net/http"
	"tmcs_msg"

	"github.com/gorilla/mux"
)

type tmcsRPC struct {
}

func (tmcs *tmcsRPC) RPCRequest(msg *tmcs_msg.SignedMsg) *tmcs_msg.RPCResponse {
	return &tmcs_msg.RPCResponse{
		ErrorCode: 0,
	}
}
func HTTP2() {
	router := mux.NewRouter()
	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello World!\n"))
	})
	server := &http.Server{
		Addr:    "localhost:6550",
		Handler: router,
	}
	//rpc := grpc.NewServer()
	err := server.ListenAndServeTLS("../cert/test.crt", "../cert/test.key")
	log.Fatal(err)
}
