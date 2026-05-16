const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPage.tsx', 'utf8');

const importStatement = "import OwnerSettingsTab from '../components/OwnerSettingsTab';\n";

const startTarget = "<section className=\"space-y-12\">";
const endTarget = "<div className=\"pt-12 border-t border-white/5 max-w-full\">";

const startIdx = content.indexOf(startTarget);
const endIdx = content.indexOf(endTarget);

if (startIdx !== -1 && endIdx !== -1) {
    let newContent = content.substring(0, startIdx) + 
      "<section className=\"space-y-12\">\n" +
      "          <OwnerSettingsTab gymInfo={gymInfo} />\n" +
      "\n" +
      "          " +
      content.substring(endIdx);
      
    // Add import statement if not already there
    if (!newContent.includes('OwnerSettingsTab')) {
        newContent = importStatement + newContent;
    }
      
    fs.writeFileSync('src/pages/AdminPage.tsx', newContent, 'utf8');
    console.log("Replaced successfully!");
} else {
    console.log("Could not find targets");
}
