package main

import (
	tmcs_config "config"
	"flag"
	"os"
	"serverlog"
	"tmcs"
)

func main() {
	config, err := tmcs_config.ReadConfig("./tmcs-config.json")
	if err != nil {
		serverlog.Error(err.Error())
		os.Exit(1)
	}

	addr := flag.String("addr", config.Address, "The address to setup http server.")
	tls := flag.Bool("tls", config.TLS, "Use TLS connection.")
	cert := flag.String("cert", config.Cert, "Path of certificate file used for TLS.")
	certKey := flag.String("cert-key", config.CertKey, "Path of certificate key file.")

	flag.Parse()

	config.Address = *addr
	config.TLS = *tls
	config.Cert = *cert
	config.CertKey = *certKey

	tmcs := tmcs.NewTMCSAnonymous(config)
	tmcs.Start()
}
