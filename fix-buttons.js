const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/kelvin babu/Downloads/sandune-main/sandune-main/src/app';

function processDir(currentDir) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.name === 'page.tsx' && !fullPath.includes('create')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      if (content.includes('<button className={styles.primaryButton}>') && !content.includes('import Link')) {
        content = 'import Link from "next/link";\n' + content;
        changed = true;
      }
      
      const before = content;
      content = content.replace(/<button className=\{styles\.primaryButton\}>\+\s*(.*?)<\/button>/g, (match, p1) => {
        return `<Link href="/create?type=${encodeURIComponent(p1)}" className={styles.primaryButton}>+ ${p1}</Link>`;
      });

      content = content.replace(/<button className=\{styles\.primaryButton\}>Run Payroll<\/button>/g, `<Link href="/create?type=Payroll%20Run" className={styles.primaryButton}>Run Payroll</Link>`);
      content = content.replace(/<button className=\{styles\.primaryButton\}>Submit Report<\/button>/g, `<button className={styles.primaryButton} type="submit">Submit Report</button>`);
      content = content.replace(/<button className=\{styles\.primaryButton\}>Save Changes<\/button>/g, `<button className={styles.primaryButton} type="submit">Save Changes</button>`);
      
      if (content !== before) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir(dir);
console.log('Buttons updated!');
