package internal

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
)

// energy_evaluations.jsonの情報を保持する構造体
type EnergyEvaluationJson struct {
	RankType     string `json:"rank_type"`
	RankNumber   int    `json:"rank_number"`
	EnergyToNext int    `json:"energy_to_next_rank"`
	TotalEnergy  *int   `json:"total_energy"`
}

type ResearchArea struct {
	Name        string                 `json:"name"`
	Evaluations []EnergyEvaluationJson `json:"evaluations"`
}

// energy_evaluations.jsonの情報を保持する構造体
type ResearchAreasJson struct {
	ResearchAreas []ResearchArea `json:"research_areas"` // スライスのスライスに変更
}

type EnergyCalcRequest struct {
	FieldName string `json:"fieldName"`
}

type EnergyCalcResponse struct {
	EnergyRequiredForM20 int    `json:"energyRequiredForM20"`
	Error                string `json:"error,omitempty"`
}

func GetFieldNames(w http.ResponseWriter, r *http.Request) {
	fieldData, err := loadFieldDataJson(w)
	if err != nil {
		return
	}

	var fieldNames []string
	for _, area := range fieldData.ResearchAreas {
		fieldNames = append(fieldNames, area.Name)
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(fieldNames); err != nil {
		http.Error(w, "JSONエンコード失敗: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

func CalcEnergy(w http.ResponseWriter, r *http.Request) {
	fieldData, err := loadFieldDataJson(w)
	if err != nil {
		return
	}

	var req EnergyCalcRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		resp := EnergyCalcResponse{Error: fmt.Sprintf("リクエストボディのデコードに失敗しました: %v", err)}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(resp)
		return
	}

	var evaluations []EnergyEvaluationJson
	foundField := false

	// スライスをループして、リクエストされたフィールド名に対応するResearchAreaを探す
	for _, area := range fieldData.ResearchAreas {
		if area.Name == req.FieldName {
			evaluations = area.Evaluations
			foundField = true
			break
		}
	}

	if !foundField {
		resp := EnergyCalcResponse{Error: fmt.Sprintf("指定されたフィールド名 '%s' のデータが見つかりません。", req.FieldName)}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(resp)
		return
	}

	var energyForM20 int = 0

	// 取得した評価リスト (evaluations) をループしてM20のTotalEnergyを探す
	for _, evaluation := range evaluations {
		if evaluation.RankType == "マスター" && evaluation.RankNumber == 20 {
			if evaluation.TotalEnergy != nil {
				energyForM20 = *evaluation.TotalEnergy
			}
			break
		}
	}

	resp := EnergyCalcResponse{
		EnergyRequiredForM20: energyForM20,
		Error:                "",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, fmt.Sprintf("JSONのエンコードに失敗しました: %v", err), http.StatusInternalServerError)
	}
}

// フィールドデータをJSONから取得する
func loadFieldDataJson(w http.ResponseWriter) (ResearchAreasJson, error) {
	jsonPath := filepath.Join(".", "data", "energy_evaluations.json")

	f, err := os.Open(jsonPath)
	if err != nil {
		http.Error(w, "ファイルが開けません: "+err.Error(), http.StatusInternalServerError)
		return ResearchAreasJson{}, err
	}
	defer f.Close()

	var researchAreas ResearchAreasJson
	if err := json.NewDecoder(f).Decode(&researchAreas); err != nil {
		http.Error(w, "JSONデコード失敗: "+err.Error(), http.StatusInternalServerError)
		return ResearchAreasJson{}, err
	}

	return researchAreas, nil
}
