document.addEventListener('DOMContentLoaded', async function () {
    const selectFieldType = document.getElementById('fieldType');

    async function loadFieldTypes() {
        try {
            const response = await fetch('/api/getFieldData', {
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

            selectFieldType.innerHTML = '';
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '選択してください';
            selectFieldType.appendChild(defaultOption);

            // データからoptionを追加
            data.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                selectFieldType.appendChild(option);
            });
        } catch (error) {
            console.error('ドロップダウン取得エラー:', error);
        }
    }

    await loadFieldTypes();
});
