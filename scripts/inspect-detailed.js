const fs = require('fs');
const pdf = require('pdf-parse');

async function inspectPDFDetailed() {
  const dataBuffer = fs.readFileSync('./3000-tu-vung-tieng-anh-thong-dung-oxford-theo-chu-de.pdf');
  const parser = new pdf.PDFParse({ data: dataBuffer });
  const res = await parser.getText();
  const text = res.text || "";

  // Check how many pages have tables
  const pages = text.split(/--\s*\d+\s*of\s*\d+\s*--/);
  console.log("Total pages splitted:", pages.length);

  // Let's inspect some pages between page 40 and 60
  for (let i = 40; i <= 45; i++) {
    if (pages[i]) {
      console.log(`\n=== PAGE ${i} ===\n`);
      console.log(pages[i].substring(0, 800));
    }
  }
}

inspectPDFDetailed().catch(console.error);
