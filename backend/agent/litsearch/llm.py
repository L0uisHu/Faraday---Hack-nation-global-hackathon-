# litsearch/llm.py

from anthropic import Anthropic
from .config import ANTHROPIC_API_KEY

client = Anthropic(api_key=ANTHROPIC_API_KEY)