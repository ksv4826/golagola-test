document.addEventListener('DOMContentLoaded', () => {
    const KMA_API_KEY = "1Xr7wYsVs3ubJCJJDYKqt46oaGQ8c0gktM2uj837bBuH1xG41u9op6v8kMGy2y3xYnYpAQDt+b+HJykqFlfl0g==";
    // 'locations' 변수는 locations_data.js 에서 전역으로 제공됩니다.

    // ▼▼▼▼▼▼▼▼▼▼ 1. 디바운스 헬퍼 함수 추가 ▼▼▼▼▼▼▼▼▼▼
    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }
    // ▲▲▲▲▲▲▲▲▲▲ 디바운스 헬퍼 함수 끝 ▲▲▲▲▲▲▲▲▲▲

    const RE = 6371.00877; const GRID = 5.0; const SLAT1 = 30.0; const SLAT2 = 60.0;
    const OLON = 126.0; const OLAT = 38.0; const XO = 43; const YO = 136;

    const searchInput = document.getElementById('searchInput');
    const locationSelect = document.getElementById('locationSelect');
    const weatherResultDiv = document.getElementById('weatherResult');
    const getWeatherButton = document.getElementById('getWeatherButton');

    function dfs_xy_conv(code, v1, v2) {
        const DEGRAD = Math.PI / 180.0;
        const RADDEG = 180.0 / Math.PI;
        const re = RE / GRID;
        const slat1 = SLAT1 * DEGRAD;
        const slat2 = SLAT2 * DEGRAD;
        const olon = OLON * DEGRAD;
        const olat = OLAT * DEGRAD;
        let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
        sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
        let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
        sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
        let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
        ro = re * sf / Math.pow(ro, sn);
        const rs = {};
        if (code === "toXY") {
            rs['lat'] = v1; rs['lon'] = v2;
            let ra = Math.tan(Math.PI * 0.25 + (v1) * DEGRAD * 0.5);
            ra = re * sf / Math.pow(ra, sn);
            let theta = v2 * DEGRAD - olon;
            if (theta > Math.PI) theta -= 2.0 * Math.PI;
            if (theta < -Math.PI) theta += 2.0 * Math.PI;
            theta *= sn;
            rs['x'] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
            rs['y'] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
        } else if (code === "toLL") {
            rs['x'] = v1; rs['y'] = v2;
            const xn = v1 - XO; const yn = ro - v2 + YO;
            let ra = Math.sqrt(xn * xn + yn * yn);
            if (sn < 0.0) ra = -ra;
            let alat = Math.pow((re * sf / ra), (1.0 / sn));
            alat = 2.0 * Math.atan(alat) - Math.PI * 0.5;
            let theta;
            if (Math.abs(xn) <= 0.0) { theta = 0.0; }
            else {
                if (Math.abs(yn) <= 0.0) {
                    theta = Math.PI * 0.5;
                    if (xn < 0.0) theta = -theta;
                } else theta = Math.atan2(xn, yn);
            }
            const alon = theta / sn + olon;
            rs['lat'] = alat * RADDEG; rs['lon'] = alon * RADDEG;
        } else { return undefined; }
        return rs;
    }

    function findClosestLocation(latitude, longitude, locs) {
        if (!locs || locs.length === 0) return null;
        let closest = null; let minDistance = Infinity;
        for (const location of locs) {
            if (typeof location.lat !== 'number' || typeof location.lon !== 'number') continue;
            const R = 6371; const dLat = (location.lat - latitude) * Math.PI / 180;
            const dLon = (location.lon - longitude) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(latitude * Math.PI / 180) * Math.cos(location.lat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            if (distance < minDistance) { minDistance = distance; closest = location; }
        }
        return closest;
    }

    function populateLocationOptions(filteredLocations) {
        locationSelect.innerHTML = '';
        const defaultOptionValue = searchInput.value ? "검색된 지역 선택" : "지역 선택";
        if (!filteredLocations || filteredLocations.length === 0) {
            const option = document.createElement('option'); option.value = "";
            option.textContent = searchInput.value ? "검색 결과가 없습니다" : "지역 목록을 불러올 수 없거나 없습니다";
            locationSelect.appendChild(option); return;
        }
        const defaultOption = document.createElement('option'); defaultOption.value = "";
        defaultOption.textContent = defaultOptionValue; locationSelect.appendChild(defaultOption);
        filteredLocations.forEach(location => {
            const option = document.createElement('option'); option.value = location.name;
            option.textContent = location.name; option.dataset.lat = location.lat; option.dataset.lon = location.lon;
            locationSelect.appendChild(option);
        });
    }

    function createApiUrl(nx, ny) {
        const nowInstance = new Date();
        let baseDate = nowInstance.getFullYear().toString() + ("0" + (nowInstance.getMonth() + 1)).slice(-2) + ("0" + nowInstance.getDate()).slice(-2);
        let baseTime = ("0" + nowInstance.getHours()).slice(-2) + "00";
        if (nowInstance.getMinutes() < 45) {
            nowInstance.setHours(nowInstance.getHours() - 1);
            baseTime = ("0" + nowInstance.getHours()).slice(-2) + "00";
            baseDate = nowInstance.getFullYear().toString() + ("0" + (nowInstance.getMonth() + 1)).slice(-2) + ("0" + nowInstance.getDate()).slice(-2);
        }
        const encodedApiKey = encodeURIComponent(KMA_API_KEY);
        const serviceUrl = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst';
        return `${serviceUrl}?serviceKey=${encodedApiKey}&pageNo=1&numOfRows=100&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;
    }

    function displayWeather(weatherData, locationName) {
        if (!weatherData || !weatherData.response || !weatherData.response.body || !weatherData.response.body.items) {
            weatherResultDiv.innerHTML = `<p>'${locationName}'의 날씨 정보를 가져오는데 실패했습니다. (데이터 형식 오류)</p>`;
            return;
        }
        const items = weatherData.response.body.items.item;
        if (!items || items.length === 0) {
            weatherResultDiv.innerHTML = `<p>'${locationName}'의 날씨 정보가 없습니다.</p>`;
            return;
        }

        const firstFcstTime = items[0].fcstTime;
        const baseDateTime = `${items[0].baseDate.substring(4, 6)}/${items[0].baseDate.substring(6, 8)} ${items[0].baseTime.substring(0, 2)}:${items[0].baseTime.substring(2, 4)}`;

        let currentTemp = 'N/A', currentSky = 'N/A', currentRainType = 'N/A', currentWindSpeed = 'N/A', currentHumidity = 'N/A';
        items.filter(item => item.fcstTime === firstFcstTime).forEach(item => {
            if (item.category === 'T1H') currentTemp = item.fcstValue;
            if (item.category === 'SKY') currentSky = item.fcstValue;
            if (item.category === 'PTY') currentRainType = item.fcstValue;
            if (item.category === 'WSD') currentWindSpeed = item.fcstValue;
            if (item.category === 'REH') currentHumidity = item.fcstValue;
        });

        const skyState = { "1": "맑음 ☀️", "3": "구름많음 🌥️", "4": "흐림 ☁️" };
        const rainState = { "0": "없음", "1": "비 🌧️", "2": "비/눈 🌨️", "3": "눈 ❄️", "4": "소나기 🌦️", "5": "빗방울", "6": "빗방울/눈날림", "7": "눈날림" };
        
        let skyDescription = '정보 미확인';
        if (currentRainType !== '0' && currentRainType !== 'N/A') {
            skyDescription = rainState[currentRainType] || '정보 미확인';
        } else if (currentSky !== 'N/A') {
            skyDescription = skyState[currentSky] || '정보 미확인';
        }

        let weatherHtml = `
            <div class="current-weather-info">
                <h3>${locationName}</h3>
                <p class="reference-time">(현재 날씨 기준: ${baseDateTime})</p>
                <p class="temp">${currentTemp}°C</p>
                <p class="sky">${skyDescription}</p>
                <p class="details">
                    <span>💧 습도: ${currentHumidity}%</span> | <span>🌬️ 풍속: ${currentWindSpeed}m/s</span>
                </p>
            </div>
            <div class="hourly-forecast">
                <h4>시간별 예보</h4>
                <div class="hourly-forecast-items">`;

        const hourlyData = {};
        items.forEach(item => {
            if (!hourlyData[item.fcstTime]) {
                hourlyData[item.fcstTime] = { time: item.fcstTime, temp: 'N/A', sky: 'N/A', rainType: 'N/A', rainAmount: '0', humidity: 'N/A', windSpeed: 'N/A' };
            }
            const data = hourlyData[item.fcstTime];
            if (item.category === 'T1H') data.temp = item.fcstValue;
            if (item.category === 'SKY') data.sky = item.fcstValue;
            if (item.category === 'PTY') data.rainType = item.fcstValue;
            if (item.category === 'RN1') data.rainAmount = (item.fcstValue === "강수없음" || !item.fcstValue) ? "0mm" : item.fcstValue;
            if (item.category === 'REH') data.humidity = item.fcstValue;
            if (item.category === 'WSD') data.windSpeed = item.fcstValue;
        });

        const sortedTimes = Object.keys(hourlyData).sort();
        let count = 0;
        for (const time of sortedTimes) {
            if (count >= 6) break;
            const data = hourlyData[time];
            const displayTime = `${time.substring(0, 2)}시`;
            let weatherIcon = '❓';

            if (data.rainType !== '0' && data.rainType !== 'N/A') {
                weatherIcon = rainState[data.rainType] ? rainState[data.rainType].split(' ')[1] || '🌧️' : '🌧️';
            } else if (data.sky !== 'N/A') {
                weatherIcon = skyState[data.sky] ? skyState[data.sky].split(' ')[1] || '☀️' : '☀️';
            }

            weatherHtml += `
                <div class="hourly-item">
                    <p class="time">${displayTime}</p>
                    <p class="icon">${weatherIcon}</p>
                    <p class="temp">${data.temp}°C</p>
                    <p class="detail-item rain">💧 ${data.rainAmount}</p>
                    <p class="detail-item humidity">💧 ${data.humidity}%</p>
                    <p class="detail-item wind">🌬️ ${data.windSpeed}m/s</p>
                </div>`;
            count++;
        }
        weatherHtml += `</div></div>`;
        weatherResultDiv.innerHTML = weatherHtml;
    }

    async function fetchWeatherData(lat, lon, locationName) {
        weatherResultDiv.innerHTML = `<p class="loading-message">'${locationName}'의 날씨 정보를 가져오는 중...</p>`;
        try {
            const xy = dfs_xy_conv("toXY", lat, lon);
            if (!xy || typeof xy.x === 'undefined' || typeof xy.y === 'undefined') {
                weatherResultDiv.innerHTML = `<p class="error">'${locationName}'의 좌표 변환에 실패했습니다.</p>`; return;
            }
            const apiUrl = createApiUrl(xy.x, xy.y);
            const response = await fetch(apiUrl);
            if (!response.ok) { throw new Error(`HTTP 상태: ${response.status})`); }
            const textResponse = await response.text();
            let data;
            try { data = JSON.parse(textResponse); }
            catch (e) {
                console.error("JSON 파싱 오류:", e, "\n응답 내용:", textResponse);
                throw new Error("날씨 정보 응답이 올바르지 않습니다.");
            }
            if (data.response && data.response.header && data.response.header.resultCode !== "00") {
                throw new Error(`API 오류: ${data.response.header.resultMsg} (코드: ${data.response.header.resultCode})`);
            }
            displayWeather(data, locationName);
        } catch (error) {
            console.error(`'${locationName}' 날씨 정보 오류:`, error);
            weatherResultDiv.innerHTML = `<p class="error">'${locationName}'의 날씨 정보 처리 중 오류: ${error.message}</p>`;
        }
    }

    if (navigator.geolocation) {
        weatherResultDiv.innerHTML = '<p class="loading-message">현재 위치를 확인하는 중...</p>';
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude; const lon = position.coords.longitude;
            let closestLocation = (typeof findClosestLocation === 'function' && typeof locations !== 'undefined' && locations !== null) ? findClosestLocation(lat, lon, locations) : null;
            if (closestLocation) {
                searchInput.value = closestLocation.name;
                await fetchWeatherData(closestLocation.lat, closestLocation.lon, closestLocation.name);
            } else {
                await fetchWeatherData(lat, lon, "현재 위치 (정확한 좌표)");
            }
        }, (error) => {
            console.error("Geolocation 오류:", error);
            let message = "현재 위치를 가져올 수 없습니다. ";
            if (error.code === error.PERMISSION_DENIED) message += "위치 정보 권한이 필요합니다.";
            else if (error.code === error.POSITION_UNAVAILABLE) message += "위치 정보를 사용할 수 없습니다.";
            else if (error.code === error.TIMEOUT) message += "시간 초과되었습니다.";
            message += " 수동으로 지역을 검색하세요.";
            weatherResultDiv.innerHTML = `<p class="error">${message}</p>`;
            if (typeof populateLocationOptions === 'function' && typeof locations !== 'undefined' && locations !== null) { populateLocationOptions(locations); }
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 });
    } else {
        weatherResultDiv.innerHTML = "<p class='error'>브라우저가 현재 위치 기능을 지원하지 않습니다. 수동으로 검색하세요.</p>";
        if (typeof populateLocationOptions === 'function' && typeof locations !== 'undefined' && locations !== null) { populateLocationOptions(locations); }
    }

    if (searchInput && locationSelect && typeof locations !== 'undefined' && locations !== null) {
        // ▼▼▼▼▼▼▼▼▼▼ 2. 기존 이벤트 리스너를 debounce로 감싸기 ▼▼▼▼▼▼▼▼▼▼
        searchInput.addEventListener('input', debounce(() => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            if (!searchTerm) { 
                populateLocationOptions(locations); 
                return; 
            }
            const filteredLocations = locations.filter(loc => loc.name.toLowerCase().includes(searchTerm));
            populateLocationOptions(filteredLocations.length > 0 ? filteredLocations : []);
        }, 1000)); // 1000ms 지연
        // ▲▲▲▲▲▲▲▲▲▲ 이벤트 리스너 수정 끝 ▲▲▲▲▲▲▲▲▲▲

        if (!navigator.geolocation || locationSelect.options.length <=1 ) { populateLocationOptions(locations); }
    } else { console.warn("검색/선택 UI 또는 지역 데이터 문제"); }
    
    if (getWeatherButton && locationSelect && weatherResultDiv) {
        getWeatherButton.addEventListener('click', async () => {
            const selectedOption = locationSelect.options[locationSelect.selectedIndex];
            if (!selectedOption || !selectedOption.value || !selectedOption.dataset.lat || !selectedOption.dataset.lon) {
                const searchText = searchInput.value.trim();
                if (searchText && typeof locations !== 'undefined' && locations !== null) {
                    const foundLocation = locations.find(loc => loc.name.toLowerCase() === searchText.toLowerCase());
                    if (foundLocation) { await fetchWeatherData(foundLocation.lat, foundLocation.lon, foundLocation.name); }
                    else { weatherResultDiv.innerHTML = '<p class="error">정확한 지역명을 입력했는지 확인하거나, 목록에서 직접 선택해주세요.</p>'; }
                } else { weatherResultDiv.innerHTML = '<p class="error">지역을 선택하거나, 검색 후 목록에서 해당 지역을 선택해주세요.</p>'; }
                return;
            }
            const lat = selectedOption.dataset.lat; const lon = selectedOption.dataset.lon;
            const locationName = selectedOption.value;
            await fetchWeatherData(lat, lon, locationName);
        });
    }  else { console.warn("날씨 확인 버튼 또는 관련 DOM 문제"); }
});
