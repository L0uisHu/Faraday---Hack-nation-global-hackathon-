# litsearch/config.py

import os
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

DEFAULT_MODEL = os.getenv("CLAUDE_MODEL", "claude-opus-4-6")
MAX_RESULTS_PER_QUERY = int(os.getenv("MAX_RESULTS_PER_QUERY", "10"))