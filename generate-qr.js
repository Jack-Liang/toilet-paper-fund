// 生成二维码：node generate-qr.js <网址>
// 用途：网站部署后，用真实网址重新生成 assets/qr-site（svg 用于打印海报，png 用于网页）
const QRCode = require("qrcode");
const path = require("path");

const url = process.argv[2];
if (!url) {
  console.error('用法：node generate-qr.js <网址>   例如：node generate-qr.js https://your-name.github.io/toilet-paper-fund/');
  process.exit(1);
}

const assets = path.join(__dirname, "assets");

(async () => {
  await QRCode.toFile(path.join(assets, "qr-site.svg"), url, {
    width: 1024, margin: 2, errorCorrectionLevel: "M",
    color: { dark: "#211f1c", light: "#0000" },
  });
  await QRCode.toFile(path.join(assets, "qr-site.png"), url, {
    width: 1024, margin: 2, errorCorrectionLevel: "M",
  });
  console.log("已生成 assets/qr-site.svg 和 assets/qr-site.png → " + url);
  console.log("记得同步更新 poster.html 里的链接说明文字（如有）。");
})();
