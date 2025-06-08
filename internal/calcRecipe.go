package internal

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
)

// レシピボーナス情報を保持する
type RecipeLevelDataJson struct {
	Level                int `json:"level"`
	BonusPercentage      int `json:"bonus_percentage"`
	RequiredExperience   int `json:"required_experience"`
	CumulativeExperience int `json:"cumulative_experience"`
}

// 食材の種類と数量を保持する
type Ingredient struct {
	Name     string
	Quantity int
}

// 料理の情報を保持する
type DishDataJson struct {
	ID               int          `json:"ID"`
	DishName         string       `json:"dishName"`
	Ingredients      []Ingredient `json:"ingredients"`
	TotalIngredients int          `json:"totalIngredients"`
	RecipeEnergy     int          `json:"recipeEnergy"`
}

// 料理のカテゴリーを保持する
type RecipesDataJson struct {
	Curry         []DishDataJson `json:"curry"`
	Salad         []DishDataJson `json:"salad"`
	DessertDrinks []DishDataJson `json:"dessert_drinks"`
}

// レシピボーナスを読み込む
func loadRecipeLevelDataJson(w http.ResponseWriter) (RecipeLevelDataJson, error) {
	jsonPath := filepath.Join(".", "data", "energy_evaluations.json")
	f, err := os.Open(jsonPath)
	if err != nil {
		http.Error(w, "ファイルが開けません: "+err.Error(), http.StatusInternalServerError)
		return RecipeLevelDataJson{}, err
	}
	defer f.Close()

	var recipeDataJson RecipeLevelDataJson
	if err := json.NewDecoder(f).Decode(&recipeDataJson); err != nil {
		http.Error(w, "JSONデコード失敗: "+err.Error(), http.StatusInternalServerError)
		return RecipeLevelDataJson{}, err
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

func CalcRecipeEnergy(w http.ResponseWriter, r *http.Request) {

}
