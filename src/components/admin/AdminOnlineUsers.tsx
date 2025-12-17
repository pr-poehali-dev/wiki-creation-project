import { useState, useEffect } from "react";
import { API_URLS } from "@/config/api";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";

interface OnlineUser {
  email: string;
  nickname: string;
  lastSeen: string;
  loginCount: number;
  visitCount: number;
}

const AdminOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const loadOnlineUsers = async () => {
      try {
        const response = await fetch(API_URLS.ADMIN_ACTIVITY);
        if (response.ok) {
          const data = await response.json();
          setOnlineUsers(data.users || []);
        }
      } catch (error) {
        console.error('Failed to load online users', error);
      }
    };

    loadOnlineUsers();
    const interval = setInterval(loadOnlineUsers, 15000);

    return () => clearInterval(interval);
  }, []);

  if (onlineUsers.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border py-3 px-6 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Icon name="Users" size={16} className="text-green-500" />
            <span className="text-muted-foreground">Онлайн:</span>
            <Badge variant="secondary">{onlineUsers.length}</Badge>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {onlineUsers.map((user) => (
              <div
                key={user.email}
                className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">{user.nickname}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span title="Авторизаций">🔐 {user.loginCount}</span>
                  <span title="Заходов">📊 {user.visitCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOnlineUsers;