const fs = require('fs');
const pdf = require('pdf-parse');

async function inspectPDF() {
  const dataBuffer = fs.readFileSync('./3000-tu-vung-tieng-anh-thong-dung-oxford-theo-chu-de.pdf');
  
  if (pdf.PDFParse) {
    const parser = new pdf.PDFParse({ data: dataBuffer });
    const res = await parser.getText();
    console.log("Total pages / result:", res.total, "Length:", res.text?.length);
    console.log("Sample text:");
    console.log((res.text || "").substring(0, 3000));
  } else {
    console.log("Keys:", Object.keys(pdf));
  }
}

inspectPDF().catch(console.error);
