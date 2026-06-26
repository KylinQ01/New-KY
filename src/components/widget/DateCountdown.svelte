<script>
  import { onMount } from "svelte";

  let today = new Date();
  let current = {
    year: 0,
    month: 0,
    day: 0,
    weekday: "",
    monthRemaining: 0,
    weekRemaining: 0,
    yearRemaining: 0,
  };
  let nextHoliday = { name: "--", target: null, daysAway: "--" };
  let timer;

  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const holidays = [
    { name: "元旦", day: 1, month: 1 },
    { name: "春节", day: 28, month: 1, isLunar: true },
    { name: "元宵节", day: 12, month: 2 },
    { name: "清明节", day: 5, month: 4 },
    { name: "劳动节", day: 1, month: 5 },
    { name: "端午节", day: 31, month: 5 },
    { name: "中秋节", day: 6, month: 10 },
    { name: "国庆节", day: 1, month: 10 },
    { name: "圣诞节", day: 25, month: 12 },
  ];

  function daysInMonth(y, m) {
    return new Date(y, m + 1, 0).getDate();
  }

  function daysLeftInMonth(d) {
    return daysInMonth(d.getFullYear(), d.getMonth()) - d.getDate();
  }

  function daysLeftInWeek(d) {
    const day = d.getDay();
    return day === 0 ? 0 : 7 - day;
  }

  function daysLeftInYear(d) {
    const yearEnd = new Date(d.getFullYear() + 1, 0, 1);
    const diff = yearEnd.getTime() - d.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function findNextHoliday(d) {
    const todayTs = d.getTime();
    let best = null;
    let bestDiff = Infinity;

    for (const h of holidays) {
      let target = new Date(d.getFullYear(), h.month - 1, h.day);
      if (target.getTime() <= todayTs) {
        target = new Date(d.getFullYear() + 1, h.month - 1, h.day);
      }
      const diff = Math.ceil((target.getTime() - todayTs) / (1000 * 60 * 60 * 24));
      if (diff < bestDiff) {
        bestDiff = diff;
        best = h;
        best.target = target;
      }
    }
    return { ...best, target: best?.target, daysAway: bestDiff };
  }

  function update() {
    const d = new Date();
    today = d;
    current = {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      weekday: weekdays[d.getDay()],
      monthRemaining: daysLeftInMonth(d),
      weekRemaining: daysLeftInWeek(d),
      yearRemaining: daysLeftInYear(d),
    };
    nextHoliday = findNextHoliday(d);
  }

  onMount(() => {
    update();
    timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  });
</script>

<div class="space-y-3">
  <div class="overflow-hidden rounded-2xl border border-black/5 bg-gradient-to-br from-neutral-100/80 via-white/75 to-neutral-50/70 px-4 py-4 shadow-sm dark:border-white/10 dark:from-neutral-800/80 dark:via-neutral-850/70 dark:to-neutral-900/70">
    <div class="text-[0.7rem] uppercase tracking-[0.24em] text-neutral-500 dark:text-neutral-400">
      Today
    </div>
    <div class="mt-2 flex items-end justify-between gap-3">
      <div>
        <div class="text-3xl font-black leading-none text-neutral-900 dark:text-neutral-50">
          {current.month}月{current.day}日
        </div>
        <div class="mt-2 text-sm font-medium text-(--primary)">{current.weekday}</div>
      </div>
      <div class="rounded-2xl bg-white/75 px-3 py-2 text-right shadow-sm dark:bg-white/6">
        <div class="text-xs text-neutral-500 dark:text-neutral-400">年份</div>
        <div class="mt-1 text-lg font-bold text-neutral-900 dark:text-neutral-100">{current.year}</div>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-2 text-center">
    <div class="rounded-2xl bg-neutral-100/70 px-2 py-3 shadow-sm dark:bg-white/6">
      <div class="text-lg font-black text-(--primary)">{current.monthRemaining}</div>
      <div class="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">本月剩余</div>
    </div>
    <div class="rounded-2xl bg-neutral-100/70 px-2 py-3 shadow-sm dark:bg-white/6">
      <div class="text-lg font-black text-(--primary)">{current.weekRemaining}</div>
      <div class="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">本周剩余</div>
    </div>
    <div class="rounded-2xl bg-neutral-100/70 px-2 py-3 shadow-sm dark:bg-white/6">
      <div class="text-lg font-black text-(--primary)">{current.yearRemaining}</div>
      <div class="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">今年剩余</div>
    </div>
  </div>

  <div class="rounded-2xl border border-(--primary)/15 bg-(--primary)/8 px-4 py-4 shadow-sm dark:border-(--primary)/20 dark:bg-(--primary)/10">
    <div class="text-xs uppercase tracking-[0.2em] text-(--primary)/80">Next Holiday</div>
    <div class="mt-2 flex items-center justify-between gap-3">
      <div>
        <div class="text-base font-bold text-neutral-900 dark:text-neutral-50">{nextHoliday.name}</div>
        {#if nextHoliday.target}
          <div class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {nextHoliday.target.getFullYear()}年{nextHoliday.target.getMonth() + 1}月{nextHoliday.target.getDate()}日
          </div>
        {/if}
      </div>
      <div class="text-right">
        <div class="text-2xl font-black text-(--primary)">{nextHoliday.daysAway}</div>
        <div class="text-xs text-neutral-500 dark:text-neutral-400">天后到来</div>
      </div>
    </div>
  </div>
</div>
