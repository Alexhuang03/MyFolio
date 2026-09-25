const API_BASE = '/api/auth';

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('myfolio_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(url, options = {}, defaultErrMsg = 'Une erreur est survenue') {
  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    const error = new Error('NETWORK_ERROR');
    error.originalError = err;
    throw error;
  }

  let data = null;
  try {
    data = await res.json();
  } catch (_) {}

  if (!res.ok) {
    const error = new Error(data?.error || data?.message || defaultErrMsg);
    error.status = res.status;
    error.code = data?.code;
    error.data = data;
    throw error;
  }

  return data;
}

export const authService = {
  async register(userData) {
    return request(
      `${API_BASE}/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      },
      'Erreur lors de la création du compte'
    );
  },

  async login(credentials) {
    return request(
      `${API_BASE}/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      },
      'Erreur lors de la connexion'
    );
  },

  async logout() {
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (_) {}
  },

  async getMe() {
    const data = await request(
      `${API_BASE}/me`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      },
      'Session expirée'
    );
    return data.user;
  },

  async forgotPassword(email) {
    return request(
      `${API_BASE}/forgot-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      },
      'Erreur lors de la demande de réinitialisation'
    );
  },

  async resetPassword(token, password) {
    return request(
      `${API_BASE}/reset-password/${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      },
      'Erreur lors de la réinitialisation du mot de passe'
    );
  },

  async updateProfile(profileData) {
    return request(
      `${API_BASE}/profile`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData),
      },
      'Erreur lors de la mise à jour du profil'
    );
  },

  async changePassword({ currentPassword, newPassword }) {
    return request(
      `${API_BASE}/change-password`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      },
      'Erreur lors du changement de mot de passe'
    );
  },

  async verifyEmail(token) {
    return request(
      `${API_BASE}/verify-email/${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      'Erreur lors de la confirmation de votre adresse e-mail'
    );
  },

  async resendVerification(email) {
    return request(
      `${API_BASE}/resend-verification`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      },
      'Erreur lors du renvoi de l\'e-mail de confirmation'
    );
  },
};

