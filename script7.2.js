(function() {
    let slotAnimations = [];
    let roundCount = 0;
    let currentProbability = 0;
    let balance = 0;
    let currentOdds = 1;
    let minLimit = 0;
    let maxLimit = 9999;

    function handleClick(button, predefinedAmount) {
        disableAllButtons();
        placeBet(predefinedAmount);
        setTimeout(enableAllButtons, 9000);
    }

    function disableAllButtons() {
        document.querySelectorAll('.btn').forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
        });
        document.getElementById("deposit").disabled = true;
        document.getElementById("betAmount").disabled = true;
    }

    function enableAllButtons() {
        document.querySelectorAll('.btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('disabled');
        });
        document.getElementById("deposit").disabled = false;
        document.getElementById("betAmount").disabled = false;
    }

    function initializeSlots() {
        for (let i = 0; i < 4; i++) {
            let slotInner = document.getElementById(`slot${i}`);
            let html = '';
            for (let j = 0; j < 10; j++) {
                html += `<div class="slot-item">${j}</div>`;
            }
            html += html;
            slotInner.innerHTML = html;

            let slot = slotInner.parentElement;
            let slotItems = slotInner.querySelectorAll('.slot-item');
            slotItems.forEach(item => {
                item.style.height = `${slot.offsetHeight}px`;
                item.style.lineHeight = `${slot.offsetHeight}px`;
                item.style.fontSize = `${slot.offsetHeight * 0.6}px`;
            });

            startSlotAnimation(slotInner, i, 6 + Math.random());
        }
    }

    function startSlotAnimation(slot, index, speed) {
        let position = 0;
        let slotHeight = slot.querySelector('.slot-item').offsetHeight;

        function animate() {
            position -= speed;
            if (position <= -slotHeight * 10) {
                position = 0;
            }
            slot.style.transform = `translateY(${position}px)`;
            slotAnimations[index] = requestAnimationFrame(animate);
        }
        animate();
    }

    function stopAnimation(num) {
        let numStr = num.toString().padStart(4, '0');
        for (let i = 3; i >= 0; i--) {
            setTimeout(() => {
                cancelAnimationFrame(slotAnimations[i]);
                let slot = document.getElementById(`slot${i}`);
                let digit = parseInt(numStr[i]);
                let slotHeight = slot.querySelector('.slot-item').offsetHeight;
                slot.style.transition = 'transform 0.5s ease-out';
                slot.style.transform = `translateY(-${digit * slotHeight}px)`;
            }, (3 - i) * 500);
        }
    }

    function resetSlots() {
        for (let i = 0; i < 4; i++) {
            let slot = document.getElementById(`slot${i}`);
            cancelAnimationFrame(slotAnimations[i]);
            slot.style.transition = 'none';
            slot.style.transform = 'translateY(0)';
            void slot.offsetWidth;
            startSlotAnimation(slot, i, 4 + Math.random());
        }
    }

    function addDeposit() {
        let deposit = parseInt(document.getElementById("deposit").value);
        if (isNaN(deposit) || deposit < 0) {
            alert("請輸入有效的入金金額！");
            return;
        }
        balance += deposit;
        updateBalance();
        saveGameState();
    }

    function updateBalance() {
        document.getElementById("balance").textContent = balance;
    }

    function adjustProbability(percentage) {
        let range = 10000;
        let span = Math.floor(range * (percentage / 100));
        minLimit = Math.floor(Math.random() * (range - span));
        maxLimit = minLimit + span - 1;

        currentProbability = percentage;
        switch(percentage) {
            case 5: currentOdds = 10; break;
            case 10: currentOdds = 5; break;
            case 25: currentOdds = 2; break;
            case 50: currentOdds = 1.4; break;
            case 75: currentOdds = 1.1; break;
        }
        document.getElementById("rangeDisplay").innerHTML = `當前範圍：${minLimit.toString().padStart(4, '0')} 到 ${maxLimit.toString().padStart(4, '0')}，獲勝機率：${percentage}%`;
    }

    function placeBet(predefinedAmount) {
        let betAmount = predefinedAmount || parseInt(document.getElementById("betAmount").value);
        if (isNaN(betAmount) || betAmount <= 0) {
            alert("請輸入有效的下注金額！");
            enableAllButtons();
            return;
        }
        
        if (balance < betAmount) {
            alert("餘額不足，請先入金！");
            enableAllButtons();
            return;
        }
        document.getElementById("winOrLose").innerHTML = "";
        spinSlots();
        setTimeout(() => generateRandomNumber(betAmount), 3000);
    }

    function spinSlots() {
        for (let i = 0; i < 4; i++) {
            let slot = document.getElementById(`slot${i}`);
            cancelAnimationFrame(slotAnimations[i]);
            startSlotAnimation(slot, i, 12 + Math.random() * 4);
        }
    }

    function generateRandomNumber(betAmount) {
        roundCount++;
        let ranData = Math.floor(Math.random() * 10000);
        
        stopAnimation(ranData);
        
        setTimeout(() => {
            let result;
            let balanceChange;
            let winCondition = (ranData >= minLimit && ranData <= maxLimit);

            if (winCondition) {
                document.getElementById("winOrLose").innerHTML = "恭喜你贏了";
                result = "贏";
                balanceChange = betAmount * (currentOdds - 1);
                balance += balanceChange;
            } else {
                document.getElementById("winOrLose").innerHTML = "輸了";
                result = "輸";
                balanceChange = -betAmount;
                balance += balanceChange;
            }

            updateBalance();
            updateRecord(roundCount, currentProbability, betAmount, ranData, result, balanceChange);
            saveGameState();

            setTimeout(resetSlots, 2000);
        }, 2000);
    }

    function updateRecord(round, probability, betAmount, number, result, balanceChange) {
        let table = document.getElementById("recordTable").getElementsByTagName('tbody')[0];
        let row = document.createElement('tr');
        row.innerHTML = `
            <td>${round}</td>
            <td>${probability}%</td>
            <td>${betAmount}</td>
            <td>${number.toString().padStart(4, '0')}</td>
            <td>${result}</td>
            <td>${(balanceChange >= 0 ? "+" : "") + balanceChange.toFixed(2)}</td>
        `;
        table.insertBefore(row, table.firstChild);
    }

    function saveGameState() {
        localStorage.setItem('gameState', JSON.stringify({
            balance,
            roundCount
        }));
    }

    function loadGameState() {
        const savedState = JSON.parse(localStorage.getItem('gameState'));
        if (savedState) {
            balance = savedState.balance;
            roundCount = savedState.roundCount;
            updateBalance();
        }
    }

    function init() {
        initializeSlots();  // 初始化拉霸機
        adjustProbability(50);  // 設定預設的獲勝機率
        loadGameState();  // 載入遊戲狀態
    }

    window.addEventListener('load', init);

    window.handleClick = handleClick;
    window.addDeposit = addDeposit;
    window.adjustProbability = adjustProbability;
})();
