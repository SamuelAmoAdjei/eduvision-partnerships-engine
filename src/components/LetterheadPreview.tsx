import React, { useRef } from 'react';
import { Printer, Download, Copy, Check, FileText, FileCheck2, Maximize2, Upload } from 'lucide-react';
import { downloadProposalDocx } from '../utils/docxExport';
import { CustomLetterhead } from '../types';

interface Props {
  targetOrg: string;
  proposalContent: string;
  customLetterhead?: CustomLetterhead;
  onOpenPdfOverlay?: () => void;
  onTogglePrintView?: () => void;
  onOpenCustomizer?: () => void;
}

export const LetterheadPreview: React.FC<Props> = ({
  targetOrg,
  proposalContent,
  customLetterhead,
  onOpenPdfOverlay,
  onTogglePrintView,
  onOpenCustomizer,
}) => {
  const [copied, setCopied] = React.useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const refPrefix = customLetterhead?.useCustom && customLetterhead.refPrefix
    ? customLetterhead.refPrefix
    : 'EDV/GP-';

  const refNumber = `${refPrefix}${new Date().getFullYear()}/${(new Date().getMonth() + 1)
    .toString()
    .padStart(2, '0')}`;

  const orgName = customLetterhead?.useCustom && customLetterhead.orgName
    ? customLetterhead.orgName
    : 'EDUVISION GHANA';

  const deptName = customLetterhead?.useCustom && customLetterhead.department
    ? customLetterhead.department
    : 'Directorate of Global Partnerships & Institutional Relations';

  const contactInfo = customLetterhead?.useCustom && customLetterhead.contactInfo
    ? customLetterhead.contactInfo
    : 'Accra, Ghana | eduvisiongh.org | partnerships@eduvisiongh.org';

  const handleCopy = () => {
    navigator.clipboard.writeText(proposalContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDocxDownload = async () => {
    await downloadProposalDocx(targetOrg || 'Partner_Org', proposalContent, customLetterhead);
  };

  const paragraphs = proposalContent.split('\n\n').filter(Boolean);

  // Group paragraphs into page chunks if needed (approx 5-6 paragraphs per page sheet)
  const paragraphsPerPage = 6;
  const pageChunks: string[][] = [];
  for (let i = 0; i < paragraphs.length; i += paragraphsPerPage) {
    pageChunks.push(paragraphs.slice(i, i + paragraphsPerPage));
  }
  if (pageChunks.length === 0) {
    pageChunks.push([proposalContent]);
  }

  const topPadding = customLetterhead?.topPaddingPx ?? 140;
  const bottomPadding = customLetterhead?.bottomPaddingPx ?? 80;
  const sidePadding = customLetterhead?.sidePaddingPx ?? 48;

  const hasCustomTemplateImage = customLetterhead?.useCustom && customLetterhead?.templateImageBase64;

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-3 rounded-lg border border-slate-300 print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#0A2540]" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {hasCustomTemplateImage
              ? 'Uploaded Blank Letterhead Template Preview'
              : 'Official Eduvision Letterhead Preview'}
          </span>
          {customLetterhead?.useCustom && (
            <span className="text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full">
              {hasCustomTemplateImage ? 'Custom Blank Template Active' : 'Custom Header Active'}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenCustomizer && (
            <button
              onClick={onOpenCustomizer}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-sm transition cursor-pointer"
              title="Upload Custom Blank Letterhead Template File"
            >
              <Upload className="w-3.5 h-3.5 text-amber-700" />
              <span>{hasCustomTemplateImage ? 'Change Blank Template' : 'Upload Blank Letterhead File'}</span>
            </button>
          )}

          {onOpenPdfOverlay && (
            <button
              onClick={onOpenPdfOverlay}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 shadow-sm transition cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-teal-700" />
              <span>Verify PDF Pages</span>
            </button>
          )}

          {onTogglePrintView && (
            <button
              onClick={onTogglePrintView}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 shadow-sm transition cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Full Print View</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          <button
            onClick={handleDocxDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-white hover:bg-slate-50 text-[#0A2540] border border-slate-300 shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Download .docx</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-[#0A2540] hover:bg-[#00A896] text-white shadow-sm transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Render Document Sheets */}
      <div ref={printRef} className="space-y-6 print:space-y-0">
        {pageChunks.map((chunk, pageIdx) => (
          <div
            key={pageIdx}
            className="bg-white border border-slate-300 shadow-xl rounded-sm max-w-4xl mx-auto min-h-[1050px] relative overflow-hidden font-serif text-slate-900 leading-relaxed text-base print:border-none print:shadow-none print:m-0 print:max-w-none print:min-h-[100vh] print:break-after-page"
            style={{
              paddingTop: hasCustomTemplateImage ? `${topPadding}px` : '48px',
              paddingBottom: hasCustomTemplateImage ? `${bottomPadding}px` : '48px',
              paddingLeft: `${sidePadding}px`,
              paddingRight: `${sidePadding}px`,
            }}
          >
            {/* Duplicated Background Template Image Layer for Every Page */}
            {hasCustomTemplateImage && (
              <div className="absolute inset-0 z-0 pointer-events-none select-none">
                <img
                  src={customLetterhead.templateImageBase64}
                  alt={`Blank Letterhead Template Page ${pageIdx + 1}`}
                  className="w-full h-full object-fill print:w-full print:h-full"
                />
              </div>
            )}

            {/* Page Content Overlay */}
            <div className="relative z-10 flex flex-col justify-between min-h-[950px]">
              <div>
                {/* Default Header when no full template image is uploaded */}
                {!hasCustomTemplateImage && pageIdx === 0 && (
                  <div className="border-b-2 border-black pb-4 mb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h1 className="text-2xl font-bold font-serif text-black uppercase tracking-tight">
                          {orgName}
                        </h1>
                        <p className="text-xs font-sans text-slate-700 uppercase font-semibold tracking-wider mt-0.5">
                          {deptName}
                        </p>
                        <p className="text-xs font-sans text-slate-600 mt-0.5">
                          {contactInfo}
                        </p>
                      </div>
                      <div className="text-right text-xs font-sans text-slate-700">
                        <p className="font-semibold">{refNumber}</p>
                        <p className="mt-0.5">{currentDate}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ref & Date header line when using custom uploaded blank template */}
                {hasCustomTemplateImage && (
                  <div className="flex justify-between items-center text-xs font-sans font-semibold text-slate-800 border-b border-slate-300 pb-2 mb-4">
                    <span>REF: {refNumber}</span>
                    <span>DATE: {currentDate}</span>
                  </div>
                )}

                {/* Target Recipient Header on Page 1 */}
                {targetOrg && pageIdx === 0 && (
                  <div className="mb-6 font-sans text-xs text-slate-800 bg-slate-50/80 backdrop-blur-sm p-3 rounded border border-slate-200 print:bg-transparent print:p-0 print:border-none">
                    <p className="font-bold text-slate-900 uppercase">OFFICIAL SUBMISSION FOR:</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{targetOrg}</p>
                  </div>
                )}

                {/* Paragraph Content for this page sheet */}
                <div className="prose prose-slate max-w-none prose-headings:font-serif prose-headings:text-black prose-headings:font-bold prose-p:text-slate-900 prose-p:leading-relaxed prose-li:text-slate-900">
                  {chunk.map((paragraph, idx) => {
                    if (paragraph.startsWith('SECTION') || paragraph.startsWith('#')) {
                      return (
                        <h2
                          key={idx}
                          className="text-lg font-bold border-b border-slate-300 pb-1 mt-6 mb-3 uppercase tracking-wide text-black"
                        >
                          {paragraph.replace(/^#+\s*/, '')}
                        </h2>
                      );
                    }
                    if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                      return (
                        <ul key={idx} className="list-disc pl-5 my-2 space-y-1">
                          {paragraph.split('\n').map((li, lIdx) => (
                            <li key={lIdx}>{li.replace(/^[-*]\s*/, '')}</li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <p key={idx} className="my-3 text-justify font-serif text-sm md:text-base leading-relaxed text-black">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              </div>

              {/* Signature / Page Footer on last page or page bottom */}
              <div className="mt-8 pt-4 border-t border-slate-300 font-sans text-xs text-slate-800 print:break-inside-avoid">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{deptName}</p>
                    <p className="text-slate-700 font-medium">{orgName}</p>
                    <p className="text-slate-500 mt-0.5 text-[11px]">
                      Authorized Copy — Page {pageIdx + 1} of {pageChunks.length}
                    </p>
                  </div>
                  {pageIdx === pageChunks.length - 1 && (
                    <div className="text-right">
                      <div className="w-32 border-b border-black mb-1"></div>
                      <p className="text-[11px] text-slate-600 font-semibold uppercase">
                        {customLetterhead?.sealText || 'Official Seal / Sign'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
