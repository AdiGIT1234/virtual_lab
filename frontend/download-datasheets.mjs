import fs from 'fs';
import path from 'path';

const file = 'src/data/hardwareDetails.js';
const outDir = 'public/datasheets';

let content = fs.readFileSync(file, 'utf8');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Regex to capture the block for each component to find id and datasheetUrl
const blockRegex = /id:\s*"([^"]+)"[\s\S]*?datasheetUrl:\s*"([^"]+)"/g;

let match;
const downloads = [];

while ((match = blockRegex.exec(content)) !== null) {
  const id = match[1];
  const url = match[2];

  if (url.startsWith('http')) {
    const filename = `${id}.pdf`;
    const dest = path.join(outDir, filename);

    downloads.push(
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error(`Status ${res.status}`);
          const destStream = fs.createWriteStream(dest);
          if (res.body.pipe) {
            res.body.pipe(destStream);
          } else {
             // Node 18+ Web Streams need a slightly different approach for writing to a file, 
             // but we can just use Buffer.from(await res.arrayBuffer()) for these small PDFs.
             return res.arrayBuffer().then(buffer => {
               fs.writeFileSync(dest, Buffer.from(buffer));
             });
          }
        })
        .then(() => console.log(`Downloaded ${url} to ${dest}`))
        .catch(err => {
          console.error(`Failed to download ${url}: ${err.message}`);
          // write an empty file just so there's not a missing file issue? Or leave it
        })
    );

    // Replace the URL in the content
    content = content.replace(url, `/datasheets/${filename}`);
  }
}

Promise.all(downloads).then(() => {
  fs.writeFileSync(file, content);
  console.log('All downloads finished and hardwareDetails.js updated.');
});
