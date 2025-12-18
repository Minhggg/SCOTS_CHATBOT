/**
 * Small auth utilities.
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getUserInfo(): { name: string; email: string } | null {
  if (typeof window === 'undefined') return null;
  const storedUser = localStorage.getItem('user');
  const storedUsername = localStorage.getItem('username');

  if (storedUser) {
    try {
      const u = JSON.parse(storedUser);
      return { name: u.name || storedUsername || 'User', email: u.email || '' };
    } catch {
      return { name: storedUsername || 'User', email: localStorage.getItem('userEmail') || '' };
    }
  }

  if (storedUsername) {
    return { name: storedUsername, email: localStorage.getItem('userEmail') || '' };
  }

  return null;
}
