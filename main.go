package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"time"
)

func startTypeScriptWatcher(ctx context.Context) error {
	cmd := exec.CommandContext(ctx, "npx", "tsc", "--outDir", "web/js", "--rootDir", "web/ts", "--watch")

	// コマンドの標準出力と標準エラー出力をGoプログラムのコンソールにリダイレクト
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	fmt.Println("TypeScriptのウォッチモードを開始します...")

	// コマンドを非同期で実行
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("TypeScriptのウォッチモードの起動に失敗しました: %w", err)
	}

	// ゴルーチンで子プロセスの終了を待ち、エラーがあればログに出力
	go func() {
		err := cmd.Wait()
		if err != nil && ctx.Err() == nil { // コンテキストがキャンセルされたことによる終了でなければエラーログ
			fmt.Printf("TypeScriptのウォッチプロセスが異常終了しました: %v\n", err)
		}
	}()

	return nil
}

func main() {
	// ウォッチモード用のコンテキストを作成
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// TypeScriptのウォッチモードを開始
	err := startTypeScriptWatcher(ctx)
	if err != nil {
		fmt.Println(err)
		return
	}
	time.Sleep(2 * time.Second)

	router := RouterSettings()
	fmt.Println("System Message: Server started at http://localhost:8080")
	fmt.Println("変更を保存するとTypeScriptが自動的に再コンパイルされます。")

	err = http.ListenAndServe("0.0.0.0:8080", router)
	if err != nil {
		fmt.Printf("サーバーの起動に失敗しました: %v\n", err)
	}
}
