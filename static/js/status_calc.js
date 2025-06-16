"use strict";
/**
 * ポケモンのステータス計算・表示ロジック
 * 各関数・変数には説明コメントを付与
 */
document.addEventListener("DOMContentLoaded", async function () {
    const DOM = {
        selectPokemonName: document.getElementById("selectPokemonName"),
        level: document.getElementById("level"),
        subSkillButtons: document.getElementById("subSkillButtons"),
        subSkillModal: document.getElementById("subSkillModal"),
        openSubSkillModalButton: document.getElementById("btnSubSkill"),
        closeSubSkillModalButton: document.getElementById("closeSubSkillModal"),
        selectedSubSkillLabel: document.getElementById("selectedSubSkilllabel"),
        selectIngredient: document.getElementById("selectIngredient"),
        resultHelpingCount: document.getElementById("resultHelpingCount"),
        resultSpeedOfHelp: document.getElementById("resultSpeedOfHelp"),
        resultNumberOfIngredients: document.getElementById("resultNumberOfIngredients"),
        resultSkillCount: document.getElementById("resultSkillCount"),
        personalityModal: document.getElementById("personalityModal"),
        openPersonalityModalButton: document.getElementById("openPersonalityModal"),
        closePersonalityModalButton: document.getElementById("personalityModalClose"),
        personalityUpGroup: document.getElementById("personality-up-group"),
        personalityDownGroup: document.getElementById("personality-down-group"),
        resultPersonalityName: document.getElementById("resultPersonalityName"),
        personalityNeutralBtn: document.getElementById("personalityNeutralBtn")
    };
    // --- 定数 ---
    const CONSTANTS = {
        BADGE_NUMBERS: [10, 25, 50, 75, 100], // サブスキル選択時のバッジ番号
        MAX_SUB_SKILLS: 5, // サブスキル最大数
        MAX_HELPING_SPEED_BONUS: 0.35, // サブスキルによる最大おてつだいスピード補正率
        BASE_GENKI: 100, // 基本げんき量
        LEVEL_MODIFIER_PER_LEVEL: 0.002, // レベルによる補正値
        PERSONALITY_MODIFIERS: {
            SPEED_UP: 0.9,
            SPEED_DOWN: 1.075,
            INGREDIENT_UP: 1.2,
            INGREDIENT_DOWN: 0.8,
            SKILL_UP: 1.2,
            SKILL_DOWN: 0.8,
            GENKI_UP: 1.2,
            GENKI_DOWN: 0.88
        },
        SUB_SKILL_MODIFIERS: {
            HELPING_SPEED_M: 0.14,
            HELPING_SPEED_S: 0.07,
            HELPING_BONUS: 0.05,
            INGREDIENT_CHANCE_M: 1.36,
            INGREDIENT_CHANCE_S: 1.18,
            SKILL_CHANCE_M: 1.36,
            SKILL_CHANCE_S: 1.18
        },
        GOOD_NIGHT_RIBBON_MODIFIERS: {
            EVOLVE_1_2000: 0.12,
            EVOLVE_1_500: 0.05,
            EVOLVE_0_2000: 0.25,
            EVOLVE_0_500: 0.11
        },
        MEAL_TIMES: {
            BREAKFAST: 9.0,
            LUNCH: 13.0,
            DINNER: 19.0
        },
        INGREDIENT_LEVEL_THRESHOLDS: {
            LEVEL_30: 30,
            LEVEL_60: 60
        }
    };
    /**
     * ポケモンの現在のステータスと選択状態、および計算ロジックを管理するクラス
     */
    class PokemonStatusManager {
        constructor() {
            this.selectedPokemonNo = 1;
            this.selectedPokemonName = "";
            this.pokemonData = {};
            this.level = 1;
            this.personality = {};
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
        /**
         * ステータスを初期状態にリセットする
         */
        reset() {
            this.selectedPokemonNo = 1;
            this.selectedPokemonName = "";
            this.pokemonData = {};
            this.level = 1;
            this.personality = {};
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
        /**
         * 選択中ポケモンの詳細データをAPIから取得し、インスタンスに設定する
         * @returns {Promise<any>} 取得したポケモンデータ
         */
        async fetchSelectedPokemonData() {
            try {
                const response = await fetch('/api/getPokemonData', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ No: this.selectedPokemonNo })
                });
                if (!response.ok)
                    throw new Error("ポケモンデータ取得失敗");
                this.pokemonData = await response.json();
                return this.pokemonData;
            }
            catch (error) {
                console.error('ポケモンデータ取得エラー:', error);
                return {};
            }
        }
        /**
         * 選択されたポケモンの食材データを保存する
         */
        setIngredientData() {
            const value = DOM.selectIngredient.value;
            switch (value) {
                case "0-AAA":
                    pokemonStatus.selectedIngredientA = pokemonStatus.pokemonData.IngredientsA[0].name;
                    pokemonStatus.selectedIngredientB = pokemonStatus.pokemonData.IngredientsB[0].name;
                    pokemonStatus.selectedIngredientC = pokemonStatus.pokemonData.IngredientsC[0].name;
                    break;
                case "1-AAB":
                    pokemonStatus.selectedIngredientA = pokemonStatus.pokemonData.IngredientsA[0].name;
                    pokemonStatus.selectedIngredientB = pokemonStatus.pokemonData.IngredientsB[0].name;
                    pokemonStatus.selectedIngredientC = pokemonStatus.pokemonData.IngredientsC[1].name;
                    break;
                case "2-AAC":
                    pokemonStatus.selectedIngredientA = pokemonStatus.pokemonData.IngredientsA[0].name;
                    pokemonStatus.selectedIngredientB = pokemonStatus.pokemonData.IngredientsB[0].name;
                    pokemonStatus.selectedIngredientC = pokemonStatus.pokemonData.IngredientsC[2].name;
                    break;
                case "3-ABA":
                    pokemonStatus.selectedIngredientA = pokemonStatus.pokemonData.IngredientsA[0].name;
                    pokemonStatus.selectedIngredientB = pokemonStatus.pokemonData.IngredientsB[1].name;
                    pokemonStatus.selectedIngredientC = pokemonStatus.pokemonData.IngredientsC[0].name;
                    break;
                case "4-ABB":
                    pokemonStatus.selectedIngredientA = pokemonStatus.pokemonData.IngredientsA[0].name;
                    pokemonStatus.selectedIngredientB = pokemonStatus.pokemonData.IngredientsB[1].name;
                    pokemonStatus.selectedIngredientC = pokemonStatus.pokemonData.IngredientsC[1].name;
                    break;
                case "5-ABC":
                    pokemonStatus.selectedIngredientA = pokemonStatus.pokemonData.IngredientsA[0].name;
                    pokemonStatus.selectedIngredientB = pokemonStatus.pokemonData.IngredientsB[1].name;
                    pokemonStatus.selectedIngredientC = pokemonStatus.pokemonData.IngredientsC[2].name;
                    break;
                default:
                    pokemonStatus.selectedIngredientA = pokemonStatus.pokemonData.IngredientsA[0].name;
                    pokemonStatus.selectedIngredientB = pokemonStatus.pokemonData.IngredientsB[0].name;
                    pokemonStatus.selectedIngredientC = pokemonStatus.pokemonData.IngredientsC[0].name;
                    break;
            }
        }
        /**
         * おてつだいスピード（秒）を計算する
         * @returns {number} 計算されたおてつだいスピード（秒）
         */
        calculateSpeedOfHelp() {
            const baseSpeedOfHelp = this.pokemonData.SpeedOfHelp;
            const pokemonLevel = this.level;
            const helpingSpeedM = this.selectedSubSkills.some(s => s.subskill === "おてつだいスピードM");
            const helpingSpeedS = this.selectedSubSkills.some(s => s.subskill === "おてつだいスピードS");
            const helpingBonus = this.countHelpingBonus();
            // TODO: goodNightRibbonTimeとevolveCountがどこから来るか明確にする必要あり
            const goodNightRibbon = { goodNightRibbonTime: 0, evolveCount: 2 };
            const levelModifier = 1 - (pokemonLevel - 1) * CONSTANTS.LEVEL_MODIFIER_PER_LEVEL;
            const personalityModifier = this.getPersonalitySpeedModifier();
            const subSkillModifier = 1 - this.getSubSkillSpeedModifier(helpingSpeedM, helpingSpeedS, helpingBonus);
            const goodNightRibbonModifier = 1 - this.getGoodNightRibbonModifier(goodNightRibbon);
            return Math.floor(baseSpeedOfHelp * levelModifier * personalityModifier * subSkillModifier * goodNightRibbonModifier);
        }
        /**
         * おてつだい回数をAPIで計算し、インスタンスに設定する
         * @returns {Promise<number>} 計算されたおてつだい回数
         */
        async calculateHelpingCount() {
            const genki = Math.min(CONSTANTS.BASE_GENKI * this.getPersonalityGenkiModifier(), 100);
            try {
                const response = await fetch('/api/calcHelpingCount', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        maxGenki: genki,
                        helpingSpeed: this.speedOfHelping,
                        breakfast: CONSTANTS.MEAL_TIMES.BREAKFAST,
                        lunch: CONSTANTS.MEAL_TIMES.LUNCH,
                        dinner: CONSTANTS.MEAL_TIMES.DINNER,
                    })
                });
                const data = await response.json();
                this.helpingCount = Math.round(data.helpingCount * 100) / 100;
                return this.helpingCount;
            }
            catch (error) {
                console.error('おてつだい回数取得エラー:', error);
                return 0;
            }
        }
        /**
         * スキル発生回数を計算する
         * @returns {number} 計算されたスキル発生回数
         */
        calculateSkillCount() {
            let skillRate = this.pokemonData.SkillRate;
            if (!skillRate || !this.helpingCount)
                return 0;
            const skillUpM = this.selectedSubSkills.some(s => s.subskill === "スキル確率アップM");
            const skillUpS = this.selectedSubSkills.some(s => s.subskill === "スキル確率アップS");
            if (skillUpM)
                skillRate *= CONSTANTS.SUB_SKILL_MODIFIERS.SKILL_CHANCE_M;
            if (skillUpS)
                skillRate *= CONSTANTS.SUB_SKILL_MODIFIERS.SKILL_CHANCE_S;
            skillRate *= this.getPersonalitySkillModifier();
            return Math.round(skillRate * this.helpingCount * 100) / 100;
        }
        /**
         * 獲得食材数を計算する
         * @returns {[string, number][]} 食材名と獲得量の配列
         */
        calculateNumberOfIngredients() {
            const ingredientValues = {};
            let selectedIngredients = [];
            let foodRate = this.pokemonData.FoodDropRate;
            const ingredientFinderM = this.selectedSubSkills.some(s => s.subskill === "食材確率アップM");
            const ingredientFinderS = this.selectedSubSkills.some(s => s.subskill === "食材確率アップS");
            if (ingredientFinderM)
                foodRate *= CONSTANTS.SUB_SKILL_MODIFIERS.INGREDIENT_CHANCE_M;
            if (ingredientFinderS)
                foodRate *= CONSTANTS.SUB_SKILL_MODIFIERS.INGREDIENT_CHANCE_S;
            foodRate *= this.getPersonalityIngredientModifier();
            if (this.level < CONSTANTS.INGREDIENT_LEVEL_THRESHOLDS.LEVEL_30) {
                selectedIngredients = [
                    { name: this.selectedIngredientA, value: this.ingredientAValue }
                ];
            }
            else if (this.level < CONSTANTS.INGREDIENT_LEVEL_THRESHOLDS.LEVEL_60) {
                selectedIngredients = [
                    { name: this.selectedIngredientA, value: this.ingredientAValue },
                    { name: this.selectedIngredientB, value: this.ingredientBValue }
                ];
            }
            else {
                selectedIngredients = [
                    { name: this.selectedIngredientA, value: this.ingredientAValue },
                    { name: this.selectedIngredientB, value: this.ingredientBValue },
                    { name: this.selectedIngredientC, value: this.ingredientCValue }
                ];
            }
            selectedIngredients.forEach(({ name, value }) => {
                if (!ingredientValues[name]) {
                    ingredientValues[name] = [];
                }
                ingredientValues[name].push(value);
            });
            const resultArr = Object.entries(ingredientValues).map(([name, values]) => {
                const numValues = values;
                const totalValueForName = numValues.reduce((sum, val) => sum + val, 0);
                const averageValue = totalValueForName / selectedIngredients.length;
                const resultAmount = this.helpingCount * foodRate * averageValue;
                return [name, Math.round(resultAmount * 10) / 10];
            });
            return resultArr;
        }
        /**
         * 性格によるおてつだいスピード補正値を取得する
         * @returns {number} 補正値 (例: 0.9, 1.075, または 1)
         */
        getPersonalitySpeedModifier() {
            const { up_status, down_status } = this.personality.effect || {};
            if (up_status === "無補正" && down_status === "無補正")
                return 1;
            if (up_status?.ability === "おてつだいスピード")
                return CONSTANTS.PERSONALITY_MODIFIERS.SPEED_UP;
            if (down_status?.ability === "おてつだいスピード")
                return CONSTANTS.PERSONALITY_MODIFIERS.SPEED_DOWN;
            return 1;
        }
        /**
         * 性格による食材おてつだい確率補正値を取得する
         * @returns {number} 補正値 (例: 1.2, 0.8, または 1)
         */
        getPersonalityIngredientModifier() {
            const { up_status, down_status } = this.personality.effect || {};
            if (up_status === "無補正" && down_status === "無補正")
                return 1;
            if (up_status?.ability === "食材おてつだい確率")
                return CONSTANTS.PERSONALITY_MODIFIERS.INGREDIENT_UP;
            if (down_status?.ability === "食材おてつだい確率")
                return CONSTANTS.PERSONALITY_MODIFIERS.INGREDIENT_DOWN;
            return 1;
        }
        /**
         * 性格によるメインスキル発生確率補正値を取得する
         * @returns {number} 補正値 (例: 1.2, 0.8, または 1)
         */
        getPersonalitySkillModifier() {
            const { up_status, down_status } = this.personality.effect || {};
            if (up_status === "無補正" && down_status === "無補正")
                return 1;
            if (up_status?.ability === "メインスキル発生確率")
                return CONSTANTS.PERSONALITY_MODIFIERS.SKILL_UP;
            if (down_status?.ability === "メインスキル発生確率")
                return CONSTANTS.PERSONALITY_MODIFIERS.SKILL_DOWN;
            return 1;
        }
        /**
         * 性格によるげんき回復量補正値を取得する
         * @returns {number} 補正値 (例: 1.2, 0.88, または 1)
         */
        getPersonalityGenkiModifier() {
            const { up_status, down_status } = this.personality.effect || {};
            if (up_status === "無補正" && down_status === "無補正")
                return 1;
            if (up_status?.ability === "げんき回復量")
                return CONSTANTS.PERSONALITY_MODIFIERS.GENKI_UP;
            if (down_status?.ability === "げんき回復量")
                return CONSTANTS.PERSONALITY_MODIFIERS.GENKI_DOWN;
            return 1;
        }
        /**
         * サブスキルによるおてつだいスピード合計補正値を取得する
         * @param {boolean} helpingSpeedM - おてつだいスピードMサブスキルがあるか
         * @param {boolean} helpingSpeedS - おてつだいスピードSサブスキルがあるか
         * @param {number} helpingBonus - おてつだいボーナスサブスキルの数
         * @returns {number} 合計補正値
         */
        getSubSkillSpeedModifier(helpingSpeedM, helpingSpeedS, helpingBonus) {
            let totalModifier = 0;
            if (helpingSpeedM)
                totalModifier += CONSTANTS.SUB_SKILL_MODIFIERS.HELPING_SPEED_M;
            if (helpingSpeedS)
                totalModifier += CONSTANTS.SUB_SKILL_MODIFIERS.HELPING_SPEED_S;
            for (let i = 0; i < helpingBonus; i++)
                totalModifier += CONSTANTS.SUB_SKILL_MODIFIERS.HELPING_BONUS;
            return Math.min(totalModifier, CONSTANTS.MAX_HELPING_SPEED_BONUS);
        }
        /**
         * おやすみリボンによる補正値を取得する
         * @param {{ goodNightRibbonTime: number, evolveCount: number }} goodNightRibbon - おやすみリボンの情報
         * @returns {number} 補正値
         */
        getGoodNightRibbonModifier(goodNightRibbon) {
            const { goodNightRibbonTime: sleepTime, evolveCount } = goodNightRibbon;
            if (evolveCount === 2)
                return 0;
            if (evolveCount === 1) {
                if (sleepTime === 2000)
                    return CONSTANTS.GOOD_NIGHT_RIBBON_MODIFIERS.EVOLVE_1_2000;
                if (sleepTime === 500)
                    return CONSTANTS.GOOD_NIGHT_RIBBON_MODIFIERS.EVOLVE_1_500;
            }
            if (evolveCount === 0) {
                if (sleepTime === 2000)
                    return CONSTANTS.GOOD_NIGHT_RIBBON_MODIFIERS.EVOLVE_0_2000;
                if (sleepTime === 500)
                    return CONSTANTS.GOOD_NIGHT_RIBBON_MODIFIERS.EVOLVE_0_500;
            }
            return 0;
        }
        /**
         * 選択されているおてつだいボーナスサブスキルの数をカウントする
         * @returns {number} おてつだいボーナスサブスキルの数
         */
        countHelpingBonus() {
            const count = this.selectedSubSkills.filter(s => s.subskill.startsWith("おてつだいボーナス")).length;
            return Math.min(count, CONSTANTS.MAX_SUB_SKILLS);
        }
        /**
         * 選択された食材の個数（値）をポケモンデータから取得し、インスタンスに更新する
         */
        updateIngredientAmounts() {
            const { IngredientsA, IngredientsB, IngredientsC } = this.pokemonData;
            if (!IngredientsA || !IngredientsB || !IngredientsC) {
                console.warn("ポケモンデータに食材情報が不足しています。");
                return;
            }
            this.ingredientAValue = IngredientsA.find((ingredient) => ingredient.name === this.selectedIngredientA)?.value || 0;
            this.ingredientBValue = IngredientsB.find((ingredient) => ingredient.name === this.selectedIngredientB)?.value || 0;
            this.ingredientCValue = IngredientsC.find((ingredient) => ingredient.name === this.selectedIngredientC)?.value || 0;
        }
        /**
         * 性格のデータをAPIから取得し、インスタンスに設定する
         * @param {string} upStatus - 上がるステータス名
         * @param {string} downStatus - 下がるステータス名
         * @returns {Promise<any>} 取得した性格データ
         */
        async fetchPersonality(upStatus, downStatus) {
            const isUpNeutral = upStatus === "無補正";
            const isDownNeutral = downStatus === "無補正";
            // どちらか片方が無補正の場合は、性格を取得しない
            if ((isUpNeutral && !isDownNeutral) || (!isUpNeutral && isDownNeutral)) {
                return;
            }
            if (upStatus === "無補正" || downStatus === "無補正")
                return;
            try {
                const response = await fetch('/api/getPersonality', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        upStatus: upStatus,
                        downStatus: downStatus
                    })
                });
                if (!response.ok)
                    throw new Error("性格取得失敗");
                const data = await response.json();
                this.personality = data;
                return data;
            }
            catch (err) {
                console.error('性格取得エラー:', err);
                return null;
            }
        }
    }
    // PokemonStatusManagerのインスタンスを作成
    const pokemonStatus = new PokemonStatusManager();
    // --- APIヘルパー関数 ---
    /**
     * ポケモン名取得APIを呼び出し、セレクトボックスに結果を反映する
     */
    async function fetchAndSetPokemonNames() {
        try {
            const response = await fetch('/api/getPokemonNames', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok)
                throw new Error("ポケモン名取得失敗");
            const pokemonList = await response.json();
            if (DOM.selectPokemonName) {
                DOM.selectPokemonName.innerHTML = "";
                pokemonList.forEach((pokemon) => {
                    const option = document.createElement("option");
                    option.value = pokemon.No.toString();
                    option.textContent = pokemon.Name;
                    if (!DOM.selectPokemonName)
                        return;
                    DOM.selectPokemonName.appendChild(option);
                });
            }
        }
        catch (error) {
            console.error('ポケモン名取得エラー:', error);
        }
    }
    /**
     * サブスキル一覧をAPIから取得する
     * @returns {Promise<any[] | undefined>} 取得したサブスキルデータ
     */
    async function fetchSubSkills() {
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
    // --- UI更新関数 ---
    /**
     * 食材セレクトボックスをポケモンデータに基づいて生成・更新する
     */
    function setIngredientOptions() {
        const { IngredientsA, IngredientsB, IngredientsC } = pokemonStatus.pokemonData;
        // IngredientsA, IngredientsB, IngredientsCの中身を使って組み合わせを作成
        if (IngredientsA && IngredientsB && IngredientsC) {
            const ingredientCombinations = [];
            IngredientsA.forEach((a) => {
                IngredientsB.forEach((b) => {
                    IngredientsC.forEach((c) => {
                        ingredientCombinations.push([a.name, a.value], [b.name, b.value], [c.name, c.value]);
                    });
                });
            });
            ;
            const groups = [];
            for (let i = 0; i < ingredientCombinations.length; i += 3) {
                if (groups.length >= 6)
                    break;
                groups.push([
                    ingredientCombinations[i],
                    ingredientCombinations[i + 1],
                    ingredientCombinations[i + 2]
                ]);
            }
            const list = ["AAA", "AAB", "AAC", "ABA", "ABB", "ABC"];
            // 各グループごとにoptionを作成
            groups.forEach((group, idx) => {
                const label = group.map(([name, value]) => `${name} ( ${value} ) `).join("  /  ");
                const option = document.createElement("option");
                option.value = idx.toString() + "-" + list[idx];
                option.textContent = label;
                if (!DOM.selectIngredient)
                    return;
                DOM.selectIngredient.appendChild(option);
            });
            // デフォルト選択
            DOM.selectIngredient.value = "0-" + list[0];
        }
    }
    /**
     * サブスキルボタンの状態（選択中を示すクラスとバッジ）を更新する
     */
    function updateSubSkillButtonStates() {
        if (!DOM.subSkillButtons)
            return;
        const buttons = DOM.subSkillButtons.querySelectorAll("button");
        buttons.forEach(btn => {
            const subskill = btn.getAttribute("data-subskill");
            const idx = pokemonStatus.selectedSubSkills.findIndex(s => s.subskill === subskill);
            const oldBadge = btn.querySelector('.subskill-badge');
            if (oldBadge)
                oldBadge.remove();
            if (idx >= 0) {
                btn.classList.add("selected");
                const badge = document.createElement("span");
                badge.className = "subskill-badge";
                badge.textContent = CONSTANTS.BADGE_NUMBERS[idx]?.toString() ?? "";
                btn.prepend(badge);
            }
            else {
                btn.classList.remove("selected");
            }
        });
    }
    /**
     * 選択中のサブスキル表示を更新する
     */
    function updateSelectedSubSkillDisplay() {
        if (!DOM.selectedSubSkillLabel)
            return;
        DOM.selectedSubSkillLabel.innerHTML = "";
        pokemonStatus.selectedSubSkills.forEach((s) => {
            const div = document.createElement("div");
            div.className = "col-12 col-md-6 mb-2 selected-subskill-item";
            const p = document.createElement("p");
            p.className = s.color + "-skill mb-0 py-2 px-3 rounded";
            p.textContent = s.subskill;
            div.appendChild(p);
            if (!DOM.selectedSubSkillLabel)
                return;
            DOM.selectedSubSkillLabel.appendChild(div);
        });
    }
    /**
     * サブスキル選択モーダルと関連ボタンの初期設定を行う
     */
    async function setupSubSkillModal() {
        const { subSkillButtons, subSkillModal, openSubSkillModalButton, closeSubSkillModalButton } = DOM;
        if (!subSkillButtons || !subSkillModal || !openSubSkillModalButton || !closeSubSkillModalButton)
            return;
        const allSubSkills = await fetchSubSkills();
        if (!allSubSkills)
            return;
        subSkillButtons.innerHTML = "";
        const buttonRow = document.createElement("div");
        buttonRow.className = "row";
        subSkillButtons.appendChild(buttonRow);
        allSubSkills.forEach((element) => {
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
                else if (pokemonStatus.selectedSubSkills.length < CONSTANTS.MAX_SUB_SKILLS) {
                    pokemonStatus.selectedSubSkills.push(element);
                }
                updateSubSkillButtonStates();
                updateSelectedSubSkillDisplay();
            };
            colDiv.appendChild(button);
            buttonRow.appendChild(colDiv);
        });
        // モーダル開閉のイベントリスナー設定
        openSubSkillModalButton.onclick = () => {
            subSkillModal.style.display = "block";
            subSkillModal.classList.add("show");
        };
        closeSubSkillModalButton.onclick = () => {
            subSkillModal.style.display = "none";
            subSkillModal.classList.remove("show");
            loadStatus();
        };
        subSkillModal.onclick = (e) => {
            if (e.target === subSkillModal) {
                closeSubSkillModalButton.onclick?.(e);
            }
        };
    }
    /**
     * 性格選択のUI（ボタン、モーダル）を初期設定する
     */
    async function setupPersonalityOptions() {
        const { personalityModal, openPersonalityModalButton, closePersonalityModalButton, personalityUpGroup, personalityDownGroup, resultPersonalityName, personalityNeutralBtn } = DOM;
        if (!personalityModal || !openPersonalityModalButton || !closePersonalityModalButton || !personalityUpGroup || !personalityDownGroup || !resultPersonalityName || !personalityNeutralBtn)
            return;
        const statusList = [
            { key: "おてつだいスピード", label: "おてつだいスピード" },
            { key: "げんき回復量", label: "げんき回復量" },
            { key: "食材おてつだい確率", label: "食材おてつだい確率" },
            { key: "メインスキル発生確率", label: "メインスキル発生確率" },
            { key: "EXP獲得量", label: "EXP獲得量" }
        ];
        let currentUpStatus = "無補正";
        let currentDownStatus = "無補正";
        /**
         * 選択された性格名を表示に反映する
         */
        async function updatePersonalityNameDisplay() {
            const result = await pokemonStatus.fetchPersonality(currentUpStatus, currentDownStatus);
            if (!resultPersonalityName)
                return;
            resultPersonalityName.textContent = result?.name ?? "該当なし";
        }
        /**
         * 「無補正」ボタンのアクティブ状態を更新する
         */
        function updateNeutralButtonState() {
            if (!personalityNeutralBtn)
                return;
            if (currentUpStatus === "無補正" && currentDownStatus === "無補正") {
                personalityNeutralBtn.classList.add("active");
            }
            else {
                personalityNeutralBtn.classList.remove("active");
            }
        }
        /**
         * 性格選択ボタンをレンダリング（生成・更新）する
         */
        async function renderPersonalityButtons() {
            if (!personalityUpGroup || !personalityDownGroup)
                return;
            personalityUpGroup.innerHTML = "";
            personalityDownGroup.innerHTML = "";
            statusList.forEach(status => {
                const upBtn = document.createElement("button");
                upBtn.type = "button";
                upBtn.className = "btn btn-outline-danger mb-1";
                upBtn.textContent = status.label;
                upBtn.disabled = (status.key === currentDownStatus);
                if (status.key === currentUpStatus)
                    upBtn.classList.add("active");
                upBtn.onclick = async () => {
                    currentUpStatus = status.key;
                    if (currentUpStatus === currentDownStatus) {
                        currentDownStatus = "無補正";
                    }
                    await renderPersonalityButtons();
                    await updatePersonalityNameDisplay();
                    updateNeutralButtonState();
                };
                personalityUpGroup.appendChild(upBtn);
                const downBtn = document.createElement("button");
                downBtn.type = "button";
                downBtn.className = "btn btn-outline-primary mb-1";
                downBtn.textContent = status.label;
                downBtn.disabled = (status.key === currentUpStatus);
                if (status.key === currentDownStatus)
                    downBtn.classList.add("active");
                downBtn.onclick = async () => {
                    currentDownStatus = status.key;
                    if (currentDownStatus === currentUpStatus) {
                        currentUpStatus = "無補正";
                    }
                    await renderPersonalityButtons();
                    await updatePersonalityNameDisplay();
                    updateNeutralButtonState();
                };
                personalityDownGroup.appendChild(downBtn);
            });
            updateNeutralButtonState();
        }
        // 「無補正」ボタンのイベントリスナー
        personalityNeutralBtn.addEventListener("click", async () => {
            currentUpStatus = "無補正";
            currentDownStatus = "無補正";
            await renderPersonalityButtons();
            await updatePersonalityNameDisplay();
        });
        // モーダル初期表示時の設定
        await renderPersonalityButtons();
        await updatePersonalityNameDisplay();
        // モーダル開閉のイベントリスナー設定
        openPersonalityModalButton.onclick = async () => {
            personalityModal.style.display = "block";
            await renderPersonalityButtons();
        };
        closePersonalityModalButton.onclick = () => {
            personalityModal.style.display = "none";
            // 性格名をボタンのラベルに設定
            if (resultPersonalityName && openPersonalityModalButton) {
                openPersonalityModalButton.textContent = resultPersonalityName.textContent ?? "性格選択";
            }
            loadStatus();
        };
        personalityModal.onclick = (e) => {
            if (e.target === personalityModal)
                closePersonalityModalButton.onclick?.(e);
        };
    }
    /**
     * 全てのステータスを計算し、画面に表示するメインロジック
     */
    async function loadStatus() {
        if (!DOM.resultSpeedOfHelp ||
            !DOM.resultHelpingCount ||
            !DOM.resultNumberOfIngredients ||
            !DOM.resultSkillCount)
            return;
        // UIから現在の選択値を取得し、PokemonStatusManagerインスタンスに反映
        pokemonStatus.selectedPokemonNo = parseInt(DOM.selectPokemonName.value);
        pokemonStatus.level = parseInt(DOM.level.value, 10) || 1;
        // 食材の選択値を取得
        pokemonStatus.setIngredientData();
        // 選択されたポケモンの詳細データを取得・更新
        await pokemonStatus.fetchSelectedPokemonData();
        pokemonStatus.selectedPokemonName = pokemonStatus.pokemonData.Name;
        // 選択された食材の個数を更新
        pokemonStatus.updateIngredientAmounts();
        // 各種ステータスの計算
        pokemonStatus.speedOfHelping = pokemonStatus.calculateSpeedOfHelp();
        await pokemonStatus.calculateHelpingCount();
        const numberOfIngredientsResult = pokemonStatus.calculateNumberOfIngredients();
        const ingredientCount = Math.round(pokemonStatus.pokemonData.FoodDropRate * pokemonStatus.helpingCount * 100) / 100;
        const skillCount = pokemonStatus.calculateSkillCount();
        // 結果を画面に表示
        const minutes = Math.floor(pokemonStatus.speedOfHelping / 60);
        const seconds = pokemonStatus.speedOfHelping % 60;
        DOM.resultSpeedOfHelp.textContent = `${pokemonStatus.speedOfHelping} : ${minutes}分${seconds}秒`;
        DOM.resultHelpingCount.textContent = pokemonStatus.helpingCount.toString();
        // 食材獲得量は、複数の食材がある可能性があるので、フォーマットして表示
        if (numberOfIngredientsResult.length > 0) {
            DOM.resultNumberOfIngredients.textContent = numberOfIngredientsResult.map(([name, amount]) => `${name} (${amount})`).join(', ');
        }
        else {
            DOM.resultNumberOfIngredients.textContent = "N/A";
        }
        DOM.resultSkillCount.textContent = skillCount.toString();
        console.log("------計算結果------");
        console.log("ポケモンNo:", pokemonStatus.selectedPokemonNo);
        console.log("ポケモン名:", pokemonStatus.selectedPokemonName);
        console.log("レベル:", pokemonStatus.level);
        console.log("選択された食材A:", pokemonStatus.selectedIngredientA, "値:", pokemonStatus.ingredientAValue);
        console.log("選択された食材B:", pokemonStatus.selectedIngredientB, "値:", pokemonStatus.ingredientBValue);
        console.log("選択された食材C:", pokemonStatus.selectedIngredientC, "値:", pokemonStatus.ingredientCValue);
        console.log("おてつだい時間:", pokemonStatus.speedOfHelping, "秒");
        console.log("おてつだい時間（分:秒）:", `${Math.floor(pokemonStatus.speedOfHelping / 60)}分:${pokemonStatus.speedOfHelping % 60}秒`);
        console.log("おてつだいスピード:", pokemonStatus.speedOfHelping);
        console.log("おてつだい回数:", pokemonStatus.helpingCount);
        numberOfIngredientsResult.forEach(([name, amount]) => {
            console.log(`食材: ${name}, 獲得量: ${amount}`);
        });
        console.log("食材獲得量:", ingredientCount);
        console.log("スキル発生回数:", skillCount);
        console.log("性格:", pokemonStatus.personality.name ?? "無補正");
        console.log("-------------------");
    }
    // --- アプリケーションの初期化処理 ---
    async function initializeApp() {
        // DOM要素が全て存在するかチェック
        const missingDomKeys = Object.entries(DOM)
            .filter(([_, el]) => el === null)
            .map(([key]) => key);
        if (missingDomKeys.length > 0) {
            throw new Error(`必要なDOM要素が見つかりません: ${missingDomKeys.join(", ")}`);
        }
        // 1. ポケモン名を取得し、選択ボックスに設定
        await fetchAndSetPokemonNames();
        // 2. 初期選択されているポケモンNoを取得（通常はリストの最初のポケモン）
        pokemonStatus.selectedPokemonNo = parseInt(DOM.selectPokemonName.value);
        // 3. 初回選択されているポケモンの詳細データを取得
        await pokemonStatus.fetchSelectedPokemonData();
        pokemonStatus.selectedPokemonName = pokemonStatus.pokemonData.Name;
        // 4. 食材選択オプションを、取得したポケモンデータに基づいて設定
        setIngredientOptions();
        // 5. サブスキル選択モーダルとボタンをセットアップ
        await setupSubSkillModal();
        updateSubSkillButtonStates();
        updateSelectedSubSkillDisplay();
        // 6. 性格選択UIをセットアップ（初期の「無補正」性格もここで設定される）
        await setupPersonalityOptions();
        // 7. 全ての初期設定が完了したら、ステータスを計算して表示
        await loadStatus();
    }
    // --- イベントリスナー登録 ---
    function registerEventListeners() {
        DOM.selectPokemonName?.addEventListener("change", async () => {
            // ポケモンが変更されたら、新しいポケモンデータでUIと計算を更新
            pokemonStatus.selectedPokemonNo = parseInt(DOM.selectPokemonName.value);
            await pokemonStatus.fetchSelectedPokemonData();
            DOM.selectIngredient.innerHTML = ""; // 既存の選択肢をクリア
            setIngredientOptions();
            await loadStatus();
        });
        DOM.level?.addEventListener("change", loadStatus);
        DOM.selectIngredient?.addEventListener("change", loadStatus);
    }
    // --- アプリケーションの実行 ---
    // DOMContentLoadedイベント内で、アプリケーションの初期化とイベントリスナー登録を実行
    await initializeApp();
    registerEventListeners();
});
