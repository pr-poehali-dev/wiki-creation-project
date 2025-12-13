import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { API_URLS } from "@/config/api";

const ITEMS_URL = API_URLS.ITEMS;

interface WikiItem {
  id: string;
  name: string;
  image: string;
  description: string;
  tags: string[];
  isDonateItem?: boolean;
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WikiItem | null>(null);
  const [wikiItems, setWikiItems] = useState<WikiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("favoriteItems");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await fetch(ITEMS_URL, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setWikiItems(data.items || []);
      } catch (error) {
        console.error("Failed to load items from API", error);
        setWikiItems([]);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refreshItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(ITEMS_URL, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setWikiItems(data.items || []);
    } catch (error) {
      console.error("Failed to refresh items", error);
    } finally {
      setLoading(false);
    }
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    wikiItems.forEach((item) => {
      item.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [wikiItems]);

  const toggleFavorite = (itemId: string) => {
    setFavorites((prev) => {
      const newFavorites = prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId];
      localStorage.setItem("favoriteItems", JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const filteredItems = useMemo(() => {
    const filtered = wikiItems.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag =
        selectedTag === null || item.tags.includes(selectedTag);

      return matchesSearch && matchesTag;
    });

    return filtered.sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
  }, [searchQuery, selectedTag, favorites, wikiItems]);

  const highlightTags = (text: string) => {
    let result = text;
    allTags.forEach((tag) => {
      const regex = new RegExp(`(${tag})`, "gi");
      result = result.replace(
        regex,
        '<span class="text-primary font-medium">$1</span>',
      );
    });
    return result;
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <img
                  src="https://s3.regru.cloud/img.devilrust/devilrust_logo.png"
                  alt="DevilRust Logo"
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <h2
                    className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                    style={{
                      fontFamily: "Nunito, sans-serif",
                      fontStyle: "italic",
                    }}
                  >
                    DevilRust
                  </h2>
                  <p className="text-xs text-muted-foreground">Wiki</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" className="bg-primary/10">
                  <Icon name="Home" size={16} className="mr-2" />
                  Wiki
                </Button>
                <Link to="/guides">
                  <Button variant="ghost" size="sm">
                    <Icon name="BookOpen" size={16} className="mr-2" />
                    Гайды
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Icon name={mobileMenuOpen ? "X" : "Menu"} size={20} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshItems}
                disabled={loading}
              >
                <Icon name={loading ? "Loader2" : "RefreshCw"} size={16} className={loading ? "animate-spin" : ""} />
              </Button>
              <Button
                variant="default"
                className="bg-primary hover:bg-primary/90 hidden sm:flex"
                onClick={() => window.open("https://play.devilrust.ru", "_blank")}
              >
                <Icon name="ExternalLink" size={16} className="mr-2" />
                Сайт
              </Button>
            </div>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              <Button variant="ghost" size="sm" className="w-full justify-start bg-primary/10">
                <Icon name="Home" size={16} className="mr-2" />
                Wiki
              </Button>
              <Link to="/guides" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Icon name="BookOpen" size={16} className="mr-2" />
                  Гайды
                </Button>
              </Link>
              <Button
                variant="default"
                size="sm"
                className="w-full justify-start bg-primary hover:bg-primary/90"
                onClick={() => {
                  window.open("https://play.devilrust.ru", "_blank");
                  setMobileMenuOpen(false);
                }}
              >
                <Icon name="ExternalLink" size={16} className="mr-2" />
                Сайт
              </Button>
            </div>
          </div>
        )}
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-12 text-center fade-in">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            DevilRust Wiki
          </h1>
          <p className="text-muted-foreground text-lg">
            Справочник предметов и механик сервера
          </p>
        </header>

        <div className="mb-8 space-y-4 fade-in">
          <div className="relative">
            <Icon
              name="Search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={20}
            />
            <Input
              type="text"
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-lg bg-card border-border"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedTag === null ? "default" : "outline"}
              className="cursor-pointer hover-scale px-4 py-2"
              onClick={() => setSelectedTag(null)}
            >
              <Icon name="Layout" size={14} className="mr-1" />
              Все предметы
            </Badge>
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                className="cursor-pointer hover-scale px-4 py-2"
                onClick={() => setSelectedTag(tag)}
              >
                <Icon name="Hash" size={14} className="mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 fade-in">
            <Icon
              name="Loader2"
              size={64}
              className="mx-auto text-primary mb-4 animate-spin"
            />
            <h3 className="text-2xl font-semibold mb-2">Загрузка предметов...</h3>
          </div>
        ) : wikiItems.length === 0 ? (
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
        ) : filteredItems.length === 0 ? (
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
        ) : (
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
        )}

        <footer className="mt-16 text-center text-muted-foreground fade-in">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon name="BookOpen" size={20} />
            <span className="text-lg font-medium">DevilRust Wiki</span>
          </div>
          <p className="text-sm">
            Всего предметов в базе: {wikiItems.length} • Отображается:{" "}
            {filteredItems.length}
          </p>
        </footer>
      </div>

      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-8 right-8 w-12 h-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 hover-scale z-50"
        >
          <Icon name="ArrowUp" size={24} />
        </Button>
      )}

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
                          <TooltipContent>
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
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.name}
                    className="w-full max-h-64 object-contain"
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
    </div>
  );
};

export default Index;