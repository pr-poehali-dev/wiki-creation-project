import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { API_URLS } from "@/config/api";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminItemDialog from "@/components/admin/AdminItemDialog";
import AdminItemsList from "@/components/admin/AdminItemsList";
import AdminOnlineUsers from "@/components/admin/AdminOnlineUsers";
import { useAdminActivity } from "@/hooks/useAdminActivity";
import wikiItemsData from '@/data/wikiItems.json';

const DATA_MANAGER_URL = API_URLS.DATA_MANAGER;
const IMAGE_PROCESSOR_URL = API_URLS.IMAGE_PROCESSOR;

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useAdminActivity(email, localStorage.getItem("adminNickname") || email);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const savedEmail = localStorage.getItem("adminEmail");
    if (token && savedEmail) {
      setIsAuthenticated(true);
      setEmail(savedEmail);
      loadItems();
    }
  }, []);

  // Автосинхронизация каждые 5 секунд
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      loadItems();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const loadItems = async () => {
    try {
      const response = await fetch(`${DATA_MANAGER_URL}?type=items`);
      if (!response.ok) {
        console.warn('Backend unavailable, loading local fallback');
        setItems(wikiItemsData.предметы || []);
        return;
      }
      
      const data = await response.json();
      const backendItems = data.предметы || data.items || [];
      setItems(backendItems);
    } catch (error) {
      console.error('Failed to load items from backend, loading local fallback', error);
      setItems(wikiItemsData.предметы || []);
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
      
      let updatedItems: WikiItem[];
      if (isNew) {
        // Генерируем новый ID
        const maxId = items.reduce((max, item) => {
          const numId = parseInt(item.id);
          return !isNaN(numId) && numId > max ? numId : max;
        }, 0);
        const newItem = { ...editingItem, id: String(maxId + 1) };
        updatedItems = [...items, newItem];
      } else {
        // Обновляем существующий предмет
        updatedItems = items.map(item => 
          item.id === editingItem.id ? editingItem : item
        );
      }

      // Отправляем обновленные данные на сервер
      const response = await fetch(`${DATA_MANAGER_URL}?type=items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token || "",
          "X-Admin-Email": adminEmail || "",
        },
        body: JSON.stringify({ предметы: updatedItems }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Успех",
          description: isNew ? "Предмет создан" : "Предмет обновлен",
        });
        setItems(updatedItems);
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
      const updatedItems = items.filter(item => item.id !== itemId);
      
      const response = await fetch(`${DATA_MANAGER_URL}?type=items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token || "",
          "X-Admin-Email": adminEmail || "",
        },
        body: JSON.stringify({ предметы: updatedItems }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Успех",
          description: "Предмет удален",
        });
        setItems(updatedItems);
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
    setUploadProgress(0);

    try {
      const reader = new FileReader();
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 30);
          setUploadProgress(progress);
        }
      };
      
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64Data = reader.result as string;
        setUploadProgress(40);

        const response = await fetch(IMAGE_PROCESSOR_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Token": token || "",
            "X-Admin-Email": adminEmail || "",
          },
          body: JSON.stringify({
            image: base64Data,
            filename: file.name,
            folder: "wiki",
          }),
        });

        setUploadProgress(80);
        const data = await response.json();
        setUploadProgress(100);

        if (response.ok && data.success) {
          if (editingItem) {
            setEditingItem({ ...editingItem, image: data.url });
          }
          toast({
            title: "Успех",
            description: "Изображение обработано и загружено",
          });
        } else {
          toast({
            title: "Ошибка",
            description: data.error || "Не удалось загрузить изображение",
            variant: "destructive",
          });
        }
        
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 500);
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
    <div className="min-h-screen bg-background pb-20">
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
        uploadProgress={uploadProgress}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveItem}
        onItemChange={setEditingItem}
        onImageUpload={handleImageUpload}
      />
      
      <AdminOnlineUsers />
    </div>
  );
};

export default Admin;