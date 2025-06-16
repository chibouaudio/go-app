package internal

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// リクエスト用構造体
type PersonalityRequest struct {
	UpStatus   string `json:"upStatus"`
	DownStatus string `json:"downStatus"`
}

// レスポンス用構造体
type PersonalityResponse struct {
	Personality Personality `json:"personality,omitempty"`
	Error       string      `json:"error,omitempty"`
}

// JSONデータ用構造体
type PersonalityData struct {
	Title         string        `json:"title"`
	Personalities []Personality `json:"personalities"`
}
type Personality struct {
	Name   string            `json:"name"`
	Effect PersonalityEffect `json:"effect"`
}
type PersonalityEffect struct {
	UpStatus   StatusEffect `json:"up_status"`
	DownStatus StatusEffect `json:"down_status"`
}
type StatusEffect struct {
	Ability string  `json:"ability"`
	Value   float64 `json:"value"`
}

func GetPersonality(w http.ResponseWriter, r *http.Request) {
	var req PersonalityRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "リクエストデコード失敗", http.StatusBadRequest)
		return
	}

	personalityData, err := loadJSON[PersonalityData]("./data/personality_data.json")
	if err != nil {
		http.Error(w, fmt.Sprintf("personality_data.jsonの読み込みエラー: %v", err), http.StatusInternalServerError)
		return
	}

	for _, p := range personalityData.Personalities {
		if p.Effect.UpStatus.Ability == req.UpStatus && p.Effect.DownStatus.Ability == req.DownStatus {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(p)
			return
		}
	}

	http.Error(w, "該当する性格がありません", http.StatusNotFound)
}
