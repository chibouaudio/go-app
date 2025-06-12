package internal

// loadJSON は任意のJSONファイルを読み込み、指定された型のデータ構造を返します。
// T には、デコードしたい構造体の型を指定します。
// func loadJSON[T any](filePath string) (T, error) {
// 	var result T // T型のゼロ値
// 	fmt.Println("Loading JSON from:", filePath)
// 	file, err := os.Open(filePath)
// 	if err != nil {
// 		return result, fmt.Errorf("ファイルを開けません: %w", err)
// 	}
// 	defer file.Close()

// 	bytes, err := ioutil.ReadAll(file)
// 	if err != nil {
// 		return result, fmt.Errorf("ファイルを読み込めません: %w", err)
// 	}

// 	// ここでジェネリクス T を利用
// 	if err := json.Unmarshal(bytes, &result); err != nil {
// 		return result, fmt.Errorf("JSONのデコードに失敗しました: %w", err)
// 	}
// 	return result, nil
// }
