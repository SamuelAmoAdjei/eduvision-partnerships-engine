import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ImageRun,
} from 'docx';
import { CustomLetterhead } from '../types';

export async function downloadProposalDocx(
  targetOrg: string,
  contentText: string,
  customLetterhead?: CustomLetterhead
): Promise<void> {
  const lines = contentText.split('\n');
  const children: Paragraph[] = [];

  const orgName = customLetterhead?.useCustom && customLetterhead.orgName
    ? customLetterhead.orgName
    : 'EDUVISION GHANA';

  const deptName = customLetterhead?.useCustom && customLetterhead.department
    ? customLetterhead.department
    : 'OFFICE OF GLOBAL PARTNERSHIPS & STAKEHOLDER ENGAGEMENT';

  const contactInfo = customLetterhead?.useCustom && customLetterhead.contactInfo
    ? customLetterhead.contactInfo
    : 'Accra, Ghana | eduvisiongh.org | partnerships@eduvisiongh.org';

  const hasCustomTemplateImage = customLetterhead?.useCustom && customLetterhead?.templateImageBase64;

  if (hasCustomTemplateImage) {
    try {
      const base64Str = customLetterhead.templateImageBase64;
      const base64Data = base64Str.split(',')[1] || base64Str;
      const binaryString = window.atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: bytes,
              type: 'png',
              transformation: {
                width: 580,
                height: 120,
              },
            }),
          ],
        }),
        new Paragraph({ children: [new TextRun({ text: '', size: 12 })] })
      );
    } catch (e) {
      console.error('Error rendering template image in docx:', e);
    }
  } else {
    // Official Letterhead Header in Word
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: orgName.toUpperCase(),
            bold: true,
            size: 32, // 16pt
            font: 'Georgia',
            color: '0A2540',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: deptName.toUpperCase(),
            bold: true,
            size: 18,
            font: 'Arial',
            color: '555555',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: contactInfo,
            size: 18,
            font: 'Arial',
            color: '666666',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: {
          bottom: {
            color: '0A2540',
            space: 1,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
        children: [new TextRun({ text: '', size: 12 })],
      }),
      new Paragraph({ children: [new TextRun({ text: '', size: 24 })] }) // Spacer
    );
  }

  // Parse lines of proposal text
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      children.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
      continue;
    }

    // Headers (Markdown ###, ##, # or SECTION 1:)
    if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('SECTION ')) {
      const headingText = trimmed.replace(/^#+\s*/, '');
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: headingText,
              bold: true,
              size: 26, // 13pt
              font: 'Georgia',
              color: '0A2540',
            }),
          ],
        })
      );
    } else if (trimmed.startsWith('### ') || trimmed.match(/^\d+\.\s+[A-Z]/)) {
      const headingText = trimmed.replace(/^###\s*/, '');
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 180, after: 80 },
          children: [
            new TextRun({
              text: headingText,
              bold: true,
              size: 22, // 11pt
              font: 'Georgia',
              color: '111111',
            }),
          ],
        })
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      // Bullet items
      const bulletText = trimmed.substring(2);
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: parseInlineFormatting(bulletText),
        })
      );
    } else {
      // Normal paragraph
      children.push(
        new Paragraph({
          spacing: { after: 120, line: 276 }, // 1.15 line height
          children: parseInlineFormatting(trimmed),
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanTargetName = targetOrg.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const fileName = `Eduvision_Partnership_Proposal_${cleanTargetName || 'Draft'}.docx`;

  triggerDownload(blob, fileName);
}

export async function downloadEmailDocx(subject: string, contentText: string): Promise<void> {
  const lines = contentText.split('\n');
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'EDUVISION GHANA — DIPLOMATIC OUTREACH DRAFT',
          bold: true,
          size: 24,
          font: 'Georgia',
          color: '0A2540',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      border: {
        bottom: {
          color: '0A2540',
          space: 1,
          style: BorderStyle.SINGLE,
          size: 8,
        },
      },
      children: [new TextRun({ text: '', size: 12 })],
    }),
    new Paragraph({ children: [new TextRun({ text: '', size: 24 })] })
  );

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      children.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
      continue;
    }
    children.push(
      new Paragraph({
        spacing: { after: 120, line: 276 },
        children: parseInlineFormatting(trimmed),
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanSubject = subject.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const fileName = `Eduvision_Email_Draft_${cleanSubject || 'Executive'}.docx`;

  triggerDownload(blob, fileName);
}

function parseInlineFormatting(text: string): TextRun[] {
  // Simple bold parser for **bold text**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return new TextRun({
        text: part.slice(2, -2),
        bold: true,
        font: 'Times New Roman',
        size: 22,
      });
    }
    return new TextRun({
      text: part,
      font: 'Times New Roman',
      size: 22,
    });
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
