/* ===================================================
   RailBook – IRCTC-like Application Logic
   =================================================== */

'use strict';

/* =============================================
   CONSTANTS
   ============================================= */
const MAX_PASSENGERS_PER_BOOKING = 6;
const MAX_PASSENGER_AGE = 125;
const MAX_COACH_NUMBER = 8;
const MAX_SEAT_NUMBER = 60;
const RESERVATION_CHARGE_PER_PASSENGER = 50;
const CONVENIENCE_FEE_RATE = 0.015;   // 1.5% of base fare
const CONVENIENCE_FEE_ROUNDING = 5;   // round to nearest 5
const CONVENIENCE_FEE_BASE = 20;      // minimum flat fee

/* =============================================
   DATA – Stations & Trains
   ============================================= */

const STATIONS = [
  { code: 'NDLS', name: 'New Delhi', city: 'New Delhi' },
  { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai' },
  { code: 'MAS',  name: 'Chennai Central', city: 'Chennai' },
  { code: 'HWH',  name: 'Howrah Junction', city: 'Kolkata' },
  { code: 'SBC',  name: 'Bengaluru City', city: 'Bengaluru' },
  { code: 'SC',   name: 'Secunderabad Junction', city: 'Hyderabad' },
  { code: 'ADI',  name: 'Ahmedabad Junction', city: 'Ahmedabad' },
  { code: 'PUNE', name: 'Pune Junction', city: 'Pune' },
  { code: 'JP',   name: 'Jaipur Junction', city: 'Jaipur' },
  { code: 'LKO',  name: 'Lucknow Charbagh', city: 'Lucknow' },
  { code: 'CNB',  name: 'Kanpur Central', city: 'Kanpur' },
  { code: 'PNBE', name: 'Patna Junction', city: 'Patna' },
  { code: 'BPL',  name: 'Bhopal Junction', city: 'Bhopal' },
  { code: 'NZM',  name: 'Hazrat Nizamuddin', city: 'New Delhi' },
  { code: 'BCT',  name: 'Bandra Terminus', city: 'Mumbai' },
  { code: 'CSTM', name: 'Mumbai CST', city: 'Mumbai' },
  { code: 'AGC',  name: 'Agra Cantonment', city: 'Agra' },
  { code: 'VSKP', name: 'Visakhapatnam', city: 'Visakhapatnam' },
  { code: 'NGP',  name: 'Nagpur Junction', city: 'Nagpur' },
  { code: 'CDG',  name: 'Chandigarh', city: 'Chandigarh' },
  { code: 'UHL',  name: 'Ambala Cantonment', city: 'Ambala' },
  { code: 'AMRT', name: 'Amritsar Junction', city: 'Amritsar' },
  { code: 'JAT',  name: 'Jammu Tawi', city: 'Jammu' },
  { code: 'JU',   name: 'Jodhpur Junction', city: 'Jodhpur' },
  { code: 'UDZ',  name: 'Udaipur City', city: 'Udaipur' },
  { code: 'KOTA', name: 'Kota Junction', city: 'Kota' },
  { code: 'GWL',  name: 'Gwalior Junction', city: 'Gwalior' },
  { code: 'HBJ',  name: 'Bhopal Habibganj', city: 'Bhopal' },
  { code: 'ET',   name: 'Itarsi Junction', city: 'Itarsi' },
  { code: 'R',    name: 'Raipur Junction', city: 'Raipur' },
];

const CLASS_INFO = {
  SL:  { label: 'Sleeper',           baseFare: 0.5 },
  '3A':{ label: 'AC 3 Tier',         baseFare: 1.8 },
  '2A':{ label: 'AC 2 Tier',         baseFare: 2.8 },
  '1A':{ label: 'AC First Class',    baseFare: 4.5 },
  CC:  { label: 'Chair Car',         baseFare: 0.7 },
  '2S':{ label: 'Second Sitting',    baseFare: 0.3 },
};

const TRAIN_TYPES = ['Express', 'Superfast', 'Rajdhani', 'Shatabdi', 'Intercity'];
const BADGE_CLASS = {
  Express: 'badge-express', Superfast: 'badge-superfast',
  Rajdhani: 'badge-rajdhani', Shatabdi: 'badge-shatabdi', Intercity: 'badge-intercity',
};

// Pre-defined popular routes with realistic data
const ROUTE_DB = [
  {
    number: '12301', name: 'Rajdhani Express', type: 'Rajdhani',
    from: 'NDLS', to: 'HWH', dep: '16:55', arr: '10:05', durationMin: 1030,
    days: [1,0,1,0,1,1,0], classes: ['1A','2A','3A'],
  },
  {
    number: '12302', name: 'Rajdhani Express', type: 'Rajdhani',
    from: 'HWH', to: 'NDLS', dep: '13:55', arr: '09:55', durationMin: 1200,
    days: [0,1,0,1,0,0,1], classes: ['1A','2A','3A'],
  },
  {
    number: '12259', name: 'Duronto Express', type: 'Superfast',
    from: 'NDLS', to: 'MMCT', dep: '23:00', arr: '15:55', durationMin: 1015,
    days: [1,0,1,0,1,0,1], classes: ['1A','2A','3A','SL'],
  },
  {
    number: '12009', name: 'Shatabdi Express', type: 'Shatabdi',
    from: 'NDLS', to: 'CDG', dep: '07:20', arr: '10:10', durationMin: 170,
    days: [1,1,1,1,1,1,0], classes: ['CC','2A'],
  },
  {
    number: '12010', name: 'Shatabdi Express', type: 'Shatabdi',
    from: 'CDG', to: 'NDLS', dep: '17:15', arr: '20:00', durationMin: 165,
    days: [1,1,1,1,1,1,0], classes: ['CC','2A'],
  },
  {
    number: '12057', name: 'Jan Shatabdi Express', type: 'Intercity',
    from: 'NDLS', to: 'UHL', dep: '06:15', arr: '12:30', durationMin: 375,
    days: [1,1,1,1,1,1,1], classes: ['CC','2S'],
  },
  {
    number: '12951', name: 'Mumbai Rajdhani', type: 'Rajdhani',
    from: 'NDLS', to: 'MMCT', dep: '16:25', arr: '08:35', durationMin: 970,
    days: [1,1,1,1,1,1,1], classes: ['1A','2A','3A'],
  },
  {
    number: '12952', name: 'Mumbai Rajdhani', type: 'Rajdhani',
    from: 'MMCT', to: 'NDLS', dep: '17:00', arr: '09:55', durationMin: 1015,
    days: [1,1,1,1,1,1,1], classes: ['1A','2A','3A'],
  },
  {
    number: '12001', name: 'Bhopal Shatabdi', type: 'Shatabdi',
    from: 'NDLS', to: 'BPL', dep: '06:00', arr: '14:20', durationMin: 500,
    days: [1,1,1,1,1,1,0], classes: ['CC','2A'],
  },
  {
    number: '12002', name: 'Bhopal Shatabdi', type: 'Shatabdi',
    from: 'BPL', to: 'NDLS', dep: '15:15', arr: '23:30', durationMin: 495,
    days: [1,1,1,1,1,1,0], classes: ['CC','2A'],
  },
  {
    number: '12627', name: 'Karnataka Express', type: 'Express',
    from: 'NDLS', to: 'SBC', dep: '21:30', arr: '06:15', durationMin: 1725,
    days: [1,1,1,1,1,1,1], classes: ['SL','3A','2A','1A'],
  },
  {
    number: '12628', name: 'Karnataka Express', type: 'Express',
    from: 'SBC', to: 'NDLS', dep: '20:00', arr: '06:05', durationMin: 1805,
    days: [1,1,1,1,1,1,1], classes: ['SL','3A','2A','1A'],
  },
  {
    number: '12621', name: 'Tamil Nadu Express', type: 'Superfast',
    from: 'NDLS', to: 'MAS', dep: '22:30', arr: '07:35', durationMin: 1865,
    days: [1,1,1,1,1,1,1], classes: ['SL','3A','2A','1A'],
  },
  {
    number: '12622', name: 'Tamil Nadu Express', type: 'Superfast',
    from: 'MAS', to: 'NDLS', dep: '22:00', arr: '07:20', durationMin: 1880,
    days: [1,1,1,1,1,1,1], classes: ['SL','3A','2A','1A'],
  },
  {
    number: '12049', name: 'Gatimaan Express', type: 'Superfast',
    from: 'NDLS', to: 'AGC', dep: '08:10', arr: '09:50', durationMin: 100,
    days: [1,1,1,1,1,1,0], classes: ['CC','2A'],
  },
  {
    number: '12050', name: 'Gatimaan Express', type: 'Superfast',
    from: 'AGC', to: 'NDLS', dep: '17:30', arr: '19:30', durationMin: 120,
    days: [1,1,1,1,1,1,0], classes: ['CC','2A'],
  },
  {
    number: '12071', name: 'Janshatabdi Express', type: 'Intercity',
    from: 'CSTM', to: 'PUNE', dep: '06:00', arr: '08:30', durationMin: 150,
    days: [1,1,1,1,1,1,1], classes: ['CC','2S'],
  },
  {
    number: '12072', name: 'Janshatabdi Express', type: 'Intercity',
    from: 'PUNE', to: 'CSTM', dep: '18:35', arr: '21:15', durationMin: 160,
    days: [1,1,1,1,1,1,1], classes: ['CC','2S'],
  },
  {
    number: '22119', name: 'Mumbai-Kochi Express', type: 'Superfast',
    from: 'MMCT', to: 'SC', dep: '07:15', arr: '05:00', durationMin: 1305,
    days: [1,0,1,0,1,0,1], classes: ['SL','3A','2A'],
  },
  {
    number: '12723', name: 'Andhra Pradesh Express', type: 'Superfast',
    from: 'NDLS', to: 'SC', dep: '07:15', arr: '08:45', durationMin: 1530,
    days: [1,1,1,1,1,1,1], classes: ['SL','3A','2A','1A'],
  },
  {
    number: '12724', name: 'Andhra Pradesh Express', type: 'Superfast',
    from: 'SC', to: 'NDLS', dep: '06:30', arr: '07:20', durationMin: 1490,
    days: [1,1,1,1,1,1,1], classes: ['SL','3A','2A','1A'],
  },
  {
    number: '12263', name: 'Pune Nizamuddin Duronto', type: 'Superfast',
    from: 'PUNE', to: 'NZM', dep: '22:15', arr: '15:25', durationMin: 1030,
    days: [1,0,0,1,0,0,1], classes: ['SL','3A','2A'],
  },
  {
    number: '12264', name: 'Nizamuddin Pune Duronto', type: 'Superfast',
    from: 'NZM', to: 'PUNE', dep: '23:30', arr: '16:25', durationMin: 1015,
    days: [0,1,0,0,1,0,0], classes: ['SL','3A','2A'],
  },
  {
    number: '12393', name: 'Sampoorna Kranti Express', type: 'Superfast',
    from: 'PNBE', to: 'NDLS', dep: '19:50', arr: '10:00', durationMin: 850,
    days: [1,1,1,1,1,1,1], classes: ['SL','3A','2A'],
  },
  {
    number: '12394', name: 'Sampoorna Kranti Express', type: 'Superfast',
    from: 'NDLS', to: 'PNBE', dep: '19:20', arr: '09:50', durationMin: 870,
    days: [1,1,1,1,1,1,1], classes: ['SL','3A','2A'],
  },
  {
    number: '12137', name: 'Punjab Mail', type: 'Express',
    from: 'CSTM', to: 'AMRT', dep: '19:05', arr: '04:45', durationMin: 1900,
    days: [1,1,1,1,1,1,1], classes: ['SL','3A','2A','1A'],
  },
  {
    number: '12138', name: 'Punjab Mail', type: 'Express',
    from: 'AMRT', to: 'CSTM', dep: '05:00', arr: '19:05', durationMin: 1925,
    days: [1,1,1,1,1,1,1], classes: ['SL','3A','2A','1A'],
  },
  {
    number: '14055', name: 'Brahmaputra Mail', type: 'Express',
    from: 'NDLS', to: 'JAT', dep: '17:55', arr: '06:00', durationMin: 725,
    days: [1,1,1,1,1,1,1], classes: ['SL','3A','2A'],
  },
  {
    number: '12031', name: 'Amritsar Shatabdi', type: 'Shatabdi',
    from: 'NDLS', to: 'AMRT', dep: '07:20', arr: '13:15', durationMin: 355,
    days: [1,1,1,1,1,1,0], classes: ['CC','2A'],
  },
  {
    number: '12032', name: 'Amritsar Shatabdi', type: 'Shatabdi',
    from: 'AMRT', to: 'NDLS', dep: '16:45', arr: '22:30', durationMin: 345,
    days: [1,1,1,1,1,1,0], classes: ['CC','2A'],
  },
  {
    number: '22436', name: 'Vande Bharat Express', type: 'Superfast',
    from: 'NDLS', to: 'JP', dep: '06:05', arr: '10:55', durationMin: 290,
    days: [1,1,1,1,1,1,0], classes: ['CC','2A'],
  },
  {
    number: '22435', name: 'Vande Bharat Express', type: 'Superfast',
    from: 'JP', to: 'NDLS', dep: '14:40', arr: '19:35', durationMin: 295,
    days: [1,1,1,1,1,1,0], classes: ['CC','2A'],
  },
  {
    number: '12985', name: 'Double Decker Express', type: 'Intercity',
    from: 'JP', to: 'ADI', dep: '05:40', arr: '12:45', durationMin: 425,
    days: [1,0,1,0,1,0,1], classes: ['CC'],
  },
  {
    number: '12986', name: 'Double Decker Express', type: 'Intercity',
    from: 'ADI', to: 'JP', dep: '14:30', arr: '21:45', durationMin: 435,
    days: [0,1,0,1,0,1,0], classes: ['CC'],
  },
];

// ---------- Seed availability randomly but deterministically ----------
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function getAvailability(trainNumber, cls, dateStr) {
  const seed = (trainNumber + cls + dateStr).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = seededRandom(seed);
  const r = rng();
  if (r < 0.15) return { status: 'NOT AVAILABLE', count: 0 };
  if (r < 0.35) return { status: 'WL ' + (Math.floor(rng() * 40) + 1), count: 0 };
  return { status: 'AVAILABLE', count: Math.floor(rng() * 150) + 20 };
}

function calcFare(trainNumber, cls, durationMin) {
  const perMin = CLASS_INFO[cls]?.baseFare ?? 1;
  const base = 30 + Math.round(durationMin * perMin * 0.18);
  const seed = (trainNumber + cls).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = seededRandom(seed);
  return Math.round((base + Math.floor(rng() * 50)) / 5) * 5;
}

/* =============================================
   STATE
   ============================================= */
const state = {
  currentUser: null,
  journeyType: 'one-way',
  searchParams: null,
  searchResults: [],
  sortBy: 'departure',
  selectedTrain: null,
  selectedClass: null,
  pendingBooking: null,
  passengers: [],
  users: JSON.parse(localStorage.getItem('rb_users') || '[]'),
  bookings: JSON.parse(localStorage.getItem('rb_bookings') || '[]'),
};

/* =============================================
   INIT
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Populate datalist for station autocomplete
  const dl = document.getElementById('station-list');
  STATIONS.forEach(s => {
    const opt = document.createElement('option');
    opt.value = `${s.city} (${s.code})`;
    dl.appendChild(opt);
  });

  // Set default journey date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('journey-date').value = formatDateInput(tomorrow);
  document.getElementById('journey-date').min = formatDateInput(new Date());

  // Restore logged-in user
  const saved = sessionStorage.getItem('rb_session');
  if (saved) {
    state.currentUser = JSON.parse(saved);
    updateAuthUI();
  }

  showPage('home');
});

/* =============================================
   NAVIGATION
   ============================================= */
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');
  const navEl = document.getElementById('nav-' + pageId);
  if (navEl) navEl.classList.add('active');

  if (pageId === 'my-bookings') renderBookings();
}

/* =============================================
   STATION HELPERS
   ============================================= */
function parseStation(input) {
  // Accept "City (CODE)" or just "CODE" or just city name
  const m = input.match(/\(([A-Z]+)\)/);
  if (m) return m[1];
  const upper = input.trim().toUpperCase();
  const byCode = STATIONS.find(s => s.code === upper);
  if (byCode) return byCode.code;
  const byCity = STATIONS.find(s => s.city.toLowerCase() === input.trim().toLowerCase());
  if (byCity) return byCity.code;
  return null;
}

function stationName(code) {
  const s = STATIONS.find(s => s.code === code);
  return s ? s.city : code;
}

/* =============================================
   SEARCH
   ============================================= */
function setJourneyType(type, btn) {
  state.journeyType = type;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function swapStations() {
  const from = document.getElementById('from-station');
  const to = document.getElementById('to-station');
  [from.value, to.value] = [to.value, from.value];
}

function searchTrains(e) {
  e.preventDefault();
  const fromInput = document.getElementById('from-station').value;
  const toInput   = document.getElementById('to-station').value;
  const dateStr   = document.getElementById('journey-date').value;
  const cls       = document.getElementById('travel-class').value;

  const fromCode = parseStation(fromInput);
  const toCode   = parseStation(toInput);

  if (!fromCode) { showToast('Please select a valid From station', 'error'); return; }
  if (!toCode)   { showToast('Please select a valid To station', 'error'); return; }
  if (fromCode === toCode) { showToast('From and To stations cannot be same', 'error'); return; }

  state.searchParams = { fromCode, toCode, dateStr, cls };
  state.sortBy = 'departure';

  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay(); // 0=Sun

  const results = ROUTE_DB
    .filter(t => t.from === fromCode && t.to === toCode)
    .map(t => {
      const availability = {};
      t.classes.forEach(c => {
        availability[c] = getAvailability(t.number, c, dateStr);
      });
      return { ...t, availability };
    });

  state.searchResults = results;
  renderResults();
}

function sortResults(by, btn) {
  state.sortBy = by;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderResults();
}

function renderResults() {
  const { searchParams, searchResults, sortBy } = state;
  if (!searchParams) return;

  const section = document.getElementById('results-section');
  const container = document.getElementById('train-results');
  const title = document.getElementById('results-title');

  section.classList.remove('hidden');
  title.textContent = `${searchResults.length} train(s) found: ${stationName(searchParams.fromCode)} → ${stationName(searchParams.toCode)} on ${formatDateDisplay(searchParams.dateStr)}`;

  // Sort
  const sorted = [...searchResults].sort((a, b) => {
    if (sortBy === 'departure') return a.dep.localeCompare(b.dep);
    if (sortBy === 'duration') return a.durationMin - b.durationMin;
    if (sortBy === 'fare') {
      const fc = searchParams.cls;
      const fa = a.classes.includes(fc) ? calcFare(a.number, fc, a.durationMin) : Infinity;
      const fb = b.classes.includes(fc) ? calcFare(b.number, fc, b.durationMin) : Infinity;
      return fa - fb;
    }
    return 0;
  });

  if (sorted.length === 0) {
    container.innerHTML = `<div class="no-results"><div class="icon">🚂</div><h3>No trains found</h3><p>No direct trains available for this route. Try different dates or stations.</p></div>`;
    return;
  }

  container.innerHTML = sorted.map(t => trainCardHTML(t, searchParams)).join('');

  // Scroll to results
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function trainCardHTML(t, params) {
  const days = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const dayDots = t.days.map((d, i) =>
    `<span class="day-dot${d ? ' runs' : ''}">${days[i]}</span>`
  ).join('');

  const classChips = t.classes.map(cls => {
    const avail = t.availability[cls];
    const fare = calcFare(t.number, cls, t.durationMin);
    const isSelected = cls === params.cls;
    const statusClass = avail.status === 'AVAILABLE' ? '' : avail.status.startsWith('WL') ? ' waitlist' : ' not-available';
    return `<div class="class-chip${isSelected ? ' selected' : ''}" onclick="selectClass(this, '${t.number}', '${cls}')">
      <div class="class-code">${cls}</div>
      <div class="class-seats${statusClass}">${avail.status}</div>
      <div class="class-fare">₹${fare}</div>
    </div>`;
  }).join('');

  const dur = formatDuration(t.durationMin);
  const fare = t.classes.includes(params.cls)
    ? `₹${calcFare(t.number, params.cls, t.durationMin)}`
    : '';

  return `<div class="train-card" id="card-${t.number}">
    <div class="train-card-main">
      <div class="train-name-info">
        <div class="train-number">${t.number}</div>
        <div class="train-name">${t.name}</div>
        <span class="train-type-badge ${BADGE_CLASS[t.type]}">${t.type}</span>
      </div>
      <div class="train-timing">
        <div class="time-block">
          <div class="dep-time">${t.dep}</div>
          <div class="station-code">${t.from}</div>
        </div>
        <div class="duration-block">
          <div class="duration-line"><span class="dur-line"></span><span class="dur-icon">🚆</span><span class="dur-line"></span></div>
          <div class="duration-text">${dur}</div>
        </div>
        <div class="time-block">
          <div class="arr-time">${t.arr}</div>
          <div class="station-code">${t.to}</div>
        </div>
      </div>
      <div class="class-availability">${classChips}</div>
      <div class="book-action">
        <button class="book-btn" id="book-btn-${t.number}" onclick="openBooking('${t.number}')">Book Now</button>
      </div>
    </div>
    <div class="train-card-footer">
      <span>Runs on:</span>
      <div class="runs-on">${dayDots}</div>
    </div>
  </div>`;
}

function selectClass(el, trainNumber, cls) {
  // Deselect siblings
  const card = document.getElementById('card-' + trainNumber);
  card.querySelectorAll('.class-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.searchParams.cls = cls;
}

/* =============================================
   BOOKING FLOW
   ============================================= */
function openBooking(trainNumber) {
  if (!state.currentUser) {
    showToast('Please login to book tickets', 'error');
    showModal('login-modal');
    return;
  }

  const train = state.searchResults.find(t => t.number === trainNumber);
  if (!train) return;

  // Get currently selected class for this card
  const card = document.getElementById('card-' + trainNumber);
  const selectedChip = card?.querySelector('.class-chip.selected');
  const cls = selectedChip
    ? selectedChip.querySelector('.class-code').textContent
    : (state.searchParams?.cls || train.classes[0]);

  const avail = train.availability[cls];
  if (avail && avail.status === 'NOT AVAILABLE') {
    showToast('This class is not available on this train', 'error');
    return;
  }

  state.selectedTrain = train;
  state.selectedClass = cls;

  // Summary
  const { fromCode, toCode, dateStr } = state.searchParams;
  const fare = calcFare(train.number, cls, train.durationMin);
  document.getElementById('booking-train-summary').innerHTML =
    `<strong>${train.number} – ${train.name}</strong><br>
    ${stationName(fromCode)} (${fromCode}) → ${stationName(toCode)} (${toCode})<br>
    ${formatDateDisplay(dateStr)} &nbsp;|&nbsp; <strong>${cls} – ${CLASS_INFO[cls]?.label}</strong> &nbsp;|&nbsp; ₹${fare} per passenger`;

  // Passengers
  state.passengers = [];
  document.getElementById('passengers-list').innerHTML = '';
  addPassengerRow();
  updateFareSummary();

  showModal('booking-modal');
}

let passengerIdCounter = 0;
function addPassengerRow() {
  if (state.passengers.length >= MAX_PASSENGERS_PER_BOOKING) {
    showToast(`Maximum ${MAX_PASSENGERS_PER_BOOKING} passengers allowed per booking`, 'error');
    return;
  }
  const id = ++passengerIdCounter;
  state.passengers.push(id);

  const row = document.createElement('div');
  row.className = 'passenger-row';
  row.id = 'p-row-' + id;
  row.innerHTML = `
    <div class="passenger-row-header">
      <span class="passenger-row-title">Passenger ${state.passengers.length}</span>
      ${state.passengers.length > 1 ? `<button type="button" class="remove-passenger" onclick="removePassenger(${id})">✕</button>` : ''}
    </div>
    <div class="passenger-fields">
      <div class="field-group">
        <label>Name *</label>
        <input type="text" id="p-name-${id}" placeholder="Full name" required />
      </div>
      <div class="field-group">
        <label>Age *</label>
        <input type="number" id="p-age-${id}" placeholder="Age" min="1" max="${MAX_PASSENGER_AGE}" required />
      </div>
      <div class="field-group">
        <label>Gender *</label>
        <select id="p-gender-${id}" required>
          <option value="">Select</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
      </div>
      <div class="field-group">
        <label>Berth Preference</label>
        <select id="p-berth-${id}">
          <option value="">No Preference</option>
          <option>Lower</option>
          <option>Middle</option>
          <option>Upper</option>
          <option>Side Lower</option>
          <option>Side Upper</option>
        </select>
      </div>
    </div>`;
  document.getElementById('passengers-list').appendChild(row);
  document.getElementById('passenger-count-info').textContent =
    `${state.passengers.length}/6 passengers`;
  updateFareSummary();
}

function removePassenger(id) {
  state.passengers = state.passengers.filter(p => p !== id);
  document.getElementById('p-row-' + id)?.remove();
  // Re-number
  document.querySelectorAll('.passenger-row-title').forEach((el, i) => {
    el.textContent = `Passenger ${i + 1}`;
  });
  document.getElementById('passenger-count-info').textContent =
    `${state.passengers.length}/6 passengers`;
  updateFareSummary();
}

function updateFareSummary() {
  const train = state.selectedTrain;
  if (!train) return;
  const cls = state.selectedClass;
  const fare = calcFare(train.number, cls, train.durationMin);
  const count = state.passengers.length;
  const total = fare * count;
  const convenience = Math.round(total * CONVENIENCE_FEE_RATE / CONVENIENCE_FEE_ROUNDING) * CONVENIENCE_FEE_ROUNDING + CONVENIENCE_FEE_BASE;
  const grand = total + convenience;

  document.getElementById('fare-summary').innerHTML = `
    <div class="fare-row"><span>Base Fare (${count} × ₹${fare})</span><span>₹${total}</span></div>
    <div class="fare-row"><span>Reservation Charges</span><span>₹${count * RESERVATION_CHARGE_PER_PASSENGER}</span></div>
    <div class="fare-row"><span>Convenience Fee</span><span>₹${convenience}</span></div>
    <div class="fare-row fare-total"><span>Total Amount</span><span>₹${grand + count * RESERVATION_CHARGE_PER_PASSENGER}</span></div>`;
  state.pendingBooking = { fare, count, total, convenience, grand: grand + count * RESERVATION_CHARGE_PER_PASSENGER };
}

function confirmBooking(e) {
  e.preventDefault();
  // Validate passengers
  const passengerData = [];
  for (const id of state.passengers) {
    const name   = document.getElementById('p-name-' + id)?.value.trim();
    const age    = document.getElementById('p-age-' + id)?.value;
    const gender = document.getElementById('p-gender-' + id)?.value;
    const berth  = document.getElementById('p-berth-' + id)?.value;
    if (!name || !age || !gender) {
      showToast('Please fill all required passenger fields', 'error');
      return;
    }
    passengerData.push({ name, age: parseInt(age, 10), gender, berth: berth || 'No Preference' });
  }
  const mobile = document.getElementById('contact-mobile').value;
  const email  = document.getElementById('contact-email').value;

  state.pendingBooking.passengers = passengerData;
  state.pendingBooking.mobile = mobile;
  state.pendingBooking.email = email;

  closeModal('booking-modal');
  document.getElementById('payment-amount-display').textContent =
    `Total: ₹${state.pendingBooking.grand}`;
  showModal('payment-modal');
}

function processPayment() {
  // Simulate payment processing
  closeModal('payment-modal');
  const booking = finalizeBooking();
  showConfirmation(booking);
}

function finalizeBooking() {
  const train  = state.selectedTrain;
  const cls    = state.selectedClass;
  const params = state.searchParams;
  const pb     = state.pendingBooking;

  const pnr    = generatePNR();
  const seatNos = pb.passengers.map((_, i) => {
    const coach = cls === 'SL' ? 'S' : cls === '3A' ? 'B' : cls === '2A' ? 'A' : 'H';
    return `${coach}${Math.floor(Math.random() * MAX_COACH_NUMBER) + 1}/${Math.floor(Math.random() * MAX_SEAT_NUMBER) + 1 + i * 2}`;
  });

  const booking = {
    pnr,
    trainNumber: train.number,
    trainName:   train.name,
    from: params.fromCode,
    to:   params.toCode,
    date: params.dateStr,
    dep:  train.dep,
    arr:  train.arr,
    cls,
    classLabel: CLASS_INFO[cls]?.label,
    passengers: pb.passengers,
    seatNos,
    total: pb.grand,
    status: 'Confirmed',
    bookedBy: state.currentUser.email,
    bookedAt: new Date().toISOString(),
    mobile: pb.mobile,
    email:  pb.email,
  };

  state.bookings.unshift(booking);
  localStorage.setItem('rb_bookings', JSON.stringify(state.bookings));
  return booking;
}

function showConfirmation(booking) {
  const passengerRows = booking.passengers.map((p, i) =>
    `<tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${p.age}</td>
      <td>${p.gender}</td>
      <td>${booking.seatNos[i]}</td>
      <td>${p.berth}</td>
    </tr>`
  ).join('');

  document.getElementById('confirmation-body').innerHTML = `
    <div class="confirmation-ticket">
      <div class="pnr-number">${booking.pnr}</div>
      <div class="pnr-label">PNR Number</div>
      <div class="ticket-detail-grid">
        <div class="ticket-detail"><div class="td-label">Train</div><div class="td-value">${escapeHtml(booking.trainNumber)} – ${escapeHtml(booking.trainName)}</div></div>
        <div class="ticket-detail"><div class="td-label">Date</div><div class="td-value">${formatDateDisplay(booking.date)}</div></div>
        <div class="ticket-detail"><div class="td-label">From</div><div class="td-value">${stationName(booking.from)} (${booking.from}) · ${booking.dep}</div></div>
        <div class="ticket-detail"><div class="td-label">To</div><div class="td-value">${stationName(booking.to)} (${booking.to}) · ${booking.arr}</div></div>
        <div class="ticket-detail"><div class="td-label">Class</div><div class="td-value">${booking.cls} – ${booking.classLabel}</div></div>
        <div class="ticket-detail"><div class="td-label">Status</div><div class="td-value" style="color:var(--success);font-weight:800">✓ ${booking.status}</div></div>
      </div>
    </div>
    <div style="overflow-x:auto;margin-bottom:18px;">
      <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
        <thead>
          <tr style="background:#eef2ff;">
            <th style="padding:8px 10px;text-align:left;">#</th>
            <th style="padding:8px 10px;text-align:left;">Name</th>
            <th style="padding:8px 10px;text-align:left;">Age</th>
            <th style="padding:8px 10px;text-align:left;">Gender</th>
            <th style="padding:8px 10px;text-align:left;">Seat</th>
            <th style="padding:8px 10px;text-align:left;">Berth</th>
          </tr>
        </thead>
        <tbody>${passengerRows}</tbody>
      </table>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
      <div style="font-size:1.1rem;font-weight:800;color:var(--primary);">Total Paid: ₹${booking.total}</div>
      <div class="confirm-actions">
        <button class="btn btn-outline btn-sm" onclick="closeModal('confirmation-modal'); showPage('my-bookings')">View My Bookings</button>
        <button class="btn btn-primary btn-sm" onclick="closeModal('confirmation-modal')">Done</button>
      </div>
    </div>`;
  showModal('confirmation-modal');
  showToast('🎉 Booking confirmed! PNR: ' + booking.pnr, 'success');
}

/* =============================================
   MY BOOKINGS
   ============================================= */
function renderBookings() {
  const container = document.getElementById('bookings-list');
  const myBookings = state.currentUser
    ? state.bookings.filter(b => b.bookedBy === state.currentUser.email)
    : [];

  if (!state.currentUser) {
    container.innerHTML = `<div class="no-bookings"><div class="icon">🔒</div><p>Please <a href="#" onclick="showModal('login-modal')">login</a> to view your bookings.</p></div>`;
    return;
  }

  if (myBookings.length === 0) {
    container.innerHTML = `<div class="no-bookings"><div class="icon">🎫</div><h3>No bookings yet</h3><p>Your booked tickets will appear here.</p><button class="btn btn-primary" onclick="showPage('home')" style="margin-top:14px">Search Trains</button></div>`;
    return;
  }

  container.innerHTML = myBookings.map(b => {
    const statusClass = b.status === 'Confirmed' ? 'status-confirmed' : 'status-cancelled';
    const passengerTags = b.passengers.map(p =>
      `<span class="booking-passenger-tag">${escapeHtml(p.name)}, ${p.age}</span>`
    ).join('');
    const cancelBtn = b.status === 'Confirmed'
      ? `<button class="btn btn-danger btn-sm" onclick="cancelBooking('${b.pnr}')">Cancel</button>`
      : '';
    return `<div class="booking-item" id="booking-${b.pnr}">
      <div class="booking-item-header">
        <div>
          <div class="booking-pnr">PNR: ${b.pnr}</div>
          <div style="font-size:0.82rem;color:var(--text-light);">Booked on ${formatDateDisplay(b.bookedAt.slice(0,10))}</div>
        </div>
        <span class="booking-status-badge ${statusClass}">${b.status}</span>
      </div>
      <div class="booking-item-body">
        <div class="booking-route">${stationName(b.from)} → ${stationName(b.to)}</div>
        <div class="booking-meta">
          ${escapeHtml(b.trainNumber)} – ${escapeHtml(b.trainName)} &nbsp;|&nbsp;
          ${formatDateDisplay(b.date)} &nbsp;|&nbsp;
          ${b.dep} → ${b.arr} &nbsp;|&nbsp;
          ${b.cls} (${b.classLabel})
        </div>
        <div class="booking-passengers">${passengerTags}</div>
      </div>
      <div class="booking-item-footer">
        <span class="booking-fare">₹${b.total}</span>
        ${cancelBtn}
      </div>
    </div>`;
  }).join('');
}

function cancelBooking(pnr) {
  if (!confirm('Are you sure you want to cancel booking PNR: ' + pnr + '? Refund will be processed within 5-7 business days.')) return;
  const idx = state.bookings.findIndex(b => b.pnr === pnr);
  if (idx !== -1) {
    state.bookings[idx].status = 'Cancelled';
    localStorage.setItem('rb_bookings', JSON.stringify(state.bookings));
    renderBookings();
    showToast('Booking cancelled. Refund will be credited soon.', 'success');
  }
}

/* =============================================
   PNR STATUS
   ============================================= */
function checkPNR() {
  const pnr = document.getElementById('pnr-input').value.trim();
  const result = document.getElementById('pnr-result');
  if (pnr.length !== 10 || !/^\d{10}$/.test(pnr)) {
    showToast('Enter a valid 10-digit PNR number', 'error');
    return;
  }
  const booking = state.bookings.find(b => b.pnr === pnr);
  result.classList.remove('hidden');
  if (!booking) {
    result.innerHTML = `<div class="no-results"><div class="icon">🔍</div><h3>PNR Not Found</h3><p>No booking found for PNR ${pnr}. Please check and try again.</p></div>`;
    return;
  }
  const statusClass = booking.status === 'Confirmed' ? 'status-confirmed' : 'status-cancelled';
  const passengerRows = booking.passengers.map((p, i) =>
    `<tr>
      <td style="padding:8px 10px;">${i+1}</td>
      <td style="padding:8px 10px;">${escapeHtml(p.name)}</td>
      <td style="padding:8px 10px;">${p.age} / ${p.gender[0]}</td>
      <td style="padding:8px 10px;">${booking.seatNos[i]}</td>
      <td style="padding:8px 10px;"><span class="booking-status-badge ${statusClass}">${booking.status}</span></td>
    </tr>`
  ).join('');

  result.innerHTML = `
    <h3 style="margin-bottom:14px;color:var(--primary);">PNR: ${booking.pnr}</h3>
    <div class="ticket-detail-grid" style="margin-bottom:16px;">
      <div class="ticket-detail"><div class="td-label">Train</div><div class="td-value">${escapeHtml(booking.trainNumber)} – ${escapeHtml(booking.trainName)}</div></div>
      <div class="ticket-detail"><div class="td-label">Journey Date</div><div class="td-value">${formatDateDisplay(booking.date)}</div></div>
      <div class="ticket-detail"><div class="td-label">From</div><div class="td-value">${stationName(booking.from)} · ${booking.dep}</div></div>
      <div class="ticket-detail"><div class="td-label">To</div><div class="td-value">${stationName(booking.to)} · ${booking.arr}</div></div>
      <div class="ticket-detail"><div class="td-label">Class</div><div class="td-value">${booking.cls}</div></div>
    </div>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
        <thead>
          <tr style="background:#eef2ff;">
            <th style="padding:8px 10px;text-align:left;">#</th>
            <th style="padding:8px 10px;text-align:left;">Name</th>
            <th style="padding:8px 10px;text-align:left;">Age/Gender</th>
            <th style="padding:8px 10px;text-align:left;">Seat</th>
            <th style="padding:8px 10px;text-align:left;">Status</th>
          </tr>
        </thead>
        <tbody>${passengerRows}</tbody>
      </table>
    </div>`;
}

/* =============================================
   AUTH
   ============================================= */
function login(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');

  const user = state.users.find(
    u => (u.email === username || u.name === username) && u.password === password
  );
  if (!user) {
    errEl.textContent = 'Invalid credentials. Please check and try again.';
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');
  state.currentUser = { name: user.name, email: user.email };
  sessionStorage.setItem('rb_session', JSON.stringify(state.currentUser));
  updateAuthUI();
  closeModal('login-modal');
  showToast(`Welcome back, ${user.name}!`, 'success');
}

function register(e) {
  e.preventDefault();
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const mobile   = document.getElementById('reg-mobile').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl    = document.getElementById('reg-error');

  if (state.users.find(u => u.email === email)) {
    errEl.textContent = 'An account with this email already exists.';
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');
  // NOTE: This is a demo-only application. Passwords are stored in plain text
  // in localStorage for simplicity. In a real application, never store passwords
  // client-side; use a server-side authentication system with proper hashing.
  const user = { name, email, mobile, password };
  state.users.push(user);
  localStorage.setItem('rb_users', JSON.stringify(state.users));

  state.currentUser = { name, email };
  sessionStorage.setItem('rb_session', JSON.stringify(state.currentUser));
  updateAuthUI();
  closeModal('register-modal');
  showToast(`Account created! Welcome, ${name}!`, 'success');
}

function logout() {
  state.currentUser = null;
  sessionStorage.removeItem('rb_session');
  updateAuthUI();
  showToast('Logged out successfully.', 'success');
  showPage('home');
}

function updateAuthUI() {
  const authEl = document.getElementById('nav-auth');
  const userEl = document.getElementById('nav-user');
  if (state.currentUser) {
    authEl.classList.add('hidden');
    userEl.classList.remove('hidden');
    document.getElementById('user-display-name').textContent = state.currentUser.name;
  } else {
    authEl.classList.remove('hidden');
    userEl.classList.add('hidden');
  }
}

/* =============================================
   MODAL HELPERS
   ============================================= */
function showModal(id) {
  document.getElementById(id)?.classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

function switchModal(from, to) {
  closeModal(from);
  showModal(to);
}

// Close modal on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});

/* =============================================
   TOAST
   ============================================= */
let toastTimer;
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast' + (type ? ' toast-' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3500);
}

/* =============================================
   UTILITIES
   ============================================= */
function formatDateInput(d) {
  return d.toISOString().slice(0, 10);
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function generatePNR() {
  let pnr;
  const usedPNRs = new Set(state.bookings.map(b => b.pnr));
  do {
    pnr = String(Math.floor(1000000000 + Math.random() * 9000000000));
  } while (usedPNRs.has(pnr));
  return pnr;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
