        var noteTimer = null;
        function getInitialLang() {
            var fromQuery = new URLSearchParams(window.location.search).get('lang');
            if (fromQuery === 'it' || fromQuery === 'en') {
                return fromQuery;
            }

            try {
                var stored = localStorage.getItem('siteLang');
                if (stored === 'it' || stored === 'en') {
                    return stored;
                }
            } catch (e) {}

            return 'it';
        }

        function updateLangUrl(lang) {
            var url = new URL(window.location.href);
            if (lang === 'en') {
                url.searchParams.set('lang', 'en');
            } else {
                url.searchParams.delete('lang');
            }
            history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
        }

        function switchLang(lang) {
            if (lang === 'en') {
                document.body.classList.add('en');
                var dd = document.querySelector('.note-dropdown');
                if (dd && window.innerWidth <= 768) {
                    setTimeout(function() {
                        dd.classList.add('open');
                        if (noteTimer) clearTimeout(noteTimer);
                        noteTimer = setTimeout(function() { dd.classList.remove('open'); }, 7000);
                    }, 10);
                }
            } else {
                document.body.classList.remove('en');
                var dd = document.querySelector('.note-dropdown');
                if (dd) dd.classList.remove('open');
                if (noteTimer) { clearTimeout(noteTimer); noteTimer = null; }
            }
            document.querySelectorAll('.lang-switch a, .lang-switch-desktop a').forEach(function(a) {
                a.classList.remove('active');
                var t = a.textContent.trim().replace('*', '');
                if ((lang === 'it' && t === 'it') || (lang === 'en' && t === 'eng')) {
                    a.classList.add('active');
                }
            });

            document.documentElement.lang = lang === 'en' ? 'en' : 'it';

            var labels = lang === 'en'
                ? { thoughts: 'Thoughts', music: 'Music' }
                : { thoughts: 'Pensieri', music: 'Musica' };

            document.querySelectorAll('.nav-links a[data-nav]').forEach(function(a) {
                var role = a.getAttribute('data-nav');
                if (labels[role]) {
                    a.textContent = labels[role];
                }
            });

            document.querySelectorAll(".nav-links a[data-nav='thoughts']").forEach(function(a) {
                a.setAttribute('href', lang === 'en' ? 'index.html?lang=en' : 'index.html');
            });

            document.querySelectorAll(".nav-links a[data-nav='music']").forEach(function(a) {
                a.setAttribute('href', lang === 'en' ? 'music.html?lang=en' : 'music.html');
            });

            var indexIt = ['Il volo', 'Il temporale', 'Noia, tristezza e tranquillità', 'Rovine', 'Tesi, capitolo ultimo', 'Pensiero ingenuo, l\'inutile'];
            var indexEn = ['The flight', 'The storm', 'Boredom, sadness and tranquility', 'Ruins', 'Thesis, last chapter', 'Naive thought, the useless'];
            var items = lang === 'en' ? indexEn : indexIt;
            document.querySelectorAll('.indice-desktop a').forEach(function(a, i) { a.textContent = items[i]; });
            document.querySelectorAll('.indice a').forEach(function(a, i) { a.textContent = items[i]; });
            var btn = document.querySelector('.download-btn');
            if (btn) btn.textContent = lang === 'en' ? 'download as pdf' : 'scarica come pdf';

            try {
                localStorage.setItem('siteLang', lang);
            } catch (e) {}

            updateLangUrl(lang);
        }

        switchLang(getInitialLang());

        document.addEventListener('click', function(e) {
            var indice = document.querySelector('.indice');
            var toggle = document.querySelector('.index-toggle');
            if (!toggle.contains(e.target)) {
                indice.classList.remove('open');
            }
            var noteDropdown = document.querySelector('.note-dropdown');
            if (noteDropdown && !noteDropdown.contains(e.target)) {
                noteDropdown.classList.remove('open');
                if (noteTimer) { clearTimeout(noteTimer); noteTimer = null; }
            }
        });
