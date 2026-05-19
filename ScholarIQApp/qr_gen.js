const QRCode = require('qrcode-terminal');
QRCode.generate('http://localhost:8081', { small: true }, function(qr_svg){
  console.log(qr_svg);
});
