function handleLogin(event) {
    event.preventDefault(); // 폼의 기본 제출 동작을 막습니다.

    const userId = document.getElementById('loginId').value; // 로그인 아이디 입력 값을 가져옵니다.
    const password = document.getElementById('loginPassword').value; // 비밀번호 입력 값을 가져옵니다.

    // 'users'라는 이름으로 localStorage에 저장된 사용자 목록을 가져오거나, 없으면 빈 배열을 만듭니다.
    const users = JSON.parse(localStorage.getItem("users")) || [];

    // 입력된 아이디와 비밀번호가 일치하는 사용자를 찾습니다.
    const user = users.find(u => u.userId === userId && u.password === password);

    if (user) { // 사용자를 찾았다면 (로그인 성공)
        alert(`${user.name}님 환영합니다!`); // 환영 메시지를 띄웁니다.
        // 로그인한 사용자 전체 객체를 문자열로 변환하여 'loggedInUser'라는 이름으로 localStorage에 저장합니다.
        localStorage.setItem("loggedInUser", JSON.stringify(user));
        window.location.href = "index.html"; // 로그인 후 이동할 페이지 (예: 메인 페이지)
    } else { // 사용자를 찾지 못했다면 (로그인 실패)
        alert("아이디 또는 비밀번호가 틀렸습니다."); // 오류 메시지를 띄웁니다.
    }
}