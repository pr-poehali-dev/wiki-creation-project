import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Icon from '@/components/ui/icon';
import wikiData from '@/data/wikiItems.json';

interface WikiItem {
  id: string;
  name: string;
  image: string;
  description: string;
  tags: string[];
  isDonateItem?: boolean;
}

const wikiItems: WikiItem[] = wikiData.предметы;

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    wikiItems.forEach(item => {
      item.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, []);

  const filteredItems = useMemo(() => {
    return wikiItems.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTag = selectedTag === null || item.tags.includes(selectedTag);
      
      return matchesSearch && matchesTag;
    });
  }, [searchQuery, selectedTag]);

  const highlightTags = (text: string) => {
    let result = text;
    allTags.forEach(tag => {
      const regex = new RegExp(`(${tag})`, 'gi');
      result = result.replace(regex, '<span class="text-primary font-medium">$1</span>');
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
                  <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" style={{ fontFamily: 'Nunito, sans-serif', fontStyle: 'italic' }}>
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
            <Button
              variant="default"
              className="bg-primary hover:bg-primary/90"
              onClick={() => window.open('https://play.devilrust.ru', '_blank')}
            >
              <Icon name="ExternalLink" size={16} className="mr-2" />
              Сайт
            </Button>
          </div>
        </div>
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
            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="text"
              placeholder="Поиск по названию или описанию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-lg bg-card border-border"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedTag === null ? 'default' : 'outline'}
              className="cursor-pointer hover-scale px-4 py-2"
              onClick={() => setSelectedTag(null)}
            >
              <Icon name="Layout" size={14} className="mr-1" />
              Все предметы
            </Badge>
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? 'default' : 'outline'}
                className="cursor-pointer hover-scale px-4 py-2"
                onClick={() => setSelectedTag(tag)}
              >
                <Icon name="Hash" size={14} className="mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-16 fade-in">
            <Icon name="Search" size={64} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Ничего не найдено</h3>
            <p className="text-muted-foreground">
              Попробуйте изменить поисковый запрос или сбросить фильтры
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="hover-scale fade-in bg-card border-border group cursor-pointer"
              >
                <div className="aspect-video bg-muted relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 p-4"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  {item.isDonateItem && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className="absolute top-2 left-2 w-10 h-10 flex items-center justify-center cursor-pointer z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open('https://devilrust.ru', '_blank');
                            }}
                          >
                            <Icon 
                              name="Star" 
                              size={32} 
                              className="text-yellow-400 fill-yellow-400 animate-shimmer hover:scale-110 transition-transform"
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-card border-primary/50 z-[9999]">
                          <p className="text-sm font-medium">Донат магазин на devilrust.ru</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <div className="absolute top-2 right-2 bg-primary/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-primary text-sm font-semibold">
                      {item.tags.length} тегов
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                  <p
                    className="text-muted-foreground text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: highlightTags(item.description)
                    }}
                  />
                  <div className="flex flex-wrap gap-2 mt-4">
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTag(tag);
                        }}
                      >
                        #{tag}
                      </Badge>
                    ))}
                    {item.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{item.tags.length - 3}
                      </Badge>
                    )}
                  </div>
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
            Всего предметов в базе: {wikiItems.length} • Отображается: {filteredItems.length}
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
    </div>
  );
};

export default Index;