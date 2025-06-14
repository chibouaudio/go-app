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
	Breakfast    float64 `json:"breakfast"`
	Lunch        float64 `json:"lunch"`
	Dinner       float64 `json:"dinner"`
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
	startHour := 7.0
	breakfast := (req.Breakfast - startHour) * 60.0
	lunch := (req.Lunch - startHour) * 60.0
	dinner := (req.Dinner - startHour) * 60.0

	mealTimes := map[float64]bool{
		breakfast: true,
		lunch:     true,
		dinner:    true,
	}

	for i := 0; i <= totalTime; i += 10 {
		// 食事の時間ならgenkiを5回復
		if mealTimes[float64(i)] {
			if genki >= 81 {
				genki += 1
			} else if genki >= 61 {
				genki += 2
			} else if genki >= 41 {
				genki += 3
			} else if genki >= 21 {
				genki += 4
			} else {
				genki += 5
			}
		}

		if genki >= 81 {
			resultSeconds += 1.0 / 0.45 * 10.0
		} else if genki >= 61 {
			resultSeconds += 1.0 / 0.52 * 10.0
		} else if genki >= 41 {
			resultSeconds += 1.0 / 0.58 * 10.0
		} else if genki >= 1 {
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
