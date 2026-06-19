(function() {
  var WHATSAPP_NUMBER = '96566279897';
  var STORAGE_KEY = 'itqan_reviews_cache';
  var SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxNFiHbnieyhK3XPy6T696x3RqOJXJtVlsnvdAlog-VsO86ALLSZb9zKN9Ledi_o7eztg/exec';
  var reviewsGrid = document.getElementById('reviewsGrid');
  var selectedRating = 0;
  var starEls = [];

  // ---- Sanitize (XSS protection) ----
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  function sanitizeUrl(url) {
    if (!url) return '';
    url = url.trim();
    if (/^https?:\/\//i.test(url)) return url;
    return '';
  }

  // ---- Star input ----
  var starContainer = document.getElementById('starInput');
  if (starContainer) {
    starEls = Array.from(starContainer.querySelectorAll('i'));
    starEls.forEach(function(s, idx) {
      s.addEventListener('mouseenter', function() {
        starEls.forEach(function(el, i) {
          el.style.color = i <= idx ? 'var(--gold)' : 'rgba(240,244,248,0.15)';
        });
      });
      s.addEventListener('mouseleave', function() {
        starEls.forEach(function(el, i) {
          el.style.color = i < selectedRating ? 'var(--gold)' : 'rgba(240,244,248,0.15)';
        });
      });
      s.addEventListener('click', function() {
        selectedRating = parseInt(s.getAttribute('data-val'));
        starEls.forEach(function(el, i) {
          el.classList.toggle('active', i < selectedRating);
          el.style.color = i < selectedRating ? 'var(--gold)' : 'rgba(240,244,248,0.15)';
        });
        document.getElementById('starError').style.display = 'none';
      });
    });
  }

  // ---- Render card ----
  function renderCard(r) {
    var card = document.createElement('div');
    card.className = 'review-card spotglow';

    var safeName = escapeHtml(r.name);
    var safeComment = escapeHtml(r.comment);
    var safeSite = sanitizeUrl(r.site);

    var stars = '';
    for (var s = 0; s < 5; s++) {
      stars += '<i class="fa-solid fa-star"></i>';
    }

    var meta = r.date ? r.date.substring(0, 10) : '';

    var siteHtml = '';
    if (safeSite) {
      var displaySite = safeSite.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      siteHtml = '<div class="review-site-wrap"><a href="' + safeSite + '" target="_blank" rel="noopener" class="review-site-link"><i class="fa-solid fa-link"></i> ' + displaySite + '</a></div>';
    }

    card.innerHTML =
      '<div class="review-stars">' + stars + '</div>' +
      '<div class="review-quote">' +
        '<i class="fa-solid fa-quote-right quote-icon"></i>' +
        '<p>' + safeComment + '</p>' +
      '</div>' +
      siteHtml +
      '<hr class="review-divider" />' +
      '<div class="review-author">' +
        '<div class="review-avatar">' + safeName.charAt(0) + '</div>' +
        '<div class="review-author-info">' +
          '<div class="review-name">' + safeName + '</div>' +
          '<div class="review-meta">' + meta + '</div>' +
        '</div>' +
      '</div>';

    var starEls_ = card.querySelectorAll('.review-stars i');
    starEls_.forEach(function(el, i) {
      el.style.color = i < r.rating ? 'var(--gold)' : 'rgba(240,244,248,0.12)';
    });

    return card;
  }

  // ---- Load from Sheets with localStorage fallback ----
  function loadReviews() {
    var cache = localStorage.getItem(STORAGE_KEY);
    var cached = cache ? JSON.parse(cache) : [];

    // Show loading state
    reviewsGrid.innerHTML = '<div class="review-loading"><i class="fa-solid fa-spinner fa-spin"></i> جاري تحميل التقييمات...</div>';

    if (SHEETS_URL && SHEETS_URL !== 'YOUR_WEB_APP_URL') {
      fetch(SHEETS_URL + '?t=' + Date.now())
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data.status === 'ok' && data.reviews && data.reviews.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.reviews));
            renderReviews(data.reviews);
            return;
          }
          renderReviews(cached);
        })
        .catch(function() { renderReviews(cached); });
    } else {
      renderReviews(cached);
    }
  }

  function renderReviews(reviews) {
    if (!reviews || reviews.length === 0) {
      reviewsGrid.innerHTML = '<div class="review-empty">لا توجد تقييمات بعد. كن أول من يقيم!</div>';
      return;
    }
    reviewsGrid.innerHTML = '';
    var wrapper = document.createElement('div');
    wrapper.className = 'reviews-static-grid';
    reviews.forEach(function(r) {
      wrapper.appendChild(renderCard(r));
    });
    reviewsGrid.appendChild(wrapper);
    if (window.reinitSpotglow) window.reinitSpotglow();
  }

  // ---- Focus Trap ----
  function getFocusable(el) {
    return el.querySelectorAll('button, input, textarea, [tabindex]:not([tabindex="-1"])');
  }
  var lastFocusedEl = null;

  function trapFocus(e) {
    var overlay = document.getElementById('reviewModalOverlay');
    if (!overlay.classList.contains('open')) return;
    var focusable = getFocusable(overlay);
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  // ---- Modal ----
  var reviewModalOverlay = document.getElementById('reviewModalOverlay');
  var reviewModalClose = document.querySelector('.review-modal .modal-close');
  var addReviewBtn = document.querySelector('.btn-review');
  var submitBtn = document.getElementById('submitBtn');

  window.openReviewModal = function() {
    lastFocusedEl = document.activeElement;
    selectedRating = 0;
    document.getElementById('reviewName').value = '';
    document.getElementById('reviewSite').value = '';
    document.getElementById('reviewComment').value = '';
    document.getElementById('reviewHp').value = '';
    document.getElementById('nameError').style.display = 'none';
    document.getElementById('starError').style.display = 'none';
    document.getElementById('commentError').style.display = 'none';
    document.getElementById('submitStatus').style.display = 'none';
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('submitBtn').innerHTML = '<i class="fa-solid fa-paper-plane"></i> إرسال التقييم';
    if (starEls.length) {
      starEls.forEach(function(el) {
        el.classList.remove('active');
        el.style.color = 'rgba(240,244,248,0.15)';
      });
    }
    document.getElementById('reviewModalOverlay').classList.add('open');
    document.addEventListener('keydown', trapFocus);
    // Focus first input
    setTimeout(function() { document.getElementById('reviewName').focus(); }, 50);
  };

  window.closeReviewModal = function() {
    document.getElementById('reviewModalOverlay').classList.remove('open');
    document.removeEventListener('keydown', trapFocus);
    if (lastFocusedEl) lastFocusedEl.focus();
  };

  // ---- Submit ----
  window.submitReview = function() {
    var name = document.getElementById('reviewName').value.trim();
    var site = document.getElementById('reviewSite').value.trim();
    var comment = document.getElementById('reviewComment').value.trim();
    var hp = document.getElementById('reviewHp').value;
    var hasError = false;

    // Validate name
    if (!name || name.length < 2 || name.length > 30) {
      document.getElementById('nameError').textContent = 'الاسم يجب أن يكون بين 2 و 30 حرفاً';
      document.getElementById('nameError').style.display = 'block';
      hasError = true;
    } else {
      document.getElementById('nameError').style.display = 'none';
    }

    // Validate rating
    if (selectedRating < 1) {
      document.getElementById('starError').style.display = 'block';
      hasError = true;
    } else {
      document.getElementById('starError').style.display = 'none';
    }

    // Validate comment (no links)
    if (comment && /https?:\/\//i.test(comment)) {
      document.getElementById('commentError').style.display = 'block';
      hasError = true;
    } else {
      document.getElementById('commentError').style.display = 'none';
    }

    if (hasError) return;

    // Disable button
    var btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ الإرسال...';

    // ≤ 3 → WhatsApp (same as before, no Sheets)
    if (selectedRating <= 3) {
      var detail = comment ? '\n\nالتفاصيل: ' + comment : '';
      var msg = encodeURIComponent(
        'السلام عليكم، أنا ' + name +
        (site ? ' (' + site + ')' : '') +
        '، قيمت تجربتي مع إتقان ويب بـ ' + selectedRating + '/5 نجوم.\nأرغب في حل المشكلة التي واجهتها لإكمال تقييمي.' + detail
      );
      closeReviewModal();
      window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + msg, '_blank');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> إرسال التقييم';
      return;
    }

    // ≥ 4 → POST to Sheets
    // Get client IP first
    fetch('https://api.ipify.org?format=json')
      .then(function(r) { return r.json(); })
      .then(function(ipData) {
        var clientIp = ipData.ip || 'unknown';
        submitToSheets(name, site, comment, selectedRating, hp, clientIp, btn);
      })
      .catch(function() {
        submitToSheets(name, site, comment, selectedRating, hp, 'unknown', btn);
      });
  }

  function submitToSheets(name, site, comment, rating, hp, clientIp, btn) {
    var payload = {
      name: name,
      rating: rating,
      comment: comment,
      site: site,
      hp: hp,
      ip: clientIp
    };

    if (SHEETS_URL && SHEETS_URL !== 'YOUR_WEB_APP_URL') {
      var params = '?data=' + encodeURIComponent(JSON.stringify(payload)) + '&t=' + Date.now();

      fetch(SHEETS_URL + params, { method: 'GET' })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data.status === 'ok') {
            closeReviewModal();
            showStatus('تم استلام تقييمك، سيظهر بعد الموافقة ✅', true);
          } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> إرسال التقييم';
            showStatus('خطأ: ' + (data && data.message ? data.message : 'غير معروف'), false);
          }
        })
        .catch(function(err) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> إرسال التقييم';
          showStatus('حدث خطأ في الإرسال: ' + err.message, false);
        });
    } else {
      // Fallback: localStorage only (بدون شيت)
      var cache = localStorage.getItem(STORAGE_KEY);
      var reviews = cache ? JSON.parse(cache) : [];
      var today = new Date();
      var dateStr = today.toLocaleDateString('ar-KW', { year:'numeric', month:'short', day:'numeric' });
      reviews.unshift({
        name: name, site: site, comment: comment,
        rating: rating, date: dateStr
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
      closeReviewModal();
      renderReviews(reviews);
      showStatus('تم إضافة تقييمك ✅', true);
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> إرسال التقييم';
    }
  };

  function showStatus(msg, isSuccess) {
    var existing = document.querySelector('.review-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'review-toast';
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);z-index:99999;background:' +
      (isSuccess ? 'rgba(212,175,55,0.15)' : 'rgba(255,80,80,0.15)') +
      ';border:1px solid ' + (isSuccess ? 'var(--gold)' : '#ff6b6b') +
      ';color:' + (isSuccess ? 'var(--gold)' : '#ff6b6b') +
      ';padding:14px 28px;border-radius:12px;font-size:0.95rem;font-family:inherit;' +
      'backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);' +
      'box-shadow:0 8px 32px rgba(0,0,0,0.3);transition:opacity 0.4s;text-align:center;max-width:90vw';
    document.body.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = '0';
      setTimeout(function() { toast.remove(); }, 400);
    }, 4000);
  }

  // ---- Bind modal events ----
  if (addReviewBtn) {
    addReviewBtn.addEventListener('click', window.openReviewModal);
  }
  if (reviewModalClose) {
    reviewModalClose.addEventListener('click', window.closeReviewModal);
  }
  if (submitBtn) {
    submitBtn.addEventListener('click', window.submitReview);
  }
  if (reviewModalOverlay) {
    reviewModalOverlay.addEventListener('click', function(e) {
      if (e.target === reviewModalOverlay) window.closeReviewModal();
    });
  }

  loadReviews();
})();
