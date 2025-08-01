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

    // Helper function to add section header
    const addSectionHeader = (title) => {
      checkPageBreak(20);
      yPosition += 8; // Space before section
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(title, margin, yPosition);
      yPosition += 8;
      
      // Underline
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition, margin + 80, yPosition);
      yPosition += 8;
    };

    // Get personal info
    const personalInfo = extractedInfo.personalInfo;
    
    // HEADER SECTION
    if (personalInfo?.name) {
      // Name - Large, bold, centered
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(personalInfo.name.toUpperCase(), pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      // Contact Info - Centered
      const contactItems = [];
      if (personalInfo.email) contactItems.push(personalInfo.email);
      if (personalInfo.phone) contactItems.push(personalInfo.phone);
      if (personalInfo.location) contactItems.push(personalInfo.location);
      if (personalInfo.linkedin) contactItems.push(personalInfo.linkedin);
      if (personalInfo.website) contactItems.push(personalInfo.website);
      
      if (contactItems.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(contactItems.join(' • '), pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 10;
      }
      
      addSectionDivider();
    }

    // PROFESSIONAL SUMMARY SECTION
    if (extractedInfo.summary && extractedInfo.summary.trim()) {
      addSectionHeader('PROFESSIONAL SUMMARY');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      
      const summaryLines = doc.splitTextToSize(extractedInfo.summary, pageWidth - (2 * margin));
      summaryLines.forEach((line) => {
        checkPageBreak();
        doc.text(line, margin, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
    }

    // EXPERIENCE SECTION
    if (extractedInfo.experience && extractedInfo.experience.length > 0) {
      addSectionHeader('PROFESSIONAL EXPERIENCE');
      
      extractedInfo.experience.forEach((exp, index) => {
        checkPageBreak(25);
        
        // Job Title - Bold
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(exp.title || 'Position Title', margin, yPosition);
        
        // Duration - Right aligned
        if (exp.duration) {
          doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
          doc.text(exp.duration, pageWidth - margin, yPosition, { align: 'right' });
        }
        yPosition += 7;
        
        // Company - Italic
        if (exp.company) {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.text(exp.company, margin, yPosition);
          yPosition += 7;
        }
        
        // Description
        if (exp.description) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          
          // Split description into bullet points if it contains multiple sentences
          const descriptions = exp.description.includes('•') 
            ? exp.description.split('•').filter(d => d.trim())
            : [exp.description];
          
          descriptions.forEach((desc) => {
            if (desc.trim()) {
              const descLines = doc.splitTextToSize(`• ${desc.trim()}`, pageWidth - (2 * margin + 5));
              descLines.forEach((line, lineIndex) => {
                checkPageBreak();
                doc.text(line, margin + (lineIndex === 0 ? 0 : 10), yPosition);
                yPosition += 5;
              });
            }
          });
        }
        
        // Add space between experiences
        if (index < extractedInfo.experience.length - 1) {
          yPosition += 8;
        }
      });
      yPosition += 5;
    }

    // EDUCATION SECTION
    if (extractedInfo.education && extractedInfo.education.length > 0) {
      addSectionHeader('EDUCATION');
      
      extractedInfo.education.forEach((edu, index) => {
        checkPageBreak(15);
        
        // Degree - Bold
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(edu.degree || 'Degree', margin, yPosition);
        
        // Year - Right aligned
        if (edu.year) {
          doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
          doc.text(edu.year, pageWidth - margin, yPosition, { align: 'right' });
        }
        yPosition += 7;
        
        // Institution
        if (edu.institution) {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.text(edu.institution, margin, yPosition);
          yPosition += 7;
        }
        
        // GPA
        if (edu.gpa) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`GPA: ${edu.gpa}`, margin, yPosition);
          yPosition += 6;
        }
        
        // Add space between education entries
        if (index < extractedInfo.education.length - 1) {
          yPosition += 5;
        }
      });
      yPosition += 5;
    }

    // SKILLS SECTION
    if (extractedInfo.skills && extractedInfo.skills.length > 0) {
      addSectionHeader('TECHNICAL SKILLS');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      
      // Group skills into lines of 4-5 skills each
      const skillsPerLine = 4;
      for (let i = 0; i < extractedInfo.skills.length; i += skillsPerLine) {
        checkPageBreak();
        const skillGroup = extractedInfo.skills.slice(i, i + skillsPerLine);
        doc.text(`• ${skillGroup.join(' • ')}`, margin, yPosition);
        yPosition += 6;
      }
      yPosition += 5;
    }

    // CERTIFICATIONS SECTION
    if (extractedInfo.certifications && extractedInfo.certifications.length > 0) {
      addSectionHeader('CERTIFICATIONS');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      
      extractedInfo.certifications.forEach((cert) => {
        checkPageBreak();
        doc.text(`• ${cert}`, margin, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
    }

    // If we still don't have much content, try to parse the optimized resume text
    if (yPosition < margin + 200 && optimizedResume && optimizedResume.trim()) {
      console.log('📝 Adding content from optimized resume text...');
      
      // Parse optimized resume as fallback
      const lines = optimizedResume.split('\n').filter(line => line.trim());
      let currentSection = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // Skip personal info lines (already handled)
        if (personalInfo && (
          trimmedLine.toLowerCase().includes(personalInfo.name?.toLowerCase() || '') ||
          trimmedLine.includes(personalInfo.email || '') ||
          trimmedLine.includes(personalInfo.phone || '')
        )) {
          continue;
        }
        
        // Check for section headers
        if (trimmedLine.match(/^[A-Z][A-Z\s]{3,}$/) || 
            trimmedLine.match(/^(SUMMARY|EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS|PROJECTS)/i)) {
          currentSection = trimmedLine;
          addSectionHeader(trimmedLine);
        }
        // Add content under sections
        else if (currentSection) {
          checkPageBreak();
          
          if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
            // Bullet point
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            
            const bulletText = trimmedLine.substring(1).trim();
            const bulletLines = doc.splitTextToSize(`• ${bulletText}`, pageWidth - (2 * margin + 5));
            bulletLines.forEach((bulletLine) => {
              checkPageBreak();
              doc.text(bulletLine, margin, yPosition);
              yPosition += 5;
            });
          } else {
            // Regular text
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            
            const textLines = doc.splitTextToSize(trimmedLine, pageWidth - (2 * margin));
            textLines.forEach((textLine) => {
              checkPageBreak();
              doc.text(textLine, margin, yPosition);
              yPosition += 6;
            });
          }
          yPosition += 2;
        }
      }
    }

    // Footer with page numbers
    const totalPages = doc.getNumberOfPages();
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      doc.setPage(pageNum);
      doc.setFontSize(8);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(`${personalInfo?.name || 'Resume'} - Page ${pageNum}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // Generate filename and download
    const fileName = personalInfo?.name 
      ? `${personalInfo.name.replace(/\s+/g, '_')}_Resume.pdf`
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
