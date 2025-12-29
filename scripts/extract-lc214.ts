import mammoth from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';

interface Artigo {
  numero: string;
  titulo: string;
  conteudo: string;
  paragrafos: string[];
  incisos: string[];
}

interface LC214Data {
  titulo: string;
  ementa: string;
  artigos: Artigo[];
  textoCompleto: string;
}

async function extractLC214() {
  const docxPath = path.join(process.cwd(), 'LC 214-2025.docx');
  
  console.log('Lendo arquivo:', docxPath);
  
  const result = await mammoth.extractRawText({ path: docxPath });
  const textoCompleto = result.value;
  
  console.log('Texto extraído com sucesso!');
  console.log('Tamanho do texto:', textoCompleto.length, 'caracteres');
  
  // Salvar texto bruto para análise
  fs.writeFileSync(
    path.join(process.cwd(), 'Dados', 'lc214-raw.txt'),
    textoCompleto,
    'utf-8'
  );
  
  // Estruturar os artigos
  const artigos: Artigo[] = [];
  
  // Regex para encontrar artigos (Art. 1º, Art. 2º, etc.)
  const artigoRegex = /Art\.\s*(\d+)[º°]?\.?\s*/gi;
  
  const matches = [...textoCompleto.matchAll(artigoRegex)];
  
  console.log('Artigos encontrados:', matches.length);
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const inicio = match.index!;
    const fim = i < matches.length - 1 ? matches[i + 1].index! : textoCompleto.length;
    
    const conteudoArtigo = textoCompleto.slice(inicio, fim).trim();
    const numeroArtigo = match[1];
    
    // Extrair parágrafos (§ 1º, § 2º, Parágrafo único)
    const paragrafos: string[] = [];
    const paragrafoRegex = /(§\s*\d+[º°]?\.?|Parágrafo único\.?)\s*[^§]*/gi;
    const paragrafoMatches = conteudoArtigo.matchAll(paragrafoRegex);
    for (const p of paragrafoMatches) {
      paragrafos.push(p[0].trim());
    }
    
    // Extrair incisos (I -, II -, III -, etc.)
    const incisos: string[] = [];
    const incisoRegex = /^[IVXLCDM]+\s*[-–]\s*.+$/gm;
    const incisoMatches = conteudoArtigo.matchAll(incisoRegex);
    for (const inc of incisoMatches) {
      incisos.push(inc[0].trim());
    }
    
    artigos.push({
      numero: numeroArtigo,
      titulo: `Art. ${numeroArtigo}º`,
      conteudo: conteudoArtigo,
      paragrafos,
      incisos
    });
  }
  
  // Extrair título e ementa
  const primeiraParte = textoCompleto.slice(0, matches[0]?.index || 500);
  const linhas = primeiraParte.split('\n').filter(l => l.trim());
  
  const lc214Data: LC214Data = {
    titulo: 'Lei Complementar nº 214, de 16 de janeiro de 2025',
    ementa: linhas.slice(0, 5).join(' ').trim(),
    artigos,
    textoCompleto
  };
  
  // Salvar JSON estruturado
  const outputPath = path.join(process.cwd(), 'Dados', 'lc214-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(lc214Data, null, 2), 'utf-8');
  
  console.log('Dados salvos em:', outputPath);
  console.log('Total de artigos processados:', artigos.length);
  
  // Mostrar primeiros artigos como amostra
  if (artigos.length > 0) {
    console.log('\n=== Amostra dos primeiros 3 artigos ===');
    artigos.slice(0, 3).forEach(art => {
      console.log(`\nArt. ${art.numero}º:`);
      console.log(art.conteudo.slice(0, 200) + '...');
    });
  }
}

extractLC214().catch(console.error);
