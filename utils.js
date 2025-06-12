async function apiCall(url, method, data) {
    // Placeholder: Simulate a successful signup response for local testing
    if (url === '/auth/signup' && method === 'POST') {
        // Simulate storing user data in localStorage for consistency with login.js
        const { userId, name, gender, birthdate, password } = data;
        localStorage.setItem('user_' + userId, JSON.stringify({
            name,
            password,
            gender,
            birthdate
        }));
        return { message: '회원가입 성공!' };
    }
    // Simulate an error for unrecognized endpoints
    throw new Error('API endpoint not implemented');
}
