document.addEventListener('DOMContentLoaded', async function () {
    const selectFieldName = document.getElementById('fieldName');
    const energyRequiredForM20 = document.getElementById('energyRequiredForM20');

    selectFieldName.addEventListener('change', function () {
        const selectFieldName = this.value;
        calcEnergy(selectFieldName);
    })

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

            console.log(data);

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

    async function calcEnergy(fieldName) {
        if (!fieldName) {
            return;
        }

        try {
            console.log(fieldName)
            const response = await fetch(`/api/calcEnergy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fieldName: fieldName
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

    await loadFieldNames();
});
