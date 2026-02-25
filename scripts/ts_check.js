const ts = require('typescript');
const path = require('path');
const root = process.cwd();
const file = path.join(root, 'pages', 'ProcessManager.tsx');
const program = ts.createProgram([file], { jsx: ts.JsxEmit.React, allowJs: true, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS });
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length === 0) {
  console.log('No TypeScript diagnostics for pages/ProcessManager.tsx');
  process.exit(0);
}
for (const d of diagnostics) {
  const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  if (d.file && typeof d.start === 'number') {
    const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
    console.error(`${d.file.fileName}:${line+1}:${character+1} - ${msg}`);
  } else {
    console.error(msg);
  }
}
process.exit(1);
