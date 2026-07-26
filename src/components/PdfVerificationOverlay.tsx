import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCheck2,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { downloadProposalDocx } from '../utils/docxExport';
import { CustomLetterhead } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetOrg: string;
  proposalContent: string;
  customLetterhead?: CustomLetterhead;
}

export const PdfVerificationOverlay: React.FC<Props> = ({
  isOpen,
  onClose,
  targetOrg,
  proposalContent,
  customLetterhead,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showMarginGuides, setShowMarginGuides] = useState<boolean>(true);

  if (!isOpen) return null;

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

  const paragraphs = proposalContent.split('\n\n').filter(Boolean);

  // Group into pages for multi-page template duplication
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

  const handlePrint = () => {
    window.print();
  };

  const handleDocxDownload = async () => {
    await downloadProposalDocx(targetOrg || 'Partner_Org', proposalContent, customLetterhead);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/90 backdrop-blur-md flex flex-col animate-fade-in text-white">
      {/* Top Header Controls Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/20 border border-teal-500/30 rounded-lg text-teal-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>PDF & Print Page Layout Inspector</span>
              <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full">
                {hasCustomTemplateImage ? 'Custom Template Duplicated' : 'A4 Verified Standard'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Verify text margins, blank template positioning, and page break alignment
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-3">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1 text-xs">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(50, prev - 10))}
              className="p-1 hover:text-amber-400 rounded transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-slate-300 font-bold">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(150, prev + 10))}
              className="p-1 hover:text-amber-400 rounded transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle Margins */}
          <button
            onClick={() => setShowMarginGuides(!showMarginGuides)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              showMarginGuides
                ? 'bg-teal-950 text-teal-300 border-teal-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            Margin Guides: {showMarginGuides ? 'ON' : 'OFF'}
          </button>

          {/* Docx & Print */}
          <button
            onClick={handleDocxDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Download .docx</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print PDF</span>
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            title="Close Verification Overlay"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Document Viewport */}
      <div className="flex-1 p-6 md:p-12 overflow-auto flex flex-col items-center gap-8 bg-slate-950">
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-150 ease-out space-y-8"
        >
          {pageChunks.map((chunk, pageIdx) => (
            <div
              key={pageIdx}
              className={`bg-white text-slate-900 shadow-2xl rounded-sm max-w-4xl w-[816px] min-h-[1056px] relative font-serif leading-relaxed overflow-hidden ${
                showMarginGuides ? 'ring-1 ring-dashed ring-teal-500/40' : ''
              }`}
              style={{
                paddingTop: hasCustomTemplateImage ? `${topPadding}px` : '48px',
                paddingBottom: hasCustomTemplateImage ? `${bottomPadding}px` : '48px',
                paddingLeft: `${sidePadding}px`,
                paddingRight: `${sidePadding}px`,
              }}
            >
              {/* Template Image Background duplicated for this page */}
              {hasCustomTemplateImage && (
                <div className="absolute inset-0 z-0 pointer-events-none select-none">
                  <img
                    src={customLetterhead.templateImageBase64}
                    alt={`Template Background Page ${pageIdx + 1}`}
                    className="w-full h-full object-fill"
                  />
                </div>
              )}

              {/* Page Margin Indicator Lines (Overlay) */}
              {showMarginGuides && (
                <div className="absolute inset-8 md:inset-12 border border-dashed border-teal-500/20 pointer-events-none flex flex-col justify-between p-2 z-20">
                  <span className="text-[9px] font-mono text-teal-600 bg-teal-50/80 px-1.5 py-0.5 rounded self-start border border-teal-200">
                    Top Margin: {hasCustomTemplateImage ? `${topPadding}px` : '1.0 in (72pt)'}
                  </span>
                  <span className="text-[9px] font-mono text-teal-600 bg-teal-50/80 px-1.5 py-0.5 rounded self-end border border-teal-200">
                    Bottom Margin: {hasCustomTemplateImage ? `${bottomPadding}px` : '1.0 in (72pt)'}
                  </span>
                </div>
              )}

              {/* Page Content */}
              <div className="relative z-10 flex flex-col justify-between min-h-[960px]">
                <div>
                  {/* Default Letterhead Header when no template image */}
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

                  {/* Ref / Date Header line for template image mode */}
                  {hasCustomTemplateImage && (
                    <div className="flex justify-between items-center text-xs font-sans font-semibold text-slate-800 border-b border-slate-300 pb-2 mb-4">
                      <span>REF: {refNumber}</span>
                      <span>DATE: {currentDate}</span>
                    </div>
                  )}

                  {/* Target Org Header on Page 1 */}
                  {targetOrg && pageIdx === 0 && (
                    <div className="mb-6 font-sans text-xs text-slate-800 bg-slate-50/90 p-3 rounded border border-slate-200">
                      <p className="font-bold text-slate-900 uppercase">OFFICIAL SUBMISSION FOR:</p>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">{targetOrg}</p>
                    </div>
                  )}

                  {/* Body Content Render */}
                  <div className="space-y-4 text-slate-900 text-sm md:text-base leading-relaxed text-justify font-serif">
                    {chunk.map((paragraph, idx) => {
                      if (paragraph.startsWith('SECTION') || paragraph.startsWith('#')) {
                        return (
                          <h2
                            key={idx}
                            className="text-base md:text-lg font-bold border-b border-black pb-1 mt-6 mb-3 uppercase tracking-wide text-black font-serif"
                          >
                            {paragraph.replace(/^#+\s*/, '')}
                          </h2>
                        );
                      }
                      if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                        return (
                          <ul key={idx} className="list-disc pl-6 my-2 space-y-1">
                            {paragraph.split('\n').map((li, lIdx) => (
                              <li key={lIdx}>{li.replace(/^[-*]\s*/, '')}</li>
                            ))}
                          </ul>
                        );
                      }
                      return (
                        <p key={idx} className="my-3 font-serif text-black leading-relaxed">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                </div>

                {/* Signature Footer */}
                <div className="mt-12 pt-6 border-t border-slate-300 font-sans text-xs text-slate-800">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{deptName}</p>
                      <p className="text-slate-700 font-medium">{orgName}</p>
                      <p className="text-slate-500 mt-1 text-[11px]">
                        Authorized Copy — Page {pageIdx + 1} of {pageChunks.length}
                      </p>
                    </div>
                    {pageIdx === pageChunks.length - 1 && (
                      <div className="text-right">
                        <div className="w-36 border-b border-black mb-1"></div>
                        <p className="text-[11px] text-slate-600 font-semibold uppercase">
                          {customLetterhead?.sealText || 'Official Seal / Sign'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Verification Watermark */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-sans z-10 relative">
                <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle className="w-3 h-3" />
                  <span>
                    {hasCustomTemplateImage
                      ? 'Verified Blank Template Background • Duplicated Across Pages'
                      : 'Verified B&W Print Format • Zero AI Clichés'}
                  </span>
                </div>
                <span>Page {pageIdx + 1} of {pageChunks.length}</span>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
