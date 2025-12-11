import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import guidesData from '@/data/guides.json';

interface GuideStep {
  stepNumber: number;
  title: string;
  description: string;
  image: string;
}

interface Guide {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Легко' | 'Средне' | 'Сложно';
  steps: GuideStep[];
}

const guides: Guide[] = guidesData.guides;

const Guides = () => {
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Легко':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Средне':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Сложно':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

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
            <header className="mb-12 text-center fade-in">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Гайды по плагинам
              </h1>
              <p className="text-muted-foreground text-lg">
                Пошаговые инструкции для освоения всех механик сервера
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map((guide) => (
                <Card 
                  key={guide.id}
                  className="group p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer hover-lift"
                  onClick={() => setSelectedGuide(guide)}
                >
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="outline" className="text-xs">
                        {guide.category}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getDifficultyColor(guide.difficulty)}`}>
                        {guide.difficulty}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {guide.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Icon name="ListOrdered" size={14} />
                      <span>{guide.steps.length} шагов</span>
                    </div>
                    <Icon name="ArrowRight" size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              ))}
            </div>
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
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline">{selectedGuide.category}</Badge>
                <Badge variant="outline" className={getDifficultyColor(selectedGuide.difficulty)}>
                  {selectedGuide.difficulty}
                </Badge>
              </div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {selectedGuide.title}
              </h1>
              <p className="text-muted-foreground text-lg">
                {selectedGuide.description}
              </p>
            </div>

            <div className="space-y-8">
              {selectedGuide.steps.map((step) => (
                <Card 
                  key={step.stepNumber}
                  className="p-6 bg-card border-border hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">{step.stepNumber}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        {step.description}
                      </p>
                      {step.image && (
                        <div className="rounded-lg overflow-hidden border border-border">
                          <img 
                            src={step.image}
                            alt={step.title}
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Button
                variant="default"
                className="bg-primary hover:bg-primary/90"
                onClick={() => setSelectedGuide(null)}
              >
                <Icon name="BookOpen" size={16} className="mr-2" />
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
