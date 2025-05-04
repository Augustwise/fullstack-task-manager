function checkAuthentication() {
    const currentPath = window.location.pathname;

    const protectedPaths = ['/frontend/tasks.html'];

    const publicRedirectPaths = ['/frontend/login.html', '/frontend/signup.html', '/frontend/index.html', '/', '/frontend/', '/frontend'];

    fetch('/api/auth-check')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Auth check failed with status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.isAuthenticated) {
                const shouldRedirectToTasks = publicRedirectPaths.some(path =>
                    currentPath === path || (path !== '/' && currentPath.endsWith(path))
                );
                if (shouldRedirectToTasks) {
                    window.location.href = '/frontend/tasks.html';
                }
            } else {
                const isOnProtectedPath = protectedPaths.some(path =>
                    currentPath === path || currentPath.endsWith(path)
                );
                if (isOnProtectedPath) {
                    window.location.href = '/frontend/index.html';
                }
            }
        })
        .catch(error => {
            console.error('Authentication check failed:', error);
            const isOnPublicPage = publicRedirectPaths.some(path =>
                currentPath === path || (path !== '/' && currentPath.endsWith(path))
            );
            if (!isOnPublicPage) {
                window.location.href = '/frontend/index.html';
            }
        });
}

document.addEventListener('DOMContentLoaded', checkAuthentication); 
