let baseUrl = "";
let imageUploadUrl = "";
if (process.env.NODE_ENV === "dev") {
  // baseUrl = "http://gr-debug.goodrain.com/";
} else if (process.env.NODE_ENV === "development") {
  baseUrl = "http://39.104.15.64:7070";
} else if (process.env.NODE_ENV === "production") {
  baseUrl = "http://5000.gre13715.2c9v614j.17f4cc.grapps.cn";
}
imageUploadUrl = `${baseUrl}/console/files/upload`;
const config = {
  baseUrl,
  imageUploadUrl,
};
export default config;
