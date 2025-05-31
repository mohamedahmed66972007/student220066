
import { useState, useEffect } from "react";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";
import { StudySession } from "@/pages/StudySchedule";

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserEmail: string;
  fromUserName: string;
  toUserId: string;
  toUserEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

export interface Friend {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  friendsSince: Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username: string;
}

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load friends and requests
  useEffect(() => {
    if (!user) {
      setFriends([]);
      setFriendRequests([]);
      setSentRequests([]);
      setLoading(false);
      return;
    }

    // Subscribe to friends
    const friendsQuery = query(
      collection(db, 'friendships'),
      where('participants', 'array-contains', user.uid)
    );
    
    const unsubscribeFriends = onSnapshot(friendsQuery, (snapshot) => {
      const friendsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const friendUserId = data.participants.find((id: string) => id !== user.uid);
        return {
          id: doc.id,
          userId: friendUserId,
          userEmail: data.friendEmails[friendUserId],
          userName: data.friendNames[friendUserId],
          friendsSince: data.createdAt?.toDate() || new Date()
        };
      });
      setFriends(friendsData);
    });

    // Subscribe to received friend requests
    const requestsQuery = query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', user.uid),
      where('status', '==', 'pending')
    );
    
    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as FriendRequest[];
      setFriendRequests(requestsData);
    });

    // Subscribe to sent friend requests
    const sentRequestsQuery = query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', user.uid),
      where('status', '==', 'pending')
    );
    
    const unsubscribeSentRequests = onSnapshot(sentRequestsQuery, (snapshot) => {
      const sentRequestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as FriendRequest[];
      setSentRequests(sentRequestsData);
    });

    setLoading(false);

    return () => {
      unsubscribeFriends();
      unsubscribeRequests();
      unsubscribeSentRequests();
    };
  }, [user]);

  // Search users by email or username
  const searchUsers = async (searchTerm: string): Promise<UserProfile[]> => {
    if (!searchTerm.trim()) return [];

    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const users = snapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile))
        .filter(userData => 
          userData.uid !== user?.uid && 
          (userData.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           userData.username?.toLowerCase().includes(searchTerm.toLowerCase()))
        );

      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  // Send friend request
  const sendFriendRequest = async (toUser: UserProfile) => {
    if (!user) return;

    try {
      await addDoc(collection(db, 'friendRequests'), {
        fromUserId: user.uid,
        fromUserEmail: user.email,
        fromUserName: user.displayName || user.email,
        toUserId: toUser.uid,
        toUserEmail: toUser.email,
        status: 'pending',
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (request: FriendRequest) => {
    if (!user) return;

    try {
      // Update request status
      await updateDoc(doc(db, 'friendRequests', request.id), {
        status: 'accepted'
      });

      // Create friendship document
      await addDoc(collection(db, 'friendships'), {
        participants: [user.uid, request.fromUserId],
        friendEmails: {
          [user.uid]: user.email,
          [request.fromUserId]: request.fromUserEmail
        },
        friendNames: {
          [user.uid]: user.displayName || user.email,
          [request.fromUserId]: request.fromUserName
        },
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  };

  // Decline friend request
  const declineFriendRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'declined'
      });
    } catch (error) {
      console.error('Error declining friend request:', error);
      throw error;
    }
  };

  // Remove friend
  const removeFriend = async (friendshipId: string) => {
    try {
      await deleteDoc(doc(db, 'friendships', friendshipId));
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  };

  // Get friend's study schedule
  const getFriendStudySchedule = async (friendUserId: string): Promise<StudySession[]> => {
    try {
      const scheduleDoc = await getDoc(doc(db, 'studySchedules', friendUserId));
      if (scheduleDoc.exists()) {
        return scheduleDoc.data().sessions || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting friend study schedule:', error);
      return [];
    }
  };

  return {
    friends,
    friendRequests,
    sentRequests,
    loading,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    getFriendStudySchedule
  };
};
