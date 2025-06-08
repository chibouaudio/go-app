document.addEventListener('DOMContentLoaded', async function () {
    const selectFieldName = document.getElementById('fieldName');
    const energyRequiredForM20 = document.getElementById('energyRequiredForM20');
    const recipesList = document.getElementById('recipesList');
    const baseRecipeEnergy = document.getElementById('baseRecipeEnergy');
    const fieldBonus = document.getElementById('fieldBonus');
    const recipeLevel = document.getElementById('recipeLevel');

    const MAX_FIELD_BONUS = 75;
    const MAX_RECIPE_LEVEL = 65;

    // フィールド名のドロップダウンの変更イベント
    selectFieldName.addEventListener('change', function () {
        const fieldName = this.value;
        if (!fieldName) {
            energyRequiredForM20.textContent = "";
            return;
        }
        calcM20Energy(fieldName);
    })

    // トップ5フィルターのチェックボックスの変更イベント
    document.getElementById('filterTop5').addEventListener('change', () => {
        loadRecipes();
    });

    // レシピのドロップダウンの変更イベント
    recipesList.addEventListener('change', function () {
        const selectedOption = this.selectedOptions[0];
        const energy = selectedOption ? selectedOption.getAttribute('data-energy') : '';
        if (energy) {
            baseRecipeEnergy.textContent = Intl.NumberFormat('ja-JP').format(energy);
        } else {
            baseRecipeEnergy.textContent = '';
        }
    });

    // 初期データの読み込み
    async function loadData() {
        await loadFieldNames()
        await loadRecipes()
        setFieldBonusOptions();
        setRecipeLevel();
    }

    // フィールド名を取得する
    async function loadFieldNames() {
        try {
            const response = await fetch('/api/getFieldNames', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok) {
                console.error('API取得エラー');
                return;
            }
            const data = await response.json();

            selectFieldName.innerHTML = '';
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '選択してください';
            selectFieldName.appendChild(defaultOption);

            // データからoptionを追加
            data.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                selectFieldName.appendChild(option);
            });
        } catch (error) {
            console.error('ドロップダウン取得エラー:', error);
        }
    }

    // M20の必要エネルギーを計算する
    async function calcM20Energy(fieldName) {
        if (!fieldName) {
            return;
        }

        try {
            const response = await fetch(`/api/calcEnergy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fieldName: fieldName,
                    RankType: "マスター",
                    RankNumber: 20
                })
            });

            if (!response.ok) {
                console.error('データ取得APIエラー:', response.statusText);
                return;
            }

            const data = await response.json();
            energyRequiredForM20.textContent = Intl.NumberFormat('ja-JP', { useGrouping: true }).format(data.energyRequiredForM20)

        } catch (error) {
            console.error('データ取得エラー:', error);
        }
    }

    // レシピのドロップダウンを表示する
    async function loadRecipes() {
        try {
            const response = await fetch('/api/getRecipes', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok) {
                console.error('API取得エラー');
                return;
            }
            const data = await response.json();

            recipesList.innerHTML = '';
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '選択してください';
            recipesList.appendChild(defaultOption);

            for (const category in data) {
                const categoryOption = document.createElement('optgroup');
                let categoryLabel;
                switch (category) {
                    case 'curry':
                        categoryLabel = 'カレー';
                        break;
                    case 'salad':
                        categoryLabel = 'サラダ';
                        break;
                    case 'dessert_drinks':
                        categoryLabel = 'デザート・ドリンク';
                        break;
                }
                categoryOption.label = categoryLabel;

                let sortedRecipes = data[category].slice().sort((a, b) => {
                    if (a.recipeEnergy == null) return 1;
                    if (b.recipeEnergy == null) return -1;
                    return b.recipeEnergy - a.recipeEnergy;
                });
                if (isTop5FilterOn()) {
                    sortedRecipes = sortedRecipes.slice(0, 5);
                }

                sortedRecipes.forEach(recipe => {
                    const option = document.createElement('option');
                    option.value = recipe.dishName;
                    option.textContent = recipe.dishName;
                    option.setAttribute('data-energy', recipe.recipeEnergy ?? '');
                    categoryOption.appendChild(option);
                });

                recipesList.appendChild(categoryOption);
            }
        } catch (error) {
            console.error('ドロップダウン取得エラー:', error);
        }
    }

    // レシピレベルの選択肢を設定する
    function setRecipeLevel() {
        recipeLevel.innerHTML = '';
        for (let i = 0; i <= MAX_RECIPE_LEVEL; i += 5) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i === 60) {
                option.selected = true;
            }
            recipeLevel.appendChild(option);
        }
    }

    // トップ5のみ表示するかどうか
    function isTop5FilterOn() {
        return document.getElementById('filterTop5').checked;
    }

    // フィールドボーナスの選択肢
    function setFieldBonusOptions() {
        fieldBonus.innerHTML = '';
        for (let i = 0; i <= MAX_FIELD_BONUS; i += 5) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i === 75) {
                option.selected = true;
            }
            fieldBonus.appendChild(option);
        }
    }

    await loadData();
});
