import { NextRequest, NextResponse } from 'next/server';

interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { optimizedResume, personalInfo } = await request.json();
    console.log('📄 Generating PDF from resume text...');
    console.log('Resume length:', optimizedResume?.length || 0);
    console.log('Personal info:', personalInfo ? 'Present' : 'Missing');

    if (!optimizedResume?.trim()) {
      console.log('❌ No resume content provided');
      return NextResponse.json({
        success: false,
        error: 'No resume content provided'
      }, { status: 400 });
    }

    // Generate HTML content for PDF
    const htmlContent = generateResumeHTML(optimizedResume, personalInfo);

    console.log('✅ HTML content generated successfully');
    return NextResponse.json({
      success: true,
      htmlContent: htmlContent,
      message: 'HTML content generated for PDF conversion'
    });

  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate PDF content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateResumeHTML(resumeText: string, personalInfo: PersonalInfo): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Resume</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 20px;
            background: white;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
        }
        .name {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
        }
        .contact {
            font-size: 10px;
            color: #666;
        }
        .section {
            margin-bottom: 15px;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #1e40af;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 2px;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .content {
            margin-left: 10px;
        }
        @media print {
            body { margin: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="name">${personalInfo?.name || 'Professional Resume'}</div>
        <div class="contact">
            ${personalInfo?.email || ''} 
            ${personalInfo?.phone ? ` • ${personalInfo.phone}` : ''} 
            ${personalInfo?.location ? ` • ${personalInfo.location}` : ''}
        </div>
    </div>
    
    <div class="content">
        ${formatResumeContent(resumeText)}
    </div>
</body>
</html>`;
}

function formatResumeContent(resumeText: string): string {
  const sections = resumeText.split(/\n\s*\n/);
  let html = '';
  
  sections.forEach(section => {
    const lines = section.trim().split('\n');
    if (lines.length === 0) return;
    
    const firstLine = lines[0].trim();
    
    if (firstLine.match(/^(PROFESSIONAL SUMMARY|EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS|PROJECTS|SUMMARY)/i) ||
        firstLine === firstLine.toUpperCase()) {
      html += `<div class="section">
        <div class="section-title">${firstLine}</div>
        <div class="content">`;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
          html += `<div style="margin-left: 15px;">• ${line.substring(1).trim()}</div>`;
        } else {
          html += `<div style="margin-bottom: 5px;">${line}</div>`;
        }
      }
      
      html += '</div></div>';
    }
  });
  
  return html;
}
