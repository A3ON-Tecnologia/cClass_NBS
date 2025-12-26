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
    Building2,
    MapPin,
} from "lucide-react";

interface SimpleCompany {
    id: number;
    name: string;
    address: string | null;
    cnpj: string;
}

export default function CompaniesPage() {
    const { token } = useAuth();
    const [companies, setCompanies] = useState<SimpleCompany[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<SimpleCompany | null>(null);
    const [companyToDelete, setCompanyToDelete] = useState<SimpleCompany | null>(null);

    // Form states
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [cnpj, setCnpj] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function fetchCompanies() {
        if (!token) return;
        try {
            setLoading(true);
            const res = await axios.get<SimpleCompany[]>("/api/companies", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCompanies(res.data ?? []);
        } catch (err: any) {
            const msg = err?.response?.data?.error ?? "Erro ao buscar empresas";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredCompanies = companies.filter(
        (c) =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.cnpj.includes(searchTerm)
    );

    function openCreateModal() {
        setEditingCompany(null);
        setName("");
        setAddress("");
        setCnpj("");
        setIsModalOpen(true);
    }

    function openEditModal(company: SimpleCompany) {
        setEditingCompany(company);
        setName(company.name);
        setAddress(company.address ?? "");
        setCnpj(company.cnpj);
        setIsModalOpen(true);
    }

    function openDeleteDialog(company: SimpleCompany) {
        setCompanyToDelete(company);
        setIsDeleteDialogOpen(true);
    }

    function formatCnpj(value: string) {
        const digits = value.replace(/\D/g, "").slice(0, 14);
        if (digits.length <= 2) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
        if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
        if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    }

    async function handleSubmit() {
        if (!name.trim()) {
            toast.error("Preencha o nome da empresa");
            return;
        }
        if (!cnpj.trim()) {
            toast.error("Preencha o CNPJ");
            return;
        }

        try {
            setSubmitting(true);
            if (editingCompany) {
                await axios.put(
                    `/api/companies/${editingCompany.id}`,
                    { name, address: address || undefined, cnpj },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success("Empresa atualizada com sucesso");
            } else {
                await axios.post(
                    "/api/companies",
                    { name, address: address || undefined, cnpj },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success("Empresa cadastrada com sucesso");
            }
            setIsModalOpen(false);
            fetchCompanies();
        } catch (err: any) {
            const msg = err?.response?.data?.error ?? "Erro ao salvar empresa";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!companyToDelete) return;
        try {
            await axios.delete(`/api/companies/${companyToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Empresa excluída com sucesso");
            setIsDeleteDialogOpen(false);
            setCompanyToDelete(null);
            fetchCompanies();
        } catch (err: any) {
            const msg = err?.response?.data?.error ?? "Erro ao excluir empresa";
            toast.error(msg);
        }
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Empresas</h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Gerencie as empresas cadastradas no sistema
                        </p>
                    </div>
                    <Button
                        onClick={openCreateModal}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Empresa
                    </Button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por nome ou CNPJ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                    />
                </div>

                {/* Companies Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        <div className="col-span-full text-center py-8 text-slate-400">
                            Carregando empresas...
                        </div>
                    ) : filteredCompanies.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-slate-400">
                            Nenhuma empresa encontrada
                        </div>
                    ) : (
                        filteredCompanies.map((company) => (
                            <div
                                key={company.id}
                                className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-5 hover:border-slate-600/50 transition-all duration-200 group"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center flex-shrink-0">
                                            <Building2 className="h-6 w-6 text-emerald-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-semibold text-white truncate">
                                                {company.name}
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {company.cnpj}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditModal(company)}
                                            className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openDeleteDialog(company)}
                                            className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                {company.address && (
                                    <div className="mt-4 flex items-start gap-2 text-xs text-slate-400">
                                        <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                        <span className="line-clamp-2">{company.address}</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Create/Edit Company Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {editingCompany ? "Editar Empresa" : "Nova Empresa"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Nome da empresa *
                            </label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Digite o nome da empresa"
                                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                CNPJ *
                            </label>
                            <Input
                                value={cnpj}
                                onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                                placeholder="00.000.000/0000-00"
                                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Endereço
                            </label>
                            <Input
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Rua, número, cidade, estado"
                                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                            />
                        </div>
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
                            Tem certeza que deseja excluir a empresa{" "}
                            <span className="font-semibold text-white">
                                {companyToDelete?.name}
                            </span>
                            ? Esta ação não pode ser desfeita e removerá todas as associações
                            com usuários.
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
        </AdminLayout>
    );
}
