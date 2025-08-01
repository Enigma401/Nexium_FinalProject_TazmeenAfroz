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
import jsPDF from 'jspdf';

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
    if (!extractedInfo) {
      setError('No resume information available for PDF generation');
      return;
    }

    setError('');
    setIsDownloading(true);

    try {
      console.log('🚀 Creating professional PDF with jsPDF...');
      console.log('📊 ExtractedInfo:', extractedInfo);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      let yPosition = margin;

      // Professional color scheme
      const primaryColor = [6, 78, 59]; // Dark green
      const accentColor = [16, 185, 129]; // Emerald
      const textColor = [0, 0, 0]; // Black
      const lightGray = [128, 128, 128]; // Gray for dates/details

      // Helper: Check for page break
      const checkPageBreak = (additionalHeight = 10) => {
        if (yPosition + additionalHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Helper: Add section header with highlighting
      const addSectionHeader = (title: string) => {
        checkPageBreak(20);
        yPosition += 8;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255); // White text
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]); // Dark green background
        doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, 'F'); // Background rectangle
        doc.text(title.toUpperCase(), margin + 2, yPosition + 2); // Offset text slightly
        yPosition += 15;
      };

      // Personal Info (Header)
      const personalInfo = extractedInfo.personalInfo || {};
      if (personalInfo.name) {
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(personalInfo.name.toUpperCase(), pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        const contactItems = [
          personalInfo.email,
          personalInfo.phone,
          personalInfo.location,
          personalInfo.linkedin,
          personalInfo.website
        ].filter(Boolean).join(' | ');
        
        if (contactItems) {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.text(contactItems, pageWidth / 2, yPosition, { align: 'center' });
          yPosition += 15;
        }
      }

      // Summary
      if (extractedInfo.summary?.trim()) {
        addSectionHeader('Professional Summary');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        const summaryLines = doc.splitTextToSize(extractedInfo.summary, pageWidth - 2 * margin);
        summaryLines.forEach((line) => {
          checkPageBreak();
          doc.text(line, margin, yPosition);
          yPosition += 6;
        });
        yPosition += 5;
      }

      // Experience
      if (extractedInfo.experience?.length > 0) {
        addSectionHeader('Professional Experience');
        extractedInfo.experience.forEach((exp, index) => {
          checkPageBreak(25);

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.text(exp.title || 'Position Title', margin, yPosition);
          if (exp.duration) {
            doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
            doc.text(exp.duration, pageWidth - margin, yPosition, { align: 'right' });
          }
          yPosition += 7;

          if (exp.company) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.text(exp.company, margin, yPosition);
            yPosition += 7;
          }

          if (exp.description) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            const descriptions = exp.description.split(/•|-/).filter(d => d.trim()).map(d => d.trim());
            descriptions.forEach((desc) => {
              const descLines = doc.splitTextToSize(desc, pageWidth - 2 * margin - 10);
              descLines.forEach((line) => {
                checkPageBreak();
                doc.text(`• ${line}`, margin + 5, yPosition);
                yPosition += 5;
              });
            });
          }
          if (index < extractedInfo.experience.length - 1) yPosition += 8;
        });
        yPosition += 5;
      }

      // Education
      if (extractedInfo.education?.length > 0) {
        addSectionHeader('Education');
        extractedInfo.education.forEach((edu, index) => {
          checkPageBreak(15);

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.text(edu.degree || 'Degree', margin, yPosition);
          if (edu.year) {
            doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
            doc.text(edu.year, pageWidth - margin, yPosition, { align: 'right' });
          }
          yPosition += 7;

          if (edu.institution) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.text(edu.institution, margin, yPosition);
            yPosition += 7;
          }
          if (index < extractedInfo.education.length - 1) yPosition += 5;
        });
        yPosition += 5;
      }

      // Skills
      if (extractedInfo.skills?.length > 0) {
        addSectionHeader('Technical Skills');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        const skillsText = extractedInfo.skills.join(', ');
        const skillsLines = doc.splitTextToSize(skillsText, pageWidth - 2 * margin);
        skillsLines.forEach((line) => {
          checkPageBreak();
          doc.text(line, margin, yPosition);
          yPosition += 6;
        });
        yPosition += 5;
      }

      // Certifications
      if (extractedInfo.certifications?.length > 0) {
        addSectionHeader('Certifications');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        extractedInfo.certifications.forEach((cert) => {
          checkPageBreak();
          doc.text(cert.replace(/•|-/, '').trim(), margin, yPosition);
          yPosition += 6;
        });
        yPosition += 5;
      }

      // Process optimized resume for additional sections not in extractedInfo
      if (optimizedResume) {
        const cleanContent = optimizedResume
          .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
          .replace(/\*([^*]+)\*/g, '$1') // Remove *italic*
          .replace(/^\*+\s*/gm, '• ') // Convert * at start of line to bullets
          .replace(/^-+\s*/gm, '• ') // Convert - at start to bullets
          .replace(/\*/g, '') // Remove ALL remaining asterisks
          .replace(/#+\s*/g, '') // Remove markdown headers
          .trim();

        const sections = cleanContent.split(/\n\s*\n/).filter(section => section.trim());
        
        sections.forEach((section) => {
          const lines = section.trim().split('\n').filter(line => line.trim());
          if (lines.length === 0) return;
          
          const firstLine = lines[0].trim();
          
          // Check for section headers not already covered
          const isProjectSection = firstLine.match(/^(PROJECTS|PROJECT|ACHIEVEMENTS|ACCOMPLISHMENTS|AWARDS|PUBLICATIONS|LANGUAGES|INTERESTS|VOLUNTEER|ADDITIONAL)/i);
          
          if (isProjectSection) {
            addSectionHeader(firstLine);
            
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              
              checkPageBreak();
              
              if (line.startsWith('•') || line.startsWith('-')) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(textColor[0], textColor[1], textColor[2]);
                
                const bulletText = line.substring(1).trim();
                const bulletLines = doc.splitTextToSize(`• ${bulletText}`, pageWidth - (2 * margin + 10));
                
                bulletLines.forEach((bulletLine: string) => {
                  checkPageBreak();
                  doc.text(bulletLine, margin, yPosition);
                  yPosition += 5;
                });
              } else {
                // Project title or regular text
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(textColor[0], textColor[1], textColor[2]);
                const textLines = doc.splitTextToSize(line, pageWidth - (2 * margin));
                textLines.forEach((textLine: string) => {
                  checkPageBreak();
                  doc.text(textLine, margin, yPosition);
                  yPosition += 6;
                });
              }
            }
            yPosition += 5;
          }
        });
      }

      // Footer with page numbers
      const totalPages = doc.getNumberOfPages();
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        doc.setPage(pageNum);
        doc.setFontSize(8);
        doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.text(`${personalInfo.name || 'Resume'} - Page ${pageNum}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      }

      const fileName = personalInfo.name 
        ? `${personalInfo.name.replace(/\s+/g, '_')}_Professional_Resume.pdf`
        : 'Professional_Resume.pdf';
      doc.save(fileName);

      console.log('✅ PDF created successfully!');
      setError('✅ Professional PDF downloaded successfully!');
    } catch (err) {
      console.error('❌ PDF generation failed:', err);
      setError(`Failed to generate PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
                <div className="p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-emerald-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-emerald-400 font-medium">Professional PDF Generation</p>
                      <p className="text-emerald-300 text-sm mt-1">
                        Click &quot;Download Professional PDF&quot; to generate a beautifully formatted PDF with proper sections, 
                        bold headings, professional styling, and all your resume details perfectly organized. 
                        For even more advanced LaTeX formatting, you can also use <a href="https://www.overleaf.com" target="_blank" rel="noopener noreferrer" 
                        className="underline hover:text-emerald-200">Overleaf.com</a>.
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
                    {isDownloading ? 'Creating Professional PDF...' : 'Download Professional PDF'}
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
