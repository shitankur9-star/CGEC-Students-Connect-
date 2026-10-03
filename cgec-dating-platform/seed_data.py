"""
Seed initial realistic data for CGEC (Cooch Behar Government Engineering College) Dating Platform.
Includes realistic student profiles (Boys and Girls), Instagram posts, stories, and mutual matches/messages.
"""

from database import db

def seed_cgec_data(force=False):
    if not force:
        print("Demo seeding skipped for clean user platform.")
        return

    print("Seeding CGEC Dating Platform data...")

    # Sample Student Profiles
    sample_users = [
        # Girls
        {
            "id": "usr_priya",
            "name": "Priya Sharma",
            "gender": "Girl",
            "looking_for": "Boy",
            "age": 21,
            "department": "Computer Science (CSE)",
            "year": "3rd Year",
            "bio": "Coding by day, acoustic guitar by night 🎸 | Tech enthusiast & coffee addict ☕ | Let's grab tea at CGEC canteen!",
            "interests": ["Coding", "Acoustic Music", "Photography", "Badminton", "Anime"],
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
            "photos": [
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80"
            ],
            "instagram": "@priya_cgec",
            "location": "CSE Block, CGEC",
            "status": "Online"
        },
        {
            "id": "usr_ananya",
            "name": "Ananya Roy",
            "gender": "Girl",
            "looking_for": "Boy",
            "age": 20,
            "department": "Electronics & Comm (ECE)",
            "year": "2nd Year",
            "bio": "Robotics team lead 🤖 | Painter & sunset chaser ✨ | Looking for someone to explore North Bengal with!",
            "interests": ["Robotics", "Sketching", "Travel", "Pop Music", "Board Games"],
            "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
            "photos": [
                "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80"
            ],
            "instagram": "@ananya_ece",
            "location": "ECE Lab, CGEC",
            "status": "Online"
        },
        {
            "id": "usr_sneha",
            "name": "Sneha Mukherjee",
            "gender": "Girl",
            "looking_for": "Boy",
            "age": 22,
            "department": "Electrical Engg (EE)",
            "year": "4th Year",
            "bio": "Final year survivor 🎓 | Classical dance enthusiast 💃 | Love deep conversations & rainy campus walks 🌧️",
            "interests": ["Classical Dance", "Reading", "Poetry", "Fitness", "Nature Walks"],
            "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
            "photos": [
                "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80"
            ],
            "instagram": "@sneha_ee",
            "location": "EE Department, CGEC",
            "status": "Active 10m ago"
        },
        {
            "id": "usr_ritika",
            "name": "Ritika Das",
            "gender": "Girl",
            "looking_for": "Boy",
            "age": 20,
            "department": "Civil Engg (CE)",
            "year": "2nd Year",
            "bio": "Designing structures & building memories 🏗️ | Foodie 🍕 | Table Tennis champion 🏓",
            "interests": ["Table Tennis", "Architecture", "Food Exploring", "Short Films"],
            "avatar": "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=600&q=80",
            "photos": [
                "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=600&q=80"
            ],
            "instagram": "@ritika_ce",
            "location": "Girls Hostel, CGEC",
            "status": "Online"
        },
        # Boys
        {
            "id": "usr_rohit",
            "name": "Rohit Sen",
            "gender": "Boy",
            "looking_for": "Girl",
            "age": 21,
            "department": "Computer Science (CSE)",
            "year": "3rd Year",
            "bio": "Full-stack developer 💻 | Football captain ⚽ | Guitarist in college band | Always down for late night Maggi 🍜",
            "interests": ["Web Dev", "Football", "Rock Music", "Gaming", "Stargazing"],
            "avatar": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
            "photos": [
                "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80"
            ],
            "instagram": "@rohit_dev",
            "location": "Boys Hostel, CGEC",
            "status": "Online"
        },
        {
            "id": "usr_arkajit",
            "name": "Arkajit Ghosh",
            "gender": "Boy",
            "looking_for": "Girl",
            "age": 21,
            "department": "Mechanical Engg (ME)",
            "year": "3rd Year",
            "bio": "Biker 🏍️ | CAD wizard & Formula Student designer | Looking for a co-pilot for weekend road trips 🏔️",
            "interests": ["Motorcycling", "3D Modeling", "Gym", "Rock Music", "Trekking"],
            "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
            "photos": [
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80"
            ],
            "instagram": "@arka_rider",
            "location": "ME Workshop, CGEC",
            "status": "Active 5m ago"
        },
        {
            "id": "usr_sayan",
            "name": "Sayan Chatterji",
            "gender": "Boy",
            "looking_for": "Girl",
            "age": 22,
            "department": "Electronics & Comm (ECE)",
            "year": "4th Year",
            "bio": "IoT builder & amateur photographer 📸 | Capturing CGEC memories | Let's talk tech, movies & life ✨",
            "interests": ["Photography", "IoT", "Sci-Fi Movies", "Chess", "Standup Comedy"],
            "avatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80",
            "photos": [
                "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80"
            ],
            "instagram": "@sayan_snaps",
            "location": "ECE Block, CGEC",
            "status": "Online"
        }
    ]

    for u in sample_users:
        db.users[u["id"]] = u

    # Feed Posts (Instagram-like feed)
    sample_posts = [
        {
            "id": "post_1",
            "user_id": "usr_priya",
            "caption": "Sunset views from CGEC Administrative Building ground! Nothing beats North Bengal weather after a long coding lab 🌅✨ #CGEC #CampusVibes #NorthBengal",
            "image_url": "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1000&q=80",
            "location": "CGEC Campus Ground",
            "likes": ["usr_rohit", "usr_arkajit", "usr_ananya", "usr_sayan"],
            "comments": [
                {
                    "id": "c1",
                    "user_id": "usr_rohit",
                    "user_name": "Rohit Sen",
                    "user_avatar": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
                    "text": "Stunning shot! We should jam together at the canteen lawn sometime 🎸",
                    "timestamp": "2026-08-28T18:30:00"
                },
                {
                    "id": "c2",
                    "user_id": "usr_ananya",
                    "user_name": "Ananya Roy",
                    "user_avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
                    "text": "The sky looks so dreamy! 😍",
                    "timestamp": "2026-08-28T19:05:00"
                }
            ],
            "created_at": "2026-08-28T18:00:00"
        },
        {
            "id": "post_2",
            "user_id": "usr_rohit",
            "caption": "Inter-departmental football tournament trophy secured! 🏆 Massive thanks to the entire team for pushing till the 90th minute! ⚽🔥 #CGECSports #CSEVictorious",
            "image_url": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80",
            "location": "CGEC Sports Complex",
            "likes": ["usr_priya", "usr_sneha", "usr_arkajit"],
            "comments": [
                {
                    "id": "c3",
                    "user_id": "usr_priya",
                    "user_name": "Priya Sharma",
                    "user_avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
                    "text": "Congrats captain! Great winning goal 🔥",
                    "timestamp": "2026-08-27T16:20:00"
                }
            ],
            "created_at": "2026-08-27T15:45:00"
        },
        {
            "id": "post_3",
            "user_id": "usr_ananya",
            "caption": "Tested our new line-follower bot prototype today in the ECE lab! Sensors dialed in 🤖⚡ Who wants a quick demo?",
            "image_url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1000&q=80",
            "location": "ECE Innovation Lab",
            "likes": ["usr_rohit", "usr_sayan", "usr_ritika"],
            "comments": [
                {
                    "id": "c4",
                    "user_id": "usr_sayan",
                    "user_name": "Sayan Chatterji",
                    "user_avatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80",
                    "text": "Awesome precision! Let's pair it with my ESP32 module.",
                    "timestamp": "2026-08-26T14:10:00"
                }
            ],
            "created_at": "2026-08-26T13:00:00"
        }
    ]

    db.posts = sample_posts

    # Swipes & Matches setup between sample users
    db.swipes = [
        {"from": "usr_rohit", "to": "usr_priya", "action": "like", "timestamp": "2026-08-28T10:00:00"},
        {"from": "usr_priya", "to": "usr_rohit", "action": "like", "timestamp": "2026-08-28T10:05:00"},
        {"from": "usr_rohit", "to": "usr_ananya", "action": "like", "timestamp": "2026-08-28T11:00:00"},
        {"from": "usr_ananya", "to": "usr_rohit", "action": "like", "timestamp": "2026-08-28T11:10:00"},
    ]

    db.matches = [
        {
            "id": "match_usr_priya_usr_rohit",
            "user1": "usr_priya",
            "user2": "usr_rohit",
            "timestamp": "2026-08-28T10:05:00"
        },
        {
            "id": "match_usr_ananya_usr_rohit",
            "user1": "usr_ananya",
            "user2": "usr_rohit",
            "timestamp": "2026-08-28T11:10:00"
        }
    ]

    # Sample Initial Messages
    db.messages = [
        {
            "id": "m1",
            "match_id": "match_usr_priya_usr_rohit",
            "sender_id": "usr_rohit",
            "receiver_id": "usr_priya",
            "text": "Hey Priya! Saw your post with the campus sunset photo. Really amazing click! 🌄",
            "image": "",
            "timestamp": "2026-08-28T18:35:00"
        },
        {
            "id": "m2",
            "match_id": "match_usr_priya_usr_rohit",
            "sender_id": "usr_priya",
            "receiver_id": "usr_rohit",
            "text": "Hey Rohit! Thanks a lot 😊 Also congrats on winning the football match yesterday!",
            "image": "",
            "timestamp": "2026-08-28T18:38:00"
        },
        {
            "id": "m3",
            "match_id": "match_usr_priya_usr_rohit",
            "sender_id": "usr_rohit",
            "receiver_id": "usr_priya",
            "text": "Thank you!! Are you free this evening for coffee at the college canteen?",
            "image": "",
            "timestamp": "2026-08-28T18:40:00"
        }
    ]

    db.save()
    print("CGEC Dating Platform seeded successfully with student profiles, posts & matches!")

if __name__ == "__main__":
    seed_cgec_data()
