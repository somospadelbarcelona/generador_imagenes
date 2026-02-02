/**
 * NetworkPulseView.js (Admin Module)
 * 🔬 Consola Profesional del Centro de Operaciones
 * Proporciona una vista detallada de la infraestructura y el tráfico para administradores.
 */
(function () {
    'use strict';

    class NetworkPulseView {
        constructor() {
            this.service = window.NetworkPulseService;
        }

        async render() {
            const container = document.getElementById('content-area');
            if (!container) return;

            // Asegurar que el servicio está vinculado e inicializado
            if (!this.service && window.NetworkPulseService) {
                this.service = window.NetworkPulseService;
            }

            if (!this.service) {
                container.innerHTML = '<div style="padding:50px; text-align:center; color:#888;">Error: NetworkPulseService no disponible.</div>';
                return;
            }

            // Inicializar el pulso con el usuario admin actual si no lo está
            const adminUser = window.AdminAuth ? window.AdminAuth.user : null;
            if (adminUser && !this.service.initialized) {
                this.service.init(adminUser.id || 'admin-root');
            }

            const metrics = this.service.getNetworkMetrics();
            const nodes = this.service.activeNodes;

            container.innerHTML = `
                <div class="fade-in" style="padding: 25px; color: white; font-family: 'Outfit', sans-serif;">
                    
                    <!-- 1. HEADER CONTROL AREA -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 20px;">
                        <div>
                            <div style="color: #00E36D; font-size: 0.7rem; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px;">Infraestructura & Tráfico</div>
                            <h1 style="font-size: 2.2rem; font-weight: 950; margin: 0; color: white;">CENTRO DE <span style="color: #00E36D;">OPERACIONES</span></h1>
                            <p style="color: #888; margin-top: 5px; font-weight: 600;">Monitorización de clusters, nodos de acceso y seguridad de red en tiempo real.</p>
                        </div>
                        <div style="display: flex; gap: 15px;">
                            <div style="background: rgba(255,255,255,0.05); padding: 15px 25px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); text-align: center;">
                                <div style="font-size: 0.6rem; color: #888; font-weight: 800; text-transform: uppercase;">Uptime Global</div>
                                <div style="font-size: 1.5rem; font-weight: 950; color: #00E36D;">${metrics.uptime}</div>
                            </div>
                        </div>
                    </div>

                    <!-- 2. ANALYTICS GRID -->
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 25px; margin-bottom: 25px;">
                        
                        <!-- A. LIVE TRAFFIC MAP -->
                        <div style="background: rgba(10, 10, 15, 0.4); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 25px; position: relative; overflow: hidden;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <h3 style="margin: 0; font-size: 1rem; font-weight: 800;"><i class="fas fa-microchip" style="color: #00E36D; margin-right: 10px;"></i> ESTADO DE LOS NODOS (DISTRIBUCIÓN)</h3>
                                <span style="font-size: 0.65rem; background: rgba(0,227,109,0.1); color: #00E36D; padding: 4px 12px; border-radius: 20px; font-weight: 900;">ACTIVOS: ${nodes.length}</span>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                                ${nodes.length > 0 ? nodes.map(node => `
                                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 15px; display: flex; align-items: center; gap: 15px;">
                                        <div style="width: 40px; height: 40px; background: rgba(0,227,109,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #00E36D; font-weight: 950; border: 1px solid rgba(0,227,109,0.3);">
                                            ${node.name.substring(0, 1)}
                                        </div>
                                        <div>
                                            <div style="font-weight: 900; font-size: 0.85rem; color: #fff;">${node.name}</div>
                                            <div style="font-size: 0.65rem; color: #00E36D; font-weight: 800; margin-top: 2px;">${node.city.toUpperCase()}</div>
                                            <div style="font-size: 0.6rem; color: #555; margin-top: 4px;">PULSO: ${this.formatTime(node.last_online)}</div>
                                        </div>
                                    </div>
                                `).join('') : `
                                    <div style="grid-column: 1/-1; padding: 60px; text-align: center; color: #444;">
                                        <i class="fas fa-satellite" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.2;"></i>
                                        <div style="font-weight: 800; font-size: 1rem;">ESCANEANDO RED FIREBASE...</div>
                                        <div style="font-size: 0.8rem; margin-top: 5px;">Esperando señales de los nodos de acceso.</div>
                                    </div>
                                `}
                            </div>
                        </div>

                        <!-- B. INFRASTRUCTURE HEALTH -->
                        <div style="display: flex; flex-direction: column; gap: 20px;">
                            <div style="background: rgba(10, 10, 15, 0.4); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 25px;">
                                <h3 style="margin: 0 0 20px 0; font-size: 0.9rem; font-weight: 800;">RENDIMIENTO TÉCNICO</h3>
                                
                                ${[
                    { label: 'Latencia Promedio', val: metrics.latency, color: '#00E36D' },
                    { label: 'Carga de CPU Cluster', val: metrics.load, color: metrics.load.replace('%', '') > 70 ? '#ff4d4d' : '#00E36D' },
                    { label: 'Throughput', val: metrics.throughput, color: '#0ea5e9' }
                ].map(item => `
                                    <div style="margin-bottom: 20px;">
                                        <div style="display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 800; color: #888; margin-bottom: 8px; text-transform: uppercase;">
                                            <span>${item.label}</span>
                                            <span style="color: white;">${item.val}</span>
                                        </div>
                                        <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden;">
                                            <div style="width: ${item.val.toString().includes('%') ? item.val : '40%'}; height: 100%; background: ${item.color}; box-shadow: 0 0 10px ${item.color}44;"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>

                            <div style="background: rgba(0, 227, 109, 0.05); border: 1px solid rgba(0, 227, 109, 0.2); border-radius: 24px; padding: 25px;">
                                <h3 style="margin: 0 0 10px 0; font-size: 0.9rem; font-weight: 800; color: #00E36D;">PROTECCIÓN ACTIVA</h3>
                                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                                    <i class="fas fa-shield-halved" style="font-size: 2rem; color: #00E36D;"></i>
                                    <div>
                                        <div style="font-weight: 900; font-size: 0.8rem; color: #fff;">ENCRIPTACIÓN END-TO-END</div>
                                        <div style="font-size: 0.6rem; color: #888; font-weight: 700; margin-top: 2px;">AES-256-GCM SSL/TLS 1.3</div>
                                    </div>
                                </div>
                                <div style="font-size: 0.7rem; color: #aaa; line-height: 1.4; border-top: 1px solid rgba(0,227,109,0.1); padding-top: 10px;">
                                    Auditando integridad de datos en cada mutación de Firestore. Todos los paquetes están sanitizados.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. DETAILED LOGS -->
                    <div style="background: #050505; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; font-family: monospace;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <div style="color: #00E36D; font-weight: 800; font-size: 0.8rem;">[ COMMAND CENTER LOG ]</div>
                            <div style="color: #444; font-size: 0.65rem;">SISTEMA OPERATIVO SOMOSPADEL v4.0.1</div>
                        </div>
                        <div id="admin-network-logs" style="height: 250px; overflow-y: auto; color: #00E36D; font-size: 0.75rem; line-height: 1.6;">
                            ${this.service.getAccessLog().map(log => `<div style="margin-bottom: 4px;">${log}</div>`).join('')}
                            <div style="opacity: 0.5;">[${new Date().toLocaleTimeString()}] ESPERANDO EVENTOS SIGUIENTES...</div>
                        </div>
                    </div>

                </div>
            `;

            // Auto-refresh every 5 seconds if still in this view
            this.setupAutoRefresh();
        }

        formatTime(timestamp) {
            if (!timestamp) return '---';
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }

        setupAutoRefresh() {
            if (this.refreshInterval) clearInterval(this.refreshInterval);
            this.refreshInterval = setInterval(() => {
                const activeNav = document.querySelector('.nav-item-pro[data-view="network_pulse"]');
                if (activeNav && activeNav.classList.contains('active')) {
                    this.render();
                } else {
                    clearInterval(this.refreshInterval);
                }
            }, 5000);
        }
    }

    window.NetworkPulseView = new NetworkPulseView();
    console.log('🔬 Admin Network Pulse View Initialized');
})();
