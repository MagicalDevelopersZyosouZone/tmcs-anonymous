package serverlog

import (
	"fmt"
	"os"
	"time"
)

type ServerLog struct {
	logFile string
}

var serverLog *ServerLog = &ServerLog{
	logFile: "",
}

func SetLogFile(path string) {
	serverLog.logFile = path
}

func msgCat(msg ...interface{}) string {
	text := ""
	for i := 0; i < len(msg); i++ {
		text += fmt.Sprint(msg[i])
	}
	return text
}

func Log(msg ...interface{}) {
	fmt.Print("[", time.Now().Format("2006-01-02 15:04:05"), "][Log]")
	fmt.Println(msg...)
	if serverLog.logFile != "" {
		f, err := os.Open(serverLog.logFile)
		defer f.Close()
		if err != nil {
			return
		}
		fmt.Fprint(f, "[", time.Now().Format("2006-01-02 15:04:05"), "][Log]")
		fmt.Fprintln(f, msgCat(msg...))
	}
}

func Warn(msg ...interface{}) {
	fmt.Print("[", time.Now().Format("2006-01-02 15:04:05"), "][Warn]")
	fmt.Println(msg...)
	if serverLog.logFile != "" {
		f, err := os.Open(serverLog.logFile)
		defer f.Close()
		if err != nil {
			return
		}
		fmt.Fprint(f, "[", time.Now().Format("2006-01-02 15:04:05"), "][Warn]")
		fmt.Fprintln(f, msgCat(msg...))
	}
}

func Error(msg ...interface{}) {
	fmt.Print("[", time.Now().Format("2006-01-02 15:04:05"), "][Error]")
	fmt.Println(msg...)
	if serverLog.logFile != "" {
		f, err := os.Open(serverLog.logFile)
		defer f.Close()
		if err != nil {
			return
		}
		fmt.Fprint(f, "[", time.Now().Format("2006-01-02 15:04:05"), "][Error]")
		fmt.Fprintln(f, msgCat(msg...))
	}
}
