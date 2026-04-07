import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage, RGB } from 'pdf-lib';

// ============================================================================
// INTERFACE DEFINITIONS
// ============================================================================

export interface BillAbstractEntry {
  workItemDescription: string;
  mbNumber: string;
  mbPageNumber: string;
  quantityExecuted: number;
  unit: string;
  rate: number;
  amount: number;
  remarks?: string;
  isHeader?: boolean;
  isSubItem?: boolean;
  slNo?: string;
}

export interface BillAbstractPDFData {
  billType: string;
  projectName: string;
  projectLocation: string;
  entries: BillAbstractEntry[];
  itemwiseTotal: number;
  contractualPercent: string;
  contractualDeduction: number;
  actualValue: number;
  sayAmount: number;
  cgstPercent: string;
  cgstAmount: number;
  sgstPercent: string;
  sgstAmount: number;
  lwcPercent: string;
  lwcAmount: number;
  subTotal: number;
  grossBillAmount: number;
  mbNumber: string;
  mbPages: string;
}

// ============================================================================
// PDF CONFIGURATION – MODERN PROFESSIONAL DESIGN
// ============================================================================

const CONFIG = {
  PAGE_SIZE: [595.28, 841.89] as [number, number],
  MARGIN: { TOP: 30, BOTTOM: 30, LEFT: 20, RIGHT: 20 },
  COLORS: {
    TEXT_MAIN: rgb(0.1, 0.1, 0.1),
    TEXT_MUTED: rgb(0.4, 0.4, 0.4),
    BORDER: rgb(0.8, 0.8, 0.8),
    HEADER_BG: rgb(0.96, 0.97, 0.98), // Subtle blue-gray
    ROW_ALT_BG: rgb(0.99, 0.99, 0.99),
    ACCENT: rgb(0.2, 0.4, 0.6), // Professional blue
  },
  FONTS: {
    TITLE: 14,
    SUBTITLE: 10,
    HEADER: 8,
    NORMAL: 8,
    SMALL: 7,
    FOOTER: 7,
  },
  SPACING: {
    LINE_HEIGHT: 12,
    SECTION_GAP: 18,
    CELL_PADDING: 4,
  },
  COLUMN_WIDTHS: [20, 290, 40, 45, 30, 40, 45, 40],
};

// ============================================================================
// GENERATOR CLASS
// ============================================================================

class BillAbstractGenerator {
  private pdfDoc!: PDFDocument;
  private page!: PDFPage;
  private y!: number;
  private width!: number;
  private height!: number;
  private fonts!: {
    regular: PDFFont;
    bold: PDFFont;
  };
  private data: BillAbstractPDFData;
  private colX: number[] = [];

  constructor(data: BillAbstractPDFData) {
    this.data = this.preprocessData(data);
    this.calculateColumnPositions();
  }

  private preprocessData(data: BillAbstractPDFData): BillAbstractPDFData {
    const clean = (text: string | undefined) =>
      text
        ? text
            .replace(/\r/g, '')
            .replace(/[^\x00-\x7F\x0A]/g, '?')
            .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '')
            .trim()
        : '';

    return {
      ...data,
      billType: clean(data.billType),
      projectName: clean(data.projectName),
      projectLocation: clean(data.projectLocation),
      entries: data.entries.map(e => ({
        ...e,
        workItemDescription: clean(e.workItemDescription),
        unit: clean(e.unit),
        remarks: e.remarks ? clean(e.remarks) : undefined,
        mbNumber: clean(e.mbNumber),
        mbPageNumber: clean(e.mbPageNumber),
      })),
      mbNumber: clean(data.mbNumber),
      mbPages: clean(data.mbPages),
    };
  }

  private calculateColumnPositions() {
    let currentX = CONFIG.MARGIN.LEFT;
    CONFIG.COLUMN_WIDTHS.forEach(width => {
      this.colX.push(currentX);
      currentX += width;
    });
  }

  async generate(): Promise<Uint8Array> {
    this.pdfDoc = await PDFDocument.create();
    this.fonts = {
      regular: await this.pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await this.pdfDoc.embedFont(StandardFonts.HelveticaBold),
    };

    this.addNewPage();
    this.drawHeader();
    this.drawTable();
    this.drawCalculationSection();
    this.drawCertificateAndSignatures();
    this.drawPageNumbers();

    return await this.pdfDoc.save();
  }

  private addNewPage() {
    this.page = this.pdfDoc.addPage(CONFIG.PAGE_SIZE);
    const { width, height } = this.page.getSize();
    this.width = width;
    this.height = height;
    this.y = height - CONFIG.MARGIN.TOP;
  }

  private checkPageBreak(neededSpace: number) {
    if (this.y - neededSpace < CONFIG.MARGIN.BOTTOM) {
      this.addNewPage();
      // Draw a small indicator that it's a continuation
      this.page.drawText('(Continued from previous page)', {
        x: CONFIG.MARGIN.LEFT,
        y: this.y,
        size: CONFIG.FONTS.SMALL,
        font: this.fonts.regular,
        color: CONFIG.COLORS.TEXT_MUTED,
      });
      this.y -= CONFIG.SPACING.LINE_HEIGHT * 1.5;
      return true;
    }
    return false;
  }

  private drawHeader() {
    // Title
    const title = 'BILL ABSTRACT FORM';
    const titleWidth = this.fonts.bold.widthOfTextAtSize(title, CONFIG.FONTS.TITLE);
    this.page.drawText(title, {
      x: (this.width - titleWidth) / 2,
      y: this.y,
      size: CONFIG.FONTS.TITLE,
      font: this.fonts.bold,
      color: CONFIG.COLORS.ACCENT,
    });
    this.y -= CONFIG.SPACING.LINE_HEIGHT * 1.5;

    // Bill Type
    const billType = this.data.billType.toUpperCase();
    const btWidth = this.fonts.bold.widthOfTextAtSize(billType, CONFIG.FONTS.SUBTITLE);
    this.page.drawText(billType, {
      x: (this.width - btWidth) / 2,
      y: this.y,
      size: CONFIG.FONTS.SUBTITLE,
      font: this.fonts.bold,
      color: CONFIG.COLORS.TEXT_MAIN,
    });
    this.y -= CONFIG.SPACING.SECTION_GAP;

    // Project Info
    this.page.drawText('NAME OF WORK:', {
      x: CONFIG.MARGIN.LEFT,
      y: this.y,
      size: CONFIG.FONTS.HEADER,
      font: this.fonts.bold,
      color: CONFIG.COLORS.TEXT_MUTED,
    });
    this.y -= CONFIG.SPACING.LINE_HEIGHT;

    const projectText = this.data.projectLocation
      ? `${this.data.projectName}, ${this.data.projectLocation}`
      : this.data.projectName;

    const lines = this.splitText(projectText, this.fonts.bold, CONFIG.FONTS.NORMAL, this.width - CONFIG.MARGIN.LEFT - CONFIG.MARGIN.RIGHT);
    lines.forEach(line => {
      this.page.drawText(line, {
        x: CONFIG.MARGIN.LEFT,
        y: this.y,
        size: CONFIG.FONTS.NORMAL,
        font: this.fonts.bold,
        color: CONFIG.COLORS.TEXT_MAIN,
      });
      this.y -= CONFIG.SPACING.LINE_HEIGHT;
    });

    this.y -= CONFIG.SPACING.SECTION_GAP / 2;
  }

  private drawTable() {
    this.drawTableHeader();

    let visibleRowIndex = 0;
    this.data.entries.forEach((entry, i) => {
      const isHeader = !!entry.isHeader;
      const rowIndex = isHeader ? -1 : visibleRowIndex++;
      this.drawTableRow(i + 1, entry, rowIndex);
    });

    // Total row
    const totalAmount = this.data.entries.reduce((sum, e) => sum + (e.isHeader ? 0 : e.amount), 0);
    this.drawTableRow(null, {
      workItemDescription: 'TOTAL WORK VALUE',
      mbNumber: '',
      mbPageNumber: '',
      quantityExecuted: 0,
      unit: '',
      rate: 0,
      amount: totalAmount,
    }, -1, true);

    // Bottom border of table
    this.page.drawLine({
      start: { x: CONFIG.MARGIN.LEFT, y: this.y },
      end: { x: this.width - CONFIG.MARGIN.RIGHT, y: this.y },
      thickness: 1,
      color: CONFIG.COLORS.BORDER,
    });
    this.y -= CONFIG.SPACING.SECTION_GAP;
  }

  private drawTableHeader() {
    const headerHeight = 30;
    this.page.drawRectangle({
      x: CONFIG.MARGIN.LEFT,
      y: this.y - headerHeight,
      width: this.width - CONFIG.MARGIN.LEFT - CONFIG.MARGIN.RIGHT,
      height: headerHeight,
      color: CONFIG.COLORS.HEADER_BG,
    });

    // Borders
    const topY = this.y;
    const bottomY = this.y - headerHeight;
    this.page.drawLine({
      start: { x: CONFIG.MARGIN.LEFT, y: topY },
      end: { x: this.width - CONFIG.MARGIN.RIGHT, y: topY },
      thickness: 1,
      color: CONFIG.COLORS.BORDER,
    });
    this.page.drawLine({
      start: { x: CONFIG.MARGIN.LEFT, y: bottomY },
      end: { x: this.width - CONFIG.MARGIN.RIGHT, y: bottomY },
      thickness: 1.5,
      color: CONFIG.COLORS.ACCENT,
    });

    const headers = ['SL.', 'ITEM DESCRIPTION', 'MB NO. / PAGE', 'QTY', 'UNIT', 'RATE', 'AMOUNT', 'REMARKS'];
    headers.forEach((text, i) => {
      const lines = text.split(' / ');
      let lineY = this.y - 10;
      lines.forEach(line => {
        const tw = this.fonts.bold.widthOfTextAtSize(line, CONFIG.FONTS.HEADER);
        const tx = this.colX[i] + (CONFIG.COLUMN_WIDTHS[i] - tw) / 2;
        this.page.drawText(line, {
          x: tx,
          y: lineY,
          size: CONFIG.FONTS.HEADER,
          font: this.fonts.bold,
          color: CONFIG.COLORS.ACCENT,
        });
        lineY -= CONFIG.SPACING.LINE_HEIGHT;
      });

      if (i > 0) {
        this.page.drawLine({
          start: { x: this.colX[i], y: topY },
          end: { x: this.colX[i], y: bottomY },
          thickness: 1,
          color: CONFIG.COLORS.BORDER,
        });
      }
    });

    this.y = bottomY;
  }

  private drawTableRow(index: number | null, entry: BillAbstractEntry, rowIndex: number, isTotal: boolean = false) {
    const isHeader = !!entry.isHeader;
    const isSubItem = !!entry.isSubItem || /^(?:[a-z]\)|\([a-z]\)|[ivx]+\)|\([ivx]+\))/.test(entry.workItemDescription.trim().toLowerCase());
    const serial = entry.slNo || (index ? index.toString() : '');

    const mbText = (entry.mbNumber || entry.mbPageNumber)
      ? `${entry.mbNumber ? 'MB-' + entry.mbNumber : ''} ${entry.mbPageNumber ? 'P-' + entry.mbPageNumber : ''}`.trim()
      : '';

    const cells = [
      serial,
      (isSubItem ? '  • ' : '') + entry.workItemDescription,
      mbText,
      entry.quantityExecuted ? entry.quantityExecuted.toFixed(3) : '',
      entry.unit || '',
      entry.rate ? entry.rate.toFixed(2) : '',
      entry.amount.toFixed(2),
      entry.remarks || '',
    ];

    // Compute lines and height
    const cellLines: string[][] = cells.map((text, i) => 
      this.splitText(text, isHeader || isTotal ? this.fonts.bold : this.fonts.regular, CONFIG.FONTS.NORMAL, CONFIG.COLUMN_WIDTHS[i] - CONFIG.SPACING.CELL_PADDING * 2)
    );
    const maxLines = Math.max(...cellLines.map(l => l.length));
    const rowHeight = Math.max(20, maxLines * CONFIG.SPACING.LINE_HEIGHT + CONFIG.SPACING.CELL_PADDING * 2);

    if (this.checkPageBreak(rowHeight)) {
      this.drawTableHeader();
    }

    // Row Background
    if (!isHeader && !isTotal && rowIndex % 2 === 0) {
      this.page.drawRectangle({
        x: CONFIG.MARGIN.LEFT,
        y: this.y - rowHeight,
        width: this.width - CONFIG.MARGIN.LEFT - CONFIG.MARGIN.RIGHT,
        height: rowHeight,
        color: CONFIG.COLORS.ROW_ALT_BG,
      });
    }

    // Draw Content
    const rowTopY = this.y;
    const rowBottomY = this.y - rowHeight;

    cellLines.forEach((lines, i) => {
      let lineY = rowTopY - CONFIG.SPACING.CELL_PADDING - CONFIG.FONTS.NORMAL;
      const font = (isHeader || isTotal) ? this.fonts.bold : this.fonts.regular;
      const color = (isHeader || isTotal) ? CONFIG.COLORS.TEXT_MAIN : CONFIG.COLORS.TEXT_MAIN;

      lines.forEach(line => {
        const tw = font.widthOfTextAtSize(line, CONFIG.FONTS.NORMAL);
        let tx = this.colX[i] + CONFIG.SPACING.CELL_PADDING;

        // Alignment
        if ([0, 2, 4].includes(i)) { // SL, MB, Unit centered
          tx = this.colX[i] + (CONFIG.COLUMN_WIDTHS[i] - tw) / 2;
        } else if ([3, 5, 6].includes(i)) { // Qty, Rate, Amount right
          tx = this.colX[i] + CONFIG.COLUMN_WIDTHS[i] - tw - CONFIG.SPACING.CELL_PADDING;
        }

        this.page.drawText(line, { x: tx, y: lineY, size: CONFIG.FONTS.NORMAL, font, color });
        lineY -= CONFIG.SPACING.LINE_HEIGHT;
      });

      // Vertical separators
      if (i > 0) {
        this.page.drawLine({
          start: { x: this.colX[i], y: rowTopY },
          end: { x: this.colX[i], y: rowBottomY },
          thickness: 0.5,
          color: CONFIG.COLORS.BORDER,
        });
      }
    });

    // Row Bottom Border
    this.page.drawLine({
      start: { x: CONFIG.MARGIN.LEFT, y: rowBottomY },
      end: { x: this.width - CONFIG.MARGIN.RIGHT, y: rowBottomY },
      thickness: isTotal ? 1 : 0.5,
      color: isTotal ? CONFIG.COLORS.TEXT_MAIN : CONFIG.COLORS.BORDER,
    });

    this.y = rowBottomY;
  }

  private drawCalculationSection() {
    this.checkPageBreak(180);
    this.y -= CONFIG.SPACING.SECTION_GAP;

    const blockWidth = 250;
    const startX = this.width - CONFIG.MARGIN.RIGHT - blockWidth;
    const labelX = startX + 10;
    const valueX = this.width - CONFIG.MARGIN.RIGHT - 10;

    const drawLine = (label: string, value: string, isBold: boolean = false) => {
      const font = isBold ? this.fonts.bold : this.fonts.regular;
      const color = isBold ? CONFIG.COLORS.ACCENT : CONFIG.COLORS.TEXT_MAIN;
      
      this.page.drawText(label, { x: labelX, y: this.y, size: CONFIG.FONTS.NORMAL, font, color });
      
      const valW = font.widthOfTextAtSize(value, CONFIG.FONTS.NORMAL);
      this.page.drawText(value, { x: valueX - valW, y: this.y, size: CONFIG.FONTS.NORMAL, font, color });
      
      this.y -= CONFIG.SPACING.LINE_HEIGHT * 1.2;
    };

    // Border around calculation block
    const blockStartY = this.y + 10;
    
    drawLine('ITEM-WISE TOTAL:', this.data.itemwiseTotal.toFixed(2), true);
    drawLine(`Less Contractor (${this.data.contractualPercent}%):`, this.data.contractualDeduction.toFixed(2));
    drawLine('ACTUAL VALUE:', this.data.actualValue.toFixed(2), true);
    drawLine('SAY:', this.data.sayAmount.toFixed(2), true);
    
    this.y -= 5;
    this.page.drawLine({ start: { x: labelX, y: this.y + 2 }, end: { x: valueX, y: this.y + 2 }, thickness: 0.5, color: CONFIG.COLORS.BORDER });
    this.y -= 5;

    drawLine(`Add CGST (${this.data.cgstPercent}%):`, this.data.cgstAmount.toFixed(2));
    drawLine(`Add SGST (${this.data.sgstPercent}%):`, this.data.sgstAmount.toFixed(2));
    drawLine('SUB TOTAL:', this.data.subTotal.toFixed(2), true);
    drawLine(`Add L.W. Cess (${this.data.lwcPercent}%):`, this.data.lwcAmount.toFixed(2));
    
    this.y -= 5;
    this.page.drawRectangle({
      x: startX,
      y: this.y - 15,
      width: blockWidth,
      height: 25,
      color: CONFIG.COLORS.HEADER_BG,
    });
    this.y -= 10;
    drawLine('GROSS BILL AMOUNT:', this.data.grossBillAmount.toFixed(2), true);

    // Draw box
    this.page.drawRectangle({
      x: startX,
      y: this.y - 5,
      width: blockWidth,
      height: blockStartY - this.y + 5,
      borderWidth: 1,
      borderColor: CONFIG.COLORS.BORDER,
    });

    this.y -= CONFIG.SPACING.SECTION_GAP;
  }

  private drawCertificateAndSignatures() {
    const certText = `Certified that the foregoing claim is correct and the necessary measurements were made by me and are recorded at page(s) ${this.data.mbPages} of Measurement Book No. ${this.data.mbNumber}. And that the work has been satisfactorily performed as per specification.`;
    const lines = this.splitText(certText, this.fonts.regular, CONFIG.FONTS.SMALL, this.width - CONFIG.MARGIN.LEFT - CONFIG.MARGIN.RIGHT);
    
    this.checkPageBreak(lines.length * CONFIG.SPACING.LINE_HEIGHT + 100);

    lines.forEach(line => {
      this.page.drawText(line, { x: CONFIG.MARGIN.LEFT, y: this.y, size: CONFIG.FONTS.SMALL, font: this.fonts.regular, color: CONFIG.COLORS.TEXT_MUTED });
      this.y -= CONFIG.SPACING.LINE_HEIGHT;
    });

    this.y -= CONFIG.SPACING.SECTION_GAP * 2;

    const signatures = ['CONTRACTOR', 'NIRMAN SAHAYAK', 'E.A. / SECRETARY', 'PRADHAN'];
    const sigWidth = (this.width - CONFIG.MARGIN.LEFT - CONFIG.MARGIN.RIGHT) / 4;

    signatures.forEach((sig, i) => {
      const sx = CONFIG.MARGIN.LEFT + i * sigWidth;
      const tw = this.fonts.bold.widthOfTextAtSize(sig, CONFIG.FONTS.SMALL);
      
      // Line for signature
      this.page.drawLine({
        start: { x: sx + 10, y: this.y + 20 },
        end: { x: sx + sigWidth - 10, y: this.y + 20 },
        thickness: 0.5,
        color: CONFIG.COLORS.TEXT_MUTED,
      });

      this.page.drawText(sig, {
        x: sx + (sigWidth - tw) / 2,
        y: this.y,
        size: CONFIG.FONTS.SMALL,
        font: this.fonts.bold,
        color: CONFIG.COLORS.TEXT_MAIN,
      });
    });
  }

  private drawPageNumbers() {
    const pages = this.pdfDoc.getPages();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const genText = `Generated on: ${dateStr} ${timeStr}`;

    pages.forEach((page, i) => {
      const pageText = `Page ${i + 1} of ${pages.length}`;
      const twPage = this.fonts.regular.widthOfTextAtSize(pageText, CONFIG.FONTS.FOOTER);
      
      // Page Number (Center)
      page.drawText(pageText, {
        x: (this.width - twPage) / 2,
        y: CONFIG.MARGIN.BOTTOM / 2,
        size: CONFIG.FONTS.FOOTER,
        font: this.fonts.regular,
        color: CONFIG.COLORS.TEXT_MUTED,
      });
    });
  }

  private splitText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    if (!text) return [''];
    const paragraphs = text.split('\n');
    const allLines: string[] = [];

    paragraphs.forEach(para => {
      const words = para.split(' ');
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        try {
          const width = font.widthOfTextAtSize(testLine, size);
          if (width <= maxWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) allLines.push(currentLine);
            currentLine = word;
          }
        } catch {
          // Fallback for rare font issues
          if (currentLine) allLines.push(currentLine);
          currentLine = word;
        }
      });
      if (currentLine) allLines.push(currentLine);
    });
    return allLines;
  }
}

// ============================================================================
// EXPORTED FUNCTION
// ============================================================================

export async function generateBillAbstractPDF(data: BillAbstractPDFData): Promise<Uint8Array> {
  const generator = new BillAbstractGenerator(data);
  return await generator.generate();
}
