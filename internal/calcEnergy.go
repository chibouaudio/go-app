package internal

import (
	"encoding/json"
	"fmt"
	"math"
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

type ResearchAreasJson struct {
	ResearchAreas []ResearchArea `json:"research_areas"`
}

type EnergyCalcRequest struct {
	FieldName  string `json:"fieldName"`
	RankType   string `json:"rankType"`
	RankNumber int    `json:"rankNumber"`
}

type EnergyCalcResponse struct {
	EnergyRequiredForM20 int    `json:"energyRequiredForM20"`
	Error                string `json:"error,omitempty"`
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

// フィールド名のリストを取得するエンドポイント
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

// エナジー計算のエンドポイント
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
		if evaluation.RankType == req.RankType && evaluation.RankNumber == req.RankNumber {
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

type CalcWeeklyEnergyRequest struct {
	Energy                 int     `json:"energy"`                 // 料理1回の基本エナジー
	SkillLevel             int     `json:"skillLevel"`             // スキルレベル
	SkillActivationsPerDay float64 `json:"skillActivationsPerDay"` // 1日あたりの平均スキル発動回数
}

type CalcWeeklyEnergyResponse struct {
	WeeklyEnergy float64 `json:"weeklyEnergy"`    // 週間料理エナジー
	Error        string  `json:"error,omitempty"` // エラー情報
}

// スキルレベルごとの上昇率マップ
var skillBonusMap = map[int]float64{
	0: 0.00,
	1: 0.04,
	2: 0.05,
	3: 0.06,
	4: 0.07,
	5: 0.08,
	6: 0.10,
}

// 週間料理エナジー計算関数
func CalcWeeklyEnergy(w http.ResponseWriter, r *http.Request) {
	var req CalcWeeklyEnergyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		resp := CalcWeeklyEnergyResponse{Error: fmt.Sprintf("リクエストボディのデコードに失敗しました: %v", err)}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(resp)
		return
	}
	energy := float64(req.Energy)
	skillLevel := req.SkillLevel
	skillActivationsPerDay := req.SkillActivationsPerDay

	// スキル補正を取得
	levelBonus := skillBonusMap[skillLevel]

	// 1回の料理あたりのスキル発動期待値
	skillBoostPerCook := (skillActivationsPerDay / 3) * levelBonus

	// 月〜土
	pWeekday := math.Min(0.10+skillBoostPerCook, 0.70)
	weekdayMultiplier := 1 + pWeekday
	weekdayEnergy := energy * weekdayMultiplier * 3 * 6

	// 日曜
	pSunday := math.Min(0.30+skillBoostPerCook, 0.70)
	sundayMultiplier := 1 + 2*pSunday
	sundayEnergy := energy * sundayMultiplier * 3

	result := weekdayEnergy + sundayEnergy

	// 小数点第3位で四捨五入
	result = math.Round(result*100) / 100

	resp := CalcWeeklyEnergyResponse{
		WeeklyEnergy: result,
		Error:        "",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, fmt.Sprintf("JSONのエンコードに失敗しました: %v", err), http.StatusInternalServerError)
	}
}
