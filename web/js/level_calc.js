document.addEventListener('DOMContentLoaded', function () {
    // 現在のレベル
    const currentLevelInput = document.getElementById('currentLevel');
    // 目標レベル
    const targetLevelInput = document.getElementById('targetLevel');
    // 現在のレベル（表示用）
    const currentLevelValue = document.getElementById('currentLevelValue');
    // 目標レベル（表示用）
    const targetLevelValue = document.getElementById('targetLevelValue');
    // 性格補正のラジオボタン
    const natureExpRadios = document.querySelectorAll('input[name="natureExp"]');
    // 経験値タイプのラジオボタン
    const expTypeRadios = document.querySelectorAll('input[name="expType"]');
    // アメブーストのラジオボタン
    const candyBoostRadios = document.querySelectorAll('input[name="candyBoost"]');
    // 結果を表示する要素
    const requiredTotalExpSpan = document.getElementById('requiredTotalExp');
    const requiredTotalCandySpan = document.getElementById('requiredTotalCandy');
    const requiredTotalDreamShardsSpan = document.getElementById('requiredTotalDreamShards');
    // エラーメッセージを表示する要素
    const errorMessageSpan = document.getElementById('errorMessage');
    const errorCandyBoostMessage = document.getElementById('errorCandyBoostMessage');

    // イベントリスナー
    currentLevelInput.addEventListener('input', function() {
        currentLevelValue.textContent = currentLevelInput.value;
        // 目標レベルが現在のレベル以下になっている場合、目標レベルを更新
        if (parseInt(targetLevelInput.value) <= parseInt(currentLevelInput.value)) {
            targetLevelInput.value = parseInt(currentLevelInput.value) + 1;
            targetLevelValue.textContent = targetLevelInput.value;
        }
        calcLevel();
    });
    targetLevelInput.addEventListener('input', function() {
        targetLevelValue.textContent = targetLevelInput.value;
        // 目標レベルが現在のレベル以下になっている場合、現在のレベルを更新
        if (parseInt(targetLevelInput.value) <= parseInt(currentLevelInput.value)) {
            currentLevelInput.value = parseInt(targetLevelInput.value) - 1;
            currentLevelValue.textContent = currentLevelInput.value;
        }
        calcLevel();
    });

    // 性格補正ラジオボタンの変更を監視するイベントリスナー
    natureExpRadios.forEach(radio => {
        radio.addEventListener('change', calcLevel);
    });

    // 経験値タイプのラジオボタンの変更を監視するイベントリスナー
    expTypeRadios.forEach(radio => {
        radio.addEventListener('change', calcLevel);
    });

    // アメブーストのラジオボタンの変更を監視するイベントリスナー
    candyBoostRadios.forEach(radio => {
        radio.addEventListener('change', calcLevel);
    });

    async function calcLevel() {
        const currentLevel = parseInt(currentLevelInput.value);
        const targetLevel = parseInt(targetLevelInput.value);
        // 選択された性格を取得
        const selectedNatureRadio = document.querySelector('input[name="natureExp"]:checked');
        const natureExp = selectedNatureRadio ? selectedNatureRadio.value : 'none';

        // 選択された経験値タイプを取得
        const selectedExpTypeRadio = document.querySelector('input[name="expType"]:checked');
        const expType = selectedExpTypeRadio ? parseInt(selectedExpTypeRadio.value) : 600;

        // アメブーストの選択を取得
        const selectedCandyBoostRadio = document.querySelector('input[name="candyBoost"]:checked');
        const candyBoost = selectedCandyBoostRadio ? selectedCandyBoostRadio.value : 'none';

        const candyBoostDayLimit = 500; // アメブーストの一日当たりの使用量制限
        const miniCandyBoostDayLimit = 50; // ミニアメブーストの一日当たりの使用量制限

        // 両方入力されていなければ何もしない
        if (isNaN(currentLevel) || isNaN(targetLevel)) {
            requiredTotalExpSpan.textContent = '';
            requiredTotalCandySpan.textContent = '';
            requiredTotalDreamShardsSpan.textContent = '';
            errorMessageSpan.textContent = '';
            return;
        }

        // 目標レベルが現在のレベル以下の場合のエラーチェック
        if (targetLevel <= currentLevel) {
            errorMessageSpan.textContent = "目標レベルは現在のレベルより大きい必要があります。";
            requiredTotalExpSpan.textContent = '';
            requiredTotalCandySpan.textContent = '';
            requiredTotalDreamShardsSpan.textContent = '';
            return;
        }

        if (candyBoost === 'mini') {
            // アメブーストが選択されている場合のエラーメッセージ
            errorCandyBoostMessage.textContent = `アメブーストに使えるアメは1日 ${ miniCandyBoostDayLimit } 個に制限されています。`;
        } else if (candyBoost === 'normal') {
            // アメブーストが選択されている場合のエラーメッセージ
            errorCandyBoostMessage.textContent = `アメブーストに使えるアメは1日 ${ candyBoostDayLimit } 個に制限されています。`;
        }

        try {
            const response = await fetch('/api/level_calc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentLevel: currentLevel,
                    targetLevel: targetLevel,
                    natureExp: natureExp,
                    expType: expType,
                    candyBoost: candyBoost
                })
            });

            if (!response.ok) {
                const data = await response.json();
                // エラーメッセージを表示
                errorMessageSpan.textContent = data.error || `APIエラー！ステータス: ${response.status}`;
                // 結果をクリア
                requiredTotalExpSpan.textContent = '';
                requiredTotalCandySpan.textContent = '';
                requiredTotalDreamShardsSpan.textContent = '';
                return;
            }

            const data = await response.json();
            requiredTotalExpSpan.textContent = data.requiredTotalExp.toLocaleString();
            requiredTotalCandySpan.textContent = data.requiredTotalCandy.toLocaleString();
            requiredTotalDreamShardsSpan.textContent = data.requiredDreamShards.toLocaleString();
            errorMessageSpan.textContent = ''; // エラーメッセージをクリア

        } catch (error) {
            console.error('レベル計算APIの呼び出し中にエラーが発生しました:', error);
        }
    }

    // 初期計算
    calcLevel();
});
