/* ===== Particles Background ===== */
(function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height, particles;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createParticles() {
    const count = Math.floor((width * height) / 18000);
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.08 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();
  window.addEventListener('resize', () => {
    resize();
    createParticles();
  });
})();

/* ===== Navbar Scroll Effect ===== */
(function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const links = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  if (toggle) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      toggle.classList.toggle('active');
    });
  }

  links.forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.classList.remove('active');
    });
  });

  // Active link on scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach((section) => {
      const top = section.offsetTop - 100;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });
    links.forEach((link) => {
      link.classList.toggle(
        'active',
        link.getAttribute('href') === `#${current}`
      );
    });
  });
})();

/* ===== Scroll Reveal (Fade In) ===== */
(function initScrollReveal() {
  const elements = document.querySelectorAll(
    '.section-title, .section-subtitle, .about-text, .stat-card, .blog-card, .contact-card'
  );

  elements.forEach((el) => el.classList.add('fade-in'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
})();

/* ===== Counter Animation ===== */
(function initCounters() {
  const counters = document.querySelectorAll('.stat-number');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-count'), 10);
          animateCounter(el, target);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((c) => observer.observe(c));

  function animateCounter(el, target) {
    const duration = 1500;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + (target >= 100 ? '+' : '+');
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }
})();

/* ===== Smooth Scroll for Safari ===== */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ===== Blog Rendering ===== */
(function initBlog() {
  if (typeof articles === 'undefined') return;

  const grid = document.getElementById('blog-grid');
  const filtersContainer = document.getElementById('blog-filters');
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  if (!grid || !filtersContainer) return;

  let currentTag = 'all';
  let currentQuery = '';

  // Collect all tags
  const allTags = new Set();
  articles.forEach((a) => a.tags.forEach((t) => allTags.add(t)));

  // Render filter buttons
  const filterHTML = ['<button class="filter-btn active" data-tag="all">全部</button>'];
  allTags.forEach((tag) => {
    filterHTML.push(`<button class="filter-btn" data-tag="${tag}">${tag}</button>`);
  });
  filtersContainer.innerHTML = filterHTML.join('');

  // Highlight helper
  function highlightText(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  // Render articles
  function renderArticles() {
    let filtered = currentTag === 'all'
      ? [...articles]
      : articles.filter((a) => a.tags.includes(currentTag));

    // Apply search filter
    if (currentQuery) {
      const q = currentQuery.toLowerCase();
      filtered = filtered.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        (a.content && a.content.toLowerCase().includes(q)) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="search-no-result">
          <div class="no-result-icon">🔍</div>
          <p>没有找到匹配「${currentQuery || currentTag}」的文章</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map((article, idx) => {
        const isFeatured = article.featured && currentTag === 'all' && !currentQuery && idx < 2;
        const title = highlightText(article.title, currentQuery);
        const excerpt = highlightText(article.excerpt, currentQuery);
        return `
        <article class="blog-card ${isFeatured ? 'featured' : ''}" data-id="${article.id}" onclick="openArticle(${article.id})" style="cursor:pointer;">
          ${isFeatured ? '<div class="card-tag">Featured</div>' : ''}
          <div class="card-meta">
            <span class="card-date">${article.date}</span>
            <span class="card-read">${article.readTime} read</span>
          </div>
          <h3 class="card-title">${title}</h3>
          <p class="card-excerpt">${excerpt}</p>
          <div class="card-tags">
            ${article.tags.map((t) => `<span class="tag">${highlightText(t, currentQuery)}</span>`).join('')}
          </div>
          <span class="card-link">阅读全文 →</span>
        </article>
      `;
      })
      .join('');

    // Re-observe for animations
    grid.querySelectorAll('.blog-card').forEach((el) => {
      el.classList.add('fade-in');
      setTimeout(() => el.classList.add('visible'), 50);
    });
  }

  renderArticles();

  // Filter click
  filtersContainer.addEventListener('click', (e) => {
    if (!e.target.classList.contains('filter-btn')) return;
    filtersContainer.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    e.target.classList.add('active');
    currentTag = e.target.dataset.tag;
    renderArticles();
  });

  // Search input
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentQuery = searchInput.value.trim();
        searchClear.style.display = currentQuery ? 'flex' : 'none';
        renderArticles();
      }, 200);
    });

    // Enter key — prevent form submit & trigger immediately
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(debounceTimer);
        currentQuery = searchInput.value.trim();
        searchClear.style.display = currentQuery ? 'flex' : 'none';
        renderArticles();
      }
    });
  }
})();

/* ===== Clear Search ===== */
function clearSearch() {
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
    searchClear.style.display = 'none';
    // Trigger input event to re-render
    searchInput.dispatchEvent(new Event('input'));
  }
}

/* ===== Article Modal ===== */
function openArticle(id) {
  const article = articles.find((a) => a.id === id);
  if (!article) return;

  const modal = document.getElementById('article-modal');
  modal.querySelector('.modal-date').textContent = article.date;
  modal.querySelector('.modal-read').textContent = article.readTime + ' read';
  modal.querySelector('.modal-title').textContent = article.title;
  modal.querySelector('.modal-tags').innerHTML = article.tags
    .map((t) => `<span class="tag">${t}</span>`)
    .join('');

  // 将全文内容按段落格式化为 HTML
  const paragraphs = article.content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      // 列表项（• 开头）
      if (line.startsWith('•') || line.startsWith('-')) {
        return `<p class="modal-list-item">${line}</p>`;
      }
      // 小标题（以"一、""二、"等开头，或全是大写中文）
      if (/^[一二三四五六七八九十]、/.test(line) || /^\d+\./.test(line)) {
        return `<h3 class="modal-subtitle">${line}</h3>`;
      }
      return `<p>${line}</p>`;
    })
    .join('');

  modal.querySelector('.modal-body').innerHTML = paragraphs;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

(function initModal() {
  const modal = document.getElementById('article-modal');
  if (!modal) return;

  const closeBtn = modal.querySelector('#modal-close');
  const overlay = modal.querySelector('.modal-overlay');

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
})();

/* ===== RSS Subscribe Modal ===== */
const RSS_SUBSCRIBERS_KEY = 'rss_subscribers';

function openRssModal(e) {
  if (e) e.preventDefault();
  const modal = document.getElementById('rss-modal');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  // Reset status
  document.getElementById('rss-email-status').textContent = '';
  document.getElementById('rss-email-status').className = 'rss-email-status';
}

function closeRssModal() {
  const modal = document.getElementById('rss-modal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function copyRssUrl() {
  const input = document.getElementById('rss-url');
  const btn = document.getElementById('rss-copy-btn');
  const text = document.getElementById('rss-copy-text');

  navigator.clipboard.writeText(input.value).then(() => {
    btn.classList.add('copied');
    text.textContent = '已复制 ✓';
    setTimeout(() => {
      btn.classList.remove('copied');
      text.textContent = '复制';
    }, 2000);
  }).catch(() => {
    // Fallback for older browsers
    input.select();
    document.execCommand('copy');
    btn.classList.add('copied');
    text.textContent = '已复制 ✓';
    setTimeout(() => {
      btn.classList.remove('copied');
      text.textContent = '复制';
    }, 2000);
  });
}

function subscribeEmail() {
  const emailInput = document.getElementById('rss-email');
  const statusEl = document.getElementById('rss-email-status');
  const btn = document.getElementById('rss-subscribe-btn');
  const btnText = document.getElementById('rss-subscribe-text');
  const email = emailInput.value.trim();

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    statusEl.textContent = '请输入邮箱地址';
    statusEl.className = 'rss-email-status error';
    return;
  }
  if (!emailRegex.test(email)) {
    statusEl.textContent = '请输入有效的邮箱地址';
    statusEl.className = 'rss-email-status error';
    return;
  }

  // Check if already subscribed (localStorage)
  let subscribers = JSON.parse(localStorage.getItem(RSS_SUBSCRIBERS_KEY) || '[]');
  if (subscribers.includes(email)) {
    statusEl.textContent = '该邮箱已订阅，无需重复操作 🎉';
    statusEl.className = 'rss-email-status success';
    return;
  }

  // Save to localStorage
  subscribers.push(email);
  localStorage.setItem(RSS_SUBSCRIBERS_KEY, JSON.stringify(subscribers));

  // Show success
  btn.disabled = true;
  btnText.textContent = '已订阅 ✓';
  statusEl.textContent = '订阅成功！新文章发布时会通知你 🎉';
  statusEl.className = 'rss-email-status success';

  // Also store in a hidden form / send notification
  // This sends a signal that can be picked up by the notification script
  try {
    const subData = {
      email: email,
      subscribedAt: new Date().toISOString(),
      source: 'dewai.info'
    };
    // Store subscription data for the notification script to pick up
    let allSubs = JSON.parse(localStorage.getItem('rss_all_subscriptions') || '[]');
    allSubs.push(subData);
    localStorage.setItem('rss_all_subscriptions', JSON.stringify(allSubs));
  } catch (e) {
    // Silent fail for storage
  }

  setTimeout(() => {
    btn.disabled = false;
    btnText.textContent = '订阅';
  }, 3000);
}

// Init RSS Modal
(function initRssModal() {
  const modal = document.getElementById('rss-modal');
  if (!modal) return;

  const closeBtn = modal.querySelector('#rss-modal-close');
  const overlay = modal.querySelector('.rss-modal-overlay');

  closeBtn.addEventListener('click', closeRssModal);
  overlay.addEventListener('click', closeRssModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeRssModal();
    }
  });
})();
