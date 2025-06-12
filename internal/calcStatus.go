package internal

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type SubSkillJson struct {
	ID       int    `json:"id"`
	SubSkill string `json:"subskill"`
	Color    string `json:"color"`
}

func GetSubSkills(w http.ResponseWriter, r *http.Request) {
	data, err := os.ReadFile("./data/sub_skill.json")
	if err != nil {
		http.Error(w, fmt.Sprintf("sub_skill.jsonの読み込みエラー: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

type HelpingCountRequest struct {
	MaxGenki     int     `json:"maxGenki"`
	HelpingSpeed float64 `json:"helpingSpeed"`
}

type HelpingCountResponse struct {
	HelpingCount float64 `json:"helpingCount"`
	Error        string  `json:"error,omitempty"`
}

func CalcHelpingCount(w http.ResponseWriter, r *http.Request) {
	var req HelpingCountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("リクエストボディのデコードに失敗: %v", err), http.StatusBadRequest)
		return
	}

	if req.MaxGenki <= 0 || req.HelpingSpeed <= 0 {
		http.Error(w, "maxGenkiとhelpingSpeedは正の値でなければなりません", http.StatusBadRequest)
		return
	}

	maxGenki := req.MaxGenki
	helpingSpeed := req.HelpingSpeed
	totalTime := 24 * 60
	genki := maxGenki

	var resultSeconds float64 = 0.0

	// 10分ごとの処理
	for i := totalTime; i >= 0; i -= 10 {
		if genki >= 81 {
			resultSeconds += 1.0 / 0.45 * 10.0
		} else if genki >= 61 && genki <= 80 {
			resultSeconds += 1.0 / 0.52 * 10.0
		} else if genki >= 41 && genki <= 60 {
			resultSeconds += 1.0 / 0.58 * 10.0
		} else if genki >= 1 && genki <= 40 {
			resultSeconds += 1.0 / 0.66 * 10.0
		} else {
			resultSeconds += 10.0
		}
		// 10分ごとに元気を1減らす
		genki -= 1
	}

	helpingCount := resultSeconds * 60 / helpingSpeed

	resp := HelpingCountResponse{
		HelpingCount: helpingCount,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}
