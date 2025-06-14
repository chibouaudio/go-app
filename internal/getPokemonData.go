package internal

import (
	"encoding/json"
	"fmt"
	"net/http"
	"reflect"
)

type Ingredient struct {
	Name   string `json:"name"`
	Values []int  `json:"values"`
}

type Pokemon struct {
	ID           int        `json:"ID"`
	No           int        `json:"No"`
	Name         string     `json:"Name"`
	FoodDropRate float64    `json:"FoodDropRate"`
	SkillRate    float64    `json:"SkillRate"`
	MainSkill    string     `json:"MainSkill"`
	Type         string     `json:"Type"`
	SpeedOfHelp  int        `json:"SpeedOfHelp"`
	Berries      string     `json:"Berries"`
	IngredientsA Ingredient `json:"IngredientsA"`
	IngredientsB Ingredient `json:"IngredientsB"`
	IngredientsC Ingredient `json:"IngredientsC"`
}

// LoadPokemonData は関数としてポケモンデータを返す
func LoadPokemonData() ([]Pokemon, error) {
	return loadJSON[[]Pokemon]("./data/pokemon_data.json")
}

func GetPokemonNames(w http.ResponseWriter, r *http.Request) {
	data, err := LoadPokemonData()
	if err != nil {
		http.Error(w, "Failed to load pokemon data", http.StatusInternalServerError)
		return
	}

	type PokemonName struct {
		ID   int    `json:"ID"`
		No   int    `json:"No"`
		Name string `json:"Name"`
	}

	names := make([]PokemonName, len(data))
	for i, p := range data {
		names[i] = PokemonName{
			ID:   p.ID,
			No:   p.No,
			Name: p.Name,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(names)
}

type FieldRequest struct {
	No    int    `json:"no"`
	Field string `json:"field"`
}

type FieldResponse struct {
	Value any    `json:"value,omitempty"`
	Error string `json:"error,omitempty"`
}

func GetPokemonFieldValue(w http.ResponseWriter, r *http.Request) {
	var req FieldRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("リクエストデコード失敗: %v", err), http.StatusBadRequest)
		return
	}

	pokemons, err := LoadPokemonData()
	if err != nil {
		http.Error(w, fmt.Sprintf("ポケモンデータ読み込み失敗: %v", err), http.StatusInternalServerError)
		return
	}
	var found any
	for _, p := range pokemons {
		if p.No == req.No {
			val := reflect.ValueOf(p)
			fieldVal := val.FieldByName(req.Field)
			if fieldVal.IsValid() {
				found = fieldVal.Interface()
			} else {
				http.Error(w, "指定フィールドが存在しません", http.StatusBadRequest)
				return
			}
			break
		}
	}
	if found == nil {
		http.Error(w, "該当するポケモンが見つかりません", http.StatusNotFound)
		return
	}

	resp := FieldResponse{Value: found}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
