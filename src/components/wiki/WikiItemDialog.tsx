import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Icon from "@/components/ui/icon";
import WatermarkedImage from "@/components/ui/watermarked-image";

interface WikiItem {
  id: string;
  name: string;
  image: string;
  description: string;
  tags: string[];
  isDonateItem?: boolean;
}

interface WikiItemDialogProps {
  selectedItem: WikiItem | null;
  setSelectedItem: (item: WikiItem | null) => void;
  favorites: string[];
  toggleFavorite: (itemId: string) => void;
  highlightTags: (text: string) => string;
  setSelectedTag: (tag: string) => void;
}

const WikiItemDialog = ({
  selectedItem,
  setSelectedItem,
  favorites,
  toggleFavorite,
  highlightTags,
  setSelectedTag,
}: WikiItemDialogProps) => {
  return (
    <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        {selectedItem && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between gap-4">
                <DialogTitle className="text-2xl font-bold">
                  {selectedItem.name}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  {selectedItem.isDonateItem && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="cursor-pointer"
                            onClick={() =>
                              window.open("https://devilrust.ru", "_blank")
                            }
                          >
                            <Icon
                              name="Star"
                              size={28}
                              className="text-yellow-400 fill-yellow-400 animate-shimmer hover:scale-110 transition-transform"
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="z-[100]">
                          <p className="text-sm">Донат предмет</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavorite(selectedItem.id)}
                  >
                    <Icon
                      name="Heart"
                      size={24}
                      className={`transition-all ${
                        favorites.includes(selectedItem.id)
                          ? "text-red-500 fill-red-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              <div className="bg-muted/30 rounded-lg p-6">
                <WatermarkedImage
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  className="max-h-64 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg";
                  }}
                />
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2">Описание</h4>
                <DialogDescription
                  className="text-base leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: highlightTags(selectedItem.description),
                  }}
                />
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-3">Теги</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedItem.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => {
                        setSelectedTag(tag);
                        setSelectedItem(null);
                      }}
                    >
                      <Icon name="Hash" size={14} className="mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WikiItemDialog;