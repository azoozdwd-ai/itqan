(function() {
  // 0. Preloader
  var preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', function() {
      setTimeout(function() {
        preloader.classList.add('hidden');
      }, 600);
    });
  }

  // 1. Menu Toggle (navigation)
  var menuToggle = document.querySelector('.menu-toggle');
  var navLinks = document.getElementById('navLinks');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function() {
      navLinks.classList.toggle('open');
    });
  }

  // 2. Dynamic Navbar Scroll Effect
  var nav = document.querySelector('nav');
  if (nav) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 30) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }

  // 2. Multi-effect Scroll Entrance Observer
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        
        // Handle staggered items inside a container
        if (entry.target.classList.contains('stagger-wrap')) {
          var children = entry.target.querySelectorAll('.stagger-item');
          children.forEach(function(child, idx) {
            setTimeout(function() {
              child.classList.add('visible');
            }, idx * 120); // 120ms stagger delay
          });
        }
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  var animatableTargets = [
    '.fade-up', '.fade-in', '.slide-left', 
    '.slide-right', '.scale-up', '.stagger-wrap'
  ];
  animatableTargets.forEach(function(cls) {
    document.querySelectorAll(cls).forEach(function(el) {
      observer.observe(el);
    });
  });

  // 3. Mouse Interactive Spotlight Glow
  function initSpotglow() {
    var spotglows = document.querySelectorAll('.spotglow');
    spotglows.forEach(function(card) {
      card.addEventListener('mousemove', function(e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', x + 'px');
        card.style.setProperty('--mouse-y', y + 'px');
      });
    });
  }
  // Initialize spotglow
  initSpotglow();
  // Expose it globally so dynamically rendered cards (like reviews or services) can call it
  window.reinitSpotglow = initSpotglow;

  // 4. Back to Top Button Behavior
  var backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 400) {
        backToTop.classList.add('show');
      } else {
        backToTop.classList.remove('show');
      }
    });
    backToTop.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 5. Quick Callback Form Handling via WhatsApp
  var quickForm = document.getElementById('quickCallForm');
  if (quickForm) {
    quickForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var phoneInput = document.getElementById('quickPhone');
      var statusText = document.getElementById('quickStatus');
      if (!phoneInput) return;

      var phone = phoneInput.value.trim();
      if (!phone || phone.length < 8 || !/^[0-9+\s]+$/.test(phone)) {
        if (statusText) {
          statusText.style.color = '#ff6b6b';
          statusText.textContent = 'يرجى إدخال رقم هاتف صحيح (8 أرقام على الأقل)';
          statusText.style.display = 'block';
        }
        return;
      }

      if (statusText) {
        statusText.style.color = 'var(--gold)';
        statusText.textContent = 'جاري توجيهك إلى واتساب...';
        statusText.style.display = 'block';
      }

      var msg = encodeURIComponent('السلام عليكم إتقان ويب، أود طلب اتصال سريع بخصوص تصميم وبرمجة موقع. رقم هاتفي هو: ' + phone);
      var waUrl = 'https://wa.me/96566279897?text=' + msg;

      window.open(waUrl, '_blank');

      setTimeout(function() {
        phoneInput.value = '';
        if (statusText) {
          statusText.style.display = 'none';
        }
      }, 4000);
    });
  }
})();
