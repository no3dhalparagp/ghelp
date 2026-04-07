import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";

// ============================================================================
// INTERFACE DEFINITIONS
// ============================================================================

export interface MBMeasurement {
  no: number;
  l: number;
  b: number;
  d: number;
}

export interface MBItem {
  description: string;
  remarks?: string;
  measurements: MBMeasurement[];
}

export interface MBData {
  mbNumber: string;
  workName: string;
  location: string;
  contractor: string;
  agreementNo: string;
  agreementDate: string;
  estimateAmount: string;
  items: MBItem[];
}

// ============================================================================
// PDF CONFIGURATION – MODERN PROFESSIONAL DESIGN (Landscape)
// ============================================================================

const CONFIG = {
  PAGE_SIZE: [841.89, 595.28] as [number, number], // A4 Landscape
  MARGIN: { TOP: 30, BOTTOM: 40, LEFT: 30, RIGHT: 30 },
  COLORS: {
    TEXT_MAIN: rgb(0.1, 0.1, 0.1),
    TEXT_MUTED: rgb(0.4, 0.4, 0.4),
    BORDER: rgb(0.8, 0.8, 0.8),
    HEADER_BG: rgb(0.96, 0.97, 0.98),
    ACCENT: rgb(0.2, 0.4, 0.6),
  },
  FONTS: {
    TITLE: 12,
    SUBTITLE: 9,
    HEADER: 8,
    NORMAL: 8,
    SMALL: 7,
    FOOTER: 7,
  },
  SPACING: {
    LINE_HEIGHT: 12,
    SECTION_GAP: 15,
    CELL_PADDING: 4,
  },
  // Column widths for Landscape MB
  COLUMN_WIDTHS: [25, 300, 35, 45, 45, 45, 60, 75, 150],
};

// ============================================================================
// GENERATOR CLASS
// ============================================================================

class MeasurementBookGenerator {
  private pdfDoc!: PDFDocument;
  private page!: PDFPage;
  private y!: number;
  private width!: number;
  private height!: number;
  private fonts!: {
    regular: PDFFont;
    bold: PDFFont;
  };
  private data: MBData;
  private colX: number[] = [];
  private cumulativeQty: number = 0;

  constructor(data: MBData) {
    this.data = this.preprocessData(data);
    this.calculateColumnPositions();
  }

  private preprocessData(data: MBData): MBData {
    const clean = (text: string | undefined) =>
      text ? text.replace(/\r/g, '').replace(/[^\x00-\x7F\x0A]/g, '?').trim() : '';

    return {
      ...data,
      workName: clean(data.workName),
      location: clean(data.location),
      contractor: clean(data.contractor),
      items: data.items.map(item => ({
        ...item,
        description: clean(item.description),
        remarks: clean(item.remarks),
      })),
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
    this.drawContent();
    this.drawPageNumbers();

    return await this.pdfDoc.save();
  }

  private addNewPage() {
    this.page = this.pdfDoc.addPage(CONFIG.PAGE_SIZE);
    const { width, height } = this.page.getSize();
    this.width = width;
    this.height = height;
    this.y = height - CONFIG.MARGIN.TOP;
    
    this.drawPageHeader();
    this.drawTableHeader();
  }

  private drawPageHeader() {
    const headerY = this.height - CONFIG.MARGIN.TOP;
    
    // Left side info
    this.page.drawText(`MB No: ${this.data.mbNumber}`, { x: CONFIG.MARGIN.LEFT, y: headerY, size: CONFIG.FONTS.TITLE, font: this.fonts.bold, color: CONFIG.COLORS.ACCENT });
    this.page.drawText(`Work: ${this.data.workName}`, { x: CONFIG.MARGIN.LEFT, y: headerY - 15, size: CONFIG.FONTS.SUBTITLE, font: this.fonts.regular });
    this.page.drawText(`Location: ${this.data.location}`, { x: CONFIG.MARGIN.LEFT, y: headerY - 27, size: CONFIG.FONTS.SUBTITLE, font: this.fonts.regular });

    // Right side info
    const rightX = this.width - CONFIG.MARGIN.RIGHT - 250;
    this.page.drawText(`Agreement: ${this.data.agreementNo} dt. ${this.data.agreementDate}`, { x: rightX, y: headerY, size: CONFIG.FONTS.SUBTITLE, font: this.fonts.regular });
    this.page.drawText(`Contractor: ${this.data.contractor}`, { x: rightX, y: headerY - 12, size: CONFIG.FONTS.SUBTITLE, font: this.fonts.regular });
    this.page.drawText(`Estimate: Rs. ${this.data.estimateAmount}`, { x: rightX, y: headerY - 24, size: CONFIG.FONTS.SUBTITLE, font: this.fonts.regular });

    this.y = headerY - 45;
  }

  private drawTableHeader() {
    const headerHeight = 25;
    this.page.drawRectangle({
      x: CONFIG.MARGIN.LEFT,
      y: this.y - headerHeight,
      width: this.width - CONFIG.MARGIN.LEFT - CONFIG.MARGIN.RIGHT,
      height: headerHeight,
      color: CONFIG.COLORS.HEADER_BG,
    });

    const headers = ["Sl", "Description of Work", "No", "L", "B", "D", "Qty", "Cum. Qty", "Remarks"];
    const topY = this.y;
    const bottomY = this.y - headerHeight;

    headers.forEach((h, i) => {
      const tw = this.fonts.bold.widthOfTextAtSize(h, CONFIG.FONTS.HEADER);
      const tx = this.colX[i] + (CONFIG.COLUMN_WIDTHS[i] - tw) / 2;
      this.page.drawText(h, { x: tx, y: bottomY + 8, size: CONFIG.FONTS.HEADER, font: this.fonts.bold, color: CONFIG.COLORS.ACCENT });
      
      if (i > 0) {
        this.page.drawLine({ start: { x: this.colX[i], y: topY }, end: { x: this.colX[i], y: bottomY }, thickness: 0.5, color: CONFIG.COLORS.BORDER });
      }
    });

    this.page.drawLine({ start: { x: CONFIG.MARGIN.LEFT, y: topY }, end: { x: this.width - CONFIG.MARGIN.RIGHT, y: topY }, thickness: 1, color: CONFIG.COLORS.BORDER });
    this.page.drawLine({ start: { x: CONFIG.MARGIN.LEFT, y: bottomY }, end: { x: this.width - CONFIG.MARGIN.RIGHT, y: bottomY }, thickness: 1, color: CONFIG.COLORS.ACCENT });

    this.y = bottomY;
  }

  private drawContent() {
    let sl = 1;

    for (const item of this.data.items) {
      // Draw Item Header
      const itemDescLines = this.splitText(item.description, this.fonts.bold, CONFIG.FONTS.NORMAL, CONFIG.COLUMN_WIDTHS[1] - 10);
      const rowHeight = Math.max(20, itemDescLines.length * CONFIG.SPACING.LINE_HEIGHT + 10);

      if (this.y - rowHeight < CONFIG.MARGIN.BOTTOM) {
        this.addNewPage();
      }

      const rowTopY = this.y;
      this.page.drawText(String(sl++), { x: this.colX[0] + 5, y: this.y - 12, size: CONFIG.FONTS.NORMAL, font: this.fonts.bold });
      
      let lineY = this.y - 12;
      itemDescLines.forEach(line => {
        this.page.drawText(line, { x: this.colX[1] + 5, y: lineY, size: CONFIG.FONTS.NORMAL, font: this.fonts.bold });
        lineY -= CONFIG.SPACING.LINE_HEIGHT;
      });

      this.y -= rowHeight;
      this.drawRowBorders(rowTopY, this.y);

      let itemTotal = 0;

      // Draw Measurements
      for (const m of item.measurements) {
        const qty = m.no * m.l * m.b * m.d;
        itemTotal += qty;
        this.cumulativeQty += qty;

        const mRowHeight = 18;
        if (this.y - mRowHeight < CONFIG.MARGIN.BOTTOM) {
          this.addNewPage();
        }

        const mTopY = this.y;
        const vals = [
          '', '', 
          m.no.toString(), 
          m.l.toFixed(2), 
          m.b.toFixed(2), 
          m.d.toFixed(2), 
          qty.toFixed(3), 
          this.cumulativeQty.toFixed(3), 
          ''
        ];

        vals.forEach((v, i) => {
          if (!v) return;
          const tw = this.fonts.regular.widthOfTextAtSize(v, CONFIG.FONTS.NORMAL);
          const tx = this.colX[i] + (CONFIG.COLUMN_WIDTHS[i] - tw) / 2;
          this.page.drawText(v, { x: tx, y: this.y - 12, size: CONFIG.FONTS.NORMAL, font: this.fonts.regular });
        });

        this.y -= mRowHeight;
        this.drawRowBorders(mTopY, this.y);
      }

      // Item Total Row
      if (this.y - 20 < CONFIG.MARGIN.BOTTOM) this.addNewPage();
      const totalTopY = this.y;
      this.page.drawRectangle({ x: this.colX[6], y: this.y - 18, width: CONFIG.COLUMN_WIDTHS[6] + CONFIG.COLUMN_WIDTHS[7], height: 18, color: CONFIG.COLORS.HEADER_BG });
      
      this.page.drawText("Item Total:", { x: this.colX[5] - 40, y: this.y - 12, size: CONFIG.FONTS.NORMAL, font: this.fonts.bold });
      this.page.drawText(itemTotal.toFixed(3), { x: this.colX[6] + 5, y: this.y - 12, size: CONFIG.FONTS.NORMAL, font: this.fonts.bold, color: CONFIG.COLORS.ACCENT });
      
      if (item.remarks) {
        const remLines = this.splitText(item.remarks, this.fonts.regular, CONFIG.FONTS.SMALL, CONFIG.COLUMN_WIDTHS[8] - 10);
        let remY = totalTopY - 10;
        remLines.forEach(l => {
          this.page.drawText(l, { x: this.colX[8] + 5, y: remY, size: CONFIG.FONTS.SMALL, font: this.fonts.regular });
          remY -= 10;
        });
      }

      this.y -= 18;
      this.drawRowBorders(totalTopY, this.y);
      this.y -= 5; // Gap between items
    }
  }

  private drawRowBorders(topY: number, bottomY: number) {
    this.colX.forEach((x, i) => {
      this.page.drawLine({ start: { x, y: topY }, end: { x, y: bottomY }, thickness: 0.5, color: CONFIG.COLORS.BORDER });
    });
    this.page.drawLine({ start: { x: this.width - CONFIG.MARGIN.RIGHT, y: topY }, end: { x: this.width - CONFIG.MARGIN.RIGHT, y: bottomY }, thickness: 0.5, color: CONFIG.COLORS.BORDER });
    this.page.drawLine({ start: { x: CONFIG.MARGIN.LEFT, y: bottomY }, end: { x: this.width - CONFIG.MARGIN.RIGHT, y: bottomY }, thickness: 0.5, color: CONFIG.COLORS.BORDER });
  }

  private drawPageNumbers() {
    const pages = this.pdfDoc.getPages();
    pages.forEach((page, i) => {
      const text = `Measurement Book - Page ${i + 1} of ${pages.length} | MB No: ${this.data.mbNumber}`;
      const tw = this.fonts.regular.widthOfTextAtSize(text, CONFIG.FONTS.FOOTER);
      page.drawText(text, {
        x: (this.width - tw) / 2,
        y: CONFIG.MARGIN.BOTTOM / 2,
        size: CONFIG.FONTS.FOOTER,
        font: this.fonts.regular,
        color: CONFIG.COLORS.TEXT_MUTED,
      });
    });
  }

  private splitText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    if (!text) return [''];
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (font.widthOfTextAtSize(testLine, size) <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  }
}

export async function generateMeasurementBookPDF(data: MBData): Promise<Uint8Array> {
  const generator = new MeasurementBookGenerator(data);
  return await generator.generate();
}

// Keep the old function name as an alias if needed, but updated to use the new generator
export async function generateRealGovtMB(data: MBData): Promise<Uint8Array> {
  return generateMeasurementBookPDF(data);
}
