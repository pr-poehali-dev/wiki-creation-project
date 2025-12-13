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
import { API_URLS } from "@/config/api";
import guidesData from "@/data/guides.json";

const GUIDES_URL = API_URLS.GUIDES;
const DATA_MANAGER_URL = API_URLS.DATA_MANAGER;

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
      setGuides(guidesData.guides || []);
      setCategories(guidesData.categories || []);
      setDifficulties(guidesData.difficulty || []);
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
    const adminNickname = localStorage.getItem("adminNickname") || adminEmail;

    try {
      const isNew = !editingGuide.id || editingGuide.id === "new";

      const guideWithAuthor = {
        ...editingGuide,
        author: isNew ? adminNickname : editingGuide.author
      };

      let updatedGuides;
      if (isNew) {
        const newId = String(Math.max(0, ...guides.map(g => parseInt(g.id) || 0)) + 1);
        guideWithAuthor.id = newId;
        updatedGuides = [...guides, guideWithAuthor];
      } else {
        updatedGuides = guides.map(g => g.id === editingGuide.id ? guideWithAuthor : g);
      }

      const fullData = {
        categories: categories,
        difficulty: difficulties,
        guides: updatedGuides,
        pageSettings: guidesData.pageSettings
      };

      const response = await fetch(`${DATA_MANAGER_URL}?type=guides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token || "",
          "X-Admin-Email": adminEmail || "",
        },
        body: JSON.stringify(fullData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Успех",
          description: isNew ? "Гайд создан" : "Гайд обновлен",
        });
        setIsDialogOpen(false);
        setEditingGuide(null);
        setTimeout(() => window.location.reload(), 1000);
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
      const updatedGuides = guides.filter(g => g.id !== guideId);

      const fullData = {
        categories: categories,
        difficulty: difficulties,
        guides: updatedGuides,
        pageSettings: guidesData.pageSettings
      };

      const response = await fetch(`${DATA_MANAGER_URL}?type=guides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token || "",
          "X-Admin-Email": adminEmail || "",
        },
        body: JSON.stringify(fullData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Успех",
          description: "Гайд удален",
        });
        setTimeout(() => window.location.reload(), 1000);
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

  const handleVideoUpload = async (file: File, stepIndex: number) => {
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
            video: base64Data,
            filename: file.name,
            folder: "guides/videos",
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          if (editingGuide) {
            const updatedSteps = [...editingGuide.steps];
            updatedSteps[stepIndex].video = data.url;
            setEditingGuide({ ...editingGuide, steps: updatedSteps });
          }
          toast({
            title: "Успех",
            description: "Видео загружено",
          });
        } else {
          toast({
            title: "Ошибка",
            description: data.error || "Не удалось загрузить видео",
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
        description: "Не удалось загрузить видео",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  const updateCategories = async (updatedCategories: Category[]) => {
    const token = localStorage.getItem("adminToken");
    const adminEmail = localStorage.getItem("adminEmail");

    try {
      const fullData = {
        categories: updatedCategories,
        difficulty: difficulties,
        guides: guides,
        pageSettings: guidesData.pageSettings
      };

      const response = await fetch(`${DATA_MANAGER_URL}?type=guides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token || "",
          "X-Admin-Email": adminEmail || "",
        },
        body: JSON.stringify(fullData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Успех",
          description: "Категории обновлены",
        });
        setIsCategoriesDialogOpen(false);
        setTimeout(() => window.location.reload(), 1000);
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

  const updateDifficulties = async (updatedDifficulties: Difficulty[]) => {
    const token = localStorage.getItem("adminToken");
    const adminEmail = localStorage.getItem("adminEmail");

    try {
      const fullData = {
        categories: categories,
        difficulty: updatedDifficulties,
        guides: guides,
        pageSettings: guidesData.pageSettings
      };

      const response = await fetch(`${DATA_MANAGER_URL}?type=guides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token || "",
          "X-Admin-Email": adminEmail || "",
        },
        body: JSON.stringify(fullData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Успех",
          description: "Уровни сложности обновлены",
        });
        setIsDifficultiesDialogOpen(false);
        setTimeout(() => window.location.reload(), 1000);
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

  const addStep = () => {
    if (!editingGuide) return;
    const newStep: GuideStep = {
      stepNumber: editingGuide.steps.length + 1,
      title: "",
      description: "",
      image: "",
    };
    setEditingGuide({
      ...editingGuide,
      steps: [...editingGuide.steps, newStep],
    });
  };

  const removeStep = (index: number) => {
    if (!editingGuide) return;
    const updatedSteps = editingGuide.steps.filter((_, i) => i !== index);
    const reorderedSteps = updatedSteps.map((step, i) => ({
      ...step,
      stepNumber: i + 1,
    }));
    setEditingGuide({ ...editingGuide, steps: reorderedSteps });
  };

  const updateStep = (index: number, field: keyof GuideStep, value: string) => {
    if (!editingGuide) return;
    const updatedSteps = [...editingGuide.steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setEditingGuide({ ...editingGuide, steps: updatedSteps });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Управление гайдами</h1>
          <p className="text-muted-foreground mt-2">
            Вы вошли как: {email}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsCategoriesDialogOpen(true)}
          >
            <Icon name="FolderOpen" className="mr-2 h-4 w-4" />
            Категории
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsDifficultiesDialogOpen(true)}
          >
            <Icon name="BarChart" className="mr-2 h-4 w-4" />
            Сложность
          </Button>
          <Button
            onClick={() => {
              setEditingGuide({
                id: "new",
                title: "",
                description: "",
                category: categories[0]?.id || "",
                difficulty: difficulties[0]?.id || "",
                duration: "",
                author: "",
                views: 0,
                rating: 0,
                tags: [],
                steps: [],
                requirements: [],
                relatedGuides: [],
                type: "text",
              });
              setIsDialogOpen(true);
            }}
          >
            <Icon name="Plus" className="mr-2 h-4 w-4" />
            Добавить гайд
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {guides.map((guide) => (
          <Card key={guide.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {guide.title}
                    <Badge variant="outline">
                      {categories.find((c) => c.id === guide.category)?.name}
                    </Badge>
                    <Badge
                      style={{
                        backgroundColor:
                          difficulties.find((d) => d.id === guide.difficulty)
                            ?.color + "20",
                        color: difficulties.find(
                          (d) => d.id === guide.difficulty
                        )?.color,
                      }}
                    >
                      {difficulties.find((d) => d.id === guide.difficulty)?.name}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    {guide.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingGuide(guide);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Icon name="Pencil" className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteGuide(guide.id)}
                  >
                    <Icon name="Trash2" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Автор:</span>{" "}
                  {guide.author}
                </div>
                <div>
                  <span className="text-muted-foreground">Длительность:</span>{" "}
                  {guide.duration}
                </div>
                <div>
                  <span className="text-muted-foreground">Просмотры:</span>{" "}
                  {guide.views}
                </div>
                <div>
                  <span className="text-muted-foreground">Рейтинг:</span>{" "}
                  {guide.rating}
                </div>
              </div>
              <div className="mt-4">
                <span className="text-muted-foreground text-sm">Теги:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {guide.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGuide?.id === "new" ? "Создать гайд" : "Редактировать гайд"}
            </DialogTitle>
            <DialogDescription>
              Заполните информацию о гайде
            </DialogDescription>
          </DialogHeader>

          {editingGuide && (
            <div className="space-y-4">
              <div>
                <Label>Название</Label>
                <Input
                  value={editingGuide.title}
                  onChange={(e) =>
                    setEditingGuide({ ...editingGuide, title: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Описание</Label>
                <Textarea
                  value={editingGuide.description}
                  onChange={(e) =>
                    setEditingGuide({
                      ...editingGuide,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Категория</Label>
                  <Select
                    value={editingGuide.category}
                    onValueChange={(value) =>
                      setEditingGuide({ ...editingGuide, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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

                <div>
                  <Label>Сложность</Label>
                  <Select
                    value={editingGuide.difficulty}
                    onValueChange={(value) =>
                      setEditingGuide({ ...editingGuide, difficulty: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Длительность</Label>
                  <Input
                    value={editingGuide.duration}
                    onChange={(e) =>
                      setEditingGuide({
                        ...editingGuide,
                        duration: e.target.value,
                      })
                    }
                    placeholder="10 минут"
                  />
                </div>

                <div>
                  <Label>Тип</Label>
                  <Select
                    value={editingGuide.type || "text"}
                    onValueChange={(value: 'text' | 'video') =>
                      setEditingGuide({ ...editingGuide, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Текст</SelectItem>
                      <SelectItem value="video">Видео</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Теги (через запятую)</Label>
                <Input
                  value={editingGuide.tags.join(", ")}
                  onChange={(e) =>
                    setEditingGuide({
                      ...editingGuide,
                      tags: e.target.value.split(",").map((t) => t.trim()),
                    })
                  }
                  placeholder="Новичкам, База, Ресурсы"
                />
              </div>

              <div>
                <Label>Требования (через запятую)</Label>
                <Input
                  value={editingGuide.requirements?.join(", ") || ""}
                  onChange={(e) =>
                    setEditingGuide({
                      ...editingGuide,
                      requirements: e.target.value
                        .split(",")
                        .map((t) => t.trim()),
                    })
                  }
                  placeholder="Камень, Дерево"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Шаги</Label>
                  <Button type="button" size="sm" onClick={addStep}>
                    <Icon name="Plus" className="mr-2 h-4 w-4" />
                    Добавить шаг
                  </Button>
                </div>

                <div className="space-y-4">
                  {editingGuide.steps.map((step, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <Label>Шаг {step.stepNumber}</Label>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeStep(index)}
                          >
                            <Icon name="Trash2" className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Input
                            placeholder="Заголовок шага"
                            value={step.title}
                            onChange={(e) =>
                              updateStep(index, "title", e.target.value)
                            }
                          />
                          <Textarea
                            placeholder="Описание шага"
                            value={step.description}
                            onChange={(e) =>
                              updateStep(index, "description", e.target.value)
                            }
                          />
                          <Input
                            placeholder="Примечание (необязательно)"
                            value={step.note || ""}
                            onChange={(e) =>
                              updateStep(index, "note", e.target.value)
                            }
                          />

                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Label>Изображение</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(file, index);
                                  }}
                                  disabled={uploading}
                                />
                                {step.image && (
                                  <a
                                    href={step.image}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button type="button" variant="outline" size="sm">
                                      <Icon name="Eye" className="h-4 w-4" />
                                    </Button>
                                  </a>
                                )}
                              </div>
                            </div>

                            <div className="flex-1">
                              <Label>Видео (необязательно)</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleVideoUpload(file, index);
                                  }}
                                  disabled={uploading}
                                />
                                {step.video && (
                                  <a
                                    href={step.video}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button type="button" variant="outline" size="sm">
                                      <Icon name="Eye" className="h-4 w-4" />
                                    </Button>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveGuide}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCategoriesDialogOpen}
        onOpenChange={setIsCategoriesDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Управление категориями</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {categories.map((cat, index) => (
              <div key={cat.id} className="flex gap-2">
                <Input
                  value={cat.name}
                  onChange={(e) => {
                    const updated = [...categories];
                    updated[index].name = e.target.value;
                    setCategories(updated);
                  }}
                />
                <Input
                  value={cat.icon}
                  onChange={(e) => {
                    const updated = [...categories];
                    updated[index].icon = e.target.value;
                    setCategories(updated);
                  }}
                  placeholder="Icon"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const updated = categories.filter((_, i) => i !== index);
                    setCategories(updated);
                  }}
                >
                  <Icon name="Trash2" className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              onClick={() => {
                setCategories([
                  ...categories,
                  {
                    id: `cat-${Date.now()}`,
                    name: "",
                    icon: "",
                    description: "",
                  },
                ]);
              }}
            >
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Добавить категорию
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCategoriesDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button onClick={() => updateCategories(categories)}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDifficultiesDialogOpen}
        onOpenChange={setIsDifficultiesDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Управление уровнями сложности</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {difficulties.map((diff, index) => (
              <div key={diff.id} className="flex gap-2">
                <Input
                  value={diff.name}
                  onChange={(e) => {
                    const updated = [...difficulties];
                    updated[index].name = e.target.value;
                    setDifficulties(updated);
                  }}
                />
                <Input
                  type="color"
                  value={diff.color}
                  onChange={(e) => {
                    const updated = [...difficulties];
                    updated[index].color = e.target.value;
                    setDifficulties(updated);
                  }}
                  className="w-20"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const updated = difficulties.filter((_, i) => i !== index);
                    setDifficulties(updated);
                  }}
                >
                  <Icon name="Trash2" className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              onClick={() => {
                setDifficulties([
                  ...difficulties,
                  {
                    id: `diff-${Date.now()}`,
                    name: "",
                    color: "#000000",
                  },
                ]);
              }}
            >
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Добавить уровень
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDifficultiesDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button onClick={() => updateDifficulties(difficulties)}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGuides;
