import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const AUTH_URL = "https://functions.poehali.dev/f8032a9b-c0f1-4d7f-bf5d-77772b746142";
const ITEMS_URL = "https://functions.poehali.dev/d71663e0-8d00-4215-9220-87036ef43d4f";
const GUIDES_URL = "https://functions.poehali.dev/ac785d0b-f5b2-4d87-9032-4d3b73bda057";

interface WikiItem {
  id: string;
  name: string;
  image: string;
  description: string;
  tags: string[];
  isDonateItem?: boolean;
}

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<WikiItem[]>([]);
  const [editingItem, setEditingItem] = useState<WikiItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const savedEmail = localStorage.getItem("adminEmail");
    if (token && savedEmail) {
      setIsAuthenticated(true);
      setEmail(savedEmail);
      loadItems();
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminEmail", email);
        setIsAuthenticated(true);
        loadItems();
        toast({
          title: "Успешный вход",
          description: "Добро пожаловать в админ-панель",
        });
      } else {
        toast({
          title: "Ошибка входа",
          description: data.error || "Неверный email или пароль",
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

  const loadItems = async () => {
    try {
      const response = await fetch(ITEMS_URL);
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить предметы",
        variant: "destructive",
      });
    }
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;

    const token = localStorage.getItem("adminToken");
    const adminEmail = localStorage.getItem("adminEmail");

    try {
      const isNew = !editingItem.id || editingItem.id === "new";
      const url = ITEMS_URL;
      const method = isNew ? "POST" : "PUT";

      const body = isNew
        ? { item: editingItem }
        : { id: editingItem.id, item: editingItem };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token || "",
          "X-Admin-Email": adminEmail || "",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Успех",
          description: isNew ? "Предмет создан" : "Предмет обновлен",
        });
        loadItems();
        setIsDialogOpen(false);
        setEditingItem(null);
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось сохранить предмет",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить предмет",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Вы уверены что хотите удалить этот предмет?")) return;

    const token = localStorage.getItem("adminToken");
    const adminEmail = localStorage.getItem("adminEmail");

    try {
      const response = await fetch(ITEMS_URL, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token || "",
          "X-Admin-Email": adminEmail || "",
        },
        body: JSON.stringify({ id: itemId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Успех",
          description: "Предмет удален",
        });
        loadItems();
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось удалить предмет",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить предмет",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    setIsAuthenticated(false);
    navigate("/");
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    const token = localStorage.getItem("adminToken");
    const adminEmail = localStorage.getItem("adminEmail");

    setUploading(true);

    try {
      // Конвертируем файл в base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64Data = reader.result as string;

        const response = await fetch(`${GUIDES_URL}?action=upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Token": token || "",
            "X-Admin-Email": adminEmail || "",
          },
          body: JSON.stringify({
            image: base64Data,
            filename: file.name,
            folder: "wiki-items",
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          if (editingItem) {
            setEditingItem({ ...editingItem, image: data.url });
          }
          toast({
            title: "Успех",
            description: "Изображение загружено",
          });
        } else {
          toast({
            title: "Ошибка",
            description: data.error || "Не удалось загрузить изображение",
            variant: "destructive",
          });
        }
        setUploading(false);
      };

      reader.onerror = () => {
        toast({
          title: "Ошибка",
          description: "Не удалось прочитать файл",
          variant: "destructive",
        });
        setUploading(false);
      };
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить изображение",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  const openEditDialog = (item: WikiItem | null) => {
    if (item) {
      setEditingItem({ ...item });
    } else {
      setEditingItem({
        id: "new",
        name: "",
        image: "",
        description: "",
        tags: [],
        isDonateItem: false,
      });
    }
    setIsDialogOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Icon name="Shield" size={48} className="text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Админ-панель</CardTitle>
            <CardDescription className="text-center">
              Введите данные для входа
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Вход..." : "Войти"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/")}
              >
                Вернуться на главную
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Icon name="Shield" size={24} className="text-primary" />
              <h1 className="text-xl font-bold">Админ-панель</h1>
              <Badge variant="secondary">{email}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate("/admin/guides")}>
                <Icon name="BookOpen" size={16} className="mr-2" />
                Гайды
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                <Icon name="Home" size={16} className="mr-2" />
                На главную
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                <Icon name="LogOut" size={16} className="mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Управление предметами</h2>
          <Button onClick={() => openEditDialog(null)}>
            <Icon name="Plus" size={16} className="mr-2" />
            Добавить предмет
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    {item.isDonateItem && (
                      <Badge variant="secondary" className="mt-2">
                        <Icon name="Star" size={12} className="mr-1" />
                        Донат
                      </Badge>
                    )}
                  </div>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-contain"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                  {item.description}
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags.slice(0, 3).map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{item.tags.length - 3}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(item)}
                  >
                    <Icon name="Pencil" size={14} className="mr-1" />
                    Изменить
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Icon name="Trash2" size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.id === "new" ? "Создать предмет" : "Редактировать предмет"}
            </DialogTitle>
            <DialogDescription>
              Заполните все поля для {editingItem?.id === "new" ? "создания" : "изменения"}{" "}
              предмета
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название</Label>
                <Input
                  id="name"
                  value={editingItem.name}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value })
                  }
                  placeholder="Название предмета"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Изображение</Label>
                <div className="flex gap-2">
                  <Input
                    id="image"
                    value={editingItem.image}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, image: e.target.value })
                    }
                    placeholder="https://example.com/image.png"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleImageUpload(file);
                      };
                      input.click();
                    }}
                  >
                    <Icon name={uploading ? "Loader2" : "Upload"} size={16} className={uploading ? "mr-2 animate-spin" : "mr-2"} />
                    {uploading ? "Загрузка..." : "Загрузить"}
                  </Button>
                </div>
                {editingItem.image && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <img
                      src={editingItem.image}
                      alt="Preview"
                      className="w-32 h-32 object-contain mx-auto"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={editingItem.description}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value })
                  }
                  placeholder="Подробное описание предмета"
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Теги (через запятую)</Label>
                <Input
                  id="tags"
                  value={editingItem.tags.join(", ")}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag),
                    })
                  }
                  placeholder="тег1, тег2, тег3"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDonateItem"
                  checked={editingItem.isDonateItem || false}
                  onCheckedChange={(checked) =>
                    setEditingItem({
                      ...editingItem,
                      isDonateItem: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="isDonateItem" className="cursor-pointer">
                  Донат предмет
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveItem}>
              <Icon name="Save" size={16} className="mr-2" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;