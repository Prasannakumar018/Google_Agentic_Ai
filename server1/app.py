from flask import Flask, request, jsonify
import threading
import time
import requests
import os

try:
    from vertexai.preview import agent as agent_engines
except ImportError:
    agent_engines = None
    print("WARNING: vertexai.preview.agent could not be imported. Vertex AI agent functionality will be disabled.")

app = Flask(__name__)

platforms = ["instagram", "reddit", "twitter", "eventbrite", "nammasuttu"]
platform_cursors = {platform: "0" for platform in platforms}

# Your deployed FastAPI backend base URL
FASTAPI_BASE_URL = "http://localhost:8081/api"

# Global control for the background thread
rotation_thread = None
rotation_running = False

def rotate_requests_loop():
    global rotation_running
    rotation_running = True
    while rotation_running:
        for platform in platforms:
            if not rotation_running:
                break
            cursor = platform_cursors.get(platform, "0")
            if cursor is None:
                print(f"--- No more data for {platform}. Skipping. ---")
                continue
            try:
                fastapi_url = f"{FASTAPI_BASE_URL}/{platform}"
                params = {"limit": 2, "cursor": cursor}
                print(f"GET {fastapi_url} with params: {params}")
                response = requests.get(fastapi_url, params=params)
                if response.ok:
                    data = response.json()
                    next_cursor = None
                    if platform == "reddit":
                        next_cursor = data.get("data", {}).get("after")
                    elif platform == "instagram":
                        next_cursor = data.get("paging", {}).get("next")
                    elif platform == "twitter":
                        next_cursor = data.get("meta", {}).get("next_token")
                    elif platform == "eventbrite":
                        current_cursor_val = int(cursor)
                        has_more = data.get("pagination", {}).get("has_more_items", False)
                        next_cursor = str(current_cursor_val + 2) if has_more else None
                    elif platform == "nammasuttu":
                        next_cursor = data.get("paging", {}).get("next")
                        if not data.get("reports") and next_cursor is None:
                            print(f"{platform}: No reports and no next cursor. Done.")
                    platform_cursors[platform] = next_cursor
                    print(f"{platform} → Next cursor: {next_cursor}")
                    print(f"→ POSTing to /agent from {platform}")
                    print(f"POST body: {data}")
                    requests.post("http://localhost:8081", json=data)
                else:
                    print(f"ERROR: {platform} GET failed: {response.status_code} - {response.text}")
            except requests.exceptions.ConnectionError:
                print(f"Connection error to FastAPI backend at {fastapi_url}")
            except Exception as e:
                print(f"Exception for {platform}: {e}")
            time.sleep(10)

@app.route('/api/<platform>')
def proxy_platform(platform):
    limit = int(request.args.get("limit", 3))
    cursor = request.args.get("cursor", "0")
    try:
        fastapi_url = f"{FASTAPI_BASE_URL}/{platform}"
        resp = requests.get(fastapi_url, params={"limit": limit, "cursor": cursor})
        resp.raise_for_status()
        full_data = resp.json()

        if platform == "reddit":
            return jsonify(full_data.get("data", {}).get("children", []))
        elif platform in ["instagram", "twitter"]:
            data = full_data.get("data", [])
            if platform == "twitter" and isinstance(data, dict):
                data = data.get("data", [])
            return jsonify(data)
        elif platform == "nammasuttu":
            return jsonify(full_data.get("reports", []))
        elif platform == "eventbrite":
            return jsonify(full_data.get("events", []))
        else:
            return jsonify([])

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/agent', methods=["POST"])
def agent():
    payload = request.json
    print("→ Received at /agent")

    data_array = []
    if payload:
        if isinstance(payload.get("data"), list):
            data_array = payload["data"]
        elif isinstance(payload.get("data"), dict):
            data_array = payload["data"].get("data", [])
        elif "reports" in payload:
            data_array = payload["reports"]
        elif "events" in payload:
            data_array = payload["events"]

    print(f"✓ Processed {len(data_array)} items at /agent.")
    if agent_engines:
        try:
           
            for item in data_array:
                for event in adk_app.stream_query(
                    user_id="098765",
                    session_id="692791831301193728",
                    message=str(item),
                ):
                    print(event)
        except Exception as e:
            print(f"Exception in /agent: {e}")
    else:
        print("Vertex AI agent functionality is not available.")
    return jsonify({"status": "received", "data_length": len(data_array)})

@app.route('/trigger', methods=['POST'])
def trigger_rotation():
    global rotation_thread, rotation_running
    if rotation_thread and rotation_thread.is_alive():
        return jsonify({"status": "already running"}), 400
    rotation_thread = threading.Thread(target=rotate_requests_loop, daemon=True)
    rotation_thread.start()
    return jsonify({"status": "started"})

@app.route('/stop', methods=['POST'])
def stop_rotation():
    global rotation_running
    rotation_running = False
    return jsonify({"status": "stopping"})

if __name__ == '__main__':
    # Do not start the background thread automatically
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port, use_reloader=False)
