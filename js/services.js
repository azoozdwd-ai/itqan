(function() {
  var servicesData = [
    { icon:'fa-solid fa-laptop-code',      title:'تصميم مواقع إلكترونية',    desc:'تصميم عصري متجاوب يعكس هوية علامتك التجارية ويجذب زوارك.',                                    tag:'تصميم احترافي',   bg:'linear-gradient(135deg,#0a1a31,#1a3a5f)',
      benefits:['واجهة جذابة وسهلة الاستخدام','متجاوب مع الجوال والتابعت','سرعة تحميل عالية'] },
    { icon:'fa-brands fa-instagram',    title:'إضافة أبرز منشورات إنستغرام',  desc:'أضف أبرز منشوراتك إلى موقعك الإلكتروني لزيادة التفاعل على حسابك وعرض محتواك بأسلوب احترافي يأسر زوارك.',                 tag:'عرض جذاب', bg:'linear-gradient(135deg,#0a1a31,#2a1a3f)',
      benefits:['عرض أبرز محتواك على الموقع','زيادة متابعين وتفاعل حقيقي','تحديث سهل بدون تعقيد'] },
    { icon:'fa-solid fa-star',          title:'نظام تقييمات مدمج',          desc:'أضف نظام تقييمات احترافي لخدماتك داخل موقعك — يبني ثقة الزوار ويزيد مصداقيتك أمام العملاء الجدد.',                         tag:'تعزيز ثقة',      bg:'linear-gradient(135deg,#0a1a31,#2a2a1f)',
      benefits:['بناء سمعة قوية تزيد المبيعات','إثبات جودة خدماتك للعملاء','تحسين ظهورك في محركات البحث'] },
    { icon:'fa-solid fa-magnifying-glass-chart', title:'تهيئة SEO',         desc:'تصدر نتائج البحث مجاناً وتخلص من الإعلانات المكلفة.',                                                              tag:'SEO متطور',       bg:'linear-gradient(135deg,#0a1a31,#1a3a2f)',
      benefits:['ظهور في أول نتائج البحث','زيارة عضوية مستهدفة','تحسين ظهورك في جوجل ماب'] },
    { icon:'fa-solid fa-map-location-dot', title:'خرائط جوجل الذكية',      desc:'ربط موقعك بخريطة جوجل وتفعيل التواجد المحلي.',                                                                     tag:'تواجد محلي',      bg:'linear-gradient(135deg,#0a1a31,#1a2a4f)',
      benefits:['ظهور عنوانك في خرائط جوجل','جذب عملاء جدد من قريبك','تحديث بياناتك بسهولة'] },
    { icon:'fa-brands fa-google',         title:'إنشاء حملات إعلانات قوقل',  desc:'ننشئ لك حملات إعلانية على منصة قوقل — تظهر للعميل المناسب وتدفع فقط عند النقر، مع متابعة دورية لتحسين النتائج.',                        tag:'إعلانات ذكية',    bg:'linear-gradient(135deg,#0a1a31,#1a4a3f)',
      benefits:['وصول سريع لعملاء يبحثون عنك','استهداف دقيق حسب المنطقة والفئة','نتائج فورية قابلة للقياس والتحسين'] },
    { icon:'fa-solid fa-server',           title:'استضافة سريعة وآمنة',     desc:'استضافة فائقة السرعة مع حماية متكاملة.',                                                                          tag:'استضافة آمنة',    bg:'linear-gradient(135deg,#0a1a31,#2a1a2f)',
      benefits:['سرعة تحميل فائقة','حماية من الهجمات','نسخ احتياطي يومي'] },
    { icon:'fa-solid fa-gift',             title:'دومين + إيميل مجاني',     desc:'دومين باسم شركتك وإيميل رسمي مجاناً مع كل باقة.',                                                                 tag:'هدية مع كل باقة', bg:'linear-gradient(135deg,#0a1a31,#1a3a3f)',
      benefits:['دومين .com مجاني','إيميل رسمي لشركتك','تعزيز مصداقيتك'] }
  ];
  var current = 0;
  var timer = null;
  var paused = false;
  var listEl = document.getElementById('servicesList');
  var displayEl = document.getElementById('servicesDisplay');
  var sdIcon = document.getElementById('sdIcon');
  var sdTitle = document.getElementById('sdTitle');
  var sdDesc = document.getElementById('sdDesc');
  var sdTag = document.getElementById('sdTag');
  var sdCounter = document.getElementById('sdCounter');
  var sdIndicators = document.getElementById('sdIndicators');
  var sdBg = document.getElementById('sdBg');
  var sdBenefits = document.getElementById('sdBenefits');

  function renderList() {
    listEl.innerHTML = '';
    servicesData.forEach(function(s, i) {
      var btn = document.createElement('button');
      btn.className = i === current ? 'active' : '';
      btn.setAttribute('data-index', i);
      btn.innerHTML = '<span class="s-icon"><i class="' + s.icon + '"></i></span>' + s.title;
      btn.addEventListener('click', function() { goTo(i); pause(); });
      listEl.appendChild(btn);
    });
  }

  function renderDisplay(i) {
    var s = servicesData[i];
    var bodyEl = document.querySelector('.services-display .sd-body');
    var iconEl = document.querySelector('.services-display .sd-icon');

    if (bodyEl && iconEl) {
      bodyEl.classList.add('sd-animating');
      iconEl.classList.add('sd-animating');

      setTimeout(function() {
        updateContent();
        bodyEl.classList.remove('sd-animating');
        iconEl.classList.remove('sd-animating');
      }, 150);
    } else {
      updateContent();
    }

    function updateContent() {
      if (sdBg) sdBg.style.background = s.bg;
      if (sdIcon) sdIcon.innerHTML = '<i class="' + s.icon + ' sd-icon-inner"></i>';
      if (sdTitle) sdTitle.textContent = s.title;
      if (sdDesc) sdDesc.textContent = s.desc;
      if (sdTag) sdTag.textContent = s.tag;
      if (sdBenefits) {
        sdBenefits.innerHTML = '';
        if (s.benefits) {
          s.benefits.forEach(function(b) {
            var li = document.createElement('li');
            li.innerHTML = '<i class="fa-solid fa-circle"></i> ' + b;
            sdBenefits.appendChild(li);
          });
        }
      }
      if (sdCounter) sdCounter.textContent = (i + 1) + ' / ' + servicesData.length;
      if (sdIndicators) {
        sdIndicators.innerHTML = '';
        servicesData.forEach(function(_, j) {
          var dot = document.createElement('span');
          if (j === i) dot.className = 'active';
          sdIndicators.appendChild(dot);
        });
      }
      // Update list buttons
      var btns = listEl.querySelectorAll('button');
      btns.forEach(function(b) { b.classList.remove('active'); });
      if (btns[i]) btns[i].classList.add('active');
      current = i;
    }
  }

  function goTo(i) {
    if (i < 0) i = servicesData.length - 1;
    if (i >= servicesData.length) i = 0;
    renderDisplay(i);
  }

  function next() { goTo((current + 1) % servicesData.length); }
  function prev() { goTo((current - 1 + servicesData.length) % servicesData.length); }

  // Bind prev/next buttons
  var prevBtn = displayEl.querySelector('.sd-prev');
  var nextBtn = displayEl.querySelector('.sd-next');
  if (prevBtn) prevBtn.addEventListener('click', function() { pause(); prev(); });
  if (nextBtn) nextBtn.addEventListener('click', function() { pause(); next(); });

  function pause() { paused = true; if (timer) { clearInterval(timer); timer = null; } }
  function resume() { paused = false; if (!timer) { timer = setInterval(next, 6000); } }

  // Hover pause
  displayEl.addEventListener('mouseenter', pause);
  displayEl.addEventListener('mouseleave', resume);
  listEl.addEventListener('mouseenter', pause);
  listEl.addEventListener('mouseleave', resume);

  renderList();
  renderDisplay(0);

  // Only start auto-rotation when #services is actually in view
  var servicesSection = document.getElementById('services');
  if (servicesSection) {
    var scrollObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting && !timer) {
          timer = setInterval(next, 6000);
        } else if (!entry.isIntersecting && timer) {
          clearInterval(timer); timer = null;
        }
      });
    }, { threshold:0.3 });
    scrollObserver.observe(servicesSection);
  }

  // Mobile grid
  var mg = document.getElementById('servicesMobileGrid');
  if (mg) {
    servicesData.forEach(function(s) {
      var card = document.createElement('div');
      card.className = 'sm-card spotglow';
      var benefitsHtml = '';
      if (s.benefits) {
        benefitsHtml = '<ul class="sm-benefits">';
        s.benefits.forEach(function(b) { benefitsHtml += '<li><i class="fa-solid fa-circle"></i> ' + b + '</li>'; });
        benefitsHtml += '</ul>';
      }
      card.innerHTML =
        '<div class="sm-head"><span class="sm-icon"><i class="' + s.icon + '"></i></span><h4>' + s.title + '</h4></div>' +
        '<div class="sm-desc">' + s.desc + '</div>' +
        benefitsHtml +
        '<span class="sm-tag">' + s.tag + '</span>';
      mg.appendChild(card);
    });
    // Reinitialize spotglow for newly added mobile elements
    if (window.reinitSpotglow) window.reinitSpotglow();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', function() { if (timer) clearInterval(timer); if (scrollObserver) scrollObserver.disconnect(); });
})();
