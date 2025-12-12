import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface User {
  email: string;
  nickname: string;
  role: string;
  created_at: number;
  expires_at: number | null;
}

interface UserDialogProps {
  isOpen: boolean;
  editingUser: Partial<User> | null;
  users: User[];
  newPassword: string;
  expiresInDays: number | null;
  onClose: () => void;
  onSave: () => void;
  onUserChange: (user: Partial<User>) => void;
  onPasswordChange: (password: string) => void;
  onExpiresChange: (days: number | null) => void;
}

const UserDialog = ({
  isOpen,
  editingUser,
  users,
  newPassword,
  expiresInDays,
  onClose,
  onSave,
  onUserChange,
  onPasswordChange,
  onExpiresChange,
}: UserDialogProps) => {
  const isEditing = editingUser?.email && users.find(u => u.email === editingUser.email);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 text-white border-purple-500">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Редактировать пользователя" : "Создать пользователя"}
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
              onChange={(e) => onUserChange({ ...editingUser, email: e.target.value })}
              disabled={!!isEditing}
              className="bg-slate-800 border-purple-500 text-white"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <Label className="text-purple-200">Никнейм</Label>
            <Input
              value={editingUser?.nickname || ""}
              onChange={(e) => onUserChange({ ...editingUser, nickname: e.target.value })}
              className="bg-slate-800 border-purple-500 text-white"
              placeholder="Admin"
            />
          </div>
          <div>
            <Label className="text-purple-200">
              Пароль {isEditing && "(оставьте пустым если не меняете)"}
            </Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="bg-slate-800 border-purple-500 text-white"
              placeholder="••••••••"
            />
          </div>
          <div>
            <Label className="text-purple-200">Временный доступ (дни)</Label>
            <Input
              type="number"
              value={expiresInDays || ""}
              onChange={(e) => onExpiresChange(e.target.value ? parseInt(e.target.value) : null)}
              className="bg-slate-800 border-purple-500 text-white"
              placeholder="Оставьте пустым для бессрочного доступа"
            />
            <p className="text-sm text-purple-400 mt-1">
              Например: 7 = доступ на неделю, 30 = на месяц
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={onSave} className="bg-purple-600 hover:bg-purple-700">
            {isEditing ? "Обновить" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserDialog;
