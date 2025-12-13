import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { API_URLS } from '@/config/api';
import wikiDataFallback from '@/data/wikiItems.json';
import WikiNavbar from "@/components/wiki/WikiNavbar";
import WikiSearchFilters from "@/components/wiki/WikiSearchFilters";
import WikiItemsGrid from "@/components/wiki/WikiItemsGrid";
import WikiItemDialog from "@/components/wiki/WikiItemDialog";

const DATA_MANAGER_URL = API_URLS.DATA_MANAGER;

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
        const response = await fetch(`${DATA_MANAGER_URL}?type=items`);
        const data = await response.json();
        setWikiItems(data.предметы || wikiDataFallback.предметы || []);
      } catch (error) {
        console.error('Failed to load items', error);
        setWikiItems(wikiDataFallback.предметы || []);
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
      const response = await fetch(`${DATA_MANAGER_URL}?type=items`);
      const data = await response.json();
      setWikiItems(data.предметы || wikiDataFallback.предметы || []);
    } catch (error) {
      console.error('Failed to refresh items', error);
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
      <WikiNavbar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        loading={loading}
        refreshItems={refreshItems}
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-12 text-center fade-in">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            DevilRust Wiki
          </h1>
          <p className="text-muted-foreground text-lg">
            Справочник предметов и механик сервера
          </p>
        </header>

        <WikiSearchFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedTag={selectedTag}
          setSelectedTag={setSelectedTag}
          allTags={allTags}
        />

        <WikiItemsGrid
          wikiItems={wikiItems}
          filteredItems={filteredItems}
          loading={loading}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          setSelectedItem={setSelectedItem}
        />

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

      <WikiItemDialog
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        highlightTags={highlightTags}
        setSelectedTag={setSelectedTag}
      />
    </div>
  );
};

export default Index;
