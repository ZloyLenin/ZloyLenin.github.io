// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('token');
    const currentPath = window.location.pathname;
    
    // If we're not on the auth page and there's no token, redirect to auth
    if (!token && !currentPath.includes('auth.html')) {
        window.location.href = '/auth.html';
        return false;
    }
    
    // If we're on the auth page and there is a token, redirect to board
    if (token && currentPath.includes('auth.html')) {
        window.location.href = '/board.html';
        return false;
    }
    
    return true;
}

// Run check on page load
document.addEventListener('DOMContentLoaded', checkAuth);

// Export the function for use in other scripts
export { checkAuth }; 