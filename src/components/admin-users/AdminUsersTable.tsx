import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface User {
  email: string;
  nickname: string;
  role: string;
  created_at: number;
  expires_at: number | null;
}

interface AdminUsersTableProps {
  users: User[];
  loading: boolean;
  isSuperAdmin: boolean;
  onEdit: (user: User) => void;
  onDelete: (email: string) => void;
}

const AdminUsersTable = ({
  users,
  loading,
  isSuperAdmin,
  onEdit,
  onDelete,
}: AdminUsersTableProps) => {
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "Бессрочно";
    return new Date(timestamp * 1000).toLocaleDateString("ru-RU");
  };

  const getTimeLeft = (expiresAt: number | null) => {
    if (!expiresAt) return null;
    const now = Math.floor(Date.now() / 1000);
    const diff = expiresAt - now;
    if (diff < 0) return "Истек";
    const days = Math.floor(diff / (24 * 60 * 60));
    return `${days} дн.`;
  };

  if (!isSuperAdmin) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-red-500/20">
        <CardHeader>
          <CardTitle className="text-white">Доступ ограничен</CardTitle>
          <CardDescription className="text-orange-300">
            Только главный администратор может управлять пользователями
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-red-500/20">
      <CardHeader>
        <CardTitle className="text-white">Список администраторов</CardTitle>
        <CardDescription className="text-orange-300">
          Всего пользователей: {users.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-orange-200">Email</TableHead>
              <TableHead className="text-orange-200">Никнейм</TableHead>
              <TableHead className="text-orange-200">Роль</TableHead>
              <TableHead className="text-orange-200">Создан</TableHead>
              <TableHead className="text-orange-200">Истекает</TableHead>
              <TableHead className="text-orange-200">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const timeLeft = getTimeLeft(user.expires_at);
              const isExpired = timeLeft === "Истек";

              return (
                <TableRow key={user.email}>
                  <TableCell className="text-white">{user.email}</TableCell>
                  <TableCell className="text-white">{user.nickname}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "super_admin" ? "default" : "secondary"}>
                      {user.role === "super_admin" ? "Супер-админ" : "Админ"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-orange-300">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell>
                    {user.expires_at ? (
                      <div className="flex items-center gap-2">
                        <span className={isExpired ? "text-red-400" : "text-orange-300"}>
                          {formatDate(user.expires_at)}
                        </span>
                        {timeLeft && (
                          <Badge variant={isExpired ? "destructive" : "outline"}>
                            {timeLeft}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-green-400">
                        Бессрочно
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.role !== "super_admin" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(user)}
                            className="text-white hover:bg-red-600"
                          >
                            <Icon name="Pencil" size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDelete(user.email)}
                            className="text-red-400 hover:bg-red-600"
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminUsersTable;