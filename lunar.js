// 农历计算（支持 1900-01-31 ~ 2100-12-31）
// lunarInfo 每项编码一年：
//   bit 0-3   闰月月份（0 表示无闰月）
//   bit 4-15  1~12 月大小（1 为 30 天，0 为 29 天），bit15 对应正月
//   bit 16    闰月大小（1 为 30 天）
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920
  0x06566, 0x0d4a0, 0x0ea50, 0x16a95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0, // 1990
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090
  0x0d520, // 2100
];

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;

const GAN = '甲乙丙丁戊己庚辛壬癸';
const ZHI = '子丑寅卯辰巳午未申酉戌亥';
const ANIMALS = '鼠牛虎兔龙蛇马羊猴鸡狗猪';
const MONTH_NAMES = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
const DAY_PREFIX = ['初', '十', '廿', '三'];
const DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

const DAY_MS = 86400000;
const BASE_UTC = Date.UTC(1900, 0, 31); // 农历 1900 年正月初一

const leapMonth = (y) => LUNAR_INFO[y - 1900] & 0xf;
const leapDays = (y) => (leapMonth(y) ? (LUNAR_INFO[y - 1900] & 0x10000 ? 30 : 29) : 0);
const monthDays = (y, m) => (LUNAR_INFO[y - 1900] & (0x10000 >> m) ? 30 : 29);

function yearDays(y) {
  let sum = 348;
  for (let bit = 0x8000; bit > 0x8; bit >>= 1) {
    if (LUNAR_INFO[y - 1900] & bit) sum += 1;
  }
  return sum + leapDays(y);
}

export function lunarDayName(d) {
  if (d === 10) return '初十';
  if (d === 20) return '二十';
  if (d === 30) return '三十';
  return DAY_PREFIX[Math.floor(d / 10)] + DIGITS[d % 10];
}

export function lunarMonthName(m, isLeap) {
  return (isLeap ? '闰' : '') + MONTH_NAMES[m - 1] + '月';
}

export const ganZhi = (n) => GAN[((n % 10) + 10) % 10] + ZHI[((n % 12) + 12) % 12];

// ---------- 二十四节气（寿星通式，适用 2001-2100） ----------
// 以每月两个节气排列，从 1 月的小寒开始
export const SOLAR_TERMS = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑',
  '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
];
const TERM_C_21 = [
  5.4055, 20.12, 3.87, 18.73, 5.63, 20.646, 4.81, 20.1,
  5.52, 21.04, 5.678, 21.37, 7.108, 22.83, 7.5, 23.13,
  7.646, 23.042, 8.318, 23.438, 7.438, 22.36, 7.18, 21.94,
];
// 通式的已知例外：`年-节气序号` -> 日期修正
const TERM_FIX = {
  '2019-0': -1, '2082-1': 1, '2026-3': -1, '2084-5': 1, '2008-9': 1,
  '2016-12': 1, '2002-14': 1, '2089-19': 1, '2089-20': 1, '2021-23': -1,
};

/** 返回某年某月（1-12）中两个节气的日期，如 [{day:5,name:'小寒'}, ...]；超出范围返回 [] */
export function solarTermsOfMonth(year, month) {
  if (year < 2001 || year > 2100) return [];
  const y = year % 100;
  const result = [];
  for (const idx of [(month - 1) * 2, (month - 1) * 2 + 1]) {
    // 1、2 月的节气按上一年计算闰年修正
    const leapCorr = idx < 4 ? Math.floor((y - 1) / 4) : Math.floor(y / 4);
    const day = Math.floor(y * 0.2422 + TERM_C_21[idx]) - leapCorr + (TERM_FIX[`${year}-${idx}`] || 0);
    result.push({ day, name: SOLAR_TERMS[idx] });
  }
  return result;
}

/** 公历 -> 农历。month 为 1-12。 */
export function solarToLunar(year, month, day) {
  const utc = Date.UTC(year, month - 1, day);
  let offset = Math.round((utc - BASE_UTC) / DAY_MS);
  if (offset < 0 || year > MAX_YEAR) return null;

  let ly = 1900;
  for (; ly <= MAX_YEAR; ly++) {
    const days = yearDays(ly);
    if (offset < days) break;
    offset -= days;
  }

  const leap = leapMonth(ly);
  let lm = 1;
  let isLeap = false;
  while (true) {
    const days = isLeap ? leapDays(ly) : monthDays(ly, lm);
    if (offset < days) break;
    offset -= days;
    if (leap === lm && !isLeap) {
      isLeap = true;
    } else {
      isLeap = false;
      lm += 1;
    }
  }
  const ld = offset + 1;

  const monthLen = isLeap ? leapDays(ly) : monthDays(ly, lm);
  // 1900-01-01 为甲戌日（序号 10）
  const dayIndex = Math.round((utc - Date.UTC(1900, 0, 1)) / DAY_MS) + 10;

  return {
    year: ly,
    month: lm,
    day: ld,
    isLeap,
    monthDays: monthLen,
    yearGanZhi: ganZhi(ly - 4),
    dayGanZhi: ganZhi(dayIndex),
    animal: ANIMALS[(((ly - 4) % 12) + 12) % 12],
    monthName: lunarMonthName(lm, isLeap),
    dayName: lunarDayName(ld),
  };
}

// ---------- 节日 ----------
const SOLAR_FESTIVALS = {
  '1-1': '元旦', '2-14': '情人节', '3-8': '妇女节', '3-12': '植树节',
  '5-1': '劳动节', '5-4': '青年节', '6-1': '儿童节', '7-1': '建党节',
  '8-1': '建军节', '9-10': '教师节', '10-1': '国庆节', '12-25': '圣诞节',
};
const LUNAR_FESTIVALS = {
  '1-1': '春节', '1-15': '元宵节', '2-2': '龙抬头', '5-5': '端午节',
  '7-7': '七夕', '7-15': '中元节', '8-15': '中秋节', '9-9': '重阳节',
  '12-8': '腊八节', '12-23': '小年',
};

/** 汇总某一公历日期的全部信息 */
export function getDayInfo(year, month, day) {
  const lunar = solarToLunar(year, month, day);
  const festivals = [];
  if (lunar && !lunar.isLeap) {
    if (lunar.month === 12 && lunar.day === lunar.monthDays) festivals.push('除夕');
    const lf = LUNAR_FESTIVALS[`${lunar.month}-${lunar.day}`];
    if (lf) festivals.push(lf);
  }
  const sf = SOLAR_FESTIVALS[`${month}-${day}`];
  if (sf) festivals.push(sf);
  const term = solarTermsOfMonth(year, month).find((t) => t.day === day)?.name || null;
  return { year, month, day, lunar, festivals, term };
}
