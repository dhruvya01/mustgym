import { doc, getDoc, updateDoc, increment, setDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

const GAMIFICATION_COLLECTION = 'memberGamification';
const BADGE_COLLECTION = 'userBadges';

export const addPoints = async (userId: string, points: number) => {
  const gamificationRef = doc(db, GAMIFICATION_COLLECTION, userId);
  const snap = await getDoc(gamificationRef);
  
  if (snap.exists()) {
    await updateDoc(gamificationRef, {
      totalPoints: increment(points),
      updatedAt: new Date().toISOString()
    });
  } else {
    await setDoc(gamificationRef, {
      userId,
      totalPoints: points,
      level: 1,
      updatedAt: new Date().toISOString()
    });
  }
};

export const getGamificationData = async (userId: string) => {
  const gamificationRef = doc(db, GAMIFICATION_COLLECTION, userId);
  const snap = await getDoc(gamificationRef);
  return snap.exists() ? snap.data() : null;
};

export const getLeaderboard = async () => {
    const q = query(collection(db, GAMIFICATION_COLLECTION), orderBy('totalPoints', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    const leaderboard: any[] = [];
    querySnapshot.forEach((doc) => {
        leaderboard.push({ userId: doc.id, ...doc.data() });
    });
    return leaderboard;
};
