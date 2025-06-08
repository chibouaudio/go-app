document.addEventListener('DOMContentLoaded', async () => {
    // 要素取得
    const selectFieldName = document.getElementById('fieldName');
    const recipesList = document.getElementById('recipesList');
    const fieldBonus = document.getElementById('fieldBonus');
    const recipeLevel = document.getElementById('recipeLevel');

    // 結果要素
    const energyRequiredForM20 = document.getElementById('energyRequiredForM20');
    const baseRecipeEnergy = document.getElementById('baseRecipeEnergy');
    const recipeEnergy = document.getElementById('recipeEnergy');

    const MAX_FIELD_BONUS = 75;
    const MAX_RECIPE_LEVEL = 65;

    // イベント: フィールド名変更
    selectFieldName.addEventListener('change', () => {
        const fieldName = selectFieldName.value;
        energyRequiredForM20.textContent = '';
        if (fieldName) calcM20Energy(fieldName);
    });

    // イベント: トップ5フィルター
    document.getElementById('filterTop5').addEventListener('change', loadRecipes);

    // イベント: 料理選択
    recipesList.addEventListener('change', () => {
        const energy = getSelectedRecipeEnergy();
        if (energy) {
            baseRecipeEnergy.textContent = Intl.NumberFormat('ja-JP').format(energy);
            calcRecipeBonus(recipeLevel.value, energy);
        } else {
            baseRecipeEnergy.textContent = '';
            recipeEnergy.textContent = '';
        }
    });

    // イベント: レシピレベル選択
    recipeLevel.addEventListener('change', () => {
        const energy = getSelectedRecipeEnergy();
        if (energy) {
            calcRecipeBonus(recipeLevel.value, energy);
        } else {
            recipeEnergy.textContent = '';
        }
    });

    // 初期化
    await loadFieldNames();
    await loadRecipes();
    setFieldBonusOptions();
    setRecipeLevel();
    calcRecipeBonus(recipeLevel.value, getSelectedRecipeEnergy());

    // --- 関数定義 ---

    // 選択中の料理のエナジー値を取得
    function getSelectedRecipeEnergy() {
        const selected = recipesList.selectedOptions[0];
        return selected ? Number(selected.getAttribute('data-energy')) : '';
    }

    // フィールド名一覧をAPIから取得し、セレクトボックスに反映
    async function loadFieldNames() {
        try {
            const response = await fetch('/api/getFieldNames');
            if (!response.ok) throw new Error('API取得エラー');
            const data = await response.json();
            selectFieldName.innerHTML = '';
            selectFieldName.appendChild(createOption('', '選択してください'));
            data.forEach(type => selectFieldName.appendChild(createOption(type, type)));
        } catch (error) {
            console.error('ドロップダウン取得エラー:', error);
        }
    }

    // レシピ一覧をAPIから取得し、カテゴリごとに並べて表示
    async function loadRecipes() {
        try {
            const response = await fetch('/api/getRecipes');
            if (!response.ok) throw new Error('API取得エラー');
            const data = await response.json();

            recipesList.innerHTML = '';
            recipesList.appendChild(createOption('', '選択してください'));

            for (const category in data) {
                const categoryOption = document.createElement('optgroup');
                categoryOption.label = getCategoryLabel(category);

                // レシピエナジー降順でソート
                let sortedRecipes = data[category].slice().sort((a, b) => {
                    if (a.recipeEnergy == null) return 1;
                    if (b.recipeEnergy == null) return -1;
                    return b.recipeEnergy - a.recipeEnergy;
                });
                // トップ5のみ表示の場合
                if (isTop5FilterOn()) sortedRecipes = sortedRecipes.slice(0, 5);

                // option生成
                sortedRecipes.forEach(recipe => {
                    const option = createOption(recipe.dishName, recipe.dishName);
                    option.setAttribute('data-energy', recipe.recipeEnergy ?? '');
                    categoryOption.appendChild(option);
                });
                recipesList.appendChild(categoryOption);
            }
        } catch (error) {
            console.error('ドロップダウン取得エラー:', error);
        }
    }

    // フィールド名・ランクを元にM20必要エナジーをAPIから取得・表示
    async function calcM20Energy(fieldName) {
        try {
            const response = await fetch('/api/calcEnergy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fieldName, RankType: "マスター", RankNumber: 20 })
            });
            if (!response.ok) throw new Error('データ取得APIエラー');
            const data = await response.json();
            energyRequiredForM20.textContent = Intl.NumberFormat('ja-JP').format(data.energyRequiredForM20);
        } catch (error) {
            console.error('データ取得エラー:', error);
        }
    }

    // レシピレベルと基礎エナジーからボーナス計算し、結果を表示
    async function calcRecipeBonus(level, baseEnergy) {
        try {
            const response = await fetch(`/api/getRecipeBonus?level=${encodeURIComponent(level)}`);
            if (!response.ok) throw new Error('レシピボーナス取得エラー');
            const data = await response.json();
            const bonus = 1 + (data / 100);
            const result = Math.round(baseEnergy * bonus); // 四捨五入
            recipeEnergy.textContent = Intl.NumberFormat('ja-JP').format(result);
        } catch (error) {
            recipeEnergy.textContent = '';
            console.error('レシピボーナス取得エラー:', error);
        }
    }

    // フィールドボーナスの選択肢を0～MAX_FIELD_BONUSまで5刻みで生成
    function setFieldBonusOptions() {
        fieldBonus.innerHTML = '';
        for (let i = 0; i <= MAX_FIELD_BONUS; i += 5) {
            const option = createOption(i, i);
            if (i === 75) option.selected = true;
            fieldBonus.appendChild(option);
        }
    }

    // レシピレベルの選択肢を0～MAX_RECIPE_LEVELまで5刻みで生成
    function setRecipeLevel() {
        recipeLevel.innerHTML = '';
        for (let i = 0; i <= MAX_RECIPE_LEVEL; i += 5) {
            const option = createOption(i, i);
            if (i === 60) option.selected = true;
            recipeLevel.appendChild(option);
        }
    }

    // トップ5フィルターがONかどうかを返す
    function isTop5FilterOn() {
        return document.getElementById('filterTop5').checked;
    }

    // option要素を生成
    function createOption(value, text) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        return option;
    }

    // カテゴリ名を日本語ラベルに変換
    function getCategoryLabel(category) {
        switch (category) {
            case 'curry': return 'カレー';
            case 'salad': return 'サラダ';
            case 'dessert_drinks': return 'デザート・ドリンク';
            default: return category;
        }
    }
});
