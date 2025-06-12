// 로그인 상태를 확인하고 화면을 업데이트하는 함수
function checkLoginStatus() {
    // 'loggedInUser'라는 이름으로 localStorage에 저장된 사용자 정보를 가져옵니다.
    const loggedInUser = localStorage.getItem('loggedInUser');
    const authSection = document.getElementById('authSection'); // 로그인/회원가입 버튼이 있는 영역
    const postForm = document.getElementById('postForm'); // 게시물 작성 폼

    if (loggedInUser) { // 로그인된 사용자 정보가 있다면
        // 저장된 사용자 객체(JSON 문자열)를 파싱하여 자바스크립트 객체로 변환합니다.
        const user = JSON.parse(loggedInUser);
        // authSection의 내용을 사용자 이름과 로그아웃 버튼으로 변경합니다.
        authSection.innerHTML = `
            <span class="text-pink-500">${user.name}님</span>
            <span class="mx-2 text-gray-500">|</span>
            <button onclick="logout()" class="text-gray-700 hover:text-pink-500 transition">로그아웃</button>
        `;
        // 참고: 이전에 있던 'document.getElementById('postUser').textContent = user.name;' 코드는
        // 예시 게시물의 사용자 이름을 설정하는 것이었으므로, 새 게시물에는 필요 없어서 제거했습니다.
    } else { // 로그인된 사용자 정보가 없다면
        // 게시물 작성 폼 대신 로그인 요청 메시지와 로그인 버튼을 표시합니다.
        postForm.innerHTML = `
            <p class="text-center text-gray-800">커뮤니티에 참여하려면 로그인이 필요합니다!</p>
            <a href="login.html?redirect=community.html" class="block text-center bg-pink-500 text-white px-6 py-3 rounded-lg font-semibold btn-hover mt-4">로그인</a>
        `;
    }
    displayPosts(); // 페이지 로드 시 기존 게시물들을 표시하기 위해 이 함수를 호출합니다.
}

// 로그아웃 함수
function logout() {
    localStorage.removeItem('loggedInUser'); // 'loggedInUser' 정보를 localStorage에서 제거합니다.
    alert('로그아웃되었습니다!'); // 로그아웃 메시지를 띄웁니다.
    window.location.href = 'index.html'; // 메인 페이지로 이동합니다.
}

// 게시물 제출 함수
function submitPost() {
    event.preventDefault(); // 폼의 기본 제출 동작을 막습니다.

    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) { // 로그인되어 있지 않다면
        alert('로그인이 필요합니다!'); // 경고 메시지를 띄우고
        window.location.href = 'login.html?redirect=community.html'; // 로그인 페이지로 이동시킵니다.
        return; // 함수 실행을 중단합니다.
    }

    const user = JSON.parse(loggedInUser); // 저장된 사용자 객체를 파싱합니다.
    const userName = user.name; // 로그인한 사용자의 이름을 가져옵니다.

    const title = document.getElementById('postTitle').value; // 게시물 제목 입력 값을 가져옵니다.
    const description = document.getElementById('postDescription').value; // 게시물 설명 입력 값을 가져옵니다.
    const option1 = document.getElementById('option1').value; // 첫 번째 옵션 값을 가져옵니다.
    const option2 = document.getElementById('option2').value; // 두 번째 옵션 값을 가져옵니다.
    const option3 = document.getElementById('option3').value; // 세 번째 옵션 값을 가져옵니다. (비어있을 수 있음)

    if (!title || !description || !option1 || !option2) {
        alert('제목, 설명, 최소 2개의 옵션을 입력해주세요!'); // 필수 필드 검증
        return;
    }

    const newPost = {
        id: Date.now(), // 게시물에 고유한 ID를 부여합니다 (현재 시간 기준).
        user: userName, // 게시물 작성자 (로그인한 사용자 이름)
        title: title,
        description: description,
        options: [ // 옵션 배열 초기화
            { text: option1, votes: 0 },
            { text: option2, votes: 0 }
        ],
        comments: [], // 댓글 배열 초기화
        timestamp: new Date().toISOString() // 게시물 작성 시간
    };

    if (option3) { // 세 번째 옵션이 있다면 추가
        newPost.options.push({ text: option3, votes: 0 });
    }

    // 기존 게시물들을 localStorage에서 가져오거나, 없으면 빈 배열로 초기화합니다.
    const posts = JSON.parse(localStorage.getItem('communityPosts')) || [];
    posts.unshift(newPost); // 새 게시물을 배열의 맨 앞에 추가합니다.
    localStorage.setItem('communityPosts', JSON.stringify(posts)); // 업데이트된 게시물 목록을 localStorage에 저장합니다.

    alert('고민이 공유되었습니다!'); // 성공 메시지
    // 폼 입력 필드 초기화
    document.getElementById('postTitle').value = '';
    document.getElementById('postDescription').value = '';
    document.getElementById('option1').value = '';
    document.getElementById('option2').value = '';
    document.getElementById('option3').value = '';

    displayPosts(); // 새 게시물을 포함하여 게시물들을 다시 화면에 표시합니다.
}

// 게시물들을 화면에 표시하는 함수
function displayPosts() {
    const postsContainer = document.querySelector('.space-y-8'); // 게시물들이 표시될 컨테이너
    postsContainer.innerHTML = ''; // 기존 게시물들을 먼저 모두 지웁니다.

    const posts = JSON.parse(localStorage.getItem('communityPosts')) || []; // localStorage에서 게시물 목록을 가져옵니다.

    if (posts.length === 0) { // 게시물이 없다면
        postsContainer.innerHTML = `
            <p class="text-center text-white text-lg mt-8 fade-in">아직 공유된 고민이 없어요. 첫 번째 고민을 공유해보세요!</p>
        `;
        return; // 함수 실행 중단
    }

    posts.forEach(post => { // 각 게시물에 대해 반복
        const postElement = document.createElement('div'); // 새로운 div 요소를 생성합니다.
        postElement.classList.add('bg-white', 'bg-opacity-90', 'p-8', 'rounded-xl', 'shadow-xl', 'max-w-3xl', 'mx-auto', 'fade-in'); // CSS 클래스 추가

        const timeAgo = getTimeAgo(post.timestamp); // 작성 시간으로부터 경과 시간 계산

        let optionsHtml = '';
        post.options.forEach((option, index) => { // 각 옵션에 대해 버튼 생성
            optionsHtml += `
                <button class="bg-pink-100 text-pink-600 px-4 py-2 rounded-lg btn-hover" onclick="vote('${post.id}', ${index})">
                    ${option.text} (${option.votes}표)
                </button>
            `;
        });

        let commentsHtml = '';
        if (post.comments.length > 0) { // 댓글이 있다면
            post.comments.forEach(comment => { // 각 댓글을 HTML로 변환
                commentsHtml += `
                    <p class="text-gray-600"><span class="font-semibold">${comment.user}:</span> ${comment.text}</p>
                `;
            });
        } else { // 댓글이 없다면
            commentsHtml = '<p class="text-gray-500">아직 댓글이 없습니다.</p>';
        }

        // 게시물 전체 HTML 구조를 생성합니다.
        postElement.innerHTML = `
            <div class="flex items-center mb-4">
                <img src="https://via.placeholder.com/40" alt="User Avatar" class="w-10 h-10 rounded-full mr-4">
                <div>
                    <p class="font-semibold text-gray-800">${post.user}</p>
                    <p class="text-sm text-gray-500">${timeAgo}</p>
                </div>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">${post.title}</h3>
            <p class="text-gray-600 mb-4">${post.description}</p>
            <div class="flex space-x-4 mb-4">
                ${optionsHtml}
            </div>
            <div class="border-t pt-4">
                ${commentsHtml}
                <form class="mt-4" onsubmit="addComment(event, '${post.id}')">
                    <input type="text" placeholder="댓글을 남겨주세요!" class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300" id="commentInput-${post.id}">
                    <button type="submit" class="mt-2 bg-pink-500 text-white px-4 py-2 rounded-lg font-semibold btn-hover">댓글 달기</button>
                </form>
            </div>
        `;
        postsContainer.appendChild(postElement); // 생성된 게시물 요소를 컨테이너에 추가합니다.
    });
}

// 투표 함수
function vote(postId, optionIndex) {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) { // 로그인되어 있지 않다면
        alert('투표하려면 로그인이 필요합니다!');
        window.location.href = 'login.html?redirect=community.html';
        return;
    }

    const posts = JSON.parse(localStorage.getItem('communityPosts')) || [];
    const postIndex = posts.findIndex(p => p.id == postId); // 해당 게시물의 인덱스를 찾습니다.

    if (postIndex !== -1) { // 게시물을 찾았다면
        posts[postIndex].options[optionIndex].votes++; // 해당 옵션의 투표 수를 1 증가시킵니다.
        localStorage.setItem('communityPosts', JSON.stringify(posts)); // 업데이트된 게시물 목록을 저장합니다.
        displayPosts(); // 투표 결과를 반영하기 위해 게시물을 다시 렌더링합니다.
    }
}

// 댓글 추가 함수
function addComment(event, postId) {
    event.preventDefault(); // 폼의 기본 제출 동작을 막습니다.
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) { // 로그인되어 있지 않다면
        alert('댓글을 달려면 로그인이 필요합니다!');
        window.location.href = 'login.html?redirect=community.html';
        return;
    }

    const user = JSON.parse(loggedInUser); // 저장된 사용자 객체를 파싱합니다.
    const userName = user.name; // 로그인한 사용자의 이름을 가져옵니다.

    const commentInput = document.getElementById(`commentInput-${postId}`); // 해당 게시물의 댓글 입력 필드
    const commentText = commentInput.value; // 댓글 내용을 가져옵니다.

    if (!commentText.trim()) { // 댓글 내용이 비어있다면
        alert('댓글 내용을 입력해주세요!');
        return;
    }

    const posts = JSON.parse(localStorage.getItem('communityPosts')) || [];
    const postIndex = posts.findIndex(p => p.id == postId); // 해당 게시물의 인덱스를 찾습니다.

    if (postIndex !== -1) { // 게시물을 찾았다면
        posts[postIndex].comments.push({ user: userName, text: commentText }); // 댓글을 추가합니다.
        localStorage.setItem('communityPosts', JSON.stringify(posts)); // 업데이트된 게시물 목록을 저장합니다.
        commentInput.value = ''; // 댓글 입력 필드를 초기화합니다.
        displayPosts(); // 댓글 반영을 위해 게시물을 다시 렌더링합니다.
    }
}

// 시간 표시를 위한 헬퍼 함수 (예: '2시간 전', '3일 전')
function getTimeAgo(timestamp) {
    const now = new Date(); // 현재 시간
    const past = new Date(timestamp); // 게시물 작성 시간
    const seconds = Math.floor((now - past) / 1000); // 경과 시간 (초)

    if (seconds < 60) {
        return `${seconds}초 전`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes}분 전`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours}시간 전`;
    }
    const days = Math.floor(hours / 24);
    if (days < 7) {
        return `${days}일 전`;
    }
    const weeks = Math.floor(days / 7);
    if (weeks < 4) {
        return `${weeks}주 전`;
    }
    const months = Math.floor(days / 30); // 대략적인 계산
    if (months < 12) {
        return `${months}개월 전`;
    }
    const years = Math.floor(days / 365);
    return `${years}년 전`;
}

// 페이지 로드 시 로그인 상태를 확인하고 게시물을 표시합니다.
window.onload = checkLoginStatus;