"""Create a compact statistics snapshot from the latest public F1DB release."""
import datetime
import io
import gzip
import json
from pathlib import Path
import urllib.request
import zipfile
from refresh_circuits import generate_circuits

ROOT = Path(__file__).resolve().parents[1]

def download(url):
    request = urllib.request.Request(url, headers={"User-Agent": "CalpinoUno/1.1 (github.com/vchaillo/calpino-uno)"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def generate(release, archive, svg_archive=None):
    def read(name):
        return json.loads(archive.read(f"f1db-{name}.json"))
    countries = {row['id']: row for row in read('countries')}
    seasons = read('seasons-drivers')
    results = read('races-race-results')
    completed_ids = {row['raceId'] for row in results}
    completed = [race for race in read('races') if race['id'] in completed_ids]
    last_race = max(completed, key=lambda race: race['date'])
    metrics = ['totalChampionshipWins', 'totalRaceStarts', 'totalRaceWins', 'totalPodiums', 'totalPolePositions', 'totalFastestLaps', 'totalSprintRaceWins', 'totalSprintRaceStarts', 'totalRaceLaps', 'totalGrandSlams', 'totalPoints']
    drivers = []
    for driver in read('drivers'):
        country = countries[driver['nationalityCountryId']]
        rows = [row for row in seasons if row['driverId'] == driver['id']]
        drivers.append({
            'id': driver['id'], 'name': driver['name'], 'firstName': driver['firstName'], 'lastName': driver['lastName'],
            'country': country['name'], 'countryCode': country['alpha2Code'], 'birthDate': driver['dateOfBirth'],
            'bestChampionshipPosition': driver['bestChampionshipPosition'],
            **{key: driver.get(key) for key in metrics},
            'seasons': [{ 'year': row['year'], 'position': row['positionNumber'], **{key: row.get(key) for key in metrics if key != 'totalChampionshipWins'} } for row in rows]
        })
    snapshot = {'source': 'F1DB', 'license': 'CC BY 4.0', 'version': release['tag_name'], 'publishedAt': release['published_at'], 'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'through': last_race['date'], 'drivers': drivers}
    assert len(drivers) > 800, 'Incomplete driver directory'
    hamilton = next(row for row in drivers if row['id'] == 'lewis-hamilton')
    assert hamilton['totalChampionshipWins'] == 7 and hamilton['totalRaceWins'] >= 105
    assert all(row['totalRaceWins'] <= row['totalRaceStarts'] for row in drivers)
    destination = ROOT / 'data' / 'statistics.json.gz'
    destination.parent.mkdir(exist_ok=True)
    destination.write_bytes(gzip.compress(json.dumps(snapshot, ensure_ascii=False, separators=(',', ':')).encode(), mtime=0))
    if svg_archive is None:
        svg_archive = zipfile.ZipFile(io.BytesIO(download("https://codeload.github.com/f1db/f1-circuits-svg/zip/refs/heads/main")))
    generate_circuits(ROOT, read, svg_archive, release, last_race["date"])
    print(f"Statistics: {len(drivers)} drivers, {release['tag_name']}, through {last_race['date']}")

if __name__ == '__main__':
    release = json.loads(download('https://api.github.com/repos/f1db/f1db/releases/latest'))
    asset = next(asset for asset in release['assets'] if asset['name'] == 'f1db-json-splitted.zip')
    generate(release, zipfile.ZipFile(io.BytesIO(download(asset['browser_download_url']))))
