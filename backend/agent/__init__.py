"""Agent seam.

This is the integration point for the real Anthropic-driven planning
agent. The function signature and return shape are frozen — replace
the body, leave everything else alone, and the endpoints in main.py
need a one-line change to start using it.
"""


def generate_plan(hypothesis: str) -> dict:
    """Replaced by teammate with real agent logic. Currently returns mock.

    Returns a dict that conforms to schemas.Plan. The endpoint wraps it
    in `Plan(**generate_plan(req.hypothesis))` for response validation.
    """
    from mocks import MOCK_PLAN  # imported lazily to keep agent/ standalone

    return MOCK_PLAN
