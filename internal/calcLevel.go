package internal

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"os"
)

var levelData map[int]LevelStatsJson

const EXP_PER_CANDY = 25     // 飴1個あたりの獲得経験値量
const EXP_Nature_UP = 1.18   // 性格補正: 上昇
const EXP_Nature_DOWN = 0.82 // 性格補正: 下降

// LevelStatsJson は各レベルの経験値の情報を保持する構造体
type LevelStatsJson struct {
	Level               int `json:"level"`
	RequiredExp         int `json:"requiredExp"`         // そのレベルに上がるために必要な経験値
	AccumulatedExp      int `json:"accumulatedExp"`      // そのレベルに上がるまでに累計で必要な経験値
	RequiredDreamShards int `json:"requiredDreamShards"` // そのレベルに上がるために必要なゆめのかけら
	CandyPerDreamShards int `json:"candyPerDreamShards"` // 飴1個あたりのゆめのかけらの必要量
}

// LevelCalcRequest はリクエストボディの構造体
type LevelCalcRequest struct {
	CurrentLevel int    `json:"currentLevel"`
	TargetLevel  int    `json:"targetLevel"`
	NatureExp    string `json:"natureExp"`
}

// LevelCalcResponse はレスポンスボディの構造体
type LevelCalcResponse struct {
	RequiredTotalExp    int    `json:"requiredTotalExp"`    // 目標レベルまでに必要な合計経験値
	RequiredTotalCandy  int    `json:"requiredTotalCandy"`  // 目標レベルまでに必要な合計アメ
	RequiredDreamShards int    `json:"requiredDreamShards"` // 目標レベルまでに必要なゆめのかけら
	Message             string `json:"message"`             // 追加のメッセージ
	Error               string `json:"error,omitempty"`     // エラーメッセージ (エラー時のみ存在)
}

// init 関数はレベルデータを初期化します
func init() {
	file, err := os.Open("./data/level_data.json")
	if err != nil {
		panic(fmt.Sprintf("level_data.jsonの読み込みに失敗: %v", err))
	}
	defer file.Close()

	var levels []LevelStatsJson
	if err := json.NewDecoder(file).Decode(&levels); err != nil {
		panic(fmt.Sprintf("level_data.jsonのデコードに失敗: %v", err))
	}
	// レベルデータをレベル番号をキーとするマップに変換
	levelData = make(map[int]LevelStatsJson)
	for _, lv := range levels {
		levelData[lv.Level] = lv
	}
}

// HandleLevelCalc は /api/level_calc エンドポイントのリクエストを処理します
func HandleLevelCalc(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "POSTメソッドのみサポートしています", http.StatusMethodNotAllowed)
		return
	}

	var req LevelCalcRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		resp := LevelCalcResponse{Error: fmt.Sprintf("リクエストボディのデコードに失敗しました: %v", err)}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(resp)
		return
	}

	// 性格補正を適用
	var expPerCandy float64 = EXP_PER_CANDY
	switch req.NatureExp {
	case "up":
		expPerCandy *= EXP_Nature_UP
	case "down":
		expPerCandy *= EXP_Nature_DOWN
	}

	// 経験値とアメの計算
	totalExp, totalCandy, err := getRequiredExp(req.CurrentLevel, req.TargetLevel, expPerCandy)
	if err != nil {
		resp := LevelCalcResponse{Error: err.Error()}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest) // 400 Bad Request
		json.NewEncoder(w).Encode(resp)
		return
	}
	// ゆめのかけらの計算
	totalDreamShards, err := getRequiredDreamShards(req.CurrentLevel, req.TargetLevel, expPerCandy)
	if err != nil {
		resp := LevelCalcResponse{Error: err.Error()}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest) // 400 Bad Request
		json.NewEncoder(w).Encode(resp)
		return
	}

	resp := LevelCalcResponse{
		RequiredTotalExp:    totalExp,
		RequiredTotalCandy:  totalCandy,
		RequiredDreamShards: totalDreamShards,
		Message:             "レベル計算が完了しました。",
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, fmt.Sprintf("JSONのエンコードに失敗しました: %v", err), http.StatusInternalServerError)
	}
}

// getRequiredExp はレベルアップに必要な合計経験値とアメを計算します
// currentLevel: 現在のレベル
// targetLevel: 目標レベル
// expPerCandy: 飴1個あたりの経験値量
// 戻り値: 合計経験値, 必要なアメ数, エラー
func getRequiredExp(currentLevel, targetLevel int, expPerCandy float64) (int, int, error) {
	// 入力レベルのバリデーション
	if currentLevel >= targetLevel {
		return 0, 0, fmt.Errorf("目標レベルは現在のレベルより大きい値を指定してください。")
	}

	// 目標レベルの累計経験値を取得
	targetData, targetExists := levelData[targetLevel]
	if !targetExists {
		return 0, 0, fmt.Errorf("目標レベル %d の経験値データが見つかりません。", targetLevel)
	}

	// 現在のレベルの累計経験値を取得
	var currentAccumulatedExp int
	if currentLevel == 1 {
		// レベル1から始める場合、累計経験値は0からスタートと見なす
		currentAccumulatedExp = 0
	} else {
		currentData, currentExists := levelData[currentLevel]
		if !currentExists {
			return 0, 0, fmt.Errorf("現在のレベル %d の経験値データが見つかりません。", currentLevel)
		}
		currentAccumulatedExp = currentData.AccumulatedExp
	}

	// 合計経験値を計算
	totalExp := targetData.AccumulatedExp - currentAccumulatedExp

	// 合計経験値から必要なアメ数を計算
	totalCandy := int(math.Ceil(float64(totalExp) / expPerCandy))
	return totalExp, totalCandy, nil
}

// getRequiredDreamShards は目標レベルに到達するために必要なゆめのかけらの数を計算します
// currentLevel: 現在のレベル
// targetLevel: 目標レベル
// expPerCandy: 飴1個あたりの経験値量
// 戻り値: 必要なゆめのかけらの数, エラー
func getRequiredDreamShards(currentLevel, targetLevel int, expPerCandy float64) (int, error) {
	totalDreamShards := 0
	for level := currentLevel + 1; level <= targetLevel; level++ {
		data, exists := levelData[level]
		if !exists {
			return 0, fmt.Errorf("レベル %d のデータが見つかりません。", level)
		}
		// 次のレベルに上がるためのEXPを取得
		nextLevelExp := data.RequiredExp
		// 飴1個あたりのEXPで割って、必要な飴の数を計算
		ceilExpPerCandy := math.Ceil(expPerCandy)
		requiredCandy := int(math.Ceil(float64(nextLevelExp) / ceilExpPerCandy))
		// 次のレベルに上がるために必要なゆめのかけらを計算
		requiredDreamShards := requiredCandy * data.CandyPerDreamShards
		// 必要なゆめのかけらの合計を更新
		totalDreamShards += requiredDreamShards
	}
	return totalDreamShards, nil
}
