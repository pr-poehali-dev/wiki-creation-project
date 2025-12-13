import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";

interface WikiSearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  allTags: string[];
}

const WikiSearchFilters = ({
  searchQuery,
  setSearchQuery,
  selectedTag,
  setSelectedTag,
  allTags,
}: WikiSearchFiltersProps) => {
  return (
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
  );
};

export default WikiSearchFilters;
