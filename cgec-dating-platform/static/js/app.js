/**
 * CGEC Dating Platform Frontend Application Logic
 */

class CGECDatingApp {
  constructor() {
    // Load persisted user or default template
    const savedUser = localStorage.getItem('cgec_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (e) {
        this.currentUser = null;
      }
    } else {
      this.currentUser = null;
    }

    this.activeTab = 'feed';
    this.discoverCards = [];
    this.currentSwipeIndex = 0;
    this.activeMatchId = null;
    this.activeMatchUser = null;
    this.chatPollInterval = null;

    this.init();
  }

  getFallbackAvatar(gender) {
    if (gender === 'Girl') {
      return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
    }
    return 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80';
  }

  async init() {
    if (!this.currentUser) {
      // Prompt account creation modal immediately for new users
      setTimeout(() => this.openAuthModal(), 300);
    } else {
      this.updateUserUI();
    }

    await this.loadFeed();
    await this.loadDiscoverCards();
    await this.loadMatches();
    
    // Initialize icons
    lucide.createIcons();

    // Setup chat polling every 3 seconds
    this.chatPollInterval = setInterval(() => {
      if (this.activeTab === 'messages' && this.activeMatchId) {
        this.loadChatMessages(this.activeMatchId, false);
      }
      this.loadMatches(false);
    }, 3000);
  }

  // --- UI & State Updates ---
  updateUserUI() {
    if (!this.currentUser) return;
    const fallback = this.getFallbackAvatar(this.currentUser.gender);
    const userAvatar = this.currentUser.avatar || fallback;

    const headerAvatar = document.getElementById('header-user-avatar');
    headerAvatar.src = userAvatar;
    headerAvatar.onerror = function() { this.src = fallback; };

    document.getElementById('header-user-name').textContent = this.currentUser.name;
    document.getElementById('header-user-gender').textContent = this.currentUser.gender;
    
    const mobileAvatar = document.getElementById('mobile-post-user-avatar');
    mobileAvatar.src = userAvatar;
    mobileAvatar.onerror = function() { this.src = fallback; };

    // Profile page fields
    const profileAvatar = document.getElementById('profile-avatar-display');
    profileAvatar.src = userAvatar;
    profileAvatar.onerror = function() { this.src = fallback; };

    document.getElementById('profile-name-display').textContent = this.currentUser.name;
    document.getElementById('profile-gender-badge').textContent = this.currentUser.gender;
    document.getElementById('profile-dept-display').textContent = `${this.currentUser.department} • ${this.currentUser.year} • CGEC`;
    document.getElementById('profile-bio-display').textContent = this.currentUser.bio || "No bio added yet.";
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    
    // Show active tab
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) targetTab.classList.remove('hidden');

    // Update navigation styles
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.remove('bg-rose-500/20', 'text-rose-400', 'border', 'border-rose-500/30');
      el.classList.add('text-slate-400');
    });

    const activeNav = document.getElementById(`nav-${tabName}`);
    if (activeNav) {
      activeNav.classList.remove('text-slate-400');
      activeNav.classList.add('bg-rose-500/20', 'text-rose-400', 'border', 'border-rose-500/30');
    }

    // Refresh data depending on tab
    if (tabName === 'feed') this.loadFeed();
    if (tabName === 'discover') this.loadDiscoverCards();
    if (tabName === 'messages') this.loadMatches();
    if (tabName === 'profile') this.loadProfilePosts();

    lucide.createIcons();
  }

  // --- FEED MODULE ---
  async loadFeed() {
    try {
      const res = await fetch('/api/feed');
      const data = await res.json();
      
      this.renderStories(data.stories || []);
      this.renderFeedPosts(data.posts || []);
    } catch (err) {
      console.error('Error loading feed:', err);
    }
  }

  renderStories(stories) {
    const container = document.getElementById('stories-container');
    container.innerHTML = `
      <div class="flex flex-col items-center space-y-1 cursor-pointer" onclick="app.openCreatePostModal()">
        <div class="w-14 h-14 rounded-full bg-slate-800 border-2 border-dashed border-rose-500 flex items-center justify-center text-rose-400 hover:scale-105 transition">
          <i data-lucide="plus" class="w-6 h-6"></i>
        </div>
        <span class="text-[10px] text-slate-300 font-semibold">Your Story</span>
      </div>
    `;

    stories.forEach(item => {
      const u = item.user;
      container.innerHTML += `
        <div class="flex flex-col items-center space-y-1 cursor-pointer">
          <div class="story-ring">
            <img src="${u.avatar}" class="w-13 h-13 rounded-full object-cover border-2 border-slate-900" alt="${u.name}">
          </div>
          <span class="text-[10px] text-slate-300 font-semibold truncate max-w-[60px]">${u.name.split(' ')[0]}</span>
        </div>
      `;
    });
    lucide.createIcons();
  }

  renderFeedPosts(posts) {
    const container = document.getElementById('feed-posts-container');
    if (!posts.length) {
      container.innerHTML = `<div class="text-center py-10 text-slate-400">No posts in feed yet. Be the first to share!</div>`;
      return;
    }

    container.innerHTML = posts.map(post => {
      const isLiked = post.likes.includes(this.currentUser.id);
      const likesCount = post.likes.length;

      return `
        <article class="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl" id="post-card-${post.id}">
          <!-- Post Header -->
          <div class="p-4 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <img src="${post.user.avatar || this.getFallbackAvatar(post.user.gender)}" onerror="this.onerror=null; this.src='${this.getFallbackAvatar(post.user.gender)}'" class="w-10 h-10 rounded-full object-cover border border-rose-500" alt="${post.user.name}">
              <div>
                <h4 class="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>${post.user.name}</span>
                  <span class="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full">${post.user.gender}</span>
                </h4>
                <p class="text-[11px] text-slate-400">${post.user.department} • ${post.location}</p>
              </div>
            </div>
            <button class="text-slate-400 hover:text-white"><i data-lucide="more-horizontal" class="w-5 h-5"></i></button>
          </div>

          <!-- Post Image - Clean Aspect Ratio Scaling -->
          <div class="feed-post-img-container cursor-pointer" ondblclick="app.handleDoubleTapLike('${post.id}')">
            <img src="${post.image_url}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80'" class="feed-post-img" alt="Post photo" loading="lazy">
            <div id="heart-pop-${post.id}" class="heart-pop hidden">
              <i data-lucide="heart" class="w-20 h-20 fill-rose-500 stroke-none"></i>
            </div>
          </div>

          <!-- Post Actions -->
          <div class="p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <button onclick="app.toggleLike('${post.id}')" class="flex items-center space-x-1.5 text-slate-300 hover:text-rose-500 transition">
                  <i data-lucide="heart" class="w-6 h-6 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}" id="like-icon-${post.id}"></i>
                  <span id="like-count-${post.id}" class="text-xs font-bold">${likesCount}</span>
                </button>

                <button onclick="app.focusCommentInput('${post.id}')" class="flex items-center space-x-1.5 text-slate-300 hover:text-indigo-400 transition">
                  <i data-lucide="message-circle" class="w-6 h-6"></i>
                  <span class="text-xs font-bold">${post.comments.length}</span>
                </button>

                <button class="text-slate-300 hover:text-amber-400 transition">
                  <i data-lucide="send" class="w-5 h-5"></i>
                </button>
              </div>
              <span class="text-[11px] text-slate-500">${this.formatTime(post.created_at)}</span>
            </div>

            <!-- Post Caption -->
            <p class="text-xs text-slate-200 leading-relaxed">
              <span class="font-bold text-white">${post.user.name}</span> ${post.caption}
            </p>

            <!-- Comments List -->
            <div class="space-y-2 pt-2 border-t border-slate-800/60" id="comments-list-${post.id}">
              ${post.comments.slice(-2).map(c => `
                <div class="text-xs flex items-start space-x-2">
                  <span class="font-bold text-slate-300 shrink-0">${c.user_name}:</span>
                  <span class="text-slate-400">${c.text}</span>
                </div>
              `).join('')}
            </div>

            <!-- Add Comment Form -->
            <form onsubmit="app.submitComment(event, '${post.id}')" class="flex items-center space-x-2 pt-2">
              <input type="text" id="comment-input-${post.id}" placeholder="Add a comment..." class="flex-1 bg-slate-900 border border-slate-800 rounded-full px-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500">
              <button type="submit" class="text-xs font-bold text-rose-400 hover:text-rose-300 px-2">Post</button>
            </form>
          </div>
        </article>
      `;
    }).join('');

    lucide.createIcons();
  }

  async toggleLike(postId) {
    try {
      const formData = new FormData();
      formData.append('post_id', postId);
      formData.append('user_id', this.currentUser.id);

      const res = await fetch('/api/feed/like', { method: 'POST', body: formData });
      const data = await res.json();
      
      const likeIcon = document.getElementById(`like-icon-${postId}`);
      const likeCount = document.getElementById(`like-count-${postId}`);

      if (data.liked) {
        likeIcon.classList.add('fill-rose-500', 'text-rose-500');
      } else {
        likeIcon.classList.remove('fill-rose-500', 'text-rose-500');
      }
      likeCount.textContent = data.likes_count;
    } catch (err) {
      console.error('Like error:', err);
    }
  }

  handleDoubleTapLike(postId) {
    const heartPop = document.getElementById(`heart-pop-${postId}`);
    if (heartPop) {
      heartPop.classList.remove('hidden');
      setTimeout(() => heartPop.classList.add('hidden'), 800);
    }
    this.toggleLike(postId);
  }

  async submitComment(e, postId) {
    e.preventDefault();
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();
    if (!text) return;

    try {
      const formData = new FormData();
      formData.append('post_id', postId);
      formData.append('user_id', this.currentUser.id);
      formData.append('text', text);

      const res = await fetch('/api/feed/comment', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.status === 'success') {
        input.value = '';
        this.loadFeed();
      }
    } catch (err) {
      console.error('Comment error:', err);
    }
  }

  focusCommentInput(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    if (input) input.focus();
  }


  // --- DISCOVER / SWIPE MODULE ---
  async loadDiscoverCards() {
    try {
      const res = await fetch(`/api/discover?user_id=${this.currentUser.id}`);
      const data = await res.json();
      this.discoverCards = data.candidates || [];
      this.currentSwipeIndex = 0;
      this.renderSwipeDeck();
    } catch (err) {
      console.error('Error loading discover cards:', err);
    }
  }

  renderSwipeDeck() {
    const container = document.getElementById('swipe-deck-container');
    if (!this.discoverCards.length || this.currentSwipeIndex >= this.discoverCards.length) {
      container.innerHTML = `
        <div class="w-full h-full glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center border border-slate-800">
          <div class="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
            <i data-lucide="check-circle" class="w-8 h-8"></i>
          </div>
          <h3 class="text-xl font-bold text-white mb-1">That's everyone for now!</h3>
          <p class="text-xs text-slate-400 mb-6">Check back soon for new CGEC student profiles!</p>
          <button onclick="app.loadDiscoverCards()" class="px-6 py-2.5 rounded-full gradient-btn font-bold text-xs text-white">
            Refresh Profiles
          </button>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    // Render top 2 cards in deck
    const currentCandidate = this.discoverCards[this.currentSwipeIndex];
    const candidateAvatar = currentCandidate.avatar || this.getFallbackAvatar(currentCandidate.gender);
    const fallbackUrl = this.getFallbackAvatar(currentCandidate.gender);

    container.innerHTML = `
      <div class="swipe-card glass-panel border border-slate-700/80" id="current-swipe-card">
        <div class="stamp stamp-like" id="stamp-like">LIKE</div>
        <div class="stamp stamp-pass" id="stamp-pass">NOPE</div>

        <img src="${candidateAvatar}" onerror="this.onerror=null; this.src='${fallbackUrl}'" class="w-full h-full object-cover" alt="${currentCandidate.name}">

        <!-- Gradient Overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-6">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-2xl font-extrabold text-white flex items-center gap-2">
              <span>${currentCandidate.name}, ${currentCandidate.age}</span>
            </h3>
            <span class="bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">${currentCandidate.gender}</span>
          </div>

          <p class="text-xs text-rose-300 font-semibold mb-2 flex items-center gap-1">
            <i data-lucide="graduation-cap" class="w-4 h-4"></i>
            <span>${currentCandidate.department} • ${currentCandidate.year}</span>
          </p>

          <p class="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">${currentCandidate.bio}</p>

          <!-- Interest Tags -->
          <div class="flex flex-wrap gap-1.5">
            ${(currentCandidate.interests || []).map(tag => `
              <span class="text-[10px] bg-slate-900/80 text-slate-200 px-2.5 py-1 rounded-full border border-slate-700 font-medium">${tag}</span>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    lucide.createIcons();
    this.initSwipeEvents();
  }

  initSwipeEvents() {
    const card = document.getElementById('current-swipe-card');
    if (!card) return;

    let isDragging = false;
    let startX = 0;
    let currentX = 0;

    const onStart = (e) => {
      isDragging = true;
      startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    };

    const onMove = (e) => {
      if (!isDragging) return;
      currentX = (e.type.includes('touch') ? e.touches[0].clientX : e.clientX) - startX;
      const rotate = currentX * 0.08;
      card.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;

      const stampLike = document.getElementById('stamp-like');
      const stampPass = document.getElementById('stamp-pass');

      if (currentX > 40 && stampLike) {
        stampLike.style.opacity = Math.min(currentX / 120, 1);
        if (stampPass) stampPass.style.opacity = 0;
      } else if (currentX < -40 && stampPass) {
        stampPass.style.opacity = Math.min(-currentX / 120, 1);
        if (stampLike) stampLike.style.opacity = 0;
      } else {
        if (stampLike) stampLike.style.opacity = 0;
        if (stampPass) stampPass.style.opacity = 0;
      }
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      if (currentX > 120) {
        this.triggerSwipe('like');
      } else if (currentX < -120) {
        this.triggerSwipe('pass');
      } else {
        card.style.transform = 'translateX(0px) rotate(0deg)';
      }
    };

    card.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    card.addEventListener('touchstart', onStart);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  }

  async triggerSwipe(action) {
    if (!this.discoverCards.length || this.currentSwipeIndex >= this.discoverCards.length) return;
    const targetUser = this.discoverCards[this.currentSwipeIndex];

    try {
      const formData = new FormData();
      formData.append('from_id', this.currentUser.id);
      formData.append('to_id', targetUser.id);
      formData.append('action', action);

      const res = await fetch('/api/swipe', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.is_match) {
        this.showMatchModal(this.currentUser, targetUser, data.match.id);
      }

      this.currentSwipeIndex++;
      this.renderSwipeDeck();
    } catch (err) {
      console.error('Swipe error:', err);
    }
  }

  showMatchModal(user1, user2, matchId) {
    this.activeMatchId = matchId;
    this.activeMatchUser = user2;

    document.getElementById('match-target-name').textContent = user2.name;
    document.getElementById('match-user1-avatar').src = user1.avatar;
    document.getElementById('match-user2-avatar').src = user2.avatar;
    document.getElementById('modal-match').classList.remove('hidden');
    lucide.createIcons();
  }

  closeMatchModal() {
    document.getElementById('modal-match').classList.add('hidden');
  }

  openChatWithMatch() {
    this.closeMatchModal();
    this.switchTab('messages');
    if (this.activeMatchId) {
      this.loadChatMessages(this.activeMatchId);
    }
  }


  // --- MESSAGES & CHAT MODULE ---
  async loadMatches(autoSelectFirst = true) {
    try {
      const res = await fetch(`/api/matches?user_id=${this.currentUser.id}`);
      const data = await res.json();
      const matches = data.matches || [];

      document.getElementById('matches-count-badge').textContent = matches.length;
      
      const container = document.getElementById('matches-list-container');
      if (!matches.length) {
        container.innerHTML = `<div class="p-6 text-center text-xs text-slate-500">No matches yet. Swipe on profiles to match!</div>`;
        return;
      }

      container.innerHTML = matches.map(m => {
        const u = m.other_user;
        const lastMsg = m.last_message ? m.last_message.text : 'New match! Say hi 👋';
        const isActive = m.match_id === this.activeMatchId;

        return `
          <div onclick="app.selectMatch('${m.match_id}', '${u.id}')" class="p-3 flex items-center space-x-3 cursor-pointer transition ${isActive ? 'bg-rose-500/15 border-l-4 border-rose-500' : 'hover:bg-slate-800/40'}">
            <div class="relative">
              <img src="${u.avatar}" class="w-12 h-12 rounded-full object-cover border border-slate-700" alt="${u.name}">
              <span class="w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 absolute bottom-0 right-0"></span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-0.5">
                <h4 class="font-bold text-xs text-white truncate">${u.name}</h4>
                <span class="text-[10px] text-slate-500">${this.formatTime(m.timestamp)}</span>
              </div>
              <p class="text-[11px] text-slate-400 truncate">${lastMsg}</p>
            </div>
          </div>
        `;
      }).join('');

      if (autoSelectFirst && matches.length && !this.activeMatchId) {
        this.selectMatch(matches[0].match_id, matches[0].other_user.id);
      }
    } catch (err) {
      console.error('Error loading matches:', err);
    }
  }

  async selectMatch(matchId, otherUserId) {
    this.activeMatchId = matchId;
    
    // Fetch profile of other user
    try {
      const res = await fetch(`/api/users/${otherUserId}`);
      const data = await res.json();
      this.activeMatchUser = data.user;

      document.getElementById('chat-recipient-name').textContent = this.activeMatchUser.name;
      document.getElementById('chat-recipient-avatar').src = this.activeMatchUser.avatar;
      document.getElementById('chat-recipient-dept').textContent = `${this.activeMatchUser.department.split(' ')[0]} ${this.activeMatchUser.year}`;

      await this.loadChatMessages(matchId);
      this.loadMatches(false);
    } catch (err) {
      console.error('Error selecting match:', err);
    }
  }

  async loadChatMessages(matchId, scrollToBottom = true) {
    try {
      const res = await fetch(`/api/messages/${matchId}`);
      const data = await res.json();
      const messages = data.messages || [];

      const body = document.getElementById('chat-messages-body');
      if (!messages.length) {
        body.innerHTML = `<div class="text-center text-xs text-slate-500 my-4">No messages yet. Send a greeting!</div>`;
        return;
      }

      body.innerHTML = messages.map(msg => {
        const isMe = msg.sender_id === this.currentUser.id;
        return `
          <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
            <div class="${isMe ? 'chat-bubble-sent' : 'chat-bubble-received'} px-4 py-2.5 max-w-[80%] text-xs shadow-md">
              ${msg.text ? `<p class="leading-relaxed">${msg.text}</p>` : ''}
              ${msg.image ? `<img src="${msg.image}" class="rounded-lg mt-2 max-w-full max-h-48 object-cover">` : ''}
            </div>
            <span class="text-[9px] text-slate-500 mt-1 px-1">${this.formatTime(msg.timestamp)}</span>
          </div>
        `;
      }).join('');

      if (scrollToBottom) {
        body.scrollTop = body.scrollHeight;
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }

  async sendChatMessage(e) {
    e.preventDefault();
    if (!this.activeMatchId) return;

    const input = document.getElementById('chat-text-input');
    const text = input.value.trim();
    if (!text) return;

    try {
      const formData = new FormData();
      formData.append('match_id', this.activeMatchId);
      formData.append('sender_id', this.currentUser.id);
      formData.append('text', text);

      input.value = '';

      const res = await fetch('/api/messages/send', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.status === 'success') {
        this.loadChatMessages(this.activeMatchId);
      }
    } catch (err) {
      console.error('Error sending chat message:', err);
    }
  }

  triggerImageUploadChat() {
    document.getElementById('chat-image-input').click();
  }

  async handleChatImageSelect(e) {
    const file = e.target.files[0];
    if (!file || !this.activeMatchId) return;

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
      const data = await res.json();

      if (data.url) {
        const formData = new FormData();
        formData.append('match_id', this.activeMatchId);
        formData.append('sender_id', this.currentUser.id);
        formData.append('text', '');
        formData.append('image', data.url);

        await fetch('/api/messages/send', { method: 'POST', body: formData });
        this.loadChatMessages(this.activeMatchId);
      }
    } catch (err) {
      console.error('Chat image upload error:', err);
    }
  }


  // --- PROFILE MODULE ---
  async loadProfilePosts() {
    try {
      const res = await fetch(`/api/users/${this.currentUser.id}`);
      const data = await res.json();
      const posts = data.posts || [];

      const grid = document.getElementById('profile-posts-grid');
      if (!posts.length) {
        grid.innerHTML = `<div class="col-span-3 text-center py-6 text-xs text-slate-500">You haven't posted anything yet.</div>`;
        return;
      }

      grid.innerHTML = posts.map(p => `
        <div class="aspect-square bg-slate-900 rounded-xl overflow-hidden relative group cursor-pointer">
          <img src="${p.image_url}" class="w-full h-full object-cover group-hover:scale-110 transition duration-300" alt="Post">
          <div class="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-3 text-white text-xs font-bold">
            <span class="flex items-center gap-1"><i data-lucide="heart" class="w-4 h-4 fill-white"></i> ${p.likes.length}</span>
          </div>
        </div>
      `).join('');

      lucide.createIcons();
    } catch (err) {
      console.error('Error loading profile posts:', err);
    }
  }


  // --- MODALS ---
  openAuthModal() {
    document.getElementById('modal-auth').classList.remove('hidden');
    lucide.createIcons();
  }

  closeAuthModal() {
    document.getElementById('modal-auth').classList.add('hidden');
  }

  async handleAuthSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('auth-name').value.trim();
    const gender = document.getElementById('auth-gender').value;
    const looking_for = document.getElementById('auth-looking').value;
    const department = document.getElementById('auth-dept').value;
    const year = document.getElementById('auth-year').value;
    const bio = document.getElementById('auth-bio').value.trim();
    const avatar = document.getElementById('auth-avatar').value.trim();

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('gender', gender);
      formData.append('looking_for', looking_for);
      formData.append('age', 21);
      formData.append('department', department);
      formData.append('year', year);
      formData.append('bio', bio);
      formData.append('avatar', avatar);

      const res = await fetch('/api/auth/register', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.status === 'success') {
        this.currentUser = data.user;
        localStorage.setItem('cgec_user', JSON.stringify(data.user));
        this.updateUserUI();
        this.closeAuthModal();
        this.loadFeed();
        this.loadDiscoverCards();
      }
    } catch (err) {
      console.error('Auth submit error:', err);
    }
  }

  openCreatePostModal() {
    document.getElementById('modal-create-post').classList.remove('hidden');
    lucide.createIcons();
  }

  closeCreatePostModal() {
    document.getElementById('modal-create-post').classList.add('hidden');
  }

  async handleCreatePostSubmit(e) {
    e.preventDefault();
    const imageUrl = document.getElementById('post-image-url').value.trim();
    const caption = document.getElementById('post-caption').value.trim();
    const location = document.getElementById('post-location').value.trim();

    try {
      const formData = new FormData();
      formData.append('user_id', this.currentUser.id);
      formData.append('image_url', imageUrl);
      formData.append('caption', caption);
      formData.append('location', location);

      const res = await fetch('/api/feed/create', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.status === 'success') {
        this.closeCreatePostModal();
        await this.loadFeed();
        this.switchTab('feed');
      }
    } catch (err) {
      console.error('Create post error:', err);
    }
  }

  // --- PHOTO FILE UPLOAD HANDLERS ---
  triggerProfilePhotoUpload() {
    const input = document.getElementById('profile-photo-file-input');
    if (input) input.click();
  }

  async handleProfilePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
      const data = await res.json();

      if (data.url) {
        // Save new avatar URL to user profile
        const updateData = new FormData();
        updateData.append('user_id', this.currentUser.id);
        updateData.append('avatar_url', data.url);

        const updateRes = await fetch('/api/users/update_avatar', { method: 'POST', body: updateData });
        const updateJson = await updateRes.json();

        if (updateJson.status === 'success') {
          this.currentUser.avatar = data.url;
          localStorage.setItem('cgec_user', JSON.stringify(this.currentUser));
          this.updateUserUI();
        }
      }
    } catch (err) {
      console.error('Error uploading profile photo:', err);
    }
  }

  async handleAuthPhotoFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
      const data = await res.json();

      if (data.url) {
        document.getElementById('auth-avatar').value = data.url;
        document.getElementById('auth-avatar-preview').src = data.url;
        document.getElementById('auth-file-name').textContent = file.name;
      }
    } catch (err) {
      console.error('Auth photo select error:', err);
    }
  }

  async handlePostPhotoFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
      const data = await res.json();

      if (data.url) {
        document.getElementById('post-image-url').value = data.url;
        document.getElementById('post-image-preview').src = data.url;
        document.getElementById('post-file-name').textContent = file.name;
      }
    } catch (err) {
      console.error('Post photo select error:', err);
    }
  }

  // --- Helpers ---
  formatTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

// Instantiate app globally
const app = new CGECDatingApp();
