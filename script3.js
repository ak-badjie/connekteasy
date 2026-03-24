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
  // The className strings look like:
  // className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400"
  // className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400"
  // className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400"
  
  content = content.replace(/(rounded-xl bg-white text-gray-900 placeholder-gray-400)(?! focus:outline-none)/g, "$1 focus:outline-none focus:ring-2 focus:ring-teal-500");

  fs.writeFileSync(fullPath, content, 'utf8');
}
