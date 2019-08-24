let baseUrl = "";
let imageUploadUrl = "";
if (process.env.NODE_ENV === "dev") {
  baseUrl = "http://gr-debug.goodrain.com/";
} else if (process.env.NODE_ENV === "development") {
  // baseUrl = "http://192.168.195.54:7070";
  // baseUrl = "http://192.168.2.197:7070";
  baseUrl = "http://192.168.2.172:7070";
  // baseUrl = "http://192.168.2.100:7070";
} else if (process.env.NODE_ENV === "production") {
  baseUrl = "";
}

imageUploadUrl = `${baseUrl}/console/files/upload`;
const config = {
  baseUrl,
  imageUploadUrl,
};
export default config;
