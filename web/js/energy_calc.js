document.addEventListener('DOMContentLoaded', async () => {
    // 要素取得
    const selectFieldName = document.getElementById('fieldName');
    const recipesList = document.getElementById('recipesList');
    const fieldBonus = document.getElementById('fieldBonus');
    const filterEvent = document.getElementById('filterEvent');
    const recipeLevel = document.getElementById('recipeLevel');
    const skillChance = document.getElementById('skillChance');
    const skillLevel = document.getElementById('skillLevel');
    const resultM20Energy = document.getElementById('resultM20Energy');
    const resultBaseRecipeEnergy = document.getElementById('resultBaseRecipeEnergy');
    const resultRecipeEnergy = document.getElementById('resultRecipeEnergy');
    const resultWeeklyEnergy = document.getElementById('resultWeeklyEnergy');
    const resultIsEnergyRequirementMet = document.getElementById('resultIsEnergyRequirementMet');

    const MAX_FIELD_BONUS = 75;
    const MAX_RECIPE_LEVEL = 65;
    const MAX_SKILL_LEVEL = 6;

    // --- デバウンス関数定義 ---
    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            const context = this;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(context, args);
            }, delay);
        };
    }
    const debouncedUpdateRecipeEnergies = debounce(updateRecipeEnergies, 300);
    skillChance.addEventListener('input', debouncedUpdateRecipeEnergies);

    // イベントリスナー設定
    selectFieldName.addEventListener('change', updateRecipeEnergies);
    recipesList.addEventListener('change', updateRecipeEnergies);
    recipeLevel.addEventListener('change', updateRecipeEnergies);
    skillLevel.addEventListener('change', updateRecipeEnergies);
    filterEvent.addEventListener('change', updateRecipeEnergies);
    fieldBonus.addEventListener('change', updateRecipeEnergies);

    // 初期化
    await loadFieldNames();
    await loadRecipes();
    setFieldBonusOptions();
    setRecipeLevel();
    setSkillLevel();

    // --- 関数定義 ---

    // 料理・レシピレベル・スキル発生回数変更時の再計算
    async function updateRecipeEnergies() {
        if (!selectFieldName.value || !recipesList.value) {
            resultM20Energy.textContent = 0;
            resultBaseRecipeEnergy.textContent = 0;
            resultRecipeEnergy.textContent = 0;
            resultWeeklyEnergy.textContent = 0;
            resultIsEnergyRequirementMet.textContent = 0;
            return;
        }
        const m20Energy = await calcM20Energy(selectFieldName.value);
        const baseEnergy = getSelectedRecipeEnergy();
        const energy = await getDishEnergy(recipeLevel.value, baseEnergy);
        const weeklyEnergy = await getWeeklyDishEnergy(
            energy,
            parseInt(skillLevel.value),
            parseFloat(skillChance.value),
            parseFloat(fieldBonus.value),
            filterEvent.checked
        );
        if (weeklyEnergy === null) {
            return;
        }

        resultM20Energy.textContent = Intl.NumberFormat('ja-JP').format(m20Energy);
        resultBaseRecipeEnergy.textContent = Intl.NumberFormat('ja-JP').format(baseEnergy);
        resultRecipeEnergy.textContent = Intl.NumberFormat('ja-JP').format(energy);
        resultWeeklyEnergy.textContent = Intl.NumberFormat('ja-JP').format(weeklyEnergy);

        // 両方の値が取得できている場合のみ requiredM20Energy を実行
        if (m20Energy != null && weeklyEnergy != null && m20Energy !== '' && weeklyEnergy !== '') {
            const diff = requiredM20Energy(m20Energy, weeklyEnergy);
            if (resultIsEnergyRequirementMet) {
                resultIsEnergyRequirementMet.textContent = Intl.NumberFormat('ja-JP').format(diff);
                if (diff < 0) {
                    resultIsEnergyRequirementMet.classList.add('text-danger');
                    resultIsEnergyRequirementMet.classList.remove('text-success');
                } else {
                    resultIsEnergyRequirementMet.classList.add('text-success');
                    resultIsEnergyRequirementMet.classList.remove('text-danger');
                }
            }
        }
    }

    // 週エナジーをAPIから取得・表示
    /**
     * 週エナジーを計算する関数
     * @param {number} energy - 料理エナジー
     * @param {number} skillLevel - スキルレベル
     * @param {number} skillActivationsPerDay - スキル発生回数/日
     * @param {number} fieldBonus - フィールドボーナス
     * @param {boolean} filterEvent - イベントフィルターの有無
     * @returns {Promise<number>} 週エナジーの値
     */
    async function getWeeklyDishEnergy(energy, skillLevel, skillActivationsPerDay, fieldBonus, filterEvent) {
        try {
            const response = await fetch(`/api/calcWeeklyEnergy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    energy: energy,
                    skillLevel: skillLevel,
                    skillActivationsPerDay: skillActivationsPerDay,
                    fieldBonus: fieldBonus,
                    filterEvent: filterEvent
                })
            });
            if (!response.ok) throw new Error('週エナジー計算APIエラー');
            const data = await response.json();
            return data.weeklyEnergy;
        } catch (error) {
            console.error('週エナジー計算エラー:', error);
            return 0;
        }
    }

    // M20必要エナジーをAPIから取得・表示
    async function calcM20Energy(fieldName) {
        if (!fieldName) {
            return 0;
        }
        try {
            const response = await fetch('/api/calcEnergy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fieldName, RankType: "マスター", RankNumber: 20 })
            });
            if (!response.ok) throw new Error('エナジー計算APIエラー');
            const data = await response.json();
            return data.energyRequiredForM20;
        } catch (error) {
            console.error('エナジー計算APIエラー:', error);
            return 0;
        }
    }

    // レシピレベル・基礎エナジーから料理エナジーを計算し、値を返す
    async function getDishEnergy(recipeLevel, baseEnergy) {
        try {
            const response = await fetch(`/api/getRecipeBonus?level=${encodeURIComponent(recipeLevel)}`);
            if (!response.ok) throw new Error('レシピボーナス取得エラー');
            const data = await response.json();
            let bonus = 1 + (data / 100);
            const result = Math.round(baseEnergy * bonus);
            return result;
        } catch (error) {
            resultRecipeEnergy.textContent = '';
            console.error('レシピボーナス取得エラー:', error);
            return 0;
        }
    }

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

                let sortedRecipes = data[category].slice().sort((a, b) => {
                    if (a.recipeEnergy == null) return 1;
                    if (b.recipeEnergy == null) return -1;
                    return b.recipeEnergy - a.recipeEnergy;
                });
                if (isTop5FilterOn()) sortedRecipes = sortedRecipes.slice(0, 5);

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

    function requiredM20Energy(m20Energy, resultWeeklyEnergy) {
        if (selectFieldName.value !== '' && resultWeeklyEnergy !== '') {
            const result = resultWeeklyEnergy - m20Energy;
            return Math.round(result * 100) / 100;
        } else {
            return 0;
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
            if (i === 65) option.selected = true;
            recipeLevel.appendChild(option);
        }
    }

    // スキルレベルの選択肢を0～MAX_SKILL_LEVELまで生成
    function setSkillLevel() {
        skillLevel.innerHTML = '';
        for (let i = 0; i <= MAX_SKILL_LEVEL; i++) {
            const option = createOption(i, i);
            if (i === 6) option.selected = true;
            skillLevel.appendChild(option);
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
