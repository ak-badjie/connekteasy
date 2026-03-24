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
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping missing file: ${file}`);
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // 1. Headings font-display
  // Match <h1... className="...
  content = content.replace(/(<(?:h1|h2|h3)[^>]+className=")([^"]+)(")/g, (match, p1, p2, p3) => {
    if (!p2.includes('font-display')) {
      return p1 + 'font-display ' + p2 + p3;
    }
    return match;
  });
  // The CONNEKT logo spans in auth pages
  content = content.replace(/(<span[^>]+className=")([^"]*text-2xl font-bold tracking-tight text-gray-900[^"]*)(")/g, (match, p1, p2, p3) => {
    if (!p2.includes('font-display')) {
      return p1 + 'font-display ' + p2 + p3;
    }
    return match;
  });
  
  // 2. Buttons: bg-teal-600 rounded-xl
  content = content.replace(/bg-teal-500 rounded-xl hover:bg-teal-600/g, 'bg-teal-600 rounded-xl hover:bg-teal-700');
  content = content.replace(/bg-teal-500 hover:bg-teal-600/g, 'bg-teal-600 hover:bg-teal-700'); // sometimes separated
  
  // Special buttons in wallet
  content = content.replace(/bg-gray-900 hover:bg-black disabled:opacity-50 text-white font-semibold py-3\.5 rounded-xl/g, 'bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl');

  // 3. Inputs: rounded-xl focus:ring-teal-500
  // Auth & onboarding inputs:
  content = content.replace(/(<input[^>]+className="[^"]*rounded-xl bg-white text-gray-900 placeholder-gray-400)([^"]*)(")/g, (match, p1, p2, p3) => {
    let newClass = p2;
    if (!newClass.includes('focus:outline-none')) newClass += ' focus:outline-none';
    if (!newClass.includes('focus:ring-2')) newClass += ' focus:ring-2';
    if (!newClass.includes('focus:ring-teal-500')) newClass += ' focus:ring-teal-500';
    return p1 + newClass + p3;
  });
  
  content = content.replace(/(<textarea[^>]+className="[^"]*rounded-xl bg-white text-gray-900 placeholder-gray-400)([^"]*)(")/g, (match, p1, p2, p3) => {
    let newClass = p2;
    if (!newClass.includes('focus:outline-none')) newClass += ' focus:outline-none';
    if (!newClass.includes('focus:ring-2')) newClass += ' focus:ring-2';
    if (!newClass.includes('focus:ring-teal-500')) newClass += ' focus:ring-teal-500';
    return p1 + newClass + p3;
  });
  
  // 4. Cards: rounded-2xl shadow-sm
  // Auth/onboarding cards
  content = content.replace(/rounded-2xl border border-gray-200 shadow-xl shadow-gray-100\/50/g, 'rounded-2xl border border-gray-200 shadow-sm');
  
  // Wallet cards (rounded-3xl -> rounded-2xl)
  // E.g. bg-white rounded-3xl p-6 border border-gray-200 shadow-sm
  content = content.replace(/bg-white rounded-3xl/g, 'bg-white rounded-2xl');
  content = content.replace(/bg-gradient-to-br from-teal-600 to-teal-800 rounded-3xl/g, 'bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl');
  content = content.replace(/relative bg-white w-full max-w-sm rounded-3xl/g, 'relative bg-white w-full max-w-sm rounded-2xl');
  
  // Wait, I should also make sure inputs in auth/onboarding with `rounded-xl` get `focus:outline-none focus:ring-2 focus:ring-teal-500`.
  // Let's do a more generic replace for inputs in these files if they don't have focus styles.
  // Actually, I did this above with `(<input[^>]+className="[^"]*rounded-xl bg-white text-gray-900 placeholder-gray-400)`.
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated ${file}`);
}
