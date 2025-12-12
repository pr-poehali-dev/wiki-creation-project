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

interface ProfileDialogProps {
  isOpen: boolean;
  currentUser: { email: string; nickname: string; role: string } | null;
  profileNickname: string;
  profilePassword: string;
  onClose: () => void;
  onSave: () => void;
  onNicknameChange: (nickname: string) => void;
  onPasswordChange: (password: string) => void;
}

const ProfileDialog = ({
  isOpen,
  currentUser,
  profileNickname,
  profilePassword,
  onClose,
  onSave,
  onNicknameChange,
  onPasswordChange,
}: ProfileDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              onChange={(e) => onNicknameChange(e.target.value)}
              className="bg-slate-800 border-purple-500 text-white"
              placeholder={currentUser?.nickname}
            />
          </div>
          <div>
            <Label className="text-purple-200">Новый пароль (оставьте пустым если не меняете)</Label>
            <Input
              type="password"
              value={profilePassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="bg-slate-800 border-purple-500 text-white"
              placeholder="••••••••"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={onSave} className="bg-purple-600 hover:bg-purple-700">
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
