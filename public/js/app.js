// app.js — Script principal para lógica geral e navegação

document.addEventListener('DOMContentLoaded', () => {
  // Verificar autenticação ao carregar
  checkAuth();
  
  // Configurar eventos globais
  setupNavigation();
});

// Verificar se o usuário está autenticado
function checkAuth() {
  const token = auth.getToken();
  const currentPage = window.location.pathname;

  if (!token && currentPage !== '/login.html' && !currentPage.includes('login')) {
    window.location.href = '/login.html';
  }
}

// Configurar navegação
function setupNavigation() {
  const navLinks = document.querySelectorAll('[data-page]');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      navigate(page);
    });
  });

  // Botão logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.logout();
    });
  }
}

// Navegar entre páginas
function navigate(page) {
  window.location.href = `/${page}.html`;
}

// Exibir notificação
function showNotification(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.setAttribute('role', 'alert');
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  const container = document.querySelector('[data-notifications]') || document.body;
  container.prepend(alertDiv);

  // Auto-remover após 5 segundos
  setTimeout(() => alertDiv.remove(), 5000);
}

// Exibir erro
function showError(error) {
  showNotification(error.message || 'Erro desconhecido', 'danger');
}

// Formatar data
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('pt-BR');
}

// Formatar hora
function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString('pt-BR');
}
