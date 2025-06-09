"use strict";
document.addEventListener("DOMContentLoaded", async function () {
    const personality = document.getElementById("personality");
    const resultSpeedOfHelp = document.getElementById("resultSpeedOfHelp");
    const MAX_SUBSKILLS = 5;
    // --- 初期化処理 ---
    loadCalc();
    getSubSkillOptions();
    function loadCalc() {
        if (!personality?.textContent || !resultSpeedOfHelp)
            return;
        const result = getSpeedOfHelp(personality.textContent);
        console.log("計算結果: " + result);
        resultSpeedOfHelp.textContent = result.toString();
    }
    // おてつだい時間を計算する関数
    function getSpeedOfHelp(personality) {
        const baseSpeedOfHelp = 2200; // 基準おてつだい時間
        const level = 42; // レベル
        const helpingSpeedM = true; // おてつだいスピードM
        const helpingSpeedS = false; // おてつだいスピードS
        const helpingBonus = 1; // おてつだいボーナスの数
        // おやすみリボン
        const goodNightRibbon = {
            goodNightRibbonTime: 0,
            evolveCount: 2
        };
        const levelModifier = 1 - (level - 1) * 0.002; // レベルによる補正
        const personalityModifier = getPersonalityModifier(personality); // 性格補正
        const subSkillModifier = 1 - getSubSkillModifier(helpingSpeedM, helpingSpeedS, helpingBonus); // サブスキル補正
        const goodNightRibbonModifier = 1 - getGoodNightRibbon(goodNightRibbon); // おやすみリボン補正
        // console.log("おてつだい時間計算開始");
        // console.log("基準おてつだい時間: " + baseSpeedOfHelp);
        // console.log("レベル: " + level);
        // console.log("性格: " + personality);
        // console.log("おてつだいスピードM: " + helpingSpeedM);
        // console.log("おてつだいスピードS: " + helpingSpeedS);
        // console.log("おてつだいボーナス: " + helpingBonus);
        // console.log("おやすみリボン時間: " + goodNightRibbon.goodNightRibbonTime);
        // console.log("おやすみリボン進化回数: " + goodNightRibbon.evolveCount);
        // console.log("レベル補正: " + levelModifier);
        // console.log("性格補正: " + personalityModifier);
        // console.log("サブスキル補正: " + subSkillModifier);
        // console.log("おやすみリボン補正: " + goodNightRibbonModifier);
        // 表示おてつだい時間 = Floor[ 基準おてつだい時間 × レベルによる補正 × おてつだいスピード性格補正 × サブスキル補正 × おやすみリボン補正 ]
        const speedOfHelp = Math.floor(baseSpeedOfHelp * levelModifier * personalityModifier * subSkillModifier * goodNightRibbonModifier);
        return speedOfHelp;
    }
    // 性格補正値を取得する関数
    function getPersonalityModifier(personality) {
        switch (personality) {
            case "normal":
                return 1; // 補正なし
            case "down":
                return 1.075; // 下降補正
            case "up":
                return 0.9; // 上昇補正
            default:
                return 1; // デフォルトは補正なし
        }
    }
    // サブスキル補正値を取得する関数
    function getSubSkillModifier(helpingSpeedM, helpingSpeedS, helpingBonus) {
        let totalModifier = 0;
        if (helpingSpeedM) {
            totalModifier += 0.14; // おてつだいスピードMの補正
        }
        if (helpingSpeedS) {
            totalModifier += 0.07; // おてつだいスピードSの補正
        }
        for (let i = 0; i < helpingBonus; i++) {
            totalModifier += 0.05; // おてつだいボーナスの補正
        }
        if (totalModifier >= 0.35) {
            totalModifier = 0.35;
        }
        return totalModifier;
    }
    // おやすみリボンの補正値を取得する関数
    function getGoodNightRibbon(goodNightRibbon) {
        const sleepTime = goodNightRibbon.goodNightRibbonTime; // おやすみリボン時間
        const evolveCount = goodNightRibbon.evolveCount; // 残り進化回数
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
    function getSubSkillOptions() {
        const subSkillButtons = document.getElementById("subSkillButtons");
        const modal = document.getElementById("subSkillModal");
        const openModalButton = document.getElementById("btnSubSkill");
        const closeModalButton = document.getElementById("closeSubSkillModal");
        if (!subSkillButtons || !modal || !openModalButton || !closeModalButton) {
            return;
        }
        let selectedSubSkills = [];
        function updateButtonStates() {
            if (!subSkillButtons)
                return;
            const buttons = subSkillButtons.querySelectorAll("button");
            buttons.forEach(btn => {
                const subskill = btn.getAttribute("data-subskill");
                if (selectedSubSkills.find(s => s.subskill === subskill)) {
                    btn.classList.add("selected");
                }
                else {
                    btn.classList.remove("selected");
                }
            });
        }
        function updateSelectedDisplay() {
            const btn = document.getElementById("btnSubSkill");
            if (btn) {
                btn.textContent = selectedSubSkills.map(s => s.subskill).join(" / ") || "サブスキルを選択";
            }
        }
        fetch('/api/getSubSkills')
            .then(response => response.json())
            .then(data => {
            subSkillButtons.innerHTML = "";
            const buttonRow = document.createElement("div");
            buttonRow.className = "row";
            subSkillButtons.appendChild(buttonRow);
            data.forEach((element) => {
                const colDiv = document.createElement("div");
                colDiv.className = "col-6 mb-2";
                const button = document.createElement("button");
                button.type = "button";
                button.className = "subskill-btn btn btn-outline-secondary w-100";
                button.classList.add(element.color + "-skill");
                button.textContent = element.subskill;
                button.setAttribute("data-subskill", element.subskill);
                button.onclick = () => {
                    const idx = selectedSubSkills.findIndex(s => s.subskill === element.subskill);
                    if (idx >= 0) {
                        selectedSubSkills.splice(idx, 1);
                    }
                    else {
                        if (selectedSubSkills.length < MAX_SUBSKILLS) {
                            selectedSubSkills.push(element);
                        }
                    }
                    updateButtonStates();
                    updateSelectedDisplay();
                };
                colDiv.appendChild(button);
                buttonRow.appendChild(colDiv);
            });
        })
            .catch(error => {
            console.error('サブスキル取得エラー:', error);
        });
        openModalButton.onclick = () => {
            modal.style.display = "block";
            modal.classList.add("show");
        };
        closeModalButton.onclick = () => {
            modal.style.display = "none";
            modal.classList.remove("show");
        };
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
                modal.classList.remove("show");
            }
        };
    }
});
