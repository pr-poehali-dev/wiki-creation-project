import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface WikiItem {
  id: string;
  name: string;
  image: string;
  description: string;
  tags: string[];
}

const wikiItems: WikiItem[] = [
  {
    id: '1',
    name: 'Доп рюкзак',
    image: 'https://s3.regru.cloud/img.devilrust/devilrust_priv_back.png',
    description: 'Содержит от 6 - 144 слотов, возможно увеличить слоты прокачивая Престиж или купив Донат привилегию на сайте. Сохраняет в себе все содержимое, не очищается после смерти или глобальных вайпов, если у вас закончилась Донат привилегия, слоты останутся до того момента пока вы не откроете инвентарь рюкзака, после открытия все вещи перейдут к вам в инвентарь, а то что не влезло выпадет на землю и может быть удалено безвозвратно.',
    tags: ['вайпов']
  },
  {
    id: '2',
    name: 'Валюта DC',
    image: 'https://s3.regru.cloud/img.devilrust/devilrust_priv_valuta.png',
    description: 'Это самая ценная валюта на серверах. Добывается путем открытия GOLD SCRAP (золотого металлолома), найти который можно в потерянных контейнерах или купить в Донат магазине, применяется в кастомном крафте для создания уникальных предметов. Данная валюта синхронизируется со всеми PVE серверами, и ее можно добывать на одном сервере, а тратить на другом. Не очищается после вайпа.',
    tags: ['GOLD SCRAP', 'потерянных контейнерах', 'кастомном крафте', 'вайпа']
  },
  {
    id: '3',
    name: 'Валюта DP',
    image: 'https://gspics.org/images/2024/08/05/I8rSI8.png',
    description: 'Можно получить в майнинг ферме, и продать во внутриигровом меню, DP - это основная валюта сервера, требуется для покупки транспорта, как валюта внутриигрового магазина и пр. Не очищается после вайпа.',
    tags: ['майнинг ферме', 'магазина', 'вайпа']
  },
  {
    id: '4',
    name: 'Майнинг ферма',
    image: 'https://gspics.org/images/2024/09/09/I0EH8x.png',
    description: 'Устройство состоящее из источника питания, провода и компьютерной станции. (Гайд по майнингу см. в /info) Основной источник заработка DP, продается в личном меню игрока /m → Обмен DP',
    tags: ['DP', 'меню']
  },
  {
    id: '5',
    name: 'Меню игрока',
    image: '/placeholder.svg',
    description: 'Личное меню игрока доступное на всех серверах, в нем вы можете найти все команды и особенности которые присутствуют на сервере, если вы новичок на нашем проекте - предлагаем вам изучить данное Меню в первую очередь.',
    tags: ['меню', 'Меню']
  },
  {
    id: '6',
    name: 'Вайп / Глобальные вайпы',
    image: '/placeholder.svg',
    description: 'На PVE серверах Глобальные вайпы происходят 1 раз в 30 дней, в первый четверг месяца, сразу после Официального обновления от разработчиков игры (21:30-22:30 по МСК), Глобальный вайп представляет собой полную очистку карты, с удалением изучений. Вайп - представляет из себя точно такую же очистку только без Удаления чертежей. Узнать когда будет ближайший вайп - можно посмотрев в календарь событий на сервере в личном меню игрока.',
    tags: ['вайпы', 'Вайп', 'вайп', 'календарь', 'меню']
  },
  {
    id: '7',
    name: 'Самогоноварение',
    image: 'https://cdn.poehali.dev/projects/21c5f7f9-6172-405c-820b-334660b805c6/files/df5568d9-7d46-4b2c-8b63-214cb9949450.jpg',
    description: 'Для того чтобы вам начать варить самогон, вам нужен продавец Иван, находится он в Мирном городе или Бандитском лагере, у него можно купить все необходимое, как подробно варить самогон вы можете узнать в /info личного меню.',
    tags: ['Самогон', 'меню']
  }
];

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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Icon name="Flame" size={24} className="text-background" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  DevilRust
                </h2>
                <p className="text-xs text-muted-foreground">Wiki</p>
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
                className="overflow-hidden hover-scale fade-in bg-card border-border group cursor-pointer"
              >
                <div className="aspect-video bg-muted relative overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 p-4"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
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