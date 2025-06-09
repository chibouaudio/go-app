"use strict";
document.addEventListener("DOMContentLoaded", function () {
    const speedOfHelp = getSpeedOfHelp();
    console.log(speedOfHelp);
    // おてつだい時間を計算する関数
    function getSpeedOfHelp() {
        const baseSpeedOfHelp = 2700; // 基準おてつだい時間
        const level = 30; // レベル
        const levelModifier = 1 - (level - 1) * 0.002; // レベルによる補正
        const personality = "normal"; // 性格
        const personalityModifier = getPersonalityModifier(personality); // 性格補正
        const helpingSpeedM = true; // おてつだいスピードM
        const helpingSpeedS = true; // おてつだいスピードS
        const helpingBonus = 1; // おてつだいボーナスの数
        const subSkillModifier = 1 - getSubSkillModifier(helpingSpeedM, helpingSpeedS, helpingBonus); // サブスキル補正
        // おやすみリボン
        const goodNightRibbon = {
            goodNightRibbonTime: 500,
            evolveCount: 0
        };
        const goodNightRibbonModifier = 1 - getGoodNightRibbon(goodNightRibbon); // おやすみリボン補正
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
        return 1;
    }
});
