import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import guidesData from '@/data/guides.json';

interface GuideStep {
  stepNumber: number;
  title: string;
  description: string;
  image: string;
  note?: string;
}

interface Guide {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: string;
  author: string;
  views: number;
  rating: number;
  tags: string[];
  steps: GuideStep[];
  requirements?: string[];
  relatedGuides?: string[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface Difficulty {
  id: string;
  name: string;
  color: string;
}

const guides: Guide[] = guidesData.guides;
const categories: Category[] = guidesData.categories;
const difficulties: Difficulty[] = guidesData.difficulty;

const Guides = () => {
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');

  const getDifficultyColor = (difficultyId: string) => {
    const difficulty = difficulties.find(d => d.id === difficultyId);
    if (!difficulty) return 'bg-primary/10 text-primary border-primary/20';
    
    return `border-[${difficulty.color}]/20`;
  };

  const getDifficultyTextColor = (difficultyId: string) => {
    const difficulty = difficulties.find(d => d.id === difficultyId);
    if (!difficulty) return 'text-primary';
    return `text-[${difficulty.color}]`;
  };

  const getDifficultyName = (difficultyId: string) => {
    return difficulties.find(d => d.id === difficultyId)?.name || difficultyId;
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || categoryId;
  };

  const getCategoryIcon = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.icon || 'BookOpen';
  };

  const filteredAndSortedGuides = useMemo(() => {
    const filtered = guides.filter(guide => {
      const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           guide.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           guide.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'all' || guide.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.views - a.views;
        case 'rating':
          return b.rating - a.rating;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img 
                  src="https://s3.regru.cloud/img.devilrust/devilrust_logo.png" 
                  alt="DevilRust Logo" 
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" style={{ fontFamily: 'Nunito, sans-serif', fontStyle: 'italic' }}>
                    DevilRust
                  </h2>
                  <p className="text-xs text-muted-foreground">Гайды</p>
                </div>
              </Link>
              <div className="hidden md:flex items-center gap-2">
                <Link to="/">
                  <Button variant="ghost" size="sm">
                    <Icon name="Home" size={16} className="mr-2" />
                    Wiki
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="bg-primary/10">
                  <Icon name="BookOpen" size={16} className="mr-2" />
                  Гайды
                </Button>
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
        {!selectedGuide ? (
          <>
            <header className="mb-8 text-center fade-in">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {guidesData.pageSettings.title}
              </h1>
              <p className="text-muted-foreground text-lg">
                {guidesData.pageSettings.subtitle}
              </p>
            </header>

            <div className="mb-8 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Поиск по гайдам..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 rounded-md border border-border bg-background text-sm"
                  >
                    <option value="all">Все категории</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="px-4 py-2 rounded-md border border-border bg-background text-sm"
                  >
                    <option value="all">Все уровни</option>
                    {difficulties.map(diff => (
                      <option key={diff.id} value={diff.id}>{diff.name}</option>
                    ))}
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 rounded-md border border-border bg-background text-sm"
                  >
                    <option value="popular">Популярные</option>
                    <option value="rating">По рейтингу</option>
                    <option value="title">По названию</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <Badge
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
                  >
                    <Icon name={cat.icon} size={14} className="mr-1" />
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </div>

            {filteredAndSortedGuides.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="Search" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Гайды не найдены</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedGuides.map((guide) => (
                <Card 
                  key={guide.id}
                  className="group p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer hover-lift"
                  onClick={() => setSelectedGuide(guide)}
                >
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="outline" className="text-xs">
                        <Icon name={getCategoryIcon(guide.category)} size={12} className="mr-1" />
                        {getCategoryName(guide.category)}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getDifficultyColor(guide.difficulty)}`}>
                        {getDifficultyName(guide.difficulty)}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {guide.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {guide.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border pt-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Icon name="Clock" size={14} />
                        <span>{guide.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Eye" size={14} />
                        <span>{guide.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Star" size={14} className="fill-yellow-500 text-yellow-500" />
                        <span>{guide.rating}</span>
                      </div>
                    </div>
                    <Icon name="ArrowRight" size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              ))}
            </div>
            )}
          </>
        ) : (
          <div className="fade-in">
            <Button
              variant="ghost"
              className="mb-6"
              onClick={() => setSelectedGuide(null)}
            >
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              Назад к списку
            </Button>

            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge variant="outline">
                  <Icon name={getCategoryIcon(selectedGuide.category)} size={14} className="mr-1" />
                  {getCategoryName(selectedGuide.category)}
                </Badge>
                <Badge variant="outline" className={getDifficultyColor(selectedGuide.difficulty)}>
                  {getDifficultyName(selectedGuide.difficulty)}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Icon name="Clock" size={14} />
                  <span>{selectedGuide.duration}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Icon name="User" size={14} />
                  <span>{selectedGuide.author}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Icon name="Eye" size={14} />
                  <span>{selectedGuide.views}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Icon name="Star" size={14} className="fill-yellow-500 text-yellow-500" />
                  <span>{selectedGuide.rating}</span>
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {selectedGuide.title}
              </h1>
              <p className="text-muted-foreground text-lg mb-4">
                {selectedGuide.description}
              </p>
              
              {selectedGuide.requirements && selectedGuide.requirements.length > 0 && (
                <Card className="p-4 bg-primary/5 border-primary/20">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Icon name="AlertCircle" size={18} />
                    Требования
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {selectedGuide.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {selectedGuide.steps.map((step) => (
                <Card 
                  key={step.stepNumber}
                  className="overflow-hidden bg-card border-border hover:border-primary/30 transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">{step.stepNumber}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                        {step.note && (
                          <div className="mt-3 p-3 bg-secondary/10 rounded-md border border-secondary/20">
                            <p className="text-sm text-secondary flex items-start gap-2">
                              <Icon name="Lightbulb" size={16} className="mt-0.5 flex-shrink-0" />
                              <span>{step.note}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {step.image && (
                    <div className="border-t border-border">
                      <img 
                        src={step.image}
                        alt={step.title}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {selectedGuide.relatedGuides && selectedGuide.relatedGuides.length > 0 && (
              <Card className="mt-8 p-6 bg-card border-border">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Icon name="Link" size={20} />
                  Связанные гайды
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedGuide.relatedGuides.map(relatedId => {
                    const relatedGuide = guides.find(g => g.id === relatedId);
                    if (!relatedGuide) return null;
                    return (
                      <Button
                        key={relatedId}
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedGuide(relatedGuide)}
                      >
                        {relatedGuide.title}
                      </Button>
                    );
                  })}
                </div>
              </Card>
            )}

            <div className="mt-8 text-center">
              <Button
                variant="default"
                size="lg"
                className="bg-primary hover:bg-primary/90"
                onClick={() => setSelectedGuide(null)}
              >
                <Icon name="BookOpen" size={18} className="mr-2" />
                Посмотреть другие гайды
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Guides;