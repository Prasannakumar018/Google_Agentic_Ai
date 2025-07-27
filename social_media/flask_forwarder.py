import os
from flask import Flask, request, jsonify
import threading
import time
import requests

app = Flask(__name__) # Corrected: Use __name__

# List of platform names
platforms = ["instagram", "reddit", "twitter", "eventbrite", "nammasuttu"]
rotation_index = 0

# Cursors for each platform, initialized to "0" (as expected by FastAPI)
platform_cursors = {platform: "0" for platform in platforms}

def rotate_requests():
    """
    Periodically fetches data from the FastAPI backend for each platform
    and forwards it to the local /agent endpoint.
    Correctly updates the cursor for pagination.
    """
    while True:
        for platform in platforms:
            cursor = platform_cursors.get(platform, "0") # Get current cursor, default to "0"
            
            # Skip if no more data for this platform (cursor is None)
            if cursor is None:
                print(f"--- No more data for {platform}. Skipping this platform in rotation. ---")
                continue

            try:
                fastapi_url = f"http://127.0.0.1:8000/api/{platform}"
                params = {"limit": 2, "cursor": cursor}
                print(f"Attempting GET {fastapi_url} with params: {params}")
                response = requests.get(fastapi_url, params=params)

                if response.ok:
                    data = response.json()
                    print(f"Successfully received data from {platform}. Top-level keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                    
                    # Extract the next cursor based on the platform's response structure
                    next_cursor = None
                    if platform == "reddit":
                        next_cursor = data.get("data", {}).get("after")
                    elif platform == "instagram" or platform == "nammasuttu": # Both use 'paging' -> 'next'
                        next_cursor = data.get("paging", {}).get("next")
                    elif platform == "twitter":
                        next_cursor = data.get("meta", {}).get("next_token")
                    elif platform == "eventbrite":
                        pagination = data.get("pagination", {})
                        current_cursor_val = int(cursor) # cursor represents the start index
                        limit_val = 2 # Hardcoded limit for rotate_requests
                        has_more = pagination.get("has_more_items", False)
                        
                        if has_more:
                            next_cursor = str(current_cursor_val + limit_val)
                        else:
                            next_cursor = None
                    
                    print(f"Next cursor for {platform}: {next_cursor}")
                    
                    # Update cursor for the next request for this platform
                    platform_cursors[platform] = next_cursor
                    
                    # Send the full response data to /agent
                    print(f"POSTing data to http://localhost:8085/agent from {platform}...")
                    requests.post("http://localhost:8085/agent", json=data)
                    print(f"POST to /agent from {platform} complete.")
                else:
                    print(f"Failed to GET /api/{platform}. Status: {response.status_code}, Response: {response.text}")

            except requests.exceptions.ConnectionError:
                print(f"Connection error: Could not connect to FastAPI backend at http://127.0.0.1:8000. Is it running?")
            except Exception as e:
                print(f"Error during request for {platform}: {e}")

            time.sleep(10) # Wait before the next platform request

# /api/<platform> proxy endpoint (optional, not used by rotate_requests directly)
@app.route('/api/<platform>')
def get_platform_data(platform):
    """
    Proxies requests to the FastAPI backend and extracts the relevant data array.
    Note: This endpoint is not used by the `rotate_requests` function directly.
    """
    limit = int(request.args.get("limit", 3)) 
    cursor = request.args.get("cursor", "0")
    try:
        api_response = requests.get(
            f"http://127.0.0.1:8000/api/{platform}",
            params={"limit": limit, "cursor": cursor}
        )
        api_response.raise_for_status() # Raise an exception for bad status codes
        full_response = api_response.json()
        
        # Determine which key holds the main data array based on platform's FastAPI response
        data_to_return = []
        if platform == "reddit":
            data_to_return = full_response.get("data", {}).get("children", [])
        elif platform == "instagram":
            data_to_return = full_response.get("data", [])
        elif platform == "twitter":
            # Twitter's 'data' array is nested under a 'data' key if the top-level 'data' is a dict
            if isinstance(full_response.get("data"), dict):
                data_to_return = full_response["data"].get("data", [])
            else: # If top-level 'data' is already the list (unlikely based on current setup)
                data_to_return = full_response.get("data", [])
        elif platform == "nammasuttu":
            data_to_return = full_response.get("reports", []) # Correctly get 'reports' for nammasuttu
        elif platform == "eventbrite":
            data_to_return = full_response.get("events", [])
        
        return jsonify(data_to_return)
    except requests.exceptions.RequestException as e:
        print(f"Error proxying to real API for {platform}: {e}")
        return jsonify({"error": f"Failed to fetch data from backend: {e}"}), 500
    
    
# /agent POST receiver
@app.route('/agent', methods=["POST"])
def agent():
    """
    Receives POST requests from `rotate_requests` and processes the data.
    """
    payload = request.json
    print("Data received at /agent:", payload)
    
    # Extract the relevant data array based on the expected structure of the *full response*
    # that `rotate_requests` sends.
    
    data_array_to_process = []
    if payload:
        if "reports" in payload: # Nammasuttu
            data_array_to_process = payload["reports"]
        elif "data" in payload and isinstance(payload["data"], list): # Instagram
            data_array_to_process = payload["data"]
        elif "data" in payload and isinstance(payload["data"], dict) and "children" in payload["data"]: # Reddit
            data_array_to_process = payload["data"]["children"]
        elif "data" in payload and isinstance(payload["data"], dict) and "meta" in payload["data"]: # Twitter
            data_array_to_process = payload["data"].get("data", []) # Twitter's actual tweets are here
        elif "events" in payload: # Eventbrite
            data_array_to_process = payload["events"]
        else:
            print(f"Warning: Unexpected payload structure received by /agent: {list(payload.keys()) if isinstance(payload, dict) else payload}")

    print("Forwarding only 'data' array (processed by /agent):", data_array_to_process)
    # Add your logic here to process `data_array_to_process`
    # For example, store it in a database, perform analysis, etc.
    
    return jsonify({"status": "received", "data_length": len(data_array_to_process)})


if __name__ == '__main__':
    # Start the Flask app in a background thread so it can receive requests
    server_thread = threading.Thread(target=lambda: app.run(port=8085, use_reloader=False, use_debugger=False), daemon=True)
    server_thread.start()
    time.sleep(1) # Give the server a moment to start

    # Start the data rotation in a separate daemon thread to run continuously
    rotation_thread = threading.Thread(target=rotate_requests, daemon=True)
    rotation_thread.start()
    
    # Keep the main thread alive indefinitely so daemon threads can continue running
    try:
        while True:
            time.sleep(1) # Sleep to prevent busy-waiting and consume less CPU
    except KeyboardInterrupt:
        print("\nFlask app and data rotation stopped by user.")
    except Exception as e:
        print(f"An unexpected error occurred in the main thread: {e}")