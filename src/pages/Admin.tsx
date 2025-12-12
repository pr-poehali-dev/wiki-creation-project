import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { API_URLS } from "@/config/api";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminItemDialog from "@/components/admin/AdminItemDialog";
import AdminItemsList from "@/components/admin/AdminItemsList";

const ITEMS_URL = API_URLS.ITEMS;
const GUIDES_URL = API_URLS.GUIDES;

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

  const handleLoginSuccess = (userEmail: string) => {
    setIsAuthenticated(true);
    setEmail(userEmail);
    loadItems();
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    setIsAuthenticated(false);
    navigate("/");
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

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    const token = localStorage.getItem("adminToken");
    const adminEmail = localStorage.getItem("adminEmail");

    setUploading(true);

    try {
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
    return <AdminLogin onLoginSuccess={handleLoginSuccess} toast={toast} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar email={email} onLogout={handleLogout} />
      
      <AdminItemsList
        items={items}
        onEdit={openEditDialog}
        onCreate={() => openEditDialog(null)}
        onDelete={handleDeleteItem}
      />

      <AdminItemDialog
        isOpen={isDialogOpen}
        editingItem={editingItem}
        uploading={uploading}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveItem}
        onItemChange={setEditingItem}
        onImageUpload={handleImageUpload}
      />
    </div>
  );
};

export default Admin;
