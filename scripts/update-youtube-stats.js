import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';

// .envの内容をロード（ローカルテスト用）
dotenv.config();

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT;
// 環境変数か、すでに作成されているAI Studio用のDB IDを指定
const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-c3371ee5-7189-4594-b259-0526d7e86644'; 

if (!API_KEY || !CHANNEL_ID || !SERVICE_ACCOUNT_JSON) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

// Firebase Admin 初期化
let app;
try {
  const serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON);
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error("Failed to parse Firebase service account or initialize:", error);
  process.exit(1);
}

// 特定のデータベースIDを指定してFirestoreインスタンスを取得
const db = getFirestore(app, DATABASE_ID);

const youtube = google.youtube({
  version: 'v3',
  auth: API_KEY
});

async function main() {
  try {
    const response = await youtube.channels.list({
      part: ['statistics'],
      id: [CHANNEL_ID]
    });

    const items = response.data.items;
    if (items && items.length > 0) {
      const stats = items[0].statistics;
      const subscriberCount = parseInt(stats.subscriberCount || '0', 10);
      const viewCount = parseInt(stats.viewCount || '0', 10);

      console.log(`Fetched stats -> Subs: ${subscriberCount}, Views: ${viewCount}`);

      // Firestoreに書き込み (App.tsxが購読しているドキュメント)
      await db.collection('settings').doc('stats').set({
        subscribers: subscriberCount,
        views: viewCount,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log('Successfully updated Firestore stats.');
    } else {
      console.log('Channel not found or no stats available.');
    }
  } catch (error) {
    console.error('Error fetching/updating YouTube stats:', error);
    process.exit(1);
  }
}

main();
