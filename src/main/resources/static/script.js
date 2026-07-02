const STORAGE_KEY = 'maresia_registros_v2';
const MAP_POINTS_KEY = 'maresia_pontos_livres_v1';
const REPORTS_API = '/api/reports';
const CENTER = [-6.3056, -35.0337];

const $ = selector => document.querySelector(selector);

const foto = $('#foto');
const form = $('#report-form');
const gps = $('#gps');
const success = $('#success');
const locationButton = $('#location-btn');
const mapLocationButton = $('#map-location-btn');
const manualLocationButton = $('#manual-location-btn');
const mapStatus = $('#map-status');
const locationFeedback = $('#location-feedback');
const recordsList = $('#records-list');
const statusFilter = $('#status-filter');

let selectedPosition = null;
let userMarker = null;
let selectedMarker = null;
let freePointPosition = null;
let freePointMarker = null;
let accuracyCircle = null;
let watchId = null;
let selectingOnMap = false;
let photoData = '';
let records = loadRecords();
let mapPoints = loadMapPoints();
let apiAvailable = false;

const markers = new Map();
const mapPointMarkers = new Map();

const map = L.map('leaflet-map', {
    scrollWheelZoom: true,
    zoomControl: true
}).setView(CENTER, 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

L.control.scale({ imperial: false }).addTo(map);

function loadRecords() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function saveRecords() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function loadMapPoints() {
    try {
        return JSON.parse(localStorage.getItem(MAP_POINTS_KEY)) || [];
    } catch {
        return [];
    }
}

function saveMapPoints() {
    localStorage.setItem(MAP_POINTS_KEY, JSON.stringify(mapPoints));
}

async function apiRequest(path = '', options = {}) {
    const response = await fetch(`${REPORTS_API}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        ...options
    });
    
    if (!response.ok) {
        throw new Error(`API respondeu ${response.status}`);
    }
    
    apiAvailable = true;
    return response.status === 204 ? null : response.json();
}

async function syncReportsFromApi() {
    try {
        for (const report of records) {
            await apiRequest('', { method: 'POST', body: JSON.stringify(report) });
        }
        
        records = await apiRequest();
        saveRecords();
        renderRecords();
        mapStatus.textContent = 'Banco de dados conectado · denúncias sincronizadas';
    } catch {
        apiAvailable = false;
        mapStatus.textContent = 'Modo local · inicie o servidor Java para sincronizar denúncias';
    }
}

async function persistReport(report) {
    try {
        return await apiRequest('', { method: 'POST', body: JSON.stringify(report) });
    } catch {
        apiAvailable = false;
        saveRecords();
        return report;
    }
}

function escapeHtml(value = '') {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
}

function pinIcon(status = 'pending', extra = '') {
    return L.divIcon({
        className: '',
        html: `<div class="map-pin ${status} ${extra}"><span>≈</span></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
}

function placeholder(type) {
    const label = encodeURIComponent(type || 'Resíduo');
    return `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250'%3E%3Crect width='100%25' height='100%25' fill='%23dcefeb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' fill='%23087d91' font-family='Arial' font-size='24'%3E${label}%3C/text%3E%3C/svg%3E`;
}

function formatDate(iso) {
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(new Date(iso));
}

function typeSymbol(type) {
    const symbols = {
        'Plástico': '♻',
        'Vidro': '◇',
        'Metal': '⚙',
        'Rede de pesca': '≈',
        'Resíduo orgânico': '✦',
        'Outro': '!',
        'Ponto comunitário': '≈'
    };
    return symbols[type] || '♻';
}

function addMarker(record) {
    if (markers.has(record.id)) {
        map.removeLayer(markers.get(record.id));
    }
    
    const marker = L.marker([record.lat, record.lng], {
        icon: pinIcon(record.status)
    }).addTo(map)
      .bindPopup(popupContent(record), { maxWidth: 420 });
    
    markers.set(record.id, marker);
}

function addMapPointMarker(point) {
    if (mapPointMarkers.has(point.id)) {
        map.removeLayer(mapPointMarkers.get(point.id));
    }
    
    const marker = L.marker([point.lat, point.lng], {
        icon: pinIcon(point.status, 'community')
    }).addTo(map)
      .bindPopup(popupContent(point), { maxWidth: 420 });
    
    mapPointMarkers.set(point.id, marker);
}

function renderMapPoints() {
    mapPointMarkers.forEach(marker => map.removeLayer(marker));
    mapPointMarkers.clear();
    mapPoints.forEach(addMapPointMarker);
}

function renderRecords() {
    markers.forEach(marker => map.removeLayer(marker));
    markers.clear();
    
    records.forEach(addMarker);
    
    const pending = records.filter(r => r.status === 'pending').length;
    $('#total-count').textContent = records.length;
    $('#hero-count').textContent = records.length;
    $('#pending-count').textContent = pending;
    $('#resolved-count').textContent = records.length - pending;
    
    const visible = records.filter(r =>
        statusFilter.value === 'all' || r.status === statusFilter.value
    );
    
    recordsList.innerHTML = visible.length
        ? visible.map(record => `
            <button class="record-item" type="button" onclick="openRecord('${record.id}')">
                <img class="record-thumb" src="${record.photo || placeholder(record.type)}" alt="">
                <span class="record-info">
                    <strong>${escapeHtml(record.type)}</strong>
                    <span>${escapeHtml(record.comment)}</span>
                    <small>${formatDate(record.createdAt)}</small>
                </span>
                <span class="status-dot ${record.status}">
                    ${record.status === 'resolved' ? 'Resolvido' : 'Pendente'}
                </span>
            </button>
        `).join('')
        : '<p class="empty-records">Nenhum registro neste filtro.</p>';
}

function mapQuickCard() {
    return `
        <div class="map-quick-card">
            <div class="quick-head">
                <span>≈</span>
                <div>
                    <small>PONTO COMUNITÁRIO</small>
                    <strong>Deixe seu comentário</strong>
                </div>
            </div>
            <p class="quick-intro">Conte o que você observou neste local.</p>
            <label>
                Comentário
                <textarea id="quick-comment" maxlength="280" placeholder="Ex.: Há resíduos próximos às pedras..."></textarea>
            </label>
            <div class="quick-coords">⌖ ${freePointPosition[0].toFixed(6)}, ${freePointPosition[1].toFixed(6)}</div>
            <div class="quick-actions">
                <button type="button" class="quick-pending" onclick="saveMapReport('pending')">
                    <span>●</span> Salvar pendente
                </button>
                <button type="button" class="quick-resolved" onclick="saveMapReport('resolved')">
                    <span>✓</span> Salvar resolvido
                </button>
            </div>
            <button type="button" class="quick-cancel" onclick="cancelMapPoint()">
                <span>×</span> Cancelar ponto
            </button>
            <a href="#denuncia" onclick="map.closePopup()">Adicionar foto pelo formulário</a>
        </div>
    `;
}

function popupContent(record) {
    const resolved = record.status === 'resolved';
    
    return `
        <article class="record-popup ${record.status}">
            <div class="popup-photo">
                <img src="${record.photo || placeholder(record.type)}" alt="Foto do registro de ${escapeHtml(record.type)}">
                <span class="popup-category">
                    <b>${typeSymbol(record.type)}</b>${escapeHtml(record.type)}
                </span>
                <span class="popup-status ${record.status}">
                    ${resolved ? '✓ Resolvido' : '● Pendente'}
                </span>
            </div>
            <div class="popup-body">
                <div class="popup-title">
                    <span class="popup-brand">≈</span>
                    <div>
                        <small>REGISTRO MARESIA</small>
                        <h4>${escapeHtml(record.type)}</h4>
                    </div>
                </div>
                <p class="popup-comment">“${escapeHtml(record.comment)}”</p>
                <div class="popup-meta">
                    <span>
                        <b>◷</b>
                        <small>Registrado em</small>
                        <strong>${formatDate(record.createdAt)}</strong>
                    </span>
                    <span>
                        <b>♳</b>
                        <small>Quantidade</small>
                        <strong>${escapeHtml(record.quantity)}</strong>
                    </span>
                </div>
                <div class="popup-coords">
                    <span>⌖</span>
                    <code>${record.lat.toFixed(6)}, ${record.lng.toFixed(6)}</code>
                </div>
                <div class="popup-actions">
                    <button type="button" class="popup-action ${resolved ? 'undo' : ''}" onclick="toggleRecordStatus('${record.id}')">
                        <span>${resolved ? '↶' : '✓'}</span>
                        ${resolved ? 'Reabrir ocorrência' : 'Marcar como resolvido'}
                    </button>
                    <button type="button" class="popup-delete" onclick="deleteRecord('${record.id}', this)" aria-label="Excluir denúncia">
                        <span>⌫</span> Excluir
                    </button>
                </div>
            </div>
        </article>
    `;
}

window.openRecord = id => {
    const record = records.find(item => item.id === id);
    if (!record) return;
    
    map.setView([record.lat, record.lng], 18);
    markers.get(id)?.openPopup();
    $('#mapa').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.toggleRecordStatus = async id => {
    const record = records.find(item => item.id === id) || mapPoints.find(item => item.id === id);
    if (!record) return;
    
    record.status = record.status === 'resolved' ? 'pending' : 'resolved';
    record.updatedAt = new Date().toISOString();
    
    const isMapPoint = record.source === 'map';
    
    if (isMapPoint) {
        saveMapPoints();
        renderMapPoints();
    } else {
        saveRecords();
        try {
            await apiRequest(`/${id}`, { method: 'PUT', body: JSON.stringify(record) });
        } catch {
            apiAvailable = false;
        }
        renderRecords();
    }
    
    map.setView([record.lat, record.lng], 18);
    (isMapPoint ? mapPointMarkers : markers).get(id)?.openPopup();
};

window.deleteRecord = async (id, button) => {
    const record = records.find(item => item.id === id) || mapPoints.find(item => item.id === id);
    if (!record) return;
    
    if (button?.dataset.confirmed !== 'true') {
        button.dataset.confirmed = 'true';
        button.classList.add('confirming');
        button.innerHTML = '<span>!</span> Confirmar exclusão';
        
        setTimeout(() => {
            if (button?.isConnected) {
                button.dataset.confirmed = 'false';
                button.classList.remove('confirming');
                button.innerHTML = '<span>⌫</span> Excluir';
            }
        }, 4000);
        return;
    }
    
    const isMapPoint = record.source === 'map';
    const collection = isMapPoint ? mapPointMarkers : markers;
    const marker = collection.get(id);
    
    if (marker) map.removeLayer(marker);
    collection.delete(id);
    
    if (isMapPoint) {
        mapPoints = mapPoints.filter(item => item.id !== id);
        saveMapPoints();
        renderMapPoints();
    } else {
        records = records.filter(item => item.id !== id);
        saveRecords();
        try {
            await apiRequest(`/${id}`, { method: 'DELETE' });
        } catch {
            apiAvailable = false;
        }
        renderRecords();
    }
    
    mapStatus.textContent = isMapPoint ? 'Ponto comunitário excluído do mapa' : 'Denúncia excluída do mapa';
};

window.saveMapReport = (status = 'pending') => {
    const type = 'Ponto comunitário';
    const comment = $('#quick-comment')?.value.trim();
    
    if (!comment) {
        $('#quick-comment')?.focus();
        return;
    }
    
    if (!freePointPosition) return;
    
    const savedPosition = [...freePointPosition];
    const record = {
        id: `map-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        source: 'map',
        type: type,
        quantity: 'Comentário livre',
        comment: comment,
        photo: '',
        lat: savedPosition[0],
        lng: savedPosition[1],
        status: status,
        createdAt: new Date().toISOString()
    };
    
    mapPoints.unshift(record);
    saveMapPoints();
    
    if (freePointMarker) {
        map.removeLayer(freePointMarker);
        freePointMarker = null;
    }
    
    freePointPosition = null;
    renderMapPoints();
    
    mapStatus.textContent = 'Novo ponto salvo pelo mapa';
    map.setView(savedPosition, 18);
    mapPointMarkers.get(record.id)?.openPopup();
};

window.cancelMapPoint = () => {
    if (freePointMarker) {
        map.removeLayer(freePointMarker);
        freePointMarker = null;
    }
    
    freePointPosition = null;
    map.closePopup();
    mapStatus.textContent = 'Ponto cancelado. Clique em outro local para comentar.';
};

function resizePhoto(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        
        reader.onload = () => {
            const image = new Image();
            image.onerror = reject;
            
            image.onload = () => {
                const max = 900;
                const ratio = Math.min(1, max / Math.max(image.width, image.height));
                
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(image.width * ratio);
                canvas.height = Math.round(image.height * ratio);
                
                canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.78));
            };
            
            image.src = reader.result;
        };
        
        reader.readAsDataURL(file);
    });
}

foto.addEventListener('change', async () => {
    if (!foto.files.length) return;
    
    $('#upload-title').textContent = 'Processando foto...';
    
    try {
        photoData = await resizePhoto(foto.files[0]);
        $('#upload-title').textContent = 'Foto adicionada com sucesso';
        $('#upload-text').textContent = foto.files[0].name;
        foto.closest('.upload-zone').style.borderColor = '#55ad6e';
    } catch {
        $('#upload-title').textContent = 'Não foi possível ler a foto';
    }
});

$('#comentario').addEventListener('input', event => {
    $('#char-count').textContent = event.target.value.length;
});

function geolocationError(error) {
    const messages = {
        1: 'Permissão de localização negada',
        2: 'Não foi possível obter sua posição',
        3: 'O GPS demorou demais para responder'
    };
    
    const message = messages[error.code] || 'Localização indisponível';
    
    mapStatus.textContent = `${message}. Clique no mapa para marcar.`;
    locationFeedback.textContent = `${message}. Selecione o ponto manualmente no mapa.`;
    locationButton.textContent = 'Escolher no mapa';
    mapLocationButton.textContent = '⌖ Tentar GPS';
    locationButton.disabled = mapLocationButton.disabled = false;
    enableMapSelection(true);
}

function confirmLocation(coords, source, accuracy = null) {
    if (source === 'mapa') {
        freePointPosition = [coords[0], coords[1]];
        
        if (freePointMarker) map.removeLayer(freePointMarker);
        
        freePointMarker = L.marker(freePointPosition, {
            icon: pinIcon('pending', 'selected')
        }).addTo(map)
          .bindPopup(mapQuickCard(), { maxWidth: 340, closeOnClick: false })
          .openPopup();
        
        map.setView(freePointPosition, Math.max(map.getZoom(), 16));
        mapStatus.textContent = 'Ponto livre selecionado — escreva seu comentário';
        return;
    }
    
    selectedPosition = [coords[0], coords[1]];
    gps.value = `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`;
    
    locationFeedback.textContent = `✓ Localização marcada via ${source}${accuracy ? ` · precisão aproximada de ${Math.round(accuracy)} m` : ''}`;
    locationFeedback.classList.add('ready');
    gps.closest('.location-input').classList.add('ready');
    
    if (selectedMarker) map.removeLayer(selectedMarker);
    
    const popup = '<div class="location-confirmed"><strong>✓ Localização captured</strong><span>Este ponto será salvo ao enviar a denúncia.</span></div>';
    
    selectedMarker = L.marker(selectedPosition, {
        icon: pinIcon('pending', 'selected')
    }).addTo(map)
      .bindPopup(popup, { maxWidth: 340, closeOnClick: false })
      .openPopup();
    
    map.setView(selectedPosition, 17);
    mapStatus.textContent = 'Localização confirmada para a denúncia';
    locationButton.textContent = '✓ GPS marcado';
    mapLocationButton.textContent = '✓ Ponto confirmado';
    enableMapSelection(false);
}

function updatePosition(position, firstUpdate = false) {
    const { latitude, longitude, accuracy } = position.coords;
    const livePosition = [latitude, longitude];
    
    if (userMarker) map.removeLayer(userMarker);
    if (accuracyCircle) map.removeLayer(accuracyCircle);
    
    userMarker = L.marker(livePosition, {
        icon: pinIcon('pending', 'user')
    }).addTo(map)
      .bindPopup('<strong>Sua posição atual</strong><br>Atualizada pelo GPS em tempo real');
    
    accuracyCircle = L.circle(livePosition, {
        radius: accuracy,
        color: '#087d91',
        fillOpacity: 0.08,
        weight: 1
    }).addTo(map);
    
    confirmLocation(livePosition, 'GPS', accuracy);
    
    if (firstUpdate) userMarker.openPopup();
    
    locationButton.disabled = mapLocationButton.disabled = false;
}

function useCurrentLocation() {
    if (!navigator.geolocation) {
        return geolocationError({ code: 2 });
    }
    
    locationButton.textContent = mapLocationButton.textContent = 'Localizando...';
    locationButton.disabled = mapLocationButton.disabled = true;
    
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    
    let first = true;
    watchId = navigator.geolocation.watchPosition(
        position => {
            updatePosition(position, first);
            first = false;
        },
        geolocationError,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
}

function enableMapSelection(enabled) {
    selectingOnMap = enabled;
    map.getContainer().classList.toggle('map-selecting', enabled);
    mapStatus.textContent = enabled ? 'Modo de marcação ativo: clique no local exato' : mapStatus.textContent;
    
    if (enabled) {
        document.querySelector('#mapa').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function requestLocation() {
    if (!window.isSecureContext) {
        enableMapSelection(true);
        locationFeedback.textContent = 'GPS exige HTTPS ou localhost. Clique no local exato no mapa.';
        return;
    }
    useCurrentLocation();
}

map.on('popupopen', event => {
    L.DomEvent.disableClickPropagation(event.popup.getElement());
});

map.on('click', event => {
    if (event.originalEvent?.target?.closest?.('.leaflet-popup,button,a,input,textarea,select')) {
        return;
    }
    confirmLocation([event.latlng.lat, event.latlng.lng], 'mapa');
});

locationButton.addEventListener('click', requestLocation);
manualLocationButton.addEventListener('click', () => enableMapSelection(true));
mapLocationButton.addEventListener('click', requestLocation);
statusFilter.addEventListener('change', renderRecords);

form.addEventListener('submit', async event => {
    event.preventDefault();
    
    const type = $('#tipo').value;
    const comment = $('#comentario').value.trim();

    if (!comment) {
        $('#comentario').focus();
        return;
    }

    if (!selectedPosition) {
        mapStatus.textContent = 'Marque uma localização antes de enviar.';
        gps.value = 'Localização obrigatória para registrar';
        locationFeedback.textContent = 'Clique em "Marcar localização" ou selecione um ponto no mapa.';
        locationButton.focus();
        return;
    }

    const savedPosition = [...selectedPosition];
    const record = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type: type,  
        quantity: $('#quantidade').value,
        comment: comment,
        photo: photoData,
        lat: savedPosition[0],
        lng: savedPosition[1],
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    records.unshift(record);

    try {
        saveRecords();
    } catch {
        record.photo = '';
        saveRecords();
    }

    await persistReport(record);
    renderRecords();

    form.reset();
    photoData = '';
    selectedPosition = null;
    if (selectedMarker) {
        map.removeLayer(selectedMarker);
        selectedMarker = null;
    }
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    $('#char-count').textContent = '0';
    $('#upload-title').textContent = 'Adicione uma foto';
    $('#upload-text').textContent = 'Arraste ou toque para selecionar · PNG ou JPG';
    gps.value = 'Nenhuma localização marcada';
    locationFeedback.textContent = 'Registro salvo. Marque uma nova localização para outra denúncia.';
    locationFeedback.classList.remove('ready');
    gps.closest('.location-input').classList.remove('ready');
    locationButton.textContent = 'Usar GPS';
    mapLocationButton.textContent = '⌖ Marcar minha localização';

    const now = new Date();
    const dataHora = now.toLocaleString('pt-BR', {
        dateStyle: 'full',
        timeStyle: 'medium'
    });

    document.getElementById('success-time').textContent = '📅 ' + dataHora;
    document.getElementById('success').classList.add('show');

    form.querySelector('.submit-btn').innerHTML = 'Denúncia enviada <span>✓</span>';
    mapStatus.textContent = 'Novo registro salvo e exibido no mapa';
    map.setView(savedPosition, 18);

    setTimeout(() => {
        markers.get(record.id)?.openPopup();
    }, 500);

    $('#mapa').scrollIntoView({ behavior: 'smooth' });

    setTimeout(() => {
        document.getElementById('success').classList.remove('show');
        form.querySelector('.submit-btn').innerHTML = 'Enviar denúncia <span>→</span>';
    }, 8000);
});

const legacyMapPoints = records.filter(item => item.quantity === 'Registrado pelo mapa');

if (legacyMapPoints.length) {
    legacyMapPoints.forEach(item => {
        if (!mapPoints.some(point => point.id === item.id)) {
            mapPoints.push({
                ...item,
                source: 'map',
                type: 'Ponto comunitário',
                quantity: 'Comentário livre'
            });
        }
    });
    
    records = records.filter(item => item.quantity !== 'Registrado pelo mapa');
    saveRecords();
    saveMapPoints();
}

renderRecords();
renderMapPoints();
syncReportsFromApi();

setTimeout(() => map.invalidateSize(), 200);