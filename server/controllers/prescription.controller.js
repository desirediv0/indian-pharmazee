import { prisma } from "../config/db.js";
import { processAndUploadImage, uploadPDF, getFileUrl } from "../middlewares/multer.middlerware.js";
import { deleteFromS3 } from "../utils/deleteFromS3.js";
import sendEmail from "../utils/sendEmail.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Public Endpoint: Upload Prescription
 * Accepts a single file (image or pdf up to 10MB) + name, phone, optional email, notes
 */
export const uploadPrescription = asyncHandler(async (req, res) => {
  const { name, phone, email, notes } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Name is required");
  }

  if (!phone || !phone.trim()) {
    throw new ApiError(400, "Phone number is required");
  }

  if (!req.file) {
    throw new ApiError(400, "Prescription file (Image or PDF) is required");
  }

  // 10MB limit check (10 * 1024 * 1024 bytes)
  if (req.file.size > 10 * 1024 * 1024) {
    throw new ApiError(400, "File size must not exceed 10MB");
  }

  const mimeType = req.file.mimetype || "";
  const originalName = req.file.originalname || "prescription";
  let fileType = "image";
  let relativeKey = "";

  if (mimeType.includes("pdf") || originalName.toLowerCase().endsWith(".pdf")) {
    fileType = "pdf";
    relativeKey = await uploadPDF(req.file);
  } else if (mimeType.includes("image") || /\.(jpe?g|png|webp)$/i.test(originalName)) {
    fileType = "image";
    relativeKey = await processAndUploadImage(req.file, "prescriptions");
  } else {
    throw new ApiError(400, "Invalid file format. Please upload an Image (JPG, PNG, WEBP) or a PDF document.");
  }

  const fileUrl = getFileUrl(relativeKey);

  // Store in Database
  const prescription = await prisma.prescription.create({
    data: {
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : null,
      notes: notes ? notes.trim() : null,
      fileUrl: fileUrl || relativeKey,
      fileType: fileType.toUpperCase(),
      originalName: originalName,
      fileSize: req.file.size,
      status: "PENDING",
    },
  });

  // Send Email Notification to Admin asynchronously
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.STORE_EMAIL || "admin@indianpharmazee.com";
    const emailSubject = `🚨 New Prescription Uploaded - ${name.trim()} (${phone.trim()})`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0A3B3F; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Indian Pharmazee</h2>
          <p style="margin: 5px 0 0 0; font-size: 14px;">New Prescription Alert</p>
        </div>
        <div style="padding: 24px; color: #333333; line-height: 1.6;">
          <p>A customer has uploaded a new prescription on the website.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 140px; border-bottom: 1px solid #eee;">Customer Name:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${name.trim()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Phone Number:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="tel:${phone.trim()}">${phone.trim()}</a></td>
            </tr>
            ${email ? `
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Email:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${email.trim()}</td>
            </tr>` : ''}
            ${notes ? `
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Notes/Message:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${notes.trim()}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">File Format:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${fileType.toUpperCase()} (${(req.file.size / (1024 * 1024)).toFixed(2)} MB)</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Uploaded At:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
            </tr>
          </table>

          <div style="margin-top: 25px; text-align: center;">
            <a href="${fileUrl || relativeKey}" target="_blank" style="background-color: #2E7D32; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
              📄 View / Download Uploaded Prescription
            </a>
          </div>
        </div>
        <div style="background-color: #f9f9f9; padding: 12px; text-align: center; font-size: 12px; color: #777;">
          This is an automated notification from Indian Pharmazee Admin System.
        </div>
      </div>
    `;

    await sendEmail({
      email: adminEmail,
      subject: emailSubject,
      html: emailHtml,
    });
  } catch (emailErr) {
    console.error("Failed to send admin email notification for prescription upload:", emailErr);
  }

  res.status(201).json({
    success: true,
    message: "Prescription uploaded successfully. Our team will contact you shortly!",
    data: prescription,
  });
});

/**
 * Admin Endpoint: Get all Prescriptions with search & pagination
 */
export const getPrescriptions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search ? String(req.query.search).trim() : "";
  const status = req.query.status ? String(req.query.status).trim() : "";

  const skip = (page - 1) * limit;

  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [total, prescriptions] = await Promise.all([
    prisma.prescription.count({ where }),
    prisma.prescription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      prescriptions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * Admin Endpoint: Update Prescription Status
 */
export const updatePrescriptionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new ApiError(400, "Status is required");
  }

  const prescription = await prisma.prescription.findUnique({
    where: { id },
  });

  if (!prescription) {
    throw new ApiError(404, "Prescription not found");
  }

  const updated = await prisma.prescription.update({
    where: { id },
    data: { status },
  });

  res.status(200).json({
    success: true,
    message: "Prescription status updated",
    data: updated,
  });
});

/**
 * Admin Endpoint: Delete Prescription
 * Deletes DB record AND removes file from S3 / DigitalOcean Spaces to save storage space
 */
export const deletePrescription = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prescription = await prisma.prescription.findUnique({
    where: { id },
  });

  if (!prescription) {
    throw new ApiError(404, "Prescription not found");
  }

  // Delete file from S3/DO Spaces storage
  if (prescription.fileUrl) {
    try {
      await deleteFromS3(prescription.fileUrl);
    } catch (s3Error) {
      console.error(`Failed to delete file from S3 for prescription ${id}:`, s3Error);
    }
  }

  // Delete DB record
  await prisma.prescription.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: "Prescription deleted successfully and storage cleared",
  });
});
