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

    text = "".join(
        block.text for block in message.content
        if getattr(block, "type", None) == "text"
    )

    try:
        payload = _extract_json_payload(text)
        data = json.loads(payload)
    except json.JSONDecodeError:
        repaired_text = _repair_json_once(text, schema, max_tokens=max_tokens)
        try:
            repaired_payload = _extract_json_payload(repaired_text)
            data = json.loads(repaired_payload)
        except json.JSONDecodeError as exc:
            pos = getattr(exc, "pos", None)
            snippet = ""
            if isinstance(pos, int):
                start = max(0, pos - 120)
                end = min(len(repaired_payload), pos + 120)
                snippet = repaired_payload[start:end]
            raise ValueError(
                "Claude did not return valid JSON after repair attempt.\n"
                f"Error: {exc}\n"
                f"Around error:\n{snippet}\n"
                f"Full response:\n{repaired_text}"
            ) from exc

    return response_model.model_validate(data)


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