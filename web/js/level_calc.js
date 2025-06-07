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

    // アメの数入力フィールド
    const candyPokemon = document.getElementById("candyCount");
    const handyCandyS = document.getElementById("handyCandyS");
    const handyCandyM = document.getElementById("handyCandyM");
    const handyCandyL = document.getElementById("handyCandyL");
    // アメ計算結果を表示する要素
    const usageResult = document.getElementById("candyUsageResult");

    // イベントリスナー
    currentLevelInput.addEventListener('input', function () {
        currentLevelValue.textContent = currentLevelInput.value;
        // 目標レベルが現在のレベル以下になっている場合、目標レベルを更新
        if (parseInt(targetLevelInput.value) <= parseInt(currentLevelInput.value)) {
            targetLevelInput.value = parseInt(currentLevelInput.value) + 1;
            targetLevelValue.textContent = targetLevelInput.value;
        }
        calcLevel();
    });
    targetLevelInput.addEventListener('input', function () {
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

    candyPokemon.addEventListener("input", calcLevel);
    handyCandyS.addEventListener("input", calcLevel);
    handyCandyM.addEventListener("input", calcLevel);
    handyCandyL.addEventListener("input", calcLevel);

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
            requiredTotalExpSpan.textContent = "";
            requiredTotalCandySpan.textContent = "";
            requiredTotalDreamShardsSpan.textContent = "";
            errorMessageSpan.textContent = "";
            usageResult.innerHTML = "";
            return;
        }

        // 目標レベルが現在のレベル以下の場合のエラーチェック
        if (targetLevel <= currentLevel) {
            errorMessageSpan.textContent = "目標レベルは現在のレベルより大きい必要があります。";
            requiredTotalExpSpan.textContent = "";
            requiredTotalCandySpan.textContent = "";
            requiredTotalDreamShardsSpan.textContent = "";
            usageResult.innerHTML = "";
            return;
        }

        if (candyBoost === 'mini') {
            // アメブーストが選択されている場合のエラーメッセージ
            errorCandyBoostMessage.textContent = `アメブーストに使えるアメは1日 ${miniCandyBoostDayLimit} 個に制限されています。`;
        } else if (candyBoost === 'normal') {
            // アメブーストが選択されている場合のエラーメッセージ
            errorCandyBoostMessage.textContent = `アメブーストに使えるアメは1日 ${candyBoostDayLimit} 個に制限されています。`;
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

            calcCandy(data.requiredTotalCandy);
        } catch (error) {
            console.error('レベル計算APIの呼び出し中にエラーが発生しました:', error);
        }
    }

    // calcCandy関数をL優先で修正
    async function calcCandy(totalCandy) {
        totalCandy = parseInt(totalCandy);

        let candyPokemonValue = parseInt(candyPokemon.value) || 0;
        let handyCandySValue = parseInt(handyCandyS.value) || 0;
        let handyCandyMValue = parseInt(handyCandyM.value) || 0;
        let handyCandyLValue = parseInt(handyCandyL.value) || 0;

        if (totalCandy <= 0) {
            usageResult.innerHTML = `<li class="mt-2"><span class="text-success">必要なアメが0個なので足りています！</span></li>`;
            return;
        }

        // ばんのうアメの変換値
        const S_CONVERSION = 3;
        const M_CONVERSION = 20;
        const L_CONVERSION = 100;

        // 使用するアメの個数を初期化
        let usePokemon = 0;
        let useS = 0;
        let useM = 0;
        let useL = 0;

        // 残り必要なアメ数
        let remainingRequired = totalCandy;

        // 1. ポケモンのアメを使用
        usePokemon = Math.min(remainingRequired, candyPokemonValue);
        remainingRequired -= usePokemon;

        if (remainingRequired <= 0) {
            displayResults(usePokemon, useS, useM, useL, remainingRequired);
            return;
        }

        // 2. ばんのうアメLを使用
        if (remainingRequired > 0 && handyCandyLValue > 0) {
            // Lアメで賄えるアメの量
            const potentialLValue = handyCandyLValue * L_CONVERSION;

            if (potentialLValue >= remainingRequired) {
                useL = Math.ceil(remainingRequired / L_CONVERSION);
                remainingRequired = 0;
            } else {
                useL = handyCandyLValue;
                remainingRequired -= potentialLValue;
            }
        }

        if (remainingRequired <= 0) {
            displayResults(usePokemon, useS, useM, useL, remainingRequired);
            return;
        }

        // 3. ばんのうアメMを使用
        if (remainingRequired > 0 && handyCandyMValue > 0) {
            const potentialMValue = handyCandyMValue * M_CONVERSION;

            if (potentialMValue >= remainingRequired) {
                useM = Math.ceil(remainingRequired / M_CONVERSION);
                remainingRequired = 0;
            } else {
                useM = handyCandyMValue;
                remainingRequired -= potentialMValue;
            }
        }

        if (remainingRequired <= 0) {
            displayResults(usePokemon, useS, useM, useL, remainingRequired);
            return;
        }

        // 4. ばんのうアメSを使用
        if (remainingRequired > 0 && handyCandySValue > 0) {
            const potentialSValue = handyCandySValue * S_CONVERSION;

            if (potentialSValue >= remainingRequired) {
                useS = Math.ceil(remainingRequired / S_CONVERSION);
                remainingRequired = 0;
            } else {
                useS = handyCandySValue;
                remainingRequired -= potentialSValue;
            }
        }

        displayResults(usePokemon, useS, useM, useL, remainingRequired);
    }

    function displayResults(usePokemon, useS, useM, useL, remainingRequired) {
        const finalRemaining = Math.max(0, remainingRequired);
        const isEnough = remainingRequired <= 0;

        usageResult.innerHTML = `
            <li class="mt-2">使うポケモンのアメ：<strong>${usePokemon}</strong> 個</li>
            <li class="mt-2">使うばんのうアメS：<strong>${useS}</strong> 個</li>
            <li class="mt-2">使うばんのうアメM：<strong>${useM}</strong> 個</li>
            <li class="mt-2">使うばんのうアメL：<strong>${useL}</strong> 個</li>
            <li class="mt-2">${isEnough ? `<span class="text-success">足りています！</span>` : `<span class="text-danger">あと${finalRemaining}個足りません</span>`}</li>
        `;
    }

    // 初期計算
    calcLevel();
});
