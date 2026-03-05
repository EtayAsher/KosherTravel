window.KTFinder = (() => {
  const CATEGORIES = ['chabad', 'restaurant', 'grocery'];
  const CATEGORY_ICON = { chabad: '🕍', restaurant: '🍽️', grocery: '🛒' };
  const MAX_MARKERS_PER_CITY = 100;
  let map;
  let markersLayer;
  let markerCluster;
  let cities = [];
  let places = [];
  let selectedCityId = '';
  let activeCategory = 'all';
  let includeReported = false;
  let currentFiltered = [];

  async function init() {
    const citySelect = document.getElementById('citySelect');
    const categoryFilters = document.getElementById('categoryFilters');
    const reportedToggle = document.getElementById('reportedToggle');
    const resultsList = document.getElementById('resultsList');

    resultsList.innerHTML = skeletonCards();
    cities = await KTData.fetchCities();
    places = await KTData.fetchPlaces();

    selectedCityId = localStorage.getItem(KTData.STORAGE_KEY) || cities[0]?.id || 'newyork';
    if (!cities.some((city) => city.id === selectedCityId)) selectedCityId = cities[0]?.id;

    citySelect.innerHTML = cities.map((city) => `<option value="${city.id}">${city.name}</option>`).join('');
    citySelect.value = selectedCityId;
    categoryFilters.innerHTML = [
      '<button type="button" class="chip active" data-category="all" aria-label="Filter all categories">All</button>',
      ...CATEGORIES.map((category) => `<button type="button" class="chip" data-category="${category}" aria-label="Filter ${KTData.CATEGORY_META[category].label}">${CATEGORY_ICON[category]} ${KTData.CATEGORY_META[category].label}</button>`)
    ].join('');

    citySelect.addEventListener('change', () => {
      selectedCityId = citySelect.value;
      localStorage.setItem(KTData.STORAGE_KEY, selectedCityId);
      render();
    });

    reportedToggle.addEventListener('change', () => {
      includeReported = reportedToggle.checked;
      render();
    });

    categoryFilters.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-category]');
      if (!button) return;
      activeCategory = button.dataset.category;
      [...categoryFilters.querySelectorAll('button')].forEach((entry) => entry.classList.toggle('active', entry === button));
      render();
    });

    resultsList.addEventListener('click', (event) => {
      const card = event.target.closest('.card[data-id]');
      if (!card) return;
      const place = currentFiltered.find((entry) => entry.id === card.dataset.id);
      if (!place) return;
      map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 14), { duration: 0.45 });
    });

    resultsList.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.closest('.card[data-id]')) {
        event.preventDefault();
        event.target.closest('.card[data-id]').click();
      }
    });

    map = L.map('map', { zoomControl: true, preferCanvas: true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      updateWhenIdle: true,
      keepBuffer: 2
    }).addTo(map);
    markersLayer = L.layerGroup();
    markerCluster = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 40, disableClusteringAtZoom: 14 });
    markerCluster.addLayer(markersLayer);
    map.addLayer(markerCluster);

    render();
  }

  function getActiveShabbatPlan() {
    try {
      const plan = JSON.parse(localStorage.getItem(KTData.SHABBAT_PLAN_KEY) || '{}');
      if (!plan?.active || !plan?.hotel) return null;
      return plan;
    } catch {
      return null;
    }
  }

  function render() {
    const city = cities.find((entry) => entry.id === selectedCityId) || cities[0];
    const resultsList = document.getElementById('resultsList');
    const resultCount = document.getElementById('resultCount');
    const shabbatPlan = getActiveShabbatPlan();

    map.setView(city.center, city.zoom, { animate: false });

    const cityPlaces = places
      .filter((place) => place.cityId === city.id)
      .filter((place) => (includeReported ? ['verified', 'reported', 'needsCheck'].includes(place.certificationLevel) : place.certificationLevel === 'verified'))
      .filter((place) => activeCategory === 'all' || place.category === activeCategory)
      .slice(0, MAX_MARKERS_PER_CITY)
      .map((place) => {
        if (!shabbatPlan?.hotel) return place;
        return { ...place, distanceKm: KTData.haversineDistanceKm(shabbatPlan.hotel.lat, shabbatPlan.hotel.lng, place.lat, place.lng) };
      });

    currentFiltered = cityPlaces;
    resultCount.textContent = `${cityPlaces.length} places`;

    if (!cityPlaces.length) {
      resultsList.innerHTML = '<div class="empty"><p>🧭</p><p>No places found for this filter.</p></div>';
      markersLayer.clearLayers();
      return;
    }

    resultsList.innerHTML = cityPlaces.map((place) => {
      const meta = KTData.CATEGORY_META[place.category];
      const cert = KTData.CERTIFICATION_META[place.certificationLevel] || KTData.CERTIFICATION_META.reported;
      const websiteButton = KTData.isValidWebsite(place.website) ? `<a class="btn btn-secondary" href="${place.website}" target="_blank" rel="noopener noreferrer" aria-label="Open website for ${place.name}">Website</a>` : '';
      const distanceLine = Number.isFinite(place.distanceKm) ? `<p class="distance">From hotel: ${KTData.formatDistance(place.distanceKm)}</p>` : '';
      return `<article class="card" data-id="${place.id}" tabindex="0" role="button" aria-label="View ${place.name} on map">
        <h3>${place.name}</h3>
        <p class="badges"><span class="badge" style="--badge:${meta.color}">${CATEGORY_ICON[place.category]} ${meta.label}</span><span class="badge cert" style="--badge:${cert.color}">✓ ${cert.label}</span></p>
        <p class="muted">${place.fullAddress}</p>
        ${distanceLine}
        <div class="actions">
          ${websiteButton}
          <a class="btn btn-primary" href="${KTData.getDirectionsUrl(place, shabbatPlan?.hotel)}" target="_blank" rel="noopener noreferrer" aria-label="Get walking directions to ${place.name}">Walking directions</a>
        </div>
      </article>`;
    }).join('');

    markersLayer.clearLayers();
    cityPlaces.forEach((place, index) => {
      const meta = KTData.CATEGORY_META[place.category];
      const cert = KTData.CERTIFICATION_META[place.certificationLevel] || KTData.CERTIFICATION_META.reported;
      const marker = L.marker([place.lat, place.lng], { icon: markerIcon(meta.color, index) })
        .bindPopup(`<strong>${place.name}</strong><br>${place.fullAddress}<br><small style="color:${cert.color}">${cert.label}</small>`);
      markersLayer.addLayer(marker);
    });
  }

  function skeletonCards() {
    return Array.from({ length: 5 }).map(() => '<div class="card skeleton"><div></div><div></div><div></div></div>').join('');
  }

  function markerIcon(color, index = 0) {
    return L.divIcon({ className: '', html: `<span class="pin" style="--pin:${color};--delay:${Math.min(index * 30, 350)}ms"></span>`, iconSize: [18, 18], iconAnchor: [9, 9] });
  }

  return { init };
})();
