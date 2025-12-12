import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";

interface AdminNavbarProps {
  email: string;
  onLogout: () => void;
}

const AdminNavbar = ({ email, onLogout }: AdminNavbarProps) => {
  const navigate = useNavigate();

  return (
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
            {email.toLowerCase() === "ad.alex1995@yandex.ru" && (
              <Button variant="outline" onClick={() => navigate("/admin/users")}>
                <Icon name="Users" size={16} className="mr-2" />
                Пользователи
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/")}>
              <Icon name="Home" size={16} className="mr-2" />
              На главную
            </Button>
            <Button variant="destructive" onClick={onLogout}>
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
