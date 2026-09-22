const API_BASE = '/api';

function getAuthHeaders(extra = {}) {
  const headers = { ...extra };
  const token = localStorage.getItem('myfolio_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Books
  async getBooks() {
    const res = await fetch(`${API_BASE}/books`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Impossible de charger les livres');
    return res.json();
  },

  async getBookById(id) {
    const res = await fetch(`${API_BASE}/books/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Impossible de charger le livre');
    return res.json();
  },

  async createBook(data) {
    const res = await fetch(`${API_BASE}/books`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur lors de la création du livre');
    return res.json();
  },

  async updateBook(id, data) {
    const res = await fetch(`${API_BASE}/books/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur lors de la modification du livre');
    return res.json();
  },

  async deleteBook(id) {
    const res = await fetch(`${API_BASE}/books/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Erreur lors de la suppression du livre');
    return res.json();
  },

  // Mega-Fetch : Récupère tout le livre (labels, subLabels, products)
  async getBookContent(bookId) {
    const res = await fetch(`${API_BASE}/books/${bookId}/content`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error('Impossible de charger le contenu du livre');
    return res.json();
  },

  // Labels
  async createLabel(data) {
    const res = await fetch(`${API_BASE}/labels`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur lors de la création du label');
    }
    return res.json();
  },

  async updateLabel(id, data) {
    const res = await fetch(`${API_BASE}/labels/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur lors de la modification du label');
    }
    return res.json();
  },

  async deleteLabel(id, mode = 'cascade') {
    const res = await fetch(`${API_BASE}/labels/${id}?mode=${mode}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur lors de la suppression du label');
    }
    return res.json();
  },

  // SubLabels
  async createSubLabel(data) {
    const res = await fetch(`${API_BASE}/sublabels`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur lors de la création du sous-label');
    }
    return res.json();
  },

  async updateSubLabel(id, data) {
    const res = await fetch(`${API_BASE}/sublabels/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur lors de la modification du sous-label');
    }
    return res.json();
  },

  async deleteSubLabel(id, mode = 'cascade') {
    const res = await fetch(`${API_BASE}/sublabels/${id}?mode=${mode}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur lors de la suppression du sous-label');
    }
    return res.json();
  },

  // Products
  async createProduct(data) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur lors de la création du produit');
    }
    return res.json();
  },

  async updateProduct(id, data) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur lors de la mise à jour du produit');
    }
    return res.json();
  },

  async deleteProduct(id) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur lors de la suppression du produit');
    }
    return res.json();
  },

  // Upload image
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE}/products/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Erreur lors de l'upload de l'image");
    }
    return res.json();
  },
};
