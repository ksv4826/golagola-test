document.addEventListener('DOMContentLoaded', () => {
    const KMA_API_KEY = "1Xr7wYsVs3ubJCJJDYKqt46oaGQ8c0gktM2uj837bBuH1xG41u9op6v8kMGy2y3xYnYpAQDt+b+HJykqFlfl0g=="; // 기존 날씨 앱의 API 키
    // 'locations' 변수는 locations_data.js 에서 전역으로 제공됩니다.

    const RE = 6371.00877; const GRID = 5.0; const SLAT1 = 30.0; const SLAT2 = 60.0;
    const OLON = 126.0; const OLAT = 38.0; const XO = 43; const YO = 136;

    const weatherWidgetDiv = document.getElementById('currentWeatherWidget');

    weatherWidgetDiv.style.cursor = 'pointer'; // 위젯에 마우스를 올리면 클릭 가능한 것처럼 보이게 합니다.
    weatherWidgetDiv.onclick = () => { window.location.href = 'weather.html'; }; // 클릭 시 'weather.html'로 이동합니다.

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
        } else { return undefined; } // 위젯에서는 toXY만 필요
        return rs;
    }

    function findClosestLocation(latitude, longitude, locs) {
        if (typeof locs === 'undefined' || !locs || locs.length === 0) return null;
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

    function createWidgetApiUrl(nx, ny) {
        const nowInstance = new Date();
        let baseDate = nowInstance.getFullYear().toString() + ("0" + (nowInstance.getMonth() + 1)).slice(-2) + ("0" + nowInstance.getDate()).slice(-2);
        let baseTime = ("0" + nowInstance.getHours()).slice(-2) + "00";
        // 초단기 실황 API는 매 정시 발표, 30분 이후 조회 권장. 여기서는 초단기 예보를 활용해 현재값을 얻음.
        if (nowInstance.getMinutes() < 45) { // 초단기 예보 기준
            nowInstance.setHours(nowInstance.getHours() - 1);
            baseTime = ("0" + nowInstance.getHours()).slice(-2) + "00";
            baseDate = nowInstance.getFullYear().toString() + ("0" + (nowInstance.getMonth() + 1)).slice(-2) + ("0" + nowInstance.getDate()).slice(-2);
        }
        const encodedApiKey = encodeURIComponent(KMA_API_KEY);
        // 초단기 예보를 사용하여 현재 시간대의 값을 가져옴 (항목 수가 더 많음)
        const serviceUrl = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst';
        return `${serviceUrl}?serviceKey=${encodedApiKey}&pageNo=1&numOfRows=60&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;
    }

    function displayWidgetWeather(weatherData, locationToDisplay) {
        if (!weatherWidgetDiv) return;

        if (!weatherData || !weatherData.response || !weatherData.response.body || !weatherData.response.body.items) {
            weatherWidgetDiv.innerHTML = `<p class="text-red-500">날씨 정보 로딩 실패 (데이터 형식)</p>`;
            return;
        }
        const items = weatherData.response.body.items.item;
        if (!items || items.length === 0) {
            weatherWidgetDiv.innerHTML = `<p class="text-red-500">날씨 정보 없음</p>`;
            return;
        }

        const firstFcstTime = items[0].fcstTime; // 가장 빠른 예보 시간
        let temp = 'N/A', sky = 'N/A', pty = 'N/A', reh = 'N/A', wsd = 'N/A';

        items.filter(item => item.fcstTime === firstFcstTime).forEach(item => {
            if (item.category === 'T1H') temp = item.fcstValue; // 기온
            if (item.category === 'SKY') sky = item.fcstValue;   // 하늘 상태
            if (item.category === 'PTY') pty = item.fcstValue;   // 강수 형태
            if (item.category === 'REH') reh = item.fcstValue;   // 습도
            if (item.category === 'WSD') wsd = item.fcstValue;   // 풍속
        });

        const skyState = { "1": "맑음 ☀️", "3": "구름많음 🌥️", "4": "흐림 ☁️" };
        const rainState = { "0": "없음", "1": "비 🌧️", "2": "비/눈 🌨️", "3": "눈 ❄️", "4": "소나기 🌦️", "5": "빗방울", "6": "빗방울눈날림", "7": "눈날림" };

        let weatherIcon = '❓';
        let skyDescriptionText = '정보없음';

        if (pty !== '0' && pty !== 'N/A') {
            skyDescriptionText = rainState[pty] ? rainState[pty].split(' ')[0] : '강수';
            weatherIcon = rainState[pty] ? rainState[pty].split(' ')[1] || '🌧️' : '🌧️';
        } else if (sky !== 'N/A') {
            skyDescriptionText = skyState[sky] ? skyState[sky].split(' ')[0] : '날씨';
            weatherIcon = skyState[sky] ? skyState[sky].split(' ')[1] || '☀️' : '☀️';
        }
        
        // GOLAGOLA 스타일과 어울리도록 Tailwind CSS 클래스 사용
        weatherWidgetDiv.innerHTML = `
            <h3 class="text-lg font-semibold text-pink-500 mb-1 gola-font">오늘의 날씨</h3>
            <p id="widgetLocationName" class="text-xs text-gray-600 mb-2">${locationToDisplay || '위치 정보 없음'}</p>
            <div id="widgetIconAndTemp" class="flex items-center justify-center my-1">
                <span class="text-3xl">${weatherIcon}</span>
                <span class="text-2xl font-semibold ml-2">${temp}°C</span>
            </div>
            <p id="widgetSky" class="text-sm text-gray-800">${skyDescriptionText}</p>
            <p id="widgetDetails" class="text-xs text-gray-500 mt-1">
                ${reh !== 'N/A' ? `💧 습도: ${reh}%` : ''} 
                ${(reh !== 'N/A' && wsd !== 'N/A') ? `&nbsp;|&nbsp;` : ''} 
                ${wsd !== 'N/A' ? `🌬️ 풍속: ${wsd}m/s` : ''}
            </p>
        `;
    }

    async function fetchAndDisplayWeatherForCurrentLocation() {
        if (!weatherWidgetDiv) {
            console.error("날씨 위젯 DIV를 찾을 수 없습니다.");
            return;
        }
        weatherWidgetDiv.innerHTML = '<p class="text-gray-600">현재 위치 날씨를 가져오는 중...</p>';

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                let locationName = "현재 위치";
                if (typeof locations !== 'undefined' && typeof findClosestLocation === 'function') {
                    const closest = findClosestLocation(lat, lon, locations);
                    if (closest) {
                        // 간단하게 시/군/구 레벨만 표시하거나, 가장 가까운 '읍/면/동' 이름 사용
                        const nameParts = closest.name.split(' ');
                        if (nameParts.length > 2) {
                             locationName = `${nameParts[0]} ${nameParts[1]} ${nameParts[2]}`; // 예: 경기도 용인시 처인구
                        } else {
                            locationName = closest.name;
                        }
                    }
                }
                
                const xy = dfs_xy_conv("toXY", lat, lon);
                if (!xy) {
                    weatherWidgetDiv.innerHTML = '<p class="text-red-500">좌표 변환 실패</p>';
                    return;
                }

                const apiUrl = createWidgetApiUrl(xy.x, xy.y);
                try {
                    const response = await fetch(apiUrl);
                    if (!response.ok) throw new Error(`HTTP 오류: ${response.status}`);
                    const data = await response.json();

                    if (data.response && data.response.header && data.response.header.resultCode !== "00") {
                        throw new Error(`API 오류: ${data.response.header.resultMsg}`);
                    }
                    displayWidgetWeather(data, locationName);

                } catch (error) {
                    console.error("날씨 위젯 데이터 요청/처리 오류:", error);
                    weatherWidgetDiv.innerHTML = `<p class="text-red-500">날씨 정보 로드 실패 (${error.message})</p>`;
                }

            }, (error) => {
                console.error("날씨 위젯 Geolocation 오류:", error);
                weatherWidgetDiv.innerHTML = `<p class="text-red-500">위치 정보를 가져올 수 없습니다.</p>`;
            }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 });
        } else {
            weatherWidgetDiv.innerHTML = '<p class="text-red-500">Geolocation API가 지원되지 않습니다.</p>';
        }
    }

    fetchAndDisplayWeatherForCurrentLocation(); // 페이지 로드 시 바로 실행
});