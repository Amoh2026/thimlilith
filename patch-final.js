const fs = require('fs');

const updateJSON = (lang, data) => {
  const p = `messages/${lang}.json`;
  let json = JSON.parse(fs.readFileSync(p, 'utf8'));
  json.Live = data.Live;
  json.CreateRoom = data.CreateRoom;
  json.Auth = data.Auth;
  fs.writeFileSync(p, JSON.stringify(json, null, 2), 'utf8');
};

const enData = {
  Live: {
    title: "Go Live", broadcastTo: "Broadcast to your Thajmaath.", streamTitlePlaceholder: "Stream Title or Room ID (Optional)",
    connecting: "Connecting...", startBroadcasting: "Start Broadcasting", backToRooms: "← Back to Rooms",
    mustBeLoggedIn: "You must be logged in to go live.", failedToStart: "Failed to start broadcast. Check console."
  },
  CreateRoom: {
    title: "Create a Room", subtitle: "Host a Thajmaath (community space).", roomName: "Room Name",
    roomNamePlaceholder: "e.g. Kabyle Poetry Night", description: "Description", descPlaceholder: "What is this room about?",
    paidRoom: "Make this a Paid Room (Premium)", monthlyPrice: "Monthly Price (€)", cancel: "Cancel", createRoom: "Create Room",
    creating: "Creating...", roomRequired: "Room name is required.", mustBeLoggedIn: "You must be logged in.", failedToCreate: "Failed to create room."
  },
  Auth: {
    join: "Join the Thajmaath", email: "Email address", password: "Password", loading: "Loading...", signIn: "Sign In", signUp: "Sign Up"
  }
};

const frData = {
  Live: {
    title: "Passer en direct", broadcastTo: "Diffuser à votre Thajmaath.", streamTitlePlaceholder: "Titre du flux ou ID (Optionnel)",
    connecting: "Connexion...", startBroadcasting: "Démarrer la diffusion", backToRooms: "← Retour aux salons",
    mustBeLoggedIn: "Vous devez être connecté pour passer en direct.", failedToStart: "Échec du démarrage. Vérifiez la console."
  },
  CreateRoom: {
    title: "Créer un salon", subtitle: "Animer une Thajmaath (espace communautaire).", roomName: "Nom du salon",
    roomNamePlaceholder: "ex. Nuit de la poésie kabyle", description: "Description", descPlaceholder: "De quoi parle ce salon ?",
    paidRoom: "Faire de ceci un salon payant (Premium)", monthlyPrice: "Prix mensuel (€)", cancel: "Annuler", createRoom: "Créer le salon",
    creating: "Création...", roomRequired: "Le nom du salon est requis.", mustBeLoggedIn: "Vous devez être connecté.", failedToCreate: "Échec de la création du salon."
  },
  Auth: {
    join: "Rejoindre la Thajmaath", email: "Adresse e-mail", password: "Mot de passe", loading: "Chargement...", signIn: "Se connecter", signUp: "S'inscrire"
  }
};

const arData = {
  Live: {
    title: "البث المباشر", broadcastTo: "بث إلى ثجمعث الخاص بك.", streamTitlePlaceholder: "عنوان البث أو معرف الغرفة (اختياري)",
    connecting: "جاري الاتصال...", startBroadcasting: "بدء البث", backToRooms: "← العودة للغرف",
    mustBeLoggedIn: "يجب عليك تسجيل الدخول للبث.", failedToStart: "فشل بدء البث. تحقق من وحدة التحكم."
  },
  CreateRoom: {
    title: "إنشاء غرفة", subtitle: "استضف ثجمعث (مساحة مجتمعية).", roomName: "اسم الغرفة",
    roomNamePlaceholder: "مثال: ليلة الشعر القبايلي", description: "الوصف", descPlaceholder: "عن ماذا تدور هذه الغرفة؟",
    paidRoom: "اجعل هذه غرفة مدفوعة (مميزة)", monthlyPrice: "السعر الشهري (€)", cancel: "إلغاء", createRoom: "إنشاء غرفة",
    creating: "جاري الإنشاء...", roomRequired: "اسم الغرفة مطلوب.", mustBeLoggedIn: "يجب عليك تسجيل الدخول.", failedToCreate: "فشل إنشاء الغرفة."
  },
  Auth: {
    join: "انضم إلى ثجمعث", email: "البريد الإلكتروني", password: "كلمة المرور", loading: "جاري التحميل...", signIn: "تسجيل الدخول", signUp: "إنشاء حساب"
  }
};

const kabData = {
  Live: {
    title: "Ddu s trusit", broadcastTo: "Suffeɣ i Tejmaɛt-ik.", streamTitlePlaceholder: "Azwel n trusit neɣ ID n texxamt (D afrayan)",
    connecting: "Tuqqna...", startBroadcasting: "Bdu asuffeɣ", backToRooms: "← Uɣal d ar texxamin",
    mustBeLoggedIn: "Yessefk ad tekkseḍ deg umiḍan i trusit.", failedToStart: "Yecceḍ usuffeɣ. Wali console."
  },
  CreateRoom: {
    title: "Snulfu taxxamt", subtitle: "Aqbal Tajmaɛt (amḍiq n tmetti).", roomName: "Isem n texxamt",
    roomNamePlaceholder: "amedya: Iḍ n tmedyazt Taqbaylit", description: "Aglam", descPlaceholder: "Ɣef wacu tettmeslay taxxamt-a?",
    paidRoom: "Err taxxamt-a d tuzzuft (Premium)", monthlyPrice: "Ssuma n wayyur (€)", cancel: "Sefsex", createRoom: "Snulfu taxxamt",
    creating: "Asnulfu...", roomRequired: "Isem n texxamt yewwi.", mustBeLoggedIn: "Yessefk ad tekkseḍ deg umiḍan.", failedToCreate: "Yecceḍ usnulfu n texxamt."
  },
  Auth: {
    join: "Ddu ɣer Tejmaɛt", email: "Tansa imayl", password: "Awal uffir", loading: "Asali...", signIn: "Kcem", signUp: "Ssjil"
  }
};

updateJSON('en', enData);
updateJSON('fr', frData);
updateJSON('ar', arData);
updateJSON('kab', kabData);
console.log('✅ JSON dictionaries updated for Live, CreateRoom, Auth.');

// ==========================================
// 1. Patch Live Page
// ==========================================
const liveP = 'src/app/[locale]/live/page.tsx';
fs.copyFileSync(liveP, liveP + '.bak');
let l = fs.readFileSync(liveP, 'utf8');
l = l.replace("import { doc, setDoc, serverTimestamp } from 'firebase/firestore';", "import { doc, setDoc, serverTimestamp } from 'firebase/firestore';\nimport { useTranslations } from 'next-intl';");
l = l.replace("export default function LiveLobby() {", "export default function LiveLobby() {\n  const t = useTranslations('Live');");
l = l.replace('alert("You must be logged in to go live.");', "alert(t('mustBeLoggedIn'));");
l = l.replace('>Go Live</h1>', ">{t('title')}</h1>");
l = l.replace('>Broadcast to your Thajmaath.</p>', ">{t('broadcastTo')}</p>");
l = l.replace('placeholder="Stream Title or Room ID (Optional)"', "placeholder={t('streamTitlePlaceholder')}");
l = l.replace("? 'Connecting...' : 'Start Broadcasting'", "? t('connecting') : t('startBroadcasting')");
l = l.replace('alert("Failed to start broadcast. Check console.");', "alert(t('failedToStart'));");
l = l.replace('>← Back to Rooms</button>', ">{t('backToRooms')}</button>");
fs.writeFileSync(liveP, l, 'utf8');

// ==========================================
// 2. Patch Create Room Page
// ==========================================
const createP = 'src/app/[locale]/rooms/create/page.tsx';
fs.copyFileSync(createP, createP + '.bak');
let cr = fs.readFileSync(createP, 'utf8');
cr = cr.replace("import { collection, addDoc, serverTimestamp } from 'firebase/firestore';", "import { collection, addDoc, serverTimestamp } from 'firebase/firestore';\nimport { useTranslations } from 'next-intl';");
cr = cr.replace("export default function CreateRoomPage() {", "export default function CreateRoomPage() {\n  const t = useTranslations('CreateRoom');");
cr = cr.replace('alert("You must be logged in.");', "alert(t('mustBeLoggedIn'));");
cr = cr.replace('alert("Room name is required.");', "alert(t('roomRequired'));");
cr = cr.replace('alert("Failed to create room.");', "alert(t('failedToCreate'));");
cr = cr.replace('> Create a Room</h1>', "> {t('title')}</h1>");
cr = cr.replace('>Host a Thajmaath (community space).</p>', ">{t('subtitle')}</p>");
cr = cr.replace('>Room Name</label>', ">{t('roomName')}</label>");
cr = cr.replace('placeholder="e.g. Kabyle Poetry Night"', "placeholder={t('roomNamePlaceholder')}");
cr = cr.replace('>Description</label>', ">{t('description')}</label>");
cr = cr.replace('placeholder="What is this room about?"', "placeholder={t('descPlaceholder')}");
cr = cr.replace('>Make this a Paid Room (Premium)</label>', ">{t('paidRoom')}</label>");
cr = cr.replace('>Monthly Price (€)</label>', ">{t('monthlyPrice')}</label>");
cr = cr.replace('>Cancel</button>', ">{t('cancel')}</button>");
cr = cr.replace("? 'Creating...' : 'Create Room'", "? t('creating') : t('createRoom')");
fs.writeFileSync(createP, cr, 'utf8');

// ==========================================
// 3. Patch Login Page
// ==========================================
const loginP = 'src/app/[locale]/account/login/page.tsx';
fs.copyFileSync(loginP, loginP + '.bak');
let lg = fs.readFileSync(loginP, 'utf8');
lg = lg.replace("import { useAuth } from '@/components/auth/AuthProvider';", "import { useAuth } from '@/components/auth/AuthProvider';\nimport { useTranslations } from 'next-intl';");
lg = lg.replace("export default function LoginPage() {", "export default function LoginPage() {\n  const t = useTranslations('Auth');");
lg = lg.replace('>Loading...</div>', ">{t('loading')}</div>");
lg = lg.replace('— Join the Thajmaath</p>', "— {t('join')}</p>");
lg = lg.replace('placeholder="Email address"', "placeholder={t('email')}");
lg = lg.replace('placeholder="Password"', "placeholder={t('password')}");
fs.writeFileSync(loginP, lg, 'utf8');

console.log('✅ Live, CreateRoom, and Login pages patched.');