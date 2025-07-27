from faker import Faker
import uuid
import random
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

fake = Faker()

# Simple, layman-friendly event titles and descriptions
simple_titles = [
    "Food Festival in Town",
    "Heavy Traffic on Main Road",
    "Rainy Weather Expected",
    "Local Safety Drill Announced",
    "Cultural Dance Show Tonight",
    "Community Event at Park"
]
simple_descriptions = [
    "Come and enjoy delicious food from local vendors.",
    "Expect delays due to traffic congestion.",
    "Carry an umbrella, rain is likely today.",
    "Safety drill for all residents, please participate.",
    "Experience traditional dances and music.",
    "Join your neighbors for fun and games at the park."
]

# List of well-known places/neighborhoods in Bangalore
bangalore_places = [
    "MG Road", "Indiranagar", "Koramangala", "Whitefield", "Jayanagar", "Malleshwaram", "HSR Layout", "BTM Layout", "Electronic City", "Hebbal", "Banashankari", "Rajajinagar", "Basavanagudi", "Ulsoor", "Yelahanka", "Frazer Town", "Vijayanagar", "Richmond Town", "Shivajinagar", "Marathahalli", "KR Puram"
]

POSTGRES_CONFIG = {
    'host': '35.200.252.72',
    'user': 'postgres',
    'password': 'er*Zx2p2Q3sm^{=[',
    'dbname': 'postgres',
    'port': 5432
}

def generate_core_event():
    idx = random.randint(0, len(simple_titles) - 1)
    place = random.choice(bangalore_places)
    city = "Bangalore"
    # Use a random location in Bangalore (approximate lat/lon range)
    latitude = round(random.uniform(12.9, 13.1), 6)
    longitude = round(random.uniform(77.5, 77.7), 6)
    # Make place a natural part of the description
    description = f"{simple_descriptions[idx]} This is happening at {place}, {city}."
    return {
        "event_id": str(uuid.uuid4()),
        "title": simple_titles[idx],
        "description": description,
        "location": f"{place}, {city}",
        "latitude": latitude,
        "longitude": longitude,
        "timestamp": datetime.utcnow().isoformat(),
        "category": random.choice([
            "Event", "Traffic", "Weather", "Food", "Safety", "Culture"
        ])
    }

def generate_shared_events(count=50):
    # Ensure unique events by (title, location, category) and UUID, and also within the requested count
    used_keys = set()
    used_uuids = set()
    events = []
    tries = 0
    while len(events) < count and tries < count * 50:
        event = generate_core_event()
        suffix = str(uuid.uuid4())[:8]
        event['title'] = f"{event['title']} {suffix}"
        event['description'] = f"{event['description']} (ref: {suffix})"
        key = (event['title'], event['location'], event['category'])
        # Ensure no duplicate event_id or key in the current batch
        if event['event_id'] not in used_uuids and key not in used_keys:
            used_uuids.add(event['event_id'])
            used_keys.add(key)
            events.append(event)
        tries += 1
    # Final deduplication in case of any accidental duplicates
    unique_events = []
    seen_ids = set()
    for e in events:
        if e['event_id'] not in seen_ids:
            unique_events.append(e)
            seen_ids.add(e['event_id'])
    return unique_events[:count]

# NOTE: fetch_reports_from_postgres is not used by SyncedEventStore
# It's kept here if you have other uses for it.
def fetch_reports_from_postgres():
    conn = psycopg2.connect(
        host=POSTGRES_CONFIG['host'],
        user=POSTGRES_CONFIG['user'],
        password=POSTGRES_CONFIG['password'],
        dbname=POSTGRES_CONFIG['dbname'],
        port=POSTGRES_CONFIG['port']
    )
    cur = conn.cursor()
    # This query must match your actual 'reports' table schema
    cur.execute("SELECT id, title, description, location, timestamp, category FROM reports")
    rows = cur.fetchall()
    events = []
    for row in rows:
        events.append({
            "event_id": row[0],
            "title": row[1],
            "description": row[2],
            "location": row[3],
            "latitude": float(row[4]),
            "longitude": float(row[5]),
            "timestamp": row[6].isoformat() if hasattr(row[6], 'isoformat') else str(row[6]),
            "category": row[7]
        })
    cur.close()
    conn.close()
    return events

# NOTE: fetch_reports_from_db is the one used by SyncedEventStore for 'nammasuttu'
# This is the function that needs the 'latitude' and 'longitude' columns in 'reports' table.
def fetch_reports_from_db(batch_size=50):
    conn = psycopg2.connect(**POSTGRES_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    # This SELECT statement assumes 'latitude' and 'longitude' columns exist in 'reports'
    cur.execute(f"SELECT id, title, description, location, timestamp, category FROM reports ORDER BY timestamp DESC LIMIT %s", (batch_size,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows