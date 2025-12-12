import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { API_URLS } from "@/config/api";

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

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "Бессрочно";
    return new Date(timestamp * 1000).toLocaleDateString("ru-RU");
  };

  const getTimeLeft = (expiresAt: number | null) => {
    if (!expiresAt) return null;
    const now = Math.floor(Date.now() / 1000);
    const diff = expiresAt - now;
    if (diff < 0) return "Истек";
    const days = Math.floor(diff / (24 * 60 * 60));
    return `${days} дн.`;
  };

  const isSuperAdmin = currentUser?.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin")} className="text-white">
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Управление пользователями</h1>
              <p className="text-purple-300 mt-1">
                Вы вошли как: {currentUser?.nickname} ({currentUser?.email})
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={openProfileDialog} variant="outline" className="text-purple-900">
              <Icon name="User" size={18} className="mr-2" />
              Мой профиль
            </Button>
            {isSuperAdmin && (
              <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
                <Icon name="Plus" size={18} className="mr-2" />
                Добавить пользователя
              </Button>
            )}
          </div>
        </div>

        {!isSuperAdmin ? (
          <Card className="bg-white/10 backdrop-blur-sm border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white">Доступ ограничен</CardTitle>
              <CardDescription className="text-purple-300">
                Только главный администратор может управлять пользователями
              </CardDescription>
            </CardHeader>
          </Card>
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : (
          <Card className="bg-white/10 backdrop-blur-sm border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white">Список администраторов</CardTitle>
              <CardDescription className="text-purple-300">
                Всего пользователей: {users.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-purple-200">Email</TableHead>
                    <TableHead className="text-purple-200">Никнейм</TableHead>
                    <TableHead className="text-purple-200">Роль</TableHead>
                    <TableHead className="text-purple-200">Создан</TableHead>
                    <TableHead className="text-purple-200">Истекает</TableHead>
                    <TableHead className="text-purple-200">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const timeLeft = getTimeLeft(user.expires_at);
                    const isExpired = timeLeft === "Истек";
                    
                    return (
                      <TableRow key={user.email}>
                        <TableCell className="text-white">{user.email}</TableCell>
                        <TableCell className="text-white">{user.nickname}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "super_admin" ? "default" : "secondary"}>
                            {user.role === "super_admin" ? "Супер-админ" : "Админ"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-purple-300">
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell>
                          {user.expires_at ? (
                            <div className="flex items-center gap-2">
                              <span className={isExpired ? "text-red-400" : "text-purple-300"}>
                                {formatDate(user.expires_at)}
                              </span>
                              {timeLeft && (
                                <Badge variant={isExpired ? "destructive" : "outline"}>
                                  {timeLeft}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-green-400">
                              Бессрочно
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {user.role !== "super_admin" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEditDialog(user)}
                                  className="text-white hover:bg-purple-600"
                                >
                                  <Icon name="Pencil" size={16} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteUser(user.email)}
                                  className="text-red-400 hover:bg-red-600"
                                >
                                  <Icon name="Trash2" size={16} />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-slate-900 text-white border-purple-500">
            <DialogHeader>
              <DialogTitle>
                {editingUser?.email && users.find(u => u.email === editingUser.email)
                  ? "Редактировать пользователя"
                  : "Создать пользователя"}
              </DialogTitle>
              <DialogDescription className="text-purple-300">
                Заполните данные нового администратора
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-purple-200">Email</Label>
                <Input
                  type="email"
                  value={editingUser?.email || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  disabled={!!users.find(u => u.email === editingUser?.email)}
                  className="bg-slate-800 border-purple-500 text-white"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <Label className="text-purple-200">Никнейм</Label>
                <Input
                  value={editingUser?.nickname || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, nickname: e.target.value })}
                  className="bg-slate-800 border-purple-500 text-white"
                  placeholder="Admin"
                />
              </div>
              <div>
                <Label className="text-purple-200">Пароль {users.find(u => u.email === editingUser?.email) && "(оставьте пустым если не меняете)"}</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-slate-800 border-purple-500 text-white"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <Label className="text-purple-200">Временный доступ (дни)</Label>
                <Input
                  type="number"
                  value={expiresInDays || ""}
                  onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : null)}
                  className="bg-slate-800 border-purple-500 text-white"
                  placeholder="Оставьте пустым для бессрочного доступа"
                />
                <p className="text-sm text-purple-400 mt-1">
                  Например: 7 = доступ на неделю, 30 = на месяц
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                Отмена
              </Button>
              <Button
                onClick={() => {
                  if (users.find(u => u.email === editingUser?.email)) {
                    handleUpdateUser(editingUser!.email!);
                  } else {
                    handleCreateUser();
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {users.find(u => u.email === editingUser?.email) ? "Обновить" : "Создать"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="bg-slate-900 text-white border-purple-500">
            <DialogHeader>
              <DialogTitle>Мой профиль</DialogTitle>
              <DialogDescription className="text-purple-300">
                Измените свой никнейм и пароль
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-purple-200">Email (не меняется)</Label>
                <Input
                  value={currentUser?.email || ""}
                  disabled
                  className="bg-slate-800 border-purple-500 text-gray-400"
                />
              </div>
              <div>
                <Label className="text-purple-200">Никнейм</Label>
                <Input
                  value={profileNickname}
                  onChange={(e) => setProfileNickname(e.target.value)}
                  className="bg-slate-800 border-purple-500 text-white"
                  placeholder={currentUser?.nickname}
                />
              </div>
              <div>
                <Label className="text-purple-200">Новый пароль (оставьте пустым если не меняете)</Label>
                <Input
                  type="password"
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  className="bg-slate-800 border-purple-500 text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsProfileDialogOpen(false)}>
                Отмена
              </Button>
              <Button
                onClick={handleUpdateProfile}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminUsers;
