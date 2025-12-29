import mammoth from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';

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

async function extractLC214() {
    const docxPath = path.join(process.cwd(), 'LC 214-2025.docx');

    console.log('Lendo arquivo:', docxPath);

    const result = await mammoth.extractRawText({ path: docxPath });
    let textoCompleto = result.value;

    // Normalizar quebras de linha
    textoCompleto = textoCompleto.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    console.log('Texto extraído com sucesso!');
    console.log('Tamanho do texto:', textoCompleto.length, 'caracteres');

    // Regex para encontrar artigos no início de linha ou após ponto
    // Padrão: "Art. XXX" onde XXX é um número
    const artigoRegex = /\bArt\.\s*(\d+)[º°]?\.?\s*/g;

    // Encontrar todas as posições de artigos
    const matches: { index: number; numero: number; match: string }[] = [];
    let match;

    while ((match = artigoRegex.exec(textoCompleto)) !== null) {
        const numero = parseInt(match[1], 10);
        // Verificar se é um artigo válido (1 a 600) e não uma referência como "art. 156-A"
        if (numero >= 1 && numero <= 600) {
            // Verificar se não é uma referência a outro artigo (geralmente precedido por "do", "no", "nos", "da", "das")
            const textoBefore = textoCompleto.slice(Math.max(0, match.index - 10), match.index).toLowerCase();
            const isReference = /\b(do|no|nos|da|das|ao|aos|pelo|pela|conforme|previsto|disposto|trata|refere)\s*$/.test(textoBefore);

            if (!isReference) {
                matches.push({
                    index: match.index,
                    numero,
                    match: match[0]
                });
            }
        }
    }

    console.log('Posições de artigos encontradas:', matches.length);

    // Agrupar por número de artigo (pegar apenas a primeira ocorrência de cada artigo)
    const artigosMap = new Map<number, Artigo>();

    for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const nextIndex = i < matches.length - 1 ? matches[i + 1].index : textoCompleto.length;

        const conteudoArtigo = textoCompleto.slice(current.index, nextIndex).trim();

        // Se o artigo já existe, pegar o mais completo
        if (artigosMap.has(current.numero)) {
            const existing = artigosMap.get(current.numero)!;
            if (conteudoArtigo.length > existing.conteudo.length) {
                artigosMap.set(current.numero, {
                    numero: current.numero,
                    titulo: `Art. ${current.numero}º`,
                    conteudo: conteudoArtigo,
                    textoCompleto: conteudoArtigo
                });
            }
        } else {
            artigosMap.set(current.numero, {
                numero: current.numero,
                titulo: `Art. ${current.numero}º`,
                conteudo: conteudoArtigo,
                textoCompleto: conteudoArtigo
            });
        }
    }

    // Converter Map para array e ordenar
    const artigos = Array.from(artigosMap.values())
        .sort((a, b) => a.numero - b.numero);

    console.log('Artigos únicos processados:', artigos.length);

    // Mostrar alguns artigos como amostra
    console.log('\n=== Primeiros 5 artigos (amostra) ===');
    artigos.slice(0, 5).forEach(art => {
        console.log(`\n${art.titulo}:`);
        console.log(art.conteudo.slice(0, 300) + '...');
    });

    // Extrair ementa (texto antes do Art. 1º)
    const primeiroArtigo = matches.find(m => m.numero === 1);
    const ementa = primeiroArtigo
        ? textoCompleto.slice(0, primeiroArtigo.index).trim()
        : '';

    const lc214Data: LC214Data = {
        titulo: 'Lei Complementar nº 214, de 16 de janeiro de 2025',
        ementa: ementa.slice(0, 1000), // Limitar ementa
        artigos,
        textoCompleto,
        totalArtigos: artigos.length
    };

    // Salvar JSON estruturado
    const outputPath = path.join(process.cwd(), 'Dados', 'lc214-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(lc214Data, null, 2), 'utf-8');

    console.log('\n=== Resumo ===');
    console.log('Dados salvos em:', outputPath);
    console.log('Total de artigos:', artigos.length);
    console.log('Primeiro artigo:', artigos[0]?.numero);
    console.log('Último artigo:', artigos[artigos.length - 1]?.numero);
}

extractLC214().catch(console.error);
