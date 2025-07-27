
# Google Agentic AI Project

This repository contains a multi-component agentic AI system for social media data ingestion, event extraction, and user interface presentation. The project is organized into the following main modules:

---

## 1. agent_feeder

A Flask-based microservice that acts as a feeder/rotator for ingesting data from multiple social media platforms and forwarding it to a FastAPI backend.

- **Key files:**
  - `app.py`: Main Flask app, rotates requests to platforms (Instagram, Reddit, Twitter, Eventbrite, Nammasuttu) and forwards data to the backend.
  - `requirements.txt`: Python dependencies (Flask, Werkzeug, requests).
  - `Dockerfile`: Containerizes the Flask app.

---

## 2. Data_Ingestion_Agent

A Google Vertex AI-based agent for extracting structured event data from social media posts using LLMs and media analysis tools.

- **Agent_workspace/**: Main workspace for the agent.
  - `main.py`: Entry point, initializes Vertex AI and runs the agent.
  - `requirement.txt`: Python dependency (`google-generativeai`).
  - `workspace.ipynb`: Jupyter notebook for experiments.
  - `data_ingestion_agent/`: Agent implementation.
    - `agent.py`: Core agent logic, media download, and analysis.
    - `prompt.py`: Prompt template for the agent.
    - `__init__.py`: Module init.
- **README.md**: (Empty, see this root README for details.)

---

## 3. social_media

A FastAPI backend for storing and serving event data from various social media platforms. Also includes a Flask forwarder and event store logic.

- **Key files:**
  - `app.py`: FastAPI app, exposes `/api/{platform}` endpoints for event data.
  - `core_event_store.py`, `data_store.py`: Event store and data management logic.
  - `flask_forwarder.py`: (If used) Forwards requests between Flask and FastAPI.
  - `requirements.txt`: Python dependencies (FastAPI, Uvicorn, Flask, psycopg2-binary, requests, faker).
  - `Dockerfile`: Containerizes the FastAPI app.
  - `supervisord.conf`: Supervisor config (if needed).

---

## 4. ui

A cross-platform mobile/web UI built with Expo and React Native for visualizing and interacting with the ingested event data.

- **Key files and folders:**
  - `app/`: Main app screens and navigation (feed, profile, login, etc.).
  - `components/`: Reusable UI components (CardStack, LoaderScreen, WebMap, etc.).
  - `assets/`: Fonts and images.
  - `constants/`, `hooks/`, `services/`: App constants, custom hooks, and service logic.
  - `package.json`, `app.json`: Project configuration and dependencies.
  - `README.md`: Expo/React Native usage notes.

---

## How the System Works

1. **agent_feeder** rotates and forwards social media data to the **social_media** FastAPI backend.
2. **Data_Ingestion_Agent** processes posts, extracts structured event data (location, description, time) using LLMs and media analysis, and stores results.
3. **ui** presents the ingested and processed event data to users in a modern, interactive interface.

---

## Setup & Usage

Each module is self-contained and can be built/run via Docker or locally. See each subfolder for details and requirements.

- **agent_feeder**: `python app.py` or use Dockerfile.
- **Data_Ingestion_Agent**: Install requirements and run `main.py`.
- **social_media**: `uvicorn app:app --reload` or use Dockerfile.
- **ui**: `npm install` then `npm start` (requires Node.js and Expo CLI).

---

## License

Some files are under the Apache License 2.0 (see headers). See individual files for details.

---

## Authors & Contributions

- Please see individual files and commit history for contributors.

---

## Notes

- This README provides a high-level overview. For detailed usage, configuration, and development, see the README or documentation in each subfolder.
