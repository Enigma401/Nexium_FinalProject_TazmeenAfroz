const downloadPDF = async () => {
  if (!optimizedResume.trim()) {
    setError('No resume content available for PDF generation');
    return;
  }

  setError('');
  setIsDownloading(true);
  
  try {
    console.log('🚀 Creating professional PDF with jsPDF...');
    
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
    
    // Helper function to check if we need a new page
    const checkPageBreak = (additionalHeight = 10) => {
      if (yPosition + additionalHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };
    
    // Helper function to add section divider
    const addSectionDivider = () => {
      yPosition += 3;
      checkPageBreak();
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;
    };

    // Get personal info from extractedInfo
    const personalInfo = extractedInfo?.personalInfo;
    
    // Header Section with Personal Info
    if (personalInfo?.name) {
      // Name - Large, bold, centered
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(personalInfo.name, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 12;
      
      // Contact Info - Centered
      const contactItems = [];
      if (personalInfo.email) contactItems.push(personalInfo.email);
      if (personalInfo.phone) contactItems.push(personalInfo.phone);
      if (personalInfo.location) contactItems.push(personalInfo.location);
      if (personalInfo.linkedin) contactItems.push(personalInfo.linkedin);
      if (personalInfo.website) contactItems.push(personalInfo.website);
      
      if (contactItems.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(contactItems.join(' • '), pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 8;
      }
      
      addSectionDivider();
    }

    // Process the optimized resume content - Clean up markdown formatting
    const cleanContent = optimizedResume
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
      .replace(/\*([^*]+)\*/g, '$1') // Remove *italic*
      .replace(/^\*+\s*/gm, '• ') // Convert * at start of line to bullets
      .replace(/^-+\s*/gm, '• ') // Convert - at start to bullets
      .replace(/\*/g, '') // Remove ALL remaining asterisks
      .replace(/#+\s*/g, '') // Remove markdown headers
      .trim();

    // Split content into lines and process
    const lines = cleanContent.split('\n').filter(line => line.trim());
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Skip if line contains personal info already displayed in header
      if (personalInfo && (
        line.includes(personalInfo.name) ||
        line.includes(personalInfo.email) ||
        line.includes(personalInfo.phone) ||
        (personalInfo.location && line.includes(personalInfo.location))
      )) {
        continue;
      }
      
      // Check if it's a section header
      const isMainSection = line.match(/^(PROFESSIONAL SUMMARY|SUMMARY|OBJECTIVE|EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT|EDUCATION|ACADEMIC|SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|CERTIFICATIONS|PROJECTS|ACHIEVEMENTS|ACCOMPLISHMENTS|LANGUAGES|INTERESTS|AWARDS|PUBLICATIONS)$/i);
      const isAllCaps = line === line.toUpperCase() && line.length > 2 && !line.includes('•') && !line.includes('|');
      const isHeaderPattern = /^[A-Z][A-Z\s]{3,}$/.test(line) && !line.includes('•');
      
      if (isMainSection || isAllCaps || isHeaderPattern) {
        // Add extra space before new sections
        yPosition += 8;
        checkPageBreak(15);
        
        // Section Header - Bold, dark green
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(line, margin, yPosition);
        yPosition += 10;
        
        // Underline for section
        doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition - 2, margin + 60, yPosition - 2);
        yPosition += 5;
      }
      // Check for job titles/education entries (contain | or years)
      else if (line.includes('|') || (line.match(/\b\d{4}\b/) && !line.startsWith('•'))) {
        checkPageBreak(12);
        
        // Job title or education entry - Bold
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 2) {
          // Format: Title | Company | Date
          doc.text(parts[0], margin, yPosition);
          if (parts[1]) {
            doc.setFont('helvetica', 'normal');
            doc.text(`at ${parts[1]}`, margin, yPosition + 6);
          }
          if (parts[2]) {
            doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
            doc.text(parts[2], pageWidth - margin, yPosition, { align: 'right' });
            doc.setTextColor(textColor[0], textColor[1], textColor[2]); // Reset color
          }
          yPosition += 12;
        } else {
          // Single line job/education entry
          doc.text(line, margin, yPosition);
          yPosition += 8;
        }
      }
      // Bullet points
      else if (line.startsWith('•') || line.startsWith('-')) {
        checkPageBreak(6);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        
        const bulletText = line.substring(1).trim();
        const bulletLines = doc.splitTextToSize(`• ${bulletText}`, pageWidth - (2 * margin + 10));
        
        bulletLines.forEach((bulletLine, index) => {
          checkPageBreak();
          doc.text(bulletLine, margin + (index === 0 ? 0 : 10), yPosition);
          yPosition += 5;
        });
        yPosition += 1; // Extra space after bullet
      }
      // Skills section - comma separated or regular text
      else if (line.includes(',') && lines[Math.max(0, i-5)].match(/SKILLS/i)) {
        checkPageBreak(6);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        
        const skills = line.split(',').map(s => s.trim()).filter(s => s);
        const skillsPerLine = 4;
        
        for (let j = 0; j < skills.length; j += skillsPerLine) {
          checkPageBreak();
          const lineSkills = skills.slice(j, j + skillsPerLine);
          doc.text(`• ${lineSkills.join(' • ')}`, margin, yPosition);
          yPosition += 6;
        }
      }
      // Regular paragraph text
      else {
        checkPageBreak(6);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        
        const textLines = doc.splitTextToSize(line, pageWidth - (2 * margin));
        textLines.forEach((textLine) => {
          checkPageBreak();
          doc.text(textLine, margin, yPosition);
          yPosition += 5;
        });
        yPosition += 2; // Small space after paragraph
      }
    }

    // If no content was added (empty sections), use extractedInfo to populate
    if (yPosition < margin + 100) {
      yPosition += 10;
      
      // Add Professional Summary if available
      if (extractedInfo?.summary) {
        checkPageBreak(15);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('PROFESSIONAL SUMMARY', margin, yPosition);
        yPosition += 10;
        
        doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition - 2, margin + 60, yPosition - 2);
        yPosition += 5;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        const summaryLines = doc.splitTextToSize(extractedInfo.summary, pageWidth - (2 * margin));
        summaryLines.forEach((summaryLine) => {
          checkPageBreak();
          doc.text(summaryLine, margin, yPosition);
          yPosition += 5;
        });
        yPosition += 8;
      }
      
      // Add Experience if available
      if (extractedInfo?.experience && extractedInfo.experience.length > 0) {
        checkPageBreak(15);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('EXPERIENCE', margin, yPosition);
        yPosition += 10;
        
        doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition - 2, margin + 60, yPosition - 2);
        yPosition += 5;
        
        extractedInfo.experience.forEach((exp) => {
          checkPageBreak(12);
          
          // Job title - Bold
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.text(exp.title, margin, yPosition);
          
          // Company
          if (exp.company) {
            doc.setFont('helvetica', 'normal');
            doc.text(`at ${exp.company}`, margin, yPosition + 6);
          }
          
          // Duration
          if (exp.duration) {
            doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
            doc.text(exp.duration, pageWidth - margin, yPosition, { align: 'right' });
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          }
          
          yPosition += 12;
          
          // Description
          if (exp.description) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const descLines = doc.splitTextToSize(`• ${exp.description}`, pageWidth - (2 * margin + 10));
            descLines.forEach((descLine) => {
              checkPageBreak();
              doc.text(descLine, margin, yPosition);
              yPosition += 5;
            });
          }
          
          yPosition += 3;
        });
        
        yPosition += 5;
      }
      
      // Add Education if available
      if (extractedInfo?.education && extractedInfo.education.length > 0) {
        checkPageBreak(15);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('EDUCATION', margin, yPosition);
        yPosition += 10;
        
        doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition - 2, margin + 60, yPosition - 2);
        yPosition += 5;
        
        extractedInfo.education.forEach((edu) => {
          checkPageBreak(8);
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.text(edu.degree, margin, yPosition);
          
          if (edu.institution) {
            doc.setFont('helvetica', 'normal');
            doc.text(`at ${edu.institution}`, margin, yPosition + 6);
          }
          
          if (edu.year) {
            doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
            doc.text(edu.year, pageWidth - margin, yPosition, { align: 'right' });
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          }
          
          yPosition += 12;
          
          if (edu.gpa) {
            doc.setFontSize(10);
            doc.text(`GPA: ${edu.gpa}`, margin, yPosition);
            yPosition += 6;
          }
          
          yPosition += 3;
        });
        
        yPosition += 5;
      }
      
      // Add Skills if available
      if (extractedInfo?.skills && extractedInfo.skills.length > 0) {
        checkPageBreak(15);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('SKILLS', margin, yPosition);
        yPosition += 10;
        
        doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition - 2, margin + 60, yPosition - 2);
        yPosition += 5;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        
        const skillsPerLine = 4;
        for (let j = 0; j < extractedInfo.skills.length; j += skillsPerLine) {
          checkPageBreak();
          const lineSkills = extractedInfo.skills.slice(j, j + skillsPerLine);
          doc.text(`• ${lineSkills.join(' • ')}`, margin, yPosition);
          yPosition += 6;
        }
        
        yPosition += 5;
      }
      
      // Add Certifications if available
      if (extractedInfo?.certifications && extractedInfo.certifications.length > 0) {
        checkPageBreak(15);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('CERTIFICATIONS', margin, yPosition);
        yPosition += 10;
        
        doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition - 2, margin + 60, yPosition - 2);
        yPosition += 5;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        
        extractedInfo.certifications.forEach((cert) => {
          checkPageBreak();
          doc.text(`• ${cert}`, margin, yPosition);
          yPosition += 6;
        });
      }
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      doc.setPage(pageNum);
      doc.setFontSize(8);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(`${personalInfo?.name || 'Resume'} - Page ${pageNum}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // Generate filename and download
    const fileName = personalInfo?.name 
      ? `${personalInfo.name.replace(/\s+/g, '_')}_Professional_Resume.pdf`
      : 'Professional_Resume.pdf';

    doc.save(fileName);
    
    console.log('✅ Professional PDF created successfully!');
    setError('✅ Professional PDF downloaded successfully!');
    
  } catch (err) {
    console.error('❌ PDF generation failed:', err);
    setError(`Failed to generate PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
  } finally {
    setIsDownloading(false);
  }
};
