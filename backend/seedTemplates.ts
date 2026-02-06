import { prisma } from './src/prisma';


const templates = [
  {
    title: 'Student Exam Week',
    icon: 'GraduationCap',
    description: 'Focused on revision blocks and mental clarity.',
    tasks: [
      { title: 'Morning Revision Block', scheduledTime: '08:00' },
      { title: 'Lunch & Relax', scheduledTime: '13:00' },
      { title: 'Afternoon Practice Paper', scheduledTime: '15:00' },
      { title: 'Review Mistakes', scheduledTime: '19:00' },
      { title: 'Plan Tomorrow', scheduledTime: '21:00' },
    ]
  },
  {
    title: 'Job Search Week',
    icon: 'Briefcase',
    description: 'High intensity networking and interview prep.',
    tasks: [
      { title: 'Apply to 3 Companies', scheduledTime: '09:00' },
      { title: 'Follow up Emails', scheduledTime: '11:00' },
      { title: 'Algorithm Practice', scheduledTime: '14:00' },
      { title: 'Network on LinkedIn', scheduledTime: '16:00' },
      { title: 'Project Work', scheduledTime: '18:00' },
    ]
  },
  {
    title: 'Fitness / Fat Loss',
    icon: 'Dumbbell',
    description: 'Daily activity tracking and meal discipline.',
    tasks: [
      { title: 'Morning Cardio', scheduledTime: '06:30' },
      { title: 'Healthy Breakfast', scheduledTime: '08:30' },
      { title: 'Weight Training', scheduledTime: '17:30' },
      { title: 'Evening Walk', scheduledTime: '20:00' },
      { title: 'Sleep 8 Hours', scheduledTime: '22:00' },
    ]
  },
  {
    title: 'Business / Hustle',
    icon: 'Zap',
    description: 'Maximizing output and eliminating distractions.',
    tasks: [
      { title: 'Deep Work Block 1', scheduledTime: '08:00' },
      { title: 'Client Calls / Sales', scheduledTime: '11:00' },
      { title: 'Deep Work Block 2', scheduledTime: '14:00' },
      { title: 'Content Creation', scheduledTime: '16:30' },
      { title: 'Analytics Review', scheduledTime: '19:00' },
    ]
  },
];

async function main() {
  console.log('Seeding templates...');
  for (const t of templates) {
    await prisma.template.upsert({
      where: { id: t.title }, // This is a bit hacky but works for seeding if ID was string, but ID is UUID.
      // Actually, Template doesn't have a unique field except ID. I'll just check by title manually.
      update: {},
      create: {
        title: t.title,
        icon: t.icon,
        description: t.description,
        tasks: t.tasks as any,
      }
    }).catch(async (e) => {
        // Handle if title isn't unique or upsert fails
        const existing = await prisma.template.findFirst({ where: { title: t.title } });
        if (!existing) {
             await prisma.template.create({
                data: {
                    title: t.title,
                    icon: t.icon,
                    description: t.description,
                    tasks: t.tasks as any,
                }
            });
        }
    });
  }
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
