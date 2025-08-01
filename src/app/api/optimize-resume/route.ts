import { NextRequest, NextResponse } from 'next/server';

// Type definitions
interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
}

interface Experience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface Education {
  degree: string;
  institution: string;
  year: string;
  gpa?: string;
}

interface ExtractedInfo {
  personalInfo: PersonalInfo;
  summary?: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects?: Array<{ name: string; description: string; duration?: string; technologies?: string; link?: string }>;
  certifications?: string[];
  languages?: string[];
  achievements?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { extractedInfo, jobDescription } = await request.json();

    if (!extractedInfo || !jobDescription) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    console.log('🤖 Creating ATS-friendly resume with AI...');

    // Generate ATS-friendly resume using AI
    const optimizedResume = await generateATSResumeWithAI(extractedInfo, jobDescription);

    // Generate LaTeX code for PDF
    const latexCode = generateOptimizedLatexCode(extractedInfo, jobDescription);

    return NextResponse.json({
      success: true,
      optimizedResume,
      latexCode
    });
  } catch (error) {
    console.error('❌ Resume optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize resume. Please try again.' },
      { status: 500 }
    );
  }
}

async function generateATSResumeWithAI(extractedInfo: ExtractedInfo, jobDescription: string): Promise<string> {
  const jobKeywords = extractKeywords(jobDescription);
  
  console.log('🚀 Attempting AI generation with Gemini...');
  
  try {
    const geminiResult = await generateWithGemini(extractedInfo, jobDescription);
    console.log('✅ Gemini generation successful');
    return geminiResult;
  } catch (error) {
    console.log('⚠️ Gemini failed, trying OpenRouter...', error);
    
    try {
      const openRouterResult = await generateWithOpenRouter(extractedInfo, jobDescription);
      console.log('✅ OpenRouter generation successful');
      return openRouterResult;
    } catch (error) {
      console.log('⚠️ OpenRouter failed, using fallback...', error);
      
      const fallbackResult = generateWithFallback(extractedInfo, jobDescription);
      console.log('✅ Fallback generation complete');
      return fallbackResult;
    }
  }
}

async function generateWithGemini(extractedInfo: ExtractedInfo, jobDescription: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = `Create a comprehensive, professional, ATS-friendly resume based on this information:

CANDIDATE INFO: ${JSON.stringify(extractedInfo, null, 2)}

JOB DESCRIPTION: ${jobDescription}

Create a high-quality, FULL-LENGTH resume that:
1. Passes ATS scanners with proper formatting and keywords
2. Uses strong action verbs and quantified achievements with specific numbers/percentages
3. Incorporates relevant keywords from the job description naturally throughout all sections
4. Shows clear value proposition and measurable impact in every role
5. Has professional sections including ALL relevant information (experience, education, skills, AND projects)
6. Includes a compelling Professional Summary that highlights key qualifications
7. Features a comprehensive Projects section showcasing technical skills and achievements
8. Uses industry-standard terminology and demonstrates expertise
9. Provides detailed descriptions that fill a complete professional resume (not just half a page)

IMPORTANT REQUIREMENTS:
- Include ALL projects with detailed technical descriptions
- Each experience entry should have 2-3 bullet points with quantified results
- Projects section should highlight technical skills, tools used, and impact/results
- Skills should be comprehensive and relevant to the job requirements
- Professional Summary should be 3-4 sentences highlighting key strengths
- Ensure the resume content is substantial enough for a full professional document

Format with clear section headers:
- Professional Summary
- Core Skills/Technical Skills
- Professional Experience (with detailed bullet points)
- Projects (with technical details and impact)
- Education

Return ONLY the formatted resume text with proper spacing and professional structure:`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    signal: AbortSignal.timeout(30000),
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 3000
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (content) {
    return content.trim();
  }
  
  throw new Error('No content returned from Gemini');
}

async function generateWithOpenRouter(extractedInfo: ExtractedInfo, jobDescription: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const prompt = `Create a professional, ATS-friendly resume based on this information:

CANDIDATE INFO: ${JSON.stringify(extractedInfo, null, 2)}

JOB DESCRIPTION: ${jobDescription}

Create a high-quality resume that:
1. Passes ATS scanners with proper formatting
2. Uses strong action verbs and quantified achievements
3. Incorporates relevant keywords from the job naturally
4. Shows clear value proposition and impact
5. Has professional sections and bullet points
6. Includes ALL projects with technical details
7. Provides comprehensive content for a full-page professional resume

Return ONLY the formatted resume text:`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'Resume Tailor'
    },
    signal: AbortSignal.timeout(30000),
    body: JSON.stringify({
      model: 'mistralai/mistral-7b-instruct',
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume writer. Create professional, ATS-friendly resumes that get interviews.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 3000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (content) {
    return content.trim();
  }
  
  throw new Error('No content returned from OpenRouter');
}

function generateWithFallback(extractedInfo: ExtractedInfo, jobDescription: string): string {
  console.log('🔄 Using fallback resume generation...');
  
  const { personalInfo, summary, experience, education, skills, projects } = extractedInfo;
  const jobKeywords = extractKeywords(jobDescription);
  
  let resume = '';
  
  // Header
  resume += `${personalInfo.name || 'Professional Name'}\n`;
  if (personalInfo.email) resume += `${personalInfo.email} | `;
  if (personalInfo.phone) resume += `${personalInfo.phone} | `;
  if (personalInfo.location) resume += `${personalInfo.location}`;
  resume += '\n';
  if (personalInfo.linkedin) resume += `${personalInfo.linkedin}\n`;
  resume += '\n';
  
  // Professional Summary
  resume += 'PROFESSIONAL SUMMARY\n';
  resume += '════════════════════════════════════════════\n';
  
  if (summary) {
    resume += summary + '\n\n';
  } else {
    resume += `Results-driven professional with expertise in ${jobKeywords.slice(0, 3).join(', ')}. Proven track record of delivering high-quality solutions and driving business success in fast-paced environments.\n\n`;
  }
  
  // Core Skills
  resume += 'CORE SKILLS\n';
  resume += '════════════════════════════════════════════\n';
  
  const allSkills = [...new Set([...skills, ...jobKeywords])];
  resume += allSkills.slice(0, 15).join(' • ') + '\n\n';
  
  // Professional Experience
  if (experience.length > 0) {
    resume += 'PROFESSIONAL EXPERIENCE\n';
    resume += '════════════════════════════════════════════\n';
    
    experience.forEach((exp, index) => {
      resume += `${exp.title} | ${exp.company} | ${exp.duration}\n`;
      resume += `• ${exp.description}\n`;
      if (index < experience.length - 1) resume += '\n';
    });
    resume += '\n';
  }
  
  // Projects Section
  if (projects && projects.length > 0) {
    resume += 'KEY PROJECTS\n';
    resume += '════════════════════════════════════════════\n';
    
    projects.forEach((project, index) => {
      resume += `${project.name}\n`;
      resume += `${project.description}\n`;
      if (project.technologies) {
        resume += `Technologies: ${project.technologies}\n`;
      }
      if (project.link) {
        resume += `Link: ${project.link}\n`;
      }
      if (index < projects.length - 1) resume += '\n';
    });
    resume += '\n';
  }
  
  // Education
  if (education.length > 0) {
    resume += 'EDUCATION\n';
    resume += '════════════════════════════════════════════\n';
    
    education.forEach(edu => {
      resume += `${edu.degree} | ${edu.institution} | ${edu.year}\n`;
      if (edu.gpa) resume += `GPA: ${edu.gpa}\n`;
    });
  }
  
  return resume;
}

function generateOptimizedLatexCode(extractedInfo: ExtractedInfo, jobDescription: string): string {
  const { personalInfo, summary, experience, education, skills, projects } = extractedInfo;
  const jobKeywords = extractKeywords(jobDescription);
  
  let latex = `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage{hyperref}

% Define colors
\\definecolor{headercolor}{RGB}{6, 78, 59}
\\definecolor{accentcolor}{RGB}{16, 185, 129}

% Section formatting
\\titleformat{\\section}{\\Large\\bfseries\\color{headercolor}}{}{0em}{}[\\color{accentcolor}\\titlerule]
\\titlespacing{\\section}{0pt}{12pt}{6pt}

% Remove page numbers
\\pagestyle{empty}

% Reduce item separation
\\setlist[itemize]{noitemsep, topsep=0pt, partopsep=0pt, parsep=0pt, leftmargin=*}

\\begin{document}

% Header
\\begin{center}
\\textbf{\\Huge \\color{headercolor} ${personalInfo.name || 'Professional Name'}}\\\\[4pt]
`;

  if (personalInfo.email || personalInfo.phone || personalInfo.location) {
    latex += `\\textcolor{accentcolor}{`;
    if (personalInfo.email) latex += `${personalInfo.email}`;
    if (personalInfo.phone) latex += ` \\textbullet{} ${personalInfo.phone}`;
    if (personalInfo.location) latex += ` \\textbullet{} ${personalInfo.location}`;
    latex += `}\\\\[2pt]\n`;
  }
  
  if (personalInfo.linkedin) {
    latex += `\\textcolor{accentcolor}{${personalInfo.linkedin}}\\\\[2pt]\n`;
  }
  
  latex += `\\end{center}

% Professional Summary
\\section{Professional Summary}
`;
  
  if (summary) {
    latex += `${summary}\\\\[8pt]\n`;
  } else {
    latex += `Results-driven professional with expertise in ${jobKeywords.slice(0, 3).join(', ')}. Proven track record of delivering high-quality solutions and driving business success through innovative approaches and collaborative leadership.\\\\[8pt]\n`;
  }
  
  // Skills section
  latex += `
\\section{Core Skills}
`;
  
  const allSkills = [...new Set([...skills, ...jobKeywords])];
  const skillsText = allSkills.slice(0, 15).join(' \\textbullet{} ');
  latex += `${skillsText}\\\\[8pt]\n`;
  
  // Professional Experience
  latex += `
\\section{Professional Experience}
`;
  
  if (experience.length > 0) {
    experience.forEach(exp => {
      latex += `\\textbf{${exp.title}} \\hfill \\textcolor{accentcolor}{${exp.duration}}\\\\
\\textit{${exp.company}}\\\\[4pt]
\\begin{itemize}
\\item ${exp.description}
\\end{itemize}
\\vspace{4pt}

`;
    });
  } else {
    latex += `\\textit{Please add your professional experience details.}\\\\[8pt]\n`;
  }

  // Projects Section
  if (projects && projects.length > 0) {
    latex += `\\section{Key Projects}
`;
    projects.forEach(project => {
      latex += `\\textbf{${project.name}}`;
      if (project.link) {
        latex += ` \\textcolor{accentcolor}{\\href{${project.link}}{[View Project]}}`;
      }
      latex += `\\\\[2pt]
${project.description}\\\\`;
      if (project.technologies) {
        latex += `\\textit{Technologies: ${project.technologies}}\\\\`;
      }
      latex += `[6pt]

`;
    });
  }
  
  // Education
  latex += `\\section{Education}
`;
  
  if (education.length > 0) {
    education.forEach(edu => {
      latex += `\\textbf{${edu.degree}} \\hfill \\textcolor{accentcolor}{${edu.year}}\\\\
\\textit{${edu.institution}}`;
      if (edu.gpa) latex += ` \\textbullet{} GPA: ${edu.gpa}`;
      latex += `\\\\[6pt]

`;
    });
  } else {
    latex += `\\textit{Please add your education details.}\\\\[8pt]\n`;
  }
  
  latex += `\\end{document}`;
  
  return latex;
}

function extractKeywords(jobDescription: string): string[] {
  const text = jobDescription.toLowerCase();
  
  const commonKeywords = [
    'javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker',
    'leadership', 'management', 'communication', 'problem-solving', 'teamwork',
    'agile', 'scrum', 'git', 'testing', 'debugging', 'optimization',
    'analytics', 'data', 'machine learning', 'api', 'database', 'cloud'
  ];
  
  const foundKeywords = commonKeywords.filter(keyword => text.includes(keyword));
  
  // Extract capitalized words (likely important terms)
  const capitalizedWords = jobDescription.match(/\b[A-Z][a-z]+\b/g) || [];
  const uniqueCapitalized = [...new Set(capitalizedWords.map(w => w.toLowerCase()))];
  
  return [...new Set([...foundKeywords, ...uniqueCapitalized])].slice(0, 15);
}
