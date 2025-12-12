import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

interface WikiItem {
  id: string;
  name: string;
  image: string;
  description: string;
  tags: string[];
  isDonateItem?: boolean;
}

interface AdminItemDialogProps {
  isOpen: boolean;
  editingItem: WikiItem | null;
  uploading: boolean;
  onClose: () => void;
  onSave: () => void;
  onItemChange: (item: WikiItem) => void;
  onImageUpload: (file: File) => void;
}

const AdminItemDialog = ({
  isOpen,
  editingItem,
  uploading,
  onClose,
  onSave,
  onItemChange,
  onImageUpload,
}: AdminItemDialogProps) => {
  if (!editingItem) return null;

  const isNew = !editingItem.id || editingItem.id === "new";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "Создать предмет" : "Редактировать предмет"}</DialogTitle>
          <DialogDescription>
            Заполните информацию о предмете для wiki
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Название</Label>
            <Input
              value={editingItem.name}
              onChange={(e) => onItemChange({ ...editingItem, name: e.target.value })}
              placeholder="Название предмета"
            />
          </div>

          <div>
            <Label>Изображение</Label>
            {editingItem.image && (
              <div className="mb-2">
                <img
                  src={editingItem.image}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImageUpload(file);
              }}
              disabled={uploading}
            />
            {uploading && (
              <p className="text-sm text-muted-foreground mt-1">Загрузка...</p>
            )}
          </div>

          <div>
            <Label>Описание</Label>
            <Textarea
              value={editingItem.description}
              onChange={(e) => onItemChange({ ...editingItem, description: e.target.value })}
              placeholder="Описание предмета"
              rows={4}
            />
          </div>

          <div>
            <Label>Теги</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {editingItem.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                  <button
                    onClick={() => {
                      const newTags = editingItem.tags.filter((_, i) => i !== index);
                      onItemChange({ ...editingItem, tags: newTags });
                    }}
                    className="ml-2 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Добавить тег"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const input = e.currentTarget;
                    const value = input.value.trim();
                    if (value && !editingItem.tags.includes(value)) {
                      onItemChange({
                        ...editingItem,
                        tags: [...editingItem.tags, value],
                      });
                      input.value = "";
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDonateItem"
              checked={editingItem.isDonateItem || false}
              onCheckedChange={(checked) =>
                onItemChange({ ...editingItem, isDonateItem: checked as boolean })
              }
            />
            <Label htmlFor="isDonateItem" className="cursor-pointer">
              Донат предмет
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={onSave} disabled={uploading}>
            {isNew ? "Создать" : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminItemDialog;
