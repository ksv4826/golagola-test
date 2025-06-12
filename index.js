window.onload = function () {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));

    if (user) {
        // This element ID 'welcomeMessage' does not exist in the provided HTML.
        // If it were present, this line would update its text.
        // document.getElementById("welcomeMessage").textContent = `${user.name}님, 환영합니다!`;
    } else {
        // This element ID 'welcomeMessage' does not exist in the provided HTML.
        // If it were present, this line would update its text.
        // document.getElementById("welcomeMessage").textContent = `로그인이 필요합니다.`;
    }
    checkLoginStatus(); // Call checkLoginStatus on window load
};

function checkLoginStatus() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const authSection = document.getElementById('authSection');

    if (loggedInUser) {
        const user = JSON.parse(loggedInUser);
        authSection.innerHTML = `
            <span class="text-pink-500">${user.name}님</span>
            <span class="mx-2 text-gray-500">|</span>
            <a href="profile.html" class="text-gray-700 hover:text-pink-500 transition">내 프로필</a>
            <span class="mx-2 text-gray-500">|</span>
            <button onclick="logout()" class="text-gray-700 hover:text-pink-500 transition">로그아웃</button>
        `;
    }
}

function logout() {
    localStorage.removeItem("loggedInUser");
    window.location.reload();
}

function startDecision() {
    const input = document.getElementById('quickDecision').value;
    if (!input) {
        alert('고민을 입력해주세요! 커뮤니티로 입력하고 소통해보세요.');
        return;
    }
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        // 커뮤니티로 고민 공유 가능
        alert(`입력된 고민: ${input}\n랜덤 도구로 이동합니다!`);
        window.location.href = `random.html?options=${encodeURIComponent(input)}`;
    } else {
        alert('커뮤니티에 공유하려면 로그인이 필요합니다!');
        window.location.href = `login.html?redirect=random.html&options=${encodeURIComponent(input)}`;
    }
}
