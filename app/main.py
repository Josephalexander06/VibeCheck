from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from datetime import datetime
import uvicorn
from dotenv import load_dotenv
import os
app = FastAPI(title="MoodSync API", version="1.0.0")
import httpx
from fastapi import HTTPException
import base64


load_dotenv()
# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class MoodAnswer(BaseModel):
    answers: List[int]

class BookSearch(BaseModel):
    query: str
    mood_filter: Optional[str] = None

# Constants
MOOD_CATEGORIES = {
    'anxious': {
        'name': 'Anxious/Overwhelmed',
        'description': 'Feeling worried, stressed, or overwhelmed',
        'color': 'text-red-500',
        'bg': 'bg-red-50'
    },
    'stressed': {
        'name': 'Stressed/Tired',
        'description': 'Feeling pressured or fatigued',
        'color': 'text-orange-500',
        'bg': 'bg-orange-50'
    },
    'melancholic': {
        'name': 'Melancholic/Reflective',
        'description': 'Feeling contemplative or slightly sad',
        'color': 'text-blue-500',
        'bg': 'bg-blue-50'
    },
    'calm': {
        'name': 'Calm/Peaceful',
        'description': 'Feeling serene and at peace',
        'color': 'text-green-500',
        'bg': 'bg-green-50'
    },
    'upbeat': {
        'name': 'Upbeat/Positive',
        'description': 'Feeling energetic and positive',
        'color': 'text-yellow-500',
        'bg': 'bg-yellow-50'
    },
    'balanced': {
        'name': 'Balanced/Neutral',
        'description': 'Feeling centered and balanced',
        'color': 'text-purple-500',
        'bg': 'bg-purple-50'
    }
}

# MUSIC_PLAYLISTS = {
#     'anxious': [
#         {"name": "Calming Anxiety Relief", "genre": "Ambient/Meditation", "tracks": 25, "description": "Soothing sounds to ease anxious thoughts"},
#         {"name": "Peaceful Mind", "genre": "Classical/Instrumental", "tracks": 30, "description": "Classical pieces for mental clarity"},
#         {"name": "Breathing Space", "genre": "Nature Sounds", "tracks": 20, "description": "Natural soundscapes for relaxation"}
#     ],
#     'stressed': [
#         {"name": "Stress Relief Essentials", "genre": "Chill/Lo-fi", "tracks": 28, "description": "Mellow beats to unwind"},
#         {"name": "Deep Relaxation", "genre": "Spa/Wellness", "tracks": 22, "description": "Therapeutic sounds for deep rest"},
#         {"name": "Tension Release", "genre": "Soft Rock/Acoustic", "tracks": 26, "description": "Gentle melodies to ease stress"}
#     ],
#     'melancholic': [
#         {"name": "Reflective Moments", "genre": "Indie/Alternative", "tracks": 24, "description": "Thoughtful songs for introspection"},
#         {"name": "Emotional Journey", "genre": "Singer-Songwriter", "tracks": 18, "description": "Raw and authentic emotional expression"},
#         {"name": "Gentle Melancholy", "genre": "Ambient/Post-Rock", "tracks": 21, "description": "Beautiful sadness in musical form"}
#     ],
#     'calm': [
#         {"name": "Peaceful Serenity", "genre": "Meditation/Ambient", "tracks": 32, "description": "Pure tranquility in sound"},
#         {"name": "Mindful Moments", "genre": "Instrumental/Piano", "tracks": 27, "description": "Gentle piano for mindfulness"},
#         {"name": "Ocean Breeze", "genre": "Nature/Acoustic", "tracks": 23, "description": "Coastal sounds and soft melodies"}
#     ],
#     'upbeat': [
#         {"name": "Feel Good Hits", "genre": "Pop/Upbeat", "tracks": 35, "description": "Energizing songs to lift your spirits"},
#         {"name": "Happy Vibes", "genre": "Indie Pop/Alternative", "tracks": 29, "description": "Cheerful indie tracks"},
#         {"name": "Energy Boost", "genre": "Electronic/Dance", "tracks": 31, "description": "Uplifting electronic beats"}
#     ],
#     'balanced': [
#         {"name": "Perfect Balance", "genre": "Mixed/Curated", "tracks": 30, "description": "A harmonious mix of genres"},
#         {"name": "Steady Rhythms", "genre": "Alternative/Rock", "tracks": 26, "description": "Consistent, grounding beats"},
#         {"name": "Centered Sounds", "genre": "Jazz/Contemporary", "tracks": 24, "description": "Smooth jazz for balanced mood"}
#     ]
# }

BOOKS_DATABASE = [
    {"id": 1, "title": "The Anxiety and Phobia Workbook", "author": "Edmund Bourne", "category": "Anxiety", "rating": 4.5, "summary": "Practical techniques for managing anxiety and panic.", "mood": "anxious"},
    {"id": 2, "title": "Mindfulness for Beginners", "author": "Jon Kabat-Zinn", "category": "Mindfulness", "rating": 4.7, "summary": "An introduction to mindfulness meditation practice.", "mood": "calm"},
    {"id": 3, "title": "The Stress-Proof Brain", "author": "Melanie Greenberg", "category": "Stress Management", "rating": 4.3, "summary": "Master your emotional response to stress.", "mood": "stressed"},
    {"id": 4, "title": "Feeling Sad: Understanding Depression", "author": "Dr. Sarah Williams", "category": "Mental Health", "rating": 4.2, "summary": "A compassionate guide through sadness and depression.", "mood": "melancholic"},
    {"id": 5, "title": "The Happiness Hypothesis", "author": "Jonathan Haidt", "category": "Positive Psychology", "rating": 4.6, "summary": "Ancient wisdom meets modern psychology.", "mood": "upbeat"},
    {"id": 6, "title": "Emotional Balance", "author": "Roy Martina", "category": "Self-Help", "rating": 4.1, "summary": "Techniques for emotional stability and balance.", "mood": "balanced"},
    {"id": 7, "title": "Calm Your Anxious Mind", "author": "Jeffrey Brantley", "category": "Anxiety", "rating": 4.4, "summary": "Mindfulness and meditation for anxiety relief.", "mood": "anxious"},
    {"id": 8, "title": "The Relaxation Response", "author": "Herbert Benson", "category": "Stress Relief", "rating": 4.3, "summary": "A simple meditation technique to reduce stress.", "mood": "stressed"},
    {"id": 9, "title": "The Power of Now", "author": "Eckhart Tolle", "category": "Spirituality", "rating": 4.5, "summary": "A guide to spiritual enlightenment.", "mood": "calm"},
    {"id": 10, "title": "Reasons to Stay Alive", "author": "Matt Haig", "category": "Mental Health", "rating": 4.4, "summary": "A memoir about overcoming depression.", "mood": "melancholic"},
    {"id": 11, "title": "The Optimistic Child", "author": "Martin Seligman", "category": "Positive Psychology", "rating": 4.2, "summary": "Teaching resilience and optimism.", "mood": "upbeat"},
    {"id": 12, "title": "Emotional Intelligence", "author": "Daniel Goleman", "category": "Psychology", "rating": 4.5, "summary": "Understanding and managing emotions effectively.", "mood": "balanced"}
]

# Utility functions
def calculate_mood(answers: List[int]) -> str:
    """Calculate mood based on assessment answers"""
    avg_score = sum(answers) / len(answers)
    stress_level = answers[1] if len(answers) > 1 else 3
    energy_level = answers[0] if len(answers) > 0 else 3
    
    if stress_level >= 4 and energy_level <= 2:
        return 'anxious'
    elif stress_level >= 3 and energy_level <= 3:
        return 'stressed'
    elif avg_score <= 2.5:
        return 'melancholic'
    elif avg_score >= 4 and stress_level <= 2:
        return 'upbeat'
    elif avg_score >= 3.5 and stress_level <= 2:
        return 'calm'
    else:
        return 'balanced'

# API Routes
@app.get("/")
async def root():
    return {"message": "MoodSync API is running!", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/mood/analyze")
async def analyze_mood(mood_data: MoodAnswer):
    """Analyze mood based on assessment answers"""
    try:
        await asyncio.sleep(0.5)  # Simulate processing
        mood = calculate_mood(mood_data.answers)
        category = MOOD_CATEGORIES[mood]
        
        return {
            "mood": mood,
            "category_name": category["name"],
            "description": category["description"],
            "color": category["color"],
            "bg_color": category["bg"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing mood: {str(e)}")

@app.get("/mood/categories")
async def get_mood_categories():
    """Get all available mood categories"""
    return MOOD_CATEGORIES


CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

SPOTIFY_TOKEN = None

async def get_spotify_token():
    """Get a new Spotify access token using Client Credentials Flow"""
    global SPOTIFY_TOKEN
    
    if not CLIENT_ID or not CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Spotify credentials not configured. Please check your .env file."
        )
    
    auth_str = f"{CLIENT_ID}:{CLIENT_SECRET}"
    b64_auth = base64.b64encode(auth_str.encode()).decode()
    
    # Configure client with timeout and IPv4
    async with httpx.AsyncClient(
        transport=httpx.AsyncHTTPTransport(local_address="0.0.0.0"),
        timeout=30.0
    ) as client:
        try:
            r = await client.post(
                "https://accounts.spotify.com/api/token",
                headers={
                    "Authorization": f"Basic {b64_auth}",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data={"grant_type": "client_credentials"},
            )
            
            if r.status_code != 200:
                error_msg = f"Failed to get Spotify token. Status: {r.status_code}"
                try:
                    error_data = r.json()
                    if "error" in error_data:
                        error_msg += f". Error: {error_data['error']}"
                except:
                    pass
                raise HTTPException(status_code=500, detail=error_msg)
                
            data = r.json()
            SPOTIFY_TOKEN = data["access_token"]
            return SPOTIFY_TOKEN
            
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Network error while connecting to Spotify: {str(e)}"
            )
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=500,
                detail="Connection to Spotify timed out. Please try again."
            )


@app.get("/music/tracks/{mood}")
async def get_tracks_by_mood(mood: str):
    global SPOTIFY_TOKEN

    if not SPOTIFY_TOKEN:
        SPOTIFY_TOKEN = await get_spotify_token()

    async with httpx.AsyncClient() as client:
        url = "https://api.spotify.com/v1/search"
        params = {"q": mood, "type": "track", "limit": 4}  # fetch 4 songs
        headers = {"Authorization": f"Bearer {SPOTIFY_TOKEN}"}
        r = await client.get(url, headers=headers, params=params)
        # print("Spotify request:", r.url)
        # print("Status:", r.status_code, r.text)

    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail="Error fetching from Spotify")

    data = r.json()
    tracks = []   # not "track"

    for item in data.get("tracks", {}).get("items", []):  # <-- FIXED (plural)
        if not item:
            continue
        tracks.append({
            "id": item.get("id"),
            "name": item.get("name", "Unknown"),
            "artist": ", ".join([artist["name"] for artist in item.get("artists", [])]),
            "albumArt": item.get("album", {}).get("images", [{}])[0].get("url", ""),
            "external_url": item.get("external_urls", {}).get("spotify", "")
        })
    print(tracks)
      # should now show 4 songs
    return {"mood": mood, "tracks": tracks}



@app.get("/books/search")
async def search_books(
    q: Optional[str] = None,
    mood: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50
):
    """Search books by query, mood, or category"""
    await asyncio.sleep(0.8)  # Simulate search delay
    
    results = BOOKS_DATABASE.copy()
    
    if mood:
        results = [book for book in results if book.get("mood") == mood]
    
    if category:
        results = [book for book in results if category.lower() in book.get("category", "").lower()]
    
    if q:
        query = q.lower()
        results = [
            book for book in results
            if (query in book.get("title", "").lower() or 
                query in book.get("author", "").lower() or 
                query in book.get("category", "").lower() or
                query in book.get("mood", "").lower())
        ]
    
    results = results[:limit]
    
    return {
        "query": q,
        "mood_filter": mood,
        "category_filter": category,
        "total_results": len(results),
        "books": results
    }

@app.get("/books/{book_id}")
async def get_book_details(book_id: int):
    """Get details for a specific book"""
    book = next((book for book in BOOKS_DATABASE if book.get("id") == book_id), None)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

@app.get("/books/recommendations/{mood}")
async def get_book_recommendations(mood: str, limit: int = 6):
    """Get book recommendations for a specific mood"""
    if mood not in MOOD_CATEGORIES:
        raise HTTPException(status_code=404, detail="Mood category not found")
    
    await asyncio.sleep(0.5)
    recommendations = [book for book in BOOKS_DATABASE if book.get("mood") == mood][:limit]
    return {"mood": mood, "recommendations": recommendations}

# Run the server
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)