import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { API_URLS } from '@/config/api';

const GUIDES_API_URL = API_URLS.GUIDES;

interface GuideRating {
  totalVotes: number;
  totalStars: number;
  averageRating: number;
}

interface GuideStep {
  stepNumber: number;
  title: string;
  description: string;
  image: string;
  video?: string;
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
  type?: 'text' | 'video';
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

const STORAGE_KEY = 'devilrust_guide_ratings';
const VIEWS_STORAGE_KEY = 'devilrust_guide_views';

const Guides = () => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [guideRatings, setGuideRatings] = useState<Record<string, GuideRating>>({});
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [guideViews, setGuideViews] = useState<Record<string, number>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadGuidesData = async () => {
      try {
        const response = await fetch(GUIDES_API_URL, {
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
        setGuides(data.guides || []);
        setCategories(data.categories || []);
        setDifficulties(data.difficulty || []);
      } catch (error) {
        console.error("Failed to load guides from API", error);
        setGuides([]);
        setCategories([]);
        setDifficulties([]);
      } finally {
        setLoading(false);
      }
    };

    loadGuidesData();

    const savedRatings = localStorage.getItem(STORAGE_KEY);
    const savedUserVotes = localStorage.getItem(`${STORAGE_KEY}_user`);
    const savedViews = localStorage.getItem(VIEWS_STORAGE_KEY);
    
    if (savedRatings) {
      setGuideRatings(JSON.parse(savedRatings));
    }
    if (savedUserVotes) {
      setUserVotes(JSON.parse(savedUserVotes));
    }
    if (savedViews) {
      setGuideViews(JSON.parse(savedViews));
    }
  }, []);

  useEffect(() => {
    if (selectedGuide) {
      const updatedViews = {
        ...guideViews,
        [selectedGuide.id]: (guideViews[selectedGuide.id] || 0) + 1
      };
      setGuideViews(updatedViews);
      localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(updatedViews));
    }
  }, [selectedGuide?.id]);

  const getGuideRating = (guideId: string): number => {
    const rating = guideRatings[guideId];
    if (!rating || rating.totalVotes === 0) {
      return guides.find(g => g.id === guideId)?.rating || 0;
    }
    return rating.averageRating;
  };

  const getTotalVotes = (guideId: string): number => {
    return guideRatings[guideId]?.totalVotes || 0;
  };

  const getGuideViews = (guideId: string): number => {
    const baseViews = guides.find(g => g.id === guideId)?.views || 0;
    const additionalViews = guideViews[guideId] || 0;
    return baseViews + additionalViews;
  };

  const handleVote = (guideId: string, stars: number) => {
    const currentRating = guideRatings[guideId] || {
      totalVotes: 0,
      totalStars: 0,
      averageRating: guides.find(g => g.id === guideId)?.rating || 0
    };

    const previousVote = userVotes[guideId] || 0;
    
    let newTotalVotes = currentRating.totalVotes;
    let newTotalStars = currentRating.totalStars;

    if (previousVote > 0) {
      newTotalStars -= previousVote;
    } else {
      newTotalVotes += 1;
    }

    newTotalStars += stars;
    const newAverageRating = newTotalStars / newTotalVotes;

    const updatedRatings = {
      ...guideRatings,
      [guideId]: {
        totalVotes: newTotalVotes,
        totalStars: newTotalStars,
        averageRating: parseFloat(newAverageRating.toFixed(1))
      }
    };

    const updatedUserVotes = {
      ...userVotes,
      [guideId]: stars
    };

    setGuideRatings(updatedRatings);
    setUserVotes(updatedUserVotes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRatings));
    localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(updatedUserVotes));
  };

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
        case 'views':
          return getGuideViews(b.id) - getGuideViews(a.id);
        case 'rating':
          return getGuideRating(b.id) - getGuideRating(a.id);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedCategory, selectedDifficulty, sortBy, guideViews, guideRatings, guides]);

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
                onClick={async () => {
                  setLoading(true);
                  try {
                    const response = await fetch(GUIDES_API_URL);
                    const data = await response.json();
                    if (data.guides) setGuides(data.guides);
                    if (data.categories) setCategories(data.categories);
                    if (data.difficulty) setDifficulties(data.difficulty);
                  } catch (error) {
                    console.error("Failed to refresh guides", error);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                <Icon name={loading ? "Loader2" : "RefreshCw"} size={16} className={loading ? "animate-spin" : ""} />
              </Button>
              <Button
                variant="default"
                className="bg-primary hover:bg-primary/90 hidden sm:flex"
                onClick={() => window.open('https://play.devilrust.ru', '_blank')}
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
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Icon name="Home" size={16} className="mr-2" />
                  Wiki
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="w-full justify-start bg-primary/10">
                <Icon name="BookOpen" size={16} className="mr-2" />
                Гайды
              </Button>
              <Button
                variant="default"
                size="sm"
                className="w-full justify-start bg-primary hover:bg-primary/90"
                onClick={() => {
                  window.open('https://play.devilrust.ru', '_blank');
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
        {!selectedGuide ? (
          <>
            <header className="mb-8 text-center fade-in">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {staticGuidesData.pageSettings.title}
              </h1>
              <p className="text-muted-foreground text-lg">
                {staticGuidesData.pageSettings.subtitle}
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
                    <option value="views">По просмотрам</option>
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

            {guides.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="BookOpen" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Гайды не добавлены</h3>
                <p className="text-muted-foreground">Добавьте гайды через админ-панель</p>
              </div>
            ) : filteredAndSortedGuides.length === 0 ? (
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
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Icon name={getCategoryIcon(guide.category)} size={12} className="mr-1" />
                          {getCategoryName(guide.category)}
                        </Badge>
                        {guide.type === "video" && (
                          <Badge variant="secondary" className="text-xs">
                            <Icon name="Video" size={12} className="mr-1" />
                            Видео
                          </Badge>
                        )}
                      </div>
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
                        <span>{getGuideViews(guide.id)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Star" size={14} className="fill-yellow-500 text-yellow-500" />
                        <span>{getGuideRating(guide.id).toFixed(1)}</span>
                        {getTotalVotes(guide.id) > 0 && (
                          <span className="text-xs text-muted-foreground">({getTotalVotes(guide.id)})</span>
                        )}
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
                  <span>{getGuideViews(selectedGuide.id)} просмотров</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Icon name="Star" size={14} className="fill-yellow-500 text-yellow-500" />
                  <span>{getGuideRating(selectedGuide.id).toFixed(1)}</span>
                  {getTotalVotes(selectedGuide.id) > 0 && (
                    <span className="text-muted-foreground">({getTotalVotes(selectedGuide.id)} голосов)</span>
                  )}
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {selectedGuide.title}
              </h1>
              <p className="text-muted-foreground text-lg mb-4">
                {selectedGuide.description}
              </p>

              <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 mb-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left">
                    <h3 className="font-semibold mb-1 flex items-center gap-2">
                      <Icon name="Star" size={18} className="fill-yellow-500 text-yellow-500" />
                      Оцените этот гайд
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {userVotes[selectedGuide.id] 
                        ? 'Вы уже оценили этот гайд. Можете изменить оценку.'
                        : 'Помогите другим игрокам — поставьте оценку'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleVote(selectedGuide.id, star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="transition-all duration-200 hover:scale-110 active:scale-95"
                      >
                        <Icon
                          name="Star"
                          size={32}
                          className={`transition-colors ${
                            star <= (hoveredStar || userVotes[selectedGuide.id] || 0)
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
              
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
                  {step.video && (
                    <div className="border-t border-border">
                      <video 
                        src={step.video}
                        controls
                        className="w-full h-auto"
                        preload="metadata"
                      >
                        Ваш браузер не поддерживает видео.
                      </video>
                    </div>
                  )}
                  {step.image && !step.video && (
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