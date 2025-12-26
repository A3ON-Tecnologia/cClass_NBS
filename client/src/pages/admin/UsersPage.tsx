import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AdminLayout from "@/components/admin/AdminLayout";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Shield,
    User,
    Building2,
    X,
} from "lucide-react";

interface SimpleUser {
    id: number;
    username: string;
    is_admin: boolean;
}

interface SimpleCompany {
    id: number;
    name: string;
    cnpj: string;
}

export default function UsersPage() {
    const { token } = useAuth();
    const [users, setUsers] = useState<SimpleUser[]>([]);
    const [companies, setCompanies] = useState<SimpleCompany[]>([]);
    const [searchUser, setSearchUser] = useState("");
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<SimpleUser | null>(null);
    const [userToDelete, setUserToDelete] = useState<SimpleUser | null>(null);
    const [userForCompanies, setUserForCompanies] = useState<SimpleUser | null>(null);

    // Form states
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Company association states
    const [userCompanies, setUserCompanies] = useState<SimpleCompany[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | "">("");
    const [loadingCompanies, setLoadingCompanies] = useState(false);

    async function fetchUsers(query?: string) {
        if (!token) return;
        try {
            setLoadingUsers(true);
            const res = await axios.get<SimpleUser[]>("/api/users", {
                params: query ? { q: query } : undefined,
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(res.data ?? []);
        } catch (err: any) {
            const msg = err?.response?.data?.error ?? "Erro ao buscar usuários";
            toast.error(msg);
        } finally {
            setLoadingUsers(false);
        }
    }

    async function fetchCompanies() {
        if (!token) return;
        try {
            const res = await axios.get<SimpleCompany[]>("/api/companies", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCompanies(res.data ?? []);
        } catch (err: any) {
            const msg = err?.response?.data?.error ?? "Erro ao buscar empresas";
            toast.error(msg);
        }
    }

    async function fetchUserCompanies(userId: number) {
        if (!token) return;
        try {
            setLoadingCompanies(true);
            const res = await axios.get<SimpleCompany[]>(`/api/users/${userId}/companies`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUserCompanies(res.data ?? []);
        } catch (err: any) {
            const msg = err?.response?.data?.error ?? "Erro ao buscar empresas do usuário";
            toast.error(msg);
        } finally {
            setLoadingCompanies(false);
        }
    }

    useEffect(() => {
        fetchUsers();
        fetchCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function openCreateModal() {
        setEditingUser(null);
        setUsername("");
        setPassword("");
        setIsAdmin(false);
        setIsModalOpen(true);
    }

    function openEditModal(user: SimpleUser) {
        setEditingUser(user);
        setUsername(user.username);
        setPassword("");
        setIsAdmin(user.is_admin);
        setIsModalOpen(true);
    }

    function openDeleteDialog(user: SimpleUser) {
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
    }

    function openCompanyModal(user: SimpleUser) {
        setUserForCompanies(user);
        fetchUserCompanies(user.id);
        setSelectedCompanyId("");
        setIsCompanyModalOpen(true);
    }

    async function handleSubmit() {
        if (!username.trim()) {
            toast.error("Preencha o nome de usuário");
            return;
        }
        if (!editingUser && !password.trim()) {
            toast.error("Preencha a senha do novo usuário");
            return;
        }

        try {
            setSubmitting(true);
            if (editingUser) {
                await axios.put(
                    `/api/users/${editingUser.id}`,
                    { username, password: password || undefined, is_admin: isAdmin },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success("Usuário atualizado com sucesso");
            } else {
                await axios.post(
                    "/api/users",
                    { username, password, is_admin: isAdmin },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success("Usuário criado com sucesso");
            }
            setIsModalOpen(false);
            fetchUsers(searchUser);
        } catch (err: any) {
            const msg = err?.response?.data?.error ?? "Erro ao salvar usuário";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!userToDelete) return;
        try {
            await axios.delete(`/api/users/${userToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Usuário excluído com sucesso");
            setIsDeleteDialogOpen(false);
            setUserToDelete(null);
            fetchUsers(searchUser);
        } catch (err: any) {
            const msg = err?.response?.data?.error ?? "Erro ao excluir usuário";
            toast.error(msg);
        }
    }

    async function handleLinkCompany() {
        if (!userForCompanies || !selectedCompanyId) {
            toast.error("Selecione uma empresa");
            return;
        }
        try {
            await axios.post(
                "/api/company-users",
                { user_id: userForCompanies.id, company_id: selectedCompanyId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Empresa associada com sucesso");
            fetchUserCompanies(userForCompanies.id);
            setSelectedCompanyId("");
        } catch (err: any) {
            const msg = err?.response?.data?.error ?? "Erro ao associar empresa";
            toast.error(msg);
        }
    }

    async function handleUnlinkCompany(companyId: number) {
        if (!userForCompanies) return;
        try {
            await axios.post(
                "/api/company-users/unlink",
                { user_id: userForCompanies.id, company_id: companyId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Associação removida");
            fetchUserCompanies(userForCompanies.id);
        } catch (err: any) {
            const msg = err?.response?.data?.error ?? "Erro ao remover associação";
            toast.error(msg);
        }
    }

    const availableCompanies = companies.filter(
        (c) => !userCompanies.some((uc) => uc.id === c.id)
    );

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Usuários</h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Gerencie os usuários do sistema
                        </p>
                    </div>
                    <Button
                        onClick={openCreateModal}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Usuário
                    </Button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por nome de usuário..."
                        value={searchUser}
                        onChange={(e) => {
                            setSearchUser(e.target.value);
                            fetchUsers(e.target.value);
                        }}
                        className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                    />
                </div>

                {/* Users Table */}
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700/50">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Usuário
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {loadingUsers ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                                            Carregando usuários...
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                                            Nenhum usuário encontrado
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-slate-700/30 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                                        {user.is_admin ? (
                                                            <Shield className="h-5 w-5 text-purple-400" />
                                                        ) : (
                                                            <User className="h-5 w-5 text-blue-400" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-medium text-white">
                                                        {user.username}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_admin
                                                            ? "bg-purple-500/20 text-purple-300"
                                                            : "bg-blue-500/20 text-blue-300"
                                                        }`}
                                                >
                                                    {user.is_admin ? "Administrador" : "Usuário"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openCompanyModal(user)}
                                                        className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                                                        title="Gerenciar empresas"
                                                    >
                                                        <Building2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEditModal(user)}
                                                        className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                                                        title="Editar usuário"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openDeleteDialog(user)}
                                                        className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                                        title="Excluir usuário"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create/Edit User Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {editingUser ? "Editar Usuário" : "Novo Usuário"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Nome de usuário
                            </label>
                            <Input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Digite o nome de usuário"
                                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Senha {editingUser && "(deixe vazio para manter a atual)"}
                            </label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={editingUser ? "Nova senha (opcional)" : "Digite a senha"}
                                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isAdmin}
                                onChange={(e) => setIsAdmin(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-300">Administrador</span>
                        </label>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                            {submitting ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-slate-800 border-slate-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">
                            Confirmar exclusão
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            Tem certeza que deseja excluir o usuário{" "}
                            <span className="font-semibold text-white">
                                {userToDelete?.username}
                            </span>
                            ? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Company Association Modal */}
            <Dialog open={isCompanyModalOpen} onOpenChange={setIsCompanyModalOpen}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            Empresas do usuário: {userForCompanies?.username}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Add company */}
                        <div className="flex gap-2">
                            <select
                                value={selectedCompanyId}
                                onChange={(e) =>
                                    setSelectedCompanyId(e.target.value ? Number(e.target.value) : "")
                                }
                                className="flex-1 rounded-md bg-slate-700/50 border border-slate-600 text-white px-3 py-2 text-sm"
                            >
                                <option value="">Selecione uma empresa...</option>
                                {availableCompanies.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <Button
                                onClick={handleLinkCompany}
                                disabled={!selectedCompanyId}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Associated companies list */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-300">
                                Empresas associadas:
                            </p>
                            {loadingCompanies ? (
                                <p className="text-sm text-slate-400">Carregando...</p>
                            ) : userCompanies.length === 0 ? (
                                <p className="text-sm text-slate-400">
                                    Nenhuma empresa associada
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {userCompanies.map((company) => (
                                        <div
                                            key={company.id}
                                            className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    {company.name}
                                                </p>
                                                <p className="text-xs text-slate-400">{company.cnpj}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleUnlinkCompany(company.id)}
                                                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => setIsCompanyModalOpen(false)}
                            className="bg-slate-600 hover:bg-slate-700"
                        >
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
