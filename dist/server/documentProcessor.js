import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { parse } from "csv-parse/sync";
/**
 * Extract text from DOCX files
 */
async function extractFromDOCX(buffer) {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    }
    catch (error) {
        console.error("[DocumentProcessor] DOCX extraction error:", error);
        throw new Error(`Failed to extract text from DOCX: ${error}`);
    }
}
/**
 * Extract text from XLSX files (Excel spreadsheets)
 */
function extractFromXLSX(buffer) {
    try {
        const workbook = XLSX.read(buffer, { type: "buffer" });
        let allText = "";
        workbook.SheetNames.forEach((sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            allText += `\n\n=== Sheet: ${sheetName} ===\n`;
            // Convert sheet to CSV format for better readability
            const csv = XLSX.utils.sheet_to_csv(sheet);
            allText += csv;
        });
        return allText.trim();
    }
    catch (error) {
        console.error("[DocumentProcessor] XLSX extraction error:", error);
        throw new Error(`Failed to extract text from XLSX: ${error}`);
    }
}
/**
 * Extract text from CSV files
 */
function extractFromCSV(buffer) {
    try {
        const content = buffer.toString("utf-8");
        const records = parse(content, {
            skip_empty_lines: true,
            relax_column_count: true,
        });
        // Convert CSV records to readable text
        let text = "";
        records.forEach((row, index) => {
            if (index === 0) {
                text += "Headers: " + row.join(" | ") + "\n\n";
            }
            else {
                text += row.join(" | ") + "\n";
            }
        });
        return text.trim();
    }
    catch (error) {
        console.error("[DocumentProcessor] CSV extraction error:", error);
        throw new Error(`Failed to extract text from CSV: ${error}`);
    }
}
/**
 * Extract text from TXT files
 */
function extractFromTXT(buffer) {
    try {
        return buffer.toString("utf-8").trim();
    }
    catch (error) {
        console.error("[DocumentProcessor] TXT extraction error:", error);
        throw new Error(`Failed to extract text from TXT: ${error}`);
    }
}
/**
 * Main function to extract text from any supported document format
 * @param buffer - File buffer
 * @param mimeType - MIME type of the file
 * @param filename - Original filename (used as fallback for format detection)
 * @returns Extracted text content
 */
export async function extractTextFromDocument(buffer, mimeType, filename) {
    const lowerFilename = filename.toLowerCase();
    const format = detectFormat(mimeType, lowerFilename);
    try {
        let text = "";
        switch (format) {
            case "docx":
                text = await extractFromDOCX(buffer);
                break;
            case "xlsx":
                text = extractFromXLSX(buffer);
                break;
            case "csv":
                text = extractFromCSV(buffer);
                break;
            case "txt":
                text = extractFromTXT(buffer);
                break;
            case "pdf":
                // PDFs are handled directly by the LLM via file_url
                return {
                    text: "",
                    format: "pdf",
                    error: "PDF files should be passed directly to LLM via file_url",
                };
            case "image":
                // Images are handled by LLM's vision capabilities via image_url
                return {
                    text: "",
                    format: "image",
                    error: "Image files should be passed directly to LLM via image_url",
                };
            default:
                throw new Error(`Unsupported file format: ${format}`);
        }
        return {
            text,
            format,
        };
    }
    catch (error) {
        console.error(`[DocumentProcessor] Error processing ${format}:`, error);
        return {
            text: "",
            format,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
/**
 * Detect document format from MIME type and filename
 */
function detectFormat(mimeType, filename) {
    // Check MIME type first
    if (mimeType.includes("pdf"))
        return "pdf";
    if (mimeType.includes("wordprocessingml") || mimeType.includes("msword"))
        return "docx";
    if (mimeType.includes("spreadsheetml") || mimeType.includes("excel"))
        return "xlsx";
    if (mimeType.includes("csv"))
        return "csv";
    if (mimeType.includes("text/plain"))
        return "txt";
    if (mimeType.includes("image/"))
        return "image";
    // Fallback to file extension
    if (filename.endsWith(".pdf"))
        return "pdf";
    if (filename.endsWith(".docx") || filename.endsWith(".doc"))
        return "docx";
    if (filename.endsWith(".xlsx") || filename.endsWith(".xls"))
        return "xlsx";
    if (filename.endsWith(".csv"))
        return "csv";
    if (filename.endsWith(".txt"))
        return "txt";
    if (filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i))
        return "image";
    return "unknown";
}
