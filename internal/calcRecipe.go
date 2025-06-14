package internal

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
)

// レシピボーナス情報を保持する
type RecipeLevelDataJson struct {
	Level                int `json:"level"`
	BonusPercentage      int `json:"bonus_percentage"`
	RequiredExperience   int `json:"required_experience"`
	CumulativeExperience int `json:"cumulative_experience"`
}

// 食材の種類と数量を保持する
type RecipeIngredient struct {
	Name     string
	Quantity int
}

// 料理の情報を保持する
type DishDataJson struct {
	ID               int                `json:"ID"`
	DishName         string             `json:"dishName"`
	Ingredients      []RecipeIngredient `json:"ingredients"`
	TotalIngredients int                `json:"totalIngredients"`
	RecipeEnergy     int                `json:"recipeEnergy"`
}

// 料理のカテゴリーを保持する
type RecipesDataJson struct {
	Curry         []DishDataJson `json:"curry"`
	Salad         []DishDataJson `json:"salad"`
	DessertDrinks []DishDataJson `json:"dessert_drinks"`
}

// レシピボーナスを読み込む
func loadRecipeLevelDataJson(w http.ResponseWriter) ([]RecipeLevelDataJson, error) {
	jsonPath := filepath.Join(".", "data", "recipe_level.json")
	f, err := os.Open(jsonPath)
	if err != nil {
		http.Error(w, "ファイルが開けません: "+err.Error(), http.StatusInternalServerError)
		return nil, err
	}
	defer f.Close()

	var recipeDataJson []RecipeLevelDataJson
	if err := json.NewDecoder(f).Decode(&recipeDataJson); err != nil {
		http.Error(w, "JSONデコード失敗: "+err.Error(), http.StatusInternalServerError)
		return nil, err
	}

	return recipeDataJson, nil
}

// レシピ一覧を読み込む
func loadRecipesDataJson(w http.ResponseWriter) (RecipesDataJson, error) {
	jsonPath := filepath.Join(".", "data", "recipe_list.json")
	f, err := os.Open(jsonPath)
	if err != nil {
		http.Error(w, "ファイルが開けません: "+err.Error(), http.StatusInternalServerError)
		return RecipesDataJson{}, err
	}
	defer f.Close()

	var recipesDataJson RecipesDataJson
	if err := json.NewDecoder(f).Decode(&recipesDataJson); err != nil {
		http.Error(w, "JSONデコード失敗: "+err.Error(), http.StatusInternalServerError)
		return RecipesDataJson{}, err
	}

	return recipesDataJson, nil
}

// レシピリストを取得する
func GetRecipes(w http.ResponseWriter, r *http.Request) {
	recipes, err := loadRecipesDataJson(w)
	if err != nil {
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(recipes); err != nil {
		http.Error(w, "JSONエンコード失敗: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

// レシピボーナスを取得する
func GetRecipeBonus(w http.ResponseWriter, r *http.Request) {
	levelParam := r.URL.Query().Get("level")
	if levelParam == "" {
		http.Error(w, "levelパラメータが必要です", http.StatusBadRequest)
		return
	}

	// 文字列をintに変換
	level, err := strconv.Atoi(levelParam)
	if err != nil {
		http.Error(w, "levelパラメータは整数で指定してください", http.StatusBadRequest)
		return
	}

	// レシピボーナスデータを読み込む
	bonuses, err := loadRecipeLevelDataJson(w)
	if err != nil {
		return
	}

	// 指定レベルのボーナスを検索
	for _, bonus := range bonuses {
		if bonus.Level == level {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(bonus.BonusPercentage)
			return
		}
	}

	http.Error(w, "指定レベルのボーナスが見つかりません", http.StatusNotFound)
}

func CalcRecipeEnergy(w http.ResponseWriter, r *http.Request) {

}
