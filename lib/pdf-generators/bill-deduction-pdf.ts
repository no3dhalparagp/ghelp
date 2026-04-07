import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';

// ============================================================================
// INTERFACE DEFINITIONS
// ============================================================================

export interface BillDeductionPDFData {
  gpName: string;
  blockName: string;
  workName: string;
  activityCode: string;
  fund: string;
  estimatedAmount: string;
  nitNo: string;
  nitDate: string;
  workSlNo: string;
  woMemoNo: string;
  woDate: string;
  agreementNo: string;
  agreementDate: string;
  commencementDate: string;
  completionDate: string;
  measurementDate: string;
  agencyName: string;
  agencyAddress: string;
  grossBillAmount: number;
  deductions: {
    incomeTax: { percent: string; amount: number };
    gstTds: { percent: string; amount: number };
    labourCess: { percent: string; amount: number };
    securityDeposit: { percent: string; amount: number };
  };
  totalDeduction: number;
  netPayable: number;
  amountInWords: string;
  voucherNo: string;
  voucherDate: string;
  paymentDate: string;
}

// ============================================================================
// PDF CONFIGURATION – CONSISTENT PROFESSIONAL DESIGN
// ============================================================================

const CONFIG = {
  PAGE_SIZE: [595.28, 841.89] as [number, number], // A4 Portrait
  MARGIN: { TOP: 40, BOTTOM: 40, LEFT: 30, RIGHT: 30 },
  COLORS: {
    TEXT_MAIN: rgb(0.1, 0.1, 0.1),
    TEXT_MUTED: rgb(0.4, 0.4, 0.4),
    BORDER: rgb(0.8, 0.8, 0.8),
    HEADER_BG: rgb(0.96, 0.97, 0.98),
    ACCENT: rgb(0.2, 0.4, 0.6),
  },
  FONTS: {
    TITLE: 14,
    SUBTITLE: 10,
    HEADER: 9,
    NORMAL: 9,
    SMALL: 8,
    FOOTER: 7,
  },
  SPACING: {
    LINE_HEIGHT: 13,
    SECTION_GAP: 20,
    COL_GAP: 20,
  }
};

// ============================================================================
// GENERATOR CLASS
// ============================================================================

class BillDeductionGenerator {
  private pdfDoc!: PDFDocument;
  private page!: PDFPage;
  private y!: number;
  private width!: number;
  private height!: number;
  private fonts!: {
    regular: PDFFont;
    bold: PDFFont;
    serif: PDFFont;
    serifBold: PDFFont;
  };
  private data: BillDeductionPDFData;

  constructor(data: BillDeductionPDFData) {
    this.data = this.preprocessData(data);
  }

  private preprocessData(data: BillDeductionPDFData): BillDeductionPDFData {
    const clean = (text: string | undefined) =>
      text ? text.replace(/\r/g, '').replace(/[^\x00-\x7F\x0A]/g, '?').trim() : '';

    return {
      ...data,
      workName: clean(data.workName),
      agencyName: clean(data.agencyName),
      agencyAddress: clean(data.agencyAddress),
      amountInWords: clean(data.amountInWords),
    };
  }

  async generate(): Promise<Uint8Array> {
    this.pdfDoc = await PDFDocument.create();
    this.fonts = {
      regular: await this.pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await this.pdfDoc.embedFont(StandardFonts.HelveticaBold),
      serif: await this.pdfDoc.embedFont(StandardFonts.TimesRoman),
      serifBold: await this.pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    };

    this.addNewPage();
    this.drawMainHeader();
    this.drawSplitSection();
    this.drawCertifications();
    this.drawSignaturesAndStamp();
    this.drawFooter();

    return await this.pdfDoc.save();
  }

  private addNewPage() {
    this.page = this.pdfDoc.addPage(CONFIG.PAGE_SIZE);
    const { width, height } = this.page.getSize();
    this.width = width;
    this.height = height;
    this.y = height - CONFIG.MARGIN.TOP;
  }

  private drawMainHeader() {
    const title = this.data.gpName.toUpperCase();
    const subTitle = `${this.data.blockName.toUpperCase()}, DAKSHIN DINAJPUR`;

    const tw1 = this.fonts.serifBold.widthOfTextAtSize(title, CONFIG.FONTS.TITLE);
    this.page.drawText(title, {
      x: (this.width - tw1) / 2,
      y: this.y,
      size: CONFIG.FONTS.TITLE,
      font: this.fonts.serifBold,
      color: CONFIG.COLORS.ACCENT,
    });
    this.page.drawLine({
      start: { x: (this.width - tw1) / 2, y: this.y - 2 },
      end: { x: (this.width + tw1) / 2, y: this.y - 2 },
      thickness: 1,
      color: CONFIG.COLORS.ACCENT,
    });

    this.y -= 18;
    const tw2 = this.fonts.serif.widthOfTextAtSize(subTitle, CONFIG.FONTS.SUBTITLE);
    this.page.drawText(subTitle, {
      x: (this.width - tw2) / 2,
      y: this.y,
      size: CONFIG.FONTS.SUBTITLE,
      font: this.fonts.serif,
      color: CONFIG.COLORS.TEXT_MAIN,
    });
    this.page.drawLine({
      start: { x: (this.width - tw2) / 2, y: this.y - 2 },
      end: { x: (this.width + tw2) / 2, y: this.y - 2 },
      thickness: 0.5,
      color: CONFIG.COLORS.TEXT_MUTED,
    });

    this.y -= CONFIG.SPACING.SECTION_GAP;
  }

  private drawSplitSection() {
    const midX = this.width / 2;
    const topY = this.y;
    
    // Left Side: Work Details
    this.drawWorkDetails(CONFIG.MARGIN.LEFT, midX - CONFIG.SPACING.COL_GAP / 2);
    
    const leftBottomY = this.y;
    
    // Right Side: Bill Details
    this.y = topY;
    this.drawBillDetails(midX + CONFIG.SPACING.COL_GAP / 2, this.width - CONFIG.MARGIN.RIGHT);
    
    const rightBottomY = this.y;
    
    // Vertical Separator
    const finalY = Math.min(leftBottomY, rightBottomY) - 10;
    this.page.drawLine({
      start: { x: midX, y: topY + 5 },
      end: { x: midX, y: finalY + 5 },
      thickness: 0.5,
      color: CONFIG.COLORS.BORDER,
    });
    
    this.y = finalY;
  }

  private drawWorkDetails(startX: number, endX: number) {
    const drawField = (label: string, value: string, isBold: boolean = false) => {
      this.page.drawText(label, { x: startX, y: this.y, size: CONFIG.FONTS.SMALL, font: this.fonts.bold, color: CONFIG.COLORS.TEXT_MUTED });
      this.y -= CONFIG.SPACING.LINE_HEIGHT;
      
      const lines = this.splitText(value, isBold ? this.fonts.bold : this.fonts.regular, CONFIG.FONTS.NORMAL, endX - startX);
      lines.forEach(line => {
        this.page.drawText(line, { x: startX, y: this.y, size: CONFIG.FONTS.NORMAL, font: isBold ? this.fonts.bold : this.fonts.regular, color: CONFIG.COLORS.TEXT_MAIN });
        this.y -= CONFIG.SPACING.LINE_HEIGHT;
      });
      this.y -= 4;
    };

    drawField('NAME OF WORK:', this.data.workName, true);
    drawField('ACTIVITY CODE:', this.data.activityCode, true);
    drawField('FUND:', this.data.fund);
    drawField('ESTIMATED AMOUNT:', `Rs. ${this.data.estimatedAmount}`);
    drawField('NIT NO & DATE:', `${this.data.nitNo} dt. ${this.data.nitDate}`);
    drawField('WORK ORDER:', `${this.data.woMemoNo} dt. ${this.data.woDate}`);
    drawField('AGREEMENT:', `${this.data.agreementNo || 'N/A'} dt. ${this.data.agreementDate || 'N/A'}`);
    drawField('DATES:', `Commencement: ${this.data.commencementDate}\nCompletion: ${this.data.completionDate}\nMeasurement: ${this.data.measurementDate}`);
    drawField('AGENCY:', `${this.data.agencyName}\n${this.data.agencyAddress}`);
  }

  private drawBillDetails(startX: number, endX: number) {
    const title = 'BILL DETAILS';
    const tw = this.fonts.bold.widthOfTextAtSize(title, CONFIG.FONTS.SUBTITLE);
    this.page.drawText(title, { x: startX + (endX - startX - tw) / 2, y: this.y, size: CONFIG.FONTS.SUBTITLE, font: this.fonts.bold, color: CONFIG.COLORS.ACCENT });
    this.y -= CONFIG.SPACING.LINE_HEIGHT * 1.5;

    const drawRow = (label: string, value: string, isBold: boolean = false, isAccent: boolean = false) => {
      const font = isBold ? this.fonts.bold : this.fonts.regular;
      const color = isAccent ? CONFIG.COLORS.ACCENT : CONFIG.COLORS.TEXT_MAIN;
      this.page.drawText(label, { x: startX, y: this.y, size: CONFIG.FONTS.NORMAL, font, color });
      
      const valW = font.widthOfTextAtSize(value, CONFIG.FONTS.NORMAL);
      this.page.drawText(value, { x: endX - valW, y: this.y, size: CONFIG.FONTS.NORMAL, font, color });
      this.y -= CONFIG.SPACING.LINE_HEIGHT * 1.2;
    };

    drawRow('Gross Bill Amount:', `Rs. ${this.data.grossBillAmount.toFixed(2)}`, true);
    this.y -= 5;
    this.page.drawLine({ start: { x: startX, y: this.y + 2 }, end: { x: endX, y: this.y + 2 }, thickness: 0.5, color: CONFIG.COLORS.BORDER });
    this.y -= 8;

    this.page.drawText('Deductions:', { x: startX, y: this.y, size: CONFIG.FONTS.SMALL, font: this.fonts.bold, color: CONFIG.COLORS.TEXT_MUTED });
    this.y -= CONFIG.SPACING.LINE_HEIGHT;

    const { incomeTax, gstTds, labourCess, securityDeposit } = this.data.deductions;
    drawRow(`Less Income Tax (${incomeTax.percent}%):`, incomeTax.amount.toFixed(2));
    drawRow(`Less GST TDS (${gstTds.percent}%):`, gstTds.amount.toFixed(2));
    drawRow(`Less Labour Cess (${labourCess.percent}%):`, labourCess.amount.toFixed(2));
    if (securityDeposit.amount > 0) {
      drawRow(`Less Security Deposit (${securityDeposit.percent}%):`, securityDeposit.amount.toFixed(2));
    }

    this.y -= 5;
    this.page.drawLine({ start: { x: startX, y: this.y + 2 }, end: { x: endX, y: this.y + 2 }, thickness: 0.5, color: CONFIG.COLORS.BORDER });
    this.y -= 8;

    drawRow('Total Deduction:', `Rs. ${this.data.totalDeduction.toFixed(2)}`, true);
    
    this.y -= 10;
    this.page.drawRectangle({ x: startX - 5, y: this.y - 12, width: endX - startX + 10, height: 22, color: CONFIG.COLORS.HEADER_BG });
    this.y -= 4;
    drawRow('NET PAYABLE:', `Rs. ${this.data.netPayable.toFixed(2)}`, true, true);

    this.y -= CONFIG.SPACING.SECTION_GAP;
    const words = `[Amount in words: ${this.data.amountInWords}]`;
    const wordLines = this.splitText(words, this.fonts.bold, CONFIG.FONTS.SMALL, endX - startX);
    wordLines.forEach(l => {
      this.page.drawText(l, { x: startX, y: this.y, size: CONFIG.FONTS.SMALL, font: this.fonts.bold, color: CONFIG.COLORS.TEXT_MAIN });
      this.y -= CONFIG.SPACING.LINE_HEIGHT;
    });
  }

  private drawCertifications() {
    this.y -= CONFIG.SPACING.SECTION_GAP;
    const cert = "Certified that all necessary checks have been applied as per Govt. Rules and the payment has been made to the proper party. The bill has been entered in the Cash Book and paid via PFMS/Cheque.";
    const lines = this.splitText(cert, this.fonts.regular, CONFIG.FONTS.NORMAL, this.width - CONFIG.MARGIN.LEFT - CONFIG.MARGIN.RIGHT);
    lines.forEach(l => {
      this.page.drawText(l, { x: CONFIG.MARGIN.LEFT, y: this.y, size: CONFIG.FONTS.NORMAL, font: this.fonts.regular, color: CONFIG.COLORS.TEXT_MUTED });
      this.y -= CONFIG.SPACING.LINE_HEIGHT;
    });
  }

  private drawSignaturesAndStamp() {
    this.y -= CONFIG.SPACING.SECTION_GAP * 2;
    
    // Stamp Box
    const stampX = this.width - CONFIG.MARGIN.RIGHT - 80;
    this.page.drawRectangle({
      x: stampX,
      y: this.y,
      width: 80,
      height: 60,
      borderColor: CONFIG.COLORS.BORDER,
      borderWidth: 1,
    });
    this.page.drawText("Affix Revenue\nStamp here", { x: stampX + 10, y: this.y + 35, size: 7, font: this.fonts.regular, color: CONFIG.COLORS.TEXT_MUTED, lineHeight: 10 });

    this.y -= 40;
    const sigs = ['E.A. / SECRETARY', 'PRADHAN', 'CONTRACTOR'];
    const sigW = (this.width - CONFIG.MARGIN.LEFT - CONFIG.MARGIN.RIGHT) / 3;

    sigs.forEach((sig, i) => {
      const sx = CONFIG.MARGIN.LEFT + i * sigW;
      this.page.drawLine({ start: { x: sx + 10, y: this.y + 20 }, end: { x: sx + sigW - 10, y: this.y + 20 }, thickness: 0.5, color: CONFIG.COLORS.BORDER });
      const tw = this.fonts.bold.widthOfTextAtSize(sig, CONFIG.FONTS.SMALL);
      this.page.drawText(sig, { x: sx + (sigW - tw) / 2, y: this.y, size: CONFIG.FONTS.SMALL, font: this.fonts.bold, color: CONFIG.COLORS.TEXT_MAIN });
    });
  }

  private drawFooter() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const text = `Generated on: ${dateStr} | ${this.data.gpName}`;
    const tw = this.fonts.regular.widthOfTextAtSize(text, CONFIG.FONTS.FOOTER);
    this.page.drawText(text, {
      x: (this.width - tw) / 2,
      y: CONFIG.MARGIN.BOTTOM / 2,
      size: CONFIG.FONTS.FOOTER,
      font: this.fonts.regular,
      color: CONFIG.COLORS.TEXT_MUTED,
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
        if (font.widthOfTextAtSize(testLine, size) <= maxWidth) {
          currentLine = testLine;
        } else {
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

export async function generateBillDeductionPDF(data: BillDeductionPDFData): Promise<Uint8Array> {
  const generator = new BillDeductionGenerator(data);
  return await generator.generate();
}
