import time
import random
import uuid # Needed for event_id generation if not explicitly imported
from datetime import datetime # Needed for timestamp handling
import psycopg2
from psycopg2.extras import RealDictCursor
import threading
from fastapi import APIRouter

# Assuming core_event_store.py is in the same directory
from core_event_store import generate_shared_events as _generate_shared_events_mock
from core_event_store import POSTGRES_CONFIG # Import POSTGRES_CONFIG

class SyncedEventStore:
    def __init__(self):
        self.platform_events = {}  # Cache events per platform
        self.last_generated = {}   # Cache last generated time per platform
        self.lock = threading.Lock()
        self.refresh_events() # Initial refresh
        self._start_periodic_refresh()

    def refresh_events(self, platform=None):
        with self.lock:
            platforms = [platform] if platform else ["twitter", "reddit", "instagram", "eventbrite", "nammasuttu"]
            for plat in platforms:
                if plat == "nammasuttu":
                    self.platform_events[plat] = self.fetch_reports_from_db(50)
                else:
                    # Generate a stable set of mock events for each platform
                    # Use a platform-specific seed to ensure consistency for that platform
                    # We can use a combination of the platform name and a daily "epoch" for fresh data daily
                    current_day_seed = datetime.utcnow().day
                    random.seed(plat + str(current_day_seed))
                    self.platform_events[plat] = _generate_shared_events_mock(50)
                    random.seed()  # Reset seed to avoid affecting other random operations
                self.last_generated[plat] = int(time.time())

    def _start_periodic_refresh(self):
        def periodic():
            while True:
                # Refresh events periodically (e.g., every 5 minutes to get fresh mock data)
                time.sleep(300) # Refresh every 5 minutes
                self.refresh_events()
        t = threading.Thread(target=periodic, daemon=True)
        t.start()

    def fetch_reports_from_db(self, batch_size=50):
        try:
            conn = psycopg2.connect(**POSTGRES_CONFIG)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            # This SELECT statement needs 'latitude' and 'longitude' columns in 'reports' table.
            cur.execute(f"SELECT id, title, description, location, timestamp, category FROM reports ORDER BY timestamp DESC LIMIT %s", (batch_size,))
            rows = cur.fetchall()
            cur.close()
            conn.close()
            return rows
        except Exception as e:
            print(f"Error fetching from database: {e}")
            return []

    def get_platform_view(self, platform, limit=20, cursor=0):
        with self.lock:
            # Retrieve from cache for mock data, or fetch from DB for nammasuttu
            core_events = self.platform_events.get(platform, [])

        if not core_events:
            # If cache is empty for some reason, try to refresh immediately (shouldn't happen often)
            self.refresh_events(platform)
            core_events = self.platform_events.get(platform, [])

        # Apply pagination
        start_index = cursor
        end_index = min(cursor + limit, len(core_events))
        
        paginated_events = core_events[start_index:end_index]
        next_cursor = end_index if end_index < len(core_events) else None

        formatted = [self._format_event(platform, e) for e in paginated_events]
        # Filter out any None or empty dicts if _format_event returns them
        filtered = [f for f in formatted if f]
        return filtered, next_cursor

    def _format_event(self, platform, e):
        # Helper: choose media_url based on description/category
        def get_media_url(event):
            desc = (event.get('description', '') + ' ' + event.get('title', '') + ' ' + event.get('category', '')).lower()
            # Mapping of keywords to media URLs
            keyword_media = [
                (['traffic', 'jam', 'roadblock'], "https://media.wired.com/photos/593256b42a990b06268a9e21/3:2/w_2240,c_limit/traffic-jam-getty.jpg"),
                (['flood', 'waterlogging', 'rain'], "https://cms.accuweather.com/wp-content/uploads/2023/07/Flood_Agnostic-2.png?w=632"),
                (['band', 'music', 'concert', 'live', 'performance'], "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80"),
                (['festival', 'celebration', 'parade'], "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"),
                (['emergency', 'alert', 'evacuate'], "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80"),
                (['meetup', 'gathering', 'networking'], "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80"),
                (['protest', 'strike', 'march'], "https://images.unsplash.com/photo-1468421870903-4df1664ac249?auto=format&fit=crop&w=800&q=80"),
                (['sports', 'sport', 'match', 'game', 'tournament'], "https://7esl.com/wp-content/uploads/2022/08/team-sports.jpg.webp"),
                (['fire', 'blaze', 'burn'], "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80"),
                (['accident', 'crash', 'collision'], "https://akm-img-a-in.tosshub.com/indiatoday/images/story/202503/a-car-collides-with-water-tanker-in-hyderabad-07060782-16x9_0.jpeg?VersionId=GQ.4sE3YKdCGT102yLLRgc2uBFRBTdZ5&size=690:388"),
                (['weather', 'storm', 'cyclone', 'wind'], "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"),
                (['food', 'cuisine', 'restaurant', 'dining'], "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80"),
                (['art', 'exhibition', 'gallery'], "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80"),
                (['theatre', 'play', 'drama'], "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80"),
            ]
            for keywords, url in keyword_media:
                if any(word in desc for word in keywords):
                    return url
            return "https://placehold.co/300"

        # Use both DB and generated keys for compatibility
        event_id = e.get('event_id') or e.get('id')
        title = e.get('title')
        description = e.get('description')
        location = e.get('location')
        latitude = e.get('latitude')
        longitude = e.get('longitude')
        timestamp = e.get('timestamp')
        category = e.get('category')
        # Additional fields that might come from DB but not generated mock
        media = e.get('media')
        truthness_score = e.get('truthnessScore')
        sentiment_rate = e.get('sentimentRate')
        author = e.get('author')
        source = e.get('source')

        # Handle cases where timestamp might be a datetime object from DB
        if isinstance(timestamp, datetime):
            timestamp = timestamp.isoformat()

        # format each core event differently
        if platform == "twitter":
            return {
                "id": event_id,
                "text": f"{title}: {description}",
                "created_at": timestamp,
                "geo": {
                    "coordinates": {
                        "latitude": latitude,
                        "longitude": longitude
                    },
                    "place_name": location
                },
                "user": {
                    "id": f"user_{str(event_id)[-4:]}",
                    "username": f"user{random.randint(1000,9999)}"
                }
            }
        elif platform == "reddit":
            return {
                "data": {
                    "id": event_id,
                    "title": title,
                    "selftext": description,
                    "created_utc": int(time.time()), # Using current time for Reddit as per original
                    "subreddit": "bangalore",
                    "author": f"user_{str(event_id)[-3:]}",
                    "geo": {
                        "lat": latitude,
                        "lng": longitude
                    }
                }
            }
        elif platform == "instagram":
            return {
                "id": event_id,
                "caption": f"{title} #{category.lower() if category else ''}",
                "media_url": get_media_url(e),
                "timestamp": timestamp,
                "location": {
                    "name": location,
                    "latitude": latitude,
                    "longitude": longitude
                },
                "user": {
                    "username": f"insta_{str(event_id)[-4:]}"
                }
            }
        elif platform == "eventbrite":
            return {
                "id": event_id,
                "name": {
                    "text": title
                },
                "description": {
                    "text": description
                },
                "start": {
                    "local": timestamp,
                    "timezone": "Asia/Kolkata"
                },
                "venue": {
                    "address": {
                        "localized_address_display": location,
                        "latitude": latitude,
                        "longitude": longitude
                    }
                }
            }
        # For nammasuttu, return the DB row as-is (or with minimal mapping to expected fields)
        elif platform == "nammasuttu":
            # Ensure mandatory fields are present
            if event_id and title:
                # Map to the sample data format provided, if specific fields are desired
                # Otherwise, just return 'e' if you want all original DB fields
                return {
                    "id": event_id,
                    "category": category,
                    "title": title,
                    "description": description,
                    "location": location,
                    "timestamp": timestamp,
                    "latitude": latitude,  # Assuming these now exist in DB
                    "longitude": longitude, # Assuming these now exist in DB
                    "media": media, # Include media if it exists in your DB row
                    "truthnessScore": truthness_score,
                    "sentimentRate": sentiment_rate,
                    "author": author,
                    "source": source,
                }
            else:
                return None  # Skip events missing required fields
        return None # Return None if platform is not recognized or event cannot be formatted

# APIRouter is typically imported and used if you want to split your FastAPI app into modules.
# For a single file app.py, it's not strictly necessary unless you plan to expand.
# router = APIRouter() # Uncomment if you want to use this for modularization