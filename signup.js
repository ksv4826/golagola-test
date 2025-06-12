function requestVerification() {
    alert('인증 코드가 발송되었습니다! (예: 123456)');
    document.getElementById('verifyCode').disabled = false;
}

function handleSignup(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const userId = document.getElementById('id').value;
    const gender = document.getElementById('gender').value;
    const birthdate = document.getElementById('birthdate').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const verifyCode = document.getElementById('verifyCode').value;

    if (!name || !userId || !gender || !birthdate || !password || !confirmPassword || !verifyCode) {
        alert('모든 필드를 입력해주세요!');
        return;
    }

    if (password !== confirmPassword) {
        alert('비밀번호가 일치하지 않습니다!');
        return;
    }

    if (verifyCode !== '123456') { // This is a hardcoded verification code for demonstration
        alert('인증 코드가 올바르지 않습니다!');
        return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];

    if (users.some(user => user.userId === userId)) {
        alert('이미 존재하는 아이디입니다!');
        return;
    }

    const newUser = {
        name,
        userId,
        gender,
        birthdate,
        password
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    alert('회원가입 성공! 로그인 페이지로 이동합니다.');
    window.location.href = 'login.html';
}
