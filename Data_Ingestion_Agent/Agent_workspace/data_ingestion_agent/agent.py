
"""Academic_Research: Research advice, related literature finding, research area proposals, web knowledge access."""

from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from google.adk.tools.function_tool import FunctionTool

import google.generativeai as genai

from . import prompt

MODEL = "gemini-2.0-flash"


from google import genai
import requests
from io import BytesIO
import mimetypes
from typing import Optional, Tuple
from google.genai.types import HttpOptions, Part

GEMINI_MODEL="gemini-2.0-flash"
client = genai.Client(vertexai="true", project="omega-baton-467115-p2", location="us-central1")


def download_media_from_url(url: str) -> Tuple[Optional[bytes], Optional[str]]:
    """
    Downloads media (image, audio, video) from a URL and returns its bytes and inferred MIME type.
    """
    try:
        response = requests.get(url, stream=True, timeout=30) # Increased timeout for larger files
        response.raise_for_status()
        media_bytes = BytesIO(response.content).read()
        
        # Try to infer MIME type from URL or content
        mime_type, _ = mimetypes.guess_type(url)
        if not mime_type: # Fallback if guess_type fails on URL
            # This is a very basic attempt and might not be accurate for all files.
            # For robust production systems, you might need a more sophisticated content-type detection.
            content_type_header = response.headers.get('Content-Type')
            if content_type_header:
                mime_type = content_type_header.split(';')[0].strip()

        if not mime_type:
            print(f"Warning: Could not infer MIME type for {url}. Defaulting to application/octet-stream.")
            mime_type = "application/octet-stream" # Generic fallback

        return media_bytes, mime_type
    except requests.exceptions.Timeout:
        print(f"Error: Request timed out while downloading media from {url}")
        return None, None
    except requests.exceptions.RequestException as e:
        print(f"Error downloading media from {url}: {e}")
        return None, None
    except Exception as e:
        print(f"An unexpected error occurred while downloading media: {e}")
        return None, None


def analyse_media(media_url: str) -> str:
    """Analyze the media content and return a summary."""
    try:
        contents = []

        media_bytes, mime_type = download_media_from_url(media_url)
        if media_bytes is None:
            return f"Failed to download media from {media_url}."
        
        if mime_type is None:
            return f"Failed to determine MIME type for media from {media_url}."
        
        if mime_type.startswith('image/'):
            # Modified prompt for images to focus on events/actions/key elements concisely
            prompt = (
                "Describe the primary event or key visual elements in this image concisely. "
                "Focus on actions, main subjects, and any prominent features that define the scene. "
                "If location is strongly suggested (e.g., via landmarks, text), include it briefly. "
                "Keep the description to one or two sentences, prioritizing the central action or scene."
                "do not add the image shows the media shows and the audio tells in the begining of summary"
            )
        elif mime_type.startswith('video/'):
            # Modified prompt for videos to focus on main events/narrative
            prompt = (
                "Summarize the main events, key actions, and overall narrative depicted in this video. "
                "Highlight significant visual or auditory elements that contribute to the main happenings. "
                "Keep the summary concise and focused on the sequence of events."
                "do not add the image shows the media shows and the audio tells in the begining of summary"
            )
        elif mime_type.startswith('audio/'):
            # Modified prompt for audio to focus on main events/sounds/speech points
            prompt = (
                "Summarize the primary events, main sounds, and key spoken points present in this audio content. "
                "If speech is dominant, provide a brief summary of the central message or dialogue. "
                "Focus on what is happening or being communicated."
                "do not add the image shows the media shows and the audio tells in the begining of summary"
            )
        print(f"Analyzing media from {media_url} with MIME type {mime_type}...")
        

        media_part = Part.from_bytes(data=media_bytes, mime_type=mime_type)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt, media_part],
        )
        if response is None or not response.text:
            return f"No content generated for media from {media_url}."
        return response.text
    
    except Exception as e:
        return f"Error analyzing media from {media_url}: {e}"




def inset_into_db(location: str, event_description: str, start_time: str):
    """
    Placeholder function to insert data into the database.
    This should be replaced with actual database insertion logic.
    """
    return print(f"Inserting into DB: Location={location}, Event Description={event_description}, Start Time={start_time}")
    # Implement actual DB insertion logic here
data_ingestion_agent = LlmAgent(
    name="data_ingestion_agent",
    model=MODEL,
    description=(
       "A data ingestion agent that analyzes social media posts and extracts relevant information."
       " It utilizes advanced media analysis tools to achieve this."
       " The agent is designed to work with various media types, including images, audio, and video."

    ),
    instruction=prompt.DATA_INGESTION_AGENT_PROMPT,
    tools=[
        FunctionTool(func=analyse_media), 
        FunctionTool(func=inset_into_db)
    ],
    output_key="db_insertion_result"  # Key for the output of the agent,

)

root_agent = data_ingestion_agent