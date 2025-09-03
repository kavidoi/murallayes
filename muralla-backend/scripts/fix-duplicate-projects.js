const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeDuplicateProjects() {
  console.log('🔍 Analyzing projects for duplicates...');
  
  const projects = await prisma.project.findMany({
    include: {
      tasks: true,
      budgets: true
    }
  });

  console.log(`Found ${projects.length} total projects`);

  // Group projects by name to find duplicates
  const projectGroups = {};
  projects.forEach(project => {
    const key = project.name.toLowerCase().trim();
    if (!projectGroups[key]) {
      projectGroups[key] = [];
    }
    projectGroups[key].push(project);
  });

  // Find duplicates
  const duplicates = Object.entries(projectGroups).filter(([_, projects]) => projects.length > 1);
  
  console.log(`\n📊 Found ${duplicates.length} duplicate project groups:`);
  duplicates.forEach(([name, projects]) => {
    console.log(`\n"${name}" (${projects.length} duplicates):`);
    projects.forEach(project => {
      console.log(`  - ID: ${project.id}`);
      console.log(`    Tasks: ${project.tasks.length}`);
      console.log(`    Budgets: ${project.budgets.length}`);
      console.log(`    Description: ${project.description?.substring(0, 100)}...`);
      console.log(`    Kind: ${project.kind}`);
      console.log(`    Deadline: ${project.deadline}`);
    });
  });

  return duplicates;
}

async function consolidateDuplicateProjects() {
  console.log('\n🔧 Starting project consolidation...');
  
  const duplicates = await analyzeDuplicateProjects();
  
  for (const [projectName, duplicateProjects] of duplicates) {
    console.log(`\n📝 Consolidating "${projectName}"...`);
    
    // Sort by creation date to keep the oldest as the main project
    duplicateProjects.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    const mainProject = duplicateProjects[0];
    const projectsToMerge = duplicateProjects.slice(1);
    
    console.log(`  Main project: ${mainProject.id} (keeping this one)`);
    console.log(`  Merging ${projectsToMerge.length} duplicate(s)`);
    
    // Update main project to be CORE type without deadline and clean description
    await prisma.project.update({
      where: { id: mainProject.id },
      data: {
        kind: 'CORE',
        deadline: null,
        description: mainProject.description?.includes('restored') 
          ? null 
          : mainProject.description
      }
    });
    
    // Move all tasks from duplicate projects to main project
    for (const duplicateProject of projectsToMerge) {
      console.log(`    Moving ${duplicateProject.tasks.length} tasks from ${duplicateProject.id}`);
      
      // Update tasks to point to main project
      await prisma.task.updateMany({
        where: { projectId: duplicateProject.id },
        data: { projectId: mainProject.id }
      });
      
      // Move budgets to main project
      console.log(`    Moving ${duplicateProject.budgets.length} budgets from ${duplicateProject.id}`);
      await prisma.budget.updateMany({
        where: { projectId: duplicateProject.id },
        data: { projectId: mainProject.id }
      });
      
      // Delete the duplicate project
      await prisma.project.delete({
        where: { id: duplicateProject.id }
      });
      
      console.log(`    ✅ Deleted duplicate project ${duplicateProject.id}`);
    }
    
    console.log(`  ✅ Consolidated "${projectName}" successfully`);
  }
}

async function updateAllProjectsToCore() {
  console.log('\n🔄 Updating all remaining projects to CORE type...');
  
  const result = await prisma.project.updateMany({
    where: {
      OR: [
        { description: { contains: 'restored' } },
        { kind: 'DEADLINE' }
      ]
    },
    data: {
      kind: 'CORE',
      deadline: null,
      description: null
    }
  });
  
  console.log(`✅ Updated ${result.count} projects to CORE type`);
}

async function addMultipleBudgetSupport() {
  console.log('\n💰 Ensuring multiple budget support...');
  
  // Check if projects already support multiple budgets (they should based on schema)
  const projectsWithMultipleBudgets = await prisma.project.findMany({
    include: {
      budgets: true
    },
    where: {
      budgets: {
        some: {}
      }
    }
  });
  
  console.log(`Found ${projectsWithMultipleBudgets.length} projects with budgets`);
  
  projectsWithMultipleBudgets.forEach(project => {
    if (project.budgets.length > 1) {
      console.log(`  Project "${project.name}" already has ${project.budgets.length} budgets ✅`);
    }
  });
  
  console.log('✅ Multiple budget support is already available in the schema');
}

async function main() {
  try {
    console.log('🚀 Starting project consolidation process...\n');
    
    await consolidateDuplicateProjects();
    await updateAllProjectsToCore();
    await addMultipleBudgetSupport();
    
    console.log('\n🎉 Project consolidation completed successfully!');
    
    // Final summary
    const finalProjects = await prisma.project.findMany({
      include: {
        tasks: true,
        budgets: true
      }
    });
    
    console.log(`\n📈 Final Summary:`);
    console.log(`  Total projects: ${finalProjects.length}`);
    console.log(`  Core projects: ${finalProjects.filter(p => p.kind === 'CORE').length}`);
    console.log(`  Projects with tasks: ${finalProjects.filter(p => p.tasks.length > 0).length}`);
    console.log(`  Projects with budgets: ${finalProjects.filter(p => p.budgets.length > 0).length}`);
    
  } catch (error) {
    console.error('❌ Error during consolidation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeDuplicateProjects, consolidateDuplicateProjects };
