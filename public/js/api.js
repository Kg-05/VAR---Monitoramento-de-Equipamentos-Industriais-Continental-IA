// api.js — Módulo para chamadas à API do VAR

const API_BASE_URL = 'http://localhost:4000';

// Função auxiliar para fazer requisições
async function apiCall(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('token');
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro na chamada ${endpoint}:`, error);
    throw error;
  }
}

// Autenticação
const auth = {
  login: async (email, senha) => {
    const data = await apiCall('/auth/login', 'POST', { email, senha });
    localStorage.setItem('token', data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
  },

  getToken: () => localStorage.getItem('token'),

  registro: (nome, email, senha) => apiCall('/usuarios/public/registro', 'POST', { nome, email, senha }),
};

// Usuários
const usuarios = {
  listar: () => apiCall('/usuarios', 'GET'),
  criar: (body) => apiCall('/usuarios', 'POST', body),
  atualizar: (id, body) => apiCall(`/usuarios/${id}`, 'PUT', body),
  deletar: (id) => apiCall(`/usuarios/${id}`, 'DELETE'),
};

// Empresas
const empresas = {
  listar: () => apiCall('/empresas', 'GET'),
  criar: (body) => apiCall('/empresas', 'POST', body),
  atualizar: (id, body) => apiCall(`/empresas/${id}`, 'PUT', body),
  deletar: (id) => apiCall(`/empresas/${id}`, 'DELETE'),
};

// Equipamentos
const equipamentos = {
  listar: () => apiCall('/equipamentos', 'GET'),
  criar: (body) => apiCall('/equipamentos', 'POST', body),
  atualizar: (id, body) => apiCall(`/equipamentos/${id}`, 'PUT', body),
  deletar: (id) => apiCall(`/equipamentos/${id}`, 'DELETE'),
};

// Alertas
const alertas = {
  listar: () => apiCall('/alertas', 'GET'),
  criar: (body) => apiCall('/alertas', 'POST', body),
  reconhecer: (id, body) => apiCall(`/alertas/${id}/reconhecer`, 'POST', body),
};

// Avarias
const avarias = {
  listar: () => apiCall('/avarias', 'GET'),
  criar: (body) => apiCall('/avarias', 'POST', body),
  resolver: (id, body) => apiCall(`/avarias/${id}/resolver`, 'PUT', body),
};

// Registros de Imagem
const registroImagem = {
  listar: (params) => {
    let query = '';
    if (params) {
      const q = new URLSearchParams(params).toString();
      query = q ? `?${q}` : '';
    }
    return apiCall(`/registro-imagem${query}`, 'GET');
  },
  criar: (body) => apiCall('/registro-imagem', 'POST', body),
};

// Análises de IA
const analiseIA = {
  listar: (params) => {
    let query = '';
    if (params) {
      const q = new URLSearchParams(params).toString();
      query = q ? `?${q}` : '';
    }
    return apiCall(`/analise-ia${query}`, 'GET');
  },
  criar: (body) => apiCall('/analise-ia', 'POST', body),
};

// Formas de pagamento
const formasPagamento = {
  listar: () => apiCall('/formas-pagamento', 'GET'),
  criar: (body) => apiCall('/formas-pagamento', 'POST', body),
};
