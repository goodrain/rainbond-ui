let baseUrl = "";
let imageUploadUrl = "";
if (process.env.NODE_ENV === "dev") {
  baseUrl = "http://gr-debug.goodrain.com/";
} else if (process.env.NODE_ENV === "development") {
  // baseUrl = '/api';
  baseUrl = "http://192.168.1.200:7070";
  // baseUrl = "http://39.104.24.43:7070";
} else if (process.env.NODE_ENV === "production") {
  baseUrl = "";
}

imageUploadUrl = `${baseUrl}/console/files/upload`;
const config = {
  baseUrl,
  imageUploadUrl,
};
export default config;
