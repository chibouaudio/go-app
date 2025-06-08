package internal

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
)

type EnergyEvaluation struct {
	RankType     string `json:"rank_type"`
	RankNumber   int    `json:"rank_number"`
	EnergyToNext int    `json:"energy_to_next_rank"`
	TotalEnergy  *int   `json:"total_energy"`
}

func GetFieldData(w http.ResponseWriter, r *http.Request) {
	jsonPath := filepath.Join(".", "data", "energy_evaluations.json")

	f, err := os.Open(jsonPath)
	if err != nil {
		http.Error(w, "ファイルが開けません: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer f.Close()

	// マップで受ける
	var fieldData map[string][]EnergyEvaluation
	if err := json.NewDecoder(f).Decode(&fieldData); err != nil {
		http.Error(w, "JSONデコード失敗: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var fieldNames []string
	for k := range fieldData {
		fieldNames = append(fieldNames, k)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(fieldNames)
}
