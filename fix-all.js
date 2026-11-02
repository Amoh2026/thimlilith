const fs = require('fs');

// 1. Restore from backups to undo the regex damage
const chatP = 'src/app/[locale]/(chat)/rooms/components/ChatArea.tsx';
const feedP = 'src/app/[locale]/feed/page.tsx';
const discP = 'src/app/[locale]/discover/page.tsx';

if (fs.existsSync(chatP + '.bak')) fs.copyFileSync(chatP + '.bak', chatP);
if (fs.existsSync(feedP + '.bak')) fs.copyFileSync(feedP + '.bak', feedP);
if (fs.existsSync(discP + '.bak')) fs.copyFileSync(discP + '.bak', discP);

// 2. Patch ChatArea.tsx
let c = fs.readFileSync(chatP, 'utf8');
c = c.replace("import { getYouTubeID, renderTextWithLinks, REACTIONS } from './utils';", "import { getYouTubeID, renderTextWithLinks, REACTIONS } from './utils';\nimport { useTranslations } from 'next-intl';");
c = c.replace("export function ChatArea(p: ChatAreaProps) {", "export function ChatArea(p: ChatAreaProps) {\n  const t = useTranslations('Chat');");
c = c.replace('>Select or create a Thajmaath to start chatting.<', ">{t('selectRoom')}<");
c = c.replace('? "Blocked User" : "Offline"', "? t('blockedUser') : t('offline')");
c = c.replace(': "Active community"', ": t('activeCommunity')");
c = c.replace('> Search Messages</button>', "> {t('searchMessages')}</button>");
c = c.replace('> Privacy Settings</button>', "> {t('privacySettings')}</button>");
c = c.replace('<span className="text-teal-400">ⵡ</span> My Vault', '<span className="text-teal-400">ⵡ</span> {t(\'myVault\')}');
c = c.replace('> Video Call</button>', "> {t('videoCall')}</button>");
c = c.replace('<span className="text-teal-400">ⵜ</span> Room Settings', '<span className="text-teal-400">ⵜ</span> {t(\'roomSettings\')}');
c = c.replace('<span className="text-teal-400">ⴱ</span> Safety & Moderation', '<span className="text-teal-400">ⴱ</span> {t(\'safetyModeration\')}');
c = c.replace('<span>◀</span> Back to Menu', '<span>◀</span> {t(\'backToMenu\')}');
c = c.replace('>🎨 Decorate Room</button>', "> {t('decorateRoom')}</button>");
c = c.replace('>➕ Add Member</button>', "> {t('addMember')}</button>");
c = c.replace('>🔗 Invite Link</button>', "> {t('inviteLink')}</button>");
c = c.replace('>👑 Manage Roles</button>', "> {t('manageRoles')}</button>");
c = c.replace("'🔓 Unlock Chat (Everyone)' : '🔒 Lock Chat (Mods Only)'", "t('unlockChat') : t('lockChat')");
c = c.replace("'⏳ Disappearing: ON (24h)' : '⏳ Disappearing: OFF'", "t('disappearingOn') : t('disappearingOff')");
c = c.replace("'🚫 Unblock User' : '🚫 Block User'", "t('unblockUser') : t('blockUser')");
c = c.replace('>⚠️ Report User</button>', "> {t('reportUser')}</button>");
c = c.replace('placeholder="Search messages..."', "placeholder={t('searchMessagesPlaceholder')}");
c = c.replace('>Close Search</button>', ">{t('closeSearch')}</button>");
c = c.replace('{p.activeRoom.pinnedMessages.length} Pinned Message(s)', "{t('pinnedMessages', { count: p.activeRoom.pinnedMessages.length })}");
c = c.replace('>Click to view</span>', ">{t('clickToView')}</span>");
c = c.replace('>No messages yet. Say Azul to {p.activeRoom.type === "direct" ? p.getDMName(p.activeRoom) : `Thajmaath n ${p.activeRoom.name}`}!</div>', '>{t(\'noMessages\', { name: p.activeRoom.type === "direct" ? p.getDMName(p.activeRoom) : `Thajmaath n ${p.activeRoom.name}` })}</div>');
c = c.replace('>Message from a blocked user</div>', ">{t('msgFromBlocked')}</div>");
c = c.replace('{isMe ? "You" : (', "{isMe ? t('you') : (");
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
c = c.replace('(edited)', "({t('edited')})");
c = c.replace('Replying to {p.replyingTo.senderName}', "{t('replyingTo', { name: p.replyingTo.senderName })}");
c = c.replace('"Media"', "t('media')");
c = c.replace('placeholder={p.isCheckingAI ? "AI Scanning..." : p.uploading ? "Uploading..." : p.isRecording ? "Recording..." : p.replyingTo ? `Reply to ${p.replyingTo.senderName}...` : `Message...`}', "placeholder={p.isCheckingAI ? t('aiScanning') : p.uploading ? t('uploading') : p.isRecording ? t('recording') : p.replyingTo ? t('replyPlaceholder', { name: p.replyingTo.senderName }) : t('messagePlaceholder')}");
c = c.replace('>Mention Member</p>', ">{t('mentionMember')}</p>");
c = c.replace('>Émotions ({stickers.emotions.length})</h4>', ">{t('emotions')} ({stickers.emotions.length})</h4>");
c = c.replace('>Identité & Fierté ({stickers.identity.length})</h4>', ">{t('identity')} ({stickers.identity.length})</h4>");
c = c.replace('>No stickers found. Drop images in the public folder!</p>', ">{t('noStickers')}</p>");
fs.writeFileSync(chatP, c, 'utf8');

// 3. Patch feed/page.tsx
let f = fs.readFileSync(feedP, 'utf8');
f = f.replace("import { onAuthStateChanged, User } from 'firebase/auth';", "import { onAuthStateChanged, User } from 'firebase/auth';\nimport { useTranslations } from 'next-intl';");
f = f.replace("export default function FeedPage() {", "export default function FeedPage() {\n  const t = useTranslations('Feed');");
f = f.replace('>Home Feed</h1>', ">{t('homeFeed')}</h1>");
f = f.replace('>📝 Posts</button>', ">{t('posts')}</button>");
f = f.replace('>🎬 Reels (TikTok)</button>', ">{t('reels')}</button>");
f = f.replace('>Reels feed coming in Phase 5 (Next Build).</p>', ">{t('reelsPhase5')}</p>");
f = f.replace('>🌍 Global</button>', ">{t('global')}</button>");
f = f.replace('>📖 Following</button>', ">{t('following')}</button>");
f = f.replace('>Create Story</span>', ">{t('createStory')}</span>");
f = f.replace('>Who to follow</h3>', ">{t('whoToFollow')}</h3>");
f = f.replace('>New to Thimlilith</p>', ">{t('newToThimlilith')}</p>");
f = f.replace("? '...' : 'Follow'", "? '...' : t('follow')");
f = f.replace(/placeholder="What's on your mind\? Use #hashtags\.\.\."/, "placeholder={t('whatsOnYourMind')}");
f = f.replace('<span className="font-bold text-base">ⵉ</span> Add Image', "{t('addImage')}");
f = f.replace('>Cancel</button>', ">{t('cancel')}</button>");
f = f.replace("? 'Posting...' : 'Post'", "? t('posting') : t('post')");
f = f.replace('"You aren\'t following anyone yet, or they haven\'t posted." : "No posts yet. Be the first to share something!"', "t('emptyFollowing') : t('emptyGlobal')");
f = f.replace('<span className="font-bold text-base">ⵎ</span> Comment', "{t('comment')}");
f = f.replace('<span className="font-bold text-base">ⵙ</span> Share', "{t('share')}");
f = f.replace('>← Back to Chat</Link>', ">{t('backToChat')}</Link>");
fs.writeFileSync(feedP, f, 'utf8');

// 4. Patch discover/page.tsx
let d = fs.readFileSync(discP, 'utf8');
d = d.replace("import { onAuthStateChanged, User } from 'firebase/auth';", "import { onAuthStateChanged, User } from 'firebase/auth';\nimport { useTranslations } from 'next-intl';");
d = d.replace("export default function DiscoverPage() {", "export default function DiscoverPage() {\n  const t = useTranslations('Discover');");
d = d.replace('>← Back to Chat</Link>', ">{t('backToChat')}</Link>");
d = d.replace('>🧭 Discover</h1>', ">{t('discover')}</h1>");
d = d.replace('>Find new Kabyle communities to join.</p>', ">{t('findCommunities')}</p>");
d = d.replace('>No public communities found yet.</p>', ">{t('noCommunities')}</p>");
d = d.replace('{room.members?.length || 0} Members</p>', "{t('members', { count: room.members?.length || 0 })}</p>");
d = d.replace('>Joined</button>', ">{t('joined')}</button>");
d = d.replace("? 'Processing...' : room.isPaid ? `🔒 €${room.price}/mo` : 'Join'", "? t('processing') : room.isPaid ? `🔒 €${room.price}/mo` : t('join')");
fs.writeFileSync(discP, d, 'utf8');

// 5. Fix the Layout Hydration Error (lang="en" vs lang="fr")
const layP = 'src/app/[locale]/layout.tsx';
let l = fs.readFileSync(layP, 'utf8');
l = l.replace('const messages = await getMessages();', 'const messages = await getMessages({ locale });');
fs.writeFileSync(layP, l, 'utf8');

console.log('✅ All files restored, fixed, and patched safely!');