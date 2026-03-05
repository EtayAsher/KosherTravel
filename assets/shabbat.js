window.KTShabbat = (() => {
  const RADIUS_PRESETS = [0.8, 1.2, 1.5, 2.0];
  const DEFAULT_RADIUS = 1.2;
  let map;
  let markersLayer;
  let radiusCircle;
  let hotelMarker;
  let cities = [];
  let places = [];
  let selectedCityId = '';
  let radiusKm = DEFAULT_RADIUS;
  let hotel = null;

  async function init() {
    const citySelect = document.getElementById('shabbatCitySelect');
    const radiusRange = document.getElementById('radiusRange');
    const radiusLabel = document.getElementById('radiusLabel');
    const presetsWrap = document.getElementById('radiusPresets');
    const setCurrentLocationButton = document.getElementById('currentLocationBtn');
    const plannerMessage = document.getElementById('plannerMessage');

    document.getElementById('shabbatResults').innerHTML = skeletonCards();
    cities = await KTData.fetchCities();
    places = await KTData.fetchPlaces();

    selectedCityId = localStorage.getItem(KTData.STORAGE_KEY) || cities[0]?.id || 'newyork';
    if (!cities.some((city) => city.id === selectedCityId)) selectedCityId = cities[0]?.id;

    citySelect.innerHTML = cities.map((city) => `<option value="${city.id}">${city.name}</option>`).join('');
    citySelect.value = selectedCityId;
    radiusRange.min = String(RADIUS_PRESETS[0]);
    radiusRange.max = String(RADIUS_PRESETS[RADIUS_PRESETS.length - 1]);
    radiusRange.step = '0.1';
    radiusRange.value = String(radiusKm);
    radiusLabel.textContent = `${radiusKm.toFixed(1)} km`;
    presetsWrap.innerHTML = RADIUS_PRESETS.map((preset) => `<button type="button" class="chip ${preset === radiusKm ? 'active' : ''}" data-radius="${preset}" aria-label="Set radius ${preset.toFixed(1)} kilometers">${preset.toFixed(1)} km</button>`).join('');

    citySelect.addEventListener('change', () => {
      selectedCityId = citySelect.value;
      localStorage.setItem(KTData.STORAGE_KEY, selectedCityId);
      resetHotel();
      render();
    });

    radiusRange.addEventListener('input', () => {
      radiusKm = Number(radiusRange.value);
      radiusLabel.textContent = `${radiusKm.toFixed(1)} km`;
      setActivePreset();
      updateOverlay();
      render();
    });

    presetsWrap.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-radius]');
      if (!button) return;
      radiusKm = Number(button.dataset.radius);
      radiusRange.value = String(radiusKm);
      radiusLabel.textContent = `${radiusKm.toFixed(1)} km`;
      setActivePreset();
      updateOverlay();
      render();
    });

    setCurrentLocationButton.addEventListener('click', () => {
      if (!navigator.geolocation) {
        plannerMessage.textContent = 'Location permission is unavailable in this browser.';
        return;
      }
      navigator.geolocation.getCurrentPosition((position) => {
        hotel = { lat: position.coords.latitude, lng: position.coords.longitude };
        setHotelMarker();
        updateOverlay();
        render();
      }, () => {
        plannerMessage.textContent = 'Could not access your current location. Tap the map to set hotel manually.';
      }, { enableHighAccuracy: true, timeout: 10000 });
    });

    map = L.map('shabbatMap', { zoomControl: true, preferCanvas: true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      updateWhenIdle: true,
      keepBuffer: 2
    }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);

    map.on('click', (event) => {
      hotel = { lat: event.latlng.lat, lng: event.latlng.lng };
      setHotelMarker();
      updateOverlay();
      render();
    });

    render();
  }

  function setActivePreset() {
    const wrap = document.getElementById('radiusPresets');
    [...wrap.querySelectorAll('button[data-radius]')].forEach((button) => button.classList.toggle('active', Number(button.dataset.radius) === Number(radiusKm)));
  }

  function resetHotel() {
    hotel = null;
    if (hotelMarker) { map.removeLayer(hotelMarker); hotelMarker = null; }
    if (radiusCircle) { map.removeLayer(radiusCircle); radiusCircle = null; }
    document.getElementById('hotelStatus').textContent = 'Tap the map to set your hotel location.';
    document.getElementById('plannerMessage').textContent = 'Tap the map to set your hotel location.';
    savePlan();
  }

  function setHotelMarker() {
    if (hotelMarker) map.removeLayer(hotelMarker);
    hotelMarker = L.marker([hotel.lat, hotel.lng], { icon: hotelIcon() }).addTo(map);
    document.getElementById('hotelStatus').textContent = `Hotel set at ${hotel.lat.toFixed(5)}, ${hotel.lng.toFixed(5)}`;
    document.getElementById('plannerMessage').textContent = '';
    savePlan();
  }

  function updateOverlay() {
    if (!hotel) return;
    if (radiusCircle) map.removeLayer(radiusCircle);
    radiusCircle = L.circle([hotel.lat, hotel.lng], { radius: radiusKm * 1000, color: '#C6A85A', fillColor: '#C6A85A', fillOpacity: 0.12, weight: 2 }).addTo(map);
    savePlan();
  }

  function render() {
    const city = cities.find((entry) => entry.id === selectedCityId) || cities[0];
    map.setView(city.center, city.zoom);

    const cityPlaces = places.filter((place) => place.cityId === city.id && place.certificationLevel === 'verified')
      .map((place) => ({ ...place, distanceKm: hotel ? KTData.haversineDistanceKm(hotel.lat, hotel.lng, place.lat, place.lng) : Number.POSITIVE_INFINITY }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
    const walkable = cityPlaces.filter((place) => place.distanceKm <= radiusKm);

    const wrap = document.getElementById('shabbatResults');
    const count = document.getElementById('walkableCount');
    const controls = document.querySelectorAll('#radiusRange, #radiusPresets button');
    controls.forEach((entry) => { entry.disabled = !hotel; });

    if (!hotel) {
      count.textContent = 'Set your hotel location to activate planner';
      wrap.innerHTML = '<div class="empty"><p>📍</p><p>Tap the map to set your hotel location.</p></div>';
      markersLayer.clearLayers();
      savePlan();
      return;
    }

    count.textContent = `${walkable.length} places within ${radiusKm.toFixed(1)} km`;
    wrap.innerHTML = cityPlaces.length ? cityPlaces.map((place) => {
      const meta = KTData.CATEGORY_META[place.category];
      const websiteButton = KTData.isValidWebsite(place.website) ? `<a class="btn btn-secondary" href="${place.website}" target="_blank" rel="noopener noreferrer" aria-label="Open website for ${place.name}">Website</a>` : '';
      const inside = place.distanceKm <= radiusKm;
      return `<article class="card ${inside ? 'in-radius' : 'out-radius'}">
          <h3>${place.name}</h3>
          <p class="badges"><span class="badge" style="--badge:${meta.color}">${meta.label}</span></p>
          <p class="muted">${place.fullAddress}</p>
          <p class="distance">${KTData.formatDistance(place.distanceKm)}</p>
          <div class="actions">
            ${websiteButton}
            <a class="btn btn-primary" href="${KTData.getDirectionsUrl(place, hotel)}" target="_blank" rel="noopener noreferrer" aria-label="Get walking directions to ${place.name}">Walking directions</a>
          </div>
        </article>`;
    }).join('') : '<div class="empty"><p>🧭</p><p>No verified places in this city.</p></div>';

    markersLayer.clearLayers();
    cityPlaces.forEach((place, index) => {
      const inside = place.distanceKm <= radiusKm;
      const meta = KTData.CATEGORY_META[place.category];
      L.marker([place.lat, place.lng], { icon: markerIcon(inside ? meta.color : '#AAB2C4', index) }).addTo(markersLayer);
    });
  }

  function savePlan() {
    localStorage.setItem(KTData.SHABBAT_PLAN_KEY, JSON.stringify({
      active: Boolean(hotel),
      radiusKm,
      hotel,
      cityId: selectedCityId
    }));
  }

  function skeletonCards() {
    return Array.from({ length: 4 }).map(() => '<div class="card skeleton"><div></div><div></div><div></div></div>').join('');
  }

  function markerIcon(color, index = 0) {
    return L.divIcon({ className: '', html: `<span class="pin" style="--pin:${color};--delay:${Math.min(index * 30, 300)}ms"></span>`, iconSize: [18, 18], iconAnchor: [9, 9] });
  }

  function hotelIcon() {
    return L.divIcon({ className: '', html: '<span class="hotel-pin"></span>', iconSize: [18, 18], iconAnchor: [9, 9] });
  }

  return { init };
})();
