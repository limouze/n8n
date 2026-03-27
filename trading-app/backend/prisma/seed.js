const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const stocks = [
  { symbol: 'ATW', name: 'Attijariwafa bank', sector: 'Banques' },
  { symbol: 'IAM', name: 'Maroc Telecom', sector: 'Télécommunications' },
  { symbol: 'BCP', name: 'Banque Centrale Populaire', sector: 'Banques' },
  { symbol: 'CIH', name: 'CIH Bank', sector: 'Banques' },
  { symbol: 'BMCE', name: 'BMCE Bank of Africa', sector: 'Banques' },
  { symbol: 'SNI', name: 'Société Nationale d\'Investissement', sector: 'Investissement' },
  { symbol: 'ITISSALAT', name: 'Itissalat Al-Maghrib', sector: 'Télécommunications' },
  { symbol: 'MASI', name: 'Maroc Assurance Crédit', sector: 'Assurances' },
  { symbol: 'STRUMA', name: 'Struma', sector: 'Distribution' },
  { symbol: 'AZERTY', name: 'Azerty', sector: 'Distribution' }
];

const fundamentals = {
  'ATW': { per: 14.2, pbRatio: 1.8, dividende: 4.5, croissanceCA: 8.2, margeNette: 22.1 },
  'IAM': { per: 18.5, pbRatio: 3.1, dividende: 6.8, croissanceCA: 3.1, margeNette: 28.4 },
  'BCP': { per: 12.8, pbRatio: 1.5, dividende: 5.2, croissanceCA: 6.5, margeNette: 25.3 },
  'CIH': { per: 16.3, pbRatio: 2.1, dividende: 3.8, croissanceCA: 4.2, margeNette: 23.7 },
  'BMCE': { per: 15.1, pbRatio: 1.9, dividende: 4.1, croissanceCA: 5.8, margeNette: 24.2 },
  'SNI': { per: 11.5, pbRatio: 1.2, dividende: 7.5, croissanceCA: 2.3, margeNette: 32.1 },
  'ITISSALAT': { per: 20.2, pbRatio: 3.8, dividende: 5.2, croissanceCA: -1.5, margeNette: 26.8 },
  'MASI': { per: 13.9, pbRatio: 1.6, dividende: 3.2, croissanceCA: 9.1, margeNette: 18.5 },
  'STRUMA': { per: 17.6, pbRatio: 2.4, dividende: 2.1, croissanceCA: 3.7, margeNette: 15.2 },
  'AZERTY': { per: 19.8, pbRatio: 2.9, dividende: 1.5, croissanceCA: 2.1, margeNette: 12.8 }
};

async function main() {
  console.log('Starting seed...');

  for (const stock of stocks) {
    const created = await prisma.stock.upsert({
      where: { symbol: stock.symbol },
      update: stock,
      create: stock
    });

    // Add fundamentals
    const fund = fundamentals[stock.symbol];
    if (fund) {
      await prisma.fundamental.upsert({
        where: { stockId: created.id },
        update: fund,
        create: { stockId: created.id, ...fund }
      });
    }

    console.log(`Created/updated stock: ${stock.symbol}`);
  }

  // Create demo user
  await prisma.user.upsert({
    where: { email: 'demo@trading.ma' },
    update: {},
    create: {
      email: 'demo@trading.ma',
      password: 'demo123' // In production, hash this!
    }
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
