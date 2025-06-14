package internal

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
)

// loadJSON は任意のJSONファイルを読み込み、指定された型のデータ構造を返します。
func loadJSON[T any](filePath string) (T, error) {
	var result T // T型のゼロ値
	file, err := os.Open(filePath)
	if err != nil {
		return result, fmt.Errorf("ファイルを開けません: %w", err)
	}
	defer file.Close()

	bytes, err := io.ReadAll(file)
	if err != nil {
		return result, fmt.Errorf("ファイルを読み込めません: %w", err)
	}

	// ここでジェネリクス T を利用
	if err := json.Unmarshal(bytes, &result); err != nil {
		return result, fmt.Errorf("JSONのデコードに失敗しました: %w", err)
	}
	return result, nil
}
