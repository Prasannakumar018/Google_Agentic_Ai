from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
from data_store import SyncedEventStore # Import SyncedEventStore from data_store.py
# If you have other routers in data_store, import them like this:
# from data_store import router as data_store_router 
import os

app = FastAPI()
store = SyncedEventStore()
# app.include_router(data_store_router) # Uncomment if you have other routers to include

@app.get("/")
def root():
    return {"message": "FastAPI backend is running. See /api/{platform}"}

@app.post("/")
def root_post():
    return {"message": "POST not supported on root. Use GET or see /api/{platform}"}

@app.get("/api/{platform}")
def get_events(platform: str, limit: int = Query(20), cursor: str = Query("0")):
    valid = ["twitter", "reddit", "instagram", "eventbrite", "nammasuttu"]
    if platform not in valid:
        return {"error": "Unsupported platform"}

    # Convert cursor to int if possible, else default to 0
    try:
        cursor_int = int(cursor)
    except (ValueError, TypeError):
        cursor_int = 0

    events, next_cursor = store.get_platform_view(platform, limit, cursor_int)

    if platform == "nammasuttu":
        return {
            "reports": events,
            "paging": {"next": str(next_cursor) if next_cursor else None}
        }
    elif platform == "reddit":
        return {"data": {"children": events, "after": str(next_cursor) if next_cursor else None}}
    elif platform == "instagram":
        return {"data": events, "paging": {"next": str(next_cursor) if next_cursor else None}}
    elif platform == "eventbrite":
        return {
            "events": events,
            "pagination": {
                "page_number": cursor_int // limit + 1,
                "page_size": limit,
                "has_more_items": bool(next_cursor)
            }
        }
    elif platform == "twitter":
        # Ensure Twitter's response structure is correct if 'data' is sometimes a list directly
        return {
            "data": events, # 'events' here is already the list of formatted tweets
            "meta": {
                "result_count": len(events),
                "next_token": str(next_cursor) if next_cursor else None
            }
        }

def main():
    import uvicorn
    port = int(os.environ.get("PORT", 8081))
    # reload=True is good for development, but should be False in production
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)

if __name__ == "__main__":
    main()