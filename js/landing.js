/* =========================================================
   EVINFLOW 
   Solo dos funciones simples:
   1. Abrir y cerrar el menú en dispositivos móviles.
   2. Añadir sombra al navbar cuando el usuario hace scroll.
   ========================================================= */

// Guardamos los elementos que vamos a usar
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const navbar = document.getElementById("navbar");

// 1. Mostrar u ocultar el menú móvil al hacer clic en el botón
menuToggle.addEventListener("click", function () {
  navLinks.classList.toggle("show");
});

// Cerramos el menú móvil cuando el usuario hace clic en un enlace
const links = navLinks.querySelectorAll("a");
links.forEach(function (link) {
  link.addEventListener("click", function () {
    navLinks.classList.remove("show");
  });
});

// 2. Cambiar el estilo del navbar cuando se hace scroll
window.addEventListener("scroll", function () {
  if (window.scrollY > 10) {
    navbar.style.boxShadow = "0 2px 12px rgba(0, 0, 0, 0.06)";
  } else {
    navbar.style.boxShadow = "none";
  }
});
