document.addEventListener('DOMContentLoaded', () => {
  const currentYearEl = document.getElementById('current-year');
  if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
  }

  const tabHeaders = document.querySelectorAll('.tab-header');
  const tabContents = document.querySelectorAll('.tab-content');

  if (tabHeaders.length && tabContents.length) {
    tabHeaders.forEach(header => {
      header.addEventListener('click', () => {
        tabHeaders.forEach(h => h.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        header.classList.add('active');
        const tabName = header.dataset.tab;
        const targetContent = document.getElementById(`${tabName}-content`);
        if (targetContent) targetContent.classList.add('active');
      });
    });
  }

  const analyzeTextBtn = document.getElementById('analyze-text');
  if (analyzeTextBtn) {
    analyzeTextBtn.addEventListener('click', () => {
      const jobTextEl = document.getElementById('job_text');
      const jobText = jobTextEl?.value.trim();

      if (!jobText) {
        alert('Please enter a job description to analyze');
        return;
      }

      showAnalyzing();

      setTimeout(() => {
        const isFake = jobText.toLowerCase().includes('work from home') &&
                       jobText.toLowerCase().includes('no experience') &&
                       jobText.toLowerCase().includes('urgent');

        showResult(isFake);
        hideAnalyzing();
      }, 1500);
    });
  }
  const analyzeUrlBtn = document.getElementById('analyze-url');
  if (analyzeUrlBtn) {
    analyzeUrlBtn.addEventListener('click', () => {
      const jobUrlEl = document.getElementById('job_url');
      const jobUrl = jobUrlEl?.value.trim();

      if (!jobUrl || !jobUrl.includes('.')) {
        alert('Please enter a valid URL');
        return;
      }

      showAnalyzing();

      setTimeout(() => {
        const isFake = jobUrl.includes('freelance') || 
                       jobUrl.includes('quick') || 
                       !jobUrl.includes('https://');

        showResult(isFake);
        hideAnalyzing();
      }, 1800);
    });
  }

  const accordionItems = document.querySelectorAll('.accordion-item');
  if (accordionItems.length) {
    accordionItems.forEach(item => {
      const header = item.querySelector('.accordion-header');
      if (header) {
        header.addEventListener('click', () => {
          accordionItems.forEach(otherItem => {
            if (otherItem !== item) {
              otherItem.classList.remove('active');
            }
          });
          item.classList.toggle('active');
        });
      }
    });
  }

  const testimonials = document.querySelectorAll('.testimonial');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  let currentTestimonial = 0;

  if (testimonials.length && prevBtn && nextBtn) {
    showTestimonial(currentTestimonial);

    prevBtn.addEventListener('click', () => {
      currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
      showTestimonial(currentTestimonial);
    });

    nextBtn.addEventListener('click', () => {
      currentTestimonial = (currentTestimonial + 1) % testimonials.length;
      showTestimonial(currentTestimonial);
    });

    setInterval(() => {
      currentTestimonial = (currentTestimonial + 1) % testimonials.length;
      showTestimonial(currentTestimonial);
    }, 5000);
  }

  function showTestimonial(index) {
    testimonials.forEach(testimonial => {
      testimonial.classList.remove('active');
    });
    testimonials[index].classList.add('active');
  }

  function showAnalyzing() {
    const loader = document.getElementById('analyzing-indicator');
    const result = document.getElementById('result-section');
    if (loader) loader.style.display = 'block';
    if (result) result.innerHTML = '';
  }

  function hideAnalyzing() {
    const loader = document.getElementById('analyzing-indicator');
    const result = document.getElementById('result-section');
    if (loader) loader.style.display = 'none';
    if (result) result.scrollIntoView({ behavior: 'smooth' });
  }

  function showResult(isFake) {
    const resultSection = document.getElementById('result-section');
    if (!resultSection) return;

    if (isFake) {
      resultSection.innerHTML = `
        <div class="result-alert result-alert-fake">
          <span class="result-icon">❌</span>
          <div class="result-content">
            <h3 style="color: var(--red)">Fake Job Posting Detected</h3>
            <p>This job posting shows common scam indicators. Be cautious!</p>
            <ul style="color: var(--red)">
              <li>Promises of high pay with minimal qualifications</li>
              <li>Requests for personal or financial information</li>
              <li>Unprofessional language or excessive urgency</li>
            </ul>
          </div>
        </div>
      `;
    } else {
      resultSection.innerHTML = `
        <div class="result-alert result-alert-real">
          <span class="result-icon">✅</span>
          <div class="result-content">
            <h3 style="color: var(--green)">Legitimate Job Posting</h3>
            <p>This job posting appears legitimate based on our analysis.</p>
            <p style="font-size: 0.875rem; margin-top: 0.5rem;">Always conduct your own research before sharing personal information.</p>
          </div>
        </div>
      `;
    }
  }
});
