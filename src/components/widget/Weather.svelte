<script>
  import { onMount } from "svelte";

  let expanded = false;
  let loading = true;
  let error = "";
  let showCitySelector = false;
  let citySearchQuery = "";
  let citySearchResults = [];
  let citySearchLoading = false;
  let manualMode = false; // 用户手动选择城市后不再自动定位
  let weather = {
    city: "--",
    temp: "--",
    condition: "--",
    icon: "",
    humidity: "--",
    wind: "--",
    feelsLike: "--",
    visibility: "--",
    forecast: [],
  };

  export let defaultCity = "";

  // 添加超时处理的 fetch 函数
  async function fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('请求超时');
      }
      throw err;
    }
  }

  const cityNameMap = {
    Foshan: "佛山",
    Guangzhou: "广州",
    Shenzhen: "深圳",
    Beijing: "北京",
    Shanghai: "上海",
    Chengdu: "成都",
    Hangzhou: "杭州",
    Wuhan: "武汉",
  };

  const weatherCodeMap = {
    0: { text: "晴天 ☀️", icon: "☀️" },
    1: { text: "大部晴朗 🌤️", icon: "🌤️" },
    2: { text: "多云 ⛅", icon: "⛅" },
    3: { text: "阴天 ☁️", icon: "☁️" },
    45: { text: "雾 🌫️", icon: "🌫️" },
    48: { text: "雾凇 🌫️", icon: "🌫️" },
    51: { text: "小毛毛雨 🌧️", icon: "🌧️" },
    53: { text: "毛毛雨 🌧️", icon: "🌧️" },
    55: { text: "大毛毛雨 🌧️", icon: "🌧️" },
    61: { text: "小雨 🌧️", icon: "🌧️" },
    63: { text: "中雨 🌧️", icon: "🌧️" },
    65: { text: "大雨 🌧️", icon: "🌧️" },
    71: { text: "小雪 ❄️", icon: "❄️" },
    73: { text: "中雪 ❄️", icon: "❄️" },
    75: { text: "大雪 ❄️", icon: "❄️" },
    77: { text: "雪粒 ❄️", icon: "❄️" },
    80: { text: "阵雨 🌦️", icon: "🌦️" },
    81: { text: "中阵雨 🌦️", icon: "🌦️" },
    82: { text: "大阵雨 🌦️", icon: "🌦️" },
    85: { text: "小阵雪 🌨️", icon: "🌨️" },
    86: { text: "大阵雪 🌨️", icon: "🌨️" },
    95: { text: "雷暴 ⛈️", icon: "⛈️" },
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
        {},
        3000,
      );
      if (!resp.ok) return inferredCity || fallbackCity || defaultCity || "未知地区";
      const data = await resp.json();
      const addr = data?.address || {};
      const rawCity =
        addr.city ||
        addr.city_district ||
        addr.town ||
        addr.county ||
        addr.state_district ||
        addr.state ||
        data?.name ||
        "";

      return (
        cityNameMap[rawCity] ||
        rawCity ||
        inferredCity ||
        cityNameMap[fallbackCity] ||
        fallbackCity ||
        defaultCity ||
        "未知地区"
      );
    } catch {
      return inferredCity || cityNameMap[fallbackCity] || fallbackCity || defaultCity || "未知地区";
    }
  }

  async function fetchWeather(lat, lon, fallbackCity = "") {
    try {
      const city = await getCityByCoords(lat, lon, fallbackCity);

      const resp = await fetchWithTimeout(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=4`,
        {},
        5000,
      );
      if (!resp.ok) throw new Error(`weather http ${resp.status}`);
      const data = await resp.json();
      const cur = data?.current;
      const daily = data?.daily;
      if (!cur || !daily?.time?.length) throw new Error("weather data missing");

      const code = weatherCodeMap[cur.weather_code] || {
        text: "未知",
        icon: "🌈",
      };

      const forecast = daily.time.map((t, i) => {
        const fc = weatherCodeMap[daily.weather_code?.[i]] || {
          text: "--",
        };
        const dateObj = new Date(t);
        const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
        return {
          date: `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${weekdays[dateObj.getDay()]}`,
          tempMax: Math.round(daily.temperature_2m_max?.[i] ?? 0),
          tempMin: Math.round(daily.temperature_2m_min?.[i] ?? 0),
          condition: fc.text,
        };
      });

      weather = {
        city,
        temp: `${Math.round(cur.temperature_2m)}`,
        condition: code.text,
        icon: code.icon,
        humidity: `${cur.relative_humidity_2m}`,
        wind: `${cur.wind_speed_10m}`,
        feelsLike: `${Math.round(cur.apparent_temperature)}`,
        visibility: cur.visibility != null ? `${(cur.visibility / 1000).toFixed(1)}` : "--",
        forecast,
      };
      error = "";
      loading = false;
    } catch (e) {
      error = e.message === '请求超时' ? "天气数据获取超时，请稍后重试" : "获取天气失败";
      loading = false;
    }
  }

  // IP 定位服务列表（按优先级排列，失败自动切换到下一个）
  const ipGeoServices = [
    // ipwho.is — 免费，无需 key，无 rate limit，返回经纬度
    {
      url: "https://ipwho.is/",
      parse: (d) => ({
        lat: d.latitude,
        lon: d.longitude,
        city: d.city || d.region || "",
      }),
    },
    // ipinfo.io — 免费 50k/月
    {
      url: "https://ipinfo.io/json",
      parse: (d) => {
        const [lat, lon] = (d.loc || "").split(",").map(Number);
        return { lat, lon, city: d.city || d.region || "" };
      },
    },
    // ip-api.com — 免费 45/min，HTTP only
    {
      url: "http://ip-api.com/json/?lang=zh-CN",
      parse: (d) => ({
        lat: d.lat,
        lon: d.lon,
        city: d.city || d.regionName || "",
      }),
    },
  ];

  async function fetchWeatherByIP() {
    for (const svc of ipGeoServices) {
      try {
        const resp = await fetchWithTimeout(svc.url, {}, 3000);
        if (!resp.ok) continue;
        const data = await resp.json();
        const { lat, lon, city: rawCity } = svc.parse(data);
        if (lat && lon) {
          const resolvedCity =
            cityNameMap[rawCity] ||
            rawCity ||
            inferCityByCoords(lat, lon) ||
            defaultCity ||
            "未知地区";
          writeCache(resolvedCity, lat, lon);
          await fetchWeather(lat, lon, resolvedCity);
          return;
        }
      } catch {
        // 当前服务失败，尝试下一个
      }
    }
    // 所有 IP 定位服务都失败，使用默认城市
    const fallbackCity = defaultCity || "佛山";
    writeCache(fallbackCity, 23.1, 113.3);
    await fetchWeather(23.1, 113.3, fallbackCity);
  }

  // 缓存天气数据到 localStorage（有效期 1 小时）
  const CACHE_KEY = "firefly_weather_cache";
  const CACHE_TTL = 60 * 60 * 1000; // 1 小时

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const cached = JSON.parse(raw);
      if (Date.now() - cached.ts > CACHE_TTL) return null;
      return cached;
    } catch {
      return null;
    }
  }

  function writeCache(city, lat, lon) {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ city, lat, lon, ts: Date.now() })
      );
    } catch {}
  }

  // 城市定位缓存（独立于天气缓存）
  const CITY_CACHE_KEY = "firefly_weather_city";

  function readCityPreference() {
    try {
      return localStorage.getItem(CITY_CACHE_KEY) || null;
    } catch {
      return null;
    }
  }

  function writeCityPreference(city, lat, lon) {
    try {
      localStorage.setItem(
        CITY_CACHE_KEY,
        JSON.stringify({ city, lat, lon })
      );
    } catch {}
  }

  async function searchCities(query) {
    if (!query || query.length < 2) {
      citySearchResults = [];
      return;
    }
    citySearchLoading = true;
    try {
      const resp = await fetchWithTimeout(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=zh&format=json`,
        {},
        3000
      );
      if (!resp.ok) throw new Error("search failed");
      const data = await resp.json();
      citySearchResults = (data.results || []).map((r) => ({
        name: r.name + (r.admin1 ? `, ${r.admin1}` : "") + (r.country ? `, ${r.country}` : ""),
        lat: r.latitude,
        lon: r.longitude,
      }));
    } catch {
      citySearchResults = [];
    } finally {
      citySearchLoading = false;
    }
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
    try {
      localStorage.removeItem(CITY_CACHE_KEY);
      localStorage.removeItem(CACHE_KEY);
    } catch {}
    loading = true;
    error = "";
    // 重新触发定位
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const city =
            inferCityByCoords(lat, lon) ||
            (await getCityByCoords(lat, lon, defaultCity));
          writeCache(city, lat, lon);
          await fetchWeather(lat, lon, city);
        },
        async () => {
          await fetchWeatherByIP();
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 30 * 60 * 1000 }
      );
    } else {
      await fetchWeatherByIP();
    }
  }

  onMount(() => {
    // 优先使用用户手动选择的城市
    const cityPref = readCityPreference();
    if (cityPref) {
      manualMode = true;
      fetchWeather(cityPref.lat, cityPref.lon, cityPref.city);
      return;
    }

    // 先检查缓存
    const cached = readCache();
    if (cached && cached.lat && cached.lon && !import.meta.env.DEV) {
      fetchWeather(cached.lat, cached.lon, cached.city);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const city =
            inferCityByCoords(lat, lon) ||
            (await getCityByCoords(lat, lon, defaultCity));
          writeCache(city, lat, lon);
          await fetchWeather(lat, lon, city);
        },
        async () => {
          // 浏览器定位失败，使用 IP 定位
          await fetchWeatherByIP();
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 30 * 60 * 1000,
        },
      );
    } else {
      // 浏览器不支持定位，使用 IP 定位
      fetchWeatherByIP();
    }
  });
</script>

{#if loading}
  <div class="rounded-2xl border border-black/5 bg-gradient-to-br from-neutral-100/80 to-neutral-50/70 px-4 py-5 text-center text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:from-neutral-800/70 dark:to-neutral-900/60 dark:text-neutral-400">
    正在获取天气...
  </div>
{:else if error}
  <div class="rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-5 text-center text-sm text-red-500 shadow-sm dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
    {error}
  </div>
{:else}
  <div class="overflow-hidden rounded-2xl border border-black/5 bg-gradient-to-br from-neutral-100/80 via-white/75 to-neutral-50/70 shadow-sm dark:border-white/10 dark:from-neutral-800/80 dark:via-neutral-850/70 dark:to-neutral-900/70">
    <div class="flex items-start justify-between gap-3 px-4 py-4">
      <div class="flex items-center gap-3 min-w-0">
        <div class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-3xl shadow-sm dark:bg-white/8">
          {weather.icon}
        </div>
        <div class="min-w-0">
          <div class="text-3xl font-black leading-none text-neutral-900 dark:text-neutral-50">
            {weather.temp}°
          </div>
          <div class="mt-1 flex items-center gap-1.5">
            <span class="truncate text-sm font-medium text-neutral-500 dark:text-neutral-400">
              {weather.city}
            </span>
            <button
              type="button"
              class="shrink-0 text-xs text-(--primary)/70 hover:text-(--primary) transition-colors"
              on:click={() => { showCitySelector = !showCitySelector; citySearchResults = []; citySearchQuery = ""; }}
              title="切换城市"
            >
              📍
            </button>
          </div>
        </div>
      </div>
      <div class="max-w-[7rem] rounded-2xl bg-(--primary)/10 px-3 py-2 text-right text-xs font-medium leading-5 text-(--primary) dark:bg-(--primary)/15">
        {weather.condition}
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 px-4 pb-4 text-xs">
      <div class="rounded-xl bg-white/70 px-3 py-2.5 dark:bg-white/6">
        <div class="text-neutral-500 dark:text-neutral-400">体感温度</div>
        <div class="mt-1 text-sm font-bold text-neutral-900 dark:text-neutral-100">{weather.feelsLike}°C</div>
      </div>
      <div class="rounded-xl bg-white/70 px-3 py-2.5 dark:bg-white/6">
        <div class="text-neutral-500 dark:text-neutral-400">湿度</div>
        <div class="mt-1 text-sm font-bold text-neutral-900 dark:text-neutral-100">{weather.humidity}%</div>
      </div>
      <div class="rounded-xl bg-white/70 px-3 py-2.5 dark:bg-white/6">
        <div class="text-neutral-500 dark:text-neutral-400">风速</div>
        <div class="mt-1 text-sm font-bold text-neutral-900 dark:text-neutral-100">{weather.wind} km/h</div>
      </div>
      <div class="rounded-xl bg-white/70 px-3 py-2.5 dark:bg-white/6">
        <div class="text-neutral-500 dark:text-neutral-400">能见度</div>
        <div class="mt-1 text-sm font-bold text-neutral-900 dark:text-neutral-100">{weather.visibility} km</div>
      </div>
    </div>

    <!-- 城市选择面板 -->
    {#if showCitySelector}
      <div class="border-t border-black/5 px-3 py-3 dark:border-white/10">
        <div class="flex items-center gap-2">
          <input
            type="text"
            bind:value={citySearchQuery}
            placeholder="搜索城市..."
            class="flex-1 rounded-lg border border-black/10 bg-white/70 px-3 py-1.5 text-xs text-neutral-800 outline-none focus:border-(--primary) dark:border-white/10 dark:bg-white/5 dark:text-neutral-200"
            on:input={() => searchCities(citySearchQuery)}
          />
          {#if manualMode}
            <button
              type="button"
              class="shrink-0 rounded-lg bg-(--primary)/10 px-2 py-1.5 text-xs text-(--primary) hover:bg-(--primary)/20 transition-colors"
              on:click={resetToAuto}
            >
              自动
            </button>
          {/if}
        </div>
        {#if citySearchLoading}
          <p class="mt-2 text-center text-xs text-neutral-400">搜索中...</p>
        {:else if citySearchResults.length > 0}
          <ul class="mt-2 space-y-1">
            {#each citySearchResults as city}
              <li>
                <button
                  type="button"
                  class="w-full rounded-lg px-3 py-1.5 text-left text-xs text-neutral-700 hover:bg-(--primary)/10 dark:text-neutral-300 transition-colors"
                  on:click={() => selectCity(city.name, city.lat, city.lon)}
                >
                  {city.name}
                </button>
              </li>
            {/each}
          </ul>
        {:else if citySearchQuery.length >= 2}
          <p class="mt-2 text-center text-xs text-neutral-400">未找到相关城市</p>
        {/if}
      </div>
    {/if}

    <div class="border-t border-black/5 px-3 pb-3 pt-2 dark:border-white/10">
      <button
        class="btn-plain flex h-9 w-full items-center justify-center gap-2 rounded-xl text-xs font-medium text-(--primary)"
        on:click={() => (expanded = !expanded)}
      >
        <span>{expanded ? "收起详情" : "查看未来天气"}</span>
        <span class="transition-transform duration-200" class:rotate-180={expanded}>⌄</span>
      </button>

      {#if expanded}
        <div class="mt-2 space-y-2">
          {#each weather.forecast.slice(1) as day}
            <div class="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2.5 text-xs dark:bg-white/6">
              <div>
                <div class="font-medium text-neutral-700 dark:text-neutral-200">{day.date}</div>
                <div class="mt-0.5 text-neutral-500 dark:text-neutral-400">{day.condition}</div>
              </div>
              <div class="text-right text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {day.tempMin}° ~ {day.tempMax}°
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}
