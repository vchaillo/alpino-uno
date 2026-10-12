"""Adapt F1DB circuit statistics and Jules Roy's circuit SVG layouts."""
from collections import Counter
import gzip
import json
from pathlib import Path
import xml.etree.ElementTree as ET

def generate_circuits(root, read, svg_archive, release, through):
    svg_files = {Path(name).stem: name for name in svg_archive.namelist() if '/circuits/minimal/white/' in name and name.endswith('.svg')}
    drawings = {}
    for identifier, filename in svg_files.items():
        svg = ET.fromstring(svg_archive.read(filename))
        paths = []
        def collect(element, transforms=()):
            transforms = transforms + ((element.attrib['transform'],) if 'transform' in element.attrib else ())
            if element.tag.rsplit('}', 1)[-1] == 'path' and 'd' in element.attrib:
                paths.append({'d':element.attrib['d'], 'transform':' '.join(transforms)})
            for child in element:
                collect(child, transforms)
        collect(svg)
        assert paths, f'Unsupported SVG: {identifier}'
        drawings[identifier] = {'viewBox': svg.get('viewBox', f"0 0 {svg.get('width','500')} {svg.get('height','500')}"), 'paths': paths}
    # Sirius is the renamed Sochi Autodrom; both datasets describe the same layout.
    if 'sochi-1' in drawings:
        drawings['sirius-1'] = drawings['sochi-1']
    countries = {country['id']: country for country in read('countries')}
    drivers = {driver['id']: driver for driver in read('drivers')}
    constructors = {row['id']: row for row in read('constructors')}
    results = read('races-race-results')
    completed_ids = {result['raceId'] for result in results}
    races = read('races')
    layouts = read('circuits-layouts')
    circuits = []
    for circuit in read('circuits'):
        events = [race for race in races if race['circuitId'] == circuit['id'] and race['id'] in completed_ids]
        event_ids = {race['id'] for race in events}
        wins = Counter(result['driverId'] for result in results if result['raceId'] in event_ids and result['positionNumber'] == 1)
        winning_teams = {}
        for result in sorted(results, key=lambda row: (row['year'], row['round'])):
            if result['raceId'] in event_ids and result['positionNumber'] == 1:
                constructor = constructors[result['constructorId']]
                winning_teams[result['driverId']] = {'id': constructor['id'], 'name': constructor['name']}
        used_layouts = []
        for layout in layouts:
            if layout['circuitId'] != circuit['id']:
                continue
            layout_races = [race for race in races if race['circuitLayoutId'] == layout['id']]
            if not layout_races:
                continue
            used_layouts.append({**layout, 'firstYear': min(race['year'] for race in layout_races), 'lastYear': max(race['year'] for race in layout_races), 'drawing': drawings.get(layout['id'])})
        country = countries[circuit['countryId']]
        circuits.append({**circuit, 'country': country['name'], 'countryCode': country['alpha2Code'], 'firstF1': min((race['year'] for race in events), default=None), 'lastF1': max((race['year'] for race in events), default=None), 'raceCount': len(events), 'layouts': used_layouts, 'events': [{'year':race['year'], 'round':race['round'], 'layoutId':race['circuitLayoutId'], 'date':race['date']} for race in races if race['circuitId'] == circuit['id']], 'winners': [{'id':identifier, 'name':drivers[identifier]['name'], 'countryCode':countries[drivers[identifier]['nationalityCountryId']]['alpha2Code'], 'wins':count, 'team':winning_teams.get(identifier)} for identifier,count in sorted(wins.items(),key=lambda item:(-item[1],drivers[item[0]]['name']))]})
    assert len(circuits) >= 75
    assert all(layout['drawing'] for circuit in circuits for layout in circuit['layouts']), 'A circuit layout is missing its verified outline'
    snapshot = {'version':release['tag_name'], 'through':through, 'license':'CC BY 4.0', 'mapCredit':'Jules Roy / F1DB', 'circuits':circuits}
    (root/'data'/'circuits.json.gz').write_bytes(gzip.compress(json.dumps(snapshot,ensure_ascii=False,separators=(',',':')).encode(),mtime=0))
    print(f"Circuits: {len(circuits)}, verified layouts: {sum(len(circuit['layouts']) for circuit in circuits)}")
