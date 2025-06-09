package main

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
)

func compileTypeScript() error {
	cmd := exec.Command("npx", "tsc", "--outDir", "web/js", "--rootDir", "web/ts")

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	fmt.Println("TypeScriptのコンパイルを開始します...")
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("TypeScriptのコンパイルに失敗しました: %w", err)
	}
	return nil
}

func main() {
	err := compileTypeScript()
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println("TypeScriptのコンパイルが完了しました。")

	router := RouterSettings()
	fmt.Println("System Message: Server started at http://localhost:8080")
	http.ListenAndServe("0.0.0.0:8080", router)
}
