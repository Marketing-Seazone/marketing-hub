export const FOLLOWERS_DATA = [
  { label: "@destinoseazone", platform: "Instagram", icon: "📷", current: 108500, goals: { abr:110000, mai:120000, jun:130000, jul:140000, ago:150000, set:160000, out:170000, nov:180000, dez:190000 } },
  { label: "@vistasdeanita",  platform: "Instagram", icon: "📷", current: 167200, goals: { abr:170000, mai:180000, jun:190000, jul:200000, ago:210000, set:220000, out:230000, nov:240000, dez:250000 } },
  { label: "@vistasdeanita",  platform: "TikTok",    icon: "🎵", current: 4800,   goals: { abr:5000,   mai:6000,   jun:7000,   jul:8000,   ago:9000,   set:10000,  out:11000,  nov:12000,  dez:13000 } },
  { label: "@destinoseazone", platform: "TikTok",    icon: "🎵", current: 920,    goals: { abr:1000,   mai:2000,   jun:3000,   jul:4000,   ago:5000,   set:6000,   out:7000,   nov:8000,   dez:9000   } },
];

export const MONTH_KEYS: Record<number, keyof typeof FOLLOWERS_DATA[0]['goals']> = {
  4: 'abr', 5: 'mai', 6: 'jun', 7: 'jul', 8: 'ago', 9: 'set', 10: 'out', 11: 'nov', 12: 'dez'
};
