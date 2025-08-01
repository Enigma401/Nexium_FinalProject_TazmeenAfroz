'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  FileText, 
  Sparkles, 
  Download, 
  Edit, 
  CheckCircle, 
  ArrowRight,
  Copy,
  RefreshCw
} from 'lucide-react';

interface UserType {
  id: string;
  email?: string;
}

interface ExtractedInfo {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
  };
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    gpa?: string;
  }>;
  skills: string[];
  certifications: string[];
}

export default function CreateResume() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [optimizedResume, setOptimizedResume] = useState('');
  const [latexCode, setLatexCode] = useState('');
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      
      if (!user) {
        router.push('/auth/login');
      }
    };
    getUser();
  }, [supabase.auth, router]);

  const handleExtractInfo = async () => {
    if (!resumeText.trim()) {
      setError('Please enter your resume text');
      return;
    }
    
    setProcessing(true);
    setProgress(25);
    setError('');
    
    try {
      const response = await fetch('/api/extract-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText }),
      });
      
      setProgress(75);
      const result = await response.json();
      
      if (result.success) {
        setExtractedInfo(result.extractedInfo);
        setProgress(100);
        setTimeout(() => {
          setStep(2);
          setProgress(0);
        }, 500);
      } else {
        setError('Failed to extract information: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to extract information. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleOptimizeResume = async () => {
    if (!extractedInfo || !jobDescription.trim()) {
      setError('Please provide a job description');
      return;
    }
    
    setProcessing(true);
    setProgress(25);
    setError('');
    
    try {
      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          extractedInfo, 
          jobDescription
        }),
      });
      
      setProgress(75);
      const result = await response.json();
      
      if (result.success) {
        setOptimizedResume(result.optimizedResume);
        setLatexCode(result.latexCode);
        setProgress(100);
        
        // Store the resume in database
        if (user) {
          await storeResumeInDatabase();
        }
        
        setTimeout(() => {
          setStep(3);
          setProgress(0);
        }, 500);
      } else {
        setError('Failed to optimize resume: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to optimize resume. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRegenerateResume = async () => {
    setOptimizedResume('');
    setLatexCode('');
    await handleOptimizeResume();
  };

  const storeResumeInDatabase = async () => {
    if (!user || !resumeText || !extractedInfo) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/store-resume', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          originalText: resumeText,
          fileName: `Resume_${new Date().toISOString().split('T')[0]}`,
          jobDescription: jobDescription,
          tailoredText: optimizedResume,
          extractedInfo: extractedInfo
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('✅ Resume stored successfully:', result.resumeId);
      } else {
        console.warn('⚠️ Failed to store resume:', result.error);
      }
    } catch (error) {
      console.error('❌ Error storing resume:', error);
    }
  };

  const downloadPDF = async () => {
    if (!optimizedResume.trim()) {
      setError('No resume content available for PDF generation');
      return;
    }

    setError('');
    setIsDownloading(true);
    
    try {
      console.log('🚀 Starting PDF download...');

      // Try client-side PDF generation with jsPDF first
      try {
        console.log('📄 Attempting client-side PDF generation...');
        
        // Dynamic import to avoid SSR issues
        const { jsPDF } = await import('jspdf');
        
        const doc = new jsPDF();
        
        // Set up PDF styling
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        const lineHeight = 6;
        let yPosition = margin;
        
        // Helper function to add text with wrapping
        const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          
          doc.setFontSize(fontSize);
          doc.setFont('helvetica', isBold ? 'bold' : 'normal');
          
          const lines = doc.splitTextToSize(text, pageWidth - (2 * margin));
          lines.forEach((line: string) => {
            if (yPosition > pageHeight - margin) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(line, margin, yPosition);
            yPosition += lineHeight;
          });
          yPosition += 2; // Extra space
        };

        // Add header
        const personalInfo = extractedInfo?.personalInfo;
        if (personalInfo?.name) {
          doc.setFontSize(20);
          doc.setFont('helvetica', 'bold');
          doc.text(personalInfo.name, pageWidth / 2, yPosition, { align: 'center' });
          yPosition += 10;
          
          // Contact info
          const contactInfo = [
            personalInfo.email,
            personalInfo.phone,
            personalInfo.location
          ].filter(Boolean).join(' • ');
          
          if (contactInfo) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(contactInfo, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 15;
          }
        }

        // Process resume content
        const sections = optimizedResume.split(/\n\s*\n/);
        
        sections.forEach(section => {
          const lines = section.trim().split('\n');
          if (lines.length === 0) return;
          
          const firstLine = lines[0].trim();
          
          // Check if it's a section header
          if (firstLine.match(/^(PROFESSIONAL SUMMARY|EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS|PROJECTS|SUMMARY)/i) ||
              firstLine === firstLine.toUpperCase()) {
            
            // Add section title
            addText(firstLine, 12, true);
            
            // Add section content
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (line) {
                if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
                  addText(`• ${line.substring(1).trim()}`, 10, false);
                } else {
                  addText(line, 10, false);
                }
              }
            }
            yPosition += 5; // Extra space between sections
          }
        });

        // Generate and download PDF
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${personalInfo?.name?.replace(/\s+/g, '_') || 'resume'}_optimized.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('✅ PDF generated and downloaded successfully with jsPDF');
        setError('✅ PDF downloaded successfully!');
        return;
        
      } catch (jsPdfError) {
        console.log('❌ jsPDF failed, trying server method:', jsPdfError);
      }

      // Fallback to server-side HTML generation
      console.log('🔄 Trying server-side PDF generation...');
      
      const directResponse = await fetch('/api/generate-pdf-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          optimizedResume,
          personalInfo: extractedInfo?.personalInfo 
        }),
      });
      
      const directResult = await directResponse.json();
      console.log('Direct PDF result:', directResult);
      
      if (directResult.success && directResult.htmlContent) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(directResult.htmlContent);
          printWindow.document.close();
          
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
          
          setError('✅ Print dialog opened. Please select "Save as PDF" to download your resume.');
          return;
        } else {
          setError('⚠️ Pop-up blocked. Please allow pop-ups and try again.');
          return;
        }
      }

      // Final fallback to LaTeX method
      if (!latexCode) {
        setError('No LaTeX code available. Please regenerate the resume.');
        return;
      }

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latexCode }),
      });
      
      const result = await response.json();
      console.log('LaTeX PDF result:', result);
      
      if (result.success && result.pdfData) {
        const binaryString = atob(result.pdfData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || 'resume.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else if (result.success && result.latexCode) {
        setError(
          `${result.message}\n\nInstructions:\n${result.instructions?.join('\n') || ''}\n\nOnline editors: ${result.onlineEditors?.join(', ') || ''}`
        );
        
        const blob = new Blob([result.latexCode], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || 'resume.tex';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        setError(`PDF generation failed: ${result.error || result.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError(`Network error: ${err instanceof Error ? err.message : 'Failed to connect to PDF service'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadLatex = () => {
    if (!latexCode) {
      setError('No LaTeX code available');
      return;
    }

    const blob = new Blob([latexCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.tex';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-2 text-emerald-400">
          <Sparkles className="w-6 h-6 animate-spin" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-emerald-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-emerald-400">Create Resume</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-emerald-300">
                <User className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="border-emerald-700 text-emerald-300 hover:bg-emerald-800 hover:text-white"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-gray-900/50 border-b border-emerald-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-emerald-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-emerald-600' : 'bg-gray-600'}`}>
                1
              </div>
              <span>Input Resume</span>
            </div>
            <ArrowRight className="text-gray-500" />
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-emerald-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-emerald-600' : 'bg-gray-600'}`}>
                2
              </div>
              <span>Verify Info</span>
            </div>
            <ArrowRight className="text-gray-500" />
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-emerald-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-emerald-600' : 'bg-gray-600'}`}>
                3
              </div>
              <span>Generate Resume</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Step 1: Input Resume Text */}
        {step === 1 && (
          <Card className="bg-gray-900 border-emerald-800">
            <CardHeader>
              <CardTitle className="text-emerald-400 flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Step 1: Input Your Resume</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Paste your existing resume text below. Our AI will extract and organize the information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-emerald-300">Resume Text</Label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume text here...

Example:
John Smith
Email: john.smith@email.com
Phone: (555) 123-4567
Location: New York, NY

PROFESSIONAL SUMMARY
Experienced software developer with 5+ years in full-stack development...

EXPERIENCE
Senior Software Developer | Tech Corp | 2020-2023
- Developed and maintained web applications using React and Node.js
- Led a team of 3 developers on key projects

EDUCATION
Bachelor of Science in Computer Science | University of Tech | 2019
GPA: 3.8

SKILLS
JavaScript, React, Node.js, Python, SQL, AWS"
                  className="w-full h-64 mt-2 p-4 bg-gray-800 border border-emerald-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>
              
              {error && (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                  <p className="text-red-400">{error}</p>
                </div>
              )}
              
              {processing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-emerald-300">
                    <span>Extracting information...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="bg-gray-700" />
                </div>
              )}
              
              <Button
                onClick={handleExtractInfo}
                disabled={!resumeText.trim() || processing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3"
              >
                {processing ? (
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Extract Information
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Verify Extracted Information */}
        {step === 2 && extractedInfo && (
          <div className="space-y-6">
            <Card className="bg-gray-900 border-emerald-800">
              <CardHeader>
                <CardTitle className="text-emerald-400 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Step 2: Verify Extracted Information</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Review and edit the extracted information. Add a job description for better optimization.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Info */}
                <div>
                  <h3 className="text-lg font-semibold text-emerald-400 mb-3">Personal Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-emerald-300">Name</Label>
                      <Input
                        value={extractedInfo.personalInfo.name}
                        onChange={(e) => setExtractedInfo({
                          ...extractedInfo,
                          personalInfo: { ...extractedInfo.personalInfo, name: e.target.value }
                        })}
                        className="bg-gray-800 border-emerald-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-emerald-300">Email</Label>
                      <Input
                        value={extractedInfo.personalInfo.email}
                        onChange={(e) => setExtractedInfo({
                          ...extractedInfo,
                          personalInfo: { ...extractedInfo.personalInfo, email: e.target.value }
                        })}
                        className="bg-gray-800 border-emerald-700 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                <div>
                  <Label className="text-emerald-300">Job Description (for optimization)</Label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description you're applying for..."
                    className="w-full h-32 mt-2 p-4 bg-gray-800 border border-emerald-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                    <p className="text-red-400">{error}</p>
                  </div>
                )}

                {processing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-emerald-300">
                      <span>Optimizing resume...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="bg-gray-700" />
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="border-emerald-700 text-emerald-300 hover:bg-emerald-800 hover:text-white"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleOptimizeResume}
                    disabled={!jobDescription.trim() || processing}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {processing ? (
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate ATS-Friendly Resume
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Generated Resume */}
        {step === 3 && (
          <div className="space-y-6">
            <Card className="bg-gray-900 border-emerald-800">
              <CardHeader>
                <CardTitle className="text-emerald-400 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Step 3: Your Optimized Resume</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Here&apos;s your ATS-friendly resume and LaTeX code. You can edit and download.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                    <p className="text-red-400">{error}</p>
                  </div>
                )}

                {processing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-emerald-300">
                      <span>Regenerating resume...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="bg-gray-700" />
                  </div>
                )}

                {/* Optimized Resume */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-emerald-300">Optimized Resume</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(optimizedResume)}
                      className="border-emerald-700 text-emerald-300 hover:bg-emerald-800 hover:text-white"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <textarea
                    value={optimizedResume}
                    onChange={(e) => setOptimizedResume(e.target.value)}
                    className="w-full h-64 p-4 bg-gray-800 border border-emerald-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* LaTeX Code */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-emerald-300">LaTeX Code</Label>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(latexCode)}
                        className="border-emerald-700 text-emerald-300 hover:bg-emerald-800 hover:text-white"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadLatex}
                        className="border-emerald-700 text-emerald-300 hover:bg-emerald-800 hover:text-white"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        .tex
                      </Button>
                    </div>
                  </div>
                  <textarea
                    value={latexCode}
                    onChange={(e) => setLatexCode(e.target.value)}
                    className="w-full h-32 p-4 bg-gray-800 border border-emerald-700 rounded-lg text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* PDF Generation Notice */}
                <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-blue-400 font-medium">PDF Generation</p>
                      <p className="text-blue-300 text-sm mt-1">
                        Click &quot;Download PDF&quot; to open a print-friendly version. 
                        In the print dialog, select &quot;Save as PDF&quot; to download your resume.
                        {typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') && (
                          <span> Alternatively, you can compile the LaTeX code using <a href="https://www.overleaf.com" target="_blank" rel="noopener noreferrer" 
                          className="underline hover:text-blue-200">Overleaf.com</a> for professional formatting.</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="border-emerald-700 text-emerald-300 hover:bg-emerald-800 hover:text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Info
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRegenerateResume}
                    disabled={processing}
                    className="border-emerald-700 text-emerald-300 hover:bg-emerald-800 hover:text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button
                    onClick={downloadPDF}
                    disabled={isDownloading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isDownloading ? 'Generating PDF...' : 'Download PDF'}
                  </Button>
                  
                  {/* Debug button for testing */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      console.log('Debug info:');
                      console.log('optimizedResume:', optimizedResume.substring(0, 100) + '...');
                      console.log('extractedInfo:', extractedInfo);
                      console.log('latexCode available:', !!latexCode);
                    }}
                    className="border-yellow-700 text-yellow-300 hover:bg-yellow-800 hover:text-white text-xs"
                  >
                    Debug
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
