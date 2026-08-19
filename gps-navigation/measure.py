import sys
import json
import urllib.request
import urllib.parse

WALKING_SPEED_MPS = 1.34


def geocode(address):
    q = urllib.parse.quote(address)
    url = f'https://nominatim.openstreetmap.org/search?format=json&q={q}&limit=1'
    req = urllib.request.Request(url, headers={'User-Agent': 'MyGPS/1.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode())
    if not data:
        raise ValueError(f'No geocode result for: {address}')
    return float(data[0]['lat']), float(data[0]['lon'])


def route_time(lat1, lon1, lat2, lon2, profile):
    coords = f'{lon1},{lat1};{lon2},{lat2}'
    url = f'https://router.project-osrm.org/route/v1/{profile}/{coords}?overview=false'
    req = urllib.request.Request(url, headers={'User-Agent': 'MyGPS/1.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode())
    if data.get('code') != 'Ok' or not data.get('routes'):
        raise ValueError(f'No {profile} route found')
    route = data['routes'][0]
    distance_m = route['distance']
    if profile == 'foot':
        duration_s = distance_m / WALKING_SPEED_MPS
    else:
        duration_s = route['duration']
    return distance_m, duration_s


def main():
    if len(sys.argv) < 3:
        print('Usage: python3 measure.py "origin address" "destination address"')
        print('   or: python3 measure.py lat1 lon1 lat2 lon2')
        return

    if len(sys.argv) == 3:
        try:
            lat1, lon1 = geocode(sys.argv[1])
            lat2, lon2 = geocode(sys.argv[2])
        except ValueError as e:
            print(e)
            return
    elif len(sys.argv) == 5:
        lat1, lon1, lat2, lon2 = map(float, sys.argv[1:5])
    else:
        print('Invalid arguments')
        return

    print(f'Origin:      {lat1}, {lon1}')
    print(f'Destination: {lat2}, {lon2}\n')

    for profile, name in [('driving', 'Driving'), ('foot', 'Walking')]:
        try:
            dist, dur = route_time(lat1, lon1, lat2, lon2, profile)
            print(f'{name}:')
            print(f'  Distance: {dist:.0f} m ({dist/1609.34:.2f} mi)')
            print(f'  Time:     {dur/60:.1f} min')
        except Exception as e:
            print(f'{name}: {e}')


if __name__ == '__main__':
    main()
