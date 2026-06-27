/**
 * Firebase 初期化
 *
 * ログイン不要。Sprint 5 では全利用者が単一の共有ドキュメント `shared/main` を
 * 読み書きする（認証なし）。
 */
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBAoXVnlwkHo0L9Zk7CGDfobuKVxqI3daY',
  authDomain: 'myhome-loanplan.firebaseapp.com',
  projectId: 'myhome-loanplan',
  storageBucket: 'myhome-loanplan.firebasestorage.app',
  messagingSenderId: '172004154703',
  appId: '1:172004154703:web:878cb2ba5caab3cdcdf93a',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
