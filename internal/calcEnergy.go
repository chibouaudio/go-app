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

type ResearchAreas struct {
	ResearchAreas map[string][]EnergyEvaluation `json:"research_areas"`
}

func GetFieldNames(w http.ResponseWriter, r *http.Request) {
	fieldData, err := loadFieldDataJson(w)
	if err != nil {
		return
	}

	var fieldNames []string
	for k := range fieldData.ResearchAreas {
		fieldNames = append(fieldNames, k)
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(fieldNames); err != nil {
		http.Error(w, "JSONエンコード失敗: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

// フィールドデータをJSONから取得する
func loadFieldDataJson(w http.ResponseWriter) (ResearchAreas, error) {
	jsonPath := filepath.Join(".", "data", "energy_evaluations.json")

	f, err := os.Open(jsonPath)
	if err != nil {
		http.Error(w, "ファイルが開けません: "+err.Error(), http.StatusInternalServerError)
		return ResearchAreas{}, err
	}
	defer f.Close()

	var researchAreas ResearchAreas
	if err := json.NewDecoder(f).Decode(&researchAreas); err != nil {
		http.Error(w, "JSONデコード失敗: "+err.Error(), http.StatusInternalServerError)
		return ResearchAreas{}, err
	}

	return researchAreas, nil
}
