// Current broadcast colors, checked against OpenF1's team_colour data (October 2026).
const TEAM_COLORS = {
  mercedes: '#00D7B6', ferrari: '#ED1131', mclaren: '#F47600', red_bull: '#4781D7',
  rb: '#6C98FF', racing_bulls: '#6C98FF', alpine: '#00A1E8', haas: '#9C9FA2',
  audi: '#F50537', williams: '#1868DB', aston_martin: '#229971', cadillac: '#909090',
  // Recognizable legacy identities; unknown historical teams use a neutral marker.
  renault: '#FFF500', toro_rosso: '#469BFF', alphatauri: '#8CA9C5',
  alfa: '#B63145', sauber: '#52E252', force_india: '#F596C8', racing_point: '#F596C8',
  brawn: '#B8FF32', lotus_f1: '#C8AC64', lotus: '#C8AC64', jordan: '#FFD800',
  benetton: '#38B87C', toyota: '#E73539', honda: '#E5E5E5', bmw_sauber: '#61A4E8'
};
const COUNTRY_CODES = {
  Australia: 'AU', Australian: 'AU', Austria: 'AT', Austrian: 'AT', Argentina: 'AR', Argentine: 'AR', Argentinian: 'AR',
  Belgium: 'BE', Belgian: 'BE', Brazil: 'BR', Brazilian: 'BR', Bahrain: 'BH',
  Canada: 'CA', Canadian: 'CA', China: 'CN', Chinese: 'CN', Colombia: 'CO', Colombian: 'CO',
  Denmark: 'DK', Danish: 'DK', Finland: 'FI', Finnish: 'FI', France: 'FR', French: 'FR',
  Germany: 'DE', German: 'DE', Hungary: 'HU', Hungarian: 'HU', India: 'IN', Indian: 'IN',
  Indonesia: 'ID', Indonesian: 'ID', Ireland: 'IE', Irish: 'IE', Italy: 'IT', Italian: 'IT',
  Japan: 'JP', Japanese: 'JP', Malaysia: 'MY', Malaysian: 'MY', Mexico: 'MX', Mexican: 'MX',
  Monaco: 'MC', Monegasque: 'MC', Monacan: 'MC', Netherlands: 'NL', Dutch: 'NL',
  'New Zealand': 'NZ', 'New Zealander': 'NZ', Portugal: 'PT', Portuguese: 'PT',
  Poland: 'PL', Polish: 'PL', Qatar: 'QA', Russia: 'RU', Russian: 'RU',
  Singapore: 'SG', Spain: 'ES', Spanish: 'ES', Sweden: 'SE', Swedish: 'SE',
  Switzerland: 'CH', Swiss: 'CH', Thailand: 'TH', Thai: 'TH', Turkey: 'TR', Turkish: 'TR',
  UAE: 'AE', 'United Arab Emirates': 'AE', UK: 'GB', 'United Kingdom': 'GB', British: 'GB',
  USA: 'US', 'United States': 'US', American: 'US', Azerbaijan: 'AZ',
  'South Africa': 'ZA', 'South African': 'ZA', 'South Korea': 'KR', Korean: 'KR',
  'Czech Republic': 'CZ', Czech: 'CZ', Chile: 'CL', Chilean: 'CL', Uruguay: 'UY', Uruguayan: 'UY',
  Venezuela: 'VE', Venezuelan: 'VE', Rhodesia: 'ZW', Rhodesian: 'ZW', Zimbabwe: 'ZW',
  'East Germany': 'DE', 'East German': 'DE', Liechtenstein: 'LI', Liechtensteiner: 'LI'
};
export function countryCode(country) { return COUNTRY_CODES[country] || ''; }
export function flagEmoji(country) {
  const code = countryCode(country);
  return code ? String.fromCodePoint(...[...code].map((letter) => 127397 + letter.charCodeAt(0))) : '';
}
export function teamColor(team, season) {
  const id = team?.constructorId;
  // Do not apply today's palette to a team's earlier identities with different colors.
  if (id === 'mclaren' && Number(season) < 2017) return '#D7D7D7';
  if (id === 'sauber' && Number(season) < 2024) return '#61A4E8';
  return TEAM_COLORS[id] || '#9A9AA6';
}
