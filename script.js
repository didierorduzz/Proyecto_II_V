// script.js (reemplazar archivo entero con esto)
// Manejo de tema, menús, formulario y sesión (roles)

// Helper ready() — ejecuta fn cuando el DOM está listo
function ready(fn){
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

(function(){
  // --- Temas (mantener la lógica previa) ---
  (function(){
    const body = document.body;
    const saved = localStorage.getItem('theme') || 'green';
    if(saved === 'blue') body.classList.add('theme-blue');
  })();

  // --- Variables DOM que existen en index (pueden no existir en admin/brigadista) ---
  const themeToggleSelector = '#themeToggle';
  const burgerSelector = '.hamburger';
  const navSelector = '#navbar';

  // Demo users con rol explícito
  const demoUsers = [
    { user: 'demo', pass: 'demo123', name: 'Usuario Demo', role: 'brigadista' },
    { user: 'admin', pass: 'admin123', name: 'Administrador', role: 'admin' }
  ];

  // --- Funciones de session ---
  function setSession(u){
    localStorage.setItem('ifn_logged','1');
    localStorage.setItem('ifn_user', u.name);
    localStorage.setItem('ifn_role', u.role);
  }
  function clearSession(){
    localStorage.removeItem('ifn_logged');
    localStorage.removeItem('ifn_user');
    localStorage.removeItem('ifn_role');
  }
  function isLogged(){ return localStorage.getItem('ifn_logged') === '1'; }
  function getRole(){ return localStorage.getItem('ifn_role') || null; }
  function getUser(){ return localStorage.getItem('ifn_user') || null; }

  // --- UI: alternar tema ---
  ready(()=>{
    const themeBtn = document.querySelector(themeToggleSelector);
    themeBtn?.addEventListener('click', ()=>{
      document.body.classList.toggle('theme-blue');
      const isBlue = document.body.classList.contains('theme-blue');
      localStorage.setItem('theme', isBlue ? 'blue' : 'green');
    });
  });

  // --- Menú hamburguesa ---
  ready(()=>{
    const burger = document.querySelector(burgerSelector);
    const nav = document.querySelector(navSelector);
    burger?.addEventListener('click', ()=>{
      const open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  // --- Reveal intersection observer (si hay elementos .reveal) ---
  (function(){
    const reveals = document.querySelectorAll('.reveal');
    if(!reveals || reveals.length === 0) return;
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('show');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });
    reveals.forEach(el => io.observe(el));
  })();

  // --- Formulario muestras (no tocar si no existe) ---
  ready(()=>{
    const form = document.getElementById('muestraForm');
    const statusEl = document.getElementById('formStatus');
    function setMaxDateToday(){
      const f = document.getElementById('fecha');
      if(!f) return;
      const today = new Date().toISOString().split('T')[0];
      f.setAttribute('max', today);
    }
    setMaxDateToday();
    if(!form) return;
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      if(statusEl) statusEl.textContent = '';
      let valid = true;
      const fields = [
        {id:'codigo', msg:'Usa el formato MS-0001 (MS-####).'},
        {id:'idArbol', msg:'Usa el formato AR-0001 (AR-####).'},
        {id:'fecha', msg:'Selecciona una fecha válida (no futura).'},
        {id:'tipo', msg:'Selecciona el tipo de muestra.'},
        {id:'imagen', msg:'Adjunta una imagen (obligatoria).'},
        {id:'email', msg:'Ingresa un correo válido.'},
      ];
      fields.forEach(({id,msg})=>{
        const el = document.getElementById(id);
        if(!el) return;
        const err = el.parentElement.querySelector('.error-msg');
        if(!el.checkValidity()){
          valid = false;
          if(err) err.textContent = msg;
        } else {
          if(err) err.textContent = '';
        }
      });
      const acepto = document.getElementById('acepto');
      if(acepto && !acepto.checked){
        valid = false;
        acepto.focus();
      }
      if(valid){
        if(statusEl) statusEl.textContent = '✅ Envío correcto (demo).';
        form.reset();
        setMaxDateToday();
      } else {
        if(statusEl) statusEl.textContent = '⚠️ Revisa los campos marcados.';
      }
    });
  });

  // --- LOGIN / AUTH DEMO (manejo centralizado, seguro con ready) ---
  ready(()=>{
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const loginClose = document.getElementById('loginClose');
    const loginCancel = document.getElementById('loginCancel');
    const loginForm = document.getElementById('loginForm');
    const loginStatus = document.getElementById('loginStatus');

    function openModal(){
      if(!loginModal) return;
      loginModal.setAttribute('aria-hidden','false');
      document.body.style.overflow = 'hidden';
      document.getElementById('loginUser')?.focus();
    }
    function closeModal(){
      if(!loginModal) return;
      loginModal.setAttribute('aria-hidden','true');
      document.body.style.overflow = '';
      if(loginStatus) loginStatus.textContent = '';
      loginForm?.reset();
    }
    function authenticate(user, pass){
      return demoUsers.find(u => u.user === user && u.pass === pass);
    }

    // loginBtn: abre modal o pregunta por logout
    if(loginBtn){
      loginBtn.addEventListener('click', function(){
        if(isLogged()){
          if(confirm('¿Cerrar sesión actual?')){
            clearSession();
            updateHeaderForAuth();
            window.location.href = 'index.html';
          }
          return;
        }
        openModal();
      });
    }

    // modal close handlers (si existen)
    loginClose?.addEventListener('click', closeModal);
    loginCancel?.addEventListener('click', closeModal);
    document.addEventListener('keydown', e=>{
      if(e.key === 'Escape') closeModal();
    });
    loginModal?.addEventListener('click', e=>{
      if(e.target === loginModal) closeModal();
    });

    // submit login
    loginForm?.addEventListener('submit', e=>{
      e.preventDefault();
      const user = document.getElementById('loginUser')?.value.trim() || '';
      const pass = document.getElementById('loginPass')?.value || '';
      if(loginStatus) loginStatus.textContent = 'Verificando...';
      setTimeout(()=>{
        const ok = authenticate(user, pass);
        if(ok){
          setSession(ok);
          updateHeaderForAuth();
          if(loginStatus) loginStatus.textContent = '✅ Bienvenido, ' + ok.name + '.';
          setTimeout(()=>{
            closeModal();
            if(ok.role === 'admin') window.location.href = 'admin.html';
            else window.location.href = 'brigadista.html';
          }, 600);
        } else {
          if(loginStatus) loginStatus.textContent = '❌ Usuario o contraseña incorrectos.';
        }
      }, 500);
    });

    // Logout button present en admin/brigadista (enganchar SIEMPRE)
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn){
      logoutBtn.addEventListener('click', ()=>{
        clearSession();
        window.location.href = 'index.html';
      });
    }

    // update header display (index)
    function updateHeaderForAuth(){
      const headerActions = document.querySelector('.header-actions');
      const existingAvatar = document.querySelector('.user-avatar');
      const btn = document.getElementById('loginBtn');

      // Si no hay headerActions (ej: admin.html) solo ocultar/mostrar loginBtn si existe
      if(!headerActions){
        if(btn){
          if(isLogged()) btn.style.display = 'none';
          else btn.style.display = '';
        }
        return;
      }

      // Si tenemos headerActions, inyectamos avatar o mostramos el botón
      if(isLogged()){
        const name = getUser() || 'Usuario';
        if(existingAvatar) existingAvatar.remove();
        const div = document.createElement('div');
        div.className = 'user-avatar';
        div.innerHTML = `<button class="avatar-btn" title="${name}">${name.split(' ')[0]}</button>`;
        headerActions.insertBefore(div, headerActions.firstChild);

        // avatar click = cerrar sesión
        div.querySelector('button').addEventListener('click', ()=>{
          if(confirm('Cerrar sesión?')){
            clearSession();
            updateHeaderForAuth();
            // opción: mantener en la misma página o recargar index:
            window.location.href = 'index.html';
          }
        });

        if(btn) btn.style.display = 'none';
      } else {
        if(existingAvatar) existingAvatar.remove();
        if(btn) btn.style.display = '';
      }
    }

    // Exponer updateHeaderForAuth a nivel de ready (interno)
    updateHeaderForAuth();

    // controlar intentos de entrada directa a admin/brigadista
    (function enforceRoleOnPage(){
      const path = window.location.pathname.split('/').pop();
      const role = getRole();
      if(path === 'admin.html' && role !== 'admin'){
        clearSession();
        window.location.href = 'index.html';
      }
      if(path === 'brigadista.html' && role !== 'brigadista'){
        clearSession();
        window.location.href = 'index.html';
      }
    })();

    // escuchar storage (si sesión cambia en otra pestaña)
    window.addEventListener('storage', (e)=>{
      if(e.key === 'ifn_logged' || e.key === 'ifn_user' || e.key === 'ifn_role'){
        updateHeaderForAuth();
      }
    });
  }); // end ready()

})(); // end IIFE