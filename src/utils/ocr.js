import Tesseract from "tesseract.js";

export const extractTextFromImage = async (file, onProgress) => {
  const { data: { text } } = await Tesseract.recognize(file, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.floor(m.progress * 100));
      }
    },
  });
  return text;
};