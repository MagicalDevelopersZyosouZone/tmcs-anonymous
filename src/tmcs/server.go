package tmcs

import (
	tmcs_config "config"
	"crypto/tls"
	"errors"
	"net/http"
	"regexp"
	"serverlog"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

const ChannelBufferSize = 100

type TMCSAnonymousServer struct {
	Active       bool
	Addr         string
	RPCHandler   *TMCSAnonymousRPCHandler
	tmcs         *TMCSAnonymous
	config       *tmcs_config.TMCSConfig
	upgrader     websocket.Upgrader
	router       *mux.Router
	server       *http.Server
	tlsConfig    *tls.Config
	sessionRegex *regexp.Regexp
	fs           http.Handler
	fsRouter     *mux.Router
	chClose      chan int
}

func (server *TMCSAnonymousServer) serverProc() {
	server.Active = true
	if server.tlsConfig != nil {
		err := server.server.ListenAndServeTLS("", "")
		server.Active = false
		if err != nil {
			serverlog.Error("Faild to setup http server: ", err.Error())
		}
	} else {
		err := server.server.ListenAndServe()
		server.Active = false
		if err != nil {
			serverlog.Error("Faild to setup http server: ", err.Error())
		}
	}
	server.chClose <- 1
}

func NewTMCSAnonymousServer(tmcs *TMCSAnonymous, config *tmcs_config.TMCSConfig) (*TMCSAnonymousServer, error) {
	server := new(TMCSAnonymousServer)
	server.config = config
	server.tmcs = tmcs
	server.upgrader = websocket.Upgrader{
		ReadBufferSize:  config.MaxBuffer,
		WriteBufferSize: config.MaxBuffer,
	}
	server.Addr = config.Address
	server.RPCHandler = &TMCSAnonymousRPCHandler{
		tmcs: tmcs,
	}
	if !config.TLS {
		return server, nil
	}
	cert, err := tls.LoadX509KeyPair(config.Cert, config.CertKey)
	if err != nil {
		return nil, errors.New("Failed to load certificate: " + err.Error())
	}
	server.tlsConfig = &tls.Config{
		Certificates: []tls.Certificate{cert},
		MinVersion:   tls.VersionTLS12,
		CipherSuites: []uint16{
			tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA,
			tls.TLS_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_RSA_WITH_AES_256_CBC_SHA,
		},
	}
	return server, nil
}

func (server *TMCSAnonymousServer) Start() error {
	//server.http = http.NewServeMux()
	server.router = mux.NewRouter()
	server.server = &http.Server{
		Addr:      server.Addr,
		Handler:   server.router,
		TLSConfig: server.tlsConfig,
	}
	server.chClose = make(chan int)
	server.fs = http.FileServer(http.Dir("./www/dist"))
	server.sessionRegex = regexp.MustCompile(`^.*session/[0-9a-fA-F]+(/.*)?$`)
	server.router.HandleFunc("/ws", server.handleWebSocket())
	server.router.HandleFunc("/key/register", server.handleRegister()).Methods("POST")
	server.router.HandleFunc("/chat/{sessionId}", server.handleJoin()).Methods("GET")
	server.router.HandleFunc("/session/{fingerprint}/key/register", server.handleSessionRegister).Methods("POST")
	server.router.HandleFunc("/session/{fingerprint}/key", server.keyHandler).Methods("GET")
	server.router.HandleFunc("/session/{fingerprint}/ws", server.handleWebSocket())
	server.router.PathPrefix("/session/{fingerprint}").HandlerFunc(server.handleSessionJoin())
	server.router.PathPrefix("/").Handler(http.FileServer(http.Dir("./www/dist")))
	go server.serverProc()
	if server.config.TLS {
		serverlog.Log("Server listened on", server.Addr, "with TLS")
	} else {
		serverlog.Log("Server listened on", server.Addr)
	}
	<-server.chClose
	serverlog.Log("Server closed.")
	return nil
}

func (server *TMCSAnonymousServer) Stop() error {
	err := server.server.Shutdown(nil)
	if err != nil {
		return err
	}
	server.Active = false
	return nil
}
