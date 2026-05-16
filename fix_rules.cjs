const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace(/getProfile\(request\.auth\.uid\)\.role == 'owner'/g, "(getProfile(request.auth.uid).role == 'owner' || getProfile(request.auth.uid).role == 'admin')");

fs.writeFileSync('firestore.rules', code, 'utf8');
