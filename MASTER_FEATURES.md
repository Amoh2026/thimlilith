# 🏗️ THIMLILITH: THE MASTER FEATURE & BUILD ROADMAP

**Status Legend:**
✅ **DONE** (Built & Deployed)
🟡 **PARTIAL** (Backend exists, UI needs work)
🔴 **NOT BUILT** (Planned for future)

---

## 🟢 PHASE 1: The Social Graph & Core Interaction (100% COMPLETE)
**Priority:** Foundation. You cannot build a community if users can't find or interact with each other.
*Dependencies: None. This is the starting point.*

1. ✅ **Sign up/Login & SSO:** Email, Google, and seamless cross-domain SSO from ATK.
2. ✅ **Basic Profiles:** Name, Avatar, and presence (Online/Offline).
3. ✅ **Direct Messaging:** 1-on-1 chat functionality.
4. ✅ **User Search:** Case-insensitive, partial-match search for users.
5. ✅ **User Action Menu:** Click a user to DM, Add Friend, Block, or Report.
6. ✅ **Friend Requests:** Send, accept, and reject friend requests.
7. ✅ **Privacy Settings:** Users can toggle their profile to "Private" to hide from search.
8. ✅ **Basic Moderation:** Block users, Report users, and basic AI text moderation.

---

## 🟢 PHASE 2: Core Messaging & Community (100% COMPLETE)
**Priority:** Retention. To keep users, the chat must feel as good as WhatsApp/Discord.
*Dependencies: Phase 1.*

9. ✅ **Group Chats (Thajmaath):** Create rooms, invite links, and member lists.
10. ✅ **Message Actions:** Reply, React (emojis), Edit, Delete.
11. ✅ **Media & Voice:** Send images, files, and Voice Notes (with AI Transcription).
12. ✅ **Message Forwarding:** Forward any message to another room.
13. ✅ **Pinned Messages:** Save important messages to the top of the room.
14. ✅ **Read Receipts & Typing Indicators:** Live feedback.
15. ✅ **@Mentions:** Tag specific users in a group chat.
16. ✅ **Room Roles (Owner/Mods):** Assign moderators who can kick and pin messages.
17. ✅ **Room Creator Tools:** Lock chat (Mods only) and toggle Disappearing Messages.
18. ✅ **Disappearing Messages:** 24-hour TTL auto-delete for privacy.
19. ✅ **The Saved Vault:** Users can permanently save up to 6 (Free) or 10 (Premium) messages.

---

## 🟡 PHASE 3: The Social Layer (CURRENTLY BUILDING)
**Priority:** Engagement. Turn the app from a chat room into a daily destination.
*Dependencies: Phase 1 & 2.*

20. ✅ **Full Profile Pages:** Bio, Banner Image, Stats, and Edit mode.
21. 🔴 **The Home Feed (`/feed`):** A timeline where users can create text/image posts.
22. 🔴 **Likes & Comments:** Interact with posts on the feed.
23. 🔴 **Community Discovery:** A directory to browse and join public rooms (without an invite link).
24. 🔴 **24h Stories:** Snapchat-style ephemeral photos/videos that vanish after 1 day.
25. 🔴 **Custom Status:** A short text status on a user's profile (e.g., "Learning Kabyle!").

---

## 🟡 PHASE 4: The Creator Economy & Admin
**Priority:** Monetization. You already have Stripe Premium; let's expand it.
*Dependencies: Phase 3 (Users need to be engaged before they pay).*

26. ✅ **Stripe Premium:** Paid subscriptions for unlimited AI and Vault space.
27. ✅ **Tip Jar:** Users can donate custom amounts via Stripe.
28. 🔴 **Creator Dashboard:** Analytics for room owners (number of members, tips received).
29. 🔴 **Paid Private Rooms:** Creators can lock a room behind a monthly Stripe subscription.
30. 🔴 **Platform Admin Dashboard:** Full analytics for you (total users, active rooms, revenue).
31. 🔴 **Audit Logs & Appeals:** Tools to review bans/mutes and handle user appeals.

---

## 🔴 PHASE 5: The Media Engine (TikTok/YouTube/Dailymotion)
**Priority:** Growth. Video content brings in users from outside the app.
*Dependencies: Phase 3 & 4 (Requires heavy server/Storage infrastructure).*

32. 🔴 **Short Video Feed:** Vertical swipe feed for Kabyle Reels/TikToks.
33. 🔴 **Video Uploads & Camera:** In-app recording with basic editing (trim/cut).
34. 🔴 **Long-form Video:** Playlists, quality selector, and playback speed.
35. 🔴 **Live Streaming:** Use LiveKit to broadcast to a large audience with live chat.
36. 🔴 **Live Gifts:** Send virtual coins/gifts during a live stream.

---

## 🔴 PHASE 6: The Frontier (Mixed Reality)
**Priority:** Innovation. The final "wow" factor.
*Dependencies: All previous phases.*

37. 🔴 **WebXR Spatial Rooms:** 3D virtual spaces where avatars can talk.
38. 🔴 **3D Avatars:** Customizable 3D representations of users.
39. 🔴 **Spatial Audio:** Voices get louder as avatars move closer.
40. 🔴 **VR Headset Support:** Full immersive Kabyle cultural tours and lessons.

---

## 🚀 THE IMMEDIATE NEXT 5 STEPS (Priority Order)

Based on the roadmap, here is exactly what we should build next, in order:

1. **The Home Feed (`/feed`):** The page where users create posts (text/images) and see a timeline.
2. **Likes & Comments:** The buttons on the feed to interact with posts.
3. **Community Discovery:** A page to see all public rooms and join them.
4. **Creator Dashboard:** A page for room owners to see their stats.
5. **Paid Private Rooms:** The Stripe logic to charge for room entry.
