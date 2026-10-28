// src/app/api/cron/daily-word/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (
    process.env.NODE_ENV === 'production' && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = adminDb();
    
    // 1. Fetch a random word from the dictionary
    const wordsSnap = await db.collection('db2_words').limit(50).get();
    if (wordsSnap.empty) {
      return NextResponse.json({ error: 'No words found in db2_words' }, { status: 404 });
    }
    
    const randomIndex = Math.floor(Math.random() * wordsSnap.docs.length);
    const wordData = wordsSnap.docs[randomIndex].data();
    
    // 2. Map to your EXACT Firestore field names
    const kabyleWord = wordData.kab_latin || 'Awal';
    const frenchWord = wordData.fr || '-';
    const englishWord = wordData.en || '-';
    const arabicWord = wordData.ar || '-';
    const tifinagh = wordData.kab_tifinagh; // This can be null
    
    // 3. Format the message beautifully, hiding Tifinagh if it's null
    let botMessage = `🌞 **Awal n Was** (Word of the Day)\n\n`;
    botMessage += `ⵣ **Kabyle:** ${kabyleWord}\n`;
    if (tifinagh) {
      botMessage += `ⵜⵉⴼⵉⵏⴰⵖ **Tifinagh:** ${tifinagh}\n`;
    }
    botMessage += `🇫🇷 **Français:** ${frenchWord}\n`;
    botMessage += `🇬🇧 **English:** ${englishWord}\n`;
    if (arabicWord !== '-') {
      botMessage += `🇸🇦 **Arabic:** ${arabicWord}\n`;
    }
    botMessage += `\n*Save this word to your ATK!* 💾`;

    // 4. Send to all group rooms
    const roomsSnap = await db.collection('rooms')
      .where('type', '==', 'group')
      .get();

    const batch = db.batch();
    let sentCount = 0;

    roomsSnap.forEach((roomDoc) => {
      const messageRef = db.collection('rooms').doc(roomDoc.id).collection('messages').doc();
      
      batch.set(messageRef, {
        senderId: 'system_daily_word_bot',
        senderName: 'Thimlilith Bot 🤖',
        text: botMessage,
        type: 'text',
        createdAt: new Date(),
        readBy: [],
        reactions: {},
      });

      batch.update(roomDoc.ref, {
        lastMessageAt: new Date(),
        lastMessageText: `🌞 Word of the Day: ${kabyleWord}`,
        lastMessageSenderId: 'system_daily_word_bot',
      });
      
      sentCount++;
    });

    await batch.commit();

    return NextResponse.json({ success: true, sentToRooms: sentCount, word: kabyleWord });
  } catch (error: any) {
    console.error('Daily Word Bot error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}