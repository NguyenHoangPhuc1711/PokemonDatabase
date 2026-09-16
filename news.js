(function setupNewsFeed() {
    const feed = document.getElementById('news-feed');
    if (!feed) return;

    const officialNewsUrl = 'https://champions.pokemon.com/en-us/news/';
    const fallbackNews = [
        {
            category: 'Regulations',
            date: '2026-09-02',
            title: 'Get Ready for Regulation Set M-C in Pokémon Champions',
            summary: 'The official Pokémon news team introduces the next Regulation Set M-C, giving Trainers time to prepare teams and study the upcoming Ranked Battles environment.',
            body: ['Regulation Set M-C is coming to Pokémon Champions. The new ruleset gives Trainers a fresh Ranked Battles environment and a new reason to review their teams.', 'Before the season begins, check your core picks, test different move and item combinations, and follow the official announcement for the complete regulations and schedule.'],
            image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png',
            url: 'https://www.pokemon.com/us/news/get-ready-for-regulation-set-m-c-in-pokemon-champions',
            video: ''
        },
        {
            category: 'News',
            date: '2026-09-03',
            title: 'Pokémon Champions Junior Is Coming to Nintendo eShop',
            summary: 'A younger-player version of Pokémon Champions is coming to Nintendo eShop in Germany and Brazil, helping younger Trainers continue to participate in Championship Series events.',
            body: ['Pokémon Champions Junior is coming to Nintendo eShop in Germany and Brazil. The version is designed to help younger players continue participating in Championship Series events.', 'The update is part of the wider Pokémon Champions ecosystem and gives families a more age-appropriate way to join the competitive Pokémon community.'],
            image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
            url: 'https://www.pokemon.com/us/news/pokemon-champions-junior-is-coming-to-nintendo-eshop-in-germany-and-brazil'
        },
        {
            category: 'Events',
            date: '2026-08-05',
            title: 'Pokémon Champions August 2026 Events',
            summary: 'The August schedule covers the Monthly Challenge Series, a new Ranked Battles season, and the Battle Pass activities available to Trainers.',
            body: ['The August event schedule brings together the Monthly Challenge Series, a new Ranked Battles season, and Battle Pass activities.', 'Trainers can use the schedule to plan their competitive sessions, collect seasonal rewards, and prepare for the next ruleset changes.'],
            image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
            url: 'https://www.pokemon.com/us/news/pokemon-champions-august-2026-events-mcs-ranked-battles-season-and-battle-pass'
        },
        {
            category: 'Championships',
            date: '2026-08-30',
            title: '2026 Pokémon World Championships Event Results',
            summary: 'Review the results and highlights from the 2026 Pokémon World Championships, including the competitive moments shaping the Champions season.',
            body: ['The 2026 Pokémon World Championships delivered a new set of competitive highlights for the Pokémon community.', 'The results and match stories are useful reference points for Trainers preparing for the next Pokémon Champions season.'],
            image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png',
            url: 'https://www.pokemon.com/us/news/2026-pokemon-world-championships-event-results'
        }
    ];

    function formatDate(date) {
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(new Date(`${date}T12:00:00`));
    }

    function renderNews(items, isLive) {
        feed.innerHTML = items.slice(0, 4).map((item, index) => `
            <article class="news-card ${index === 0 ? 'news-card-featured' : ''}" data-news-index="${index}" tabindex="0">
                <div class="news-card-art ${index === 1 ? 'news-card-art-blue' : ''} ${index === 2 ? 'news-card-art-gold' : ''} ${index === 3 ? 'news-card-art-green' : ''}">
                    <img src="${item.image}" alt="Pokémon artwork" loading="lazy" decoding="async">
                    <span class="news-number">0${index + 1}</span>
                </div>
                <div class="news-card-body">
                    <span class="news-tag ${index === 0 ? 'news-tag-red' : ''}">${item.category}</span>
                    <time datetime="${item.date}">${formatDate(item.date)}</time>
                    <h3>${item.title}</h3>
                    <div class="news-summary" hidden>${item.summary}</div>
                    <div class="news-actions">
                        <button class="news-summary-toggle" type="button" aria-expanded="false">Xem tóm tắt</button>
                        <a href="${item.url}" target="_blank" rel="noopener noreferrer">Nguồn chính thức <span>↗</span></a>
                    </div>
                </div>
            </article>
        `).join('');

        feed.querySelectorAll('.news-card').forEach((card, index) => {
            const openArticle = event => {
                if (event.target.closest('button, a')) return;
                openNewsArticle(items[index]);
            };
            card.addEventListener('click', openArticle);
            card.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openArticle(event);
                }
            });
        });

        feed.querySelectorAll('.news-summary-toggle').forEach(button => {
            button.addEventListener('click', () => {
                const summary = button.closest('.news-card-body').querySelector('.news-summary');
                const isHidden = summary.hidden;
                summary.hidden = !isHidden;
                button.textContent = isHidden ? 'Thu gọn' : 'Xem tóm tắt';
                button.setAttribute('aria-expanded', String(isHidden));
            });
        });

        const status = document.querySelector('.news-live');
        if (status) status.innerHTML = `<i></i> ${isLive ? 'Đã đồng bộ nguồn chính thức' : 'Bản tin dự phòng · 16.09.2026'}`;
    }

    function openNewsArticle(item) {
        const modal = document.getElementById('news-modal');
        if (!modal) return;
        modal.querySelector('.news-modal-category').textContent = item.category;
        modal.querySelector('.news-modal-date').textContent = formatDate(item.date);
        modal.querySelector('.news-modal-title').textContent = item.title;
        modal.querySelector('.news-modal-image').src = item.image;
        modal.querySelector('.news-modal-image').alt = item.title;
        modal.querySelector('.news-modal-copy').innerHTML = (item.body || [item.summary]).map(paragraph => `<p>${paragraph}</p>`).join('');
        modal.querySelector('.news-modal-source').href = item.url;

        const video = modal.querySelector('.news-modal-video');
        if (item.video) {
            video.hidden = false;
            video.src = item.video;
        } else {
            video.hidden = true;
            video.removeAttribute('src');
        }
        modal.hidden = false;
        document.body.classList.add('news-modal-open');
        modal.querySelector('.news-modal-close').focus();
    }

    function closeNewsArticle() {
        const modal = document.getElementById('news-modal');
        if (!modal) return;
        modal.hidden = true;
        modal.querySelector('.news-modal-video').removeAttribute('src');
        document.body.classList.remove('news-modal-open');
    }

    const modal = document.createElement('div');
    modal.id = 'news-modal';
    modal.className = 'news-modal';
    modal.hidden = true;
    modal.innerHTML = `
        <div class="news-modal-backdrop" data-news-close></div>
        <article class="news-modal-panel" role="dialog" aria-modal="true" aria-labelledby="news-modal-title">
            <button class="news-modal-close" type="button" aria-label="Đóng bài báo" data-news-close>×</button>
            <img class="news-modal-image" src="" alt="">
            <div class="news-modal-content">
                <div class="news-modal-meta"><span class="news-modal-category"></span><time class="news-modal-date"></time></div>
                <h2 class="news-modal-title" id="news-modal-title"></h2>
                <div class="news-modal-copy"></div>
                <iframe class="news-modal-video" title="Video Pokémon Champions" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen hidden></iframe>
                <a class="news-modal-source" href="" target="_blank" rel="noopener noreferrer">Đọc nguồn chính thức <span>↗</span></a>
            </div>
        </article>
    `;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-news-close]').forEach(element => element.addEventListener('click', closeNewsArticle));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !modal.hidden) closeNewsArticle();
    });

    async function loadLiveNews() {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 5000);
        try {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(officialNewsUrl)}`;
            const response = await fetch(proxyUrl, { cache: 'no-store', signal: controller.signal });
            if (!response.ok) throw new Error('News source unavailable');
            const html = await response.text();
            const documentParser = new DOMParser().parseFromString(html, 'text/html');
            const links = [...documentParser.querySelectorAll('a')]
                .filter(link => /pokemon champions/i.test(link.textContent) && link.href.includes('pokemon.com'))
                .map(link => ({ title: link.textContent.replace(/learn more about/i, '').trim(), url: link.href }))
                .filter((item, index, list) => list.findIndex(candidate => candidate.url === item.url) === index);

            if (links.length < 2) throw new Error('No live articles found');
            renderNews(links.reverse().slice(0, 4).map((item, index) => ({
                ...fallbackNews[index],
                title: item.title || fallbackNews[index].title,
                url: item.url
            })), true);
        } catch (error) {
        } finally {
            window.clearTimeout(timeout);
        }
    }

    async function loadCmsNews() {
        try {
            const response = await fetch('/api/news', { cache: 'no-store' });
            if (!response.ok) throw new Error('CMS news unavailable');
            const rows = await response.json();
            if (!Array.isArray(rows) || !rows.length) return;
            renderNews(rows.slice(0, 4).map((item, index) => ({
                ...fallbackNews[index % fallbackNews.length],
                category: item.tag || 'News',
                date: item.published_at || new Date().toISOString(),
                title: item.title,
                summary: item.summary || '',
                body: [item.summary || ''],
                url: item.source_url || '#',
                sourceName: item.source_name || ''
            })), true);
        } catch {
            // Keep the existing official-source fallback available.
        }
    }

    renderNews(fallbackNews, false);
    loadCmsNews();
    const scheduleLiveRefresh = window.requestIdleCallback
        ? callback => window.requestIdleCallback(callback, { timeout: 2500 })
        : callback => window.setTimeout(callback, 1800);
    scheduleLiveRefresh(loadLiveNews);
    window.setInterval(loadLiveNews, 60 * 60 * 1000);
})();