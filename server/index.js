import app from "./app.js";
import dotenv from "dotenv";
import { prisma } from "./config/db.js";

dotenv.config({ path: ".env" });

const PORT = process.env.PORT || 4004;

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Application should continue running despite unhandled promises
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Give server time to handle ongoing requests before shutting down
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("Shutting down gracefully...");
  try {
    await prisma.$disconnect();
    console.log("Database disconnected successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
};

// Listen for termination signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Connect to the database and start the server
const seedExistingPositions = async () => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [
        { position: "asc" },
        { name: "asc" }
      ]
    });
    
    const needsCategorySeeding = categories.some(cat => cat.position <= 0);
    if (needsCategorySeeding) {
      console.log("Seeding positions for categories...");
      for (let i = 0; i < categories.length; i++) {
        await prisma.category.update({
          where: { id: categories[i].id },
          data: { position: i + 1 }
        });
      }
      console.log(`Successfully seeded ${categories.length} categories.`);
    }

    for (const cat of categories) {
      const subCats = await prisma.subCategory.findMany({
        where: { categoryId: cat.id },
        orderBy: [
          { position: "asc" },
          { name: "asc" }
        ]
      });
      
      const needsSubCategorySeeding = subCats.some(sc => sc.position <= 0);
      if (needsSubCategorySeeding) {
        console.log(`Seeding subcategory positions for category ${cat.name}...`);
        for (let j = 0; j < subCats.length; j++) {
          await prisma.subCategory.update({
            where: { id: subCats[j].id },
            data: { position: j + 1 }
          });
        }
      }
    }
  } catch (error) {
    console.error("Error seeding positions:", error);
  }
};

prisma
  .$connect()
  .then(async () => {
    await seedExistingPositions();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} 🚀`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  });
