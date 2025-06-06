document.addEventListener('DOMContentLoaded', function() {
  // Menú móvil
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mainMenu = document.getElementById('mainMenu');
  
  if (mobileMenuBtn && mainMenu) {
    mobileMenuBtn.addEventListener('click', function() {
      mainMenu.classList.toggle('active');
    });
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', function(event) {
      if (!mainMenu.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
        mainMenu.classList.remove('active');
      }
    });
  }
  
  // Preview de imagen en formularios
  const fileInput = document.getElementById('imagen');
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      const fileName = e.target.files[0] ? e.target.files[0].name : 
        document.querySelector('.current-image') ? 'Mantener imagen actual' : 'Ninguna imagen seleccionada';
      
      const fileNameElement = document.getElementById('file-name');
      if (fileNameElement) {
        fileNameElement.textContent = fileName;
      }
    });
  }
  
  // Animación para elementos cuando entran en el viewport
  const animateOnScroll = function() {
    const elements = document.querySelectorAll('.pastry-card, .form-container, .profile-container, .auth-container');
    
    elements.forEach(element => {
      const elementPosition = element.getBoundingClientRect().top;
      const screenPosition = window.innerHeight / 1.2;
      
      if (elementPosition < screenPosition) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }
    });
  };
  
  // Aplicar estilo inicial a elementos animados
  const elementsToAnimate = document.querySelectorAll('.pastry-card, .form-container, .profile-container, .auth-container');
  elementsToAnimate.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  });
  
  // Ejecutar animación al cargar la página
  window.addEventListener('load', animateOnScroll);
  // Ejecutar animación al hacer scroll
  window.addEventListener('scroll', animateOnScroll);
});