"use client";

import { useState, useRef } from "react";
import { FileText, Upload, X, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const FloatingPrescriptionModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    // Check size limit: 10MB (10 * 1024 * 1024 bytes)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      toast.error("File size exceeds 10MB limit. Please upload a smaller image or PDF.");
      return;
    }

    // Check type: Image or PDF
    const mime = selectedFile.type || "";
    const name = selectedFile.name || "";
    const isValidType =
      mime.startsWith("image/") ||
      mime.includes("pdf") ||
      /\.(jpe?g|png|webp|pdf)$/i.test(name);

    if (!isValidType) {
      toast.error("Invalid file format. Please upload JPG, PNG, WEBP image or PDF document.");
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    if (!file) {
      toast.error("Please select a prescription image or PDF file");
      return;
    }

    try {
      setLoading(true);

      const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api";
      const uploadUrl = apiBase.endsWith("/") ? `${apiBase}public/prescriptions` : `${apiBase}/public/prescriptions`;

      const data = new FormData();
      data.append("name", formData.name.trim());
      data.append("phone", formData.phone.trim());
      if (formData.email.trim()) data.append("email", formData.email.trim());
      if (formData.notes.trim()) data.append("notes", formData.notes.trim());
      data.append("file", file);

      const res = await fetch(uploadUrl, {
        method: "POST",
        body: data,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to upload prescription");
      }

      setIsSuccess(true);
      toast.success("Prescription uploaded successfully!");
    } catch (err) {
      console.error("Prescription upload error:", err);
      toast.error(err.message || "Failed to upload prescription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setFormData({ name: "", phone: "", email: "", notes: "" });
    setIsSuccess(false);
    setLoading(false);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(resetForm, 300);
  };

  return (
    <>
      {/* Floating Button right above WhatsApp button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[146px] md:bottom-24 right-4 md:right-6 z-40 group flex items-center justify-center md:justify-start w-14 h-14 md:w-auto md:h-auto bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] border border-white/20 md:pr-2 md:pl-4 md:py-1 rounded-full shadow-2xl hover:shadow-blue-900/30 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer gap-4"
        aria-label="Upload Prescription"
      >
        {/* Pulse Glow Effect */}
        <div className="absolute inset-0 rounded-full bg-blue-500/25 animate-pulse pointer-events-none" />

        {/* Text on Left */}
        <div className="hidden md:flex flex-col items-start leading-tight">
          <span className="font-extrabold text-white text-xs tracking-wider uppercase font-display">
            UPLOAD PRESCRIPTION
          </span>
          <span className="text-[10px] text-white/95 font-medium tracking-wide mt-0.5">
            MAX 10MB (IMAGE / PDF)
          </span>
        </div>

        {/* Icon on Right */}
        <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
          <FileText className="w-5 h-5 md:w-6 md:h-6" />
        </div>
      </button>

      {/* Modal Backdrop & Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-400/30">
                  <FileText className="w-6 h-6 text-blue-200" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Upload Prescription</h3>
                  <p className="text-xs text-blue-100 font-normal">
                    Quick upload for medication pricing & availability
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              {isSuccess ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-800">Prescription Uploaded!</h4>
                    <p className="text-sm text-slate-600 mt-2 max-w-xs mx-auto">
                      Thank you! Our pharmacy team is reviewing your prescription and will contact you via WhatsApp/Phone shortly.
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name & Phone Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your name"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone / WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile number"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  {/* File Upload Zone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Prescription File <span className="text-red-500">*</span> (Max 10MB)
                    </label>

                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${dragActive
                          ? "border-blue-500 bg-blue-50/50"
                          : file
                            ? "border-blue-300 bg-blue-50/30"
                            : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
                        }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {file ? (
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                          <div className="flex items-center gap-3 overflow-hidden text-left">
                            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-slate-800 truncate">
                                {file.name}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFile(null);
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                            <Upload className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-medium text-slate-700">
                            Click to browse or drag & drop prescription
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Supports JPG, PNG, WEBP or PDF (Max 10MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes / Message */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Additional Notes / Requirements <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      name="notes"
                      rows={2}
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Specify medicine names, quantity, or special instructions..."
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold text-sm rounded-xl shadow-lg hover:shadow-blue-900/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading Prescription...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Submit Prescription
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingPrescriptionModal;
