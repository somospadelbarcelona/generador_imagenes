/**
 * NotificationUi.js
 * 
 * Gestiona la interfaz visual de las notificaciones:
 * - Renderiza el modal/drawer de lista de notificaciones
 * - Muestra items leídos/no leídos
 * - Botonera de "Marcar todo leído"
 */
class NotificationUi {
    constructor() {
        this.isOpen = false;
        // Suscribirse al servicio para actualizar la UI si estamos abiertos
        if (window.NotificationService) {
            window.NotificationService.onUpdate((data) => {
                if (this.isOpen) {
                    this.renderList(data.items);
                }
                this.updateBadge(data.count);
            });
        }
    }

    updateBadge(count) {
        const badge = document.getElementById('notif-badge');
        const bell = document.getElementById('notif-bell-icon');

        if (!badge || !bell) return;

        if (count > 0) {
            badge.style.display = 'flex';
            badge.innerText = count > 99 ? '99+' : count;
            bell.classList.add('shake-animation'); // Agregar animación si hay nuevas
        } else {
            badge.style.display = 'none';
            bell.classList.remove('shake-animation');
        }
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    open() {
        this.isOpen = true;
        const overlay = document.createElement('div');
        overlay.id = 'notif-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 20000;
            backdrop-filter: blur(4px); opacity: 0; transition: opacity 0.3s;
        `;
        overlay.onclick = (e) => { if (e.target.id === 'notif-overlay') this.close(); };

        const drawer = document.createElement('div');
        drawer.id = 'notif-drawer';
        drawer.style.cssText = `
            position: absolute; top: 0; right: -320px; width: 300px; height: 100%;
            background: #0f172a; border-left: 1px solid #1e293b;
            display: flex; flex-direction: column; transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: -5px 0 25px rgba(0,0,0,0.5);
        `;

        drawer.innerHTML = `
            <!-- HEADER -->
            <div style="padding: 20px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; background: #1e293b;">
                <h3 style="margin: 0; color: white; font-size: 1.1rem; font-weight: 800; letter-spacing: -0.5px;">NOTIFICACIONES</h3>
                <div style="display: flex; gap: 15px; align-items: center;">
                    ${(window.Store?.getState('currentUser')?.role?.includes('admin')) ?
                `<i class="fas fa-radiation" onclick="window.NotificationUi.confirmGlobalClear()" style="color: #ef4444; cursor: pointer; font-size: 1rem; margin-right: 5px;" title="LIMPIEZA GLOBAL (ADMIN)"></i>` : ''}
                    <i class="fas fa-trash" onclick="window.NotificationUi.deleteAllMy()" style="color: #94a3b8; cursor: pointer; font-size: 1rem;" title="Limpiar mi bandeja"></i>
                    <i class="fas fa-check-double" onclick="window.NotificationUi.markAllRead()" style="color: #94a3b8; cursor: pointer; font-size: 1rem;" title="Marcar todo como leído"></i>
                    <i class="fas fa-times" onclick="window.NotificationUi.close()" style="color: white; cursor: pointer; font-size: 1.2rem;"></i>
                </div>
            </div>

            <!-- PERMISSIONS PROMPT (Si no tiene permisos push) -->
            <div id="push-permission-box" style="display:none; padding: 15px; background: rgba(132, 204, 22, 0.1); border-bottom: 1px solid rgba(132, 204, 22, 0.2);">
                <div style="color: #84cc16; font-size: 0.8rem; font-weight: 700; margin-bottom: 8px;">🔔 NO TE PIERDAS NADA</div>
                <div style="color: #cbd5e1; font-size: 0.75rem; margin-bottom: 10px; line-height: 1.3;">Activa las notificaciones Push para saber cuándo empiezan tus partidos.</div>
                <button onclick="window.NotificationUi.dismissPushPrompt(true)" style="width: 100%; background: #84cc16; color: #000; border: none; padding: 8px; border-radius: 8px; font-weight: 800; cursor: pointer;">ACTIVAR PUSH</button>
                <div onclick="window.NotificationUi.dismissPushPrompt(false)" style="text-align:center; color:#64748b; font-size:0.6rem; margin-top:8px; cursor:pointer; text-decoration:underline;">Quizás más tarde</div>
            </div>

            <!-- LIST -->
            <div id="notif-list" style="flex: 1; overflow-y: auto; padding: 0;">
                <div style="padding: 40px 20px; text-align: center; color: #64748b;">
                    <i class="fas fa-spinner fa-spin"></i> Cargando...
                </div>
            </div>
        `;

        overlay.appendChild(drawer);
        document.body.appendChild(overlay);

        // Animate In
        setTimeout(() => {
            overlay.style.opacity = '1';
            drawer.style.right = '0';
        }, 10);

        // Check Permissions status for banner (only if not dismissed this session or permanently)
        const isDismissed = localStorage.getItem('pushPromptDismissed');
        const notificationSupported = 'Notification' in window;
        if (notificationSupported && Notification.permission === 'default' && window.messaging && !isDismissed) {
            document.getElementById('push-permission-box').style.display = 'block';
        }

        // Render content
        if (window.NotificationService) {
            this.renderList(window.NotificationService.getMergedNotifications());
        }
    }

    close() {
        this.isOpen = false;
        const overlay = document.getElementById('notif-overlay');
        const drawer = document.getElementById('notif-drawer');
        if (overlay && drawer) {
            overlay.style.opacity = '0';
            drawer.style.right = '-320px';
            setTimeout(() => overlay.remove(), 300);
        }
    }

    markAllRead() {
        if (window.NotificationService) window.NotificationService.markAllAsRead();
    }

    deleteAllMy() {
        if (window.NotificationService) window.NotificationService.deleteAllMyNotifications();
    }

    handleItemClick(id, actionUrl, eventId, action) {
        if (window.NotificationService) window.NotificationService.markAsRead(id);

        if (eventId) {
            this.close();
            console.log(`🚀 [NotificationUi] Opening event ${eventId} with action: ${action}`);

            if (window.EventsController && window.EventsController.openLiveEvent) {
                window.EventsController.openLiveEvent(eventId, 'americana', action);
            } else if (window.openLiveEvent) {
                window.openLiveEvent(eventId, 'americana', action);
            } else if (window.Router) {
                window.Router.navigate('live', { eventId, action });
            }
        }
    }

    handleDeleteOne(id, event) {
        console.log("🛑 [NotificationUi] Manual Delete Click for:", id);
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (window.NotificationService) {
            window.NotificationService.deleteNotification(id);
        } else {
            console.error("❌ NotificationService not available for delete");
        }
    }

    async confirmGlobalClear() {
        if (!confirm("⚠️ ¿ESTÁS SEGURO? Esto borrará las notificaciones de TODOS los usuarios de la comunidad. No se puede deshacer.")) return;

        try {
            if (window.NotificationService) {
                await window.NotificationService.clearAllCommunityNotifications();
                alert("✅ Notificaciones de la comunidad borradas.");
                this.close();
            }
        } catch (e) {
            alert("Error al borrar: " + e.message);
        }
    }

    renderList(items) {
        const container = document.getElementById('notif-list');
        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = `
                <div style="padding: 60px 20px; text-align: center; opacity: 0.5;">
                    <i class="far fa-bell" style="font-size: 3rem; color: #64748b; margin-bottom: 15px;"></i>
                    <div style="color: white; font-weight: 700;">Sin notificaciones</div>
                    <div style="color: #94a3b8; font-size: 0.8rem;">Estás al día</div>
                </div>
            `;
            return;
        }

        // grouping by date
        const groups = {
            "Hoy": [],
            "Ayer": [],
            "Anteriores": []
        };
        const now = new Date();
        const todayStr = now.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        items.forEach(item => {
            const date = this.parseTimestamp(item.timestamp);
            const dateStr = date.toDateString();
            if (dateStr === todayStr) groups["Hoy"].push(item);
            else if (dateStr === yesterdayStr) groups["Ayer"].push(item);
            else groups["Anteriores"].push(item);
        });

        let html = '';
        Object.keys(groups).forEach(groupName => {
            const groupItems = groups[groupName];
            if (groupItems.length === 0) return;

            html += `<div style="padding: 12px 20px 8px; background: rgba(0,0,0,0.1); color: #94a3b8; font-size: 0.65rem; font-weight: 950; text-transform: uppercase; letter-spacing: 1px;">${groupName}</div>`;

            html += groupItems.map(item => `
                <div onclick="window.NotificationUi.handleItemClick('${item.id}', '${item.data?.url || ''}', '${item.data?.eventId || ''}', '${item.data?.action || ''}')" 
                    style="
                        padding: 15px 20px; 
                        border-bottom: 1px solid #1e293b; 
                        background: ${item.read ? 'transparent' : 'rgba(132, 204, 22, 0.05)'}; 
                        cursor: pointer; 
                        transition: all 0.2s;
                        position: relative;
                ">
                    <div style="position: absolute; top: 15px; right: 15px; display: flex; align-items: center; gap: 10px;">
                        ${!item.read ? '<div style="width: 8px; height: 8px; background: #84cc16; border-radius: 50%;"></div>' : ''}
                        <i class="fas fa-trash-alt" 
                           onclick="window.NotificationUi.handleDeleteOne('${item.id}', event)" 
                           style="color: #475569; font-size: 0.8rem; cursor: pointer; padding: 5px; transition: color 0.2s; z-index: 10;"
                           onmouseover="this.style.color='#ef4444'"
                           onmouseout="this.style.color='#475569'">
                        </i>
                    </div>
                    
                    <div style="display: flex; gap: 15px; align-items: start;">
                        <div style="
                            min-width: 35px; height: 35px; border-radius: 10px; 
                            background: #1e293b; display: flex; align-items: center; justify-content: center;
                            color: #94a3b8;
                        ">
                            <i class="fas fa-${item.icon || 'bell'}"></i>
                        </div>
                        <div style="flex: 1; padding-right: 25px;">
                            <div style="color: ${item.read ? '#94a3b8' : 'white'}; font-weight: ${item.read ? '500' : '700'}; font-size: 0.9rem; margin-bottom: 4px; line-height: 1.3;">
                                ${item.title}
                            </div>
                            <div style="color: #64748b; font-size: 0.75rem; line-height: 1.3;">
                                ${item.body}
                            </div>
                            <div style="color: #475569; font-size: 0.6rem; margin-top: 6px; font-weight: 700; text-transform: uppercase;">
                                ${this.timeAgo(item.timestamp)}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        });

        container.innerHTML = html;
    }

    parseTimestamp(ts) {
        if (!ts) return new Date();
        if (ts.toDate) return ts.toDate();
        if (ts instanceof Date) return ts;
        return new Date(ts);
    }

    timeAgo(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const seconds = Math.floor((new Date() - date) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " años";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " meses";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " días";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " min";
        return "Ahora";
    }
    dismissPushPrompt(accepted) {
        if (accepted && window.NotificationService) {
            window.NotificationService.requestPushPermission();
        }
        localStorage.setItem('pushPromptDismissed', 'true');
        const box = document.getElementById('push-permission-box');
        if (box) box.style.display = 'none';
    }
}

window.NotificationUi = new NotificationUi();

