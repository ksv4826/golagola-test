document.addEventListener('DOMContentLoaded', () => {
    const KMA_API_KEY = "11klmI+dRQMUtb30vqSIWaFkUBZBiSAm4PzRv7llDU7+EJ7e5nUdJ1whFSHwbHvRrQyK3HOvAFXpWhZJCwNc3w==";

    // 'locations' 변수는 locations_data.js 에서 제공

    const RE = 6371.00877; const GRID = 5.0; const SLAT1 = 30.0; const SLAT2 = 60.0;
    const OLON = 126.0; const OLAT = 38.0; const XO = 43; const YO = 136;
    function dfs_xy_conv(code, v1, v2) { /* 이전과 동일 */ 
        const DEGRAD = Math.PI / 180.0; const RADDEG = 180.0 / Math.PI;
        const re = RE / GRID; const slat1 = SLAT1 * DEGRAD; const slat2 = SLAT2 * DEGRAD;
        const olon = OLON * DEGRAD; const olat = OLAT * DEGRAD;
        let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
        sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
        let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
        sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
        let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
        ro = re * sf / Math.pow(ro, sn);
        let rs = {};
        if (code === "toXY") {
            rs['lat'] = v1; rs['lng'] = v2;
            let ra = Math.tan(Math.PI * 0.25 + (v1) * DEGRAD * 0.5);
            ra = re * sf / Math.pow(ra, sn);
            let theta = v2 * DEGRAD - olon;
            if (theta > Math.PI) theta -= 2.0 * Math.PI;
            if (theta < -Math.PI) theta += 2.0 * Math.PI;
            theta *= sn;
            rs['x'] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
            rs['y'] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
        } else { 
            rs['x'] = v1; rs['y'] = v2; let xn = v1 - XO; let yn = ro - v2 + YO;
            let ra = Math.sqrt(xn * xn + yn * yn); if (sn < 0.0) ra = -ra;
            let alat = Math.pow((re * sf / ra), (1.0 / sn));
            alat = 2.0 * Math.atan(alat) - Math.PI * 0.5;
            let theta = 0.0; if (Math.abs(xn) <= 0.0) { theta = 0.0; }
            else { if (Math.abs(yn) <= 0.0) { theta = Math.PI * 0.5; if (xn < 0.0) theta = -theta; }
            else theta = Math.atan2(xn, yn); }
            let alon = theta / sn + olon; rs['lat'] = alat * RADDEG; rs['lng'] = alon * RADDEG;
        } return rs;
    }

    const searchInput = document.getElementById('searchInput');
    const locationSelect = document.getElementById('locationSelect');
    const weatherResultDiv = document.getElementById('weatherResult');
    const getWeatherButton = document.getElementById('getWeatherButton');

    function getApiBaseTimes() { /* 이전과 동일 */
        const now = new Date();
        let year, month, day, currentHours, currentMinutes;
        const ncstDateObj = new Date(now);
        currentHours = ncstDateObj.getHours(); currentMinutes = ncstDateObj.getMinutes();
        if (currentMinutes < 40) { ncstDateObj.setHours(currentHours - 1); }
        year = ncstDateObj.getFullYear(); month = (ncstDateObj.getMonth() + 1).toString().padStart(2, '0');
        day = ncstDateObj.getDate().toString().padStart(2, '0');
        let ncstBaseHours = ncstDateObj.getHours().toString().padStart(2, '0');
        const ncstBase = { date: `${year}${month}${day}`, time: `${ncstBaseHours}00` };
        const fcstDateObj = new Date(now);
        currentHours = fcstDateObj.getHours(); currentMinutes = fcstDateObj.getMinutes();
        if (currentMinutes < 45) { fcstDateObj.setHours(currentHours - 1); }
        year = fcstDateObj.getFullYear(); month = (fcstDateObj.getMonth() + 1).toString().padStart(2, '0');
        day = fcstDateObj.getDate().toString().padStart(2, '0');
        let fcstBaseHours = fcstDateObj.getHours().toString().padStart(2, '0');
        const fcstBase = { date: `${year}${month}${day}`, time: `${fcstBaseHours}30` };
        return { ncst: ncstBase, fcst: fcstBase };
    }

    async function fetchWeatherData(apiKey, base_date, base_time, nx, ny, apiType) {
        const service = apiType === 'Ncst' ? 'getUltraSrtNcst' : 'getUltraSrtFcst';
        const url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/${service}`;
        // 초단기예보는 1시간 단위로 6시간까지 제공, 각 시간당 약 10개 항목. numOfRows는 넉넉하게.
        const numOfRows = apiType === 'Ncst' ? '10' : '60'; 
        const params = new URLSearchParams({
            serviceKey: apiKey, pageNo: '1', numOfRows: numOfRows, dataType: 'JSON',
            base_date: base_date, base_time: base_time, nx: nx.toString(), ny: ny.toString()
        });

        const response = await fetch(`${url}?${params.toString()}`);
        if (!response.ok) {
            console.error(`${apiType} API HTTP 오류: ${response.status}`);
            return null; 
        }
        const data = await response.json();
        if (data.response?.header?.resultCode !== '00') {
            console.warn(`${apiType} API 응답 오류:`, data.response?.header?.resultMsg);
            return null;
        }
        const items = data.response?.body?.items?.item;
        if (!items) {
            console.warn(`${apiType} API 응답에 items가 없음`);
            return null;
        }

        if (apiType === 'Ncst') {
            const weather = {};
            items.forEach(item => { weather[item.category] = item.obsrValue; });
            return weather;
        } else { // Fcst
            const hourlyArray = [];
            const tempHourlyHolder = {}; 
            items.forEach(item => {
                const key = `${item.fcstDate}-${item.fcstTime}`;
                if (!tempHourlyHolder[key]) {
                    tempHourlyHolder[key] = { date: item.fcstDate, time: item.fcstTime };
                }
                tempHourlyHolder[key][item.category] = item.fcstValue;
            });
            for (const key in tempHourlyHolder) { hourlyArray.push(tempHourlyHolder[key]); }
            hourlyArray.sort((a, b) => {
                if (a.date === b.date) { return a.time.localeCompare(b.time); }
                return a.date.localeCompare(b.date);
            });
            return hourlyArray;
        }
    }
    
    // --- 풍향 변환 함수 ---
    function getWindDirectionText(degrees) {
        if (degrees === undefined || degrees === null || isNaN(parseFloat(degrees))) return '';
        const deg = parseFloat(degrees);
        const directions = ['북', '북북동', '북동', '동북동', '동', '동남동', '남동', '남남동', '남', '남남서', '남서', '서남서', '서', '서북서', '북서', '북북서'];
        const index = Math.round((deg % 360) / 22.5);
        return directions[index % 16] + '풍';
    }

    // --- 날씨 코드 변환 함수 (이전과 동일) ---
    function getSkyCondition(skyCode, ptyCode) { /* 이전 답변의 수정된 getSkyCondition 함수 사용 */
        let description = '정보 미확인'; let icon = '🌫️';
        if (ptyCode && ptyCode !== "0") { 
            switch (ptyCode) {
                case '1': description = '비'; icon = '🌧️'; break;
                case '2': description = '비/눈'; icon = '🌨️🌧️'; break;
                case '3': description = '눈'; icon = '🌨️'; break;
                case '4': description = '소나기'; icon = '🌦️'; break; 
                case '5': description = '빗방울'; icon = '💧'; break;
                case '6': description = '빗방울/눈날림'; icon = '💧❄️'; break;
                case '7': description = '눈날림'; icon = '❄️'; break;
                default: description = '강수'; icon = '💧'; console.warn(`Unknown PTY Code: ${ptyCode}`); break;
            }
            return { description, icon };
        }
        switch (skyCode) {
            case '1': description = '맑음'; icon = '☀️'; break;
            case '3': description = '구름많음'; icon = '☁️'; break;
            case '4': description = '흐림'; icon = '🌥️'; break;
            default: if (skyCode !== undefined && skyCode !== null) { console.warn(`Unknown SKY Code: ${skyCode}`);} break;
        }
        return { description, icon };
    }

    function displayWeatherAndForecast(current, hourlyArray, locationName, apiBaseTimes) {
        weatherResultDiv.innerHTML = ''; 
        const locationHeader = document.createElement('h3');
        locationHeader.textContent = locationName || "지역명 없음";
        weatherResultDiv.appendChild(locationHeader);

        const ncstBaseInfo = apiBaseTimes.ncst;
        const referenceTimeP = document.createElement('p');
        referenceTimeP.className = 'reference-time';
        if (ncstBaseInfo && ncstBaseInfo.date && ncstBaseInfo.time) {
            referenceTimeP.textContent = `(현재 날씨 기준: ${ncstBaseInfo.date.substring(4,6)}/${ncstBaseInfo.date.substring(6,8)} ${ncstBaseInfo.time.substring(0,2)}:${ncstBaseInfo.time.substring(2,4)})`;
        } else {
            referenceTimeP.textContent = `(기준 시간 정보 없음)`;
        }
        weatherResultDiv.appendChild(referenceTimeP);

        if (current) {
            const currentDiv = document.createElement('div');
            currentDiv.className = 'current-weather-info';
            const temp = current.T1H ? `${current.T1H}` : 'N/A';
            const skyData = getSkyCondition(current.SKY, current.PTY); 
            const humidity = current.REH ? `${current.REH}%` : '-';
            const windSpeed = current.WSD ? `${current.WSD}m/s` : '-';
            const windDirection = getWindDirectionText(current.VEC);
            const precipitation = current.RN1 && current.RN1 !== "강수없음" ? `${current.RN1}mm` : '0mm'; // RN1은 "강수없음" 또는 숫자

            currentDiv.innerHTML = `
                <p class="temp">${temp}°C</p>
                <p class="sky"><span class="icon">${skyData.icon || '🌫️'}</span> ${skyData.description || '정보 미확인'}</p>
                <div class="details">
                    <span>습도: ${humidity}</span> | 
                    <span>바람: ${windDirection} ${windSpeed}</span> | 
                    <span>강수량: ${precipitation}</span>
                </div>
            `;
            weatherResultDiv.appendChild(currentDiv);
        } else {
            weatherResultDiv.innerHTML += `<p class="error">현재 날씨 정보를 가져오지 못했습니다.</p>`;
        }

        if (hourlyArray && hourlyArray.length > 0) {
            const hourlyDiv = document.createElement('div');
            hourlyDiv.className = 'hourly-forecast';
            hourlyDiv.innerHTML = `<h4>시간별 예보</h4>`;
            const itemsDiv = document.createElement('div');
            itemsDiv.className = 'hourly-forecast-items';
            const forecastBaseDate = apiBaseTimes.fcst.date;

            hourlyArray
                .filter(item => item.date === forecastBaseDate) // 오늘 자정 전까지만
                .forEach(hourData => {
                    const skyData = getSkyCondition(hourData.SKY, hourData.PTY);
                    const timeText = hourData.time ? `${hourData.time.substring(0,2)}시` : '--';
                    const tempText = hourData.T1H ? `${hourData.T1H}°C` : '-';
                    const humidityText = hourData.REH ? `${hourData.REH}%` : '-';
                    const precipText = hourData.RN1 && hourData.RN1 !== "강수없음" ? `${hourData.RN1}mm` : '0mm';
                    const windText = hourData.WSD && hourData.VEC ? `${getWindDirectionText(hourData.VEC)} ${hourData.WSD}m/s` : '-';
                    const lightningText = hourData.LGT === '0' || !hourData.LGT ? '' : '⚡️'; // 0이면 표시 안함

                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'hourly-item';
                    itemDiv.innerHTML = `
                        <span class="time">${timeText}</span>
                        <span class="icon">${skyData.icon || '🌫️'}</span>
                        <span class="temp">${tempText}</span>
                        <span class="detail-item">💧 ${precipText}</span>
                        <span class="detail-item">💧 ${humidityText}</span> 
                        <span class="detail-item">🌬️ ${windText} ${lightningText}</span>
                    `;
                    // 습도와 강수량 아이콘을 다르게 하거나, 텍스트로 구분
                    // 위의 예시에서 습도 아이콘을 강수량과 동일하게 💧로 했으나, 💧대신 "RH" 등으로 텍스트 표시도 가능
                    // 예: <span class="detail-item">습도: ${humidityText}</span>
                    itemsDiv.appendChild(itemDiv);
                });
            
            if (itemsDiv.children.length === 0) {
                itemsDiv.innerHTML = "<p style='text-align:center; width:100%;'>오늘 자정까지의 예보 정보가 없습니다.</p>";
            }
            hourlyDiv.appendChild(itemsDiv);
            weatherResultDiv.appendChild(hourlyDiv);
        } else if (current) { // 현재 날씨는 있는데 시간별 예보가 없는 경우
             weatherResultDiv.innerHTML += `<p>시간별 예보 정보를 가져오지 못했습니다.</p>`;
        }
    }
        
    async function getWeather() {
        if (KMA_API_KEY === "" || KMA_API_KEY === "YOUR_API_KEY") { weatherResultDiv.innerHTML = `<p class="error">API 키가 설정되지 않았습니다.</p>`; return; }
        const selectedLocationString = locationSelect.value;
        if (!selectedLocationString) { weatherResultDiv.innerHTML = `<p class="error">지역을 선택해주세요.</p>`; return; }
        
        weatherResultDiv.innerHTML = `<p class="loading-message">날씨 정보 가져오는 중...</p>`;
        try {
            const selectedLocationData = JSON.parse(selectedLocationString);
            const lat = selectedLocationData.lat;
            const lon = selectedLocationData.lon;
            const selectedOption = Array.from(locationSelect.options).find(opt => opt.value === selectedLocationString);
            const selectedLocationName = selectedOption ? selectedOption.textContent : "선택된 지역";

            const xy_coords = dfs_xy_conv("toXY", lat, lon);
            const nx = xy_coords.x;
            const ny = xy_coords.y;

            const apiTimes = getApiBaseTimes();

            // fetchWeatherData 함수를 사용하여 호출 간결화
            const [currentWeather, hourlyForecast] = await Promise.all([
                fetchWeatherData(KMA_API_KEY, apiTimes.ncst.date, apiTimes.ncst.time, nx, ny, 'Ncst'),
                fetchWeatherData(KMA_API_KEY, apiTimes.fcst.date, apiTimes.fcst.time, nx, ny, 'Fcst')
            ]);
            
            displayWeatherAndForecast(currentWeather, hourlyForecast, selectedLocationName, apiTimes);

        } catch (error) { 
            console.error("날씨 정보 처리 중 전체 오류:", error);
            weatherResultDiv.innerHTML = `<p class="error">날씨 정보를 처리하는 중 오류가 발생했습니다: ${error.message}</p>`;
        }
    }

    function populateDropdown(filteredLocations) { /* 이전과 동일 */ 
        locationSelect.innerHTML = ''; 
        if (!filteredLocations || filteredLocations.length === 0) {
            const option = document.createElement('option');
            option.value = ""; option.textContent = "검색 결과 없음";
            locationSelect.appendChild(option); return;
        }
        const displayLimit = 100;
        const itemsToDisplay = filteredLocations.slice(0, displayLimit);
        itemsToDisplay.forEach(loc => {
            const option = document.createElement('option');
            option.value = JSON.stringify({lat: loc.lat, lon: loc.lon});
            option.textContent = loc.name;
            locationSelect.appendChild(option);
        });
        if (filteredLocations.length > displayLimit) {
             const option = document.createElement('option');
             option.value = ""; option.disabled = true;
             option.textContent = `... 외 ${filteredLocations.length - displayLimit}개 결과 더 있음`;
             locationSelect.appendChild(option);
        }
    }
    if (searchInput) {
        searchInput.addEventListener('input', (e) => { /* 이전과 동일 */ 
            const searchTerm = e.target.value.toLowerCase();
            if (typeof locations === 'undefined' || locations === null) {
                locationSelect.innerHTML = '<option value="">지역 데이터 로딩 오류</option>'; return;
            }
            if (searchTerm.length < 2 && searchTerm.length !==0) {
                locationSelect.innerHTML = '<option value="">2글자 이상 입력하세요</option>'; return;
            }
            if(searchTerm.length === 0){
                locationSelect.innerHTML = '<option value="">검색 결과가 여기에 표시됩니다</option>'; return;
            }
            const filtered = locations.filter(loc => loc.name.toLowerCase().includes(searchTerm));
            populateDropdown(filtered);
        });
    }
    if (typeof locations !== 'undefined' && locations !== null && locations.length > 0) {
        locationSelect.innerHTML = '<option value="">검색어를 입력하거나, 여기서 지역을 선택하세요.</option>';
    } else {
        locationSelect.innerHTML = '<option value="">지역 데이터가 없거나 로드되지 않았습니다.</option>';
    }
    if (getWeatherButton) { getWeatherButton.addEventListener('click', getWeather); }
});
