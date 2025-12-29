import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { Search, ArrowLeft, BookOpen, Hash, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

interface Artigo {
    numero: number;
    titulo: string;
    conteudo: string;
    textoCompleto: string;
}

interface LC214Data {
    titulo: string;
    ementa: string;
    artigos: Artigo[];
    textoCompleto: string;
    totalArtigos: number;
}

export default function LC214Query() {
    const { token } = useAuth() as any;
    const [dados, setDados] = useState<LC214Data | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [termoBusca, setTermoBusca] = useState("");
    const [buscaArtigo, setBuscaArtigo] = useState("");
    const [tipoBusca, setTipoBusca] = useState<"texto" | "artigo">("texto");
    const [artigos, setArtigos] = useState<Artigo[]>([]);
    const [artigosExpandidos, setArtigosExpandidos] = useState<Set<number>>(new Set());
    const [paginaAtual, setPaginaAtual] = useState(1);
    const itensPorPagina = 10;

    useEffect(() => {
        const carregarDados = async () => {
            try {
                const response = await fetch("/api/lc214", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data: LC214Data = await response.json();
                    setDados(data);
                    setArtigos(data.artigos);
                }
            } catch (error) {
                console.error("Erro ao carregar dados da LC 214:", error);
            } finally {
                setCarregando(false);
            }
        };

        carregarDados();
    }, []);

    const artigosFiltrados = useMemo(() => {
        if (!dados) return [];

        if (tipoBusca === "artigo" && buscaArtigo.trim()) {
            const numeroArtigo = parseInt(buscaArtigo.trim(), 10);
            if (!isNaN(numeroArtigo)) {
                return dados.artigos.filter((art) => art.numero === numeroArtigo);
            }
            return [];
        }

        if (tipoBusca === "texto" && termoBusca.trim()) {
            const termo = termoBusca.toLowerCase().trim();
            return dados.artigos.filter((art) =>
                art.conteudo.toLowerCase().includes(termo)
            );
        }

        return dados.artigos;
    }, [dados, termoBusca, buscaArtigo, tipoBusca]);

    const artigosPaginados = useMemo(() => {
        const inicio = (paginaAtual - 1) * itensPorPagina;
        return artigosFiltrados.slice(inicio, inicio + itensPorPagina);
    }, [artigosFiltrados, paginaAtual]);

    const totalPaginas = Math.ceil(artigosFiltrados.length / itensPorPagina);

    const toggleExpandirArtigo = (numero: number) => {
        const novos = new Set(artigosExpandidos);
        if (novos.has(numero)) {
            novos.delete(numero);
        } else {
            novos.add(numero);
        }
        setArtigosExpandidos(novos);
    };

    const destacarTexto = (texto: string, termo: string): React.ReactNode => {
        if (!termo.trim()) return texto;

        const regex = new RegExp(`(${termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
        const partes = texto.split(regex);

        return partes.map((parte, index) =>
            regex.test(parte) ? (
                <mark key={index} className="bg-yellow-300 text-slate-900 px-0.5 rounded">
                    {parte}
                </mark>
            ) : (
                parte
            )
        );
    };

    const handleBuscaChange = (valor: string) => {
        if (tipoBusca === "artigo") {
            setBuscaArtigo(valor);
        } else {
            setTermoBusca(valor);
        }
        setPaginaAtual(1);
    };

    if (carregando) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-slate-600">Carregando Lei Complementar 214/2025...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex items-start justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <BookOpen className="h-10 w-10 text-amber-500" />
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-50">
                                        Consulta LC 214/2025
                                    </h1>
                                    <p className="text-slate-400 text-sm mt-1">
                                        Lei Complementar nº 214, de 16 de janeiro de 2025
                                    </p>
                                </div>
                            </div>
                            <p className="max-w-2xl text-sm text-slate-300">
                                Institui o Imposto sobre Bens e Serviços (IBS) e a Contribuição Social sobre Bens e Serviços (CBS).
                                Consulte por artigo específico ou pesquise no texto da lei.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                            <Link href="/home">
                                <Button
                                    variant="outline"
                                    className="border-slate-500 text-slate-100 hover:bg-slate-800"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Voltar
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 space-y-6">
                {/* Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-6 text-center">
                        <div className="text-3xl font-bold text-amber-400 mb-2">
                            {dados?.totalArtigos || 0}
                        </div>
                        <p className="text-slate-300 text-sm">Total de Artigos</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-6 text-center">
                        <div className="text-3xl font-bold text-blue-400 mb-2">
                            {artigosFiltrados.length}
                        </div>
                        <p className="text-slate-300 text-sm">Artigos Encontrados</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-6 text-center">
                        <div className="text-3xl font-bold text-emerald-400 mb-2">
                            IBS/CBS
                        </div>
                        <p className="text-slate-300 text-sm">Reforma Tributária</p>
                    </div>
                </div>

                {/* Área de Busca */}
                <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Tipo de Busca */}
                        <div className="flex gap-2">
                            <Button
                                variant={tipoBusca === "texto" ? "default" : "outline"}
                                className={`flex items-center gap-2 ${tipoBusca === "texto"
                                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                                    : "text-slate-600 border-slate-300"
                                    }`}
                                onClick={() => {
                                    setTipoBusca("texto");
                                    setBuscaArtigo("");
                                    setPaginaAtual(1);
                                }}
                            >
                                <FileText className="h-4 w-4" />
                                Buscar por Texto
                            </Button>
                            <Button
                                variant={tipoBusca === "artigo" ? "default" : "outline"}
                                className={`flex items-center gap-2 ${tipoBusca === "artigo"
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                                    : "text-slate-600 border-slate-300"
                                    }`}
                                onClick={() => {
                                    setTipoBusca("artigo");
                                    setTermoBusca("");
                                    setPaginaAtual(1);
                                }}
                            >
                                <Hash className="h-4 w-4" />
                                Buscar por Artigo
                            </Button>
                        </div>

                        {/* Campo de Busca */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder={
                                    tipoBusca === "artigo"
                                        ? "Digite o número do artigo (ex: 1, 10, 100)..."
                                        : "Digite um termo para buscar na lei (ex: IBS, CBS, contribuinte)..."
                                }
                                value={tipoBusca === "artigo" ? buscaArtigo : termoBusca}
                                onChange={(e) => handleBuscaChange(e.target.value)}
                                className="pl-10 bg-slate-50 border-slate-200"
                            />
                        </div>
                    </div>
                </div>

                {/* Lista de Artigos */}
                <div className="space-y-4">
                    {artigosPaginados.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                            <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-600 mb-2">
                                Nenhum artigo encontrado
                            </h3>
                            <p className="text-slate-400">
                                {tipoBusca === "artigo"
                                    ? "Verifique o número do artigo digitado."
                                    : "Tente buscar por outro termo."}
                            </p>
                        </div>
                    ) : (
                        artigosPaginados.map((artigo) => {
                            const isExpandido = artigosExpandidos.has(artigo.numero);
                            const conteudoExibir = isExpandido
                                ? artigo.conteudo
                                : artigo.conteudo.slice(0, 500) + (artigo.conteudo.length > 500 ? "..." : "");

                            return (
                                <div
                                    key={artigo.numero}
                                    className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden transition-all hover:shadow-lg"
                                >
                                    <button
                                        onClick={() => toggleExpandirArtigo(artigo.numero)}
                                        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-4 py-2 rounded-lg text-lg shadow-sm">
                                                Art. {artigo.numero}º
                                            </span>
                                            <span className="text-slate-600 text-sm hidden md:block">
                                                Clique para {isExpandido ? "recolher" : "expandir"}
                                            </span>
                                        </div>
                                        {isExpandido ? (
                                            <ChevronUp className="h-6 w-6 text-slate-400" />
                                        ) : (
                                            <ChevronDown className="h-6 w-6 text-slate-400" />
                                        )}
                                    </button>
                                    <div className="px-6 py-4 border-t border-slate-100">
                                        <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                                            {tipoBusca === "texto" && termoBusca.trim()
                                                ? destacarTexto(conteudoExibir, termoBusca)
                                                : conteudoExibir}
                                        </div>
                                        {artigo.conteudo.length > 500 && !isExpandido && (
                                            <button
                                                onClick={() => toggleExpandirArtigo(artigo.numero)}
                                                className="mt-3 text-amber-600 hover:text-amber-700 font-medium text-sm flex items-center gap-1"
                                            >
                                                Ver mais
                                                <ChevronDown className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Paginação */}
                {totalPaginas > 1 && (
                    <div className="flex items-center justify-center gap-3 py-6">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            disabled={paginaAtual === 1}
                            onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                        >
                            Anterior
                        </Button>
                        <span className="text-slate-600 text-sm">
                            Página {paginaAtual} de {totalPaginas}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            disabled={paginaAtual >= totalPaginas}
                            onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                        >
                            Próxima
                        </Button>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-8">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-slate-400 text-sm">
                        Lei Complementar nº 214, de 16 de janeiro de 2025 - Reforma Tributária
                    </p>
                    <p className="text-slate-500 text-xs mt-2">
                        Institui o IBS e a CBS conforme Emenda Constitucional nº 132/2023
                    </p>
                </div>
            </footer>
        </div>
    );
}
