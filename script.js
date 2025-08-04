class MiddlePointFinder {
    constructor() {
        this.map = null;
        this.markers = [];
        this.location1 = null;
        this.location2 = null;
        this.midpoint = null;
        this.selectedStation = null;
        this.nearbyStations = [];
        this.isFullscreen = false;
        this.currentResults = [];
        this.sortMode = 'distance';
        this.inputTimers = {};
        this.snackbarTimeout = null;
        this.init();
    }

    init() {
        this.initMap();
        this.bindEvents();
    }

    initMap() {
        this.map = L.map('map').setView([35.6762, 139.6503], 10);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.map.on('click', (e) => {
            this.handleMapClick(e);
        });
    }

    bindEvents() {
        document.getElementById('search-location1').addEventListener('click', () => {
            const address = document.getElementById('location1').value;
            this.geocodeAddress(address, 1);
        });

        document.getElementById('search-location2').addEventListener('click', () => {
            const address = document.getElementById('location2').value;
            this.geocodeAddress(address, 2);
        });

        document.getElementById('get-location1').addEventListener('click', () => {
            this.getCurrentLocation(1);
        });

        document.getElementById('get-location2').addEventListener('click', () => {
            this.getCurrentLocation(2);
        });

        document.getElementById('search-btn').addEventListener('click', () => {
            this.findMiddlePoint();
        });

        document.getElementById('location1').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.geocodeAddress(e.target.value, 1);
            }
        });

        document.getElementById('location2').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.geocodeAddress(e.target.value, 2);
            }
        });

        // Input change detection for snackbar
        const location1Input = document.getElementById('location1');
        const location2Input = document.getElementById('location2');
        
        console.log('Setting up input listeners:', location1Input, location2Input);
        
        location1Input.addEventListener('input', (e) => {
            console.log('Location1 input event fired');
            this.handleInputChange(e.target.value, 1);
        });

        location2Input.addEventListener('input', (e) => {
            console.log('Location2 input event fired');
            this.handleInputChange(e.target.value, 2);
        });

        document.getElementById('category-filter').addEventListener('change', () => {
            if (this.selectedStation) {
                this.searchNearbyPlaces(this.selectedStation.lat, this.selectedStation.lng);
            }
        });

        // Sort controls
        document.getElementById('sort-distance').addEventListener('click', () => {
            this.setSortMode('distance');
        });

        document.getElementById('sort-name').addEventListener('click', () => {
            this.setSortMode('name');
        });

        // Map control events
        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        document.getElementById('locate-btn').addEventListener('click', () => {
            this.goToCurrentLocation();
        });

        document.getElementById('reset-view-btn').addEventListener('click', () => {
            this.resetMapView();
        });

        // Escape key to exit fullscreen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isFullscreen) {
                this.toggleFullscreen();
            }
        });

    }

    handleMapClick(e) {
        const input1 = document.getElementById('location1');
        const input2 = document.getElementById('location2');

        if (!this.location1 || (!input1.value && !this.location1)) {
            this.setLocation(1, e.latlng.lat, e.latlng.lng);
            this.reverseGeocode(e.latlng.lat, e.latlng.lng, 1);
        } else if (!this.location2 || (!input2.value && !this.location2)) {
            this.setLocation(2, e.latlng.lat, e.latlng.lng);
            this.reverseGeocode(e.latlng.lat, e.latlng.lng, 2);
        }
    }

    getCurrentLocation(locationNumber) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    this.setLocation(locationNumber, lat, lng);
                    this.reverseGeocode(lat, lng, locationNumber);
                },
                (error) => {
                    alert('位置情報の取得に失敗しました: ' + error.message);
                }
            );
        } else {
            alert('このブラウザでは位置情報がサポートされていません');
        }
    }

    async geocodeAddress(address, locationNumber) {
        if (!address.trim()) return;

        // Clear input timer and hide snackbar when search is executed
        if (this.inputTimers[locationNumber]) {
            clearTimeout(this.inputTimers[locationNumber]);
            delete this.inputTimers[locationNumber];
        }
        this.hideSnackbar();

        console.log(`Geocoding address: "${address}" for location ${locationNumber}`);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
            );
            const data = await response.json();

            console.log('Geocoding response:', data);

            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                console.log(`Setting location ${locationNumber} to:`, lat, lng);
                this.setLocation(locationNumber, lat, lng);
            } else {
                alert('住所が見つかりませんでした');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            alert('住所の検索中にエラーが発生しました');
        }
    }

    async reverseGeocode(lat, lng, locationNumber) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();

            if (data.display_name) {
                document.getElementById(`location${locationNumber}`).value = data.display_name;
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
        }
    }

    setLocation(locationNumber, lat, lng) {
        const location = { lat, lng };
        
        console.log(`setLocation called: location${locationNumber} = {lat: ${lat}, lng: ${lng}}`);
        
        if (locationNumber === 1) {
            this.location1 = location;
            this.updateMarker(1, lat, lng, '場所1');
            console.log('location1 set to:', this.location1);
        } else {
            this.location2 = location;
            this.updateMarker(2, lat, lng, '場所2');
            console.log('location2 set to:', this.location2);
        }

        console.log('Current state - location1:', this.location1, 'location2:', this.location2);

        if (this.location1 && this.location2) {
            console.log('Both locations set, calculating middle point');
            this.calculateAndShowMiddlePoint();
        }
    }

    updateMarker(locationNumber, lat, lng, title) {
        this.clearMarker(locationNumber);

        const color = locationNumber === 1 ? 'blue' : 'red';
        const marker = L.marker([lat, lng]).addTo(this.map);
        marker.bindPopup(title).openPopup();
        
        this.markers[locationNumber] = marker;
        this.map.setView([lat, lng], 13);
    }

    clearMarker(locationNumber) {
        if (this.markers[locationNumber]) {
            this.map.removeLayer(this.markers[locationNumber]);
        }
    }

    calculateAndShowMiddlePoint() {
        if (!this.location1 || !this.location2) return;

        const midLat = (this.location1.lat + this.location2.lat) / 2;
        const midLng = (this.location1.lng + this.location2.lng) / 2;
        
        this.midpoint = { lat: midLat, lng: midLng };

        this.clearMarker('midpoint');
        const midMarker = L.marker([midLat, midLng], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(this.map);
        
        midMarker.bindPopup('中間地点').openPopup();
        this.markers['midpoint'] = midMarker;

        const bounds = L.latLngBounds([
            [this.location1.lat, this.location1.lng],
            [this.location2.lat, this.location2.lng],
            [midLat, midLng]
        ]);
        this.map.fitBounds(bounds, { padding: [20, 20] });
    }

    findMiddlePoint() {
        console.log('findMiddlePoint called');
        console.log('location1:', this.location1);
        console.log('location2:', this.location2);
        
        if (!this.location1 || !this.location2) {
            alert('両方の場所を指定してください');
            return;
        }

        this.calculateAndShowMiddlePoint();
        this.searchNearbyStations();
    }

    async searchNearbyStations() {
        if (!this.midpoint) return;

        const stationsDiv = document.getElementById('stations-list');
        stationsDiv.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <span>駅を検索中...</span>
            </div>
        `;

        // Show skeleton loading for stations
        this.showStationSkeleton();

        try {
            const overpassQuery = this.buildStationQuery(this.midpoint.lat, this.midpoint.lng);
            
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: overpassQuery
            });

            const data = await response.json();
            this.nearbyStations = data.elements.filter(station => station.tags && station.tags.name);
            
            // Add a small delay for better UX
            setTimeout(() => {
                this.displayStations(this.nearbyStations);
            }, 500);

        } catch (error) {
            console.error('Station search error:', error);
            stationsDiv.innerHTML = `
                <div class="loading">
                    <span>駅の検索中にエラーが発生しました</span>
                </div>
            `;
        }
    }

    showStationSkeleton() {
        const stationsDiv = document.getElementById('stations-list');
        let skeletonHTML = '';
        
        for (let i = 0; i < 5; i++) {
            skeletonHTML += `
                <div class="skeleton-item">
                    <div class="skeleton-line title skeleton"></div>
                    <div class="skeleton-line subtitle skeleton"></div>
                </div>
            `;
        }
        
        setTimeout(() => {
            if (stationsDiv.innerHTML.includes('spinner')) {
                stationsDiv.innerHTML = skeletonHTML;
            }
        }, 800);
    }

    async searchNearbyPlaces(lat = null, lng = null) {
        const searchLat = lat || this.midpoint?.lat;
        const searchLng = lng || this.midpoint?.lng;
        
        if (!searchLat || !searchLng) return;

        const resultsDiv = document.getElementById('results-list');
        resultsDiv.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <span>レストランを検索中...</span>
            </div>
        `;

        // Show skeleton loading for results
        this.showResultsSkeleton();

        try {
            const category = document.getElementById('category-filter').value || 'restaurant';
            const overpassQuery = this.buildOverpassQuery(searchLat, searchLng, category);
            
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: overpassQuery
            });

            const data = await response.json();
            
            // Add a small delay for better UX
            setTimeout(() => {
                this.displayResults(data.elements, searchLat, searchLng);
            }, 500);

        } catch (error) {
            console.error('Search error:', error);
            resultsDiv.innerHTML = `
                <div class="loading">
                    <span>検索中にエラーが発生しました</span>
                </div>
            `;
        }
    }

    showResultsSkeleton() {
        const resultsDiv = document.getElementById('results-list');
        let skeletonHTML = '';
        
        for (let i = 0; i < 6; i++) {
            skeletonHTML += `
                <div class="skeleton-item">
                    <div class="skeleton-line title skeleton"></div>
                    <div class="skeleton-line content skeleton"></div>
                    <div class="skeleton-line content skeleton"></div>
                    <div class="skeleton-line subtitle skeleton"></div>
                </div>
            `;
        }
        
        setTimeout(() => {
            if (resultsDiv.innerHTML.includes('spinner')) {
                resultsDiv.innerHTML = skeletonHTML;
            }
        }, 800);
    }

    buildOverpassQuery(lat, lng, category) {
        const radius = 1000; // 1km radius
        let amenityTypes = ['restaurant', 'cafe', 'fast_food'];
        
        if (category && category !== '') {
            amenityTypes = [category];
        }

        const amenityFilter = amenityTypes.map(type => `["amenity"="${type}"]`).join('');
        
        return `
            [out:json][timeout:25];
            (
                node["amenity"~"^(${amenityTypes.join('|')})$"](around:${radius},${lat},${lng});
                way["amenity"~"^(${amenityTypes.join('|')})$"](around:${radius},${lat},${lng});
                relation["amenity"~"^(${amenityTypes.join('|')})$"](around:${radius},${lat},${lng});
            );
            out geom;
        `;
    }

    buildStationQuery(lat, lng) {
        const radius = 3000; // 3km radius for stations
        
        return `
            [out:json][timeout:25];
            (
                node["railway"="station"](around:${radius},${lat},${lng});
                node["public_transport"="station"]["railway"](around:${radius},${lat},${lng});
            );
            out geom;
        `;
    }

    displayStations(stations) {
        const stationsDiv = document.getElementById('stations-list');
        const stationsSection = document.getElementById('stations-section');
        
        if (stations.length === 0) {
            stationsDiv.innerHTML = '<div class="loading">近くに駅が見つかりませんでした</div>';
            stationsSection.style.display = 'block';
            return;
        }

        // Calculate distances and sort
        const stationsWithDistance = stations.map(station => {
            const distance = this.calculateDistance(
                this.midpoint.lat, this.midpoint.lng,
                station.lat, station.lon
            );
            return { ...station, distance };
        }).sort((a, b) => a.distance - b.distance);

        stationsDiv.innerHTML = stationsWithDistance.slice(0, 10).map((station, index) => `
            <div class="station-item fade-in" style="animation-delay: ${index * 0.1}s" onclick="app.selectStation(${station.lat}, ${station.lon}, '${station.tags.name}', this)">
                <div class="station-info">
                    <h3>${station.tags.name}</h3>
                    <p>${station.tags.operator || ''} ${station.tags.railway || ''}</p>
                </div>
                <div class="station-distance">${station.distance}m</div>
            </div>
        `).join('');

        stationsSection.style.display = 'block';
        
        // Add station markers to map
        this.addStationMarkers(stationsWithDistance.slice(0, 10));
    }

    selectStation(lat, lng, name, element) {
        // Remove previous selection
        document.querySelectorAll('.station-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add selection to clicked item
        element.classList.add('selected');
        
        this.selectedStation = { lat, lng, name };
        
        // Update map view to station
        this.map.setView([lat, lng], 15);
        
        // Update results title
        document.getElementById('results-title').textContent = `${name}駅周辺の施設`;
        
        // Search for places around selected station
        this.searchNearbyPlaces(lat, lng);
    }

    addStationMarkers(stations) {
        // Clear existing station markers
        this.clearStationMarkers();
        
        stations.forEach(station => {
            const marker = L.marker([station.lat, station.lon], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(this.map);
            
            marker.bindPopup(`${station.tags.name}駅`);
            
            if (!this.markers.stations) {
                this.markers.stations = [];
            }
            this.markers.stations.push(marker);
        });
    }

    clearStationMarkers() {
        if (this.markers.stations) {
            this.markers.stations.forEach(marker => {
                this.map.removeLayer(marker);
            });
            this.markers.stations = [];
        }
    }

    displayResults(places, searchLat, searchLng) {
        const resultsDiv = document.getElementById('results-list');
        const countDiv = document.getElementById('results-count');
        
        if (places.length === 0) {
            resultsDiv.innerHTML = '<div class="loading">近くにレストランが見つかりませんでした</div>';
            countDiv.textContent = '';
            return;
        }

        const validPlaces = places.filter(place => place.tags && place.tags.name);
        
        // Add distance to each place and store for sorting
        this.currentResults = validPlaces.map(place => {
            const distance = this.calculateDistance(
                searchLat, searchLng,
                place.lat || place.center.lat, place.lon || place.center.lon
            );
            return { ...place, distance, searchLat, searchLng };
        });

        this.renderResults();
    }

    renderResults() {
        const resultsDiv = document.getElementById('results-list');
        const countDiv = document.getElementById('results-count');
        
        if (this.currentResults.length === 0) return;

        // Sort results
        let sortedResults = [...this.currentResults];
        if (this.sortMode === 'distance') {
            sortedResults.sort((a, b) => a.distance - b.distance);
        } else if (this.sortMode === 'name') {
            sortedResults.sort((a, b) => a.tags.name.localeCompare(b.tags.name));
        }

        countDiv.textContent = `${sortedResults.length} 件の結果`;

        resultsDiv.innerHTML = sortedResults.slice(0, 20).map((place, index) => `
            <div class="result-item fade-in" style="animation-delay: ${index * 0.05}s" onclick="app.showPlaceOnMap(${place.lat || place.center.lat}, ${place.lon || place.center.lon}, '${place.tags.name}')">
                <h3>${place.tags.name}</h3>
                <p><strong>カテゴリ:</strong> <span class="category-badge">${this.getCategoryName(place.tags.amenity)}</span></p>
                <p><strong>距離:</strong> <span class="distance-badge">${place.distance}m</span></p>
                ${place.tags.cuisine ? `<p><strong>料理:</strong> ${place.tags.cuisine}</p>` : ''}
                ${place.tags.phone ? `<p><strong>電話:</strong> ${place.tags.phone}</p>` : ''}
                ${place.tags.website ? `<p><strong>Website:</strong> <a href="${place.tags.website}" target="_blank">リンク</a></p>` : ''}
            </div>
        `).join('');
    }

    setSortMode(mode) {
        this.sortMode = mode;
        
        // Update active sort button
        document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`sort-${mode}`).classList.add('active');
        
        // Re-render results with new sort
        this.renderResults();
    }

    getCategoryName(amenity) {
        const names = {
            'restaurant': 'レストラン',
            'cafe': 'カフェ',
            'fast_food': 'ファストフード',
            'bar': 'バー',
            'pub': 'パブ'
        };
        return names[amenity] || amenity;
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lng2-lng1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return Math.round(R * c);
    }

    showPlaceOnMap(lat, lng, name) {
        this.map.setView([lat, lng], 16);
        L.popup()
            .setLatLng([lat, lng])
            .setContent(name)
            .openOn(this.map);
    }

    toggleFullscreen() {
        const mapContainer = document.getElementById('map-container');
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        
        if (!this.isFullscreen) {
            mapContainer.classList.add('fullscreen-map');
            fullscreenBtn.textContent = '✕';
            fullscreenBtn.title = 'フルスクリーン終了';
            this.isFullscreen = true;
        } else {
            mapContainer.classList.remove('fullscreen-map');
            fullscreenBtn.textContent = '⛶';
            fullscreenBtn.title = 'フルスクリーン';
            this.isFullscreen = false;
        }
        
        // Resize map after fullscreen toggle
        setTimeout(() => {
            this.map.invalidateSize();
        }, 100);
    }

    goToCurrentLocation() {
        if (navigator.geolocation) {
            const locateBtn = document.getElementById('locate-btn');
            locateBtn.classList.add('pulse');
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    this.map.setView([lat, lng], 15);
                    
                    L.popup()
                        .setLatLng([lat, lng])
                        .setContent('現在地')
                        .openOn(this.map);
                    
                    locateBtn.classList.remove('pulse');
                },
                (error) => {
                    alert('位置情報の取得に失敗しました: ' + error.message);
                    locateBtn.classList.remove('pulse');
                }
            );
        } else {
            alert('このブラウザでは位置情報がサポートされていません');
        }
    }

    resetMapView() {
        if (this.location1 && this.location2 && this.midpoint) {
            const bounds = L.latLngBounds([
                [this.location1.lat, this.location1.lng],
                [this.location2.lat, this.location2.lng],
                [this.midpoint.lat, this.midpoint.lng]
            ]);
            this.map.fitBounds(bounds, { padding: [20, 20] });
        } else {
            this.map.setView([35.6762, 139.6503], 10);
        }
    }

    handleInputChange(value, locationNumber) {
        console.log(`Input change detected: location${locationNumber}, value: "${value}"`);
        
        // Clear existing timer for this location
        if (this.inputTimers[locationNumber]) {
            clearTimeout(this.inputTimers[locationNumber]);
            console.log(`Cleared existing timer for location${locationNumber}`);
        }

        // Hide existing snackbar
        this.hideSnackbar();

        // If input has content, set timer for snackbar
        if (value.trim().length > 1) {
            console.log(`Setting timer for location${locationNumber}, value length: ${value.trim().length}`);
            this.inputTimers[locationNumber] = setTimeout(() => {
                console.log(`Timer fired for location${locationNumber}, showing snackbar`);
                this.showSnackbar(`検索ボタンを押下してください`, locationNumber);
            }, 2000); // Show after 2 seconds
        }
    }

    showSnackbar(message, locationNumber) {
        console.log(`showSnackbar called with message: "${message}", locationNumber: ${locationNumber}`);
        
        // Remove existing snackbar if any
        const existingSnackbar = document.querySelector('.snackbar');
        if (existingSnackbar) {
            console.log('Removing existing snackbar');
            existingSnackbar.remove();
        }

        // Create snackbar element
        const snackbar = document.createElement('div');
        snackbar.className = 'snackbar';
        snackbar.innerHTML = `
            <span class="snackbar-icon">🔍</span>
            <span>${message}</span>
            <button class="snackbar-close">&times;</button>
        `;

        console.log('Created snackbar element:', snackbar);

        // Add to body
        document.body.appendChild(snackbar);
        console.log('Added snackbar to body');

        // Show with animation
        setTimeout(() => {
            console.log('Adding show class to snackbar');
            snackbar.classList.add('show');
        }, 100);

        // Auto hide after 5 seconds
        this.snackbarTimeout = setTimeout(() => {
            console.log('Auto-hiding snackbar after 5 seconds');
            this.hideSnackbar();
        }, 5000);

        // Add click handler for close button
        const closeBtn = snackbar.querySelector('.snackbar-close');
        closeBtn.addEventListener('click', () => {
            console.log('Close button clicked');
            this.hideSnackbar();
        });

        // Add click handler to search button mention
        snackbar.addEventListener('click', (e) => {
            if (e.target.classList.contains('snackbar-close')) return;
            
            console.log('Snackbar clicked, highlighting search button');
            // Highlight the corresponding search button
            const searchBtn = document.getElementById(`search-location${locationNumber}`);
            if (searchBtn) {
                searchBtn.style.animation = 'pulse 0.6s ease-in-out 2';
                setTimeout(() => {
                    searchBtn.style.animation = '';
                }, 1200);
            }
        });
    }

    hideSnackbar() {
        const snackbar = document.querySelector('.snackbar');
        if (snackbar) {
            snackbar.classList.remove('show');
            snackbar.classList.add('hide');
            setTimeout(() => {
                if (snackbar.parentNode) {
                    snackbar.remove();
                }
            }, 400);
        }

        if (this.snackbarTimeout) {
            clearTimeout(this.snackbarTimeout);
            this.snackbarTimeout = null;
        }
    }
}

const app = new MiddlePointFinder();