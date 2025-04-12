import React, { useState, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DocumentUpload from './components/DocumentUpload';
import DocumentViewer from './components/DocumentViewer';
import SignaturePad from './components/SignaturePad';
import TimestampEditor from './components/TimestampEditor';
import StampUpload from './components/StampUpload';
import RecipientsList, { Recipient } from './components/RecipientsList';
import { Download, Moon, Sun, Users, Send, LogIn, LogOut } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

interface SignatureInstance {
  id: string;
  dataUrl: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  page: number;
  timestamp: Date;
  timestampPosition: { x: number; y: number };
  timestampSize: number;
  showTimestamp: boolean;
}

interface StampInstance {
  id: string;
  dataUrl: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  page: number;
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [signatures, setSignatures] = useState<SignatureInstance[]>([]);
  const [stamps, setStamps] = useState<StampInstance[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [customFilename, setCustomFilename] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [showRecipients, setShowRecipients] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setCustomFilename(file.name.replace('.pdf', '_signed.pdf'));
  };

  const handleAddRecipient = (email: string) => {
    const newRecipient: Recipient = {
      id: `recipient-${Date.now()}`,
      email,
      status: 'pending'
    };
    setRecipients(prev => [...prev, newRecipient]);
  };

  const handleRemoveRecipient = (id: string) => {
    setRecipients(prev => prev.filter(r => r.id !== id));
  };

  const handleSignatureSave = (signatureData: string) => {
    const newSignature: SignatureInstance = {
      id: `sig-${Date.now()}`,
      dataUrl: signatureData,
      position: { x: 50, y: 50 },
      size: { width: 200, height: 100 },
      page: currentPage,
      timestamp: new Date(),
      timestampPosition: { x: 50, y: 60 },
      timestampSize: 10,
      showTimestamp: true
    };
    setSignatures(prev => [...prev, newSignature]);
  };

  const handleStampSave = (stampData: string) => {
    const newStamp: StampInstance = {
      id: `stamp-${Date.now()}`,
      dataUrl: stampData,
      position: { x: 50, y: 50 },
      size: { width: 100, height: 100 },
      page: currentPage
    };
    setStamps(prev => [...prev, newStamp]);
  };

  const handleSignaturePositionChange = (id: string, position: { x: number; y: number }) => {
    setSignatures(prev => prev.map(sig => 
      sig.id === id ? { ...sig, position } : sig
    ));
  };

  const handleSignatureSizeChange = (id: string, size: { width: number; height: number }) => {
    setSignatures(prev => prev.map(sig =>
      sig.id === id ? { ...sig, size } : sig
    ));
  };

  const handleStampPositionChange = (id: string, position: { x: number; y: number }) => {
    setStamps(prev => prev.map(stamp => 
      stamp.id === id ? { ...stamp, position } : stamp
    ));
  };

  const handleStampSizeChange = (id: string, size: { width: number; height: number }) => {
    setStamps(prev => prev.map(stamp =>
      stamp.id === id ? { ...stamp, size } : stamp
    ));
  };

  const handleTimestampPositionChange = (id: string, position: { x: number; y: number }) => {
    setSignatures(prev => prev.map(sig => 
      sig.id === id ? { ...sig, timestampPosition: position } : sig
    ));
  };

  const handleTimestampSizeChange = (id: string, size: number) => {
    setSignatures(prev => prev.map(sig =>
      sig.id === id ? { ...sig, timestampSize: size } : sig
    ));
  };

  const handleTimestampUpdate = (id: string, timestamp: Date, showTimestamp: boolean) => {
    setSignatures(prev => prev.map(sig =>
      sig.id === id ? { ...sig, timestamp, showTimestamp } : sig
    ));
  };

  const handleRemoveSignature = (id: string) => {
    setSignatures(prev => prev.filter(sig => sig.id !== id));
  };

  const handleRemoveStamp = (id: string) => {
    setStamps(prev => prev.filter(stamp => stamp.id !== id));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const convertToPng = async (dataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
  };

  const generateSignedPDF = async (): Promise<Uint8Array> => {
    if (!selectedFile) throw new Error('No file selected');

    const existingPdfBytes = await selectedFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(existingPdfBytes, { 
      ignoreEncryption: true
    });
    
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const elementsByPage = new Map<number, Array<SignatureInstance | StampInstance>>();
    
    signatures.forEach(sig => {
      if (!elementsByPage.has(sig.page)) {
        elementsByPage.set(sig.page, []);
      }
      elementsByPage.get(sig.page)?.push(sig);
    });

    stamps.forEach(stamp => {
      if (!elementsByPage.has(stamp.page)) {
        elementsByPage.set(stamp.page, []);
      }
      elementsByPage.get(stamp.page)?.push(stamp);
    });

    for (const [pageNum, elements] of elementsByPage.entries()) {
      const page = pages[pageNum - 1];
      const { width, height } = page.getSize();

      for (const element of elements) {
        const isSignature = 'timestamp' in element;
        
        try {
          const pngDataUrl = await convertToPng(element.dataUrl);
          const imageData = pngDataUrl.split(',')[1];
          const imageBytes = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
          const imageEmbed = await pdfDoc.embedPng(imageBytes);
          
          const xPos = (element.position.x / 100) * width;
          const yPos = height - ((element.position.y / 100) * height) - element.size.height;

          page.drawImage(imageEmbed, {
            x: xPos,
            y: yPos,
            width: element.size.width,
            height: element.size.height,
          });

          if (isSignature) {
            const signature = element as SignatureInstance;
            if (signature.showTimestamp) {
              const timestampText = `Signed on: ${formatTimestamp(signature.timestamp)}`;
              const timestampX = (signature.timestampPosition.x / 100) * width;
              const timestampY = height - ((signature.timestampPosition.y / 100) * height);
              
              page.drawText(timestampText, {
                x: timestampX,
                y: timestampY,
                size: signature.timestampSize,
                font: font,
                color: rgb(0.1, 0.1, 0.1),
              });
            }
          }
        } catch (error) {
          console.error('Error processing image:', error);
          throw new Error('Failed to process image for PDF generation');
        }
      }
    }

    return await pdfDoc.save();
  };

  const handleGenerateSignedPDF = async () => {
    if (!selectedFile || (signatures.length === 0 && stamps.length === 0)) return;

    try {
      setIsGenerating(true);
      const pdfBytes = await generateSignedPDF();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = customFilename.endsWith('.pdf') ? customFilename : `${customFilename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating signed PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToRecipients = async () => {
    if (!user) {
      toast.error('Please sign in to send documents');
      return;
    }

    if (!selectedFile || recipients.length === 0) {
      toast.error('Please add recipients before sending the document.');
      return;
    }

    if (signatures.length === 0 && stamps.length === 0) {
      toast.error('Please add at least one signature or stamp before sending.');
      return;
    }

    try {
      setIsSending(true);

      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Please sign in to send documents');
      }

      const pdfBytes = await generateSignedPDF();
      
      // Convert PDF bytes to base64
      const pdfBase64 = btoa(
        new Uint8Array(pdfBytes).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const response = await fetch(`${supabaseUrl}/functions/v1/send-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentName: customFilename,
          pdfContent: `data:application/pdf;base64,${pdfBase64}`,
          recipients: recipients.map(r => ({ email: r.email })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send document');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to send document');
      }

      // Update recipients status
      setRecipients(prev => prev.map(r => ({ ...r, status: 'pending' })));
      toast.success('Document sent successfully to all recipients!');
    } catch (error: unknown) {
      console.error('Error sending document:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to send document. Please try again.'
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200`}>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? 'dark' : 'light'}
      />
      
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <img 
                  src="https://dochelper.xyz/img/Logo.gif" 
                  alt="DocHelper Logo"
                  className="w-10 h-10 object-contain rounded-lg"
                />
                <h1 className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300 bg-clip-text text-transparent">
                  DocHelper Signing
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!isAuthLoading && (
                user ? (
                  <button
                    onClick={handleSignOut}
                    className="btn-secondary"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={handleSignIn}
                    className="btn-primary"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </button>
                )
              )}
              <button
                onClick={() => setShowRecipients(!showRecipients)}
                className="btn-secondary !p-2"
                aria-label="Toggle recipients"
              >
                <Users className="w-5 h-5" />
              </button>
              <button
                onClick={toggleDarkMode}
                className="btn-secondary !p-2"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Load Document
              </h2>
              {!selectedFile ? (
                <DocumentUpload onFileSelect={handleFileSelect} />
              ) : (
                <div className="space-y-4 animate-slide-in">
                  <div className="card p-4 border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/50">
                    <p className="text-sm text-blue-700 dark:text-blue-200 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {selectedFile.name}
                    </p>
                  </div>
                  {showRecipients && (
                    <div className="card p-6 animate-slide-in">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-500" />
                        Co-signers
                      </h3>
                      <RecipientsList
                        recipients={recipients}
                        onAddRecipient={handleAddRecipient}
                        onRemoveRecipient={handleRemoveRecipient}
                      />
                      {recipients.length > 0 && (
                        <button
                          onClick={handleSendToRecipients}
                          disabled={isSending}
                          className="btn-primary mt-4 w-full"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {isSending ? 'Sending...' : 'Send to Recipients'}
                        </button>
                      )}
                    </div>
                  )}
                  <div className="card p-4">
                    <DocumentViewer 
                      file={selectedFile} 
                      signatures={signatures.filter(sig => sig.page === currentPage)}
                      stamps={stamps.filter(stamp => stamp.page === currentPage)}
                      onPageChange={handlePageChange}
                      onSignaturePositionChange={handleSignaturePositionChange}
                      onSignatureSizeChange={handleSignatureSizeChange}
                      onStampPositionChange={handleStampPositionChange}
                      onStampSizeChange={handleStampSizeChange}
                      onTimestampPositionChange={handleTimestampPositionChange}
                      onTimestampSizeChange={handleTimestampSizeChange}
                      onRemoveSignature={handleRemoveSignature}
                      onRemoveStamp={handleRemoveStamp}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-6 animate-fade-in">
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Add Signature
                </h2>
                <SignaturePad onSave={handleSignatureSave} />
              </div>

              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Add Stamp
                </h2>
                <StampUpload onSave={handleStampSave} />
              </div>

              {(signatures.length > 0 || stamps.length > 0) && (
                <div className="space-y-4 animate-slide-in">
                  {signatures.length > 0 && (
                    <div className="card p-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Signatures and Timestamps
                      </h3>
                      <div className="space-y-4">
                        {signatures.map(signature => (
                          <TimestampEditor
                            key={signature.id}
                            signature={signature}
                            onUpdate={(timestamp, showTimestamp) => 
                              handleTimestampUpdate(signature.id, timestamp, showTimestamp)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="card p-6 space-y-4">
                    <div>
                      <label htmlFor="filename" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Export Filename
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="filename"
                          value={customFilename}
                          onChange={(e) => setCustomFilename(e.target.value)}
                          className="input"
                          placeholder="Enter filename for the signed PDF"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateSignedPDF}
                      disabled={isGenerating}
                      className="btn-success w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isGenerating ? 'Generating Signed PDF...' : 'Generate Signed PDF'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedFile && (
            <div className="lg:sticky lg:top-24 animate-fade-in">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Document Preview
              </h2>
              <div className="card p-4">
                <DocumentViewer 
                  file={selectedFile} 
                  signatures={signatures.filter(sig => sig.page === currentPage)}
                  stamps={stamps.filter(stamp => stamp.page === currentPage)}
                  onPageChange={handlePageChange}
                  onSignaturePositionChange={handleSignaturePositionChange}
                  onSignatureSizeChange={handleSignatureSizeChange}
                  onStampPositionChange={handleStampPositionChange}
                  onStampSizeChange={handleStampSizeChange}
                  onTimestampPositionChange={handleTimestampPositionChange}
                  onTimestampSizeChange={handleTimestampSizeChange}
                  onRemoveSignature={handleRemoveSignature}
                  onRemoveStamp={handleRemoveStamp}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;