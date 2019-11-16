let baseUrl = "";
let imageUploadUrl = "";
if (process.env.NODE_ENV === "dev") {
  baseUrl = "http://gr-debug.goodrain.com/";
} else if (process.env.NODE_ENV === "development") {
  // baseUrl = "http://192.168.2.213:7070";
  baseUrl = "https://console.goodrain.com";
} else if (process.env.NODE_ENV === "production") {
  baseUrl = "";
}

imageUploadUrl = `${baseUrl}/console/files/upload`;
const config = {
  baseUrl,
  imageUploadUrl,
};
export default config;
