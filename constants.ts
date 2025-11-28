
import { ShiftEntry } from './types';

export const OFFICIAL_HOLIDAYS = [
  '1404/01/01', // Nowruz
  '1404/01/02', // Nowruz
  '1404/01/03', // Nowruz
  '1404/01/04', // Nowruz
  '1404/01/11', // Martyrdom of Imam Ali
  '1404/01/12', // Islamic Republic Day
  '1404/01/13', // Nature Day
  '1404/02/04', // Martyrdom of Imam Ja'far Sadiq
  '1404/03/14', // Demise of Imam Khomeini
  '1404/03/15', // Khordad 15
  '1404/03/16', // Eid al-Adha
  '1404/03/24', // Eid al-Ghadir
  '1404/04/14', // Tasu'a
  '1404/04/15', // Ashura
  '1404/05/23', // Arbaeen
  '1404/05/31', // Demise of Prophet & Imam Hassan
  '1404/06/02', // Martyrdom of Imam Reza
  '1404/06/10', // Martyrdom of Imam Hassan Askari
  '1404/06/19', // Birthday of Prophet & Imam Sadiq
  '1404/09/03', // Martyrdom of Fatimah
  '1404/10/13', // Birthday of Imam Ali
  '1404/10/27', // Maba'ath
  '1404/11/15', // Birthday of Imam Mahdi
  '1404/11/22', // Revolution Day
  '1404/12/20', // Martyrdom of Imam Ali (Ramadan)
  '1404/12/29', // Nationalization of Oil Industry
];

export const SCHEDULE_DATA: ShiftEntry[] = [
  { "id": 1, "dayName": "شنبه", "date": "1404/09/01", "dayShiftPerson": "مهندس لسانی", "nightShiftPerson": "مهندس سلیمان فلاح", "onCallPerson": "مهندس منصوری", "isHoliday": false },
  { "id": 2, "dayName": "یک‌شنبه", "date": "1404/09/02", "dayShiftPerson": "مهندس دهقان", "nightShiftPerson": "مهندس سامان", "onCallPerson": "مهندس منصوری", "isHoliday": false },
  { "id": 3, "dayName": "دوشنبه", "date": "1404/09/03", "dayShiftPerson": "مهندس سلیمان فلاح", "nightShiftPerson": "مهندس سالاروند", "onCallPerson": "مهندس منصوری", "isHoliday": true },
  { "id": 4, "dayName": "سه‌شنبه", "date": "1404/09/04", "dayShiftPerson": "مهندس سامان", "nightShiftPerson": "مهندس لسانی", "onCallPerson": "مهندس منصوری", "isHoliday": false },
  { "id": 5, "dayName": "چهارشنبه", "date": "1404/09/05", "dayShiftPerson": "مهندس سالاروند", "nightShiftPerson": "مهندس دهقان", "onCallPerson": "مهندس منصوری", "isHoliday": false },
  { "id": 6, "dayName": "پنج‌شنبه", "date": "1404/09/06", "dayShiftPerson": "مهندس لسانی", "nightShiftPerson": "مهندس سلیمان فلاح", "onCallPerson": "مهندس منصوری", "isHoliday": false },
  { "id": 7, "dayName": "جمعه", "date": "1404/09/07", "dayShiftPerson": "مهندس دهقان", "nightShiftPerson": "مهندس سامان", "onCallPerson": "مهندس منصوری", "isHoliday": true },
  { "id": 8, "dayName": "شنبه", "date": "1404/09/08", "dayShiftPerson": "مهندس سلیمان فلاح", "nightShiftPerson": "مهندس سالاروند", "onCallPerson": "مهندس گودرزی", "isHoliday": false },
  { "id": 9, "dayName": "یک‌شنبه", "date": "1404/09/09", "dayShiftPerson": "مهندس سامان", "nightShiftPerson": "مهندس لسانی", "onCallPerson": "مهندس گودرزی", "isHoliday": false },
  { "id": 10, "dayName": "دوشنبه", "date": "1404/09/10", "dayShiftPerson": "مهندس سالاروند", "nightShiftPerson": "مهندس دهقان", "onCallPerson": "مهندس گودرزی", "isHoliday": false },
  { "id": 11, "dayName": "سه‌شنبه", "date": "1404/09/11", "dayShiftPerson": "مهندس لسانی", "nightShiftPerson": "مهندس سلیمان فلاح", "onCallPerson": "مهندس گودرزی", "isHoliday": false },
  { "id": 12, "dayName": "چهارشنبه", "date": "1404/09/12", "dayShiftPerson": "مهندس دهقان", "nightShiftPerson": "مهندس سامان", "onCallPerson": "مهندس گودرزی", "isHoliday": false },
  { "id": 13, "dayName": "پنج‌شنبه", "date": "1404/09/13", "dayShiftPerson": "مهندس سلیمان فلاح", "nightShiftPerson": "مهندس سالاروند", "onCallPerson": "مهندس گودرزی", "isHoliday": false },
  { "id": 14, "dayName": "جمعه", "date": "1404/09/14", "dayShiftPerson": "مهندس سامان", "nightShiftPerson": "مهندس لسانی", "onCallPerson": "مهندس گودرزی", "isHoliday": true },
  { "id": 15, "dayName": "شنبه", "date": "1404/09/15", "dayShiftPerson": "مهندس سالاروند", "nightShiftPerson": "مهندس دهقان", "onCallPerson": "مهندس منصوری", "isHoliday": false },
  { "id": 16, "dayName": "یک‌شنبه", "date": "1404/09/16", "dayShiftPerson": "مهندس لسانی", "nightShiftPerson": "مهندس سلیمان فلاح", "onCallPerson": "مهندس منصوری", "isHoliday": false },
  { "id": 17, "dayName": "دوشنبه", "date": "1404/09/17", "dayShiftPerson": "مهندس دهقان", "nightShiftPerson": "مهندس سامان", "onCallPerson": "مهندس منصوری", "isHoliday": false },
  { "id": 18, "dayName": "سه‌شنبه", "date": "1404/09/18", "dayShiftPerson": "مهندس سلیمان فلاح", "nightShiftPerson": "مهندس سالاروند", "onCallPerson": "مهندس منصوری", "isHoliday": false },
  { "id": 19, "dayName": "چهارشنبه", "date": "1404/09/19", "dayShiftPerson": "مهندس سامان", "nightShiftPerson": "مهندس لسانی", "onCallPerson": "مهندس منصوری", "isHoliday": false },
  { "id": 20, "dayName": "پنج‌شنبه", "date": "1404/09/20", "dayShiftPerson": "مهندس سالاروند", "nightShiftPerson": "مهندس دهقان", "onCallPerson": "مهندس منصوری", "isHoliday": false },
  { "id": 21, "dayName": "جمعه", "date": "1404/09/21", "dayShiftPerson": "مهندس لسانی", "nightShiftPerson": "مهندس سلیمان فلاح", "onCallPerson": "مهندس منصوری", "isHoliday": true },
  { "id": 22, "dayName": "شنبه", "date": "1404/09/22", "dayShiftPerson": "مهندس دهقان", "nightShiftPerson": "مهندس سامان", "onCallPerson": "مهندس گودرزی", "isHoliday": false },
  { "id": 23, "dayName": "یک‌شنبه", "date": "1404/09/23", "dayShiftPerson": "مهندس سلیمان فلاح", "nightShiftPerson": "مهندس سالاروند", "onCallPerson": "مهندس گودرزی", "isHoliday": false },
  { "id": 24, "dayName": "دوشنبه", "date": "1404/09/24", "dayShiftPerson": "مهندس سامان", "nightShiftPerson": "مهندس لسانی", "onCallPerson": "مهندس گودرزی", "isHoliday": false },
  { "id": 25, "dayName": "سه‌شنبه", "date": "1404/09/25", "dayShiftPerson": "مهندس سالاروند", "nightShiftPerson": "مهندس دهقان", "onCallPerson": "مهندس گودرزی", "isHoliday": false },
  { "id": 26, "dayName": "چهارشنبه", "date": "1404/09/26", "dayShiftPerson": "مهندس لسانی", "nightShiftPerson": "مهندس سلیمان فلاح", "onCallPerson": "مهندس گودرزی", "isHoliday": false },
  { "id": 27, "dayName": "پنج‌شنبه", "date": "1404/09/27", "dayShiftPerson": "مهندس دهقان", "nightShiftPerson": "مهندس سامان", "onCallPerson": "مهندس گودرزی", "isHoliday": false },
  { "id": 28, "dayName": "جمعه", "date": "1404/09/28", "dayShiftPerson": "مهندس سلیمان فلاح", "nightShiftPerson": "مهندس سالاروند", "onCallPerson": "مهندس گودرزی", "isHoliday": true },
  { "id": 29, "dayName": "شنبه", "date": "1404/09/29", "dayShiftPerson": "مهندس سامان", "nightShiftPerson": "مهندس لسانی", "onCallPerson": "مهندس منصوری", "isHoliday": false },
  { "id": 30, "dayName": "یک‌شنبه", "date": "1404/09/30", "dayShiftPerson": "مهندس سالاروند", "nightShiftPerson": "مهندس دهقان", "onCallPerson": "مهندس منصوری", "isHoliday": false }
];
