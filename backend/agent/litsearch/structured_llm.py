# litsearch/structured_llm.py

import json
from typing import Type, TypeVar

from pydantic import BaseModel

from .llm import client
from .config import DEFAULT_MODEL

T = TypeVar("T", bound=BaseModel)


def _extract_json_payload(text: str) -> str:
    """
    Extract a JSON object from common LLM wrappers.
    """
    cleaned = text.strip()
    if not cleaned:
        raise ValueError("Claude returned an empty response.")

    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError(f"Claude response does not contain a JSON object:\n{text}")

    return cleaned[start : end + 1]


def _repair_json_once(
    original_text: str,
    schema: dict,
    max_tokens: int,
) -> str:
    message = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=max_tokens,
        temperature=0,
        system="You repair invalid JSON. Return only valid JSON.",
        messages=[
            {
                "role": "user",
                "content": f"""
The following JSON is invalid. Fix only syntax and formatting so it becomes valid JSON
that matches this JSON Schema. Do not add markdown or explanations.

JSON Schema:
{json.dumps(schema, indent=2)}

Invalid JSON:
{original_text}

Return only valid JSON.
""",
            }
        ],
    )

    return "".join(
        block.text for block in message.content
        if getattr(block, "type", None) == "text"
    )


def _parse_json_payload(text: str) -> dict:
    payload = _extract_json_payload(text)
    return json.loads(payload)


def _claude_json_message(
    system_prompt: str,
    user_prompt: str,
    schema: dict,
    max_tokens: int,
) -> str:
    message = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=max_tokens,
        temperature=0,
        system=system_prompt,
        messages=[
            {
                "role": "user",
                "content": f"""
Return your answer as valid JSON matching this JSON Schema.

JSON Schema:
{json.dumps(schema, indent=2)}

User input:
{user_prompt}

Important:
- Return only valid JSON.
- Do not wrap the JSON in markdown.
- Do not include explanations outside the JSON.
""",
            }
        ],
    )
    return "".join(
        block.text for block in message.content
        if getattr(block, "type", None) == "text"
    )


def claude_parse(
    system_prompt: str,
    user_prompt: str,
    response_model: Type[T],
    max_tokens: int = 4096,
) -> T:
    """
    Calls Claude and parses the response into a Pydantic model.

    This version uses JSON-schema prompting plus Pydantic validation.
    It is robust enough for a hackathon MVP.
    """

    schema = response_model.model_json_schema()

    last_error: Exception | None = None
    last_response = ""

    for _ in range(2):
        text = _claude_json_message(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            schema=schema,
            max_tokens=max_tokens,
        )
        last_response = text

        try:
            data = _parse_json_payload(text)
            return response_model.model_validate(data)
        except Exception as first_error:
            last_error = first_error

        try:
            repaired_text = _repair_json_once(text, schema, max_tokens=max_tokens)
            last_response = repaired_text
            repaired_data = _parse_json_payload(repaired_text)
            return response_model.model_validate(repaired_data)
        except Exception as repair_error:
            last_error = repair_error

    raise ValueError(
        "Claude did not return valid JSON after retry + repair attempts.\n"
        f"Last error: {last_error}\n"
        f"Last response:\n{last_response}"
    ) from last_error


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