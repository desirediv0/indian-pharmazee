import { prisma } from "../config/db.js";

// Comprehensive pools of diverse Indian first & last names
const FIRST_NAMES = [
  "Dr. Rajesh", "Dr. Amit", "Dr. Pooja", "Dr. Arvind", "Dr. Vivek", "Dr. Ashok", "Dr. Sunil", "Dr. Pankaj", "Dr. Vinod", "Dr. Sunita",
  "Dr. Neeraj", "Dr. Sangeeta", "Dr. Mohan", "Dr. Meenakshi", "Dr. Alok", "Dr. Sanjay", "Dr. Rajiv", "Dr. Rashmi", "Dr. Anil", "Dr. Shalini",
  "Rahul", "Priya", "Sneha", "Vikram", "Ananya", "Manoj", "Suresh", "Kavita", "Deepak", "Rohit",
  "Amitabh", "Anjali", "Harish", "Bhavna", "Pallavi", "Nitin", "Shruti", "Ashish", "Komal", "Tarun",
  "Radhika", "Ishita", "Mohit", "Aarti", "Pradeep", "Kunal", "Preeti", "Sandeep", "Tanvi", "Gaurav",
  "Swati", "Manish", "Ritu", "Varun", "Neha", "Divya", "Siddharth", "Pooja", "Abhishek", "Kavya",
  "Aditya", "Rupal", "Kartik", "Shreya", "Naveen", "Jyoti", "Sourabh", "Payal", "Hemant", "Garima",
  "Vikas", "Monika", "Ramesh", "Simran", "Chetan", "Tanya", "Jitendra", "Akanksha", "Bhupendra", "Seema",
  "Dinesh", "Kajal", "Mahesh", "Nisha", "Subhash", "Reema", "Naresh", "Sakshi", "Satish", "Juhi",
];

const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Singh", "Gupta", "Roy", "Nair", "Iyer", "Reddy", "Joshi",
  "Choudhary", "Malhotra", "Sundaram", "Mishra", "Saxena", "Rao", "Mukherjee", "Sen", "Mehta", "Bhatt",
  "Deshmukh", "Kulkarni", "Ghosh", "Banerjee", "Agarwal", "Jain", "Sethi", "Kapoor", "Khanna", "Tiwari",
  "Pandey", "Dubey", "Tripathi", "Menon", "Pillai", "Hegde", "Gowda", "Yadav", "Das", "Dutta",
  "Chopra", "Bhardwaj", "Bhatia", "Bose", "Chakraborty", "Chatterjee", "Dhawan", "Garg", "Goel", "Grover",
  "Kaushik", "Kohli", "Mahajan", "Narang", "Rastogi", "Sarin", "Soni", "Surana", "Thakur", "Venkatesh",
];

// Rich, varied review comment templates that dynamically insert product details
const COLD_CHAIN_TEMPLATES = [
  {
    title: "Excellent cold-chain delivery",
    comment: (name) => `Ordered ${name}. Arrived securely in an insulated thermocol box with ice packs properly frozen. Batch and seal verified by our doctor.`,
    rating: 5,
  },
  {
    title: "100% genuine injection & prompt service",
    comment: (name) => `Urgent requirement for ${name} was delivered within the committed timeframe. Temperature was well maintained at 2°C–8°C. Highly reliable.`,
    rating: 5,
  },
  {
    title: "Authentic medicine with proper invoice",
    comment: (name) => `Very satisfied with ${name}. The packaging was tamper-proof and the temperature control was intact throughout transit.`,
    rating: 5,
  },
  {
    title: "Great pricing and authentic batch",
    comment: (name) => `Got ${name} at a substantial discount compared to local hospital pharmacy. Verified QR and batch number.`,
    rating: 4,
  },
  {
    title: "Safely delivered with temperature indicator",
    comment: (name) => `Critical injection ${name} was delivered with full cold-chain compliance. Very professional packaging.`,
    rating: 5,
  },
];

const ONCOLOGY_SPECIALTY_TEMPLATES = [
  {
    title: "Authentic specialty medicine with long expiry",
    comment: (name) => `Purchased ${name} for treatment. Verified the hologram and batch details with oncologist before administration. 100% original.`,
    rating: 5,
  },
  {
    title: "Significant savings on critical medication",
    comment: (name) => `Saved a lot on ${name} compared to local retail chemists. Timely delivery with proper GST bill. Thank you Indian Pharmazee.`,
    rating: 5,
  },
  {
    title: "Timely dispatch before scheduled cycle",
    comment: (name) => `Received ${name} right on time before the scheduled appointment. Sealed manufacturer packaging and excellent customer support.`,
    rating: 5,
  },
  {
    title: "Genuine product & responsive support",
    comment: (name) => `Customer support on WhatsApp answered all questions regarding batch and expiry for ${name} before placing the order. Genuine product.`,
    rating: 4,
  },
  {
    title: "Verified original pack",
    comment: (name) => `Completely authentic pack of ${name}. Secure packaging with prompt delivery updates at every stage.`,
    rating: 5,
  },
];

const IVF_FERTILITY_TEMPLATES = [
  {
    title: "Verified genuine IVF injection",
    comment: (name) => `Doctor confirmed the authenticity of ${name}. Cold chain packaging was completely intact upon delivery.`,
    rating: 5,
  },
  {
    title: "Time-sensitive delivery handled perfectly",
    comment: (name) => `Timing is crucial for ${name}. Dispatched promptly and received in perfect condition with temperature logs.`,
    rating: 5,
  },
  {
    title: "Original sealed vial with long expiry",
    comment: (name) => `Received authentic ${name} with tamper-evident seal. Very pleased with the quick response and hassle-free ordering.`,
    rating: 5,
  },
  {
    title: "Reliable service for fertility medication",
    comment: (name) => `Ordered ${name} after prescription verification. Genuine medication with proper GST billing.`,
    rating: 4,
  },
];

const GENERAL_MEDICINE_TEMPLATES = [
  {
    title: "Original medicine & fast doorstep delivery",
    comment: (name) => `Authentic ${name} with sealed packaging and long shelf life. Received in excellent condition within 2 days.`,
    rating: 5,
  },
  {
    title: "Best price & authentic quality",
    comment: (name) => `Got ${name} at a very reasonable rate. Regular monthly medicines ordered here are always genuine and fresh stock.`,
    rating: 5,
  },
  {
    title: "Reliable pharmacy and smooth experience",
    comment: (name) => `Clear tracking updates and genuine ${name} delivered safely. Very satisfied with the service.`,
    rating: 4,
  },
  {
    title: "Doctor recommended, verified batch",
    comment: (name) => `Exact prescription match for ${name}. Sealed bottle with batch number and hologram verified.`,
    rating: 5,
  },
  {
    title: "Safe packaging & quick customer support",
    comment: (name) => `Well packaged order for ${name}. Great customer service and quick resolution on WhatsApp. Will order again.`,
    rating: 5,
  },
  {
    title: "Prompt delivery with tax invoice",
    comment: (name) => `Received original ${name} along with GST invoice. Transparent pricing and dependable delivery.`,
    rating: 5,
  },
];

function getRandomDate(daysBack = 75) {
  const now = new Date();
  const past = new Date(now.getTime() - Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000) - Math.floor(Math.random() * 12 * 60 * 60 * 1000));
  return past;
}

function selectReviewTemplateList(product) {
  const name = (product.name || "").toLowerCase();
  const catName = (product.categories?.[0]?.category?.name || "").toLowerCase();
  const subCatName = (product.subCategories?.[0]?.subCategory?.name || "").toLowerCase();
  const isColdChain = product.isColdChain || product.isTempControlled || name.includes("injection") || name.includes("vial") || name.includes("amphotericin") || name.includes("peg");

  if (isColdChain) {
    return COLD_CHAIN_TEMPLATES;
  }
  if (catName.includes("oncology") || catName.includes("cancer") || subCatName.includes("cancer") || name.includes("mg") || name.includes("tablet") || name.includes("capsule")) {
    return ONCOLOGY_SPECIALTY_TEMPLATES;
  }
  if (catName.includes("ivf") || catName.includes("fertility") || subCatName.includes("ivf")) {
    return IVF_FERTILITY_TEMPLATES;
  }
  return GENERAL_MEDICINE_TEMPLATES;
}

export async function seedReviews(reviewsPerProduct = 3) {
  console.log("🚀 Starting Diverse Reviews Generation for all products...");

  // 1. Clean up old internal seed reviewers and reviews to ensure all names are completely unique & fresh
  console.log("🧹 Cleaning up old internal seed reviews...");
  const oldUsers = await prisma.user.findMany({
    where: { email: { endsWith: "@pharma-reviews.internal" } },
    select: { id: true },
  });

  if (oldUsers.length > 0) {
    const oldUserIds = oldUsers.map((u) => u.id);
    await prisma.review.deleteMany({
      where: { userId: { in: oldUserIds } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: oldUserIds } },
    });
    console.log(`🗑️ Removed ${oldUserIds.length} old internal reviewer accounts.`);
  }

  // 2. Fetch all products
  const products = await prisma.product.findMany({
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      subCategories: {
        include: {
          subCategory: true,
        },
      },
      reviews: {
        select: { userId: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`📦 Found ${products.length} products to generate diverse reviews for.`);

  let reviewerCounter = 1;
  let totalSeeded = 0;

  // Track created names across the seed to maximize diversity
  const nameCombinations = [];
  for (const fn of FIRST_NAMES) {
    for (const ln of LAST_NAMES) {
      nameCombinations.push(`${fn} ${ln}`);
    }
  }

  // Shuffle name combinations
  nameCombinations.sort(() => 0.5 - Math.random());

  let nameIndex = 0;

  for (const product of products) {
    const templateList = selectReviewTemplateList(product);
    const shuffledTemplates = [...templateList].sort(() => 0.5 - Math.random());

    for (let i = 0; i < reviewsPerProduct; i++) {
      const reviewerName = nameCombinations[nameIndex % nameCombinations.length];
      nameIndex++;

      const reviewerEmail = `reviewer_${reviewerCounter}_${Date.now().toString(36)}@pharma-reviews.internal`;
      reviewerCounter++;

      // Create a unique verified user for this review
      const user = await prisma.user.create({
        data: {
          email: reviewerEmail,
          name: reviewerName,
          role: "CUSTOMER",
          isActive: true,
          otpVerified: true,
        },
      });

      const template = shuffledTemplates[i % shuffledTemplates.length];
      const reviewDate = getRandomDate(80);
      const commentText = template.comment(product.name);

      try {
        await prisma.review.create({
          data: {
            userId: user.id,
            productId: product.id,
            rating: template.rating,
            title: template.title,
            comment: commentText,
            status: "APPROVED",
            featured: i === 0,
            createdAt: reviewDate,
            updatedAt: reviewDate,
          },
        });
        totalSeeded++;
      } catch (err) {
        console.error(`⚠️ Error adding review for ${product.name}:`, err.message);
      }
    }
  }

  console.log(`\n🎉 Seed finished successfully! Created ${totalSeeded} completely diverse, unique reviews across ${products.length} products.`);
  console.log("ℹ️ Every product now has unique customer/doctor names and personalized comments!");
}

// Direct execution
if (process.argv[1]?.endsWith("seedProductReviews.js")) {
  seedReviews(3)
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}
