import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { optimizedResume, personalInfo } = await request.json();

    // Create HTML content for PDF generation
    const htmlContent = `
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
        .job-title {
            font-weight: bold;
            color: #374151;
        }
        .company {
            font-style: italic;
            color: #6b7280;
        }
        .duration {
            float: right;
            color: #9ca3af;
            font-size: 10px;
        }
        .description {
            margin-top: 5px;
            margin-bottom: 10px;
        }
        .skills {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }
        .skill {
            background: #eff6ff;
            color: #1e40af;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 10px;
        }
        ul {
            margin: 5px 0;
            padding-left: 15px;
        }
        li {
            margin-bottom: 2px;
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
            ${personalInfo?.linkedin ? ` • ${personalInfo.linkedin}` : ''}
        </div>
    </div>
    
    <div class="content">
        ${formatResumeContent(optimizedResume)}
    </div>
</body>
</html>`;

    // Return HTML for client-side PDF generation
    return NextResponse.json({
      success: true,
      htmlContent: htmlContent,
      message: 'HTML content generated for PDF conversion'
    });

  } catch (error) {
    console.error('PDF generation failed:', error);
    return NextResponse.json({
      error: 'Failed to generate PDF content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function formatResumeContent(resumeText: string): string {
  const sections = resumeText.split(/\n\s*\n/);
  let html = '';
  
  sections.forEach(section => {
    const lines = section.trim().split('\n');
    if (lines.length === 0) return;
    
    const firstLine = lines[0].trim();
    
    // Check if it's a section header (all caps or starts with common section names)
    if (firstLine.match(/^(PROFESSIONAL SUMMARY|EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS|PROJECTS|SUMMARY)/i) ||
        firstLine === firstLine.toUpperCase()) {
      html += `<div class="section">
        <div class="section-title">${firstLine}</div>
        <div class="content">`;
      
      // Add content for this section
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Check if it's a job/education entry
        if (line.includes('|') || line.match(/\d{4}[-–]\d{4}|\d{4}[-–]Present/)) {
          const parts = line.split('|');
          if (parts.length >= 2) {
            html += `<div style="margin-bottom: 10px;">
              <div class="job-title">${parts[0].trim()}</div>
              <div class="company">${parts[1].trim()} ${parts[2] ? `<span class="duration">${parts[2].trim()}</span>` : ''}</div>
            </div>`;
          } else {
            html += `<div class="job-title">${line}</div>`;
          }
        }
        // Skills section
        else if (firstLine.toUpperCase().includes('SKILLS') && line.includes(',')) {
          const skills = line.split(',').map(skill => skill.trim());
          html += '<div class="skills">';
          skills.forEach(skill => {
            if (skill) html += `<span class="skill">${skill}</span>`;
          });
          html += '</div>';
        }
        // Bullet points
        else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
          if (!html.includes('<ul>')) html += '<ul>';
          html += `<li>${line.substring(1).trim()}</li>`;
        }
        // Regular content
        else {
          if (html.includes('<ul>') && !html.includes('</ul>')) html += '</ul>';
          html += `<div class="description">${line}</div>`;
        }
      }
      
      if (html.includes('<ul>') && !html.includes('</ul>')) html += '</ul>';
      html += '</div></div>';
    }
  });
  
  return html;
}
