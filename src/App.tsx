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
    } catch (error) {
      console.error('Error sending document:', error);
      toast.error(error.message || 'Failed to send document. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}>
      <ToastContainer
        position="top-right"
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
      
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src="https://dochelper.xyz/img/Logo.gif" 
                alt="DocHelper Logo"
                className="w-8 h-8 object-contain"
              />
              <h1 className="ml-3 text-2xl font-bold text-gray-900 dark:text-white">
                DocHelper Signing
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {!isAuthLoading && (
                user ? (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={handleSignIn}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </button>
                )
              )}
              <button
                onClick={() => setShowRecipients(!showRecipients)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                aria-label="Toggle recipients"
              >
                <Users className="w-5 h-5" />
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
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
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Load Document</h2>
              {!selectedFile ? (
                <DocumentUpload onFileSelect={handleFileSelect} />
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-md">
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                      Selected file: {selectedFile.name}
                    </p>
                  </div>
                  {showRecipients && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
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
                          className="mt-4 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {isSending ? 'Sending...' : 'Send to Recipients'}
                        </button>
                      )}
                    </div>
                  )}
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
              )}
            </div>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add Signature</h2>
                <SignaturePad onSave={handleSignatureSave} />
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add Stamp</h2>
                <StampUpload onSave={handleStampSave} />
              </div>

              {(signatures.length > 0 || stamps.length > 0) && (
                <div className="space-y-4">
                  {signatures.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
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
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
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
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          placeholder="Enter filename for the signed PDF"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateSignedPDF}
                      disabled={isGenerating}
                      className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
            <div className="lg:sticky lg:top-8">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Document Signing</h2>
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
          )}
        </div>
      </main>
    </div>
  );
}

export default App;