const fs = require('fs');
const path = require('path');

const files = [
  'app/dashboard/wallet/page.tsx',
  'app/onboarding/page.tsx',
  'app/auth/action/page.tsx',
  'app/auth/forgot-password/page.tsx',
  'app/auth/signin/page.tsx',
  'app/auth/signup/page.tsx',
  'app/auth/verify-email/page.tsx'
];

for (const file of files) {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace missing focus styles on inputs/textareas
  // We'll just look for 'className="' inside <input or <textarea and append the focus styles if missing
  content = content.replace(/(<input[^>]+className=")([^"]+)(")/g, (match, p1, p2, p3) => {
    let newClass = p2;
    if (newClass.includes('rounded-xl') || newClass.includes('bg-white')) {
      if (!newClass.includes('focus:outline-none')) newClass += ' focus:outline-none';
      if (!newClass.includes('focus:ring-2')) newClass += ' focus:ring-2';
      if (!newClass.includes('focus:ring-teal-500')) newClass += ' focus:ring-teal-500';
    }
    return p1 + newClass + p3;
  });
  
  content = content.replace(/(<textarea[^>]+className=")([^"]+)(")/g, (match, p1, p2, p3) => {
    let newClass = p2;
    if (newClass.includes('rounded-xl') || newClass.includes('bg-white')) {
      if (!newClass.includes('focus:outline-none')) newClass += ' focus:outline-none';
      if (!newClass.includes('focus:ring-2')) newClass += ' focus:ring-2';
      if (!newClass.includes('focus:ring-teal-500')) newClass += ' focus:ring-teal-500';
    }
    return p1 + newClass + p3;
  });

  fs.writeFileSync(fullPath, content, 'utf8');
}
