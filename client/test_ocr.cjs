const Tesseract = require('tesseract.js');
Tesseract.recognize('/Users/rishabhhirwe/Desktop/invoice.webp', 'eng').then(({ data: { text } }) => {
  console.log(text);
});
