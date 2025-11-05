import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SumeruLogo from "../assets/sumeru-logo.png";
import { updateModuleProgress, completeModule, getTaskProgress } from "../utils/moduleProgress";
import { getApiUrl } from "../utils/apiConfig";

export default function PersonalDetails() {
  const navigate = useNavigate();
  const { token } = useParams();
  const API_URL = getApiUrl();
  const [isSaved, setIsSaved] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    dob: "",
    mobile: "",
    sex: "",
    email: "",
    family: [
      { name: "", relation: "", mobile: "" },
      { name: "", relation: "", mobile: "" },
    ],
    aadhar: "",
    pan: "",
    bank: "",
    ifsc: "",
    declaration: false,
  });

  const [moduleProgress, setModuleProgress] = useState({});

  const [files, setFiles] = useState({
    aadhaarFile: null,
    panFile: null,
    bankFile: null,
    ndaFile: null,
  });

  useEffect(() => {
    fetch(`${API_URL}/employees/by-token/${token}`)
      .then((res) => res.json())
      .then((data) => {
        setFormData((prev) => ({
          ...prev,
          name: data.name,
          email: data.email,
          role: data.role,
        }));
      })
      .catch((err) => console.error("Failed to fetch employee info:", err));
  }, [token, API_URL]);

  useEffect(() => {
    fetch(`${API_URL}/employees/by-token/${token}/personal-info`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.name) {
          setFormData((prev) => ({
            ...prev,
            dob: data.dob || "",
            mobile: data.mobile || "",
            sex: data.gender || "",
            aadhar: data.aadhaar_number || "",
            pan: data.pan_number || "",
            bank: data.bank_number || "",
            ifsc: data.ifsc_code || "",
            declaration: true,
            family: [
              {
                name: data.family1_name || "",
                relation: data.family1_relation || "",
                mobile: data.family1_mobile || "",
              },
              {
                name: data.family2_name || "",
                relation: data.family2_relation || "",
                mobile: data.family2_mobile || "",
              },
            ],
          }));
          setIsSaved(true);
        }
      })
      .catch((err) => console.error("Failed to fetch personal info:", err));
  }, [token]);

  // Fetch module progress on load
  useEffect(() => {
    const fetchProgress = async () => {
      if (token) {
        const progress = await getTaskProgress(token, "Personal Details");
        if (progress) {
          const progressMap = {};
          progress.modules.forEach((module) => {
            progressMap[module.module_key] = module;
          });
          setModuleProgress(progressMap);
        }
      }
    };
    fetchProgress();
  }, [token]);

  useEffect(() => {
    const requiredFields = [
      formData.name,
      formData.role,
      formData.dob,
      formData.mobile,
      formData.sex,
      formData.email,
      formData.aadhar,
      formData.pan,
      formData.bank,
      formData.ifsc,
      formData.declaration,
      formData.family[0]?.name,
      formData.family[0]?.relation,
      formData.family[0]?.mobile,
      formData.family[1]?.name,
      formData.family[1]?.relation,
      formData.family[1]?.mobile,
    ];

    const requiredFiles = [
      files.aadhaarFile,
      files.panFile,
      files.bankFile,
      files.ndaFile,
    ];

    const filledFields = requiredFields.filter(Boolean).length;
    const uploadedFiles = requiredFiles.filter(Boolean).length;
    const total = requiredFields.length + requiredFiles.length;
    const percent = Math.min(100, Math.round(((filledFields + uploadedFiles) / total) * 100));
    setProgressPercent(percent);

    // Track module progress
    if (token) {
      // Basic Info Module - completed when all basic fields are filled
      if (formData.name && formData.dob && formData.mobile && formData.sex && formData.email && formData.role) {
        if (!moduleProgress.basic_info || moduleProgress.basic_info.status !== "completed") {
          completeModule(token, "Personal Details", "basic_info");
        }
      }

      // Family Info Module - completed when both family members are filled
      if (formData.family[0]?.name && formData.family[0]?.relation && formData.family[0]?.mobile &&
          formData.family[1]?.name && formData.family[1]?.relation && formData.family[1]?.mobile) {
        if (!moduleProgress.family_info || moduleProgress.family_info.status !== "completed") {
          completeModule(token, "Personal Details", "family_info");
        }
      }

      // Aadhaar Module - completed when number and file are provided
      if (formData.aadhar && files.aadhaarFile) {
        if (!moduleProgress.aadhaar || moduleProgress.aadhaar.status !== "completed") {
          completeModule(token, "Personal Details", "aadhaar");
        }
      }

      // PAN Module - completed when number and file are provided
      if (formData.pan && files.panFile) {
        if (!moduleProgress.pan || moduleProgress.pan.status !== "completed") {
          completeModule(token, "Personal Details", "pan");
        }
      }

      // Bank Details Module - completed when bank details and file are provided
      if (formData.bank && formData.ifsc && files.bankFile) {
        if (!moduleProgress.bank_details || moduleProgress.bank_details.status !== "completed") {
          completeModule(token, "Personal Details", "bank_details");
        }
      }

      // NDA Module - completed when file is uploaded
      if (files.ndaFile) {
        if (!moduleProgress.nda || moduleProgress.nda.status !== "completed") {
          completeModule(token, "Personal Details", "nda");
        }
      }

      // Declaration Module - completed when checkbox is checked
      if (formData.declaration) {
        if (!moduleProgress.declaration || moduleProgress.declaration.status !== "completed") {
          completeModule(token, "Personal Details", "declaration");
        }
      }
    }
  }, [formData, files, token, moduleProgress]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Allow editing for Aadhaar and PAN without validation
    if (name === "aadhar") {
      const cleanedValue = value.replace(/\s/g, '');
      setFormData((prev) => ({
        ...prev,
        [name]: cleanedValue,
      }));
      return;
    }
    
    if (name === "pan") {
      const cleanedValue = value.replace(/\s/g, '').toUpperCase();
      setFormData((prev) => ({
        ...prev,
        [name]: cleanedValue,
      }));
      return;
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Validate on blur (when user finishes editing)
    if (name === "aadhar") {
      const cleanedValue = value.replace(/\s/g, '');
      if (cleanedValue && !/^\d{12}$/.test(cleanedValue)) {
        alert("❌ Aadhaar number must be exactly 12 digits");
      }
      return;
    }
    
    if (name === "pan") {
      const cleanedValue = value.replace(/\s/g, '').toUpperCase();
      if (cleanedValue && !/^[A-Z]{5}\d{4}[A-Z]$/.test(cleanedValue)) {
        alert("❌ PAN number must be in format XXXXX1234X (5 letters, 4 digits, 1 letter)");
      }
      return;
    }
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    const file = selectedFiles[0];
    
    // Validate PDF only
    if (file && !file.name.toLowerCase().endsWith('.pdf')) {
      alert(`❌ Only PDF files are allowed for ${name.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      e.target.value = ''; // Clear the input
      return;
    }
    
    setFiles((prev) => ({
      ...prev,
      [name]: file,
    }));
  };

  const handleFamilyChange = (index, field, value) => {
    const updatedFamily = [...formData.family];
    updatedFamily[index][field] = value;
    setFormData((prev) => ({ ...prev, family: updatedFamily }));
  };

  const isFormValid = () => {
    const fields = [
      formData.name,
      formData.role,
      formData.dob,
      formData.mobile,
      formData.sex,
      formData.email,
      formData.aadhar,
      formData.pan,
      formData.bank,
      formData.ifsc,
      formData.declaration,
      formData.family[0]?.name,
      formData.family[0]?.relation,
      formData.family[0]?.mobile,
      formData.family[1]?.name,
      formData.family[1]?.relation,
      formData.family[1]?.mobile,
    ];
    const docs = [
      files.aadhaarFile,
      files.panFile,
      files.bankFile,
      files.ndaFile,
    ];
    return fields.every(Boolean) && docs.every(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      alert("Please fill all required fields and upload all documents.");
      return;
    }

    const form = new FormData();
    form.append("name", formData.name);
    form.append("email", formData.email);
    form.append("role", formData.role);
    form.append("dob", formData.dob);
    form.append("gender", formData.sex);
    form.append("mobile", formData.mobile);
    form.append("family1_name", formData.family[0].name);
    form.append("family1_relation", formData.family[0].relation);
    form.append("family1_mobile", formData.family[0].mobile);
    form.append("family2_name", formData.family[1].name);
    form.append("family2_relation", formData.family[1].relation);
    form.append("family2_mobile", formData.family[1].mobile);
    form.append("aadhaar_number", formData.aadhar);
    form.append("pan_number", formData.pan);
    form.append("bank_number", formData.bank);
    form.append("ifsc_code", formData.ifsc);
    form.append("aadhaar_file", files.aadhaarFile);
    form.append("pan_file", files.panFile);
    form.append("bank_file", files.bankFile);
    form.append("nda_file", files.ndaFile);

    try {
      const res = await fetch(`${API_URL}/employees/by-token/${token}/personal-info`, {
        method: "POST",
        body: form,
      });
      if (res.ok) {
        alert("✅ Details saved successfully!");
        setIsSaved(true);
        // Refresh module progress after save
        const progress = await getTaskProgress(token, "Personal Details");
        if (progress) {
          const progressMap = {};
          progress.modules.forEach((module) => {
            progressMap[module.module_key] = module;
          });
          setModuleProgress(progressMap);
        }
      } else alert("❌ Failed to save details.");
    } catch (err) {
      console.error(err);
      alert("❌ Error connecting to backend.");
    }
  };

  const inputClass =
  "bg-white border-2 border-blue-500 shadow-md p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-200";

  return (
    <div className="min-h-screen w-full bg-[#D0DEEB] text-gray-800">
      {/* 🔷 Header Bar */}
      <div className="bg-blue-950 text-white px-10 py-6 flex flex-col lg:flex-row items-center lg:justify-between shadow-md fixed top-0 left-0 w-full z-50">
        <div className="flex items-center space-x-3">
          <img src={SumeruLogo} alt="Sumeru Logo" className="w-[300px]" />
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
          <h1 className="text-2xl font-bold text-white">👋Welcome to Personal Details</h1>
          <p className="text-blue-200 font-medium text-sm tracking-wide mt-1">
            Let's get you started on your journey with us!
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="bg-white text-blue-800 px-4 py-2 rounded hover:bg-gray-100 transition"
            onClick={() => navigate(`/dashboard/${token}`)}
          >
            Home
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 pt-36 pb-10 text-gray-800">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <div className="w-full bg-gray-200 rounded-full h-3 mb-8">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Personal Info */}
            <section>
              <h2 className="text-xl font-semibold text-blue-800 mb-4">🧍 Personal Info</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="name" value={formData.name} readOnly className={inputClass} />
                <input name="dob" value={formData.dob} onChange={handleChange} type="date" className={inputClass} />
                <input name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Mobile No." className={inputClass} />
                <select name="sex" value={formData.sex} onChange={handleChange} className={inputClass}>
                  <option value="">Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <input name="email" value={formData.email} readOnly type="email" className={inputClass} />
                <input name="role" value={formData.role} readOnly className={inputClass} />
              </div>
            </section>

            {/* Family Details */}
            <section>
              <h2 className="text-xl font-semibold text-blue-800 mb-4">👨‍👩‍👧 Family Details</h2>
              {formData.family.map((member, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <input value={member.name} onChange={(e) => handleFamilyChange(index, "name", e.target.value)} placeholder="Name" className={inputClass} />
                  <select value={member.relation} onChange={(e) => handleFamilyChange(index, "relation", e.target.value)} className={inputClass}>
                    <option value="">Relation</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                  </select>
                  <input value={member.mobile} onChange={(e) => handleFamilyChange(index, "mobile", e.target.value)} placeholder="Mobile No." className={inputClass} />
                </div>
              ))}
            </section>

            {/* Document Details */}
            <section>
              <h2 className="text-xl font-semibold text-blue-800 mb-4">📄 Document Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="aadhar" value={formData.aadhar} onChange={handleChange} onBlur={handleBlur} placeholder="Aadhaar No. (12 digits)" maxLength={12} className={inputClass} />
                <input type="file" name="aadhaarFile" onChange={handleFileChange} accept=".pdf" className={inputClass} />
                <input name="pan" value={formData.pan} onChange={handleChange} onBlur={handleBlur} placeholder="PAN No. (XXXXX1234X)" maxLength={10} className={inputClass} />
                <input type="file" name="panFile" onChange={handleFileChange} accept=".pdf" className={inputClass} />
                <input name="bank" value={formData.bank} onChange={handleChange} placeholder="Bank Account No." className={inputClass} />
                <input type="file" name="bankFile" onChange={handleFileChange} accept=".pdf" className={inputClass} />
                <input name="ifsc" value={formData.ifsc} onChange={handleChange} placeholder="IFSC Code" className={inputClass} />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-blue-800 mb-1">Upload NDA Form</label>
                <input type="file" name="ndaFile" onChange={handleFileChange} accept=".pdf" className={`${inputClass} w-full`} />
                <small className="text-blue-500">Accepted formats: PDF only</small>
              </div>
            </section>

            {/* Declaration */}
            <section className="mt-6">
              <div className="flex items-center space-x-2">
                <input type="checkbox" name="declaration" checked={formData.declaration} onChange={handleChange} />
                <label className="text-sm text-blue-800">
                  I hereby declare that the above information is true to the best of my knowledge.
                </label>
              </div>
            </section>

            {/* Buttons */}
            <div className="mt-8 flex justify-between items-center gap-4">
              <button
                type="button"
                onClick={() => navigate(`/dashboard/${token}`)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                ⬅ Previous
              </button>
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                💾 Save
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isSaved) {
                    alert("Please save your details before proceeding.");
                    return;
                  }
                  navigate(`/joining-day/${token}`, {
                    state: { personalDetails: formData },
                  });
                }}
                disabled={!isSaved}
                className={`px-6 py-2 rounded transition-all duration-300 ${
                  isSaved
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-400 text-gray-300 cursor-not-allowed"
                }`}
              >
                Next ➡
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
