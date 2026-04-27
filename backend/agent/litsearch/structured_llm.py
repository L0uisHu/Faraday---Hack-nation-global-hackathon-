# litsearch/structured_llm.py

import logging
from typing import Type, TypeVar

from pydantic import BaseModel

from .llm import client
from .config import DEFAULT_MODEL

log = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

# Single tool name for all forced-tool-call structured outputs.
# The model never sees this name verbatim in a meaningful way; tool_choice
# pins the call, so it just has to be stable and unique within the request.
_STRUCTURED_TOOL_NAME = "submit_response"


def claude_parse(
    system_prompt: str,
    user_prompt: str,
    response_model: Type[T],
    max_tokens: int = 4096,
) -> T:
    """
    Calls Claude and returns a parsed Pydantic model.

    Uses Anthropic tool-use with a forced tool_choice: the model is
    constrained to invoke `submit_response` whose input_schema is the
    Pydantic JSON schema. The SDK returns the tool input as an already-parsed
    dict, so there is no JSON string to sanitize.
    """

    schema = response_model.model_json_schema()

    message = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=max_tokens,
        temperature=0,
        system=system_prompt,
        tools=[
            {
                "name": _STRUCTURED_TOOL_NAME,
                "description": (
                    f"Submit the structured {response_model.__name__} response. "
                    "Always call this tool exactly once with all required fields."
                ),
                "input_schema": schema,
            }
        ],
        tool_choice={"type": "tool", "name": _STRUCTURED_TOOL_NAME},
        messages=[{"role": "user", "content": user_prompt}],
    )

    for block in message.content:
        if (
            getattr(block, "type", None) == "tool_use"
            and getattr(block, "name", None) == _STRUCTURED_TOOL_NAME
        ):
            return response_model.model_validate(block.input)

    raise ValueError(
        f"Claude did not invoke {_STRUCTURED_TOOL_NAME}. "
        f"Stop reason: {message.stop_reason}. Content: {message.content}"
    )


def claude_text(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 4096,
) -> str:
    """
    Calls Claude for normal text output.
    """

    message = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=max_tokens,
        temperature=0,
        system=system_prompt,
        messages=[
            {
                "role": "user",
                "content": user_prompt,
            }
        ],
    )

    return message.content[0].text
