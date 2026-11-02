const fs = require('fs');

// 1. Write the 4 JSON files safely
const enData = {
  "Nav": { "chats": "Chats", "feed": "Feed", "following": "Following", "communities": "Communities", "video": "Video", "more": "More" },
  "Hub": {
    "title": "Action Hub", "startChat": "Start a Chat", "startChatSub": "Message someone new",
    "createRoom": "Create a Room", "createRoomSub": "Host a Thajmaath", "goLive": "Go Live", "goLiveSub": "Broadcast to your audience",
    "videoCall": "Video Call", "videoCallSub": "LiveKit Stage", "myVault": "My Vault", "myVaultSub": "Saved messages",
    "myProfile": "My Profile", "myProfileSub": "View your profile", "logout": "Log Out", "logoutSub": "Sign out of Thimlilith",
    "safety": "Safety & Mods", "safetySub": "Report, block, & appeals"
  },
  "Sidebar": {
    "chats": "Chats", "feed": "Feed", "following": "Following", "communities": "Communities", "video": "Video", "learn": "Learn", "friends": "Friends",
    "thajmaathin": "Thajmaathin", "find": "Find", "yourCommunities": "Your Communities", "roomNamePlaceholder": "E.g. Paris...",
    "premiumRoom": "Premium Room 🔒", "pricePlaceholder": "Price (e.g. 5)", "create": "Create", "cancel": "Cancel",
    "requests": "Requests", "wantsToBeFriends": "wants to be friends", "accept": "Accept", "reject": "Reject",
    "myFriends": "My Friends", "noFriends": "No friends yet.", "friend": "Friend", "chat": "Chat",
    "blockedUsers": "Blocked Users", "unblock": "Unblock", "searchPlaceholder": "Search by name...", "searching": "Searching...", "search": "Search",
    "noUsers": "No users found.", "message": "Message", "addFriend": "Add Friend", "adSpace": "[ Google AdSense Space ]",
    "hidePremium": "Hide with Premium 💎", "goPremium": "💎 Go Premium (€4.99/mo)", "premiumMember": "👑 Premium Member",
    "supportKabyle": "Support the Kabyle language ❤️", "customAmount": "Custom €", "minAmountError": "Please enter an amount of €1 or more.",
    "confirmDonation": "Are you sure you want to donate €{amount}? Thank you! ❤️", "tip": "Tip"
  }
};

const frData = {
  "Nav": { "chats": "Discussions", "feed": "Fil d'actualité", "following": "Abonnements", "communities": "Communautés", "video": "Vidéo", "more": "Plus" },
  "Hub": {
    "title": "Centre d'action", "startChat": "Démarrer une discussion", "startChatSub": "Envoyer un message à quelqu'un",
    "createRoom": "Créer un salon", "createRoomSub": "Animer une Thajmaath", "goLive": "Passer en direct", "goLiveSub": "Diffuser à votre audience",
    "videoCall": "Appel vidéo", "videoCallSub": "Scène LiveKit", "myVault": "Mon coffre-fort", "myVaultSub": "Messages sauvegardés",
    "myProfile": "Mon profil", "myProfileSub": "Voir votre profil", "logout": "Se déconnecter", "logoutSub": "Quitter Thimlilith",
    "safety": "Sécurité et modération", "safetySub": "Signaler, bloquer et faire appel"
  },
  "Sidebar": {
    "chats": "Discussions", "feed": "Fil d'actualité", "following": "Abonnements", "communities": "Communautés", "video": "Vidéo", "learn": "Apprendre", "friends": "Amis",
    "thajmaathin": "Thajmaathin", "find": "Trouver", "yourCommunities": "Vos communautés", "roomNamePlaceholder": "Ex. Paris...",
    "premiumRoom": "Salon Premium 🔒", "pricePlaceholder": "Prix (ex. 5)", "create": "Créer", "cancel": "Annuler",
    "requests": "Demandes", "wantsToBeFriends": "veut être votre ami", "accept": "Accepter", "reject": "Refuser",
    "myFriends": "Mes amis", "noFriends": "Pas encore d'amis.", "friend": "Ami", "chat": "Discuter",
    "blockedUsers": "Utilisateurs bloqués", "unblock": "Débloquer", "searchPlaceholder": "Rechercher par nom...", "searching": "Recherche...", "search": "Rechercher",
    "noUsers": "Aucun utilisateur trouvé.", "message": "Message", "addFriend": "Ajouter un ami", "adSpace": "[ Espace Google AdSense ]",
    "hidePremium": "Masquer avec Premium 💎", "goPremium": "💎 Devenir Premium (4,99 €/mois)", "premiumMember": "👑 Membre Premium",
    "supportKabyle": "Soutenez la langue kabyle ❤️", "customAmount": "Montant €", "minAmountError": "Veuillez saisir un montant de 1 € ou plus.",
    "confirmDonation": "Êtes-vous sûr de vouloir donner {amount} € ? Merci ! ❤️", "tip": "Pourboire"
  }
};

const arData = {
  "Nav": { "chats": "الدردشات", "feed": "الخلاصة", "following": "المتابعون", "communities": "المجتمعات", "video": "فيديو", "more": "المزيد" },
  "Hub": {
    "title": "مركز الإجراءات", "startChat": "بدء محادثة", "startChatSub": "راسل شخصاً جديداً",
    "createRoom": "إنشاء غرفة", "createRoomSub": "استضف ثجمعث", "goLive": "البث المباشر", "goLiveSub": "بث لجمهورك",
    "videoCall": "مكالمة فيديو", "videoCallSub": "منصة LiveKit", "myVault": "خزنتي", "myVaultSub": "الرسائل المحفوظة",
    "myProfile": "ملفي الشخصي", "myProfileSub": "عرض ملفك", "logout": "تسجيل الخروج", "logoutSub": "الخروج من ثيمليليث",
    "safety": "الأمان والإشراف", "safetySub": "إبلاغ، حظر"
  },
  "Sidebar": {
    "chats": "الدردشات", "feed": "الخلاصة", "following": "المتابعون", "communities": "المجتمعات", "video": "فيديو", "learn": "تعلم", "friends": "الأصدقاء",
    "thajmaathin": "ثجمعثين", "find": "بحث", "yourCommunities": "مجتمعاتك", "roomNamePlaceholder": "مثال: باريس...",
    "premiumRoom": "غرفة مميزة 🔒", "pricePlaceholder": "السعر (مثال: 5)", "create": "إنشاء", "cancel": "إلغاء",
    "requests": "الطلبات", "wantsToBeFriends": "يريد أن يكون صديقك", "accept": "قبول", "reject": "رفض",
    "myFriends": "أصدقائي", "noFriends": "لا يوجد أصدقاء بعد.", "friend": "صديق", "chat": "دردشة",
    "blockedUsers": "المستخدمون المحظورون", "unblock": "إلغاء الحظر", "searchPlaceholder": "ابحث بالاسم...", "searching": "جاري البحث...", "search": "بحث",
    "noUsers": "لم يتم العثور على مستخدمين.", "message": "رسالة", "addFriend": "إضافة صديق", "adSpace": "[ مساحة إعلانات جوجل ]",
    "hidePremium": "إخفاء مع المميز 💎", "goPremium": "💎 اشترك المميز (4.99 يورو/شهر)", "premiumMember": "👑 عضو مميز",
    "supportKabyle": "ادعم اللغة القبايلية ❤️", "customAmount": "مبلغ مخصص €", "minAmountError": "يرجى إدخال مبلغ 1 يورو أو أكثر.",
    "confirmDonation": "هل أنت متأكد من التبرع بمبلغ {amount} يورو؟ شكرا لك! ❤️", "tip": "بقشيش"
  }
};

const kabData = {
  "Nav": { "chats": "Imsawalen", "feed": "Asfaylu", "following": "Iḍfaren", "communities": "Timɣiwin", "video": "Tavidyut", "more": "Ugar" },
  "Hub": {
    "title": "Amsedday n Tigawt", "startChat": "Bdu imsawalen", "startChatSub": "Azen izen i yiwen",
    "createRoom": "Snulfu taxxamt", "createRoomSub": "Aqbal Thajmaath", "goLive": "Ddu s trusit", "goLiveSub": "Suffeɣ i imeɣriyen-ik",
    "videoCall": "Asiwel s tvidyut", "videoCallSub": "LiveKit Stage", "myVault": "Tanfult-iw", "myVaultSub": "Izenen yettwaḥerzen",
    "myProfile": "Aqemmus-iw", "myProfileSub": "Wali aqemmus-ik", "logout": "Ffeɣ", "logoutSub": "Ffeɣ seg Thimlilith",
    "safety": "Tɣellist & Mods", "safetySub": "Azen, sewḥel"
  },
  "Sidebar": {
    "chats": "Imsawalen", "feed": "Asfaylu", "following": "Iḍfaren", "communities": "Timɣiwin", "video": "Tavidyut", "learn": "Lmed", "friends": "Imeddukkal",
    "thajmaathin": "Tajmaɛt", "find": "Af", "yourCommunities": "Timɣiwin-ik", "roomNamePlaceholder": "Amedya: Paris...",
    "premiumRoom": "Taxxamt Premium 🔒", "pricePlaceholder": "Ssuma (amedya: 5)", "create": "Snulfu", "cancel": "Sefsex",
    "requests": "Isteqsiyen", "wantsToBeFriends": "yebɣa ad yili d ameddukkel-ik", "accept": "Qbel", "reject": "Agi",
    "myFriends": "Imeddukkal-iw", "noFriends": "Ulac imeddukkal.", "friend": "Ameddukkel", "chat": "Mmeslay",
    "blockedUsers": "Iseqdacen yettwasḥelselen", "unblock": "Kkes aseḥles", "searchPlaceholder": "Nadi s yisem...", "searching": "Anadi...", "search": "Nadi",
    "noUsers": "Ulac iseqdacen.", "message": "Izen", "addFriend": "Rnu ameddukkel", "adSpace": "[ Amḍiq n udellel Google ]",
    "hidePremium": "Ffer s Premium 💎", "goPremium": "💎 Ddu Premium (4.99 €/ayyur)", "premiumMember": "👑 Aɛeggal Premium",
    "supportKabyle": "Ɛawen tutlayt Taqbaylit ❤️", "customAmount": "Ssuma €", "minAmountError": "Sekcem ssuma n 1 € neɣ ugar.",
    "confirmDonation": "Tebɣid ad tessiwel {amount} €? Tanemmirt! ❤️", "tip": "Tip"
  }
};

fs.writeFileSync('messages/en.json', JSON.stringify(enData, null, 2), 'utf8');
fs.writeFileSync('messages/fr.json', JSON.stringify(frData, null, 2), 'utf8');
fs.writeFileSync('messages/ar.json', JSON.stringify(arData, null, 2), 'utf8');
fs.writeFileSync('messages/kab.json', JSON.stringify(kabData, null, 2), 'utf8');

// 2. Patch Sidebars.tsx safely
const sbPath = 'src/app/[locale]/(chat)/rooms/components/Sidebars.tsx';
fs.copyFileSync(sbPath, sbPath + '.bak');
let c = fs.readFileSync(sbPath, 'utf8');

c = c.replace(
  "import { useEffect, useState } from 'react';",
  "import { useEffect, useState } from 'react';\nimport { useTranslations } from 'next-intl';"
);
c = c.replace(
  "export function Sidebars(p: SidebarsProps) {",
  "export function Sidebars(p: SidebarsProps) {\n  const t = useTranslations('Sidebar');"
);

c = c.replace('title="Chats"', "title={t('chats')}");
c = c.replace('title="Feed"', "title={t('feed')}");
c = c.replace('title="Following"', "title={t('following')}");
c = c.replace('title="Communities"', "title={t('communities')}");
c = c.replace('title="Video"', "title={t('video')}");
c = c.replace('label="Learn ATK"', "label={t('learn')}");
c = c.replace('title="Friends"', "title={t('friends')}");

c = c.replace('>Feed</span>', ">{t('feed')}</span>");
c = c.replace('>Discover</span>', ">{t('communities')}</span>");
c = c.replace('label="Learn"', "label={t('learn')}");

c = c.replace('>Thajmaathin</span>', ">{t('thajmaathin')}</span>");
c = c.replace('>Thajmaathin</button>', ">{t('thajmaathin')}</button>");
c = c.replace(/            Friends\r?\n/, "            {t('friends')}\n");
c = c.replace('>Find</button>', ">{t('find')}</button>");

c = c.replace('>Your Communities</h2>', ">{t('yourCommunities')}</h2>");
c = c.replace('placeholder="E.g. Paris..."', "placeholder={t('roomNamePlaceholder')}");
c = c.replace(/Premium Room[^<]*<\/label>/, "{t('premiumRoom')}</label>");
c = c.replace('placeholder="Price (e.g. 5)"', "placeholder={t('pricePlaceholder')}");
c = c.replace('>Create</button>', ">{t('create')}</button>");
c = c.replace('>Cancel</button>', ">{t('cancel')}</button>");

c = c.replace('>Requests</h3>', ">{t('requests')}</h3>");
c = c.replace('> wants to be friends</p>', "> {t('wantsToBeFriends')}</p>");
c = c.replace('>Accept</button>', ">{t('accept')}</button>");
c = c.replace('>Reject</button>', ">{t('reject')}</button>");
c = c.replace('>My Friends</h3>', ">{t('myFriends')}</h3>");
c = c.replace('>No friends yet.</p>', ">{t('noFriends')}</p>");
c = c.replace('>Friend</p>', ">{t('friend')}</p>");
c = c.replace('>Chat</button>', ">{t('chat')}</button>");
c = c.replace('>Blocked Users</h3>', ">{t('blockedUsers')}</h3>");
c = c.replace('>Unblock</button>', ">{t('unblock')}</button>");

c = c.replace('placeholder="Search by name..."', "placeholder={t('searchPlaceholder')}");
c = c.replace("'Searching...' : 'Search'", "t('searching') : t('search')");
c = c.replace('>No users found.</p>', ">{t('noUsers')}</p>");
c = c.replace('>Message</button>', ">{t('message')}</button>");
c = c.replace('>Add Friend</button>', ">{t('addFriend')}</button>");

c = c.replace(/\[ Google AdSense Space \]<br\/>[^<]*/, "{t('adSpace')}<br/>{t('hidePremium')}");
c = c.replace(/>[^<]*Go Premium[^<]*<\/button>/, ">{t('goPremium')}</button>");
c = c.replace(/>[^<]*Premium Member<\/div>/, ">{t('premiumMember')}</div>");
c = c.replace(/>[^<]*Support the Kabyle language[^<]*<\/p>/, ">{t('supportKabyle')}</p>");
c = c.replace('placeholder="Custom €"', "placeholder={t('customAmount')}");
c = c.replace(/`Are you sure you want to donate [^`]+`/, "t('confirmDonation', { amount: amt })");
c = c.replace('alert("Please enter an amount of €1 or more.");', "alert(t('minAmountError'));");
c = c.replace('>Tip</button>', ">{t('tip')}</button>");

fs.writeFileSync(sbPath, c, 'utf8');
console.log('✅ Successfully updated JSON files and patched Sidebars.tsx!');