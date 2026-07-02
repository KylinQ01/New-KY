<script>
  import { onMount } from "svelte";

  let expanded = false;
  let loading = true;
  let error = "";
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

  async function fetchWeatherByIP() {
    try {
      const ipResp = await fetchWithTimeout("https://ipapi.co/json/", {}, 3000);
      if (!ipResp.ok) throw new Error(`ip http ${ipResp.status}`);
      const ipData = await ipResp.json();
      if (ipData.latitude && ipData.longitude) {
        const rawCity = ipData.city || ipData.region || "";
        const fallbackCity = cityNameMap[rawCity] || rawCity || inferCityByCoords(ipData.latitude, ipData.longitude) || defaultCity;
        await fetchWeather(ipData.latitude, ipData.longitude, fallbackCity);
        return;
      }
    } catch {
      // IP 定位失败，使用默认城市
    }
    // 优先使用配置的城市，再回退到硬编码默认值
    await fetchWeather(39.9, 116.4, defaultCity || "北京");
  }

  onMount(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await fetchWeather(pos.coords.latitude, pos.coords.longitude, "");
        },
        async () => {
          // 浏览器定位失败，使用 IP 定位
          await fetchWeatherByIP();
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,  // 5 秒超时
          maximumAge: 0
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
          <div class="mt-1 truncate text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {weather.city}
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
