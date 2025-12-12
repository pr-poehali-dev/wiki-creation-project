import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useNavigate } from "react-router-dom";

interface AdminUsersHeaderProps {
  currentUser: { email: string; nickname: string; role: string } | null;
  isSuperAdmin: boolean;
  onOpenProfile: () => void;
  onOpenCreate: () => void;
}

const AdminUsersHeader = ({
  currentUser,
  isSuperAdmin,
  onOpenProfile,
  onOpenCreate,
}: AdminUsersHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="text-white">
          <Icon name="ArrowLeft" size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">Управление пользователями</h1>
          <p className="text-orange-300 mt-1">
            Вы вошли как: {currentUser?.nickname} ({currentUser?.email})
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={onOpenProfile} variant="outline" className="text-orange-900">
          <Icon name="User" size={18} className="mr-2" />
          Мой профиль
        </Button>
        {isSuperAdmin && (
          <Button onClick={onOpenCreate} className="bg-red-600 hover:bg-red-700">
            <Icon name="Plus" size={18} className="mr-2" />
            Добавить пользователя
          </Button>
        )}
      </div>
    </div>
  );
};

export default AdminUsersHeader;