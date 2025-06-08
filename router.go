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

	mux.HandleFunc("/api/level_calc", internal.HandleLevelCalc)

	mux.HandleFunc("/energy_calc", func(w http.ResponseWriter, r *http.Request) {
		tmpl, err := template.ParseFiles("web/html/energy_calc.html")
		if err != nil {
			http.Error(w, "テンプレートエラー", http.StatusInternalServerError)
			return
		}
		data := struct {
			Title string
		}{
			Title: "エナジー計算ページ",
		}
		tmpl.Execute(w, data)
	})

	mux.HandleFunc("/api/getFieldData", internal.GetFieldData)

	return mux
}
