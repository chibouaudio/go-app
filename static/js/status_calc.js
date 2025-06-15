"use strict";
/**
 * ポケモンのステータス計算・表示ロジック
 * 各関数・変数には説明コメントを付与
 */
document.addEventListener("DOMContentLoaded", async function () {
    // --- DOM要素取得 ---
    const selectPokemonName = document.getElementById("selectPokemonName");
    const personality = document.getElementById("personality");
    const resultSpeedOfHelp = document.getElementById("resultSpeedOfHelp");
    const level = document.getElementById("level");
    const subSkillButtons = document.getElementById("subSkillButtons");
    const modal = document.getElementById("subSkillModal");
    const openModalButton = document.getElementById("btnSubSkill");
    const closeModalButton = document.getElementById("closeSubSkillModal");
    const selectedSubSkilllabel = document.getElementById("selectedSubSkilllabel");
    const selectIngredientA = document.getElementById("selectIngredientA");
    const selectIngredientB = document.getElementById("selectIngredientB");
    const selectIngredientC = document.getElementById("selectIngredientC");
    const resultHelpingCount = document.getElementById("resultHelpingCount");
    const resultIngredientsCount = document.getElementById("resultIngredientsCount");
    const resultNumberOfIngredients = document.getElementById("resultNumberOfIngredients");
    const resultSkillCount = document.getElementById("resultSkillCount");
    // --- 定数 ---
    const badgeNumbers = [10, 25, 50, 75, 100]; // サブスキル選択時のバッジ番号
    const MAX_SUB_SUBSKILLS = 5; // サブスキル最大数
    class PokemonStatusClass {
        constructor() {
            this.selectedPokemonNo = 1;
            this.selectedPokemonName = "";
            this.pokemonData = {};
            this.level = 1;
            this.personality = "normal";
            this.selectedIngredientA = "";
            this.ingredientAValue = 0;
            this.selectedIngredientB = "";
            this.ingredientBValue = 0;
            this.selectedIngredientC = "";
            this.ingredientCValue = 0;
            this.selectedSubSkills = [];
            this.speedOfHelping = 0;
            this.helpingCount = 0;
        }
        reset() {
            this.selectedPokemonNo = 1;
            this.selectedPokemonName = "";
            this.pokemonData = {};
            this.level = 1;
            this.personality = "normal";
            this.selectedIngredientA = "";
            this.ingredientAValue = 0;
            this.selectedIngredientB = "";
            this.ingredientBValue = 0;
            this.selectedIngredientC = "";
            this.ingredientCValue = 0;
            this.selectedSubSkills = [];
            this.speedOfHelping = 0;
            this.helpingCount = 0;
        }
    }
    // --- 初期化処理 ---
    const pokemonStatus = new PokemonStatusClass();
    // ポケモンのデータ一覧を設定
    await setPokemonData();
    // 選択されたポケモンのIDからNoを取得
    pokemonStatus.selectedPokemonNo = parseInt(selectPokemonName.value);
    // ポケモンのデータを取得
    pokemonStatus.pokemonData = await getSelectedPokemonData();
    // 食材構成を設定
    setIngredientOptions();
    // サブスキル選択モーダルを初期化
    setSubSkillModal();
    // 選択されたポケモンの情報を取得
    await loadStatus();
    // --- イベントリスナー登録 ---
    selectPokemonName?.addEventListener("change", async () => {
        // 選択されたポケモンのIDからNoを取得
        pokemonStatus.selectedPokemonNo = parseInt(selectPokemonName.value);
        // ポケモンのデータを取得
        pokemonStatus.pokemonData = await getSelectedPokemonData();
        // 選択されたポケモンの食材構成を設定
        setIngredientOptions();
        loadStatus();
    });
    personality?.addEventListener("change", loadStatus);
    level?.addEventListener("change", loadStatus);
    subSkillButtons?.addEventListener("click", loadStatus);
    selectIngredientA?.addEventListener("change", loadStatus);
    selectIngredientB?.addEventListener("change", loadStatus);
    selectIngredientC?.addEventListener("change", loadStatus);
    /**
     * ポケモン名取得APIをAPIから取得し、セレクトボックスに反映
     */
    async function setPokemonData() {
        try {
            const response = await fetch('/api/getPokemonNames', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok)
                throw new Error("ポケモン名取得失敗");
            const pokemonList = await response.json();
            if (selectPokemonName) {
                selectPokemonName.innerHTML = "";
                pokemonList.forEach((pokemon) => {
                    const option = document.createElement("option");
                    option.value = pokemon.No.toString();
                    option.textContent = pokemon.Name;
                    selectPokemonName.appendChild(option);
                });
            }
        }
        catch (error) {
            console.error('ポケモン名取得エラー:', error);
        }
    }
    /**
     * ステータス計算＆画面表示
     */
    async function loadStatus() {
        if (!resultSpeedOfHelp || !resultHelpingCount || !resultNumberOfIngredients || !resultIngredientsCount || !resultSkillCount)
            return;
        // 選択されたポケモンのIDからNoを取得
        pokemonStatus.selectedPokemonNo = parseInt(selectPokemonName.value);
        // ポケモンのデータを取得
        pokemonStatus.pokemonData = await getSelectedPokemonData();
        // 選択されたポケモンの食材構成を設定
        // setIngredientOptions();
        // 選択されたポケモン名を保存
        pokemonStatus.selectedPokemonName = pokemonStatus.pokemonData.Name;
        // ポケモンのレベルを取得
        pokemonStatus.level = parseInt(level.value, 10) || 1;
        // ポケモンの性格を取得
        pokemonStatus.personality = personality.value;
        // 選択された食材を取得
        pokemonStatus.selectedIngredientA = selectIngredientA.value;
        pokemonStatus.selectedIngredientB = selectIngredientB.value;
        pokemonStatus.selectedIngredientC = selectIngredientC.value;
        // 食材の個数を取得
        getIngredientAmount();
        // おてつだいスピードを取得
        pokemonStatus.speedOfHelping = await getSpeedOfHelp();
        // おてつだい回数を取得
        pokemonStatus.helpingCount = await getHelpingCount(100);
        // 食材獲得量を計算
        const numberOfIngredients = getNumberOfIngredients();
        // 食材獲得回数を計算
        const ingredientCount = Math.round(pokemonStatus.pokemonData.FoodDropRate * pokemonStatus.helpingCount * 100) / 100;
        // スキル発生回数を計算
        const skillCount = getSkillCount();
        // 表示する時間をフォーマット
        const minutes = Math.floor(pokemonStatus.speedOfHelping / 60);
        const seconds = pokemonStatus.speedOfHelping % 60;
        resultSpeedOfHelp.textContent = `${pokemonStatus.speedOfHelping} : ${minutes}分${seconds}秒`;
        resultHelpingCount.textContent = pokemonStatus.helpingCount.toString();
        resultNumberOfIngredients.textContent = numberOfIngredients.toString();
        resultIngredientsCount.textContent = ingredientCount.toString();
        resultSkillCount.textContent = skillCount.toString();
    }
    /**
     * 選択中ポケモンの詳細データをAPIから取得
     */
    async function getSelectedPokemonData() {
        try {
            const response = await fetch('/api/getPokemonData', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ No: pokemonStatus.selectedPokemonNo })
            });
            if (!response.ok)
                throw new Error("ポケモンスピード取得失敗");
            return await response.json();
        }
        catch (error) {
            console.error('ポケモンスピード取得エラー:', error);
            return {};
        }
    }
    /**
     * おてつだいスピード（秒）を計算
     */
    async function getSpeedOfHelp() {
        const baseSpeedOfHelp = pokemonStatus.pokemonData.SpeedOfHelp;
        const pokemonLevel = pokemonStatus.level;
        const helpingSpeedM = pokemonStatus.selectedSubSkills.some(s => s.subskill === "おてつだいスピードM");
        const helpingSpeedS = pokemonStatus.selectedSubSkills.some(s => s.subskill === "おてつだいスピードS");
        const helpingBonus = countHelpingBonus();
        const goodNightRibbon = { goodNightRibbonTime: 0, evolveCount: 2 };
        const levelModifier = 1 - (pokemonLevel - 1) * 0.002;
        const personalityModifier = getPersonalityModifier(pokemonStatus.personality);
        const subSkillModifier = 1 - getSubSkillModifier(helpingSpeedM, helpingSpeedS, helpingBonus);
        const goodNightRibbonModifier = 1 - getGoodNightRibbon(goodNightRibbon);
        return Math.floor(baseSpeedOfHelp * levelModifier * personalityModifier * subSkillModifier * goodNightRibbonModifier);
    }
    /**
     * おてつだい回数をAPIで計算
     */
    async function getHelpingCount(genki) {
        if (!genki)
            return 0;
        try {
            const response = await fetch('/api/calcHelpingCount', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    maxGenki: genki,
                    helpingSpeed: pokemonStatus.speedOfHelping,
                    breakfast: 9.0,
                    lunch: 13.0,
                    dinner: 19.0,
                })
            });
            const data = await response.json();
            return Math.round(data.helpingCount * 100) / 100;
        }
        catch (error) {
            console.error('おてつだい回数取得エラー:', error);
            return 0;
        }
    }
    function getSkillCount() {
        let skillRate = pokemonStatus.pokemonData.SkillRate;
        const helpingCount = pokemonStatus.helpingCount;
        if (!skillRate || !helpingCount)
            return 0;
        const skillUpM = pokemonStatus.selectedSubSkills.some(s => s.subskill === "スキル確率アップM");
        const skillUpS = pokemonStatus.selectedSubSkills.some(s => s.subskill === "スキル確率アップS");
        if (skillUpM)
            skillRate *= 1.36;
        if (skillUpS)
            skillRate *= 1.18;
        return Math.round(skillRate * helpingCount * 100) / 100;
    }
    /**
     * 選択された食材の個数を取得
     */
    function getIngredientAmount() {
        const ingredientsA = pokemonStatus.pokemonData.IngredientsA;
        const ingredientsB = pokemonStatus.pokemonData.IngredientsB;
        const ingredientsC = pokemonStatus.pokemonData.IngredientsC;
        if (!ingredientsA || !ingredientsB || !ingredientsC)
            return [];
        ingredientsA.forEach((ingredient) => {
            if (ingredient.name === pokemonStatus.selectedIngredientA) {
                pokemonStatus.ingredientAValue = ingredient.value;
            }
        });
        ingredientsB.forEach((ingredient) => {
            if (ingredient.name === pokemonStatus.selectedIngredientB) {
                pokemonStatus.ingredientBValue = ingredient.value;
            }
        });
        ingredientsC.forEach((ingredient) => {
            if (ingredient.name === pokemonStatus.selectedIngredientC) {
                pokemonStatus.ingredientCValue = ingredient.value;
            }
        });
    }
    /**
     * 獲得食材数を計算
     */
    function getNumberOfIngredients() {
        const ingredientValues = {};
        let selectedIngredients = [];
        let foodRate = pokemonStatus.pokemonData.FoodDropRate;
        const ingredientFinderM = pokemonStatus.selectedSubSkills.some(s => s.subskill === "食材確率アップM");
        const ingredientFinderS = pokemonStatus.selectedSubSkills.some(s => s.subskill === "食材確率アップS");
        if (ingredientFinderM)
            foodRate *= 1.36;
        if (ingredientFinderS)
            foodRate *= 1.18;
        console.log("食材獲得率:", foodRate);
        if (pokemonStatus.level < 30) {
            selectedIngredients = [
                { name: pokemonStatus.selectedIngredientA, value: pokemonStatus.ingredientAValue }
            ];
        }
        else if (pokemonStatus.level < 60) {
            selectedIngredients = [
                { name: pokemonStatus.selectedIngredientA, value: pokemonStatus.ingredientAValue },
                { name: pokemonStatus.selectedIngredientB, value: pokemonStatus.ingredientBValue }
            ];
        }
        else {
            selectedIngredients = [
                { name: pokemonStatus.selectedIngredientA, value: pokemonStatus.ingredientAValue },
                { name: pokemonStatus.selectedIngredientB, value: pokemonStatus.ingredientBValue },
                { name: pokemonStatus.selectedIngredientC, value: pokemonStatus.ingredientCValue }
            ];
        }
        // 選択した食材のnameとvalueを配列でまとめる
        selectedIngredients.forEach(({ name, value }) => {
            if (!ingredientValues[name]) {
                ingredientValues[name] = [];
            }
            ingredientValues[name].push(value);
        });
        // nameごとにvalueの平均を計算し、2次元配列で返す
        const resultArr = Object.entries(ingredientValues).map(([name, values]) => {
            const dividedValues = values.map(v => v / selectedIngredients.length);
            const resultAmounts = dividedValues.map(v => pokemonStatus.helpingCount * foodRate * v);
            const resultAmount = resultAmounts.reduce((sum, val) => sum + val, 0);
            return [name, Math.round(resultAmount * 10) / 10];
        });
        return resultArr;
    }
    /**
     * 性格による補正値を取得
     */
    function getPersonalityModifier(personality) {
        switch (personality) {
            case "normal": return 1;
            case "down": return 1.075;
            case "up": return 0.9;
            default: return 1;
        }
    }
    /**
     * サブスキルによる補正値を取得
     */
    function getSubSkillModifier(helpingSpeedM, helpingSpeedS, helpingBonus) {
        let totalModifier = 0;
        if (helpingSpeedM)
            totalModifier += 0.14;
        if (helpingSpeedS)
            totalModifier += 0.07;
        for (let i = 0; i < helpingBonus; i++)
            totalModifier += 0.05;
        return Math.min(totalModifier, 0.35);
    }
    /**
     * おやすみリボンによる補正値を取得
     */
    function getGoodNightRibbon(goodNightRibbon) {
        const { goodNightRibbonTime: sleepTime, evolveCount } = goodNightRibbon;
        if (evolveCount === 2)
            return 0;
        if (evolveCount === 1) {
            if (sleepTime === 2000)
                return 0.12;
            if (sleepTime === 500)
                return 0.05;
        }
        if (evolveCount === 0) {
            if (sleepTime === 2000)
                return 0.25;
            if (sleepTime === 500)
                return 0.11;
        }
        return 0;
    }
    /**
     * おてつだいボーナスサブスキル数をカウント
     */
    function countHelpingBonus() {
        const count = pokemonStatus.selectedSubSkills.filter(s => s.subskill.startsWith("おてつだいボーナス")).length;
        return Math.min(count, 5);
    }
    /**
     * 食材セレクトボックスをポケモンデータから生成
     */
    function setIngredientOptions() {
        if (!selectIngredientA || !selectIngredientB || !selectIngredientC)
            return;
        const ingredientsA = pokemonStatus.pokemonData.IngredientsA;
        const ingredientsB = pokemonStatus.pokemonData.IngredientsB;
        const ingredientsC = pokemonStatus.pokemonData.IngredientsC;
        const composition = ["A", "B", "C"];
        selectIngredientA.innerHTML = "";
        if (ingredientsA) {
            ingredientsA.forEach((ingredient, i) => {
                const option = document.createElement("option");
                option.value = ingredient.name.toString();
                option.textContent = composition[i] + " : " + ingredient.name + " ( " + ingredient.value + " )";
                selectIngredientA.appendChild(option);
            });
        }
        selectIngredientB.innerHTML = "";
        if (ingredientsB) {
            ingredientsB.forEach((ingredient, i) => {
                const option = document.createElement("option");
                option.value = ingredient.name.toString();
                option.textContent = composition[i] + " : " + ingredient.name + " ( " + ingredient.value + " )";
                selectIngredientB.appendChild(option);
            });
        }
        selectIngredientC.innerHTML = "";
        if (ingredientsC) {
            ingredientsC.forEach((ingredient, i) => {
                const option = document.createElement("option");
                option.value = ingredient.name.toString();
                option.textContent = composition[i] + " : " + ingredient.name + " ( " + ingredient.value + " )";
                selectIngredientC.appendChild(option);
            });
        }
    }
    /**
     * サブスキル選択モーダルの初期化
     */
    async function setSubSkillModal() {
        if (!subSkillButtons || !modal || !openModalButton || !closeModalButton)
            return;
        const data = await getSubSkills();
        if (!data)
            return;
        subSkillButtons.innerHTML = "";
        const buttonRow = document.createElement("div");
        buttonRow.className = "row";
        subSkillButtons.appendChild(buttonRow);
        data.forEach((element) => {
            const colDiv = document.createElement("div");
            colDiv.className = "col-12 col-md-6 mb-2";
            const button = document.createElement("button");
            button.type = "button";
            button.className = "subskill-btn btn btn-outline-secondary w-100";
            button.classList.add(element.color + "-skill");
            button.textContent = element.subskill;
            button.setAttribute("data-subskill", element.subskill);
            button.onclick = () => {
                const idx = pokemonStatus.selectedSubSkills.findIndex(s => s.subskill === element.subskill);
                if (idx >= 0) {
                    pokemonStatus.selectedSubSkills.splice(idx, 1);
                }
                else if (pokemonStatus.selectedSubSkills.length < MAX_SUB_SUBSKILLS) {
                    pokemonStatus.selectedSubSkills.push(element);
                }
                updateButtonStates();
                updateSelectedDisplay();
            };
            colDiv.appendChild(button);
            buttonRow.appendChild(colDiv);
        });
        openModalButton.onclick = () => {
            modal.style.display = "block";
            modal.classList.add("show");
        };
        closeModalButton.onclick = () => {
            modal.style.display = "none";
            modal.classList.remove("show");
            loadStatus();
        };
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
                modal.classList.remove("show");
                loadStatus();
            }
        };
    }
    /**
     * サブスキル一覧をAPIから取得
     */
    async function getSubSkills() {
        try {
            const response = await fetch('/api/getSubSkills');
            if (!response.ok)
                throw new Error("サブスキル取得失敗");
            return await response.json();
        }
        catch (error) {
            console.error('サブスキル取得エラー:', error);
            return undefined;
        }
    }
    /**
     * サブスキルボタンの状態を更新
     */
    function updateButtonStates() {
        if (!subSkillButtons)
            return;
        const buttons = subSkillButtons.querySelectorAll("button");
        buttons.forEach(btn => {
            const subskill = btn.getAttribute("data-subskill");
            const idx = pokemonStatus.selectedSubSkills.findIndex(s => s.subskill === subskill);
            // 既存バッジを削除
            const oldBadge = btn.querySelector('.subskill-badge');
            if (oldBadge)
                oldBadge.remove();
            if (idx >= 0) {
                btn.classList.add("selected");
                const badge = document.createElement("span");
                badge.className = "subskill-badge";
                badge.textContent = badgeNumbers[idx]?.toString() ?? "";
                btn.prepend(badge);
            }
            else {
                btn.classList.remove("selected");
            }
        });
    }
    /**
     * 選択中サブスキルの表示を更新
     */
    function updateSelectedDisplay() {
        if (!selectedSubSkilllabel)
            return;
        selectedSubSkilllabel.innerHTML = "";
        pokemonStatus.selectedSubSkills.forEach((s) => {
            const div = document.createElement("div");
            div.className = "col-12 col-md-6 mb-2 selected-subskill-item";
            const p = document.createElement("p");
            p.className = s.color + "-skill mb-0 py-2 px-3 rounded";
            p.textContent = s.subskill;
            div.appendChild(p);
            selectedSubSkilllabel.appendChild(div);
        });
    }
});
