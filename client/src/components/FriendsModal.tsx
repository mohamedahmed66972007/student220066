
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  UserPlus, 
  Check, 
  X, 
  Users, 
  Calendar,
  Copy,
  Trash2
} from "lucide-react";
import { useFriends, UserProfile, Friend, FriendRequest } from "@/hooks/useFriends";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { StudySession } from "@/pages/StudySchedule";

interface FriendsModalProps {
  open: boolean;
  onClose: () => void;
  onCopyFriendSchedule?: (sessions: StudySession[]) => void;
}

export default function FriendsModal({ open, onClose, onCopyFriendSchedule }: FriendsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("friends");
  
  const { user } = useAuth();
  const { toast } = useToast();
  const {
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
  } = useFriends();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setSearching(true);
    try {
      const results = await searchUsers(searchTerm);
      setSearchResults(results);
    } catch (error) {
      toast({
        title: "خطأ في البحث",
        description: "حدث خطأ أثناء البحث عن المستخدمين",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (toUser: UserProfile) => {
    try {
      await sendFriendRequest(toUser);
      toast({
        title: "تم إرسال الطلب",
        description: `تم إرسال طلب صداقة إلى ${toUser.email}`,
      });
      setSearchResults([]);
      setSearchTerm("");
    } catch (error) {
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال طلب الصداقة",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    try {
      await acceptFriendRequest(request);
      toast({
        title: "تم قبول الطلب",
        description: `أصبحت صديقاً مع ${request.fromUserName}`,
      });
    } catch (error) {
      toast({
        title: "خطأ في القبول",
        description: "حدث خطأ أثناء قبول طلب الصداقة",
        variant: "destructive",
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await declineFriendRequest(requestId);
      toast({
        title: "تم رفض الطلب",
        description: "تم رفض طلب الصداقة",
      });
    } catch (error) {
      toast({
        title: "خطأ في الرفض",
        description: "حدث خطأ أثناء رفض طلب الصداقة",
        variant: "destructive",
      });
    }
  };

  const handleCopySchedule = async (friend: Friend) => {
    try {
      const friendSchedule = await getFriendStudySchedule(friend.userId);
      if (friendSchedule.length === 0) {
        toast({
          title: "لا يوجد جدول",
          description: "صديقك لا يملك جدول مذاكرة حالياً",
          variant: "destructive",
        });
        return;
      }
      
      if (onCopyFriendSchedule) {
        onCopyFriendSchedule(friendSchedule);
        toast({
          title: "تم نسخ الجدول",
          description: `تم نسخ جدول مذاكرة ${friend.userName}`,
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: "خطأ في النسخ",
        description: "حدث خطأ أثناء نسخ جدول المذاكرة",
        variant: "destructive",
      });
    }
  };

  const isAlreadyFriend = (userId: string) => {
    return friends.some(friend => friend.userId === userId);
  };

  const hasPendingRequest = (userId: string) => {
    return sentRequests.some(request => request.toUserId === userId);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">الأصدقاء</DialogTitle>
        </DialogHeader>

        {/* User Profile Section */}
        <Card className="mb-4">
          <CardContent className="flex items-center space-x-4 space-x-reverse p-4">
            <Avatar>
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{user?.displayName || user?.email}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Badge variant="secondary">أنت</Badge>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">البحث</TabsTrigger>
            <TabsTrigger value="requests">
              الطلبات
              {friendRequests.length > 0 && (
                <Badge variant="destructive" className="mr-2">
                  {friendRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="friends">
              الأصدقاء
              <Badge variant="secondary" className="mr-2">
                {friends.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <div className="flex space-x-2 space-x-reverse">
              <Input
                placeholder="ابحث بالإيميل أو اسم المستخدم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                onClick={handleSearch} 
                disabled={searching || !searchTerm.trim()}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {searchResults.map((user) => (
                <Card key={user.uid}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Avatar>
                        <AvatarFallback>
                          {user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.displayName || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    
                    {isAlreadyFriend(user.uid) ? (
                      <Badge variant="default">صديق</Badge>
                    ) : hasPendingRequest(user.uid) ? (
                      <Badge variant="secondary">مرسل</Badge>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => handleSendRequest(user)}
                      >
                        <UserPlus className="h-4 w-4 ml-2" />
                        إضافة
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {searchResults.length === 0 && searchTerm && !searching && (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4" />
                    <p>لا توجد نتائج للبحث</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {friendRequests.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-4" />
                  <p>لا توجد طلبات صداقة</p>
                </CardContent>
              </Card>
            ) : (
              friendRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Avatar>
                        <AvatarFallback>
                          {request.fromUserEmail.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.fromUserName}</p>
                        <p className="text-sm text-muted-foreground">{request.fromUserEmail}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 space-x-reverse">
                      <Button 
                        size="sm" 
                        onClick={() => handleAcceptRequest(request)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeclineRequest(request.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="friends" className="space-y-4">
            {friends.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4" />
                  <p>لا يوجد أصدقاء بعد</p>
                </CardContent>
              </Card>
            ) : (
              friends.map((friend) => (
                <Card key={friend.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Avatar>
                        <AvatarFallback>
                          {friend.userEmail.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{friend.userName}</p>
                        <p className="text-sm text-muted-foreground">{friend.userEmail}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 space-x-reverse">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCopySchedule(friend)}
                      >
                        <Copy className="h-4 w-4 ml-2" />
                        نسخ الجدول
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => removeFriend(friend.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
