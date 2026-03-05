import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { getQuizTemplate } from '../data/quiz-templates';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (optional - be careful in production!)
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.recipient.deleteMany();
  await prisma.envelope.deleteMany();

  // Create sample envelope with recipients
  console.log('📧 Creating sample envelope...');
  
  // Load quiz template for quiz recipient
  const quizTemplate = getQuizTemplate('pengetahuan-umum-mudah');
  
  const envelope = await prisma.envelope.create({
    data: {
      envelopeName: 'THR Demo 2026',
      accessCode: 'DEMO2026',
      totalBudget: 500000,
      distributionMode: 'CASH',
      status: 'ACTIVE',
      recipients: {
        create: [
          {
            name: 'Adik Kecil',
            ageLevel: 'CHILD',
            status: 'SCHOOL',
            closeness: 'VERY_CLOSE',
            allocatedAmount: 150000,
            aiReasoning: 'Anak-anak yang masih sekolah dan sangat dekat mendapat porsi lebih besar',
            aiGreeting: 'Selamat Idul Fitri adik kecil! Semoga makin rajin belajar dan puasanya lancar ya!',
            playableType: 'GAME',
            gameType: 'MEMORY_CARD',
          },
          {
            name: 'Sepupu Remaja',
            ageLevel: 'TEEN',
            status: 'COLLEGE',
            closeness: 'CLOSE',
            allocatedAmount: 200000,
            aiReasoning: 'Remaja yang kuliah membutuhkan biaya lebih untuk kebutuhan pendidikan',
            aiGreeting: 'Selamat Idul Fitri! Semoga kuliahnya lancar dan sukses selalu. Tetap semangat!',
            playableType: 'QUIZ',
            quizTopic: 'pengetahuan-umum-mudah',
            quizDifficulty: 'EASY',
            quizQuestions: quizTemplate?.questions as any,
          },
          {
            name: 'Keponakan Dewasa',
            ageLevel: 'ADULT',
            status: 'WORKING',
            closeness: 'DISTANT',
            allocatedAmount: 150000,
            aiReasoning: 'Dewasa yang sudah bekerja mendapat porsi standar',
            aiGreeting: 'Selamat Idul Fitri. Mohon maaf lahir batin. Semoga pekerjaan dan keluarga selalu diberkahi.',
            playableType: 'DIRECT',
          },
        ],
      },
    },
    include: {
      recipients: true,
    },
  });

  console.log(`✅ Created envelope: ${envelope.id}`);

  // Create claims for each recipient
  console.log('🎫 Creating claims...');
  const claimTokens: { name: string; token: string }[] = [];
  for (const recipient of envelope.recipients) {
    const token = crypto.randomBytes(32).toString('hex'); // Increased to 32 bytes
    const qrToken = crypto.randomBytes(32).toString('hex'); // Increased to 32 bytes
    const claim = await prisma.claim.create({
      data: {
        recipientId: recipient.id,
        token,
        qrToken,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
    claimTokens.push({ name: recipient.name, token: claim.token });
    // Don't log full token in production
    const maskedToken = process.env.NODE_ENV === 'production' 
      ? `${claim.token.substring(0, 8)}...` 
      : claim.token;
    console.log(`  ✅ Created claim for ${recipient.name}: ${maskedToken}`);
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'SEED_DATA',
      entityType: 'ENVELOPE',
      entityId: envelope.id,
      details: {
        message: 'Database seeded with sample data',
        recipientCount: envelope.recipients.length,
      },
    },
  });

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📋 Sample Data:');
  console.log(`   Envelope ID: ${envelope.id}`);
  console.log(`   Total Budget: Rp ${envelope.totalBudget.toLocaleString('id-ID')}`);
  console.log(`   Recipients: ${envelope.recipients.length}`);
  console.log('\n🔗 Test Claim URLs:');
  claimTokens.forEach((ct) => {
    console.log(`   ${ct.name}: http://localhost:3000/claim/${ct.token}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
