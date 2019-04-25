package main

import (
	tmcs_config "config"
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
	tmcs := tmcs.NewTMCSAnonymous(config)
	tmcs.Start()
}
