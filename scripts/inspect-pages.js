const fs = require('fs');
const pdf = require('pdf-parse');

async function inspectPages() {
  const dataBuffer = fs.readFileSync('./3000-tu-vung-tieng-anh-thong-dung-oxford-theo-chu-de.pdf');
  const parser = new pdf.PDFParse({ data: dataBuffer });
  const res = await parser.getText();
  
  console.log("Characters from page 3 onwards:");
  const text = res.text || "";
  const page3Index = text.indexOf("-- 3 of 107 --");
  console.log(text.substring(page3Index, page3Index + 4000));
}

inspectPages().catch(console.error);
