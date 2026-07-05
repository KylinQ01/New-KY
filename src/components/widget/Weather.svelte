<script>
  import { onMount } from "svelte";

  let expanded = false;
  let loading = true;
  let error = "";
  let showCitySelector = false;
  let citySearchQuery = "";
  let citySearchResults = [];
  let citySearchLoading = false;
  let manualMode = false;
  let weather = {
    city: "--",
    temp: "--",
    condition: "--",
    icon: "",
    weatherCode: -1,
    humidity: "--",
    wind: "--",
    feelsLike: "--",
    visibility: "--",
    forecast: [],
  };

  export let defaultCity = "";

  // ---- 天气主题：根据 weatherCode 返回渐变背景 ----
  function weatherTheme(code) {
    if (code === 0 || code === 1) return {
      bg: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
      darkBg: "linear-gradient(135deg, #432371 0%, #c94b4b 100%)",
      glow: "rgba(253, 160, 133, 0.4)",
    }; // 晴天
    if (code === 2) return {
      bg: "linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)",
      darkBg: "linear-gradient(135deg, #1a2980 0%, #26406e 100%)",
      glow: "rgba(168, 192, 255, 0.3)",
    }; // 多云
    if (code === 3) return {
      bg: "linear-gradient(135deg, #b0b0b0 0%, #5a6e7f 100%)",
      darkBg: "linear-gradient(135deg, #2c3e50 0%, #4a5568 100%)",
      glow: "rgba(90, 110, 127, 0.3)",
    }; // 阴天
    if (code >= 45 && code <= 48) return {
      bg: "linear-gradient(135deg, #d7d2cc 0%, #304352 100%)",
      darkBg: "linear-gradient(135deg, #1a1a2e 0%, #3d3d5c 100%)",
      glow: "rgba(215, 210, 204, 0.2)",
    }; // 雾
    if (code >= 51 && code <= 67) return {
      bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      darkBg: "linear-gradient(135deg, #1a3a52 0%, #2d6a8f 100%)",
      glow: "rgba(79, 172, 254, 0.3)",
    }; // 雨
    if (code >= 71 && code <= 86) return {
      bg: "linear-gradient(135deg, #e6e9f0 0%, #a8c0ff 100%)",
      darkBg: "linear-gradient(135deg, #2d3748 0%, #4a6fa5 100%)",
      glow: "rgba(168, 192, 255, 0.25)",
    }; // 雪
    // 雷暴
    return {
      bg: "linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)",
      darkBg: "linear-gradient(135deg, #0f0c29 0%, #302b63 100%)",
      glow: "rgba(76, 161, 175, 0.3)",
    };
  }

  async function fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') throw new Error('请求超时');
      throw err;
    }
  }

  const cityNameMap = {
    Foshan: "佛山", Guangzhou: "广州", Shenzhen: "深圳",
    Beijing: "北京", Shanghai: "上海", Chengdu: "成都",
    Hangzhou: "杭州", Wuhan: "武汉",
  };

  const weatherCodeMap = {
    0:  { text: "晴天 ☀️",  icon: "☀️" },
    1:  { text: "大部晴朗 🌤️", icon: "🌤️" },
    2:  { text: "多云 ⛅",  icon: "⛅" },
    3:  { text: "阴天 ☁️",  icon: "☁️" },
    45: { text: "雾 🌫️",   icon: "🌫️" },
    48: { text: "雾凇 🌫️",  icon: "🌫️" },
    51: { text: "小毛毛雨 🌧️", icon: "🌧️" },
    53: { text: "毛毛雨 🌧️",  icon: "🌧️" },
    55: { text: "大毛毛雨 🌧️", icon: "🌧️" },
    61: { text: "小雨 🌧️",  icon: "🌧️" },
    63: { text: "中雨 🌧️",  icon: "🌧️" },
    65: { text: "大雨 🌧️",  icon: "🌧️" },
    71: { text: "小雪 ❄️",  icon: "❄️" },
    73: { text: "中雪 ❄️",  icon: "❄️" },
    75: { text: "大雪 ❄️",  icon: "❄️" },
    77: { text: "雪粒 ❄️",  icon: "❄️" },
    80: { text: "阵雨 🌦️",  icon: "🌦️" },
    81: { text: "中阵雨 🌦️", icon: "🌦️" },
    82: { text: "大阵雨 🌦️", icon: "🌦️" },
    85: { text: "小阵雪 🌨️", icon: "🌨️" },
    86: { text: "大阵雪 🌨️", icon: "🌨️" },
    95: { text: "雷暴 ⛈️",  icon: "⛈️" },
    96: { text: "冰雹雷暴 ⛈️", icon: "⛈️" },
    99: { text: "大冰雹雷暴 ⛈️", icon: "⛈️" },
  };

  function inferCityByCoords(lat, lon) {
    if (lat > 22.8 && lat < 23.3 && lon > 112.9 && lon < 113.4) return "佛山";
    if (lat > 22.4 && lat < 23.4 && lon > 113.0 && lon < 114.1) return "广州";
    if (lat > 22.4 && lat < 22.9 && lon > 113.7 && lon < 114.3) return "深圳";
    if (lat > 39.4 && lat < 41.1 && lon > 115.7 && lon < 117.4) return "北京";
    return "";
  }

  async function getCityByCoords(lat, lon, fallbackCity = "") {
    const inferredCity = inferCityByCoords(lat, lon);
    try {
      const resp = await fetchWithTimeout(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&accept-language=zh-CN`,
        {}, 3000,
      );
      if (!resp.ok) return inferredCity || fallbackCity || defaultCity || "未知地区";
      const data = await resp.json();
      const addr = data?.address || {};
      const rawCity = addr.city || addr.city_district || addr.town || addr.county || addr.state_district || addr.state || data?.name || "";
      return cityNameMap[rawCity] || rawCity || inferredCity || cityNameMap[fallbackCity] || fallbackCity || defaultCity || "未知地区";
    } catch {
      return inferredCity || cityNameMap[fallbackCity] || fallbackCity || defaultCity || "未知地区";
    }
  }

  async function fetchWeather(lat, lon, fallbackCity = "") {
    try {
      const city = await getCityByCoords(lat, lon, fallbackCity);
      const resp = await fetchWithTimeout(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=4`,
        {}, 5000,
      );
      if (!resp.ok) throw new Error(`weather http ${resp.status}`);
      const data = await resp.json();
      const cur = data?.current;
      const daily = data?.daily;
      if (!cur || !daily?.time?.length) throw new Error("weather data missing");

      const codeEntry = weatherCodeMap[cur.weather_code] || { text: "未知", icon: "🌈" };
      const forecast = daily.time.map((t, i) => {
        const fc = weatherCodeMap[daily.weather_code?.[i]] || { text: "--" };
        const d = new Date(t);
        const wdays = ["日","一","二","三","四","五","六"];
        return {
          date: `${d.getMonth()+1}/${d.getDate()} 周${wdays[d.getDay()]}`,
          tempMax: Math.round(daily.temperature_2m_max?.[i] ?? 0),
          tempMin: Math.round(daily.temperature_2m_min?.[i] ?? 0),
          condition: fc.text,
          icon: fc.icon,
        };
      });

      weather = {
        city,
        temp: `${Math.round(cur.temperature_2m)}`,
        condition: codeEntry.text,
        icon: codeEntry.icon,
        weatherCode: cur.weather_code,
        humidity: `${cur.relative_humidity_2m}`,
        wind: `${cur.wind_speed_10m}`,
        feelsLike: `${Math.round(cur.apparent_temperature)}`,
        visibility: cur.visibility != null ? `${(cur.visibility / 1000).toFixed(1)}` : "--",
        forecast,
      };
      error = "";
      loading = false;
    } catch (e) {
      error = e.message === '请求超时' ? "天气数据获取超时" : "获取天气失败";
      loading = false;
    }
  }

  const ipGeoServices = [
    { url: "https://ipwho.is/", parse: (d) => ({ lat: d.latitude, lon: d.longitude, city: d.city || d.region || "" }) },
    { url: "https://ipinfo.io/json", parse: (d) => { const [la, lo] = (d.loc || "").split(",").map(Number); return { lat: la, lon: lo, city: d.city || d.region || "" }; } },
    { url: "http://ip-api.com/json/?lang=zh-CN", parse: (d) => ({ lat: d.lat, lon: d.lon, city: d.city || d.regionName || "" }) },
  ];

  async function fetchWeatherByIP() {
    for (const svc of ipGeoServices) {
      try {
        const resp = await fetchWithTimeout(svc.url, {}, 3000);
        if (!resp.ok) continue;
        const data = await resp.json();
        const { lat, lon, city: rawCity } = svc.parse(data);
        if (lat && lon) {
          const resolvedCity = cityNameMap[rawCity] || rawCity || inferCityByCoords(lat, lon) || defaultCity || "未知地区";
          writeCache(resolvedCity, lat, lon);
          await fetchWeather(lat, lon, resolvedCity);
          return;
        }
      } catch { continue; }
    }
    const fallbackCity = defaultCity || "佛山";
    writeCache(fallbackCity, 23.1, 113.3);
    await fetchWeather(23.1, 113.3, fallbackCity);
  }

  const CACHE_KEY = "firefly_weather_cache";
  const CACHE_TTL = 60 * 60 * 1000;

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const c = JSON.parse(raw);
      if (Date.now() - c.ts > CACHE_TTL) return null;
      return c;
    } catch { return null; }
  }

  function writeCache(city, lat, lon) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ city, lat, lon, ts: Date.now() })); } catch {}
  }

  const CITY_CACHE_KEY = "firefly_weather_city";

  function readCityPreference() {
    try {
      const raw = localStorage.getItem(CITY_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function writeCityPreference(city, lat, lon) {
    try { localStorage.setItem(CITY_CACHE_KEY, JSON.stringify({ city, lat, lon })); } catch {}
  }

  async function searchCities(query) {
    if (!query || query.length < 2) { citySearchResults = []; return; }
    citySearchLoading = true;
    try {
      const resp = await fetchWithTimeout(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=zh&format=json`,
        {}, 3000,
      );
      if (!resp.ok) throw new Error("fail");
      const data = await resp.json();
      citySearchResults = (data.results || []).map((r) => ({
        name: r.name + (r.admin1 ? `, ${r.admin1}` : "") + (r.country ? `, ${r.country}` : ""),
        lat: r.latitude, lon: r.longitude,
      }));
    } catch { citySearchResults = []; }
    finally { citySearchLoading = false; }
  }

  async function selectCity(city, lat, lon) {
    manualMode = true;
    writeCityPreference(city, lat, lon);
    showCitySelector = false;
    citySearchQuery = "";
    citySearchResults = [];
    loading = true;
    await fetchWeather(lat, lon, city);
  }

  async function resetToAuto() {
    manualMode = false;
    try { localStorage.removeItem(CITY_CACHE_KEY); localStorage.removeItem(CACHE_KEY); } catch {}
    loading = true;
    error = "";
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const la = pos.coords.latitude, lo = pos.coords.longitude;
          const c = inferCityByCoords(la, lo) || (await getCityByCoords(la, lo, defaultCity));
          writeCache(c, la, lo);
          await fetchWeather(la, lo, c);
        },
        async () => { await fetchWeatherByIP(); },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 30 * 60 * 1000 },
      );
    } else { await fetchWeatherByIP(); }
  }

  onMount(() => {
    const cityPref = readCityPreference();
    if (cityPref) { manualMode = true; fetchWeather(cityPref.lat, cityPref.lon, cityPref.city); return; }
    const cached = readCache();
    if (cached && cached.lat && cached.lon && !import.meta.env.DEV) { fetchWeather(cached.lat, cached.lon, cached.city); return; }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const la = pos.coords.latitude, lo = pos.coords.longitude;
          const c = inferCityByCoords(la, lo) || (await getCityByCoords(la, lo, defaultCity));
          writeCache(c, la, lo);
          await fetchWeather(la, lo, c);
        },
        async () => { await fetchWeatherByIP(); },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 30 * 60 * 1000 },
      );
    } else { fetchWeatherByIP(); }
  });
</script>

{#if loading}
  <!-- 骨架屏 -->
  <div class="overflow-hidden rounded-2xl border border-black/5 shadow-sm dark:border-white/10">
    <div class="p-5">
      <div class="flex items-center gap-4">
        <div class="size-14 animate-pulse rounded-2xl bg-neutral-200/60 dark:bg-neutral-700/40"></div>
        <div class="flex-1 space-y-2.5">
          <div class="h-8 w-20 animate-pulse rounded-lg bg-neutral-200/60 dark:bg-neutral-700/40"></div>
          <div class="h-4 w-24 animate-pulse rounded bg-neutral-200/40 dark:bg-neutral-700/30"></div>
        </div>
      </div>
      <div class="mt-4 grid grid-cols-2 gap-2">
        {#each [0,1,2,4] as i}
          <div class="h-14 animate-pulse rounded-xl bg-neutral-100/60 dark:bg-neutral-800/40"></div>
        {/each}
      </div>
    </div>
  </div>

{:else if error}
  <div class="rounded-2xl border border-red-200/60 bg-gradient-to-br from-red-50 to-orange-50 px-4 py-6 text-center shadow-sm dark:border-red-500/20 dark:from-red-500/10 dark:to-orange-500/5">
    <span class="text-2xl">😵</span>
    <p class="mt-2 text-sm text-red-600 dark:text-red-300">{error}</p>
  </div>

{:else}
  {@const theme = weatherTheme(weather.weatherCode)}
  <div
    class="weather-card overflow-hidden rounded-2xl border border-white/20 shadow-lg dark:border-white/5 transition-all duration-500"
    style:background={theme.bg}
    style:--glow={theme.glow}
  >
    <!-- 光晕装饰 -->
    <div class="weather-glow" aria-hidden="true"></div>

    <div class="relative z-10">
      <!-- 头部 -->
      <div class="flex items-start justify-between gap-2 px-4 pt-4 pb-3">
        <div class="flex items-center gap-3">
          <div class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/90 text-3xl shadow-md backdrop-blur-sm dark:bg-white/10">
            <span class="weather-icon">{weather.icon}</span>
          </div>
          <div>
            <div class="text-4xl font-black leading-none text-white drop-shadow-sm dark:text-white/95">
              {weather.temp}°
            </div>
            <div class="mt-1.5 truncate text-sm font-semibold text-white/90 dark:text-white/80">
              {weather.city}
            </div>
          </div>
        </div>
        <div class="flex flex-col items-end gap-1.5">
          <button
            type="button"
            class="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20"
            on:click={() => { showCitySelector = !showCitySelector; citySearchResults = []; citySearchQuery = ""; }}
          >
            📍 切换
          </button>
          <div class="max-w-[6.5rem] rounded-xl bg-white/25 px-2.5 py-1.5 text-center text-[11px] font-semibold leading-tight text-white backdrop-blur-sm dark:bg-white/15">
            {weather.condition.split(' ')[0]}
          </div>
        </div>
      </div>

      <!-- 数据网格 -->
      <div class="grid grid-cols-4 gap-1.5 px-3 pb-3">
        <div class="flex flex-col items-center gap-1 rounded-xl bg-white/15 px-1 py-2.5 backdrop-blur-sm transition-transform hover:scale-105 dark:bg-white/10">
          <span class="text-base">🌡️</span>
          <span class="text-[10px] text-white/80">体感</span>
          <span class="text-sm font-bold text-white">{weather.feelsLike}°</span>
        </div>
        <div class="flex flex-col items-center gap-1 rounded-xl bg-white/15 px-1 py-2.5 backdrop-blur-sm transition-transform hover:scale-105 dark:bg-white/10">
          <span class="text-base">💧</span>
          <span class="text-[10px] text-white/80">湿度</span>
          <span class="text-sm font-bold text-white">{weather.humidity}%</span>
        </div>
        <div class="flex flex-col items-center gap-1 rounded-xl bg-white/15 px-1 py-2.5 backdrop-blur-sm transition-transform hover:scale-105 dark:bg-white/10">
          <span class="text-base">🌬️</span>
          <span class="text-[10px] text-white/80">风速</span>
          <span class="text-sm font-bold text-white">{weather.wind}</span>
        </div>
        <div class="flex flex-col items-center gap-1 rounded-xl bg-white/15 px-1 py-2.5 backdrop-blur-sm transition-transform hover:scale-105 dark:bg-white/10">
          <span class="text-base">👁️</span>
          <span class="text-[10px] text-white/80">能见度</span>
          <span class="text-sm font-bold text-white">{weather.visibility}</span>
        </div>
      </div>

      <!-- 城市选择面板 -->
      {#if showCitySelector}
        <div class="border-t border-white/20 bg-black/10 px-3 py-3 backdrop-blur-sm dark:bg-black/20">
          <div class="relative">
            <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-white/60">🔍</span>
            <input
              type="text"
              bind:value={citySearchQuery}
              placeholder="搜索全球城市..."
              class="w-full rounded-lg border border-white/20 bg-white/10 py-2 pl-7 pr-3 text-xs text-white placeholder-white/50 outline-none backdrop-blur-sm focus:border-white/40 focus:bg-white/15 dark:text-white"
              on:input={() => searchCities(citySearchQuery)}
            />
            {#if manualMode}
              <button
                type="button"
                class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-white/20 px-2 py-1 text-[10px] font-medium text-white hover:bg-white/30 transition-colors"
                on:click={resetToAuto}
              >
                自动
              </button>
            {/if}
          </div>
          {#if citySearchLoading}
            <div class="mt-3 flex justify-center">
              <div class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white/80"></div>
            </div>
          {:else if citySearchResults.length > 0}
            <ul class="mt-2 max-h-36 space-y-1 overflow-y-auto">
              {#each citySearchResults as city}
                <li>
                  <button
                    type="button"
                    class="w-full rounded-lg px-3 py-2 text-left text-xs text-white/90 hover:bg-white/15 active:bg-white/25 transition-colors"
                    on:click={() => selectCity(city.name, city.lat, city.lon)}
                  >
                    {city.name}
                  </button>
                </li>
              {/each}
            </ul>
          {:else if citySearchQuery.length >= 2}
            <p class="mt-3 text-center text-xs text-white/60">未找到相关城市</p>
          {/if}
        </div>
      {/if}

      <!-- 未来天气 -->
      <div class="border-t border-white/20 px-3 pb-3 pt-2">
        <button
          type="button"
          class="flex h-8 w-full items-center justify-center gap-2 rounded-lg text-xs font-medium text-white/90 hover:bg-white/10 active:bg-white/15 transition-all"
          on:click={() => (expanded = !expanded)}
        >
          <span>{expanded ? "收起" : "未来 3 天"}</span>
          <span class="text-[10px] transition-transform duration-300" class:rotate-180={expanded}>⌄</span>
        </button>

        {#if expanded}
          <div class="weather-forecast mt-2 space-y-1.5">
            {#each weather.forecast.slice(1) as day}
              <div class="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm transition-colors hover:bg-white/15">
                <div class="flex items-center gap-2">
                  <span class="text-base">{day.icon}</span>
                  <div>
                    <div class="text-xs font-medium text-white/95">{day.date}</div>
                    <div class="text-[10px] text-white/60">{day.condition.split(' ')[0]}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <!-- 温度范围可视化条 -->
                  <div class="h-1.5 w-12 overflow-hidden rounded-full bg-white/20">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-blue-300 to-orange-300"
                      style="width: {Math.max(20, Math.min(100, ((day.tempMax - day.tempMin) / 30) * 100))}%"
                    ></div>
                  </div>
                  <span class="text-xs font-bold text-white">{day.tempMin}°~{day.tempMax}°</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.dark) .weather-card {
    background: var(--dark-bg, linear-gradient(135deg, #1a2980 0%, #26406e 100%)) !important;
  }

  .weather-glow {
    position: absolute;
    top: -50%;
    right: -30%;
    width: 80%;
    height: 80%;
    border-radius: 50%;
    background: var(--glow, rgba(255, 255, 255, 0.15));
    filter: blur(40px);
    pointer-events: none;
    z-index: 0;
  }

  .weather-icon {
    display: inline-block;
    animation: weather-float 3s ease-in-out infinite;
  }

  .weather-forecast > div {
    animation: weather-fade-in 0.3s ease-out both;
  }
  .weather-forecast > div:nth-child(2) { animation-delay: 0.08s; }
  .weather-forecast > div:nth-child(3) { animation-delay: 0.16s; }

  @keyframes weather-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }

  @keyframes weather-fade-in {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
