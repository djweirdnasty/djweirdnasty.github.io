const map = L.map("map").setView([39.9526, -75.1652], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const carIcon = L.divIcon({
  className: "car-marker",
  html: "<div style='font-size:28px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.5));'>&#128663;</div>",
  iconSize: [36, 36],
  iconAnchor: [18, 34],
});

const footIcon = L.divIcon({
  className: "car-marker",
  html: "<div style='font-size:28px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.5));'>&#129462;</div>",
  iconSize: [36, 36],
  iconAnchor: [18, 34],
});

const startIcon = L.divIcon({
  className: "pin",
  html: "<div style='width:12px;height:12px;background:#00ff88;border-radius:50%;border:2px solid white;'></div>",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const endIcon = L.divIcon({
  className: "pin",
  html: "<div style='width:12px;height:12px;background:#ff4757;border-radius:50%;border:2px solid white;'></div>",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

let currentLatLng = null;
let destLatLng = null;
let routeLine = null;
let steps = [];
let carMarker = null;
let navInterval = null;
let routePoints = [];
let startMarker = null;
let destMarker = null;
let watchId = null;
let isTracking = false;
let lastReverseGeocode = 0;
let isNavigating = false;
let lastNavStepIndex = -1;
let activeProfile = "driving";

const $ = (id) => document.getElementById(id);

// Bias geocoding to Philadelphia plus Camden, Dover, Columbus, Harpers Ferry, and Baltimore
const VIEWBOX = {
  minLon: -83.0,
  maxLat: 40.0,
  maxLon: -75.0,
  minLat: 39.1,
};
const VIEWBOX_STR = `${VIEWBOX.minLon},${VIEWBOX.maxLat},${VIEWBOX.maxLon},${VIEWBOX.minLat}`;

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

function setStatus(text) {
  $("status").textContent = text;
}

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Geolocation not supported on this device");
      return;
    }
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      reject("HTTPS required for location access");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.latitude, pos.coords.longitude]),
      (err) => {
        if (err.code === 2 || err.code === 3) {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve([pos.coords.latitude, pos.coords.longitude]),
            (err2) => reject(getLocErrorMsg(err2)),
            { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
          );
        } else {
          reject(getLocErrorMsg(err));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
}

function getLocErrorMsg(err) {
  if (err.code === 1) return "Permission denied. Allow location access in your browser settings.";
  if (err.code === 2) return "Location unavailable. Check your GPS or network connection.";
  if (err.code === 3) return "Location request timed out. Try again.";
  return err.message;
}

function updateMyLocationPanel(address, lat, lng) {
  $("myLocationAddress").textContent = address || "Unknown address";
  $("myLocationCoords").textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

async function reverseGeocode(lat, lng) {
  const now = Date.now();
  if (now - lastReverseGeocode < 5000) return;
  lastReverseGeocode = now;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await res.json();
    updateMyLocationPanel(data.display_name || "Unknown address", lat, lng);
  } catch (e) {
    updateMyLocationPanel("Unknown address", lat, lng);
  }
}

function onPosition(pos) {
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  currentLatLng = [lat, lng];
  if (!startMarker) {
    startMarker = L.marker(currentLatLng, { icon: startIcon }).addTo(map).bindPopup("You are here");
  } else {
    startMarker.setLatLng(currentLatLng);
  }
  if (!isNavigating) startMarker.openPopup();
  reverseGeocode(lat, lng);
  setStatus(`Located: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  $("routeBtn").disabled = !destLatLng;
  if (isNavigating) updateNavigation(lat, lng);
}

async function locateMe() {
  try {
    setStatus("Getting location...");
    const [lat, lng] = await getLocation();
    onPosition({ coords: { latitude: lat, longitude: lng } });
    centerOnMe();
  } catch (e) {
    setStatus("Could not get location: " + e);
  }
}

function startTracking() {
  if (watchId !== null) return;
  if (!navigator.geolocation) {
    setStatus("Geolocation not supported");
    return;
  }
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    setStatus("HTTPS required for location access");
    return;
  }
  watchId = navigator.geolocation.watchPosition(onPosition, (err) => {
    if (err.code === 2 || err.code === 3) {
      setStatus("Retrying with lower accuracy...");
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
      watchId = navigator.geolocation.watchPosition(onPosition, (err2) => setStatus("Tracking error: " + getLocErrorMsg(err2)), {
        enableHighAccuracy: false,
        maximumAge: 60000,
        timeout: 30000,
      });
      return;
    }
    setStatus("Tracking error: " + getLocErrorMsg(err));
  }, {
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 15000,
  });
  isTracking = true;
  $("trackToggle").textContent = "Stop Tracking";
  setStatus("Tracking started");
}

function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  isTracking = false;
  $("trackToggle").textContent = "Start Tracking";
  setStatus("Tracking stopped");
}

function toggleTracking() {
  if (isTracking) stopTracking();
  else startTracking();
}

function centerOnMe() {
  if (currentLatLng) {
    map.setView(currentLatLng, 16);
  } else {
    locateMe();
  }
}

async function fetchSuggestions(query) {
  if (!query) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${VIEWBOX_STR}&bounded=0&countrycodes=us&addressdetails=1&limit=5`
    );
    return await res.json();
  } catch (e) {
    return [];
  }
}

function selectDestination(lat, lon, display_name) {
  destLatLng = [lat, lon];
  $("destination").value = display_name;
  $("suggestions").innerHTML = "";
  $("suggestions").hidden = true;
  if (destMarker) map.removeLayer(destMarker);
  destMarker = L.marker(destLatLng, { icon: endIcon })
    .addTo(map)
    .bindPopup(display_name)
    .openPopup();
  if (currentLatLng) {
    map.fitBounds([currentLatLng, destLatLng], { padding: [40, 40] });
  } else {
    map.setView(destLatLng, 15);
  }
  setStatus(`Destination: ${display_name}`);
  $("routeBtn").disabled = !currentLatLng;
}

function renderSuggestions(results) {
  const list = $("suggestions");
  list.innerHTML = "";
  if (!results.length) {
    list.hidden = true;
    return;
  }
  results.forEach((place) => {
    const li = document.createElement("li");
    li.textContent = place.display_name;
    li.addEventListener("click", () => selectDestination(parseFloat(place.lat), parseFloat(place.lon), place.display_name));
    list.appendChild(li);
  });
  list.hidden = false;
}

async function searchDestination() {
  const query = $("destination").value.trim();
  if (!query) return;
  setStatus("Searching…");
  const results = await fetchSuggestions(query);
  if (!results.length) {
    setStatus("No results found");
    return;
  }
  const { lat, lon, display_name } = results[0];
  selectDestination(parseFloat(lat), parseFloat(lon), display_name);
}

async function updateSuggestions() {
  const query = $("destination").value.trim();
  if (query.length < 3) {
    $("suggestions").innerHTML = "";
    $("suggestions").hidden = true;
    return;
  }
  const results = await fetchSuggestions(query);
  renderSuggestions(results);
}

function instructionFor(step) {
  let text = step.name || "";
  if (step.maneuver) {
    const type = step.maneuver.type || "";
    const mod = step.maneuver.modifier || "";
    if (type && type !== "arrive") {
      text = `${type.replace(/_/g, " ")}${mod ? " " + mod : ""}${text ? " onto " + text : ""}`;
    } else if (type === "arrive") {
      text = "Arrive at destination";
    }
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

async function getRoute() {
  if (!currentLatLng || !destLatLng) {
    setStatus("Need both origin and destination");
    return;
  }
  setStatus("Calculating route…");
  try {
    const coords = `${currentLatLng[1]},${currentLatLng[0]};${destLatLng[1]},${destLatLng[0]}`;
    const profile = $("profile").value || "driving";
    activeProfile = profile;
    if (carMarker) { map.removeLayer(carMarker); carMarker = null; }
    const res = await fetch(`https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson&steps=true`);
    const data = await res.json();
    if (!data.routes || !data.routes.length) {
      setStatus("No route found");
      return;
    }

    const route = data.routes[0];
    const legs = route.legs[0];
    steps = legs.steps;
    routePoints = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

    if (routeLine) map.removeLayer(routeLine);
    routeLine = L.polyline(routePoints, { color: "#00d4ff", weight: 6, opacity: 0.9 }).addTo(map);
    if (carMarker) map.removeLayer(carMarker);
    const navIcon = activeProfile === "foot" ? footIcon : carIcon;
    carMarker = L.marker(routePoints[0], { icon: navIcon, zIndexOffset: 1000 }).addTo(map);
    map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });

    const distanceMi = (route.distance / 1609.34).toFixed(1);
    const durationMin = Math.round(route.duration / 60);
    $("etaText").textContent = `${durationMin} min`;
    $("distanceText").textContent = `${distanceMi} mi`;
    $("etaPanel").hidden = false;

    const list = $("stepsList");
    list.innerHTML = "";
    steps.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = instructionFor(step);
      list.appendChild(li);
    });
    $("instructions").hidden = false;

    $("startNavBtn").disabled = false;
    setStatus(`Route ready — ${durationMin} min (${distanceMi} mi)`);
  } catch (e) {
    setStatus("Routing failed: " + e.message);
  }
}

function findNextStep(index) {
  if (!steps.length || index >= routePoints.length - 1) return null;

  let stepPointIdx = 0;
  const stepWaypoints = steps.flatMap((s) => s.maneuver.location);
  // Build a rough index mapping for step boundaries
  const stepIndices = [0];
  let accumulated = 0;
  steps.forEach((step) => {
    accumulated += step.geometry.coordinates.length;
    stepIndices.push(accumulated);
  });

  for (let i = 0; i < stepIndices.length - 1; i++) {
    if (index < stepIndices[i + 1]) {
      return { step: steps[i], index: i };
    }
  }
  return { step: steps[steps.length - 1], index: steps.length - 1 };
}

function announce(text) {
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(u);
  }
}

function nearestRoutePoint(lat, lng) {
  let min = Infinity;
  let idx = 0;
  for (let i = 0; i < routePoints.length; i++) {
    const [pLat, pLng] = routePoints[i];
    const d = (lat - pLat) ** 2 + (lng - pLng) ** 2;
    if (d < min) {
      min = d;
      idx = i;
    }
  }
  return idx;
}

function updateNavigation(lat, lng) {
  if (!routePoints.length) return;
  const idx = nearestRoutePoint(lat, lng);
  const point = routePoints[idx];
  const navIcon = activeProfile === "foot" ? footIcon : carIcon;
  if (!carMarker) {
    carMarker = L.marker(point, { icon: navIcon, zIndexOffset: 1000 }).addTo(map);
  } else {
    carMarker.setLatLng(point);
  }
  map.panTo(point);

  const stepInfo = findNextStep(idx);
  if (stepInfo && stepInfo.index !== lastNavStepIndex) {
    lastNavStepIndex = stepInfo.index;
    const text = instructionFor(stepInfo.step);
    $("turnText").textContent = text;
    $("turnIcon").textContent = stepInfo.step.maneuver?.modifier?.includes("right") ? "➡" : stepInfo.step.maneuver?.modifier?.includes("left") ? "⬅" : "↑";
    announce(text);
  }

  if (idx >= routePoints.length - 1) {
    setStatus("Arrived!");
    announce("You have arrived");
    $("nextTurn").hidden = true;
    $("startNavBtn").disabled = false;
    $("stopNavBtn").disabled = true;
    isNavigating = false;
  }
}

function startNavigation() {
  if (!routePoints.length) return;
  if (navInterval) clearInterval(navInterval);
  isNavigating = true;
  lastNavStepIndex = -1;
  $("nextTurn").hidden = false;
  $("startNavBtn").disabled = true;
  $("stopNavBtn").disabled = false;
  if (!watchId) startTracking();
  if (currentLatLng) updateNavigation(currentLatLng[0], currentLatLng[1]);
  setStatus("Navigation started — follow the route");
}

function stopNavigation() {
  if (navInterval) {
    clearInterval(navInterval);
    navInterval = null;
  }
  isNavigating = false;
  $("startNavBtn").disabled = false;
  $("stopNavBtn").disabled = true;
  $("nextTurn").hidden = true;
  setStatus("Navigation stopped");
}

$("locateBtn").addEventListener("click", locateMe);
$("searchBtn").addEventListener("click", searchDestination);
$("routeBtn").addEventListener("click", getRoute);
$("startNavBtn").addEventListener("click", startNavigation);
$("stopNavBtn").addEventListener("click", stopNavigation);
$("trackToggle").addEventListener("click", toggleTracking);
$("centerMeBtn").addEventListener("click", centerOnMe);
$("destination").addEventListener("input", debounce(updateSuggestions, 400));
$("destination").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    searchDestination();
  }
});

const urlParams = new URLSearchParams(location.search);
const destLat = urlParams.get('lat');
const destLng = urlParams.get('lng');
const destAddress = urlParams.get('address');

if (destLat && destLng) {
  const lat = parseFloat(destLat);
  const lng = parseFloat(destLng);
  const name = destAddress || 'Gig location';
  locateMe().finally(() => selectDestination(lat, lng, name));
} else {
  locateMe();
}
