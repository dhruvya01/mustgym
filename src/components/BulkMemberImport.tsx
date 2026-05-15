import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle, X, Download, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, query, collection, where, getDocs, writeBatch } from 'firebase/firestore';
import { toast } from 'sonner';

interface BulkMemberImportProps {
  gymId?: string; // If super admin, they might select it, or if they import, we need gymId
  onSuccess?: () => void;
}

export function BulkMemberImport({ gymId, onSuccess }: BulkMemberImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [inputGymId, setInputGymId] = useState(gymId || '');
  const [successCount, setSuccessCount] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,fullName,phone,membershipPlan,expiryDate,branch\nAyaan Khan,7006000001,Pro,2026-12-01,Main Branch";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "MustGym_Bulk_Members_Template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Only CSV files are supported currently.');
      return;
    }
    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = (e.target?.result as string);
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      if (lines.length < 2) {
        setErrors(['File is empty or missing data rows.']);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const expectedHeaders = ['fullName', 'phone', 'membershipPlan', 'expiryDate', 'branch'];
      
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        setErrors([`Missing required columns: ${missingHeaders.join(', ')}`]);
        return;
      }

      const currentErrors: string[] = [];
      const parsedRecords = [];
      const phones = new Set();

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const record: any = {};
        
        headers.forEach((header, index) => {
          record[header] = values[index];
        });

        if (!record.fullName || !record.phone || !record.membershipPlan || !record.expiryDate || !record.branch) {
          currentErrors.push(`Row ${i + 1}: Missing one or more required fields.`);
          continue;
        }

        if (phones.has(record.phone)) {
          currentErrors.push(`Row ${i + 1}: Duplicate phone number within the file (${record.phone}).`);
          continue;
        }
        
        phones.add(record.phone);
        parsedRecords.push(record);
      }

      setParsedData(parsedRecords);
      setErrors(currentErrors);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!inputGymId) {
      toast.error('Please specify a Gym ID.');
      return;
    }

    if (parsedData.length === 0) {
      toast.error('No valid data to import.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Check gym validity
      const gymRef = doc(db, 'gyms', inputGymId);
      const gymSnap = await getDoc(gymRef);
      if (!gymSnap.exists()) {
        toast.error('Invalid Gym ID.');
        setIsUploading(false);
        return;
      }

      const batch = writeBatch(db);
      let newCount = 0;
      let duplicateCount = 0;

      // Group in batches of 500 (Firestore limit)
      const chunkSize = 400; 
      for (let i = 0; i < parsedData.length; i += chunkSize) {
        const chunk = parsedData.slice(i, i + chunkSize);
        const chunkBatch = writeBatch(db);

        for (const user of chunk) {
          // Check for existing user in members collection by phone + gymId
          // Actually, instead of checking each, we query all existing members for this gym
          // for scale we might need to assume no duplicates or handle query efficiently.
          // Let's generate member object
          
          const memberId = `${inputGymId}-${user.phone.replace(/\D/g, '')}`; 
          const memberRef = doc(db, 'members', memberId);
          
          chunkBatch.set(memberRef, {
            gymId: inputGymId,
            fullName: user.fullName,
            phone: user.phone,
            membershipPlan: user.membershipPlan,
            expiryDate: user.expiryDate,
            branch: user.branch,
            authLinked: false,
            createdAt: new Date().toISOString()
          }, { merge: true });
          
          newCount++;
        }
        
        await chunkBatch.commit();
        setUploadProgress(Math.round(((i + chunk.length) / parsedData.length) * 100));
      }

      toast.success(`Successfully imported ${newCount} members.`);
      setSuccessCount(newCount);
      // Wait for user confirmation
      
    } catch (err: any) {
      toast.error('Import failed: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (successCount > 0) {
    const inviteText = encodeURIComponent(`Welcome to MustGym! Activate your premium member account here: ${window.location.origin}/memberlogin?gym=${inputGymId}`);
    return (
      <div className="bg-surface-container border border-white/5 rounded-2xl p-6 lg:p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-6 animate-pulse">
           <CheckCircle size={40} />
        </div>
        <h3 className="text-3xl font-headline font-black uppercase text-white tracking-tight mb-2 italic">
          Import Successful
        </h3>
        <p className="text-on-surface-variant mb-8 max-w-md">
          {successCount} members have been successfully pre-registered. They can now activate their accounts using their registered phone number.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
           <a 
             href={`https://api.whatsapp.com/send?text=${inviteText}`} 
             target="_blank" 
             rel="noopener noreferrer"
             className="px-6 py-4 rounded-xl bg-[#25D366] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2"
           >
             Share Invite Link on WhatsApp
           </a>
           <button
             onClick={() => {
                setSuccessCount(0);
                setFile(null);
                setParsedData([]);
                if (onSuccess) onSuccess();
             }}
             className="px-6 py-4 rounded-xl border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-colors"
           >
             Close & Refresh
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container border border-white/5 rounded-2xl p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
           <h3 className="text-xl font-headline font-black uppercase text-white tracking-tight flex items-center gap-2">
             <FileSpreadsheet className="text-primary" /> Bulk Members Import
           </h3>
           <p className="text-xs text-on-surface-variant font-medium mt-1">
             Import members via CSV. Accounts will require activation by members.
           </p>
        </div>
        <button 
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 border border-white/10 hover:border-primary text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
        >
          <Download size={14} /> Template
        </button>
      </div>

      {!gymId && (
        <div className="mb-6">
          <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Gym ID (Destination)</label>
          <input 
            type="text" 
            value={inputGymId} 
            onChange={(e) => setInputGymId(e.target.value)} 
            placeholder="e.g. MGYM-12345"
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div 
        className={`relative w-full border-2 border-dashed rounded-2xl p-8 transition-colors flex flex-col items-center justify-center min-h-[200px] ${dragActive ? 'border-primary bg-primary/5' : 'border-white/10 bg-black/10'} ${file ? 'hidden' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleChange}
          className="hidden"
        />
        <UploadCloud size={48} className="text-white/20 mb-4" />
        <p className="text-sm font-bold text-white mb-2 text-center">Drag and drop your CSV file here</p>
        <p className="text-xs text-on-surface-variant mb-6 text-center">We only support .CSV files at the moment</p>
        <button 
          onClick={() => inputRef.current?.click()}
          className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-widest px-6 py-2 rounded-lg transition-colors border border-white/5"
        >
          Browse Files
        </button>
      </div>

      {file && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-black/20 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={24} className="text-primary" />
              <div>
                <p className="text-sm font-bold text-white">{file.name}</p>
                <p className="text-xs text-on-surface-variant">{(file.size / 1024).toFixed(2)} KB • {parsedData.length} valid records</p>
              </div>
            </div>
            <button 
              onClick={() => { setFile(null); setParsedData([]); setErrors([]); }}
              className="text-error hover:bg-error/10 p-2 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {errors.length > 0 && (
            <div className="bg-error/10 border border-error/20 rounded-xl p-4 max-h-[150px] overflow-y-auto">
              <h4 className="flex items-center gap-2 text-xs font-bold text-error uppercase tracking-widest mb-2">
                <AlertCircle size={14} /> Import Warnings ({errors.length})
              </h4>
              <ul className="text-xs text-error/80 space-y-1 ml-6 list-disc">
                {errors.slice(0, 10).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {errors.length > 10 && <li>...and {errors.length - 10} more.</li>}
              </ul>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                <span>Importing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                <motion.div 
                  className="bg-primary h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
             <button
               onClick={() => { setFile(null); setParsedData([]); }}
               disabled={isUploading}
               className="px-6 py-3 rounded-xl border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-colors disabled:opacity-50"
             >
               Cancel
             </button>
             <button
               onClick={handleUpload}
               disabled={isUploading || parsedData.length === 0}
               className="bg-primary text-on-primary-fixed px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary-dim transition-colors flex items-center gap-2 disabled:opacity-50"
             >
               {isUploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />} 
               Import {parsedData.length} Members
             </button>
          </div>

        </div>
      )}
    </div>
  );
}
