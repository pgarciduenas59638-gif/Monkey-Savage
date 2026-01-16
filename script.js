let qrcode = new QRCode(document.getElementById("qrcode"), {
  width: 200,
  height: 200,
});

function generateQR() {
  const input = document.getElementById("textInput").value.trim();
  if (!input) {
    alert("Por favor ingresa texto o una URL.");
    return;
  }
  qrcode.clear();
  qrcode.makeCode(input);
}