// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ExternalHyperlink,
} from "docx";
import DOMPurify from "dompurify";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  Check,
  Copy,
  GraduationCap,
  Headphones,
  Pencil,
  Undo2,
  X,
  Download,
  FileText,
  FileCode,
  FileImage,
  FileType,
} from "lucide-react";
import { marked } from "marked";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ScrollContainer } from "~/components/deer-flow/scroll-container";
import { Tooltip } from "~/components/deer-flow/tooltip";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useReplay } from "~/core/replay";
import { closeResearch, getResearchQuery, listenToPodcast, useStore, useSettingsStore } from "~/core/store";
import { cn } from "~/lib/utils";

import { EvaluationDialog } from "./evaluation-dialog";
import { ResearchActivitiesBlock } from "./research-activities-block";
import { ResearchReportBlock } from "./research-report-block";

export function ResearchBlock({
  className,
  researchId = null,
}: {
  className?: string;
  researchId: string | null;
}) {
  const t = useTranslations("chat.research");
  const reportId = useStore((state) =>
    researchId ? state.researchReportIds.get(researchId) : undefined,
  );
  const [activeTab, setActiveTab] = useState("activities");
  const hasReport = useStore((state) =>
    researchId ? state.researchReportIds.has(researchId) : false,
  );
  const reportStreaming = useStore((state) =>
    reportId ? (state.messages.get(reportId)?.isStreaming ?? false) : false,
  );
  const { isReplay } = useReplay();
  useEffect(() => {
    if (hasReport) {
      setActiveTab("report");
    }
  }, [hasReport]);

  const handleGeneratePodcast = useCallback(async () => {
    if (!researchId) {
      return;
    }
    await listenToPodcast(researchId);
  }, [researchId]);

  const [editing, setEditing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const handleCopy = useCallback(() => {
    if (!reportId) {
      return;
    }
    const report = useStore.getState().messages.get(reportId);
    if (!report) {
      return;
    }
    void navigator.clipboard.writeText(report.content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  }, [reportId]);

  // Helper function to generate timestamp for filenames
  const getTimestamp = useCallback(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  }, []);

  // Helper function to trigger file download
  const triggerDownload = useCallback(
    (content: string, filename: string, mimeType: string) => {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          if (a.parentNode) {
            a.parentNode.removeChild(a);
          }
        } finally {
          URL.revokeObjectURL(url);
        }
      }, 100);
    },
    [],
  );

  // Download report as Markdown
  const handleDownloadMarkdown = useCallback(() => {
    if (!reportId) return;
    const report = useStore.getState().messages.get(reportId);
    if (!report) return;
    triggerDownload(
      report.content,
      `research-report-${getTimestamp()}.md`,
      "text/markdown",
    );
  }, [reportId, getTimestamp, triggerDownload]);

  // Download report as HTML
  const handleDownloadHTML = useCallback(() => {
    if (!reportId) return;
    const report = useStore.getState().messages.get(reportId);
    if (!report) return;
    const rawHtml = marked(report.content) as string;
    const htmlContent = DOMPurify.sanitize(rawHtml);
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Research Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1, h2, h3 { color: #333; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
    pre { background: #f4f4f4; padding: 16px; border-radius: 8px; overflow-x: auto; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f4f4f4; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;
    triggerDownload(
      fullHTML,
      `research-report-${getTimestamp()}.html`,
      "text/html",
    );
  }, [reportId, getTimestamp, triggerDownload]);

  // Download report as PDF (text-based, no html2canvas)
  const handleDownloadPDF = useCallback(async () => {
    if (!reportId || isDownloading) return;
    const report = useStore.getState().messages.get(reportId);
    if (!report) return;

    setIsDownloading(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let y = margin;

      // PDF formatting constants for maintainability
      const PDF_CONSTANTS = {
        headings: {
          h1: { fontSize: 20, lineHeight: 9, spacing: 6 },
          h2: { fontSize: 16, lineHeight: 7, spacing: 5 },
          h3: { fontSize: 14, lineHeight: 6, spacing: 4 },
        },
        text: { fontSize: 11, normalHeight: 5, paragraphSpacing: 2 },
        list: { bullet: "• ", indentLevel: 2 },
        emptyLine: { height: 4 },
        image: { maxHeight: 100, spacing: 5 },
      };

      // Helper function to render text with markdown formatting (bold and links)
      const renderFormattedText = (
        text: string,
        x: number,
        startY: number,
        maxWidth: number,
        fontSize: number,
        defaultBold: boolean = false
      ): number => {
        let currentY = startY;
        pdf.setFontSize(fontSize);

        // Pattern to match: bold (**text**), links [text](url)
        const pattern = /(\*\*(.*?)\*\*)|(\[(.*?)\]\((.*?)\))/g;
        const segments: Array<{ text: string; bold: boolean; link?: string }> = [];
        let lastIndex = 0;
        let match;

        while ((match = pattern.exec(text)) !== null) {
          // Add plain text before the match
          if (match.index > lastIndex) {
            segments.push({
              text: text.slice(lastIndex, match.index),
              bold: defaultBold,
            });
          }

          if (match[1]) {
            // Bold: **text**
            segments.push({ text: match[2] ?? "", bold: true });
          } else if (match[3]) {
            // Link: [text](url)
            segments.push({
              text: match[4] ?? "",
              bold: defaultBold,
              link: match[5],
            });
          }

          lastIndex = pattern.lastIndex;
        }

        // Add remaining plain text
        if (lastIndex < text.length) {
          segments.push({ text: text.slice(lastIndex), bold: defaultBold });
        }

        // If no patterns found, add the whole text
        if (segments.length === 0) {
          segments.push({ text, bold: defaultBold });
        }

        // Render segments
        let currentLine = "";
        let currentLineSegments: typeof segments = [];

        for (const segment of segments) {
          const words = segment.text.split(" ");

          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + (currentLine ? " " : "") + word;
            const testWidth = pdf.getTextWidth(testLine);

            if (testWidth > maxWidth && currentLine) {
              // Render current line
              let lineX = x;
              for (const lineSeg of currentLineSegments) {
                pdf.setFont("helvetica", lineSeg.bold ? "bold" : "normal");

                if (lineSeg.link) {
                  // Render as link (blue and underlined)
                  pdf.setTextColor(0, 0, 255);
                  pdf.text(lineSeg.text, lineX, currentY);
                  const linkWidth = pdf.getTextWidth(lineSeg.text);
                  pdf.link(lineX, currentY - 3, linkWidth, 5, { url: lineSeg.link });
                  pdf.setTextColor(0, 0, 0);
                  lineX += linkWidth + pdf.getTextWidth(" ");
                } else {
                  pdf.text(lineSeg.text, lineX, currentY);
                  lineX += pdf.getTextWidth(lineSeg.text + " ");
                }
              }

              currentY += fontSize * 0.45;
              currentLine = word;
              currentLineSegments = [{ ...segment, text: word }];
            } else {
              currentLine = testLine;
              if (currentLineSegments.length > 0 && currentLineSegments[currentLineSegments.length - 1].bold === segment.bold && currentLineSegments[currentLineSegments.length - 1].link === segment.link) {
                currentLineSegments[currentLineSegments.length - 1].text += (currentLineSegments[currentLineSegments.length - 1].text ? " " : "") + word;
              } else {
                currentLineSegments.push({ ...segment, text: word });
              }
            }
          }
        }

        // Render last line
        if (currentLine) {
          let lineX = x;
          for (const lineSeg of currentLineSegments) {
            pdf.setFont("helvetica", lineSeg.bold ? "bold" : "normal");

            if (lineSeg.link) {
              pdf.setTextColor(0, 0, 255);
              pdf.text(lineSeg.text, lineX, currentY);
              const linkWidth = pdf.getTextWidth(lineSeg.text);
              pdf.link(lineX, currentY - 3, linkWidth, 5, { url: lineSeg.link });
              pdf.setTextColor(0, 0, 0);
              lineX += linkWidth + pdf.getTextWidth(" ");
            } else {
              pdf.text(lineSeg.text, lineX, currentY);
              lineX += pdf.getTextWidth(lineSeg.text + " ");
            }
          }
          currentY += fontSize * 0.45;
        }

        return currentY;
      };

      // Helper function to load and add image to PDF
      const addImageToPDF = async (imageUrl: string, altText: string) => {
        try {
          // Check if we need a new page
          if (y + PDF_CONSTANTS.image.maxHeight > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }

          // Fetch the image
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          // Calculate image dimensions to fit within page width
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = dataUrl;
          });

          const imgAspectRatio = img.width / img.height;
          let imgWidth = maxWidth;
          let imgHeight = imgWidth / imgAspectRatio;

          // If image is too tall, scale it down
          if (imgHeight > PDF_CONSTANTS.image.maxHeight) {
            imgHeight = PDF_CONSTANTS.image.maxHeight;
            imgWidth = imgHeight * imgAspectRatio;
          }

          // Center the image horizontally
          const xOffset = margin + (maxWidth - imgWidth) / 2;

          // Add image to PDF
          pdf.addImage(dataUrl, "PNG", xOffset, y, imgWidth, imgHeight);
          y += imgHeight + PDF_CONSTANTS.image.spacing;

          // Add alt text as caption if provided
          if (altText) {
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "italic");
            const captionText = pdf.splitTextToSize(altText, maxWidth);
            pdf.text(captionText, margin, y);
            y += captionText.length * 4 + PDF_CONSTANTS.image.spacing;
          }
        } catch (error) {
          console.error("Failed to load image:", imageUrl, error);
          // Add a placeholder text if image fails to load
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "italic");
          pdf.text(`[Image: ${altText || imageUrl}]`, margin, y);
          y += 10;
        }
      };

      // Helper function to render table in PDF
      const addTableToPDF = (tableLines: string[]) => {
        try {
          // Parse table structure
          const rows: string[][] = [];

          for (const line of tableLines) {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith("|")) continue;

            // Check if this is the header separator line (e.g., |---|---|)
            if (/^\|[\s\-:|]+\|$/.exec(trimmedLine)) {
              continue;
            }

            // Parse cells
            const cells = trimmedLine
              .split("|")
              .slice(1, -1) // Remove first and last empty elements
              .map((cell) => cell.trim());

            if (cells.length > 0) {
              rows.push(cells);
            }
          }

          if (rows.length === 0) return;

          // Calculate column widths
          const numCols = rows[0].length;
          const colWidth = maxWidth / numCols;
          const cellPadding = 2;
          const fontSize = 9;

          // Helper function to process cell text with markdown formatting
          const processCellText = (text: string): Array<{ text: string; bold: boolean }> => {
            const parts: Array<{ text: string; bold: boolean }> = [];
            let lastIndex = 0;
            const boldPattern = /\*\*(.*?)\*\*/g;
            let match;

            while ((match = boldPattern.exec(text)) !== null) {
              // Add text before bold
              if (match.index > lastIndex) {
                parts.push({ text: text.slice(lastIndex, match.index), bold: false });
              }
              // Add bold text
              parts.push({ text: match[1] ?? "", bold: true });
              lastIndex = boldPattern.lastIndex;
            }

            // Add remaining text
            if (lastIndex < text.length) {
              parts.push({ text: text.slice(lastIndex), bold: false });
            }

            return parts.length > 0 ? parts : [{ text, bold: false }];
          };

          // Calculate row heights dynamically based on content
          const rowHeights: number[] = [];
          pdf.setFontSize(fontSize);

          for (const row of rows) {
            if (!row) continue;
            let maxLines = 1;

            for (const cell of row) {
              const cellText = cell
                .replace(/\*\*(.*?)\*\*/g, "$1")
                .replace(/\*(.*?)\*/g, "$1")
                .replace(/`(.*?)`/g, "$1")
                .replace(/\[(.*?)\]\(.*?\)/g, "$1");

              const textLines = pdf.splitTextToSize(cellText, colWidth - 2 * cellPadding);
              maxLines = Math.max(maxLines, textLines.length);
            }

            // Row height = number of lines * line height + padding
            rowHeights.push(maxLines * 5 + 4);
          }

          // Check if table fits on current page
          const tableHeight = rowHeights.reduce((sum, h) => sum + h, 0);
          if (y + tableHeight > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }

          // Draw table
          let currentY = y;
          let isHeader = true;

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowHeight = rowHeights[i];
            if (!row || !rowHeight) continue;

            // Draw row background for header
            if (isHeader) {
              pdf.setFillColor(240, 240, 240);
              pdf.rect(margin, currentY, maxWidth, rowHeight, "F");
              isHeader = false;
            }

            // Draw cell borders and text
            for (let j = 0; j < row.length; j++) {
              const cell = row[j];
              if (!cell) continue;

              const cellX = margin + j * colWidth;
              const cellText = cell
                .replace(/\*(.*?)\*/g, "$1")
                .replace(/`(.*?)`/g, "$1")
                .replace(/\[(.*?)\]\(.*?\)/g, "$1");

              // Draw cell border
              pdf.setDrawColor(200, 200, 200);
              pdf.rect(cellX, currentY, colWidth, rowHeight);

              // Process and draw cell text with bold support
              const textParts = processCellText(cellText);
              let textY = currentY + cellPadding + 3;

              pdf.setFontSize(fontSize);

              for (const part of textParts) {
                pdf.setFont("helvetica", part.bold || i === 0 ? "bold" : "normal");
                const lines = pdf.splitTextToSize(part.text, colWidth - 2 * cellPadding);

                for (const line of lines) {
                  pdf.text(line, cellX + cellPadding, textY);
                  textY += 5;
                }
              }
            }

            currentY += rowHeight;
          }

          y = currentY + 5;
        } catch (error) {
          console.error("Failed to render table:", error);
        }
      };

      const lines = report.content.split("\n");
      let i = 0;

      while (i < lines.length) {
        const line = lines[i];
        if (!line) {
          i++;
          continue;
        }

        // Check for table start (line starting with |)
        if (line.trim().startsWith("|")) {
          const tableLines: string[] = [];
          let j = i;

          // Collect all consecutive table lines
          while (j < lines.length && lines[j]?.trim().startsWith("|")) {
            const tableLine = lines[j];
            if (tableLine) {
              tableLines.push(tableLine);
            }
            j++;
          }

          if (tableLines.length > 0) {
            addTableToPDF(tableLines);
            i = j;
            continue;
          }
        }

        // Check for image syntax: ![alt text](url)
        const imageMatch = /^!\[(.*?)\]\((.*?)\)$/.exec(line.trim());
        if (imageMatch) {
          const altText = imageMatch[1] ?? "";
          const imageUrl = imageMatch[2] ?? "";
          if (imageUrl) {
            await addImageToPDF(imageUrl, altText);
          }
          i++;
          continue;
        }

        // Handle headings
        if (line.startsWith("### ")) {
          const h3 = PDF_CONSTANTS.headings.h3;
          pdf.setFontSize(h3.fontSize);
          pdf.setFont("helvetica", "bold");
          const text = line.substring(4);
          const splitText = pdf.splitTextToSize(text, maxWidth);
          if (y + 10 > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(splitText, margin, y);
          y += splitText.length * h3.lineHeight + h3.spacing;
        } else if (line.startsWith("## ")) {
          const h2 = PDF_CONSTANTS.headings.h2;
          pdf.setFontSize(h2.fontSize);
          pdf.setFont("helvetica", "bold");
          const text = line.substring(3);
          const splitText = pdf.splitTextToSize(text, maxWidth);
          if (y + 12 > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(splitText, margin, y);
          y += splitText.length * h2.lineHeight + h2.spacing;
        } else if (line.startsWith("# ")) {
          const h1 = PDF_CONSTANTS.headings.h1;
          pdf.setFontSize(h1.fontSize);
          pdf.setFont("helvetica", "bold");
          const text = line.substring(2);
          const splitText = pdf.splitTextToSize(text, maxWidth);
          if (y + 14 > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(splitText, margin, y);
          y += splitText.length * h1.lineHeight + h1.spacing;
        } else if (line.startsWith("- ") || line.startsWith("* ")) {
          // Unordered list item - use renderFormattedText for bold and link support
          const textConfig = PDF_CONSTANTS.text;

          // Check if we need a new page
          if (y + 20 > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }

          // Remove only italic and code markdown, keep bold and links
          const processedText = line
            .substring(2)
            .replace(/\*(.*?)\*/g, "$1")
            .replace(/`(.*?)`/g, "$1");

          // Render bullet
          pdf.setFontSize(textConfig.fontSize);
          pdf.setFont("helvetica", "normal");
          pdf.text("•", margin + PDF_CONSTANTS.list.indentLevel, y);

          // Render text with formatting
          y = renderFormattedText(
            processedText,
            margin + PDF_CONSTANTS.list.indentLevel + 5,
            y,
            maxWidth - PDF_CONSTANTS.list.indentLevel - 5,
            textConfig.fontSize,
            false
          );
          y += PDF_CONSTANTS.text.paragraphSpacing;
        } else if (/^\d+\.\s/.test(line)) {
          // Ordered list item - use renderFormattedText for bold and link support
          const textConfig = PDF_CONSTANTS.text;
          const match = /^(\d+)\.\s(.*)$/.exec(line);

          if (match?.[1] && match[2]) {
            // Check if we need a new page
            if (y + 20 > pageHeight - margin) {
              pdf.addPage();
              y = margin;
            }

            // Remove only italic and code markdown, keep bold and links
            const processedText = match[2]
              .replace(/\*(.*?)\*/g, "$1")
              .replace(/`(.*?)`/g, "$1");

            // Render number
            pdf.setFontSize(textConfig.fontSize);
            pdf.setFont("helvetica", "normal");
            const numberText = `${match[1]}.`;
            pdf.text(numberText, margin + PDF_CONSTANTS.list.indentLevel, y);
            const numberWidth = pdf.getTextWidth(numberText);

            // Render text with formatting
            y = renderFormattedText(
              processedText,
              margin + PDF_CONSTANTS.list.indentLevel + numberWidth + 2,
              y,
              maxWidth - PDF_CONSTANTS.list.indentLevel - numberWidth - 2,
              textConfig.fontSize,
              false
            );
            y += PDF_CONSTANTS.text.paragraphSpacing;
          }
        } else if (line.trim()) {
          // Normal text - use renderFormattedText for bold and link support
          const textConfig = PDF_CONSTANTS.text;

          // Check if we need a new page (estimate)
          if (y + 20 > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }

          // Remove only italic and code markdown, keep bold and links for renderFormattedText
          const processedText = line
            .replace(/\*(.*?)\*/g, "$1")
            .replace(/`(.*?)`/g, "$1");

          y = renderFormattedText(
            processedText,
            margin,
            y,
            maxWidth,
            textConfig.fontSize,
            false
          );
          y += PDF_CONSTANTS.text.paragraphSpacing;
        } else {
          // Empty line
          y += PDF_CONSTANTS.emptyLine.height;
        }

        // Check page overflow
        if (y > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }

        i++;
      }

      pdf.save(`research-report-${getTimestamp()}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error(t("exportFailed"));
    } finally {
      setIsDownloading(false);
    }
  }, [reportId, getTimestamp, isDownloading, t]);

  // Helper function to parse inline markdown formatting for Word export
  const parseInlineMarkdown = useCallback(
    (text: string): (TextRun | ExternalHyperlink)[] => {
      // Process text recursively using marked's inline lexer
      const runs: (TextRun | ExternalHyperlink)[] = [];

      try {
        // Use marked's Lexer to safely parse inline markdown
        const tokens = marked.Lexer.lexInline(text);

        interface MarkedToken {
          type: string;
          text?: string;
          tokens?: MarkedToken[];
          href?: string;
        }

        const processTokens = (tokens: MarkedToken[]): void => {
          for (const token of tokens) {
            if (token.type === "text") {
              // Regular text
              if (token.text) {
                runs.push(new TextRun(token.text));
              }
            } else if (token.type === "strong") {
              // Bold text - may contain nested tokens
              if (token.tokens && token.tokens.length > 0) {
                // Process nested tokens and mark them as bold
                const nestedRuns: TextRun[] = [];
                for (const nestedToken of token.tokens) {
                  if (nestedToken.type === "text") {
                    nestedRuns.push(
                      new TextRun({ text: nestedToken.text, bold: true }),
                    );
                  } else if (nestedToken.type === "em") {
                    // Bold + italic nested tokens
                    nestedRuns.push(
                      new TextRun({
                        text: nestedToken.text,
                        bold: true,
                        italics: true,
                      }),
                    );
                  }
                }
                runs.push(...nestedRuns);
              } else {
                runs.push(new TextRun({ text: token.text, bold: true }));
              }
            } else if (token.type === "em") {
              // Italic text
              runs.push(
                new TextRun({
                  text: token.text ?? token.tokens?.[0]?.text,
                  italics: true,
                }),
              );
            } else if (token.type === "codespan") {
              // Inline code
              if (token.text) {
                runs.push(
                  new TextRun({ text: token.text, font: "Courier New" }),
                );
              }
            } else if (token.type === "link") {
              // Link - use the link text or fallback to URL
              const linkText = token.text ?? token.href ?? "";
              const linkUrl = token.href ?? "";
              if (linkUrl) {
                runs.push(
                  new ExternalHyperlink({
                    children: [
                      new TextRun({ text: linkText, style: "Hyperlink" }),
                    ],
                    link: linkUrl,
                  }),
                );
              } else {
                // Fallback to plain text if no URL
                runs.push(new TextRun(linkText));
              }
            } else if (token.type === "space") {
              // Preserve spaces
              runs.push(new TextRun(" "));
            }
          }
        };

        processTokens(tokens);
      } catch (error) {
        // Fallback to simple text parsing if marked fails
        console.warn("Marked parsing failed, using fallback:", error);
        // Pattern to match: bold (**text**), italic (*text*), inline code (`text`), links [text](url)
        const pattern =
          /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|\[(.+?)\]\((.+?)\)/g;
        let lastIndex = 0;
        let match;

        while ((match = pattern.exec(text)) !== null) {
          // Add plain text before the match
          if (match.index > lastIndex) {
            runs.push(new TextRun(text.slice(lastIndex, match.index)));
          }

          if (match[1]) {
            // Bold: **text**
            const boldText = match[2] ?? "";
            runs.push(new TextRun({ text: boldText, bold: true }));
          } else if (match[3]) {
            // Italic: *text*
            const italicText = match[4] ?? "";
            runs.push(new TextRun({ text: italicText, italics: true }));
          } else if (match[5]) {
            // Inline code: `text`
            const codeText = match[6] ?? "";
            runs.push(new TextRun({ text: codeText, font: "Courier New" }));
          } else if (match[7] && match[8]) {
            // Link: [text](url)
            runs.push(
              new ExternalHyperlink({
                children: [
                  new TextRun({ text: match[7] ?? "", style: "Hyperlink" }),
                ],
                link: match[8],
              }),
            );
          }

          lastIndex = pattern.lastIndex;
        }

        // Add remaining plain text
        if (lastIndex < text.length) {
          runs.push(new TextRun(text.slice(lastIndex)));
        }
      }

      return runs.length > 0 ? runs : [new TextRun(text)];
    },
    [],
  );

  // Download report as Word document
  const handleDownloadWord = useCallback(async () => {
    if (!reportId || isDownloading) return;
    const report = useStore.getState().messages.get(reportId);
    if (!report) return;

    setIsDownloading(true);
    try {
      // Parse markdown content into paragraphs
      const lines = report.content.split("\n");
      const children: Paragraph[] = [];

      for (const line of lines) {
        if (line.startsWith("# ")) {
          children.push(
            new Paragraph({
              children: parseInlineMarkdown(line.substring(2)),
              heading: HeadingLevel.HEADING_1,
            }),
          );
        } else if (line.startsWith("## ")) {
          children.push(
            new Paragraph({
              children: parseInlineMarkdown(line.substring(3)),
              heading: HeadingLevel.HEADING_2,
            }),
          );
        } else if (line.startsWith("### ")) {
          children.push(
            new Paragraph({
              children: parseInlineMarkdown(line.substring(4)),
              heading: HeadingLevel.HEADING_3,
            }),
          );
        } else if (line.startsWith("- ") || line.startsWith("* ")) {
          // Unordered list item
          children.push(
            new Paragraph({
              children: parseInlineMarkdown(line.substring(2)),
              bullet: { level: 0 },
            }),
          );
        } else if (/^\d+\.\s/.test(line)) {
          // Ordered list item
          const text = line.replace(/^\d+\.\s/, "");
          children.push(
            new Paragraph({
              children: parseInlineMarkdown(text),
              numbering: { reference: "default-numbering", level: 0 },
            }),
          );
        } else if (line.trim()) {
          children.push(
            new Paragraph({
              children: parseInlineMarkdown(line),
            }),
          );
        } else {
          children.push(new Paragraph({ text: "" }));
        }
      }

      const doc = new Document({
        numbering: {
          config: [
            {
              reference: "default-numbering",
              levels: [
                {
                  level: 0,
                  format: "decimal",
                  text: "%1.",
                  alignment: "start",
                },
              ],
            },
          ],
        },
        sections: [{ children }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `research-report-${getTimestamp()}.docx`);
    } catch (error) {
      console.error("Failed to generate Word document:", error);
      toast.error(t("exportFailed"));
    } finally {
      setIsDownloading(false);
    }
  }, [reportId, getTimestamp, isDownloading, t, parseInlineMarkdown]);

  // Download report as Image
  const handleDownloadImage = useCallback(async () => {
    if (!reportId || isDownloading) return;
    const report = useStore.getState().messages.get(reportId);
    if (!report) return;

    setIsDownloading(true);
    let container: HTMLDivElement | null = null;
    try {
      // Create a temporary container with simple styles to avoid color parsing issues
      container = document.createElement("div");
      container.style.cssText =
        "position: absolute; left: -9999px; top: 0; width: 800px; padding: 40px; font-family: Arial, sans-serif; line-height: 1.6; background-color: #ffffff; color: #000000;";
      const styleTag =
        "<style>* { color: #000000; } h1,h2,h3,h4,h5,h6 { color: #333333; } a { color: #0066cc; } code { background-color: #f5f5f5; padding: 2px 4px; } pre { background-color: #f5f5f5; padding: 12px; }</style>";
      const rawHtml = marked(report.content) as string;
      const sanitizedHtml = DOMPurify.sanitize(rawHtml);
      container.innerHTML = styleTag + sanitizedHtml;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Promisify toBlob for proper async handling
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png");
      });

      if (blob) {
        saveAs(blob, `research-report-${getTimestamp()}.png`);
      }
    } catch (error) {
      console.error("Failed to generate image:", error);
      toast.error(t("exportFailed"));
    } finally {
      // Ensure container is always removed
      try {
        container?.parentNode?.removeChild(container);
      } catch (error) {
        // Log cleanup errors for better debugging (not just in development)
        console.warn(
          "Failed to remove temporary container during image export cleanup:",
          error,
        );
        // Don't throw - cleanup failures are expected and harmless
      }
      setIsDownloading(false);
    }
  }, [reportId, getTimestamp, isDownloading, t]);

  const handleEdit = useCallback(() => {
    setEditing((editing) => !editing);
  }, []);

  // When the research id changes, set the active tab to activities
  useEffect(() => {
    if (!hasReport) {
      setActiveTab("activities");
    }
  }, [hasReport, researchId]);

  return (
    <div className={cn("h-full w-full", className)}>
      <Card className={cn("relative h-full w-full pt-4", className)}>
        <div className="absolute right-4 flex h-9 items-center justify-center">
          {hasReport && !reportStreaming && (
            <>
              <Tooltip title={t("generatePodcast")}>
                <Button
                  className="text-gray-400"
                  size="icon"
                  variant="ghost"
                  disabled={isReplay}
                  onClick={handleGeneratePodcast}
                >
                  <Headphones />
                </Button>
              </Tooltip>
              <Tooltip title={t("edit")}>
                <Button
                  className="text-gray-400"
                  size="icon"
                  variant="ghost"
                  disabled={isReplay}
                  onClick={handleEdit}
                >
                  {editing ? <Undo2 /> : <Pencil />}
                </Button>
              </Tooltip>
              <Tooltip title={t("copy")}>
                <Button
                  className="text-gray-400"
                  size="icon"
                  variant="ghost"
                  onClick={handleCopy}
                >
                  {copied ? <Check /> : <Copy />}
                </Button>
              </Tooltip>
              <Tooltip title={t("evaluateReport")}>
                <Button
                  className="text-gray-400"
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowEvaluation(true)}
                >
                  <GraduationCap />
                </Button>
              </Tooltip>
              <DropdownMenu>
                <Tooltip title={t("downloadReport")}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="text-gray-400"
                      size="icon"
                      variant="ghost"
                    >
                      <Download />
                    </Button>
                  </DropdownMenuTrigger>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownloadMarkdown}>
                    <FileText className="mr-2 h-4 w-4" />
                    {t("downloadMarkdown")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadHTML}>
                    <FileCode className="mr-2 h-4 w-4" />
                    {t("downloadHTML")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                  >
                    <FileType className="mr-2 h-4 w-4" />
                    {t("downloadPDF")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDownloadWord}
                    disabled={isDownloading}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {t("downloadWord")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDownloadImage}
                    disabled={isDownloading}
                  >
                    <FileImage className="mr-2 h-4 w-4" />
                    {t("downloadImage")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <Tooltip title={t("close")}>
            <Button
              className="text-gray-400"
              size="sm"
              variant="ghost"
              onClick={() => {
                closeResearch();
              }}
            >
              <X />
            </Button>
          </Tooltip>
        </div>
        <Tabs
          className="flex h-full w-full flex-col"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value)}
        >
          <div className="flex w-full justify-center">
            <TabsList className="">
              <TabsTrigger
                className="px-8"
                value="report"
                disabled={!hasReport}
              >
                {t("report")}
              </TabsTrigger>
              <TabsTrigger className="px-8" value="activities">
                {t("activities")}
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent
            className="h-full min-h-0 flex-grow px-8"
            value="report"
            forceMount
            hidden={activeTab !== "report"}
          >
            <ScrollContainer
              className="h-full px-5 pb-20"
              scrollShadowColor="var(--card)"
              autoScrollToBottom={!hasReport || reportStreaming}
            >
              {reportId && researchId && (
                <ResearchReportBlock
                  className="mt-4"
                  researchId={researchId}
                  messageId={reportId}
                  editing={editing}
                />
              )}
            </ScrollContainer>
          </TabsContent>
          <TabsContent
            className="h-full min-h-0 flex-grow px-8"
            value="activities"
            forceMount
            hidden={activeTab !== "activities"}
          >
            <ScrollContainer
              className="h-full"
              scrollShadowColor="var(--card)"
              autoScrollToBottom={!hasReport || reportStreaming}
            >
              {researchId && (
                <ResearchActivitiesBlock
                  className="mt-4"
                  researchId={researchId}
                />
              )}
            </ScrollContainer>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Evaluation Dialog */}
      {reportId && researchId && (
        <EvaluationDialog
          open={showEvaluation}
          onOpenChange={setShowEvaluation}
          reportContent={
            useStore.getState().messages.get(reportId)?.content ?? ""
          }
          query={getResearchQuery(researchId)}
          reportStyle={useSettingsStore.getState().general.reportStyle.toLowerCase()}
        />
      )}
    </div>
  );
}
