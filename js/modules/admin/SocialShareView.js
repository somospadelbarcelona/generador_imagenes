/**
 * SocialShareView.js
 * The UI layer for "Creator Mode".
 */
class SocialShareView {
    constructor() {
        this.renderModal();
    }

    renderModal() {
        if (document.getElementById('social-share-modal')) return;

        const modalHtml = `
            <div id="social-share-modal" class="modal-overlay hidden" style="z-index: 9999; backdrop-filter: blur(10px); background: rgba(0,0,0,0.8);">
                <div class="glass-card-enterprise fade-in" style="width: 90%; max-width: 500px; padding: 25px; border: 1px solid rgba(255,255,255,0.1); position:relative;">
                    
                    <button onclick="window.SocialShareView.close()" style="position:absolute; top:15px; right:15px; background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
                    
                    <h3 style="margin-top:0; color:white; display:flex; align-items:center; gap:10px;">
                        <span style="font-size:1.5rem;">📸</span> MODO CREADOR
                    </h3>
                    <p style="color:#aaa; font-size:0.9rem; margin-bottom:20px; line-height: 1.5;">
                        Descarga tu tarjeta y súbela a Stories mencionando a <b style="color:#fff;">@somospadelbarcelona_</b> 🚀
                    </p>

                    <!-- Preview Area -->
                    <div id="social-preview-container" style="
                        width: 100%; aspect-ratio: 9/16; 
                        background: #000; border-radius: 12px; margin-bottom: 20px;
                        display: flex; align-items: center; justify-content: center;
                        overflow: hidden; border: 1px solid #333; position: relative;
                    ">
                        <div style="color:#666; font-size:0.8rem;">Vista Previa</div>
                        <img id="social-generated-img" style="width:100%; height:100%; object-fit:contain; display:none;">
                        <div id="social-loading" class="loader" style="display:none; width:30px; height:30px;"></div>
                    </div>

                    <!-- Template Selector (Hidden as there is only one now) -->
                    <div style="display:none; gap:10px; margin-bottom:20px; overflow-x:auto; padding-bottom:5px;">
                        <button onclick="window.SocialShareView.selectTemplate('cyberpunk')" class="btn-micro" style="flex:1; padding:10px; border:1px solid #ccff00; color:#ccff00; background:rgba(204,255,0,0.1);">RESULTADO PARTIDO</button>
                    </div>

                    <!-- Actions -->
                    <button id="btn-download-social" onclick="window.SocialShareView.download()" class="btn-primary-pro" style="width:100%; height:50px; font-size:1rem; font-weight:800; display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom: 10px;">
                        <i class="fas fa-download"></i> DESCARGAR IMAGEN
                    </button>
                    
                    <button onclick="window.SocialShareView.close()" style="width:100%; height:45px; background:transparent; border:1px solid #333; color:#aaa; border-radius:12px; font-weight:700; cursor:pointer;">
                        VOLVER
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    open(data, template = 'cyberpunk') {
        this.currentData = data;
        const modal = document.getElementById('social-share-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            this.selectTemplate(template); // Specific template if provided
        }
    }

    close() {
        const modal = document.getElementById('social-share-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    async selectTemplate(type) {
        // Highlight logic could go here

        const previewImg = document.getElementById('social-generated-img');
        const loader = document.getElementById('social-loading');

        previewImg.style.display = 'none';
        loader.style.display = 'block';

        try {
            const dataUrl = await window.SocialShareService.generateImage(type, this.currentData);
            previewImg.src = dataUrl;
            previewImg.style.display = 'block';
            this.currentImgUrl = dataUrl;
        } catch (e) {
            console.error(e);
            alert("Error generando preview: " + e.message);
        } finally {
            loader.style.display = 'none';
        }
    }

    download() {
        if (!this.currentImgUrl) return;
        const link = document.createElement('a');
        link.download = `somospadel-story-${Date.now()}.png`;
        link.href = this.currentImgUrl;
        link.click();
    }
}

window.SocialShareView = new SocialShareView();
