const fs = require('fs');
const p = 'src/app/[locale]/(chat)/rooms/components/Sidebars.tsx';
let c = fs.readFileSync(p, 'utf8');

// Fix the broken line caused by the greedy regex matching the arrow function `=>`
c = c.replace(
  "<button onClick={() =>{t('goPremium')}</button>",
  '<button onClick={() => handleCheckout(\'premium\')} className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold py-2 rounded-lg mb-3 shadow-lg hover:scale-105 transition text-sm">{t(\'goPremium\')}</button>'
);

fs.writeFileSync(p, c, 'utf8');
console.log('✅ Fixed the broken Premium button line!');