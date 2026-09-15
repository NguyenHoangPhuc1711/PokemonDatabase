(function setupBannerAd() {
    const header = document.querySelector('.header');
    if (!header || document.querySelector('.site-ad-slot')) return;

    const slot = document.createElement('section');
    slot.className = 'site-ad-slot';
    slot.setAttribute('aria-label', 'Advertisement');
    slot.innerHTML = `
        <div class="site-ad-banner"></div>
        <div class="site-ad-native">
            <div id="container-e4ec82b5dd58247e7ac9e2709a67bc75"></div>
        </div>
    `;
    header.insertAdjacentElement('afterend', slot);

    const config = document.createElement('script');
    config.textContent = `atOptions = {
        'key': 'ae1ef90627434cb94e650388b3c1bcd9',
        'format': 'iframe',
        'height': 60,
        'width': 468,
        'params': {}
    };`;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.highrevenueformat.com/ae1ef90627434cb94e650388b3c1bcd9/invoke.js';
    slot.querySelector('.site-ad-banner').append(config, script);

    const nativeSlot = slot.querySelector('.site-ad-native');
    const nativeScript = document.createElement('script');
    nativeScript.async = true;
    nativeScript.setAttribute('data-cfasync', 'false');
    nativeScript.src = 'https://pl31343376.profitableratecpmnetwork.com/e4ec82b5dd58247e7ac9e2709a67bc75/invoke.js';
    nativeScript.addEventListener('load', () => nativeSlot.classList.add('is-loaded'), { once: true });
    nativeScript.addEventListener('error', () => nativeSlot.remove(), { once: true });
    nativeSlot.appendChild(nativeScript);
})();
