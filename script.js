class MiddlePointFinder {
    constructor() {
        this.map = null;
        this.markers = [];
        this.location1 = null;
        this.location2 = null;
        this.midpoint = null;
        this.selectedStation = null;
        this.nearbyStations = [];
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

        document.getElementById('category-filter').addEventListener('change', () => {
            if (this.selectedStation) {
                this.searchNearbyPlaces(this.selectedStation.lat, this.selectedStation.lng);
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
        stationsDiv.innerHTML = '<div class="loading">駅を検索中...</div>';

        try {
            const overpassQuery = this.buildStationQuery(this.midpoint.lat, this.midpoint.lng);
            
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: overpassQuery
            });

            const data = await response.json();
            this.nearbyStations = data.elements.filter(station => station.tags && station.tags.name);
            this.displayStations(this.nearbyStations);

        } catch (error) {
            console.error('Station search error:', error);
            stationsDiv.innerHTML = '<div class="loading">駅の検索中にエラーが発生しました</div>';
        }
    }

    async searchNearbyPlaces(lat = null, lng = null) {
        const searchLat = lat || this.midpoint?.lat;
        const searchLng = lng || this.midpoint?.lng;
        
        if (!searchLat || !searchLng) return;

        const resultsDiv = document.getElementById('results-list');
        resultsDiv.innerHTML = '<div class="loading">レストランを検索中...</div>';

        try {
            const category = document.getElementById('category-filter').value || 'restaurant';
            const overpassQuery = this.buildOverpassQuery(searchLat, searchLng, category);
            
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: overpassQuery
            });

            const data = await response.json();
            this.displayResults(data.elements, searchLat, searchLng);

        } catch (error) {
            console.error('Search error:', error);
            resultsDiv.innerHTML = '<div class="loading">検索中にエラーが発生しました</div>';
        }
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

        stationsDiv.innerHTML = stationsWithDistance.slice(0, 10).map(station => `
            <div class="station-item" onclick="app.selectStation(${station.lat}, ${station.lon}, '${station.tags.name}', this)">
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
        
        if (places.length === 0) {
            resultsDiv.innerHTML = '<div class="loading">近くにレストランが見つかりませんでした</div>';
            return;
        }

        const validPlaces = places.filter(place => place.tags && place.tags.name);
        
        resultsDiv.innerHTML = validPlaces.slice(0, 20).map(place => {
            const distance = this.calculateDistance(
                searchLat, searchLng,
                place.lat || place.center.lat, place.lon || place.center.lon
            );

            return `
                <div class="result-item" onclick="app.showPlaceOnMap(${place.lat || place.center.lat}, ${place.lon || place.center.lon}, '${place.tags.name}')">
                    <h3>${place.tags.name}</h3>
                    <p><strong>カテゴリ:</strong> ${this.getCategoryName(place.tags.amenity)}</p>
                    <p><strong>距離:</strong> ${distance}m</p>
                    ${place.tags.cuisine ? `<p><strong>料理:</strong> ${place.tags.cuisine}</p>` : ''}
                    ${place.tags.phone ? `<p><strong>電話:</strong> ${place.tags.phone}</p>` : ''}
                    ${place.tags.website ? `<p><strong>Website:</strong> <a href="${place.tags.website}" target="_blank">リンク</a></p>` : ''}
                </div>
            `;
        }).join('');
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
}

const app = new MiddlePointFinder();