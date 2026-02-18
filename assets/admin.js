(async function initAdmin() {
  const PASSCODE = 'KT2026';
  const entered = window.prompt('Enter admin passcode');
  const adminApp = document.getElementById('adminApp');
  const denied = document.getElementById('adminDenied');

  if (entered !== PASSCODE) {
    denied.classList.remove('hidden');
    return;
  }

  adminApp.classList.remove('hidden');

  const citySelect = KTUI.qs('#adminCitySelect');
  const placesList = KTUI.qs('#adminPlacesList');
  const form = KTUI.qs('#placeForm');
  const formTitle = KTUI.qs('#formTitle');
  const clearFormBtn = KTUI.qs('#clearFormBtn');
  const exportJsonBtn = KTUI.qs('#exportJsonBtn');
  const importJsonInput = KTUI.qs('#importJsonInput');
  const resetOverrideBtn = KTUI.qs('#resetOverrideBtn');

  const fields = {
    id: KTUI.qs('#placeId'),
    name: KTUI.qs('#name'),
    category: KTUI.qs('#category'),
    address: KTUI.qs('#address'),
    phone: KTUI.qs('#phone'),
    website: KTUI.qs('#website'),
    lat: KTUI.qs('#lat'),
    lng: KTUI.qs('#lng'),
    isVerified: KTUI.qs('#isVerified'),
    isFeatured: KTUI.qs('#isFeatured'),
    featuredRank: KTUI.qs('#featuredRank')
  };

  let cities = await KTData.fetchCities();
  let places = await KTData.getActivePlacesDataset();
  let selectedCity = cities[0]?.id;
  let miniMap;
  let miniMarker;

  citySelect.innerHTML = cities.map((city) => `<option value="${city.id}">${city.name}, ${city.country}</option>`).join('');
  citySelect.value = selectedCity;

  initMiniMap();
  renderPlacesList();

  citySelect.addEventListener('change', () => {
    selectedCity = citySelect.value;
    const city = cities.find((entry) => entry.id === selectedCity);
    miniMap.setView(city.center, city.zoom);
    renderPlacesList();
    clearForm();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const website = KTUI.normalizeWebsite(fields.website.value);
    const payload = {
      id: fields.id.value || createId(selectedCity),
      cityId: selectedCity,
      name: fields.name.value.trim(),
      category: fields.category.value,
      address: fields.address.value.trim(),
      phone: fields.phone.value.trim(),
      website,
      lat: Number(fields.lat.value),
      lng: Number(fields.lng.value),
      isVerified: fields.isVerified.checked,
      isFeatured: fields.isFeatured.checked,
      featuredRank: fields.featuredRank.value ? Number(fields.featuredRank.value) : null
    };

    if (!website && fields.website.value.trim()) {
      KTUI.toast('Website invalid or placeholder. Saved as empty.', 'warning');
    }

    const existingIndex = places.findIndex((place) => place.id === payload.id);
    if (existingIndex >= 0) places[existingIndex] = payload;
    else places.push(payload);

    persist();
    renderPlacesList();
    clearForm();
    KTUI.toast('Saved to local override.', 'success');
  });

  clearFormBtn.addEventListener('click', clearForm);

  exportJsonBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(places, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'places.override.json';
    link.click();
    URL.revokeObjectURL(url);
  });

  importJsonInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      window.alert('Imported file must contain a JSON array.');
      return;
    }
    places = parsed.map((place) => ({
      ...place,
      website: KTUI.normalizeWebsite(place.website)
    }));
    persist();
    renderPlacesList();
    clearForm();
    KTUI.toast('Imported JSON and saved to override.', 'success');
    event.target.value = '';
  });

  resetOverrideBtn.addEventListener('click', async () => {
    KTData.storage.remove(KTData.KEYS.placesOverride);
    places = await KTData.fetchPlaces();
    places = places.map((place) => ({ ...place, website: KTUI.normalizeWebsite(place.website) }));
    renderPlacesList();
    clearForm();
    KTUI.toast('Override reset. Using default dataset.', 'success');
  });

  function initMiniMap() {
    const city = cities.find((entry) => entry.id === selectedCity);
    miniMap = L.map('miniMap').setView(city.center, city.zoom);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(miniMap);

    miniMap.on('click', (event) => {
      fields.lat.value = event.latlng.lat.toFixed(6);
      fields.lng.value = event.latlng.lng.toFixed(6);
      if (miniMarker) miniMap.removeLayer(miniMarker);
      miniMarker = L.marker(event.latlng).addTo(miniMap);
    });
  }

  function renderPlacesList() {
    const cityPlaces = KTData.sortPlaces(places.filter((place) => place.cityId === selectedCity));
    if (!cityPlaces.length) {
      placesList.innerHTML = '<p class="empty-state">No places for this city yet.</p>';
      return;
    }

    placesList.innerHTML = cityPlaces.map((place) => `
      <article class="admin-place-item">
        <div>
          <strong>${place.name}</strong>
          <p class="muted">${KTUI.categoryLabel(place.category)} • ${place.address}</p>
        </div>
        <div class="card-actions">
          <button class="btn btn-subtle" data-edit="${place.id}">Edit</button>
          <button class="btn btn-ghost" data-delete="${place.id}">Delete</button>
        </div>
      </article>`).join('');

    KTUI.qsa('[data-edit]', placesList).forEach((button) => {
      button.addEventListener('click', () => editPlace(button.dataset.edit));
    });

    KTUI.qsa('[data-delete]', placesList).forEach((button) => {
      button.addEventListener('click', () => deletePlace(button.dataset.delete));
    });
  }

  function editPlace(id) {
    const place = places.find((entry) => entry.id === id);
    if (!place) return;

    fields.id.value = place.id;
    fields.name.value = place.name;
    fields.category.value = place.category;
    fields.address.value = place.address;
    fields.phone.value = place.phone || '';
    fields.website.value = place.website || '';
    fields.lat.value = place.lat;
    fields.lng.value = place.lng;
    fields.isVerified.checked = Boolean(place.isVerified);
    fields.isFeatured.checked = Boolean(place.isFeatured);
    fields.featuredRank.value = place.featuredRank ?? '';
    formTitle.textContent = `Edit place: ${place.name}`;

    miniMap.setView([place.lat, place.lng], 14);
    if (miniMarker) miniMap.removeLayer(miniMarker);
    miniMarker = L.marker([place.lat, place.lng]).addTo(miniMap);
  }

  function deletePlace(id) {
    if (!window.confirm('Delete this place?')) return;
    places = places.filter((place) => place.id !== id);
    persist();
    renderPlacesList();
    clearForm();
  }

  function clearForm() {
    form.reset();
    fields.id.value = '';
    formTitle.textContent = 'Add new place';
  }

  function persist() {
    KTData.storage.set(KTData.KEYS.placesOverride, places);
  }

  function createId(cityId) {
    const count = places.filter((place) => place.cityId === cityId).length + 1;
    return `${cityId.slice(0, 3)}-${String(count).padStart(3, '0')}`;
  }
})();
