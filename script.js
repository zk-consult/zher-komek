/* ============================================================
   ZHER-KÖMEK — JavaScript Logic
   Handles: Navigation, Animations, FAQ, Calculator, Form Backend
   ============================================================ */

const CONFIG = {
    WHATSAPP_URL: 'https://wa.me/77778006286',
    FORM_ENDPOINT: 'https://zherkomek-api.ineverhe1p1991.workers.dev/api/leads'
};

// Analytics event tracker helper
window.trackEvent = function(eventName, eventParams = {}) {
    if (window.dataLayer && typeof window.dataLayer.push === 'function') {
        window.dataLayer.push({ event: eventName, ...eventParams });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // ---- Scroll-based Navigation Styling ----
    const nav = document.getElementById('nav');
    const handleNavScroll = () => {
        if (window.scrollY > 60) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', handleNavScroll, { passive: true });

    // ---- Mobile Menu Toggle ----
    const burger = document.getElementById('nav-burger');
    const navLinks = document.getElementById('nav-links');

    if (burger && navLinks) {
        burger.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-open');
            document.body.style.overflow = navLinks.classList.contains('mobile-open') ? 'hidden' : '';
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('mobile-open');
                document.body.style.overflow = '';
            });
        });
    }

    // ---- Scroll Reveal Animations ----
    const scrollElements = document.querySelectorAll('.animate-on-scroll');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -80px 0px',
        threshold: 0.1
    };

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const siblings = entry.target.parentElement.querySelectorAll('.animate-on-scroll');
                const siblingIndex = Array.from(siblings).indexOf(entry.target);
                const delay = siblingIndex * 100;

                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                
                scrollObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    scrollElements.forEach(el => scrollObserver.observe(el));

    // ---- FAQ Accordion ----
    const faqItems = document.querySelectorAll('.faq__item');
    
    faqItems.forEach(item => {
        const button = item.querySelector('.faq__question');
        if (!button) return;
        
        button.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    const otherBtn = otherItem.querySelector('.faq__question');
                    if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                }
            });

            item.classList.toggle('active');
            button.setAttribute('aria-expanded', !isActive);
        });
    });

    // ---- Form Processing Helper ----
    const submitLeadForm = async (formData, formEl, statusEl, submitBtn) => {
        // Honeypot check
        if (formData.website && formData.website.length > 0) {
            console.warn('Bot submission blocked');
            return false;
        }

        const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Отправка...</span>';
        }

        if (statusEl) {
            statusEl.className = 'form-status loading';
            statusEl.textContent = 'Проверка данных и отправка заявки...';
        }

        window.trackEvent('quiz_start');

        try {
            // Формируем текст для WhatsApp
            const msgText = `Здравствуйте! Хочу проверить свободную землю в регионе: ${formData.region || ''}, район/НП: ${formData.district || ''}, назначение: ${formData.purpose || ''}. Имя: ${formData.name || ''}, тел: ${formData.phone || ''}`;
            const waUrl = `${CONFIG.WHATSAPP_URL}?text=${encodeURIComponent(msgText)}`;

            // Асинхронно отправляем на бэкенд (Telegram) — fire-and-forget, не блокируем пользователя
            if (CONFIG.FORM_ENDPOINT) {
                fetch(CONFIG.FORM_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                }).catch(err => console.error('Ошибка отправки на бэкенд:', err));
            }

            // Успешный статус для пользователя и переход в WhatsApp
            window.trackEvent('quiz_submit', { status: 'success' });
            if (typeof fbq === 'function') {
                fbq('track', 'Lead');
            }
            
            if (statusEl) {
                statusEl.className = 'form-status success';
                statusEl.innerHTML = '✓ Данные приняты! Автоматически переходим в WhatsApp для ответа...';
            }

            setTimeout(() => {
                window.open(waUrl, '_blank');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>Заявка отправлена ✓</span>';
                }
                if (formEl) formEl.reset();
            }, 1200);

            return true;

        } catch (err) {
            console.error('Submission error:', err);
            window.trackEvent('form_error', { error: err.message });
            
            if (statusEl) {
                statusEl.className = 'form-status error';
                statusEl.textContent = `Произошла ошибка. Пожалуйста, напишите нам напрямую в WhatsApp.`;
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHTML;
            }
            return false;
        }
    };

    // ---- Hero Lead Form ----
    const heroForm = document.getElementById('hero-lead-form');
    if (heroForm) {
        heroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const statusEl = document.getElementById('hero-form-status');
            const submitBtn = heroForm.querySelector('button[type="submit"]');
            
            const formData = {
                region: document.getElementById('hero-region') ? document.getElementById('hero-region').value : '',
                district: document.getElementById('hero-district') ? document.getElementById('hero-district').value.trim() : '',
                purpose: document.getElementById('hero-purpose') ? document.getElementById('hero-purpose').value : '',
                name: document.getElementById('hero-name') ? document.getElementById('hero-name').value.trim() : '',
                phone: document.getElementById('hero-phone') ? document.getElementById('hero-phone').value.trim() : '',
                website: document.getElementById('hero-website') ? document.getElementById('hero-website').value : '',
                source: 'hero',
                page: 'zherkomek.com'
            };

            if (!formData.name || !formData.phone || formData.phone.replace(/\D/g, '').length < 10) {
                if (statusEl) {
                    statusEl.className = 'form-status error';
                    statusEl.textContent = 'Пожалуйста, укажите имя и корректный номер телефона';
                }
                return;
            }

            await submitLeadForm(formData, heroForm, statusEl, submitBtn);
        });
    }

    // ---- Footer Consultation Form ----
    const footerForm = document.getElementById('consultation-form');
    if (footerForm) {
        footerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const statusEl = document.getElementById('footer-form-status');
            const submitBtn = document.getElementById('form-submit');
            
            const formData = {
                name: document.getElementById('form-name') ? document.getElementById('form-name').value.trim() : '',
                phone: document.getElementById('form-phone') ? document.getElementById('form-phone').value.trim() : '',
                region: document.getElementById('form-region') ? document.getElementById('form-region').value : '',
                source: 'footer',
                page: 'zherkomek.com'
            };

            if (!formData.name || !formData.phone || formData.phone.replace(/\D/g, '').length < 10) {
                if (statusEl) {
                    statusEl.className = 'form-status error';
                    statusEl.textContent = 'Укажите имя и номер телефона';
                }
                return;
            }

            await submitLeadForm(formData, footerForm, statusEl, submitBtn);
        });
    }

    // ---- Phone Input Mask ----
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.startsWith('8')) value = '7' + value.slice(1);
            if (!value.startsWith('7') && value.length > 0) value = '7' + value;

            let formatted = '';
            if (value.length > 0) formatted = '+' + value.substring(0, 1);
            if (value.length > 1) formatted += ' (' + value.substring(1, 4);
            if (value.length > 4) formatted += ') ' + value.substring(4, 7);
            if (value.length > 7) formatted += '-' + value.substring(7, 9);
            if (value.length > 9) formatted += '-' + value.substring(9, 11);

            e.target.value = formatted;
        });
    });

    // ---- Smooth Scroll ----
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;
            
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                const offset = 80;
                const position = targetEl.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: position, behavior: 'smooth' });
            }
        });
    });

    // Track WhatsApp clicks
    document.querySelectorAll('a[href*="wa.me"]').forEach(waLink => {
        waLink.addEventListener('click', () => {
            window.trackEvent('whatsapp_click');
        });
    });

    // ---- Lightbox ----
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');
    const casesImages = document.querySelectorAll('.cases-card img');

    if (lightbox && lightboxImg && casesImages.length > 0) {
        casesImages.forEach(img => {
            img.addEventListener('click', () => {
                lightboxImg.src = img.src;
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });

        const closeLightbox = () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(() => { lightboxImg.src = ''; }, 300);
        };

        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox(); });
    }

    // ---- CALCULATOR DATA & LOGIC ----
    const REGIONS_DATA = {
        almaty: { name: "Алматы", price10: 18000000, range: "1 500 000–18 000 000 ₸", sourceNote: "город и пригород сильно отличаются" },
        astana: { name: "Астана", price10: 10000000, range: "1 000 000–10 000 000 ₸", sourceNote: "город и пригород сильно отличаются" },
        aktau: { name: "Актау", price10: 5000000, range: "500 000–5 000 000 ₸", sourceNote: "зависит от удалённости от моря и города" },
        shymkent: { name: "Шымкент", price10: 5500000, range: "800 000–5 500 000 ₸", sourceNote: "город и пригород сильно отличаются" },
        karaganda: { name: "Караганда", price10: 6000000, range: "600 000–6 000 000 ₸", sourceNote: "коммуникации сильно влияют на цену" },
        uralsk: { name: "Уральск", price10: 7000000, range: "800 000–7 000 000 ₸", sourceNote: "город и загородные участки отличаются" },
        taraz: { name: "Тараз", price10: 3800000, range: "600 000–3 800 000 ₸", sourceNote: "пригород дешевле" },
        atyrau: { name: "Атырау", price10: 3500000, range: "500 000–3 500 000 ₸", sourceNote: "пригород дешевле" },
        pavlodar: { name: "Павлодар", price10: 3200000, range: "500 000–3 200 000 ₸", sourceNote: "город и пригород отличаются" },
        kostanay: { name: "Костанай", price10: 4500000, range: "ориентир около 4 500 000 ₸", sourceNote: "цена зависит от расположения и коммуникаций" },
        kokshetau: { name: "Кокшетау", price10: 3200000, range: "600 000–3 200 000 ₸", sourceNote: "пригород дешевле" },
        aktobe: { name: "Актобе", price10: 2800000, range: "400 000–2 800 000 ₸", sourceNote: "город и пригород отличаются" },
        kyzylorda: { name: "Кызылорда", price10: 2500000, range: "400 000–2 500 000 ₸", sourceNote: "пригород дешевле" },
        taldykorgan: { name: "Талдыкорган", price10: 2800000, range: "500 000–2 800 000 ₸", sourceNote: "город и пригород отличаются" },
        semey: { name: "Семей", price10: 2600000, range: "400 000–2 600 000 ₸", sourceNote: "загородные варианты дешевле" },
        petropavlovsk: { name: "Петропавловск", price10: 2000000, range: "300 000–2 000 000 ₸", sourceNote: "город и загородные участки отличаются" },
        ust_kamenogorsk: { name: "Усть-Каменогорск", price10: 2500000, range: "400 000–2 500 000 ₸", sourceNote: "загородные варианты дешевле" },
        konaev: { name: "Конаев", price10: 3800000, range: "600 000–3 800 000 ₸", sourceNote: "город и пригород отличаются" },
        turkistan: { name: "Туркестан", price10: 3000000, range: "600 000–3 000 000 ₸", sourceNote: "пригород дешевле" },
        zhezkazgan: { name: "Жезказган", price10: 2600000, range: "ориентир около 2 600 000 ₸", sourceNote: "цена зависит от района" }
    };

    const CALC_PURPOSE = {
        izhs: { max: 10, factor: 1.0 },
        lph: { max: 25, factor: 0.42 },
        garden: { max: 12, factor: 0.68 }
    };

    const CALC_SERVICE = 100000;
    const calcMoney = n => new Intl.NumberFormat('ru-RU').format(Math.round(n));

    let calcType = 'izhs';
    const calcRegionInput = document.querySelector('#calcRegion');
    const calcAreaInput = document.querySelector('#area');
    const calcAreaValue = document.querySelector('#areaValue');
    const calcPurpose = document.querySelector('#purpose');

    if (calcRegionInput && calcAreaInput && calcPurpose) {
        calcPurpose.addEventListener('click', e => {
            const btn = e.target.closest('button');
            if (!btn) return;
            calcType = btn.dataset.type;
            document.querySelectorAll('#purpose button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            calcAreaInput.max = CALC_PURPOSE[calcType].max;
            calcAreaInput.value = CALC_PURPOSE[calcType].max;
            calcUpdate();
            window.trackEvent('calc_interact', { action: 'purpose_change', type: calcType });
        });

        calcRegionInput.addEventListener('change', () => {
            calcUpdate();
            window.trackEvent('calc_interact', { action: 'region_change', region: calcRegionInput.value });
        });

        calcAreaInput.addEventListener('input', () => {
            calcUpdate();
            window.trackEvent('calc_interact', { action: 'area_change', area: calcAreaInput.value });
        });

        function calcUpdate() {
            const regionKey = calcRegionInput.value;
            const resultEl = document.querySelector('#calcResult');
            const manualEl = document.querySelector('#manual');

            if (regionKey === 'other' || !REGIONS_DATA[regionKey]) {
                if (resultEl) resultEl.style.display = 'none';
                if (manualEl) manualEl.style.display = 'block';
                return;
            }

            if (resultEl) resultEl.style.display = 'block';
            if (manualEl) manualEl.style.display = 'none';

            const regionData = REGIONS_DATA[regionKey];
            const area = Number(calcAreaInput.value);
            
            // Base price per sotok for IZHS (10 sotok baseline)
            const basePerSot = regionData.price10 / 10;
            const perSot = Math.round(basePerSot * CALC_PURPOSE[calcType].factor);
            const market = perSot * area;
            const profit = market - CALC_SERVICE;
            const multiplier = Math.max(1, Math.round(market / CALC_SERVICE));

            if (calcAreaValue) calcAreaValue.textContent = area;

            const marketEl = document.querySelector('#market');
            if (marketEl) marketEl.textContent = calcMoney(market);

            const priceTextEl = document.querySelector('#priceText');
            if (priceTextEl) {
                priceTextEl.textContent = `${calcMoney(perSot)} ₸ за сотку (${regionData.sourceNote})`;
            }

            const profitEl = document.querySelector('#profit');
            if (profitEl) profitEl.textContent = `${calcMoney(profit)} ₸`;

            const multEl = document.querySelector('#mult');
            if (multEl) multEl.textContent = `×${multiplier}`;

            const multTextEl = document.querySelector('#multText');
            if (multTextEl) multTextEl.textContent = `${multiplier} тенге актива`;

            const percent = Math.max(1, Math.min(100, (CALC_SERVICE / market) * 100));
            const barEl = document.querySelector('#bar');
            if (barEl) barEl.style.width = percent + '%';

            const calcWhatsapp = document.querySelector('#calcWhatsapp');
            if (calcWhatsapp) {
                const textMsg = `Здравствуйте! Хочу проверить район по калькулятору. Регион: ${regionData.name}, площадь: ${area} соток, назначение: ${calcType.toUpperCase()}.`;
                calcWhatsapp.href = `${CONFIG.WHATSAPP_URL}?text=${encodeURIComponent(textMsg)}`;
            }
        }

        calcUpdate();
    }    // ----------------------------------------------------
    // Manual Tracking for WhatsApp Clicks (Facebook Pixel)
    // ----------------------------------------------------
    document.addEventListener('click', function(e) {
        const waLink = e.target.closest('a[href*="wa.me"]');
        if (waLink) {
            if (typeof fbq === 'function') {
                fbq('track', 'Contact');
            }
            if (typeof window.trackEvent === 'function') {
                window.trackEvent('whatsapp_click');
            }
        }
    });

});
