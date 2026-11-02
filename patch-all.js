const fs = require('fs');

// ==========================================
// 1. UPDATE JSON DICTIONARIES
// ==========================================
const updateJSON = (lang, data) => {
  const p = `messages/${lang}.json`;
  let json = JSON.parse(fs.readFileSync(p, 'utf8'));
  json.Chat = data.Chat;
  json.Feed = data.Feed;
  json.Discover = data.Discover;
  fs.writeFileSync(p, JSON.stringify(json, null, 2), 'utf8');
};

const enData = {
  Chat: {
    selectRoom: "Select or create a Thajmaath to start chatting.", blockedUser: "Blocked User", offline: "Offline", activeCommunity: "Active community",
    searchMessages: "Search Messages", privacySettings: "Privacy Settings", myVault: "My Vault", videoCall: "Video Call",
    roomSettings: "Room Settings", safetyModeration: "Safety & Moderation", backToMenu: "Back to Menu",
    decorateRoom: "Decorate Room", addMember: "Add Member", inviteLink: "Invite Link", manageRoles: "Manage Roles",
    unlockChat: "Unlock Chat (Everyone)", lockChat: "Lock Chat (Mods Only)", disappearingOn: "Disappearing: ON (24h)", disappearingOff: "Disappearing: OFF",
    unblockUser: "Unblock User", blockUser: "Block User", reportUser: "Report User",
    searchMessagesPlaceholder: "Search messages...", closeSearch: "Close Search", pinnedMessages: "{count} Pinned Message(s)", clickToView: "Click to view", dismiss: "Dismiss",
    noMessages: "No messages yet. Say Azul to {name}!", msgFromBlocked: "Message from a blocked user", you: "You",
    reply: "Reply", forward: "Forward", react: "React", translate: "Translate", edit: "Edit", delete: "Delete", pin: "Pin", save: "Save",
    sending: "Sending...", edited: "edited", saving: "Saving...", saveToATK: "Save to ATK", savedToATK: "Saved to ATK ✨", saveFailed: "Save failed", cancel: "Cancel",
    typing: "{users} is typing...", replyingTo: "Replying to {name}", media: "Media", file: "File",
    aiScanning: "AI Scanning...", uploading: "Uploading...", recording: "Recording...", replyPlaceholder: "Reply to {name}...", messagePlaceholder: "Message...", mention: "Mention", stickers: "Kabyle Stickers",
    mentionMember: "Mention Member", emotions: "Emotions", identity: "Identity & Pride", noStickers: "No stickers found. Drop images in the public folder!", sendMessage: "Send Message"
  },
  Feed: {
    homeFeed: "Home Feed", posts: "Posts", reels: "Reels (TikTok)", global: "Global", following: "Following", createStory: "Create Story",
    whoToFollow: "Who to follow", newToThimlilith: "New to Thimlilith", follow: "Follow", whatsOnYourMind: "What's on your mind? Use #hashtags...",
    addImage: "Add Image", posting: "Posting...", post: "Post", emptyFollowing: "You aren't following anyone yet, or they haven't posted.",
    emptyGlobal: "No posts yet. Be the first to share something!", comment: "Comment", share: "Share", reelsPhase5: "Reels feed coming in Phase 5 (Next Build).", backToChat: "Back to Chat"
  },
  Discover: {
    discover: "Discover", findCommunities: "Find new Kabyle communities to join.", noCommunities: "No public communities found yet.",
    members: "{count} Members", joined: "Joined", processing: "Processing...", join: "Join", backToChat: "Back to Chat"
  }
};

const frData = {
  Chat: {
    selectRoom: "Sélectionnez ou créez une Thajmaath pour commencer à discuter.", blockedUser: "Utilisateur bloqué", offline: "Hors ligne", activeCommunity: "Communauté active",
    searchMessages: "Rechercher des messages", privacySettings: "Paramètres de confidentialité", myVault: "Mon coffre-fort", videoCall: "Appel vidéo",
    roomSettings: "Paramètres du salon", safetyModeration: "Sécurité et modération", backToMenu: "Retour au menu",
    decorateRoom: "Décorer le salon", addMember: "Ajouter un membre", inviteLink: "Lien d'invitation", manageRoles: "Gérer les rôles",
    unlockChat: "Déverrouiller le chat (Tous)", lockChat: "Verrouiller le chat (Mods)", disappearingOn: "Éphémère : OUI (24h)", disappearingOff: "Éphémère : NON",
    unblockUser: "Débloquer", blockUser: "Bloquer", reportUser: "Signaler",
    searchMessagesPlaceholder: "Rechercher des messages...", closeSearch: "Fermer", pinnedMessages: "{count} Message(s) épinglé(s)", clickToView: "Cliquez pour voir", dismiss: "Ignorer",
    noMessages: "Aucun message. Dites Azul à {name} !", msgFromBlocked: "Message d'un utilisateur bloqué", you: "Vous",
    reply: "Répondre", forward: "Transférer", react: "Réagir", translate: "Traduire", edit: "Modifier", delete: "Supprimer", pin: "Épingler", save: "Sauver",
    sending: "Envoi...", edited: "modifié", saving: "Sauvegarde...", saveToATK: "Sauver dans ATK", savedToATK: "Sauvegardé dans ATK ✨", saveFailed: "Échec de la sauvegarde", cancel: "Annuler",
    typing: "{users} écrit...", replyingTo: "En réponse à {name}", media: "Média", file: "Fichier",
    aiScanning: "Analyse IA...", uploading: "Envoi...", recording: "Enregistrement...", replyPlaceholder: "Répondre à {name}...", messagePlaceholder: "Message...", mention: "Mentionner", stickers: "Stickers Kabyles",
    mentionMember: "Mentionner un membre", emotions: "Émotions", identity: "Identité & Fierté", noStickers: "Aucun sticker trouvé.", sendMessage: "Envoyer"
  },
  Feed: {
    homeFeed: "Fil d'actualité", posts: "Publications", reels: "Reels (TikTok)", global: "Global", following: "Abonnements", createStory: "Créer une story",
    whoToFollow: "Suggestions", newToThimlilith: "Nouveau sur Thimlilith", follow: "Suivre", whatsOnYourMind: "À quoi pensez-vous ? Utilisez #hashtags...",
    addImage: "Ajouter une image", posting: "Publication...", post: "Publier", emptyFollowing: "Vous ne suivez personne ou ils n'ont rien publié.",
    emptyGlobal: "Aucune publication. Soyez le premier !", comment: "Commenter", share: "Partager", reelsPhase5: "Les Reels arrivent bientôt.", backToChat: "Retour au chat"
  },
  Discover: {
    discover: "Découvrir", findCommunities: "Trouvez de nouvelles communautés kabyles à rejoindre.", noCommunities: "Aucune communauté publique.",
    members: "{count} membres", joined: "Rejoint", processing: "Traitement...", join: "Rejoindre", backToChat: "Retour au chat"
  }
};

const arData = {
  Chat: {
    selectRoom: "اختر أو أنشئ ثجمعث لبدء الدردشة.", blockedUser: "مستخدم محظور", offline: "غير متصل", activeCommunity: "مجتمع نشط",
    searchMessages: "بحث في الرسائل", privacySettings: "إعدادات الخصوصية", myVault: "خزنتي", videoCall: "مكالمة فيديو",
    roomSettings: "إعدادات الغرفة", safetyModeration: "الأمان والإشراف", backToMenu: "العودة للقائمة",
    decorateRoom: "تزيين الغرفة", addMember: "إضافة عضو", inviteLink: "رابط الدعوة", manageRoles: "إدارة الأدوار",
    unlockChat: "فتح الدردشة (الجميع)", lockChat: "قفل الدردشة (المشرفين)", disappearingOn: "اختفاء: مفعل (24س)", disappearingOff: "اختفاء: معطل",
    unblockUser: "إلغاء الحظر", blockUser: "حظر", reportUser: "إبلاغ",
    searchMessagesPlaceholder: "ابحث في الرسائل...", closeSearch: "إغلاق", pinnedMessages: "{count} رسائل مثبتة", clickToView: "انقر للعرض", dismiss: "تجاهل",
    noMessages: "لا رسائل بعد. قل أزول لـ {name}!", msgFromBlocked: "رسالة من مستخدم محظور", you: "أنت",
    reply: "رد", forward: "تحويل", react: "تفاعل", translate: "ترجمة", edit: "تعديل", delete: "حذف", pin: "تثبيت", save: "حفظ",
    sending: "جاري الإرسال...", edited: "معدل", saving: "جاري الحفظ...", saveToATK: "حفظ في ATK", savedToATK: "تم الحفظ ✨", saveFailed: "فشل الحفظ", cancel: "إلغاء",
    typing: "{users} يكتب...", replyingTo: "رداً على {name}", media: "وسائط", file: "ملف",
    aiScanning: "جاري الفحص...", uploading: "جاري الرفع...", recording: "جاري التسجيل...", replyPlaceholder: "رد على {name}...", messagePlaceholder: "رسالة...", mention: "إشارة", stickers: "ملصقات",
    mentionMember: "إشارة إلى عضو", emotions: "مشاعر", identity: "الهوية والفخر", noStickers: "لا توجد ملصقات.", sendMessage: "إرسال"
  },
  Feed: {
    homeFeed: "الخلاصة", posts: "منشورات", reels: "ريلز (تيك توك)", global: "عالمي", following: "متابعون", createStory: "إنشاء قصة",
    whoToFollow: "اقتراحات", newToThimlilith: "جديد في ثيمليليث", follow: "متابعة", whatsOnYourMind: "بماذا تفكر؟ استخدم #هاشتاغ...",
    addImage: "إضافة صورة", posting: "جاري النشر...", post: "نشر", emptyFollowing: "لا تتابع أحداً بعد.",
    emptyGlobal: "لا منشورات بعد. كن الأول!", comment: "تعليق", share: "مشاركة", reelsPhase5: "الريلز قادم قريباً.", backToChat: "العودة للدردشة"
  },
  Discover: {
    discover: "اكتشف", findCommunities: "ابحث عن مجتمعات جديدة.", noCommunities: "لا مجتمعات عامة.",
    members: "{count} أعضاء", joined: "منضم", processing: "جاري المعالجة...", join: "انضمام", backToChat: "العودة للدردشة"
  }
};

const kabData = {
  Chat: {
    selectRoom: "Fren neɣ snulfu Tajmaɛt i usenqed.", blockedUser: "Aseqdac yettwasḥelsel", offline: "Ur yekkis ara", activeCommunity: "Timɣiwt turmid",
    searchMessages: "Nadi iznan", privacySettings: "Iɣewwaṛen n tudert", myVault: "Tanfult-iw", videoCall: "Asiwel s tvidyut",
    roomSettings: "Iɣewwaṛen n texxamt", safetyModeration: "Tɣellist", backToMenu: "Uɣal d ar umuɣ",
    decorateRoom: "Cebbeḥ taxxamt", addMember: "Rnu amaslaḍ", inviteLink: "Aseɣwen n unciḍ", manageRoles: "Sefrek tiwuriwin",
    unlockChat: "Kkes aseɣwen (Akk)", lockChat: "Sewḥel (Imselḥen)", disappearingOn: "Ffer: YERRA (24s)", disappearingOff: "Ffer: YETTWAKKES",
    unblockUser: "Kkes aseḥles", blockUser: "Sewḥel", reportUser: "Azen",
    searchMessagesPlaceholder: "Nadi iznan...", closeSearch: "Mdel", pinnedMessages: "{count} Iznan yettwasemmaḍen", clickToView: "Sit i tmuɣli", dismiss: "Zgel",
    noMessages: "Ulac iznan. Ini Azul i {name}!", msgFromBlocked: "Izen sɣur useqdac yettwasḥelselen", you: "Kečč",
    reply: "Err", forward: "Azen", react: "Tiririt", translate: "Suqel", edit: "Ẓreg", delete: "Kkes", pin: "Semmeḍ", save: "Sekles",
    sending: "Azen...", edited: "yettwaẓreg", saving: "Sekles...", saveToATK: "Sekles deg ATK", savedToATK: "Yettwasekles ✨", saveFailed: "Ur yettwasekles ara", cancel: "Sefsex",
    typing: "{users} yetttira...", replyingTo: "Err i {name}", media: "Amidya", file: "Afaylu",
    aiScanning: "Asla n AI...", uploading: "Asali...", recording: "Asuklu...", replyPlaceholder: "Err i {name}...", messagePlaceholder: "Izen...", mention: "Bder", stickers: "Stickers",
    mentionMember: "Bder amaslaḍ", emotions: "Tiririyin", identity: "Tigzi & Ccan", noStickers: "Ulac stickers.", sendMessage: "Azen"
  },
  Feed: {
    homeFeed: "Asfaylu", posts: "Tasuffɣa", reels: "Reels (TikTok)", global: "Akk", following: "Iḍfaren", createStory: "Snulfu taqsit",
    whoToFollow: "Iḍfaren", newToThimlilith: "Amaynut deg Thimlilith", follow: "Ḍfer", whatsOnYourMind: "Ac tesnermisen? Seqdec #hashtags...",
    addImage: "Rnu tawlaft", posting: "Asuffeɣ...", post: "Suffeɣ", emptyFollowing: "Ur teḍfir ara yiwen.",
    emptyGlobal: "Ulac tasuffɣa. D kečč amezwaru!", comment: "Tamawt", share: "Bḍu", reelsPhase5: "Reels ddun-d.", backToChat: "Uɣal d ar usenqed"
  },
  Discover: {
    discover: "Ssenqed", findCommunities: "Af timɣiwin n Taqbaylit.", noCommunities: "Ulac timɣiwin.",
    members: "{count} imaslaḍen", joined: "Yedda", processing: "Yetteddu...", join: "Ddu", backToChat: "Uɣal d ar usenqed"
  }
};

updateJSON('en', enData);
updateJSON('fr', frData);
updateJSON('ar', arData);
updateJSON('kab', kabData);
console.log('✅ JSON dictionaries updated for all 4 languages.');

// ==========================================
// 2. PATCH ChatArea.tsx
// ==========================================
const chatP = 'src/app/[locale]/(chat)/rooms/components/ChatArea.tsx';
fs.copyFileSync(chatP, chatP + '.bak');
let c = fs.readFileSync(chatP, 'utf8');

c = c.replace("import { getYouTubeID, renderTextWithLinks, REACTIONS } from './utils';", "import { getYouTubeID, renderTextWithLinks, REACTIONS } from './utils';\nimport { useTranslations } from 'next-intl';");
c = c.replace("export function ChatArea(p: ChatAreaProps) {", "export function ChatArea(p: ChatAreaProps) {\n  const t = useTranslations('Chat');");

c = c.replace(">Select or create a Thajmaath to start chatting.<", ">{t('selectRoom')}<");
c = c.replace('? "Blocked User" : "Offline"', "? t('blockedUser') : t('offline')");
c = c.replace(': "Active community"', ": t('activeCommunity')");
c = c.replace('> Search Messages</button>', "> {t('searchMessages')}</button>");
c = c.replace('> Privacy Settings</button>', "> {t('privacySettings')}</button>");
c = c.replace(/> My Vault<\/span>/, "> {t('myVault')}</span>");
c = c.replace('> Video Call</button>', "> {t('videoCall')}</button>");
c = c.replace('> Room Settings</span>', "> {t('roomSettings')}</span>");
c = c.replace('> Safety & Moderation</span>', "> {t('safetyModeration')}</span>");
c = c.replace('> Back to Menu</button>', "> {t('backToMenu')}</button>");
c = c.replace('> Decorate Room</button>', "> {t('decorateRoom')}</button>");
c = c.replace('> Add Member</button>', "> {t('addMember')}</button>");
c = c.replace('> Invite Link</button>', "> {t('inviteLink')}</button>");
c = c.replace('> Manage Roles</button>', "> {t('manageRoles')}</button>");
c = c.replace(/'Unlock Chat \(Everyone\)' : 'Lock Chat \(Mods Only\)'/, "t('unlockChat') : t('lockChat')");
c = c.replace(/'Disappearing: ON \(24h\)' : 'Disappearing: OFF'/, "t('disappearingOn') : t('disappearingOff')");
c = c.replace(/'Unblock User' : 'Block User'/, "t('unblockUser') : t('blockUser')");
c = c.replace('> Report User</button>', "> {t('reportUser')}</button>");
c = c.replace('placeholder="Search messages..."', "placeholder={t('searchMessagesPlaceholder')}");
c = c.replace('>Close Search</button>', ">{t('closeSearch')}</button>");
c = c.replace('{p.activeRoom.pinnedMessages.length} Pinned Message(s)', "{t('pinnedMessages', { count: p.activeRoom.pinnedMessages.length })}");
c = c.replace('>Click to view</span>', ">{t('clickToView')}</span>");
c = c.replace(/>No messages yet. Say Azul to \{p.activeRoom.type === "direct" \? p.getDMName\(p.activeRoom\) : `Thajmaath n \$\{p.activeRoom.name\}`\}!</, ">{t('noMessages', { name: p.activeRoom.type === \"direct\" ? p.getDMName(p.activeRoom) : `Thajmaath n ${p.activeRoom.name}` })}<");
c = c.replace('>Message from a blocked user<', ">{t('msgFromBlocked')}<");
c = c.replace(/\{isMe \? "You" : \(/, "{isMe ? t('you') : (");

c = c.replace(/title="Reply"/g, "title={t('reply')}");
c = c.replace(/\{isMobile && "Reply"\}/g, "{isMobile && t('reply')}");
c = c.replace(/title="Forward"/g, "title={t('forward')}");
c = c.replace(/\{isMobile && "Forward"\}/g, "{isMobile && t('forward')}");
c = c.replace(/title="React"/g, "title={t('react')}");
c = c.replace(/\{isMobile && "React"\}/g, "{isMobile && t('react')}");
c = c.replace(/title="Translate"/g, "title={t('translate')}");
c = c.replace(/\{isMobile && "Translate"\}/g, "{isMobile && t('translate')}");
c = c.replace(/title="Edit"/g, "title={t('edit')}");
c = c.replace(/\{isMobile && "Edit"\}/g, "{isMobile && t('edit')}");
c = c.replace(/title="Delete"/g, "title={t('delete')}");
c = c.replace(/\{isMobile && "Delete"\}/g, "{isMobile && t('delete')}");
c = c.replace(/title="Pin"/g, "title={t('pin')}");
c = c.replace(/\{isMobile && "Pin"\}/g, "{isMobile && t('pin')}");
c = c.replace(/title="Save to Vault"/g, "title={t('save')}");
c = c.replace(/\{isMobile && "Save"\}/g, "{isMobile && t('save')}");

c = c.replace(': \'Sending...\'}', ": t('sending')}");
c = c.replace(/\(\s*edited\s*\)/, "({t('edited')})");
c = c.replace(/\{p.typingUsers.join\(" and "\)\} \{p.typingUsers.length === 1 \? 'is' : 'are'\} typing\.\.\./, "{t('typing', { users: p.typingUsers.join(' & ') })}");
c = c.replace(/Replying to \{p.replyingTo.senderName\}/, "{t('replyingTo', { name: p.replyingTo.senderName })}");
c = c.replace(/"Media"/, "t('media')");

c = c.replace(/placeholder=\{p.isCheckingAI \? "AI Scanning\.\.\." : p.uploading \? "Uploading\.\.\." : p.isRecording \? "Recording\.\.\." : p.replyingTo \? `Reply to \$\{p.replyingTo.senderName\}\.\.\.` : `Message\.\.\.`\}/, "placeholder={p.isCheckingAI ? t('aiScanning') : p.uploading ? t('uploading') : p.isRecording ? t('recording') : p.replyingTo ? t('replyPlaceholder', { name: p.replyingTo.senderName }) : t('messagePlaceholder')}");

c = c.replace('>Mention Member</p>', ">{t('mentionMember')}</p>");
c = c.replace(/>Émotions \(\{stickers.emotions.length\}\)<\/h4>/, ">{t('emotions')} ({stickers.emotions.length})</h4>");
c = c.replace(/>Identité & Fierté \(\{stickers.identity.length\}\)<\/h4>/, ">{t('identity')} ({stickers.identity.length})</h4>");
c = c.replace('>No stickers found. Drop images in the public folder!</p>', ">{t('noStickers')}</p>");

fs.writeFileSync(chatP, c, 'utf8');
console.log('✅ ChatArea.tsx patched.');

// ==========================================
// 3. PATCH feed/page.tsx
// ==========================================
const feedP = 'src/app/[locale]/feed/page.tsx';
fs.copyFileSync(feedP, feedP + '.bak');
let f = fs.readFileSync(feedP, 'utf8');

f = f.replace("import { onAuthStateChanged, User } from 'firebase/auth';", "import { onAuthStateChanged, User } from 'firebase/auth';\nimport { useTranslations } from 'next-intl';");
f = f.replace("export default function FeedPage() {", "export default function FeedPage() {\n  const t = useTranslations('Feed');");

f = f.replace('>Home Feed</h1>', ">{t('homeFeed')}</h1>");
f = f.replace(/>\s*.*?\s*Posts<\/button>/, ">{t('posts')}</button>");
f = f.replace(/>\s*.*?\s*Reels \(TikTok\)<\/button>/, ">{t('reels')}</button>");
f = f.replace('>Reels feed coming in Phase 5 (Next Build).</p>', ">{t('reelsPhase5')}</p>");
f = f.replace(/>\s*.*?\s*Global<\/button>/, "> {t('global')}</button>");
f = f.replace(/>\s*.*?\s*Following<\/button>/, "> {t('following')}</button>");
f = f.replace('>Create Story</span>', ">{t('createStory')}</span>");
f = f.replace('>Who to follow</h3>', ">{t('whoToFollow')}</h3>");
f = f.replace('>New to Thimlilith</p>', ">{t('newToThimlilith')}</p>");
f = f.replace(/\? '\.\.\.' : 'Follow'/, "? '...' : t('follow')");
f = f.replace(/placeholder="What's on your mind\? Use #hashtags\.\.\."/, "placeholder={t('whatsOnYourMind')}");
f = f.replace(/>\s*.*?\s*Add Image<\/button>/, "> {t('addImage')}</button>");
f = f.replace('>Cancel</button>', ">{t('cancel')}</button>");
f = f.replace(/\? 'Posting\.\.\.' : 'Post'/, "? t('posting') : t('post')");
f = f.replace(/"You aren't following anyone yet, or they haven't posted\." : "No posts yet\. Be the first to share something!"/, "t('emptyFollowing') : t('emptyGlobal')");
f = f.replace(/>\s*.*?\s*Comment<\/button>/, "> {t('comment')}</button>");
f = f.replace(/>\s*.*?\s*Share<\/button>/, "> {t('share')}</button>");
f = f.replace(/>\s*.*?\s*Back to Chat<\/Link>/, ">{t('backToChat')}</Link>");

fs.writeFileSync(feedP, f, 'utf8');
console.log('✅ feed/page.tsx patched.');

// ==========================================
// 4. PATCH discover/page.tsx
// ==========================================
const discP = 'src/app/[locale]/discover/page.tsx';
fs.copyFileSync(discP, discP + '.bak');
let d = fs.readFileSync(discP, 'utf8');

d = d.replace("import { onAuthStateChanged, User } from 'firebase/auth';", "import { onAuthStateChanged, User } from 'firebase/auth';\nimport { useTranslations } from 'next-intl';");
d = d.replace("export default function DiscoverPage() {", "export default function DiscoverPage() {\n  const t = useTranslations('Discover');");

d = d.replace(/>\s*.*?\s*Back to Chat<\/Link>/, ">{t('backToChat')}</Link>");
d = d.replace(/>\s*.*?\s*Discover<\/h1>/, ">{t('discover')}</h1>");
d = d.replace('>Find new Kabyle communities to join.</p>', ">{t('findCommunities')}</p>");
d = d.replace('>No public communities found yet.</p>', ">{t('noCommunities')}</p>");
d = d.replace(/\{room.members\?\.length \|\| 0\} Members<\/p>/, "{t('members', { count: room.members?.length || 0 })}</p>");
d = d.replace(/>Joined<\/button>/, ">{t('joined')}</button>");
d = d.replace(/\? 'Processing\.\.\.' : room\.isPaid \? `\s*.*?\s*€\$\{room\.price\}\/mo` : 'Join'/, "? t('processing') : room.isPaid ? `🔒 €${room.price}/mo` : t('join')");

fs.writeFileSync(discP, d, 'utf8');
console.log('✅ discover/page.tsx patched.');

console.log('\n🚀 ALL DONE! Restart your dev server.');