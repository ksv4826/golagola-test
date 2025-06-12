// 로그인 상태 확인
function checkLoginStatus() {
    const loggedInUser = localStorage.getItem('loggedInUser'); // localStorage에서 로그인된 사용자 정보 가져오기
    const authSection = document.getElementById('authSection'); // 로그인/회원가입 링크가 있는 영역

    if (loggedInUser) { // 로그인된 사용자 정보가 있다면
        const user = JSON.parse(loggedInUser); // JSON 문자열을 객체로 파싱
        authSection.innerHTML = `
            <span class="text-pink-600">${user.name}님</span>
            <span class="mx-2 text-gray-400">|</span>
            <button onclick="logout()" class="text-gray-600 hover:text-pink-600 transition">로그아웃</button>
        `; // 사용자 이름과 로그아웃 버튼 표시
    } else {
        // 로그인 정보가 없으면 기본 로그인/회원가입 링크를 유지
        authSection.innerHTML = `
            <a href="login.html" class="hover:text-pink-600 transition">로그인</a>
            <span class="mx-2 text-gray-400">|</span>
            <a href="signup.html" class="hover:text-pink-600 transition">회원가입</a>
        `;
    }
}

function logout() {
    localStorage.removeItem('loggedInUser'); // 로그인 정보 삭제
    if (window.Android) {
        window.Android.showToast('로그아웃되었습니다!');
    } else {
        alert('로그아웃되었습니다!');
    }
    window.location.href = 'index.html'; // 홈 페이지로 이동
}

// 룰렛
function drawRoulette(options = ['옵션1', '옵션2', '옵션3']) {
    const canvas = document.getElementById('rouletteCanvas');
    const ctx = canvas.getContext('2d');
    const colors = ['#A7F3D0', '#FECACA', '#BAE6FD', '#FBCFE8', '#E5E7EB'];
    const arc = Math.PI * 2 / options.length;
    let startAngle = 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < options.length; i++) {
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, startAngle, startAngle + arc);
        ctx.lineTo(canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(startAngle + arc / 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px "HancomMalangMalang-Regular"';
        ctx.fillText(options[i], canvas.width / 4, 10);
        ctx.restore();

        startAngle += arc;
    }

    // Indicator
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 + 10, 0);
    ctx.lineTo(canvas.width / 2 - 10, 0);
    ctx.lineTo(canvas.width / 2, 20);
    ctx.fillStyle = '#FF0000';
    ctx.fill();
}

let rouletteInterval;
let currentRotation = 0;

function spinRoulette() {
    const optionsInput = document.getElementById('rouletteOptions').value;
    const options = optionsInput.split(',').map(opt => opt.trim()).filter(opt => opt);

    if (options.length === 0) {
        if (window.Android) {
            window.Android.showToast('옵션을 입력해주세요!');
        } else {
            alert('옵션을 입력해주세요!');
        }
        return;
    }

    clearInterval(rouletteInterval);
    const spinDuration = 3000; // 3 seconds
    const targetRotation = currentRotation + 360 * 5 + Math.random() * 360; // Spin at least 5 full rotations
    const startTime = Date.now();

    function animateSpin() {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / spinDuration, 1);
        const easing = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
        currentRotation = targetRotation * easing;

        const canvas = document.getElementById('rouletteCanvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(currentRotation * Math.PI / 180); // Convert degrees to radians
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        drawRoulette(options);
        ctx.restore();

        if (progress < 1) {
            requestAnimationFrame(animateSpin);
        } else {
            // Determine the selected option
            const finalAngle = (currentRotation % 360 + 360) % 360; // Normalize to 0-360
            const arc = 360 / options.length;
            const selectedIndex = Math.floor((360 - finalAngle) / arc); // Adjusted calculation for 0-360 and top indicator

            const result = options[selectedIndex];
            document.getElementById('rouletteResult').textContent = `결과: ${result}`;
            if (window.Android) {
                window.Android.showToast(`결과: ${result}`);
            }
        }
    }
    animateSpin();
}


// 뽑기
function startDraw() {
    const drawResult = document.getElementById('drawResult');
    const optionsInput = document.getElementById('drawOptions').value;
    const options = optionsInput.split(',').map(opt => opt.trim()).filter(opt => opt);

    if (options.length === 0) {
        if (window.Android) {
            window.Android.showToast('옵션을 입력해주세요!');
        } else {
            alert('옵션을 입력해주세요!');
        }
        return;
    }

    drawResult.textContent = '뽑는 중...';
    setTimeout(() => {
        const selected = options[Math.floor(Math.random() * options.length)];
        drawResult.textContent = `뽑힌 결과: ${selected}`;
        if (window.Android) {
            window.Android.showToast(`뽑힌 결과: ${selected}`);
        }
    }, 1000);
}

// 복불복
function startLuck() {
    const luckResult = document.getElementById('luckResult');
    const optionsInput = document.getElementById('luckOptions').value;
    const options = optionsInput.split(',').map(opt => opt.trim()).filter(opt => opt);

    if (options.length < 1) {
        if (window.Android) {
            window.Android.showToast('최소 1개의 옵션을 입력해주세요!');
        } else {
            alert('최소 1개의 옵션을 입력해주세요!');
        }
        return;
    }

    luckResult.textContent = '복불복 진행 중...';
    setTimeout(() => {
        const isLucky = Math.random() > 0.3; // 70% 확률로 당첨, 30% 확률로 꽝
        const selected = isLucky ? options[Math.floor(Math.random() * options.length)] : '꽝!';
        luckResult.textContent = `결과: ${selected}`;
        if (window.Android) {
            window.Android.showToast(`결과: ${selected}`);
        }
    }, 1000);
}

// 페이지 로드 시 초기화
window.onload = function() {
    checkLoginStatus(); // 로그인 상태 확인 함수 호출
    drawRoulette(); // 룰렛 초기화 그리기
    const urlParams = new URLSearchParams(window.location.search);
    const options = urlParams.get('options');
    if (options) {
        document.getElementById('rouletteOptions').value = options;
        drawRoulette(options.split(',').map(opt => opt.trim()).filter(opt => opt));
    }
};