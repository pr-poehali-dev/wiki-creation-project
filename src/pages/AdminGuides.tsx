import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GUIDES_URL = "https://functions.poehali.dev/ac785d0b-f5b2-4d87-9032-4d3b73bda057";

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

const AdminGuides = () => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoriesDialogOpen, setIsCategoriesDialogOpen] = useState(false);
  const [isDifficultiesDialogOpen, setIsDifficultiesDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const savedEmail = localStorage.getItem("adminEmail");
    if (!token || !savedEmail) {
      navigate("/admin");
      return;
    }
    setEmail(savedEmail);
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      const response = await fetch(GUIDES_URL);
      const data = await response.json();
      setGuides(data.guides || []);
      setCategories(data.categories || []);
      setDifficulties(data.difficulty || []);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить гайды",
        variant: "destructive",
      });
    }
  };

  const handleSaveGuide = async () => {
    if (!editingGuide) return;

    const token = localStorage.getItem("adminToken");
    const adminEmail = localStorage.getItem("adminEmail");

    try {
      const isNew = !editingGuide.id || editingGuide.id === "new";
      const url = GUIDES_URL;
      const method = isNew ? "POST" : "PUT";

      const body = isNew
        ? { guide: editingGuide }
        : { id: editingGuide.id, guide: editingGuide };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token || "",
          "X-Admin-Email": adminEmail || "",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Успех",
          description: isNew ? "Гайд создан" : "Гайд обновлен",
        });
        loadGuides();
        setIsDialogOpen(false);
        setEditingGuide(null);
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось сохранить гайд",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить гайд",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGuide = async (guideId: string) => {
    if (!confirm("Вы уверены что хотите удалить этот гайд?")) return;

    const token = localStorage.getItem("adminToken");
    const adminEmail = localStorage.getItem("adminEmail");

    try {
      const response = await fetch(GUIDES_URL, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token || "",
          "X-Admin-Email": adminEmail || "",
        },
        body: JSON.stringify({ id: guideId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Успех",
          description: "Гайд удален",
        });
        loadGuides();
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось удалить гайд",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить гайд",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (file: File, stepIndex?: number) => {
    if (!file) return;

    const token = localStorage.getItem("adminToken");
    const adminEmail = localStorage.getItem("adminEmail");

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64Data = reader.result as string;

        const response = await fetch(`${GUIDES_URL}?action=upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Token": token || "",
            "X-Admin-Email": adminEmail || "",
          },
          body: JSON.stringify({
            image: base64Data,
            filename: file.name,
            folder: "guides",
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          if (editingGuide) {
            if (stepIndex !== undefined) {
              const updatedSteps = [...editingGuide.steps];
              updatedSteps[stepIndex].image = data.url;
              setEditingGuide({ ...editingGuide, steps: updatedSteps });
            }
          }
          toast({
            title: "Успех",
            description: "Изображение загружено",
          });
        } else {
          toast({
            title: "Ошибка",
            description: data.error || "Не удалось загрузить изображение",
            variant: "destructive",
          });
        }
        setUploading(false);
      };

      reader.onerror = () => {
        toast({
          title: "Ошибка",
          description: "Не удалось прочитать файл",
          variant: "destructive",
        });
        setUploading(false);
      };
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить изображение",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  const openEditDialog = (guide: Guide | null) => {
    if (guide) {
      setEditingGuide({ ...guide });
    } else {
      setEditingGuide({
        id: "new",
        title: "",
        description: "",
        category: categories[0]?.id || "",
        difficulty: difficulties[0]?.id || "",
        duration: "",
        author: email,
        views: 0,
        rating: 0,
        tags: [],
        steps: [],
        requirements: [],
        relatedGuides: [],
      });
    }
    setIsDialogOpen(true);
  };

  const addStep = () => {
    if (!editingGuide) return;
    const newStep: GuideStep = {
      stepNumber: editingGuide.steps.length + 1,
      title: "",
      description: "",
      image: "",
      note: "",
    };
    setEditingGuide({
      ...editingGuide,
      steps: [...editingGuide.steps, newStep],
    });
  };

  const removeStep = (index: number) => {
    if (!editingGuide) return;
    const updatedSteps = editingGuide.steps.filter((_, i) => i !== index);
    // Перенумеровываем шаги
    updatedSteps.forEach((step, i) => {
      step.stepNumber = i + 1;
    });
    setEditingGuide({ ...editingGuide, steps: updatedSteps });
  };

  const updateStep = (index: number, field: keyof GuideStep, value: string) => {
    if (!editingGuide) return;
    const updatedSteps = [...editingGuide.steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setEditingGuide({ ...editingGuide, steps: updatedSteps });
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    navigate("/admin");
  };

  const handleSaveCategories = async () => {
    const token = localStorage.getItem("adminToken");
    const adminEmail = localStorage.getItem("adminEmail");

    try {
      const response = await fetch(GUIDES_URL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token || "",
          "X-Admin-Email": adminEmail || "",
        },
        body: JSON.stringify({
          type: "categories",
          categories: categories,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Успех",
          description: "Категории обновлены",
        });
        setIsCategoriesDialogOpen(false);
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось обновить категории",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить категории",
        variant: "destructive",
      });
    }
  };

  const handleSaveDifficulties = async () => {
    const token = localStorage.getItem("adminToken");
    const adminEmail = localStorage.getItem("adminEmail");

    try {
      const response = await fetch(GUIDES_URL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token || "",
          "X-Admin-Email": adminEmail || "",
        },
        body: JSON.stringify({
          type: "difficulties",
          difficulties: difficulties,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Успех",
          description: "Уровни сложности обновлены",
        });
        setIsDifficultiesDialogOpen(false);
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось обновить уровни сложности",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить уровни сложности",
        variant: "destructive",
      });
    }
  };

  const addCategory = () => {
    setCategories([
      ...categories,
      {
        id: `cat-${Date.now()}`,
        name: "",
        icon: "Star",
        description: "",
      },
    ]);
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  const updateCategory = (id: string, field: keyof Category, value: string) => {
    setCategories(
      categories.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const addDifficulty = () => {
    setDifficulties([
      ...difficulties,
      {
        id: `diff-${Date.now()}`,
        name: "",
        color: "#3b82f6",
      },
    ]);
  };

  const removeDifficulty = (id: string) => {
    setDifficulties(difficulties.filter((d) => d.id !== id));
  };

  const updateDifficulty = (id: string, field: keyof Difficulty, value: string) => {
    setDifficulties(
      difficulties.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Icon name="BookOpen" size={24} className="text-primary" />
              <h1 className="text-xl font-bold">Редактор гайдов</h1>
              <Badge variant="secondary">{email}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate("/admin")}>
                <Icon name="Package" size={16} className="mr-2" />
                Предметы
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                <Icon name="Home" size={16} className="mr-2" />
                На главную
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                <Icon name="LogOut" size={16} className="mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Управление гайдами</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsCategoriesDialogOpen(true)}>
              <Icon name="Folder" size={16} className="mr-2" />
              Категории
            </Button>
            <Button variant="outline" onClick={() => setIsDifficultiesDialogOpen(true)}>
              <Icon name="Target" size={16} className="mr-2" />
              Сложность
            </Button>
            <Button onClick={() => openEditDialog(null)}>
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить гайд
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map((guide) => (
            <Card key={guide.id} className="hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{guide.title}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{guide.category}</Badge>
                      <Badge variant="outline">{guide.difficulty}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {guide.description}
                </p>
                <div className="flex gap-2 text-xs text-muted-foreground mb-3">
                  <span>👁 {guide.views}</span>
                  <span>⭐ {guide.rating}</span>
                  <span>📖 {guide.steps.length} шагов</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(guide)}
                  >
                    <Icon name="Pencil" size={14} className="mr-1" />
                    Изменить
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteGuide(guide.id)}
                  >
                    <Icon name="Trash2" size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGuide?.id === "new" ? "Создать гайд" : "Редактировать гайд"}
            </DialogTitle>
            <DialogDescription>
              Заполните информацию о гайде и добавьте шаги
            </DialogDescription>
          </DialogHeader>

          {editingGuide && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Название</Label>
                  <Input
                    id="title"
                    value={editingGuide.title}
                    onChange={(e) =>
                      setEditingGuide({ ...editingGuide, title: e.target.value })
                    }
                    placeholder="Название гайда"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Длительность</Label>
                  <Input
                    id="duration"
                    value={editingGuide.duration}
                    onChange={(e) =>
                      setEditingGuide({ ...editingGuide, duration: e.target.value })
                    }
                    placeholder="5-10 минут"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={editingGuide.description}
                  onChange={(e) =>
                    setEditingGuide({ ...editingGuide, description: e.target.value })
                  }
                  placeholder="Краткое описание гайда"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Категория</Label>
                  <Select
                    value={editingGuide.category}
                    onValueChange={(value) =>
                      setEditingGuide({ ...editingGuide, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Сложность</Label>
                  <Select
                    value={editingGuide.difficulty}
                    onValueChange={(value) =>
                      setEditingGuide({ ...editingGuide, difficulty: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите сложность" />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map((diff) => (
                        <SelectItem key={diff.id} value={diff.id}>
                          {diff.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Теги (через запятую)</Label>
                <Input
                  id="tags"
                  value={editingGuide.tags.join(", ")}
                  onChange={(e) =>
                    setEditingGuide({
                      ...editingGuide,
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag),
                    })
                  }
                  placeholder="тег1, тег2, тег3"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Шаги гайда</Label>
                  <Button type="button" size="sm" onClick={addStep}>
                    <Icon name="Plus" size={14} className="mr-1" />
                    Добавить шаг
                  </Button>
                </div>

                {editingGuide.steps.map((step, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Шаг {step.stepNumber}</CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(index)}
                        >
                          <Icon name="X" size={14} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Input
                        value={step.title}
                        onChange={(e) => updateStep(index, "title", e.target.value)}
                        placeholder="Заголовок шага"
                      />
                      <Textarea
                        value={step.description}
                        onChange={(e) =>
                          updateStep(index, "description", e.target.value)
                        }
                        placeholder="Описание шага"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Input
                          value={step.image}
                          onChange={(e) => updateStep(index, "image", e.target.value)}
                          placeholder="URL изображения"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploading}
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) handleImageUpload(file, index);
                            };
                            input.click();
                          }}
                        >
                          <Icon
                            name={uploading ? "Loader2" : "Upload"}
                            size={14}
                            className={uploading ? "animate-spin" : ""}
                          />
                        </Button>
                      </div>
                      <Input
                        value={step.note || ""}
                        onChange={(e) => updateStep(index, "note", e.target.value)}
                        placeholder="Примечание (необязательно)"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveGuide}>
              <Icon name="Save" size={16} className="mr-2" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCategoriesDialogOpen} onOpenChange={setIsCategoriesDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактирование категорий</DialogTitle>
            <DialogDescription>
              Управление категориями для гайдов
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {categories.map((category, index) => (
              <Card key={category.id}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-3">
                      <Input
                        value={category.id}
                        onChange={(e) => updateCategory(category.id, "id", e.target.value)}
                        placeholder="ID категории (например: building)"
                      />
                      <Input
                        value={category.name}
                        onChange={(e) => updateCategory(category.id, "name", e.target.value)}
                        placeholder="Название категории"
                      />
                      <Input
                        value={category.icon}
                        onChange={(e) => updateCategory(category.id, "icon", e.target.value)}
                        placeholder="Иконка (lucide-react)"
                      />
                      <Textarea
                        value={category.description}
                        onChange={(e) => updateCategory(category.id, "description", e.target.value)}
                        placeholder="Описание категории"
                        rows={2}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCategory(category.id)}
                    >
                      <Icon name="X" size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button type="button" variant="outline" onClick={addCategory} className="w-full">
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить категорию
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoriesDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveCategories}>
              <Icon name="Save" size={16} className="mr-2" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDifficultiesDialogOpen} onOpenChange={setIsDifficultiesDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактирование уровней сложности</DialogTitle>
            <DialogDescription>
              Управление уровнями сложности для гайдов
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {difficulties.map((difficulty, index) => (
              <Card key={difficulty.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-3">
                      <Input
                        value={difficulty.id}
                        onChange={(e) => updateDifficulty(difficulty.id, "id", e.target.value)}
                        placeholder="ID сложности (например: easy)"
                      />
                      <Input
                        value={difficulty.name}
                        onChange={(e) => updateDifficulty(difficulty.id, "name", e.target.value)}
                        placeholder="Название"
                      />
                      <div className="flex gap-2 items-center">
                        <Input
                          type="color"
                          value={difficulty.color}
                          onChange={(e) => updateDifficulty(difficulty.id, "color", e.target.value)}
                          className="w-20 h-10"
                        />
                        <Input
                          value={difficulty.color}
                          onChange={(e) => updateDifficulty(difficulty.id, "color", e.target.value)}
                          placeholder="#22c55e"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDifficulty(difficulty.id)}
                    >
                      <Icon name="X" size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button type="button" variant="outline" onClick={addDifficulty} className="w-full">
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить уровень сложности
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDifficultiesDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveDifficulties}>
              <Icon name="Save" size={16} className="mr-2" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGuides;