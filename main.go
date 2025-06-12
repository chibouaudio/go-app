package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"time"

	"github.com/joho/godotenv"
)

func startTypeScriptWatcher(ctx context.Context) error {
	cmd := exec.CommandContext(ctx, "npx", "tsc", "--outDir", "static/js", "--rootDir", "static/ts", "--watch")

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
	// .envファイルを読み込む
	if err := godotenv.Load(); err != nil {
		fmt.Println("警告: .envファイルが見つかりません")
	}

	// 開発モードの場合のみTypeScriptウォッチャーを起動
	if os.Getenv("DEV_MODE") == "1" {
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()
		err := startTypeScriptWatcher(ctx)
		if err != nil {
			fmt.Println(err)
			return
		}
		time.Sleep(2 * time.Second)
		fmt.Println("TypeScriptのウォッチモードが起動しました。")
		fmt.Println("変更を保存すると自動的に再コンパイルされます。")
	}

	router := RouterSettings()
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("サーバーを起動します: http://localhost:%s\n", port)
	err := http.ListenAndServe(":"+port, router)
	if err != nil {
		fmt.Printf("サーバーの起動に失敗しました: %v\n", err)
	}
}
