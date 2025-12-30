import mammoth from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';

async function extractAnexos() {
    // Usando o arquivo que contém os anexos
    const docxPath = path.resolve('LC 214-2025 - ANEXOS.docx');

    if (!fs.existsSync(docxPath)) {
        console.error(`Arquivo não encontrado: ${docxPath}`);
        return;
    }

    console.log('Convertendo DOCX para HTML para extrair anexos com tabelas...');
    const result = await mammoth.convertToHtml({ path: docxPath });
    const html = result.value;

    // Regex para encontrar o início de um anexo: <p>ANEXO I</p>, <p>ANEXO II</p>, etc.
    const anexoRegex = /<p>(ANEXO\s+[IVXLC]+)<\/p>/g;
    const matches = Array.from(html.matchAll(anexoRegex));
    const anexos = [];

    for (let i = 0; i < matches.length; i++) {
        const currentMatch = matches[i];
        const nextIndex = i < matches.length - 1 ? matches[i + 1].index : html.length;

        const titulo = currentMatch[1];
        let conteudo = html.slice(currentMatch.index + currentMatch[0].length, nextIndex).trim();

        // Tentar extrair o subtítulo (primeiro parágrafo após o título do anexo)
        const subTitleMatch = conteudo.match(/^<p>(.*?)<\/p>/);
        let subtitulo = '';
        if (subTitleMatch) {
            subtitulo = subTitleMatch[1];
        }

        // Versão em texto puro para busca
        const conteudoTexto = conteudo.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

        anexos.push({
            id: titulo.replace(/\s+/g, '-').toLowerCase(),
            titulo: titulo,
            subtitulo: subtitulo,
            conteudoTexto: conteudoTexto,
            conteudoHtml: conteudo
        });
    }

    const outputPath = path.resolve('Dados/lc214-anexos.json');
    if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(anexos, null, 2));
    console.log(`JSON de anexos gerado com sucesso em: ${outputPath}`);
}

extractAnexos().catch(console.error);
