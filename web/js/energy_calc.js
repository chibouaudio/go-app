document.addEventListener('DOMContentLoaded', async function () {
    const selectFieldName = document.getElementById('fieldName');
    const energyRequiredForM20 = document.getElementById('energyRequiredForM20');
    const recipesList = document.getElementById('recipesList');

    selectFieldName.addEventListener('change', function () {
        const fieldName = this.value;
        if (!fieldName) {
            energyRequiredForM20.textContent = "";
            return;
        }
        calcEnergy(fieldName);
    })

    document.getElementById('filterTop5').addEventListener('change', () => {
        loadRecipes();
    });

    async function loadData() {
        await loadFieldNames()
        await loadRecipes()
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
                    categoryOption.appendChild(option);
                });

                recipesList.appendChild(categoryOption);
            }
        } catch (error) {
            console.error('ドロップダウン取得エラー:', error);
        }
    }

    async function calcEnergy(fieldName) {
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

    // トップ5のみ表示するかどうか
    function isTop5FilterOn() {
        return document.getElementById('filterTop5').checked;
    }

    await loadData();
});
