import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

interface WikiItem {
  id: string;
  name: string;
  image: string;
  description: string;
  tags: string[];
  isDonateItem?: boolean;
}

interface WikiItemsGridProps {
  wikiItems: WikiItem[];
  filteredItems: WikiItem[];
  loading: boolean;
  favorites: string[];
  toggleFavorite: (itemId: string) => void;
  setSelectedItem: (item: WikiItem) => void;
}

const WikiItemsGrid = ({
  wikiItems,
  filteredItems,
  loading,
  favorites,
  toggleFavorite,
  setSelectedItem,
}: WikiItemsGridProps) => {
  if (loading) {
    return (
      <div className="text-center py-16 fade-in">
        <Icon
          name="Loader2"
          size={64}
          className="mx-auto text-primary mb-4 animate-spin"
        />
        <h3 className="text-2xl font-semibold mb-2">Загрузка предметов...</h3>
      </div>
    );
  }

  if (wikiItems.length === 0) {
    return (
      <div className="text-center py-16 fade-in">
        <Icon
          name="Package"
          size={64}
          className="mx-auto text-muted-foreground mb-4"
        />
        <h3 className="text-2xl font-semibold mb-2">Предметы не добавлены</h3>
        <p className="text-muted-foreground">
          Добавьте предметы через админ-панель
        </p>
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-16 fade-in">
        <Icon
          name="Search"
          size={64}
          className="mx-auto text-muted-foreground mb-4"
        />
        <h3 className="text-2xl font-semibold mb-2">Ничего не найдено</h3>
        <p className="text-muted-foreground">
          Попробуйте изменить поисковый запрос или сбросить фильтры
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {filteredItems.map((item) => (
        <Card
          key={item.id}
          className="hover-scale fade-in bg-card border-border group cursor-pointer relative overflow-hidden"
          onClick={() => setSelectedItem(item)}
        >
          <div
            className="absolute top-2 right-2 z-10"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
          >
            <Icon
              name="Heart"
              size={24}
              className={`transition-all ${
                favorites.includes(item.id)
                  ? "text-red-500 fill-red-500"
                  : "text-muted-foreground hover:text-red-400"
              }`}
            />
          </div>

          {item.isDonateItem && (
            <div className="absolute top-2 left-2 z-10">
              <Icon
                name="Star"
                size={24}
                className="text-yellow-400 fill-yellow-400 animate-shimmer"
              />
            </div>
          )}

          <div className="aspect-square bg-muted/30 p-4">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
              }}
            />
          </div>

          <div className="p-3">
            <h3 className="text-sm font-semibold text-center line-clamp-2 group-hover:text-primary transition-colors">
              {item.name}
            </h3>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default WikiItemsGrid;
