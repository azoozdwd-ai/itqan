(function() {
  var IG_USERNAME = 'itqan.w3b';
  var stage = document.getElementById('cardStackStage');
  var dotsEl = document.getElementById('csDots');
  var footer = document.querySelector('.gallery-footer');

  var igImages = [
    'IG/5872874200098344312.webp',
    'IG/5872874200098344313.webp',
    'IG/5872874200098344314.webp',
    'IG/5872874200098344315.webp',
    'IG/5872874200098344317.webp',
    'IG/5879771908985786197.webp'
  ];

  var current = 0;
  var timer = null;
  var len = igImages.length;
  var cardW = 320; // falls back to 320px

  function measureCard() {
    var stageW = stage.offsetWidth;
    cardW = Math.min(stageW * 0.92, 440);
    if (cardW < 160) cardW = 160;
  }

  function posClass(i) {
    var d = i - current;
    if (d < -2) d += len;
    if (d > 3) d -= len;
    if (d === 0) return 'active';
    if (d === 1 || d === -(len-1)) return 'next1';
    if (d === -1 || d === len-1) return 'prev1';
    if (d === 2 || d === -(len-2)) return 'next2';
    if (d === -2 || d === len+1) return 'prev2';
    return 'hidden';
  }

  function getTransform(cls) {
    var r = cardW / 320;
    var t = { x:0, y:0, s:1, ry:0, o:1, z:0, b:'none', sc:'none' };
    switch (cls) {
      case 'active': t.x=0; t.y=-12*r; t.s=1.04; t.ry=0; t.o=1; t.z=100; t.sc='0 0 0 1px rgba(212,175,55,0.2)'; break;
      case 'next1':  t.x=85*r; t.y=18*r; t.s=0.84; t.ry=-10; t.o=0.85; t.z=60; break;
      case 'prev1':  t.x=-85*r; t.y=18*r; t.s=0.84; t.ry=10; t.o=0.85; t.z=60; break;
      case 'next2':  t.x=155*r; t.y=36*r; t.s=0.7; t.ry=-20; t.o=0.5; t.z=30; t.b='blur(1px)'; break;
      case 'prev2':  t.x=-155*r; t.y=36*r; t.s=0.7; t.ry=20; t.o=0.5; t.z=30; t.b='blur(1px)'; break;
      default:       t.x=0; t.y=60*r; t.s=0.5; t.ry=0; t.o=0; t.z=0; break;
    }
    return t;
  }

  function renderStack() {
    measureCard();
    var halfW = cardW / 2;
    var cards = stage.querySelectorAll('.cs-card');
    cards.forEach(function(card, i) {
      card.style.width = cardW + 'px';
      card.style.height = cardW + 'px';
      card.style.left = '50%';
      card.style.top = '50%';
      var cls = posClass(i);
      var t = getTransform(cls);
      card.style.transform = 'translate(-50%,-50%) translateX(' + t.x + 'px) translateY(' + t.y + 'px) scale(' + t.s + ') rotateY(' + t.ry + 'deg)';
      card.style.opacity = t.o;
      card.style.zIndex = t.z;
      card.style.filter = t.b;
      card.style.boxShadow = t.sc;
      card.className = 'cs-card' + (cls === 'active' ? ' active' : '');
    });
    var dots = dotsEl.querySelectorAll('span');
    dots.forEach(function(dot, i) { dot.className = i === current ? 'active' : ''; });
  }

  function goTo(i) {
    if (i < 0) i = len - 1;
    if (i >= len) i = 0;
    current = i;
    renderStack();
  }

  function next() { goTo((current + 1) % len); }
  function prev() { goTo((current - 1 + len) % len); }

  function pause() { if (timer) { clearInterval(timer); timer = null; } }
  function resume() { if (!timer) { timer = setInterval(next, 4000); } }

  function build() {
    stage.innerHTML = '';
    dotsEl.innerHTML = '';
    igImages.forEach(function(src, i) {
      var a = document.createElement('a');
      a.className = 'cs-card' + (i === 0 ? ' active' : '');
      a.href = 'https://www.instagram.com/' + IG_USERNAME + '/';
      a.target = '_blank';
      a.innerHTML =
        '<img src="' + src + '" alt="منشور إنستغرام" loading="lazy" />' +
        '<div class="cs-overlay"><span><i class="fa-brands fa-instagram"></i> عرض على إنستغرام</span></div>';
      stage.appendChild(a);
      var dot = document.createElement('span');
      dot.addEventListener('click', function() { goTo(i); pause(); resume(); });
      dotsEl.appendChild(dot);
    });
    renderStack();
    timer = setInterval(next, 4000);
  }

  // Controls
  document.querySelector('.cs-prev').addEventListener('click', function() { pause(); prev(); resume(); });
  document.querySelector('.cs-next').addEventListener('click', function() { pause(); next(); resume(); });

  // Pause on hover
  stage.addEventListener('mouseenter', pause);
  stage.addEventListener('mouseleave', resume);

  // Keyboard
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') { pause(); next(); resume(); }
    if (e.key === 'ArrowRight') { pause(); prev(); resume(); }
  });

  // Resize
  window.addEventListener('resize', renderStack);

  footer.innerHTML = '<a href="https://www.instagram.com/' + IG_USERNAME + '/" target="_blank" class="btn-gold"><i class="fa-brands fa-instagram"></i> تابعنا على إنستغرام</a>';

  build();
})();
