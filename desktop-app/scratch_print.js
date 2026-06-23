const { print } = require('pdf-to-printer');

async function test() {
  try {
    console.log("Testing print...");
    await print("C:\\Windows\\System32\\drivers\\etc\\hosts", {
      printer: "Microsoft Print to PDF",
      pages: "1",
      monochrome: true
    });
    console.log("Done");
  } catch(e) {
    console.error(e);
  }
}
test();
