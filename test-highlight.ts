import { highlight } from 'cli-highlight';
const code = '```typescript\nconst a = 1;\nconsole.log(a);\n```';
console.log(highlight(code, { language: 'markdown', ignoreIllegals: true }));
