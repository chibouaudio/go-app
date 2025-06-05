document.addEventListener('DOMContentLoaded', function () {
    const currentLevelInput = document.getElementById('currentLevel');
    const targetLevelInput = document.getElementById('targetLevel');
    const requiredTotalExpSpan = document.getElementById('requiredTotalExp');
    const requiredTotalCandySpan = document.getElementById('requiredTotalCandy');
    const requiredTotalDreamShardsSpan = document.getElementById('requiredTotalDreamShards');
    const natureExpRadios = document.querySelectorAll('input[name="natureExp"]');
    const errorMessageSpan = document.getElementById('errorMessage');

    // イベントリスナーを追加
    currentLevelInput.addEventListener('input', calcLevel);
    targetLevelInput.addEventListener('input', calcLevel);

    // 性格補正ラジオボタンの変更を監視するイベントリスナーを追加
    natureExpRadios.forEach(radio => {
        radio.addEventListener('change', calcLevel);
    });

    async function calcLevel() {
        const currentLevel = parseInt(currentLevelInput.value);
        const targetLevel = parseInt(targetLevelInput.value);
        // 選択された性格を取得
        const selectedNatureRadio = document.querySelector('input[name="natureExp"]:checked');
        const natureExp = selectedNatureRadio ? selectedNatureRadio.value : 'none';

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

        try {
            const response = await fetch('/api/level_calc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentLevel: currentLevel,
                    targetLevel: targetLevel,
                    natureExp: natureExp
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
});
