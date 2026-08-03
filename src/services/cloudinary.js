import axios from "axios";

const CLOUD_NAME = "zafvi4pu";
const UPLOAD_PRESET = "prepzo_ai";

export async function uploadPDF(pdfBlob, fileName) {
  const formData = new FormData();

  formData.append("file", pdfBlob, fileName);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "prepzo-ai");

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
    formData
  );

  return response.data;
}