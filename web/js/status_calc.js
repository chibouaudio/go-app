"use strict";
document.addEventListener("DOMContentLoaded", async function () {
    // --- 変数宣言 ---
    const personality = document.getElementById("personality");
    const resultSpeedOfHelp = document.getElementById("resultSpeedOfHelp");
    const level = document.getElementById("level");
    const subSkillButtons = document.getElementById("subSkillButtons");
    const modal = document.getElementById("subSkillModal");
    const openModalButton = document.getElementById("btnSubSkill");
    const closeModalButton = document.getElementById("closeSubSkillModal");
    const selectedSubSkilllabel = document.getElementById("selectedSubSkilllabel");
    const resultHelpingCount = document.getElementById("resultHelpingCount");
    const badgeNumbers = [10, 25, 50, 75, 100];
    const MAX_SUB_SUBSKILLS = 5;
    let selectedSubSkills = [];
    // --- 初期化 ---
    await loadCalc();
    setsubSkillModal();
    // --- イベントリスナー ---
    personality?.addEventListener("change", loadCalc);
    level?.addEventListener("change", loadCalc);
    subSkillButtons?.addEventListener("click", loadCalc);
    // --- 計算・表示 ---
    async function loadCalc() {
        if (!resultSpeedOfHelp || !resultHelpingCount)
            return;
        console.log("計算を開始します...");
        // おてつだい時間を表示する
        const speedOfHelping = getSpeedOfHelp(personality.value || "");
        const minutes = Math.floor(speedOfHelping / 60);
        const seconds = speedOfHelping % 60;
        const helpingCount = await getHelpingCount(100, speedOfHelping);
        // 結果を表示
        resultSpeedOfHelp.textContent = `${speedOfHelping} : ${minutes}分${seconds}秒`;
        resultHelpingCount.textContent = helpingCount.toString();
    }
    // おてつだいスピードを計算する関数
    function getSpeedOfHelp(personality) {
        const baseSpeedOfHelp = 2200;
        const pokemonlevel = parseInt(level.value, 10) || 1;
        const helpingSpeedM = selectedSubSkills.some(s => s.subskill === "おてつだいスピードM");
        const helpingSpeedS = selectedSubSkills.some(s => s.subskill === "おてつだいスピードS");
        const helpingBonus = countHelpingBonus();
        const goodNightRibbon = { goodNightRibbonTime: 0, evolveCount: 2 };
        const levelModifier = 1 - (pokemonlevel - 1) * 0.002;
        const personalityModifier = getPersonalityModifier(personality);
        const subSkillModifier = 1 - getSubSkillModifier(helpingSpeedM, helpingSpeedS, helpingBonus);
        const goodNightRibbonModifier = 1 - getGoodNightRibbon(goodNightRibbon);
        // console.log(`Base Speed: ${baseSpeedOfHelp}, Level Modifier: ${levelModifier}, Personality Modifier: ${personalityModifier}, Sub Skill Modifier: ${subSkillModifier}, Good Night Ribbon Modifier: ${goodNightRibbonModifier}`);
        return Math.floor(baseSpeedOfHelp * levelModifier * personalityModifier * subSkillModifier * goodNightRibbonModifier);
    }
    // 性格の補正値を取得
    function getPersonalityModifier(personality) {
        switch (personality) {
            case "normal": return 1;
            case "down": return 1.075;
            case "up": return 0.9;
            default: return 1;
        }
    }
    // サブスキルの補正値を取得
    function getSubSkillModifier(helpingSpeedM, helpingSpeedS, helpingBonus) {
        let totalModifier = 0;
        if (helpingSpeedM)
            totalModifier += 0.14;
        if (helpingSpeedS)
            totalModifier += 0.07;
        for (let i = 0; i < helpingBonus; i++)
            totalModifier += 0.05;
        if (totalModifier >= 0.35)
            totalModifier = 0.35;
        return totalModifier;
    }
    // おやすみリボンの補正値を取得
    function getGoodNightRibbon(goodNightRibbon) {
        const sleepTime = goodNightRibbon.goodNightRibbonTime;
        const evolveCount = goodNightRibbon.evolveCount;
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
    // おてつだいボーナスをカウントする
    function countHelpingBonus() {
        let helpingBonusCount = selectedSubSkills.filter(s => s.subskill.startsWith("おてつだいボーナス")).length;
        return helpingBonusCount > 5 ? 5 : helpingBonusCount;
    }
    // おてつだい回数を計算する
    async function getHelpingCount(genki, speed) {
        if (!genki || !speed)
            return 0;
        console.log(`おてつだい回数計算: genki=${genki}, speed=${speed}`);
        try {
            const response = await fetch('/api/calcHelpingCount', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    maxGenki: genki,
                    helpingSpeed: speed
                })
            });
            console.log(response);
            const data = await response.json();
            console.log('おてつだい回数取得:', data);
            return Math.round(data.helpingCount * 100) / 100; // 小数点以下2桁まで
        }
        catch (error) {
            console.error('おてつだい回数取得エラー:', error);
            return 0;
        }
    }
    // --- サブスキルモーダル ---
    async function setsubSkillModal() {
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
                const idx = selectedSubSkills.findIndex(s => s.subskill === element.subskill);
                if (idx >= 0) {
                    selectedSubSkills.splice(idx, 1);
                }
                else {
                    if (selectedSubSkills.length < MAX_SUB_SUBSKILLS) {
                        selectedSubSkills.push(element);
                    }
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
            loadCalc();
        };
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
                modal.classList.remove("show");
                loadCalc();
            }
        };
    }
    // --- サブスキル取得 ---
    async function getSubSkills() {
        try {
            const response = await fetch('/api/getSubSkills');
            if (!response.ok)
                throw new Error("サブスキル取得失敗");
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error('サブスキル取得エラー:', error);
            return undefined;
        }
    }
    // --- ボタン状態更新 ---
    function updateButtonStates() {
        if (!subSkillButtons)
            return;
        const buttons = subSkillButtons.querySelectorAll("button");
        buttons.forEach(btn => {
            const subskill = btn.getAttribute("data-subskill");
            const idx = selectedSubSkills.findIndex(s => s.subskill === subskill);
            // 既存バッジを削除（不要なら削除してOK）
            const oldBadge = btn.querySelector('.subskill-badge');
            if (oldBadge)
                oldBadge.remove();
            if (idx >= 0) {
                btn.classList.add("selected");
                // バッジ番号リスト
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
    // --- 選択サブスキル表示 ---
    function updateSelectedDisplay() {
        if (!selectedSubSkilllabel)
            return;
        selectedSubSkilllabel.innerHTML = "";
        selectedSubSkills.forEach((s) => {
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
