// Динамічний генератор маніфеста на JavaScript
// Цей файл буде працювати навіть без PHP сервера

function generateDynamicManifest(clientId) {
    // Базовий URL для start_url
    const baseUrl = window.location.origin;
    const basePath = window.location.pathname.replace('/index.html', '').replace(/\/$/, '') || '';
    const startUrl = clientId ? `${baseUrl}${basePath}/?id=${encodeURIComponent(clientId)}` : `${baseUrl}${basePath}/`;
    const scopeUrl = `${baseUrl}${basePath}/`;
    
    // Детальне логування для дебагу
    console.log('🔧 generateDynamicManifest Debug:', {
        'window.location.origin': window.location.origin,
        'window.location.pathname': window.location.pathname,
        'basePath': basePath,
        'clientId': clientId,
        'startUrl': startUrl,
        'scopeUrl': scopeUrl
    });
    
    const manifest = {
        "name": "АГРО-ПРОСТІР",
        "short_name": "Агро-простір",
        "description": "Інтерактивна платформа для аграрного сектору України",
        "start_url": startUrl,
        "display": "standalone",
        "orientation": "any",
        "theme_color": "#198754",
        "background_color": "#ffffff",
        "scope": scopeUrl,
        "lang": "uk",
        "prefer_related_applications": false,
        "edge_side_panel": {
            "preferred_width": 480
        },
        "protocol_handlers": [],
        "launch_handler": {
            "client_mode": "navigate-existing"
        },
        "categories": ["productivity", "agriculture", "utilities", "navigation", "business"],
        "screenshots": [],
        "icons": [
            {
                "src": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9IiMxOTg3NTQiLz4KPHN2ZyB4PSI0OCIgeT0iNDgiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAyQzguMTMgMiA1IDUuMTMgNSA5YzAgNS4yNSA3IDEzIDcgMTNzNy03Ljc1IDctMTNjMC0zLjg3LTMuMTMtNy03LTd6bTAgOS41Yy0xLjM4IDAtMi41LTEuMTItMi41LTIuNXMxLjEyLTIuNSAyLjUtMi41IDIuNSAxLjEyIDIuNSAyLjUtMS4xMiAyLjUtMi41IDIuNXoiLz4KPC9zdmc+Cjwvc3ZnPgo=",
                "sizes": "192x192",
                "type": "image/svg+xml",
                "purpose": "maskable any"
            },
            {
                "src": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiByeD0iNjQiIGZpbGw9IiMxOTg3NTQiLz4KPHN2ZyB4PSIxMjgiIHk9IjEyOCIgd2lkdGg9IjI1NiIgaGVpZ2h0PSIyNTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03em0wIDkuNWMtMS4zOCAwLTIuNS0xLjEyLTIuNS0yLjVzMS4xMi0yLjUgMi41LTIuNSAyLjUgMS4xMiAyLjUgMi41LTEuMTIgMi41LTIuNSAyLjV6Ii8+Cjwvc3ZnPgo8L3N2Zz4K",
                "sizes": "512x512",
                "type": "image/svg+xml",
                "purpose": "maskable any"
            },
            {
                "src": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQ0IiBoZWlnaHQ9IjE0NCIgdmlld0JveD0iMCAwIDE0NCAxNDQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNDQiIGhlaWdodD0iMTQ0IiByeD0iMTgiIGZpbGw9IiMxOTg3NTQiLz4KPHN2ZyB4PSIzNiIgeT0iMzYiIHdpZHRoPSI3MiIgaGVpZ2h0PSI3MiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAyQzguMTMgMiA1IDUuMTMgNSA5YzAgNS4yNSA3IDEzIDcgMTNzNy03Ljc1IDctMTNjMC0zLjg3LTMuMTMtNy03LTd6bTAgOS41Yy0xLjM4IDAtMi41LTEuMTItMi41LTIuNXMxLjEyLTIuNSAyLjUtMi41IDIuNSAxLjEyIDIuNSAyLjUtMS4xMiAyLjUtMi41IDIuNXoiLz4KPC9zdmc+Cjwvc3ZnPgo=",
                "sizes": "144x144",
                "type": "image/svg+xml",
                "purpose": "any"
            },
            {
                "src": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiByeD0iMTIiIGZpbGw9IiMxOTg3NTQiLz4KPHN2ZyB4PSIyNCIgeT0iMjQiIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAyQzguMTMgMiA1IDUuMTMgNSA5YzAgNS4yNSA3IDEzIDcgMTNzNy03Ljc1IDctMTNjMC0zLjg3LTMuMTMtNy03LTd6bTAgOS41Yy0xLjM4IDAtMi41LTEuMTItMi41LTIuNXMxLjEyLTIuNSAyLjUtMi41IDIuNSAxLjEyIDIuNSAyLjUtMS4xMiAyLjUtMi41IDIuNXoiLz4KPC9zdmc+Cjwvc3ZnPgo=",
                "sizes": "96x96",
                "type": "image/svg+xml",
                "purpose": "any"
            },
            {
                "src": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCA3MiA3MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjcyIiBoZWlnaHQ9IjcyIiByeD0iOSIgZmlsbD0iIzE5ODc1NCIvPgo8c3ZnIHg9IjE4IiB5PSIxOCIgd2lkdGg9IjM2IiBoZWlnaHQ9IjM2IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IndoaXRlIj4KPHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN3ptMCA5LjVjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41czEuMTItMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIvPgo8L3N2Zz4KPC9zdmc+Cg==",
                "sizes": "72x72",
                "type": "image/svg+xml",
                "purpose": "any"
            },
            {
                "src": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iNiIgZmlsbD0iIzE5ODc1NCIvPgo8c3ZnIHg9IjEyIiB5PSIxMiIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IndoaXRlIj4KPHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN3ptMCA5LjVjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41czEuMTItMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIvPgo8L3N2Zz4KPC9zdmc+Cg==",
                "sizes": "48x48",
                "type": "image/svg+xml",
                "purpose": "any"
            }
        ]
    };
    
    // Додаємо дебаг інформацію якщо потрібно
    if (window.location.search.includes('debug')) {
        manifest._debug = {
            client_id: clientId,
            start_url: startUrl,
            scope: scopeUrl,
            base_url: baseUrl,
            base_path: basePath,
            current_pathname: window.location.pathname,
            host: window.location.host,
            generated_at: new Date().toISOString()
        };
    }
    
    return manifest;
}

// Функція для створення blob URL з маніфестом
function createManifestBlobUrl(clientId) {
    const manifest = generateDynamicManifest(clientId);
    const manifestJson = JSON.stringify(manifest, null, 2);
    const blob = new Blob([manifestJson], { type: 'application/manifest+json' });
    return URL.createObjectURL(blob);
}

// Експортуємо функції для використання
if (typeof window !== 'undefined') {
    window.generateDynamicManifest = generateDynamicManifest;
    window.createManifestBlobUrl = createManifestBlobUrl;
}
