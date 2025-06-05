package main

import (
	"html/template"
	"net/http"
	"pksl-app/internal"
)

// ルーティング設定を返す関数
func RouterSettings() *http.ServeMux {
    mux := http.NewServeMux()
	// 静的ファイルのハンドリング
	mux.Handle("/web/", http.StripPrefix("/web/", http.FileServer(http.Dir("web"))))

	// index.htmlを表示する
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "web/html/index.html")
	})

	// mux.HandleFunc("/level_calc", func(w http.ResponseWriter, r *http.Request) {
	// 	http.ServeFile(w, r, "web/html/level_calc.html")
	// })

	// level_calc.htmlを表示する
	mux.HandleFunc("/level_calc", func(w http.ResponseWriter, r *http.Request) {
		tmpl, err := template.ParseFiles("web/html/level_calc.html")
		if err != nil {
			http.Error(w, "テンプレートエラー", http.StatusInternalServerError)
			return
		}
		data := struct {
			Title string
		}{
			Title: "レベル計算ページ",
		}
		tmpl.Execute(w, data)
	})

    // 必要に応じて他のルートも追加
	mux.HandleFunc("/api/level_calc", internal.HandleLevelCalc)

    return mux
}