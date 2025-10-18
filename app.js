
let transportData = null;
let favorites = [];
let currentSort = 'time';
let currentLang = 'es';
let currentTheme = 'light';

const translations = {
    es: {
        planRoute: "Planifica tu ruta",
        origin: "Origen",
        destination: "Destino", 
        calculate: "Calcular rutas",
        favorites: "⭐ Mis Favoritas",
        sortTime: "Por tiempo",
        sortCost: "Por costo",
        sortTransfers: "Por transbordos",
        footer: "Simulador de transporte público dominicano",
        time: "Tiempo",
        cost: "Costo",
        transfers: "Transbordos",
        addFavorite: "Agregar a favoritas",
        removeFavorite: "Quitar de favoritas",
        noRoutes: "No hay rutas disponibles",
        selectRoute: "Selecciona origen y destino para ver rutas",
        remove: "Eliminar",
        minutes: "min",
        chooseNeighborhood: "Selecciona un barrio",
        sameLocation: "Origen y destino deben ser diferentes",
        automaticRoute: "Ruta estimada"
    },
    en: {
        planRoute: "Plan your route",
        origin: "Origin",
        destination: "Destination",
        calculate: "Calculate routes", 
        favorites: "⭐ My Favorites",
        sortTime: "By time",
        sortCost: "By cost",
        sortTransfers: "By transfers",
        footer: "Dominican public transport simulator",
        time: "Time",
        cost: "Cost",
        transfers: "Transfers",
        addFavorite: "Add to favorites",
        removeFavorite: "Remove from favorites", 
        noRoutes: "No routes available",
        selectRoute: "Select origin and destination to see routes",
        remove: "Remove",
        minutes: "min",
        chooseNeighborhood: "Select a neighborhood",
        sameLocation: "Origin and destination must be different",
        automaticRoute: "Estimated route"
    }
};

// Mapa de distancias aproximadas entre barrios (para cálculos automáticos)
const neighborhoodDistances = {
    "Zona Colonial": { "Gazcue": 2, "Ciudad Nueva": 1, "Bella Vista": 5, "Naco": 6, "Piantini": 7 },
    "Gazcue": { "Zona Colonial": 2, "Ciudad Nueva": 3, "Bella Vista": 4, "Naco": 5, "Piantini": 6 },
    "Naco": { "Piantini": 2, "Bella Vista": 3, "Arroyo Hondo": 4, "La Esperilla": 3 },
    "Piantini": { "Naco": 2, "Bella Vista": 2, "Arroyo Hondo": 3, "La Esperilla": 4 },
    "Bella Vista": { "Naco": 3, "Piantini": 2, "La Esperilla": 2, "Gazcue": 4 },
    "Los Mina": { "Villa Duarte": 3, "Cristo Rey": 5, "San Carlos": 8, "Gazcue": 10 },
    "Villa Mella": { "Los Alcarrizos": 6, "Santo Domingo Oeste": 8, "Gazcue": 12 },
    "Herrera": { "Cristo Rey": 4, "Los Mina": 6, "San Carlos": 5 },
    "San Carlos": { "Ciudad Nueva": 4, "Los Mina": 8, "Herrera": 5 },
    "Cristo Rey": { "Villa Duarte": 4, "Los Tres Ojos": 3, "Los Mina": 5, "Herrera": 4 },
    "Los Alcarrizos": { "Villa Mella": 6, "Santo Domingo Oeste": 5, "Gazcue": 15 },
    "Santo Domingo Oeste": { "Los Alcarrizos": 5, "Villa Mella": 8, "Boca Chica": 20 },
    "Boca Chica": { "Los Tres Ojos": 15, "Santo Domingo Oeste": 20, "Zona Colonial": 25 },
    "Villa Duarte": { "Los Mina": 3, "Cristo Rey": 4, "Los Tres Ojos": 6 },
    "Los Tres Ojos": { "Cristo Rey": 3, "Villa Duarte": 6, "Boca Chica": 15 },
    "Arroyo Hondo": { "Naco": 4, "Piantini": 3, "La Esperilla": 5 },
    "La Esperilla": { "Bella Vista": 2, "Naco": 3, "Piantini": 4, "Arroyo Hondo": 5 },
    "Ciudad Nueva": { "Zona Colonial": 1, "Gazcue": 3, "San Carlos": 4 }
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando aplicación...');
    await initializeApp();
});

async function initializeApp() {
    try {
        await loadTransportData();
        loadFavorites();
        setupEventListeners();
        populateSelects();
        applyTranslations();
        updateTheme();
        
        // Mostrar estado inicial
        showEmptyState(translations[currentLang].selectRoute);
        
    } catch (error) {
        console.error('Error inicializando app:', error);
        showError('Error al cargar la aplicación');
    }
}

async function loadTransportData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('No se pudo cargar data.json');
        transportData = await response.json();
        console.log('Datos cargados correctamente:', transportData.routes.length, 'rutas');
    } catch (error) {
        console.warn('Usando datos de respaldo:', error);
        transportData = {
            neighborhoods: Object.keys(neighborhoodDistances),
            routes: []
        };
    }
}

function setupEventListeners() {
    // Formulario
    const form = document.getElementById('routeForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Botones de tema e idioma
    const themeBtn = document.getElementById('themeToggle');
    const langBtn = document.getElementById('langToggle');
    
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    if (langBtn) langBtn.addEventListener('click', toggleLanguage);

    // Botones de ordenamiento
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentSort = e.target.dataset.sort;
            
            const origin = document.getElementById('origin').value;
            const destination = document.getElementById('destination').value;
            if (origin && destination) {
                calculateRoutes(origin, destination);
            }
        });
    });
}

function populateSelects() {
    const originSelect = document.getElementById('origin');
    const destSelect = document.getElementById('destination');
    
    if (!originSelect || !destSelect) return;

    // Limpiar selects
    originSelect.innerHTML = '';
    destSelect.innerHTML = '';

    // Agregar opción por defecto
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = translations[currentLang].chooseNeighborhood;
    originSelect.appendChild(defaultOption);
    destSelect.appendChild(defaultOption.cloneNode(true));

    // Agregar barrios ordenados
    const neighborhoods = transportData.neighborhoods ? 
        [...new Set(transportData.neighborhoods)].sort() : 
        Object.keys(neighborhoodDistances).sort();
        
    neighborhoods.forEach(neighborhood => {
        const option1 = document.createElement('option');
        option1.value = neighborhood;
        option1.textContent = neighborhood;
        originSelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = neighborhood;
        option2.textContent = neighborhood;
        destSelect.appendChild(option2);
    });
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;

    if (!origin || !destination) {
        showAlert(translations[currentLang].selectRoute, 'warning');
        return;
    }

    if (origin === destination) {
        showAlert(translations[currentLang].sameLocation, 'warning');
        return;
    }

    calculateRoutes(origin, destination);
}

function calculateRoutes(origin, destination) {
    console.log(`Buscando rutas: ${origin} → ${destination}`);

    // Buscar rutas exactas
    let exactRoutes = [];
    if (transportData && transportData.routes) {
        exactRoutes = transportData.routes.filter(route => 
            route.from === origin && route.to === destination
        );
    }

    console.log(`Encontradas: ${exactRoutes.length} rutas exactas`);

    let routesToDisplay = exactRoutes;

    // Si no hay rutas exactas, generar rutas automáticas
    if (exactRoutes.length === 0) {
        console.log('Generando rutas automáticas...');
        const autoRoutes = generateAutomaticRoutes(origin, destination);
        routesToDisplay = autoRoutes;
    }

    if (routesToDisplay.length === 0) {
        showEmptyState(translations[currentLang].noRoutes);
        showAlert(translations[currentLang].noRoutes, 'info');
        return;
    }

    // Calcular tiempos y costos
    const calculatedRoutes = routesToDisplay.map(route => {
        let totalTime = 0;
        let totalCost = 0;

        route.segments.forEach(segment => {
            totalTime += segment.time || 0;
            totalCost += segment.cost || 0;
        });

        return {
            ...route,
            totalTime: Math.round(totalTime),
            totalCost: Math.round(totalCost),
            transfers: route.segments.length - 1
        };
    });

    displayRoutes(calculatedRoutes);
}

function generateAutomaticRoutes(origin, destination) {
    const routes = [];
    
    // Calcular distancia aproximada
    const distance = calculateDistance(origin, destination);
    
    // Generar 2-3 rutas automáticas con diferentes tipos de transporte
    const transportOptions = [
        { type: 'concho', timePerKm: 4, costPerKm: 6 },
        { type: 'guagua', timePerKm: 5, costPerKm: 3 },
        { type: 'motoconcho', timePerKm: 3, costPerKm: 8 }
    ];

    // Siempre generar al menos una ruta de concho
    const conchoRoute = {
        id: `auto-${Date.now()}-1`,
        from: origin,
        to: destination,
        segments: [
            {
                type: 'concho',
                time: Math.max(10, Math.round(distance * 4)),
                cost: Math.max(25, Math.round(distance * 6)),
                conditions: []
            }
        ],
        automatic: true
    };
    routes.push(conchoRoute);

    // Generar 1-2 rutas adicionales basadas en la distancia
    if (distance > 5) {
        const guaguaRoute = {
            id: `auto-${Date.now()}-2`,
            from: origin,
            to: destination,
            segments: [
                {
                    type: 'guagua',
                    time: Math.max(15, Math.round(distance * 5)),
                    cost: Math.max(20, Math.round(distance * 3)),
                    conditions: [
                        {
                            name: "hora_pico",
                            pct: 30
                        }
                    ]
                }
            ],
            automatic: true
        };
        routes.push(guaguaRoute);
    }

    // Para distancias cortas, agregar motoconcho
    if (distance <= 8) {
        const motoconchoRoute = {
            id: `auto-${Date.now()}-3`,
            from: origin,
            to: destination,
            segments: [
                {
                    type: 'motoconcho',
                    time: Math.max(8, Math.round(distance * 3)),
                    cost: Math.max(40, Math.round(distance * 8)),
                    conditions: [
                        {
                            name: "lluvia",
                            pct: 50
                        }
                    ]
                }
            ],
            automatic: true
        };
        routes.push(motoconchoRoute);
    }

    console.log(`Generadas ${routes.length} rutas automáticas`);
    return routes;
}

function calculateDistance(origin, destination) {
    // Buscar distancia directa
    if (neighborhoodDistances[origin] && neighborhoodDistances[origin][destination]) {
        return neighborhoodDistances[origin][destination];
    }
    
    // Si no hay distancia directa, calcular aproximación
    const allDistances = [];
    
    // Buscar distancias a través de puntos intermedios
    if (neighborhoodDistances[origin]) {
        Object.values(neighborhoodDistances[origin]).forEach(dist => {
            allDistances.push(dist);
        });
    }
    
    if (neighborhoodDistances[destination]) {
        Object.values(neighborhoodDistances[destination]).forEach(dist => {
            allDistances.push(dist);
        });
    }
    
    // Promedio de distancias conocidas + margen
    const avgDistance = allDistances.length > 0 ? 
        allDistances.reduce((a, b) => a + b, 0) / allDistances.length : 8;
    
    return Math.min(25, Math.max(3, avgDistance + 2));
}

function displayRoutes(routes) {
    const resultsContainer = document.getElementById('results');
    if (!resultsContainer) return;

    // Ordenar rutas
    const sortedRoutes = [...routes].sort((a, b) => {
        switch (currentSort) {
            case 'cost': return a.totalCost - b.totalCost;
            case 'transfers': return a.transfers - b.transfers;
            default: return a.totalTime - b.totalTime;
        }
    });

    resultsContainer.innerHTML = '';

    sortedRoutes.forEach(route => {
        const isFavorite = favorites.some(fav => fav.id === route.id);
        const routeCard = createRouteCard(route, isFavorite);
        resultsContainer.appendChild(routeCard);
    });
}

function createRouteCard(route, isFavorite) {
    const card = document.createElement('div');
    card.className = `route-card ${isFavorite ? 'favorite' : ''}`;
    
    const mainType = route.segments[0]?.type || 'concho';
    const typeNames = {
        'concho': 'Concho',
        'guagua': 'Guagua', 
        'motoconcho': 'Motoconcho',
        'carro_publico': 'Carro Público'
    };

    const isAutomatic = route.automatic;
    const automaticBadge = isAutomatic ? '<span style="font-size: 0.7rem; background: #f59e0b; color: white; padding: 0.2rem 0.4rem; border-radius: 4px; margin-left: 0.5rem;">ESTIMADA</span>' : '';

    card.innerHTML = `
        <div class="route-header">
            <div>
                <span class="route-type type-${mainType.replace('_', '-')}">
                    ${typeNames[mainType] || mainType}
                </span>
                ${automaticBadge}
            </div>
            <span class="star" data-route-id="${route.id}">
                ${isFavorite ? '⭐' : '☆'}
            </span>
        </div>
        <p><strong>${route.from}</strong> → <strong>${route.to}</strong></p>
        <div class="route-stats">
            <div class="stat">
                <div class="stat-value">${route.totalTime}</div>
                <div class="stat-label" data-i18n="minutes">min</div>
            </div>
            <div class="stat">
                <div class="stat-value">$${route.totalCost}</div>
                <div class="stat-label" data-i18n="cost">Costo</div>
            </div>
            <div class="stat">
                <div class="stat-value">${route.transfers}</div>
                <div class="stat-label" data-i18n="transfers">Transbordos</div>
            </div>
        </div>
        <div class="mini-map">${createRouteMap(route)}</div>
        ${isAutomatic ? '<div style="font-size: 0.8rem; color: #f59e0b; margin-top: 0.5rem;">⚠️ Ruta estimada - tiempos y costos aproximados</div>' : ''}
    `;

    // Event listener para favoritos
    const star = card.querySelector('.star');
    if (star) {
        star.addEventListener('click', () => toggleFavorite(route));
    }

    return card;
}

function createRouteMap(route) {
    const segments = route.segments.length;
    if (segments === 0) return '';

    const width = 280;
    const height = 60;
    const segmentWidth = (width - 40) / Math.max(segments, 1);
    
    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    svg += `<line x1="20" y1="30" x2="${width-20}" y2="30" stroke="#e2e8f0" stroke-width="3"/>`;
    
    for (let i = 0; i <= segments; i++) {
        const x = 20 + (i * segmentWidth);
        let color = '#3b82f6'; // Azul para puntos intermedios
        
        if (i === 0) color = '#10b981'; // Verde para inicio
        if (i === segments) color = '#ef4444'; // Rojo para fin
        
        svg += `<circle cx="${x}" cy="30" r="5" fill="${color}"/>`;
    }
    
    svg += `</svg>`;
    return svg;
}

function toggleFavorite(route) {
    const index = favorites.findIndex(fav => fav.id === route.id);
    
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push({...route});
    }
    
    saveFavorites();
    displayFavorites();
    
    // Actualizar la vista actual si hay rutas mostradas
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;
    if (origin && destination) {
        calculateRoutes(origin, destination);
    }
}

function displayFavorites() {
    const section = document.getElementById('favoritesSection');
    const list = document.getElementById('favoritesList');
    
    if (!section || !list) return;
    
    if (favorites.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    list.innerHTML = '';
    
    favorites.forEach(fav => {
        const item = document.createElement('div');
        item.className = 'favorite-item';
        item.innerHTML = `
            <div>
                <strong>${fav.from}</strong> → <strong>${fav.to}</strong><br>
                <small>${fav.totalTime} min • $${fav.totalCost}</small>
            </div>
            <button class="btn-remove" data-i18n="remove">${translations[currentLang].remove}</button>
        `;
        
        item.querySelector('.btn-remove').addEventListener('click', () => toggleFavorite(fav));
        list.appendChild(item);
    });
}

function loadFavorites() {
    try {
        const saved = localStorage.getItem('guaguatime_favorites');
        if (saved) {
            favorites = JSON.parse(saved);
            displayFavorites();
        }
    } catch (error) {
        console.warn('Error cargando favoritos:', error);
        favorites = [];
    }
}

function saveFavorites() {
    try {
        localStorage.setItem('guaguatime_favorites', JSON.stringify(favorites));
    } catch (error) {
        console.warn('Error guardando favoritos:', error);
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    updateTheme();
}

function updateTheme() {
    document.body.setAttribute('data-theme', currentTheme);
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.textContent = currentTheme === 'light' ? '🌙' : '☀️';
    }
}

function toggleLanguage() {
    currentLang = currentLang === 'es' ? 'en' : 'es';
    applyTranslations();
    
    const langBtn = document.getElementById('langToggle');
    if (langBtn) {
        langBtn.textContent = currentLang === 'es' ? 'ES' : 'EN';
    }
    
    // Repobular selects con nuevas traducciones
    populateSelects();
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = translations[currentLang][key];
        
        if (translation) {
            if (element.tagName === 'INPUT' || element.tagName === 'SELECT') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        }
    });
}

function showEmptyState(message) {
    const results = document.getElementById('results');
    if (results) {
        results.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 100 100" width="60" height="60">
                    <circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="4" fill="none"/>
                    <path d="M30 50 L45 65 L70 35" stroke="currentColor" stroke-width="4" fill="none" 
                          stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h3>${message}</h3>
            </div>
        `;
    }
}

function showAlert(message, type = 'warning') {
    const alertsContainer = document.getElementById('alerts');
    if (!alertsContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertsContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 4000);
}

function showError(message) {
    const results = document.getElementById('results');
    if (results) {
        results.innerHTML = `
            <div class="empty-state">
                <h3>❌ Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

// Service Worker simplificado
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(console.error);
    });
}