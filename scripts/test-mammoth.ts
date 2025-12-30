import mammoth from 'mammoth';
import * as fs from 'fs';

async function test() {
    const result = await mammoth.convertToHtml({ path: 'LC 214-2025 - ANEXOS.docx' });
    fs.writeFileSync('test-anexos.html', result.value);
    console.log('HTML saved to test-anexos.html');
}
test();
