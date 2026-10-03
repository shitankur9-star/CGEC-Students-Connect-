import json
import os
import uuid
from datetime import datetime

DATA_FILE = os.path.join(os.path.dirname(__file__), "cgec_data.json")

class Database:
    def __init__(self):
        self.data_file = DATA_FILE
        self.users = {}
        self.posts = []
        self.stories = []
        self.matches = [] # list of dicts: {"id": str, "user1": str, "user2": str, "timestamp": str}
        self.swipes = []  # list of dicts: {"from": str, "to": str, "action": "like"|"pass"|"superlike"}
        self.messages = [] # list of dicts: {"id": str, "match_id": str, "sender_id": str, "receiver_id": str, "text": str, "image": str, "timestamp": str}
        self.load()

    def load(self):
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.users = data.get("users", {})
                    self.posts = data.get("posts", [])
                    self.stories = data.get("stories", [])
                    self.matches = data.get("matches", [])
                    self.swipes = data.get("swipes", [])
                    self.messages = data.get("messages", [])
            except Exception as e:
                print(f"Error loading DB: {e}")

    def clear_all(self):
        self.users = {}
        self.posts = []
        self.stories = []
        self.matches = []
        self.swipes = []
        self.messages = []
        self.save()

    def save(self):
        data = {
            "users": self.users,
            "posts": self.posts,
            "stories": self.stories,
            "matches": self.matches,
            "swipes": self.swipes,
            "messages": self.messages
        }
        with open(self.data_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    # --- User Methods ---
    def get_user_by_email(self, email):
        for uid, user in self.users.items():
            if user.get("email") == email:
                return user
        return None

    def get_user_by_id(self, user_id):
        return self.users.get(user_id)

    def create_user(self, user_data):
        user_id = str(uuid.uuid4())[:8]
        user_data["id"] = user_id
        user_data["joined_at"] = datetime.now().isoformat()
        if "likes_received" not in user_data:
            user_data["likes_received"] = 0
        if "matches_count" not in user_data:
            user_data["matches_count"] = 0
        self.users[user_id] = user_data
        self.save()
        return user_data

    def update_user(self, user_id, updates):
        if user_id in self.users:
            self.users[user_id].update(updates)
            self.save()
            return self.users[user_id]
        return None

    def get_discover_users(self, current_user_id):
        curr_user = self.get_user_by_id(current_user_id)
        if not curr_user:
            return list(self.users.values())

        # Exclude users already swiped by current user
        swiped_to = set(s["to"] for s in self.swipes if s["from"] == current_user_id)
        swiped_to.add(current_user_id)

        target_gender = curr_user.get("looking_for") # 'Girl', 'Boy', or 'Everyone'
        
        candidates = []
        for uid, u in self.users.items():
            if uid in swiped_to:
                continue
            if target_gender and target_gender != 'Everyone' and u.get("gender") != target_gender:
                continue
            candidates.append(u)
        return candidates

    # --- Swipe & Match Methods ---
    def record_swipe(self, from_id, to_id, action):
        swipe_record = {"from": from_id, "to": to_id, "action": action, "timestamp": datetime.now().isoformat()}
        self.swipes.append(swipe_record)
        
        is_match = False
        match_data = None

        if action in ["like", "superlike"]:
            # Check if target user also liked from_user
            reverse_like = any(s["from"] == to_id and s["to"] == from_id and s["action"] in ["like", "superlike"] for s in self.swipes)
            if reverse_like:
                is_match = True
                match_id = f"match_{min(from_id, to_id)}_{max(from_id, to_id)}"
                existing = next((m for m in self.matches if m["id"] == match_id), None)
                if not existing:
                    match_data = {
                        "id": match_id,
                        "user1": from_id,
                        "user2": to_id,
                        "timestamp": datetime.now().isoformat()
                    }
                    self.matches.append(match_data)
                    # increment match count
                    if from_id in self.users: self.users[from_id]["matches_count"] = self.users[from_id].get("matches_count", 0) + 1
                    if to_id in self.users: self.users[to_id]["matches_count"] = self.users[to_id].get("matches_count", 0) + 1

        self.save()
        return {"is_match": is_match, "match": match_data}

    def get_user_matches(self, user_id):
        user_matches = []
        for m in self.matches:
            if m["user1"] == user_id or m["user2"] == user_id:
                other_id = m["user2"] if m["user1"] == user_id else m["user1"]
                other_user = self.get_user_by_id(other_id)
                if other_user:
                    # Get last message
                    match_msgs = [msg for msg in self.messages if msg["match_id"] == m["id"]]
                    last_msg = match_msgs[-1] if match_msgs else None
                    user_matches.append({
                        "match_id": m["id"],
                        "other_user": other_user,
                        "timestamp": m["timestamp"],
                        "last_message": last_msg
                    })
        # Sort by last message or match timestamp
        user_matches.sort(key=lambda x: x["last_message"]["timestamp"] if x["last_message"] else x["timestamp"], reverse=True)
        return user_matches

    # --- Posts & Feed Methods ---
    def create_post(self, post_data):
        post_id = f"post_{str(uuid.uuid4())[:8]}"
        post = {
            "id": post_id,
            "user_id": post_data["user_id"],
            "caption": post_data.get("caption", ""),
            "image_url": post_data.get("image_url", ""),
            "location": post_data.get("location", "CGEC Campus"),
            "likes": post_data.get("likes", []), # list of user_ids
            "comments": post_data.get("comments", []), # list of {"id", "user_id", "text", "timestamp"}
            "created_at": datetime.now().isoformat()
        }
        self.posts.insert(0, post)
        self.save()
        return post

    def get_feed(self):
        feed_posts = []
        for p in self.posts:
            user = self.get_user_by_id(p["user_id"])
            if user:
                post_copy = dict(p)
                post_copy["user"] = user
                feed_posts.append(post_copy)
        return feed_posts

    def toggle_like_post(self, post_id, user_id):
        for p in self.posts:
            if p["id"] == post_id:
                if user_id in p["likes"]:
                    p["likes"].remove(user_id)
                    liked = False
                else:
                    p["likes"].append(user_id)
                    liked = True
                self.save()
                return {"liked": liked, "likes_count": len(p["likes"])}
        return None

    def add_comment(self, post_id, user_id, text):
        for p in self.posts:
            if p["id"] == post_id:
                user = self.get_user_by_id(user_id)
                comment = {
                    "id": f"comm_{str(uuid.uuid4())[:6]}",
                    "user_id": user_id,
                    "user_name": user.get("name", "Student") if user else "Student",
                    "user_avatar": user.get("avatar", "") if user else "",
                    "text": text,
                    "timestamp": datetime.now().isoformat()
                }
                p["comments"].append(comment)
                self.save()
                return comment
        return None

    # --- Messaging Methods ---
    def send_message(self, match_id, sender_id, text, image=""):
        # find receiver_id from match
        match = next((m for m in self.matches if m["id"] == match_id), None)
        if not match:
            return None
        receiver_id = match["user2"] if match["user1"] == sender_id else match["user1"]

        msg = {
            "id": f"msg_{str(uuid.uuid4())[:8]}",
            "match_id": match_id,
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "text": text,
            "image": image,
            "timestamp": datetime.now().isoformat()
        }
        self.messages.append(msg)
        self.save()
        return msg

    def get_messages(self, match_id):
        return [m for m in self.messages if m["match_id"] == match_id]

db = Database()
