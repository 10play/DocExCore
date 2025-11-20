import * as docx from "docx";
import { Exporter } from "./Exporter";

export type DocxChild = docx.Paragraph | docx.Table;
export interface NodeMetadata {
  index: number;
  children: DocxChild[];
  domChildren: HTMLElement[];
}

export const exportToDocx = async (
  content: HTMLElement,
  fileName?: string,
  toDownload?: boolean
) => {
  const exporter = new Exporter(content.firstElementChild! as HTMLElement);
  const doc = await exporter.export();
  return packDocx(doc, fileName, toDownload);
};

const packDocx = async (
  doc: docx.Document,
  fileName?: string,
  toDownload?: boolean
) => {
  // Generate and download the document
  const blob = await docx.Packer.toBlob(doc);
  if (toDownload) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName ?? "document.docx";
    link.click();
    window.URL.revokeObjectURL(url);
  }
  return blob;

  // try {
  //   const file = new File([blob], fileName ?? "document.docx", {
  //     type: blob.type,
  //   });
  //   const formData = new FormData();
  //   formData.append("docx", file);
  //   const response = await fetch("http://localhost:3000/api/upload", {
  //     method: "POST",
  //     body: formData,
  //   });
  //   if (!response.ok) {
  //     throw new Error(`Server responded with ${response.status}`);
  //   }

  //   const result = await response.json();
  //   return result;
  // } catch (error) {
  //   console.error("Error during DOCX generation or upload:", error);
  // }
};
