package main

import (
	"fmt"
	"net/http"
)

func main() {
	// index.htmlを表示する
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "web/index.html")
	})

	http.HandleFunc("/level_calc", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "web/level_calc.html")
	})

	fmt.Print("System Message: Server started at http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
