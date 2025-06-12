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
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	// index.htmlを表示する
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "static/html/index.html")
	})

	mux.HandleFunc("/level_calc", func(w http.ResponseWriter, r *http.Request) {
		tmpl, err := template.ParseFiles("static/html/level_calc.html")
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
		tmpl, err := template.ParseFiles("static/html/energy_calc.html")
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

	mux.HandleFunc("/api/getFieldNames", internal.GetFieldNames)
	mux.HandleFunc("/api/calcEnergy", internal.CalcEnergy)
	mux.HandleFunc("/api/getRecipes", internal.GetRecipes)
	mux.HandleFunc("/api/getRecipeBonus", internal.GetRecipeBonus)
	mux.HandleFunc("/api/calcWeeklyEnergy", internal.CalcWeeklyEnergy)

	mux.HandleFunc("/status_calc", func(w http.ResponseWriter, r *http.Request) {
		tmpl, err := template.ParseFiles("static/html/status_calc.html")
		if err != nil {
			http.Error(w, "テンプレートエラー", http.StatusInternalServerError)
			return
		}
		data := struct {
			Title string
		}{
			Title: "個体値計算ページ",
		}
		tmpl.Execute(w, data)
	})

	mux.HandleFunc("/api/getSubSkills", internal.GetSubSkills)
	mux.HandleFunc("/api/calcHelpingCount", internal.CalcHelpingCount)

	return mux
}
