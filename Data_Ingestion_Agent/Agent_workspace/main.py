from vertexai.preview.reasoning_engines import AdkApp
from .data_ingestion_agent.agent import root_agent

import vertexai

vertexai.init(
    project="omega-baton-467115-p2",
    location="us-central1",
    staging_bucket="gs://data_ingestion_agent",
)



app = AdkApp(agent=root_agent)
for event in app.stream_query(
    user_id="USER_ID",
    message="What can you do for me ",
):
    print(event)