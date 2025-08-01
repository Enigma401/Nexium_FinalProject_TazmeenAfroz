import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { latexCode, filename = 'resume' } = await request.json();

    if (!latexCode) {
      return NextResponse.json({ error: 'LaTeX code is required' }, { status: 400 });
    }

    console.log('📄 Generating PDF from LaTeX...');

    // Create temporary directory
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const texFile = path.join(tempDir, `${filename}_${timestamp}.tex`);
    const pdfFile = path.join(tempDir, `${filename}_${timestamp}.pdf`);

    try {
      // Write LaTeX content to file
      await fs.writeFile(texFile, latexCode, 'utf8');

      // Check if pdflatex is available
      try {
        await execAsync('which pdflatex');
      } catch {
        console.log('⚠️ pdflatex not found, falling back to alternative method');
        return NextResponse.json({ 
          error: 'PDF generation requires LaTeX installation. Please install TeXLive or MiKTeX.',
          latexCode,
          downloadUrl: null
        }, { status: 200 });
      }

      // Compile LaTeX to PDF using pdflatex (compatible template)
      const compileOptions = {
        cwd: tempDir,
        timeout: 30000 // 30 second timeout
      };

      await execAsync(`pdflatex -interaction=nonstopmode "${path.basename(texFile)}"`, compileOptions);
      
      // Run again for cross-references and table of contents
      try {
        await execAsync(`pdflatex -interaction=nonstopmode "${path.basename(texFile)}"`, compileOptions);
      } catch {
        console.log('⚠️ Second LaTeX compilation failed, but PDF should still be generated');
      }

      // Check if PDF was created
      try {
        await fs.access(pdfFile);
      } catch {
        throw new Error('PDF generation failed - file not created');
      }

      // Read the generated PDF
      const pdfBuffer = await fs.readFile(pdfFile);

      // Clean up temporary files
      await cleanupTempFiles(tempDir, timestamp.toString());

      // Return PDF as base64 for download
      const base64Pdf = pdfBuffer.toString('base64');

      return NextResponse.json({
        success: true,
        pdfData: base64Pdf,
        filename: `${filename}.pdf`,
        message: 'PDF generated successfully'
      });

    } catch (error) {
      // Clean up on error
      await cleanupTempFiles(tempDir, timestamp.toString());
      throw error;
    }

  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    
    return NextResponse.json({
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Try downloading the LaTeX code and compile it locally'
    }, { status: 500 });
  }
}

async function cleanupTempFiles(tempDir: string, timestamp: string) {
  try {
    const files = await fs.readdir(tempDir);
    
    // Remove files with the timestamp
    const filesToDelete = files.filter(file => file.includes(timestamp));
    
    await Promise.all(
      filesToDelete.map(file => 
        fs.unlink(path.join(tempDir, file)).catch(() => {
          // Ignore cleanup errors
        })
      )
    );
    
    console.log('🧹 Cleaned up temporary files');
  } catch (error) {
    console.warn('⚠️ Failed to cleanup temporary files:', error);
  }
}

// Alternative method using online LaTeX compiler (fallback)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const latex = searchParams.get('latex');
  
  if (!latex) {
    return NextResponse.json({ error: 'LaTeX code required' }, { status: 400 });
  }

  // Return instructions for manual compilation
  return NextResponse.json({
    message: 'Manual LaTeX compilation required',
    instructions: [
      '1. Copy the LaTeX code provided',
      '2. Visit an online LaTeX editor like Overleaf (overleaf.com)',
      '3. Create a new project and paste the code',
      '4. Compile to generate your PDF resume',
      '5. Download the generated PDF'
    ],
    onlineEditors: [
      'https://www.overleaf.com',
      'https://latex.codecogs.com/eqneditor/editor.php',
      'https://latexbase.com'
    ]
  });
}
