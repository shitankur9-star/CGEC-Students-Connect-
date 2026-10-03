import os
import sys
import webbrowser
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from database import db
from seed_data import seed_cgec_data

app = FastAPI(title="CGEC Dating Platform", description="Cooch Behar Government Engineering College Dating & Social Feed Platform")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed database on startup (disabled for clean platform)
seed_cgec_data(force=False)

@app.post("/api/admin/clear")
def clear_database():
    db.clear_all()
    return {"status": "success", "message": "Database cleared successfully"}

# Ensure uploads directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Auto response quotes for interactive demo chat bot
DEMO_RESPONSES = {
    "usr_priya": [
        "Hey! Great to hear from you! How's your semester going?",
        "Haha that's awesome! I'm currently working on a python project in the lab 💻",
        "Let me know when you're near the canteen, let's grab coffee! ☕",
        "Really? That sounds so interesting! Tell me more ✨"
    ],
    "usr_ananya": [
        "Hey there! Thanks for matching! 😊",
        "Our robotics team is preparing for tech fest! What are your hobbies?",
        "North Bengal sunsets are the best, isn't it? 🌇",
        "Super cool! Let's hang out at the campus garden soon!"
    ],
    "usr_rohit": [
        "Hey! Thanks for connecting! ⚽",
        "We're having a football practice match today. You should come watch!",
        "Coding & music are my favorite stress busters. What kind of music do you listen to?",
        "Sounds like a plan! See you around the campus block!"
    ]
}
demo_response_index = {}

# --- API Endpoints ---

@app.post("/api/auth/register")
def register(
    name: str = Form(...),
    gender: str = Form(...), # Boy or Girl
    looking_for: str = Form(...), # Girl, Boy, Everyone
    age: int = Form(...),
    department: str = Form(...),
    year: str = Form(...),
    bio: str = Form(""),
    avatar: str = Form(""),
    instagram: str = Form("")
):
    user_data = {
        "name": name,
        "gender": gender,
        "looking_for": looking_for,
        "age": age,
        "department": department,
        "year": year,
        "bio": bio,
        "avatar": avatar if avatar else ("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80" if gender == "Girl" else "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80"),
        "photos": [avatar] if avatar else [],
        "instagram": instagram,
        "location": f"{department} Block, CGEC",
        "status": "Online",
        "interests": ["CGEC Life", "Engineering", "Music", "Coffee"]
    }
    new_user = db.create_user(user_data)
    return {"status": "success", "user": new_user}

@app.post("/api/auth/login")
def login(user_id: str = Form(...)):
    user = db.get_user_by_id(user_id)
    if not user:
        # Try matching by name
        for uid, u in db.users.items():
            if u["name"].lower() == user_id.lower():
                user = u
                break
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "user": user}

@app.get("/api/users/all")
def get_all_users():
    return list(db.users.values())

@app.get("/api/users/{user_id}")
def get_user_profile(user_id: str):
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Add user's posts
    user_posts = [p for p in db.posts if p["user_id"] == user_id]
    return {"user": user, "posts": user_posts}

@app.get("/api/discover")
def get_discover_cards(user_id: str):
    candidates = db.get_discover_users(user_id)
    return {"candidates": candidates}

@app.post("/api/swipe")
def handle_swipe(from_id: str = Form(...), to_id: str = Form(...), action: str = Form(...)):
    result = db.record_swipe(from_id, to_id, action)
    target_user = db.get_user_by_id(to_id)
    return {
        "is_match": result["is_match"],
        "match": result["match"],
        "target_user": target_user
    }

@app.get("/api/matches")
def get_matches(user_id: str):
    matches = db.get_user_matches(user_id)
    return {"matches": matches}

@app.get("/api/feed")
def get_feed():
    posts = db.get_feed()
    # Also return stories summary
    stories = [
        {"user": u, "has_story": True} for uid, u in list(db.users.items())[:6]
    ]
    return {"posts": posts, "stories": stories}

@app.post("/api/feed/create")
def create_post(
    user_id: str = Form(...),
    caption: str = Form(""),
    image_url: str = Form(""),
    location: str = Form("CGEC Campus")
):
    post_data = {
        "user_id": user_id,
        "caption": caption,
        "image_url": image_url if image_url else "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80",
        "location": location,
        "likes": [],
        "comments": []
    }
    new_post = db.create_post(post_data)
    user = db.get_user_by_id(user_id)
    new_post["user"] = user
    return {"status": "success", "post": new_post}

@app.post("/api/feed/like")
def like_post(post_id: str = Form(...), user_id: str = Form(...)):
    res = db.toggle_like_post(post_id, user_id)
    if not res:
        raise HTTPException(status_code=404, detail="Post not found")
    return res

@app.post("/api/feed/comment")
def comment_post(post_id: str = Form(...), user_id: str = Form(...), text: str = Form(...)):
    comment = db.add_comment(post_id, user_id, text)
    if not comment:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"status": "success", "comment": comment}

@app.get("/api/messages/{match_id}")
def get_chat_messages(match_id: str):
    msgs = db.get_messages(match_id)
    return {"messages": msgs}

@app.post("/api/messages/send")
def send_chat_message(
    match_id: str = Form(...),
    sender_id: str = Form(...),
    text: str = Form(""),
    image: str = Form("")
):
    msg = db.send_message(match_id, sender_id, text, image)
    if not msg:
        raise HTTPException(status_code=400, detail="Could not send message")

    # Auto reply trigger if chatting with a seed demo profile
    receiver_id = msg["receiver_id"]
    if receiver_id in DEMO_RESPONSES:
        idx = demo_response_index.get(receiver_id, 0)
        bot_text = DEMO_RESPONSES[receiver_id][idx % len(DEMO_RESPONSES[receiver_id])]
        demo_response_index[receiver_id] = idx + 1
        
        # Send simulated response from demo profile
        db.send_message(match_id, receiver_id, bot_text)

    return {"status": "success", "message": msg}

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    import uuid
    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    if not ext:
        ext = ".jpg"
    filename = f"img_{uuid.uuid4().hex[:10]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
        
    url = f"/static/uploads/{filename}"
    return {"url": url}

@app.post("/api/users/update_avatar")
def update_user_avatar(user_id: str = Form(...), avatar_url: str = Form(...)):
    user = db.update_user(user_id, {"avatar": avatar_url})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "user": user}

# Serve static directory
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static")), name="static")

@app.get("/")
def read_root():
    return FileResponse(os.path.join(os.path.dirname(__file__), "static", "index.html"))

if __name__ == "__main__":
    port = 8000
    print(f"\n========================================================")
    print(f"  *** CGEC DATING PLATFORM IS RUNNING NOW! ***")
    print(f"  Access in your browser: http://localhost:{port}")
    print(f"========================================================\n")
    
    # Auto open browser
    try:
        webbrowser.open(f"http://localhost:{port}")
    except Exception:
        pass

    uvicorn.run(app, host="127.0.0.1", port=port)
