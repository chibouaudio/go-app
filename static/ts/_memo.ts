/**
 * ポケモンのステータス計算・表示ロジック
 * 各関数・変数には説明コメントを付与
 */
document.addEventListener("DOMContentLoaded", async function () {
    // --- DOM要素取得 ---
    // ページ上のすべての主要なDOM要素を一つのオブジェクトにまとめる
    const DOM = {
        selectPokemonName: document.getElementById("selectPokemonName"),
        level: document.getElementById("level"),
        subSkillButtons: document.getElementById("subSkillButtons"),
        subSkillModal: document.getElementById("subSkillModal"),
        openSubSkillModalButton: document.getElementById("btnSubSkill"),
        closeSubSkillModalButton: document.getElementById("closeSubSkillModal"),
        selectedSubSkillLabel: document.getElementById("selectedSubSkilllabel"),
        selectIngredientA: document.getElementById("selectIngredientA"),
        selectIngredientB: document.getElementById("selectIngredientB"),
        selectIngredientC: document.getElementById("selectIngredientC"),
        resultHelpingCount: document.getElementById("resultHelpingCount"),
        resultSpeedOfHelp: document.getElementById("resultSpeedOfHelp"),
        resultIngredientsCount: document.getElementById("resultIngredientsCount"),
        resultNumberOfIngredients: document.getElementById("resultNumberOfIngredients"),
        resultSkillCount: document.getElementById("resultSkillCount"),
        resultPersonality: document.getElementById("resultPersonality"),
        personalityModal: document.getElementById("personalityModal"),
        openPersonalityModalButton: document.getElementById("openPersonalityModal"),
        closePersonalityModalButton: document.getElementById("personalityModalClose"),
        personalityUpGroup: document.getElementById("personality-up-group"),
        personalityDownGroup: document.getElementById("personality-down-group"),
        resultPersonalityName: document.getElementById("resultPersonalityName"),
        personalityNeutralBtn: document.getElementById("personalityNeutralBtn")
    };

    // --- 定数 ---
    // マジックナンバーや繰り返し使われる値を定数として定義
    const CONSTANTS = {
        BADGE_NUMBERS: [10, 25, 50, 75, 100], // サブスキル選択時のバッジ番号
        MAX_SUB_SKILLS: 5, // サブスキル最大数
        BASE_GENKI: 100, // 基本げんき量
        LEVEL_MODIFIER_PER_LEVEL: 0.002, // レベルによる補正値
        PERSONALITY_MODIFIERS: { // 性格による各種補正値
            SPEED_UP: 0.9,
            SPEED_DOWN: 1.075,
            INGREDIENT_UP: 1.2,
            INGREDIENT_DOWN: 0.8,
            SKILL_UP: 1.2,
            SKILL_DOWN: 0.8,
            GENKI_UP: 1.2,
            GENKI_DOWN: 0.88
        },
        SUB_SKILL_MODIFIERS: { // サブスキルによる各種補正値
            HELPING_SPEED_M: 0.14,
            HELPING_SPEED_S: 0.07,
            HELPING_BONUS: 0.05,
            INGREDIENT_CHANCE_M: 1.36,
            INGREDIENT_CHANCE_S: 1.18,
            SKILL_CHANCE_M: 1.36,
            SKILL_CHANCE_S: 1.18
        },
        GOOD_NIGHT_RIBBON_MODIFIERS: { // おやすみリボンによる補正値
            EVOLVE_1_2000: 0.12,
            EVOLVE_1_500: 0.05,
            EVOLVE_0_2000: 0.25,
            EVOLVE_0_500: 0.11
        },
        MEAL_TIMES: { // 食事時間
            BREAKFAST: 9.0,
            LUNCH: 13.0,
            DINNER: 19.0
        },
        INGREDIENT_LEVEL_THRESHOLDS: { // 食材が解放されるレベルの閾値
            LEVEL_30: 30,
            LEVEL_60: 60
        }
    };

    /**
     * ポケモンの現在のステータスと選択状態、および計算ロジックを管理するクラス
     */
    class PokemonStatusManager {
        selectedPokemonNo: number = 1;
        selectedPokemonName: string = "";
        pokemonData: any = {};
        level: number = 1;
        personality: any = {};
        selectedIngredientA: string = "";
        ingredientAValue: number = 0;
        selectedIngredientB: string = "";
        ingredientBValue: number = 0;
        selectedIngredientC: string = "";
        ingredientCValue: number = 0;
        selectedSubSkills: any[] = [];
        speedOfHelping: number = 0;
        helpingCount: number = 0;

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
                if (!response.ok) throw new Error("ポケモンデータ取得失敗");
                this.pokemonData = await response.json();
                return this.pokemonData;
            } catch (error) {
                console.error('ポケモンデータ取得エラー:', error);
                return {};
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

            // 各種補正値を適用して最終的なおてつだいスピードを計算
            const levelModifier = 1 - (pokemonLevel - 1) * CONSTANTS.LEVEL_MODIFIER_PER_LEVEL;
            const personalityModifier = this.getPersonalitySpeedModifier();
            const subSkillModifier = 1 - this.getSubSkillSpeedModifier(helpingSpeedM, helpingSpeedS, helpingBonus);
            const goodNightRibbonModifier = 1 - this.getGoodNightRibbonModifier(goodNightRibbon);

            return Math.floor(
                baseSpeedOfHelp * levelModifier * personalityModifier * subSkillModifier * goodNightRibbonModifier
            );
        }

        /**
         * おてつだい回数をAPIで計算し、インスタンスに設定する
         * @returns {Promise<number>} 計算されたおてつだい回数
         */
        async calculateHelpingCount() {
            // 性格によるげんき回復量補正を考慮したげんき量
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
            } catch (error) {
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
            if (!skillRate || !this.helpingCount) return 0;

            const skillUpM = this.selectedSubSkills.some(s => s.subskill === "スキル確率アップM");
            const skillUpS = this.selectedSubSkills.some(s => s.subskill === "スキル確率アップS");

            // サブスキルと性格による補正を適用
            if (skillUpM) skillRate *= CONSTANTS.SUB_SKILL_MODIFIERS.SKILL_CHANCE_M;
            if (skillUpS) skillRate *= CONSTANTS.SUB_SKILL_MODIFIERS.SKILL_CHANCE_S;
            skillRate *= this.getPersonalitySkillModifier();

            return Math.round(skillRate * this.helpingCount * 100) / 100;
        }

        /**
         * 獲得食材数を計算する
         * @returns {[string, number][]} 食材名と獲得量の配列
         */
        calculateNumberOfIngredients() {
            const ingredientValues: any = {};
            let selectedIngredients = [];
            let foodRate = this.pokemonData.FoodDropRate;

            const ingredientFinderM = this.selectedSubSkills.some(s => s.subskill === "食材確率アップM");
            const ingredientFinderS = this.selectedSubSkills.some(s => s.subskill === "食材確率アップS");

            // サブスキルと性格による補正を適用
            if (ingredientFinderM) foodRate *= CONSTANTS.SUB_SKILL_MODIFIERS.INGREDIENT_CHANCE_M;
            if (ingredientFinderS) foodRate *= CONSTANTS.SUB_SKILL_MODIFIERS.INGREDIENT_CHANCE_S;
            foodRate *= this.getPersonalityIngredientModifier();

            // レベルに応じて解放される食材を決定
            if (this.level < CONSTANTS.INGREDIENT_LEVEL_THRESHOLDS.LEVEL_30) {
                selectedIngredients = [
                    { name: this.selectedIngredientA, value: this.ingredientAValue }
                ];
            } else if (this.level < CONSTANTS.INGREDIENT_LEVEL_THRESHOLDS.LEVEL_60) {
                selectedIngredients = [
                    { name: this.selectedIngredientA, value: this.ingredientAValue },
                    { name: this.selectedIngredientB, value: this.ingredientBValue }
                ];
            } else {
                selectedIngredients = [
                    { name: this.selectedIngredientA, value: this.ingredientAValue },
                    { name: this.selectedIngredientB, value: this.ingredientBValue },
                    { name: this.selectedIngredientC, value: this.ingredientCValue }
                ];
            }

            // 選択された食材を名前でグループ化し、それぞれの値を合計
            selectedIngredients.forEach(({ name, value }) => {
                if (!ingredientValues[name]) {
                    ingredientValues[name] = [];
                }
                ingredientValues[name].push(value);
            });

            // 食材ごとの平均値と合計獲得量を計算
            const resultArr = Object.entries(ingredientValues).map(([name, values]) => {
                const numValues = values as number[];
                const totalValueForName = numValues.reduce((sum, val) => sum + val, 0);
                const averageValue = totalValueForName / selectedIngredients.length;
                const resultAmount = this.helpingCount * foodRate * averageValue;
                return [name, Math.round(resultAmount * 10) / 10]; // 小数点第一位で四捨五入
            });

            return resultArr;
        }

        /**
         * 性格によるおてつだいスピード補正値を取得する
         * @returns {number} 補正値 (例: 0.9, 1.075, または 1)
         */
        getPersonalitySpeedModifier() {
            const { up_status, down_status } = this.personality.effect || {};
            if (up_status === "無補正" && down_status === "無補正") return 1;
            if (up_status?.ability === "おてつだいスピード") return CONSTANTS.PERSONALITY_MODIFIERS.SPEED_UP;
            if (down_status?.ability === "おてつだいスピード") return CONSTANTS.PERSONALITY_MODIFIERS.SPEED_DOWN;
            return 1;
        }

        /**
         * 性格による食材おてつだい確率補正値を取得する
         * @returns {number} 補正値 (例: 1.2, 0.8, または 1)
         */
        getPersonalityIngredientModifier() {
            const { up_status, down_status } = this.personality.effect || {};
            if (up_status === "無補正" && down_status === "無補正") return 1;
            if (up_status?.ability === "食材おてつだい確率") return CONSTANTS.PERSONALITY_MODIFIERS.INGREDIENT_UP;
            if (down_status?.ability === "食材おてつだい確率") return CONSTANTS.PERSONALITY_MODIFIERS.INGREDIENT_DOWN;
            return 1;
        }

        /**
         * 性格によるメインスキル発生確率補正値を取得する
         * @returns {number} 補正値 (例: 1.2, 0.8, または 1)
         */
        getPersonalitySkillModifier() {
            const { up_status, down_status } = this.personality.effect || {};
            if (up_status === "無補正" && down_status === "無補正") return 1;
            if (up_status?.ability === "メインスキル発生確率") return CONSTANTS.PERSONALITY_MODIFIERS.SKILL_UP;
            if (down_status?.ability === "メインスキル発生確率") return CONSTANTS.PERSONALITY_MODIFIERS.SKILL_DOWN;
            return 1;
        }

        /**
         * 性格によるげんき回復量補正値を取得する
         * @returns {number} 補正値 (例: 1.2, 0.88, または 1)
         */
        getPersonalityGenkiModifier() {
            const { up_status, down_status } = this.personality.effect || {};
            if (up_status === "無補正" && down_status === "無補正") return 1;
            if (up_status?.ability === "げんき回復量") return CONSTANTS.PERSONALITY_MODIFIERS.GENKI_UP;
            if (down_status?.ability === "げんき回復量") return CONSTANTS.PERSONALITY_MODIFIERS.GENKI_DOWN;
            return 1;
        }

        /**
         * サブスキルによるおてつだいスピード合計補正値を取得する
         * @param {boolean} helpingSpeedM - おてつだいスピードMサブスキルがあるか
         * @param {boolean} helpingSpeedS - おてつだいスピードSサブスキルがあるか
         * @param {number} helpingBonus - おてつだいボーナスサブスキルの数
         * @returns {number} 合計補正値
         */
        getSubSkillSpeedModifier(helpingSpeedM: boolean, helpingSpeedS: boolean, helpingBonus: number) {
            let totalModifier = 0;
            if (helpingSpeedM) totalModifier += CONSTANTS.SUB_SKILL_MODIFIERS.HELPING_SPEED_M;
            if (helpingSpeedS) totalModifier += CONSTANTS.SUB_SKILL_MODIFIERS.HELPING_SPEED_S;
            for (let i = 0; i < helpingBonus; i++) totalModifier += CONSTANTS.SUB_SKILL_MODIFIERS.HELPING_BONUS;
            return Math.min(totalModifier, 0.35); // 補正の最大値を35%に制限
        }

        /**
         * おやすみリボンによる補正値を取得する
         * @param {{ goodNightRibbonTime: number, evolveCount: number }} goodNightRibbon - おやすみリボンの情報
         * @returns {number} 補正値
         */
        getGoodNightRibbonModifier(goodNightRibbon: { goodNightRibbonTime: any; evolveCount: any; }) {
            const { goodNightRibbonTime: sleepTime, evolveCount } = goodNightRibbon;
            if (evolveCount === 2) return 0; // 最終進化は補正なし？
            if (evolveCount === 1) { // 1段階進化
                if (sleepTime === 2000) return CONSTANTS.GOOD_NIGHT_RIBBON_MODIFIERS.EVOLVE_1_2000;
                if (sleepTime === 500) return CONSTANTS.GOOD_NIGHT_RIBBON_MODIFIERS.EVOLVE_1_500;
            }
            if (evolveCount === 0) { // 未進化
                if (sleepTime === 2000) return CONSTANTS.GOOD_NIGHT_RIBBON_MODIFIERS.EVOLVE_0_2000;
                if (sleepTime === 500) return CONSTANTS.GOOD_NIGHT_RIBBON_MODIFIERS.EVOLVE_0_500;
            }
            return 0; // 該当なしの場合
        }

        /**
         * 選択されているおてつだいボーナスサブスキルの数をカウントする
         * @returns {number} おてつだいボーナスサブスキルの数
         */
        countHelpingBonus() {
            const count = this.selectedSubSkills.filter(s => s.subskill.startsWith("おてつだいボーナス")).length;
            return Math.min(count, CONSTANTS.MAX_SUB_SKILLS); // 最大5つまで
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

            // 各食材スロットの選択値に基づいて、対応する食材の個数を取得
            this.ingredientAValue = IngredientsA.find((ingredient: { name: string; }) => ingredient.name === this.selectedIngredientA)?.value || 0;
            this.ingredientBValue = IngredientsB.find((ingredient: { name: string; }) => ingredient.name === this.selectedIngredientB)?.value || 0;
            this.ingredientCValue = IngredientsC.find((ingredient: { name: string; }) => ingredient.name === this.selectedIngredientC)?.value || 0;
        }

        /**
         * 性格のデータをAPIから取得し、インスタンスに設定する
         * @param {string} upStatus - 上がるステータス名
         * @param {string} downStatus - 下がるステータス名
         * @returns {Promise<any>} 取得した性格データ
         */
        async fetchPersonality(upStatus: string, downStatus: string) {
            try {
                const response = await fetch('/api/getPersonality', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        upStatus: upStatus,
                        downStatus: downStatus
                    })
                });
                if (!response.ok) throw new Error("性格取得失敗");
                const data = await response.json();
                this.personality = data;
                return data;
            } catch (err) {
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
            if (!response.ok) throw new Error("ポケモン名取得失敗");
            const pokemonList = await response.json();
            if (DOM.selectPokemonName) {
                DOM.selectPokemonName.innerHTML = ""; // 既存のオプションをクリア
                pokemonList.forEach((pokemon: { No: { toString: () => string; }; Name: string | null; }) => {
                    const option = document.createElement("option");
                    option.value = pokemon.No.toString();
                    option.textContent = pokemon.Name;
                    if (!DOM.selectPokemonName) return;
                    DOM.selectPokemonName.appendChild(option);
                });
            }
        } catch (error) {
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
            if (!response.ok) throw new Error("サブスキル取得失敗");
            return await response.json();
        } catch (error) {
            console.error('サブスキル取得エラー:', error);
            return undefined;
        }
    }

    // --- UI更新関数 ---

    /**
     * 食材セレクトボックスをポケモンデータに基づいて生成・更新する
     */
    function setIngredientOptions() {
        if (!DOM.selectIngredientA || !DOM.selectIngredientB || !DOM.selectIngredientC) return;
        const { IngredientsA, IngredientsB, IngredientsC } = pokemonStatus.pokemonData;
        const compositionLabels = ["A", "B", "C"]; // 食材A/B/Cの表示ラベル

        // 各食材スロットのオプションを生成するヘルパー関数
        function createIngredientOptions(selectElement: HTMLElement, ingredients: any[]) {
            selectElement.innerHTML = ""; // 既存のオプションをクリア
            if (ingredients) {
                ingredients.forEach((ingredient, i) => {
                    const option = document.createElement("option");
                    option.value = ingredient.name.toString();
                    option.textContent = `${compositionLabels[i]} : ${ingredient.name} ( ${ingredient.value} )`;
                    selectElement.appendChild(option);
                });
            }
        }

        // 各食材セレクトボックスにオプションを設定
        createIngredientOptions(DOM.selectIngredientA, IngredientsA);
        createIngredientOptions(DOM.selectIngredientB, IngredientsB);
        createIngredientOptions(DOM.selectIngredientC, IngredientsC);
    }

    /**
     * サブスキルボタンの状態（選択中を示すクラスとバッジ）を更新する
     */
    function updateSubSkillButtonStates() {
        if (!DOM.subSkillButtons) return;
        const buttons = DOM.subSkillButtons.querySelectorAll("button");
        buttons.forEach(btn => {
            const subskill = btn.getAttribute("data-subskill");
            const idx = pokemonStatus.selectedSubSkills.findIndex(s => s.subskill === subskill);

            // 既存のバッジがあれば削除
            const oldBadge = btn.querySelector('.subskill-badge');
            if (oldBadge) oldBadge.remove();

            if (idx >= 0) { // 選択されている場合
                btn.classList.add("selected");
                const badge = document.createElement("span");
                badge.className = "subskill-badge";
                // BADGE_NUMBERS[idx] が undefined の場合を考慮して空文字列を設定
                badge.textContent = CONSTANTS.BADGE_NUMBERS[idx]?.toString() ?? "";
                btn.prepend(badge); // バッジをボタンの先頭に追加
            } else { // 選択されていない場合
                btn.classList.remove("selected");
            }
        });
    }

    /**
     * 選択中のサブスキル表示を更新する
     */
    function updateSelectedSubSkillDisplay() {
        if (!DOM.selectedSubSkillLabel) return;
        DOM.selectedSubSkillLabel.innerHTML = ""; // 既存の表示をクリア
        pokemonStatus.selectedSubSkills.forEach((s) => {
            const div = document.createElement("div");
            div.className = "col-12 col-md-6 mb-2 selected-subskill-item";
            const p = document.createElement("p");
            p.className = s.color + "-skill mb-0 py-2 px-3 rounded"; // スキルの色クラスを追加
            p.textContent = s.subskill;
            div.appendChild(p);
            if (!DOM.selectedSubSkillLabel) return;
            DOM.selectedSubSkillLabel.appendChild(div);
        });
    }

    /**
     * サブスキル選択モーダルと関連ボタンの初期設定を行う
     */
    async function setupSubSkillModal() {
        const { subSkillButtons, subSkillModal, openSubSkillModalButton, closeSubSkillModalButton } = DOM;
        if (!subSkillButtons || !subSkillModal || !openSubSkillModalButton || !closeSubSkillModalButton) return;

        const allSubSkills = await fetchSubSkills(); // 全サブスキルデータを取得
        if (!allSubSkills) return;

        subSkillButtons.innerHTML = "";
        const buttonRow = document.createElement("div");
        buttonRow.className = "row";
        subSkillButtons.appendChild(buttonRow);

        allSubSkills.forEach((element: any) => {
            const colDiv = document.createElement("div");
            colDiv.className = "col-12 col-md-6 mb-2";
            const button = document.createElement("button");
            button.type = "button";
            button.className = "subskill-btn btn btn-outline-secondary w-100";
            button.classList.add(element.color + "-skill");
            button.textContent = element.subskill;
            button.setAttribute("data-subskill", element.subskill); // サブスキル名をデータ属性に保存
            button.onclick = () => {
                const idx = pokemonStatus.selectedSubSkills.findIndex(s => s.subskill === element.subskill);
                if (idx >= 0) { // すでに選択されている場合は削除
                    pokemonStatus.selectedSubSkills.splice(idx, 1);
                } else if (pokemonStatus.selectedSubSkills.length < CONSTANTS.MAX_SUB_SKILLS) { // 最大数未満の場合は追加
                    pokemonStatus.selectedSubSkills.push(element);
                }
                updateSubSkillButtonStates(); // ボタンの状態を更新
                updateSelectedSubSkillDisplay(); // 選択中表示を更新
            };
            colDiv.appendChild(button);
            buttonRow.appendChild(colDiv);
        });

        // モーダル開閉のイベントリスナー設定
        openSubSkillModalButton.onclick = () => {
            subSkillModal.style.display = "block";
            subSkillModal.classList.add("show"); // Bootstrapの表示クラス
        };
        closeSubSkillModalButton.onclick = () => {
            subSkillModal.style.display = "none";
            subSkillModal.classList.remove("show");
            loadStatus(); // モーダルを閉じたらステータスを再計算・表示
        };
        subSkillModal.onclick = (e) => {
            if (e.target === subSkillModal) { // モーダルの背景をクリックした場合
                closeSubSkillModalButton.onclick?.(e);
            }
        };
    }

    /**
     * 性格選択のUI（ボタン、モーダル）を初期設定する
     */
    async function setupPersonalityOptions() {
        const { personalityModal, openPersonalityModalButton, closePersonalityModalButton, personalityUpGroup, personalityDownGroup, resultPersonalityName, personalityNeutralBtn } = DOM;
        if (!personalityModal || !openPersonalityModalButton || !closePersonalityModalButton || !personalityUpGroup || !personalityDownGroup || !resultPersonalityName || !personalityNeutralBtn) return;

        // 性格で補正されるステータスのリスト
        const statusList = [
            { key: "おてつだいスピード", label: "おてつだいスピード" },
            { key: "げんき回復量", label: "げんき回復量" },
            { key: "食材おてつだい確率", label: "食材おてつだい確率" },
            { key: "メインスキル発生確率", label: "メインスキル発生確率" },
            { key: "EXP獲得量", label: "EXP獲得量" }
        ];

        // 現在選択中の性格補正（初期値は「無補正」）
        let currentUpStatus = "無補正";
        let currentDownStatus = "無補正";

        /**
         * 選択された性格名を表示に反映する
         */
        async function updatePersonalityNameDisplay() {
            // PokemonStatusManagerのメソッドを使って性格データを取得・設定
            const result = await pokemonStatus.fetchPersonality(currentUpStatus, currentDownStatus);
            if (!resultPersonalityName) return;
            resultPersonalityName.textContent = result?.name ?? "該当なし"; // 取得した性格名を表示
        }

        /**
         * 「無補正」ボタンのアクティブ状態を更新する
         */
        function updateNeutralButtonState() {
            if (!personalityNeutralBtn) return;
            if (currentUpStatus === "無補正" && currentDownStatus === "無補正") {
                personalityNeutralBtn.classList.add("active");
            } else {
                personalityNeutralBtn.classList.remove("active");
            }
        }

        /**
         * 性格選択ボタンをレンダリング（生成・更新）する
         */
        async function renderPersonalityButtons() {
            if (!personalityUpGroup || !personalityDownGroup) return;
            personalityUpGroup.innerHTML = ""; // 既存のボタンをクリア
            personalityDownGroup.innerHTML = "";

            statusList.forEach(status => {
                // 上がるステータスボタンの作成
                const upBtn = document.createElement("button");
                upBtn.type = "button";
                upBtn.className = "btn btn-outline-danger mb-1";
                upBtn.textContent = status.label;
                upBtn.disabled = (status.key === currentDownStatus); // 下がるステータスと同じ場合は無効化
                if (status.key === currentUpStatus) upBtn.classList.add("active"); // 選択中ならアクティブクラス
                upBtn.onclick = async () => {
                    currentUpStatus = status.key;
                    if (currentUpStatus === currentDownStatus) {
                        currentDownStatus = "無補正"; // 上がるステータスと同じになったら下がるステータスをリセット
                    }
                    await renderPersonalityButtons(); // ボタンを再レンダリングして状態を更新
                    await updatePersonalityNameDisplay(); // 性格名を更新
                    updateNeutralButtonState(); // 無補正ボタンの状態を更新
                };
                personalityUpGroup.appendChild(upBtn);

                // 下がるステータスボタンの作成
                const downBtn = document.createElement("button");
                downBtn.type = "button";
                downBtn.className = "btn btn-outline-primary mb-1";
                downBtn.textContent = status.label;
                downBtn.disabled = (status.key === currentUpStatus); // 上がるステータスと同じ場合は無効化
                if (status.key === currentDownStatus) downBtn.classList.add("active");
                downBtn.onclick = async () => {
                    currentDownStatus = status.key;
                    if (currentDownStatus === currentUpStatus) {
                        currentUpStatus = "無補正"; // 下がるステータスと同じになったら上がるステータスをリセット
                    }
                    await renderPersonalityButtons();
                    await updatePersonalityNameDisplay();
                    updateNeutralButtonState();
                };
                personalityDownGroup.appendChild(downBtn);
            });

            updateNeutralButtonState(); // ボタンレンダリング後に無補正ボタンの状態を更新
        }

        // 「無補正」ボタンのイベントリスナー
        personalityNeutralBtn.addEventListener("click", async () => {
            currentUpStatus = "無補正";
            currentDownStatus = "無補正";
            await renderPersonalityButtons(); // ボタンの状態をリセット
            await updatePersonalityNameDisplay(); // 無補正の性格名を表示
        });

        // モーダル初期表示時の設定
        await renderPersonalityButtons(); // 初回ボタンレンダリング
        await updatePersonalityNameDisplay(); // 初回性格名表示

        // モーダル開閉のイベントリスナー設定
        openPersonalityModalButton.onclick = async () => {
            personalityModal.style.display = "block";
            await renderPersonalityButtons(); // モーダルを開く際にボタンの状態を最新に更新
        };
        closePersonalityModalButton.onclick = () => {
            personalityModal.style.display = "none";
            loadStatus(); // モーダルを閉じたらステータスを再計算
        };
        personalityModal.onclick = (e) => {
            if (e.target === personalityModal) closePersonalityModalButton.onclick?.(e);
        };
    }


    /**
     * 全てのステータスを計算し、画面に表示するメインロジック
     */
    async function loadStatus() {
        if (
            !DOM.resultSpeedOfHelp ||
            !DOM.resultHelpingCount ||
            !DOM.resultNumberOfIngredients ||
            !DOM.resultIngredientsCount ||
            !DOM.resultSkillCount ||
            !DOM.resultPersonality
        ) return;

        // 必要なDOM要素が全て存在するか確認
        if (!Object.values(DOM).every(el => el !== null)) {
            console.error("必要なDOM要素が一つ以上見つかりません。IDを確認してください。");
            return;
        }

        // UIから現在の選択値を取得し、PokemonStatusManagerインスタンスに反映
        pokemonStatus.selectedPokemonNo = parseInt((DOM.selectPokemonName as HTMLSelectElement).value);
        pokemonStatus.level = parseInt((DOM.level as HTMLInputElement).value, 10) || 1;
        pokemonStatus.selectedIngredientA = (DOM.selectIngredientA as HTMLSelectElement).value;
        pokemonStatus.selectedIngredientB = (DOM.selectIngredientB as HTMLSelectElement).value;
        pokemonStatus.selectedIngredientC = (DOM.selectIngredientC as HTMLSelectElement).value;

        // 選択されたポケモンの詳細データを取得・更新
        await pokemonStatus.fetchSelectedPokemonData();
        pokemonStatus.selectedPokemonName = pokemonStatus.pokemonData.Name;

        // 選択された食材の個数を更新
        pokemonStatus.updateIngredientAmounts();

        // 各種ステータスの計算
        pokemonStatus.speedOfHelping = pokemonStatus.calculateSpeedOfHelp();
        await pokemonStatus.calculateHelpingCount(); // おてつだい回数はスピードに依存するため、非同期で計算
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
        } else {
            DOM.resultNumberOfIngredients.textContent = "N/A"; // データがない場合
        }

        DOM.resultIngredientsCount.textContent = ingredientCount.toString();
        DOM.resultSkillCount.textContent = skillCount.toString();
        DOM.resultPersonality.textContent = pokemonStatus.personality.name; // PokemonStatusManagerから性格名を表示
    }


    // --- アプリケーションの初期化処理 ---
    // アプリケーション起動時に一度だけ実行される初期化処理をまとめる
    async function initializeApp() {
        // 1. ポケモン名を取得し、選択ボックスに設定
        await fetchAndSetPokemonNames();

        // 2. 初期選択されているポケモンNoを取得（通常はリストの最初のポケモン）
        pokemonStatus.selectedPokemonNo = parseInt((DOM.selectPokemonName as HTMLSelectElement).value);

        // 3. 初回選択されているポケモンの詳細データを取得
        await pokemonStatus.fetchSelectedPokemonData();
        pokemonStatus.selectedPokemonName = pokemonStatus.pokemonData.Name;

        // 4. 食材選択オプションを、取得したポケモンデータに基づいて設定
        setIngredientOptions();

        // 5. サブスキル選択モーダルとボタンをセットアップ
        await setupSubSkillModal();
        updateSubSkillButtonStates(); // 初期ボタン状態を反映
        updateSelectedSubSkillDisplay(); // 選択中サブスキルの表示を更新

        // 6. 性格選択UIをセットアップ（初期の「無補正」性格もここで設定される）
        await setupPersonalityOptions();

        // 7. 全ての初期設定が完了したら、ステータスを計算して表示
        await loadStatus();
    }

    // --- イベントリスナー登録 ---
    // ユーザー操作によるイベントリスナーをまとめて登録
    function registerEventListeners() {
        DOM.selectPokemonName?.addEventListener("change", async () => {
            // ポケモンが変更されたら、新しいポケモンデータでUIと計算を更新
            pokemonStatus.selectedPokemonNo = parseInt((DOM.selectPokemonName as HTMLSelectElement).value);
            await pokemonStatus.fetchSelectedPokemonData(); // 新しいポケモンデータを取得
            setIngredientOptions(); // 食材オプションを更新
            await loadStatus(); // ステータスを再計算・表示
        });

        DOM.level?.addEventListener("change", loadStatus); // レベル変更時に再計算
        // サブスキルボタンのクリックはsetupSubSkillModal内で処理され、モーダルが閉じるときにloadStatusが呼ばれる
        DOM.selectIngredientA?.addEventListener("change", loadStatus);
        DOM.selectIngredientB?.addEventListener("change", loadStatus);
        DOM.selectIngredientC?.addEventListener("change", loadStatus);
        // 性格変更はsetupPersonalityOptions内で処理され、モーダルが閉じるときにloadStatusが呼ばれる
    }

    // --- アプリケーションの実行 ---
    // DOMContentLoadedイベント内で、アプリケーションの初期化とイベントリスナー登録を実行
    await initializeApp();
    registerEventListeners();
});
