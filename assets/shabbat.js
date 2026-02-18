window.KTShabbat = (() => {
  const CATEGORY_META = {
    restaurant: { label: 'Restaurant', icon: '🍽️', color: '#4869b8' },
    grocery: { label: 'Grocery', icon: '🛒', color: '#4f8b7a' },
    chabad: { label: 'Chabad', icon: '🕍', color: '#8d6bb5' },
    mikveh: { label: 'Mikveh', icon: '💧', color: '#3f8ea8' }
  };

  async function initShabbat() {
    const citySelect = KTUI.qs('#shabbatCitySelect');
    const setOriginBtn = KTUI.qs('#setOriginBtn');
    const radiusSlider = KTUI.qs('#radiusSlider');
    const radiusValue = KTUI.qs('#radiusValue');
    const exportBtn = KTUI.qs('#exportShabbatBtn');
    const results = KTUI.qs('#shabbatResults');
    const summary = KTUI.qs('#shabbatSummary');

    let cities = [];
    let places = [];
    let selectedCity = '';
    let origin = null;
    let pickingOrigin = false;
    let map;
    let markersLayer;
    let originMarker;
    let originCircle;
    let currentList = [];

    try {
      [cities, places] = await Promise.all([
        KTData.fetchCities(),
        KTData.getActivePlacesDataset()
      ]);

      selectedCity = restoreCity(cities);
      citySelect.innerHTML = cities.map((city) => `<option value="${city.id}">${city.name}, ${city.country}</option>`).join('');
      citySelect.value = selectedCity;
      KTData.storage.set(KTData.KEYS.city, selectedCity);

      map = L.map('shabbatMap');
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(map);
      markersLayer = L.layerGroup().addTo(map);

      citySelect.addEventListener('change', () => {
        selectedCity = citySelect.value;
        KTData.storage.set(KTData.KEYS.city, selectedCity);
        clearOrigin();
        render();
      });

      setOriginBtn.addEventListener('click', () => {
        pickingOrigin = true;
        setOriginBtn.textContent = 'Click on map to set hotel';
      });

      radiusSlider.addEventListener('input', () => {
        radiusValue.textContent = `${Number(radiusSlider.value).toFixed(1)} km`;
        if (origin) drawOriginOverlay();
        render();
      });

      map.on('click', (event) => {
        if (!pickingOrigin) return;
        pickingOrigin = false;
        setOriginBtn.textContent = 'Set Hotel Location';
        origin = { lat: event.latlng.lat, lng: event.latlng.lng };
        drawOriginOverlay();
        render();
      });

      exportBtn.addEventListener('click', async () => {
        if (!currentList.length) {
          KTUI.toast('No places to export yet.', 'warning');
          return;
        }
        const lines = currentList.map((place) => `- ${place.name} (${KTUI.categoryLabel(place.category)}) — ${KTUI.formatDistance(place.distanceKm)}`);
        const payload = [`Shabbat list for ${getCity().name}`, ...lines].join('\n');
        try {
          await navigator.clipboard.writeText(payload);
          KTUI.toast('Shabbat list copied to clipboard.', 'success');
        } catch (_error) {
          KTUI.toast('Clipboard unavailable in this browser.', 'warning');
        }
      });

      radiusValue.textContent = `${Number(radiusSlider.value).toFixed(1)} km`;
      render();
    } catch (error) {
      console.error(error);
      results.innerHTML = '<p class="empty-state">Unable to load Shabbat planner data.</p>';
    }

    function render() {
      const city = getCity();
      map.setView(city.center, city.zoom);
      let list = places.filter((place) => place.cityId === city.id).map((place) => {
        const distanceKm = origin ? KTData.haversineDistanceKm(origin.lat, origin.lng, place.lat, place.lng) : null;
        return { ...place, distanceKm };
      });

      if (origin) {
        const radius = Number(radiusSlider.value);
        list = list.filter((place) => place.distanceKm != null && place.distanceKm <= radius);
      }

      list = KTData.sortPlaces(list);
      currentList = list;
      summary.textContent = origin
        ? `${list.length} walkable places within ${Number(radiusSlider.value).toFixed(1)} km`
        : 'Set hotel location to apply walkable radius';

      renderCards(list);
      renderMarkers(list);
    }

    function renderCards(list) {
      if (!list.length) {
        results.innerHTML = '<p class="empty-state">No places in current Shabbat radius.</p>';
        return;
      }

      results.innerHTML = list.map((place) => {
        const meta = CATEGORY_META[place.category] || CATEGORY_META.restaurant;
        return `
        <article class="place-card shabbat-card">
          <div class="place-pill-row">
            ${place.isFeatured ? '<span class="pill featured">Featured</span>' : ''}
            ${place.isVerified ? '<span class="pill verified">✓ Verified</span>' : ''}
          </div>
          <h3>${place.name}</h3>
          <p class="muted">${place.address}</p>
          <p class="muted">${meta.icon} ${meta.label}</p>
          <p class="distance">${place.distanceKm == null ? 'Distance pending' : `${KTUI.formatDistance(place.distanceKm)} walk`}</p>
          <div class="card-actions">
            <a class="btn btn-primary" href="${KTData.getDirectionsUrl(place, origin)}" target="_blank" rel="noopener noreferrer">Walking Directions</a>
          </div>
        </article>`;
      }).join('');
    }

    function renderMarkers(list) {
      markersLayer.clearLayers();
      list.forEach((place) => {
        const meta = CATEGORY_META[place.category] || CATEGORY_META.restaurant;
        const marker = L.marker([place.lat, place.lng], {
          icon: markerIcon(meta.color, place.isFeatured)
        });
        marker.bindPopup(`<strong>${place.name}</strong><br>${KTUI.formatDistance(place.distanceKm)} from hotel`);
        marker.addTo(markersLayer);
      });
    }

    function drawOriginOverlay() {
      if (originMarker) map.removeLayer(originMarker);
      if (originCircle) map.removeLayer(originCircle);
      if (!origin) return;

      originMarker = L.marker([origin.lat, origin.lng], {
        icon: L.divIcon({ className: '', html: '<span class="hotel-pin"></span>', iconSize: [24, 24], iconAnchor: [12, 12] })
      }).addTo(map);

      originCircle = L.circle([origin.lat, origin.lng], {
        radius: Number(radiusSlider.value) * 1000,
        color: '#c9a460',
        weight: 1.8,
        fillColor: '#e6d2ad',
        fillOpacity: 0.2
      }).addTo(map);
      map.panTo([origin.lat, origin.lng]);
    }

    function clearOrigin() {
      origin = null;
      if (originMarker) map.removeLayer(originMarker);
      if (originCircle) map.removeLayer(originCircle);
      setOriginBtn.textContent = 'Set Hotel Location';
    }

    function getCity() {
      return cities.find((entry) => entry.id === selectedCity) || cities[0];
    }
  }

  function restoreCity(cities) {
    const query = new URLSearchParams(window.location.search).get('city');
    const saved = KTData.storage.get(KTData.KEYS.city, '');
    const candidate = query || saved || cities[0]?.id;
    return cities.some((city) => city.id === candidate) ? candidate : cities[0]?.id;
  }

  function markerIcon(color, featured) {
    return L.divIcon({
      className: '',
      html: `<span class="map-pin${featured ? ' is-featured' : ''}" style="--pin:${color}"></span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -10]
    });
  }

  return { initShabbat };
})();
