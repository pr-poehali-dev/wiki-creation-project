import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { API_URLS } from "@/config/api";
import AdminUsersHeader from "@/components/admin-users/AdminUsersHeader";
import AdminUsersTable from "@/components/admin-users/AdminUsersTable";
import UserDialog from "@/components/admin-users/UserDialog";
import ProfileDialog from "@/components/admin-users/ProfileDialog";
import AdminOnlineUsers from "@/components/admin/AdminOnlineUsers";
import { useAdminActivity } from "@/hooks/useAdminActivity";

const AUTH_URL = API_URLS.AUTH;
const SUPER_ADMIN_EMAIL = "ad.alex1995@yandex.ru";

interface User {
  email: string;
  nickname: string;
  role: string;
  created_at: number;
  expires_at: number | null;
}

const AdminUsers = () => {
  const [currentUser, setCurrentUser] = useState<{ email: string; nickname: string; role: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
  const [profileNickname, setProfileNickname] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useAdminActivity(
    localStorage.getItem("adminEmail") || "",
    localStorage.getItem("adminNickname") || localStorage.getItem("adminEmail") || ""
  );

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const savedEmail = localStorage.getItem("adminEmail");
    const savedNickname = localStorage.getItem("adminNickname") || savedEmail;
    const savedRole = localStorage.getItem("adminRole") || "admin";
    
    if (!token || !savedEmail) {
      navigate("/admin");
      return;
    }
    
    setCurrentUser({ email: savedEmail, nickname: savedNickname, role: savedRole });
    
    if (savedEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      loadUsers();
    }
  }, []);

  const loadUsers = async () => {
    const token = localStorage.getItem("adminToken");
    const adminEmail = localStorage.getItem("adminEmail");

    try {
      setLoading(true);
      const response = await fetch(AUTH_URL, {
        method: "GET",
        headers: {
          "X-Admin-Token": token || "",
          "X-Admin-Email": adminEmail || "",
        },
      });

      const data = await response.json();

      if (response.ok && data.users) {
        setUsers(data.users);
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось загрузить пользователей",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось подключиться к серверу",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!editingUser || !editingUser.email || !newPassword) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem("adminToken");
    const adminEmail = localStorage.getItem("adminEmail");

    try {
      const response = await fetch(AUTH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token || "",
          "X-Admin-Email": adminEmail || "",
        },
        body: JSON.stringify({
          email: editingUser.email,
          password: newPassword,
          nickname: editingUser.nickname || editingUser.email,
          expires_days: expiresInDays,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Успех",
          description: "Пользователь создан",
        });
        loadUsers();
        setIsDialogOpen(false);
        setEditingUser(null);
        setNewPassword("");
        setExpiresInDays(null);
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось создать пользователя",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать пользователя",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async (targetEmail: string) => {
    if (!editingUser) return;

    const token = localStorage.getItem("adminToken");
    const adminEmail = localStorage.getItem("adminEmail");

    try {
      const response = await fetch(AUTH_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token || "",
          "X-Admin-Email": adminEmail || "",
        },
        body: JSON.stringify({
          email: targetEmail,
          nickname: editingUser.nickname,
          password: newPassword || undefined,
          expires_days: expiresInDays,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Успех",
          description: "Пользователь обновлен",
        });
        loadUsers();
        setIsDialogOpen(false);
        setEditingUser(null);
        setNewPassword("");
        setExpiresInDays(null);
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось обновить пользователя",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить пользователя",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`Вы уверены что хотите удалить пользователя ${email}?`)) return;

    const token = localStorage.getItem("adminToken");
    const adminEmail = localStorage.getItem("adminEmail");

    try {
      const response = await fetch(AUTH_URL, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token || "",
          "X-Admin-Email": adminEmail || "",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Успех",
          description: "Пользователь удален",
        });
        loadUsers();
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось удалить пользователя",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить пользователя",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;

    const token = localStorage.getItem("adminToken");
    const adminEmail = localStorage.getItem("adminEmail");

    try {
      const response = await fetch(AUTH_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token || "",
          "X-Admin-Email": adminEmail || "",
        },
        body: JSON.stringify({
          email: currentUser.email,
          nickname: profileNickname || undefined,
          password: profilePassword || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (profileNickname) {
          localStorage.setItem("adminNickname", profileNickname);
          setCurrentUser({ ...currentUser, nickname: profileNickname });
        }
        toast({
          title: "Успех",
          description: "Профиль обновлен",
        });
        setIsProfileDialogOpen(false);
        setProfileNickname("");
        setProfilePassword("");
        
        if (currentUser.role === "super_admin") {
          loadUsers();
        }
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось обновить профиль",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setEditingUser({ email: "", nickname: "" });
    setNewPassword("");
    setExpiresInDays(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser({ ...user });
    setNewPassword("");
    setExpiresInDays(null);
    setIsDialogOpen(true);
  };

  const openProfileDialog = () => {
    setProfileNickname(currentUser?.nickname || "");
    setProfilePassword("");
    setIsProfileDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (users.find(u => u.email === editingUser?.email)) {
      handleUpdateUser(editingUser!.email!);
    } else {
      handleCreateUser();
    }
  };

  const isSuperAdmin = currentUser?.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 p-8 pb-24">
      <div className="max-w-7xl mx-auto">
        <AdminUsersHeader
          currentUser={currentUser}
          isSuperAdmin={isSuperAdmin}
          onOpenProfile={openProfileDialog}
          onOpenCreate={openCreateDialog}
        />

        <AdminUsersTable
          users={users}
          loading={loading}
          isSuperAdmin={isSuperAdmin}
          onEdit={openEditDialog}
          onDelete={handleDeleteUser}
        />

        <UserDialog
          isOpen={isDialogOpen}
          editingUser={editingUser}
          users={users}
          newPassword={newPassword}
          expiresInDays={expiresInDays}
          onClose={() => setIsDialogOpen(false)}
          onSave={handleSaveUser}
          onUserChange={setEditingUser}
          onPasswordChange={setNewPassword}
          onExpiresChange={setExpiresInDays}
        />

        <ProfileDialog
          isOpen={isProfileDialogOpen}
          currentUser={currentUser}
          profileNickname={profileNickname}
          profilePassword={profilePassword}
          onClose={() => setIsProfileDialogOpen(false)}
          onSave={handleUpdateProfile}
          onNicknameChange={setProfileNickname}
          onPasswordChange={setProfilePassword}
        />
      </div>
      
      <AdminOnlineUsers />
    </div>
  );
};

export default AdminUsers;