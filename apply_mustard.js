const fs = require('fs');

const replaceInFile = (file, replacements) => {
  try {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    let orig = content;
    replacements.forEach(([regex, rep]) => {
      content = content.replace(regex, rep);
    });
    if (content !== orig) {
      fs.writeFileSync(file, content);
      console.log('Updated ' + file);
    }
  } catch (e) {
    console.error('Error in ' + file + ':', e);
  }
};

// 1. Navbar Logo (match exact text)
replaceInFile('components/Navbar.tsx', [
  [/text-gray-900 group-hover:text-teal-600/g, 'text-teal-700 group-hover:text-teal-800']
]);

// 2. Auth Pages Logo & Buttons
const authPages = ['signin', 'signup', 'forgot-password', 'verify-email', 'action'];
authPages.forEach(p => {
  replaceInFile('app/auth/' + p + '/page.tsx', [
    [/text-gray-900"([^>]*)>\s*CONNEKT/g, 'text-teal-700"$1>\n              CONNEKT'],
    [/bg-teal-600 rounded-xl hover:bg-teal-700/g, 'bg-mustard-500 text-gray-900 rounded-xl hover:bg-mustard-600'],
    [/text-white bg-teal-600/g, 'text-gray-900 bg-mustard-500'],
    [/text-teal-600/g, 'text-mustard-600'],
    [/text-teal-700/g, 'text-mustard-700']
  ]);
});

// 3. Landing page
replaceInFile('app/page.tsx', [
  [/text-teal-600 inline-block">Top Virtual Assistants/g, 'text-mustard-500 inline-block">Top Virtual Assistants'],
  [/text-teal-600 inline-block">Into Income/g, 'text-mustard-500 inline-block">Into Income'],
  [/text-teal-600 inline-block">CONNEKT\?/g, 'text-mustard-500 inline-block">CONNEKT?'],
  [/text-teal-600"/g, 'text-mustard-600"'], 
  [/bg-teal-50 flex items-center justify-center border border-teal-100/g, 'bg-mustard-50 flex items-center justify-center border border-mustard-100'],
  [/bg-teal-500 text-white/g, 'bg-mustard-500 text-gray-900'],
  [/hover:bg-teal-600/g, 'hover:bg-mustard-600'],
  [/border-teal-400/g, 'border-mustard-400'],
  [/hover:text-teal-700/g, 'hover:text-mustard-700'],
  [/bg-teal-100/g, 'bg-mustard-100'],
  [/text-teal-700/g, 'text-mustard-700'],
  [/text-teal-500/g, 'text-mustard-500'],
  [/from-teal-500 to-teal-700/g, 'from-teal-700 to-teal-900']
]);

// 4. Explore page
replaceInFile('app/explore/page.tsx', [
  [/bg-teal-500 text-white/g, 'bg-mustard-500 text-gray-900'],
  [/border-teal-500/g, 'border-mustard-500'],
  [/hover:border-teal-300 hover:text-teal-600/g, 'hover:border-mustard-300 hover:text-mustard-600'],
  [/text-teal-600/g, 'text-mustard-600'],
  [/text-teal-700/g, 'text-mustard-700']
]);

// 5. Dashboard Layout
replaceInFile('app/dashboard/layout.tsx', [
  [/bg-teal-50 text-teal-700/g, 'bg-mustard-50 text-mustard-700'],
  [/text-teal-600/g, 'text-mustard-600']
]);

// 6. Dashboard Pages
const dashboardPages = ['page.tsx', 'post/page.tsx', 'profile/page.tsx', 'projects/page.tsx', 'wallet/page.tsx', 'messages/page.tsx', 'proposals/page.tsx'];
dashboardPages.forEach(p => {
  replaceInFile('app/dashboard/' + p, [
    [/bg-teal-600 text-white/g, 'bg-mustard-500 text-gray-900'],
    [/hover:bg-teal-700/g, 'hover:bg-mustard-600'],
    [/text-white bg-teal-600/g, 'text-gray-900 bg-mustard-500'],
    [/bg-teal-500 text-white/g, 'bg-mustard-500 text-gray-900'],
    [/hover:bg-teal-600/g, 'hover:bg-mustard-600'],
    [/text-teal-600/g, 'text-mustard-600'],
    [/text-teal-700/g, 'text-mustard-700'],
    [/border-teal-500/g, 'border-mustard-500'],
    [/focus:ring-teal-500/g, 'focus:ring-mustard-500']
  ]);
});

// 7. Onboarding
replaceInFile('app/onboarding/page.tsx', [
  [/bg-teal-500/g, 'bg-mustard-500'],
  [/bg-teal-600/g, 'bg-mustard-500'],
  [/hover:bg-teal-700/g, 'hover:bg-mustard-600'],
  [/text-white bg-mustard-500/g, 'text-gray-900 bg-mustard-500'],
  [/text-teal-600/g, 'text-mustard-600'],
  [/text-teal-700/g, 'text-mustard-700'],
  [/border-teal-500/g, 'border-mustard-500'],
  [/bg-teal-50/g, 'bg-mustard-50']
]);

// 8. Components
const components = ['ProjectCard.tsx', 'DetailSidebar.tsx', 'SkillPicker.tsx'];
components.forEach(c => {
  replaceInFile('app/components/' + c, [
    [/bg-teal-600 text-white/g, 'bg-mustard-500 text-gray-900'],
    [/text-white bg-teal-600/g, 'text-gray-900 bg-mustard-500'],
    [/hover:bg-teal-700/g, 'hover:bg-mustard-600'],
    [/text-teal-600/g, 'text-mustard-600'],
    [/bg-teal-50/g, 'bg-mustard-50'],
    [/text-teal-700/g, 'text-mustard-700']
  ]);
});

