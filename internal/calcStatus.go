package internal

import (
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
