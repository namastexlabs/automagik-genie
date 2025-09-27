# Building a Moviefone-style Theater Assistant

> Create a voice agent that helps users find movie showtimes across Canada.

In this recipe, build a voice agent that helps users find movies playing in theaters across Canada. This recipe focuses on how to parse user questions, fetch data via an API, and present showtime info in a clear format.

## Prerequisites

To complete this guide, you need to:

1. Set up a LiveKit server
2. Install the LiveKit Agents Python package
3. Create a Movie API client (for this example)

## Setting up the Movie API client

This example uses a custom API client (MovieAPI) to fetch movie information. You can see an example in the [MovieAPI Class](https://github.com/ShayneP/Moviefone/blob/main/movie_api.py). First, import the necessary libraries:

```python
from __future__ import annotations
from typing import Annotated
from pydantic import Field

import logging
from dotenv import load_dotenv
from movie_api import MovieAPI

from livekit.agents import (
    JobContext,
    WorkerOptions,
    cli,
)
from livekit.agents.llm import function_tool
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import cartesia, deepgram, openai, silero

from datetime import datetime

```

## Creating the Movie Assistant Agent

Next, create a class that extends the `Agent` base class:

```python
class MovieAssistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="You are an assistant who helps users find movies showing in Canada. "
            f"Today's date is {datetime.now().strftime('%Y-%m-%d')}. "
            "You can help users find movies for specific dates - if they use relative terms like 'tomorrow' or "
            "'next Friday', convert those to YYYY-MM-DD format based on today's date. Don't check anything "
            "unless the user asks. Only give the minimum information needed to answer the question the user asks.",
        )

    async def on_enter(self) -> None:
        self._movie_api = self.session.userdata["movie_api"]
        await self.session.generate_reply(
            instructions="Greet the user. Then, ask them which movie they'd like to see and which city and province they're in."
        )

```

## Implementing the movie search function

Now, add a method to the `MovieAssistant` class that fetches and formats movie information:

```python
    @function_tool()
    async def get_movies(
        self,
        location: Annotated[
            str, Field(description="The city to get movie showtimes for")
        ],
        province: Annotated[
            str,
            Field(
                description="The province/state code (e.g. 'qc' for Quebec, 'on' for Ontario)"
            ),
        ],
        show_date: Annotated[
            str,
            Field(
                description="The date to get showtimes for in YYYY-MM-DD format. If not provided, defaults to today."
            ),
        ] = None,
    ):
        """Called when the user asks about movies showing in theaters. Returns the movies showing in the specified location for the given date."""
        try:
            target_date = (
                datetime.strptime(show_date, "%Y-%m-%d")
                if show_date
                else datetime.now()
            )
            theatre_movies = await self._movie_api.get_movies(
                location, province, target_date
            )
            
            if len(theatre_movies.theatres) == 0:
                return f"No movies found for {location}, {province}."

            output = []
            for theatre in theatre_movies.theatres:
                output.append(f"\n{theatre['theatre_name']}")
                output.append("-------------------")
                
                for movie in theatre["movies"]:
                    showtimes = ", ".join(
                        [
                            f"{showtime.start_time.strftime('%I:%M %p').lstrip('0')}"
                            + (
                                " (Sold Out)"
                                if showtime.is_sold_out
                                else f" ({showtime.seats_remaining} seats)"
                            )
                            for showtime in movie.showtimes
                        ]
                    )

                    output.append(f"• {movie.title}")
                    output.append(f"  Genre: {movie.genre}")
                    output.append(f"  Rating: {movie.rating}")
                    output.append(f"  Runtime: {movie.runtime} mins")
                    output.append(f"  Showtimes: {showtimes}")
                    output.append("")

                output.append("-------------------\n")

            return "\n".join(output)
        except Exception as e:
            return f"Sorry, I couldn't get the movie listings for {location}. Please check the city and province/state names and try again."

```

The `@function_tool()` decorator exposes this method to the language model, enabling it to call this function when users ask about movies.

## Setting up the agent session

Finally, create the entrypoint function to initialize and run the agent:

```python
load_dotenv()
logger = logging.getLogger("movie-finder")
logger.setLevel(logging.INFO)


async def entrypoint(ctx: JobContext):
    logger.info(f"connecting to room {ctx.room.name}")

    userdata = {"movie_api": MovieAPI()}
    session = AgentSession(
        userdata=userdata,
        stt=deepgram.STT(),         # Speech-to-Text
        llm=openai.LLM(),           # Large Language Model
        tts=cartesia.TTS(),         # Text-to-Speech
        vad=silero.VAD.load(),      # Voice Activity Detection
    )

    await session.start(agent=MovieAssistant(), room=ctx.room)

    logger.info("agent started")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )

```

## Example interactions

Users might say things like:

- "What movies are playing in Toronto?"
- "Show me showtimes in Montreal for tomorrow."
- "Are there any action movies in Vancouver this weekend?"

The agent:

1. Parses the user's request.
2. Figures out what info might be missing (city, province, or date).
3. Fetches and formats the showtimes.
4. Speaks the result.

For the full example, see the [Moviefone repository](https://github.com/ShayneP/Moviefone).

---

This document was rendered at 2025-09-27T09:36:46.148Z.
For the latest version of this document, see [https://docs.livekit.io/recipes/moviefone.md](https://docs.livekit.io/recipes/moviefone.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).