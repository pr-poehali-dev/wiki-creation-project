import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";

interface WikiItem {
  id: string;
  name: string;
  image: string;
  description: string;
  tags: string[];
  isDonateItem?: boolean;
}

interface AdminItemsListProps {
  items: WikiItem[];
  onEdit: (item: WikiItem) => void;
  onCreate: () => void;
  onDelete: (itemId: string) => void;
  onRestore?: () => void;
}

const AdminItemsList = ({ items, onEdit, onCreate, onDelete, onRestore }: AdminItemsListProps) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Управление предметами Wiki</h2>
          <p className="text-muted-foreground">Всего предметов: {items.length}</p>
        </div>
        <div className="flex gap-2">
          {onRestore && (
            <Button variant="outline" onClick={onRestore}>
              <Icon name="RefreshCw" size={16} className="mr-2" />
              Восстановить данные
            </Button>
          )}
          <Button onClick={onCreate}>
            <Icon name="Plus" size={16} className="mr-2" />
            Добавить предмет
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="p-0">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
              )}
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                {item.isDonateItem && (
                  <Badge variant="default" className="ml-2">
                    Донат
                  </Badge>
                )}
              </div>
              <CardDescription className="line-clamp-3 mb-4">
                {item.description}
              </CardDescription>
              <div className="flex flex-wrap gap-2 mb-4">
                {item.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEdit(item)}
                >
                  <Icon name="Pencil" size={16} className="mr-2" />
                  Редактировать
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                >
                  <Icon name="Trash2" size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <Card className="p-12 text-center">
          <Icon name="Package" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Предметов пока нет</h3>
          <p className="text-muted-foreground mb-4">
            Создайте первый предмет для wiki
          </p>
          <Button onClick={onCreate}>
            <Icon name="Plus" size={16} className="mr-2" />
            Создать предмет
          </Button>
        </Card>
      )}
    </div>
  );
};

export default AdminItemsList;