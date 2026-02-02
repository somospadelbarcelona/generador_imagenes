// ShareButtonHandler.js - Global event delegation for share buttons
(function () {
    function setupShareButtons() {
        console.log('🔧 [ShareButtonHandler] Installing global delegation...');

        document.addEventListener('click', function (e) {
            const btn = e.target.closest('.share-victory-btn');
            if (!btn) return;

            e.preventDefault();
            e.stopPropagation();

            const matchId = btn.getAttribute('data-match-id');
            console.log('🎯 [ShareButton] Clicked for match:', matchId);

            if (!matchId) {
                console.error('❌ No match ID on button');
                return;
            }

            const match = window._matchRegistry?.[matchId];
            const delta = window._matchDeltaRegistry?.[matchId] || 0;

            console.log('📊 Match data:', { match: !!match, delta, hasModal: !!window.ShareModal });

            if (!match) {
                console.error('❌ Match not found:', matchId);
                alert('Error: Datos del partido no encontrados. Recarga la página.');
                return;
            }

            if (!window.ShareModal) {
                console.error('❌ ShareModal not loaded');
                alert('El módulo de compartir no está cargado. Recarga (Ctrl+F5).');
                return;
            }

            console.log('✅ Opening ShareModal...');
            window.ShareModal.open(match, delta);
        });

        console.log('✅ Share button handler installed');
    }

    // Install immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupShareButtons);
    } else {
        setupShareButtons();
    }
})();
