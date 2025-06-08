package main

import (
	"fmt"
	"net/http"
)

func main() {
	router := RouterSettings()
	fmt.Println("System Message: Server started at http://localhost:8080")
	// http.ListenAndServe(":8080", router)
	http.ListenAndServe("0.0.0.0:8080", router)
}
