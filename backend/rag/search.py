"""
Internet search module for fetching latest agricultural information,
government schemes, and farming updates.
"""
import os
import requests
import time
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

# SerpAPI for Google search results
SERPAPI_KEY = os.getenv("SERPAPI_KEY")

# News API for agricultural news
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")

# Simple in-memory cache for search results
_search_cache = {}
_cache_ttl = 3600  # Cache results for 1 hour
_last_request_time = 0
_min_request_interval = 2  # Minimum 2 seconds between requests to avoid rate limiting

def _get_cached_result(query: str) -> Optional[List[Dict[str, str]]]:
    """Get cached search result if available and not expired."""
    if query in _search_cache:
        result, timestamp = _search_cache[query]
        if time.time() - timestamp < _cache_ttl:
            return result
        else:
            del _search_cache[query]
    return None

def _cache_result(query: str, result: List[Dict[str, str]]):
    """Cache search result with timestamp."""
    _search_cache[query] = (result, time.time())

def _rate_limit():
    """Ensure minimum interval between requests."""
    global _last_request_time
    current_time = time.time()
    time_since_last = current_time - _last_request_time
    if time_since_last < _min_request_interval:
        time.sleep(_min_request_interval - time_since_last)
    _last_request_time = time.time()


def search_agricultural_info(query: str, num_results: int = 5) -> List[Dict[str, str]]:
    """
    Search for agricultural information using SerpAPI (Google Search).
    Returns a list of search results with title, link, and snippet.
    """
    if not SERPAPI_KEY:
        print("Warning: SERPAPI_KEY not set. Skipping internet search.")
        return []
    
    # Check cache first
    cached = _get_cached_result(query)
    if cached is not None:
        print(f"Using cached search result for: {query[:50]}...")
        return cached
    
    # Rate limiting
    _rate_limit()
    
    try:
        params = {
            "engine": "google",
            "q": f"{query} agriculture farming India",
            "api_key": SERPAPI_KEY,
            "num": num_results,
            "hl": "en",
            "gl": "in"
        }
        
        response = requests.get("https://serpapi.com/search", params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        results = []
        organic_results = data.get("organic_results", [])
        
        for result in organic_results[:num_results]:
            results.append({
                "title": result.get("title", ""),
                "link": result.get("link", ""),
                "snippet": result.get("snippet", ""),
            })
        
        # Cache the result
        _cache_result(query, results)
        
        return results
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 429:
            print("Search warning: Rate limit exceeded (429). Consider upgrading your SerpAPI plan or waiting before retrying.")
        else:
            print(f"Search HTTP error: {e.response.status_code}")
        return []
    except Exception as e:
        print(f"Search error: {type(e).__name__}")
        return []


def search_government_schemes(state: str = "", crop: str = "") -> List[Dict[str, str]]:
    """
    Search for latest government schemes for farmers.
    """
    query = "PM Kisan government scheme farmers subsidy 2024 2025"
    if state:
        query += f" {state}"
    if crop:
        query += f" {crop}"
    
    return search_agricultural_info(query, num_results=5)


def search_crop_prices(crop: str, state: str = "") -> List[Dict[str, str]]:
    """
    Search for latest crop prices and market rates.
    """
    query = f"{crop} mandi price today market rate"
    if state:
        query += f" {state}"
    
    return search_agricultural_info(query, num_results=5)


def search_weather_forecast(state: str, district: str = "") -> List[Dict[str, str]]:
    """
    Search for weather forecast for farming.
    """
    query = f"{state} weather forecast farming agriculture"
    if district:
        query += f" {district}"
    
    return search_agricultural_info(query, num_results=3)


def get_agricultural_news(num_articles: int = 5) -> List[Dict[str, str]]:
    """
    Fetch latest agricultural news using NewsAPI.
    """
    if not NEWSAPI_KEY:
        print("Warning: NEWSAPI_KEY not set. Skipping news fetch.")
        return []
    
    try:
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": "agriculture farming India farmers crops",
            "apiKey": NEWSAPI_KEY,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": num_articles,
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        articles = []
        for article in data.get("articles", []):
            articles.append({
                "title": article.get("title", ""),
                "description": article.get("description", ""),
                "url": article.get("url", ""),
                "publishedAt": article.get("publishedAt", ""),
            })
        
        return articles
    except Exception as e:
        print(f"News API error: {e}")
        return []


def format_search_results_for_llm(results: List[Dict[str, str]]) -> str:
    """
    Format search results into a string for LLM context.
    """
    if not results:
        return ""
    
    formatted = "Internet Search Results:\n"
    for i, result in enumerate(results, 1):
        title = result.get("title", "")
        snippet = result.get("snippet", result.get("description", ""))
        link = result.get("link", result.get("url", ""))
        formatted += f"{i}. {title}\n   {snippet}\n   Source: {link}\n\n"
    
    return formatted


def should_search_internet(query: str) -> bool:
    """
    Determine if a query requires internet search based on keywords.
    """
    search_keywords = [
        # Schemes and subsidies
        "scheme", "yojana", "subsidy", "pm kisan", "government", "sarkar",
        "योजना", "सब्सिडी", "सरकार",
        # News and updates
        "news", "update", "latest", "today", "announcement",
        "समाचार", "अपडेट", "नवीनतम", "आज",
        # Weather
        "weather", "rainfall", "forecast", "mausam",
        "मौसम", "बारिश", "पूर्वानुमान",
        # Market rates
        "market rate", "today price", "current rate", "mandi rate",
        "बाजार भाव", "आज का भाव", "मंडी रेट",
        # General knowledge
        "how to", "best way", "tips", "guide",
        "कैसे", "सर्वोत्तम तरीका", "सुझाव",
    ]
    
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in search_keywords)
