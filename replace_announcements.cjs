const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminPage.tsx', 'utf8');

const importStatement = "import AnnouncementsManagementTab from '../components/AnnouncementsManagementTab';\n";

const startTarget = "{/* Announcements Management */}";
const endTarget = "{/* Leaderboard */}";

const startIdx = content.indexOf(startTarget);
const endIdx = content.indexOf(endTarget);

if (startIdx !== -1 && endIdx !== -1) {
    let newContent = content.substring(0, startIdx) + 
      "{/* Announcements Management */}\n" +
      "      {activeTab === 'announcements' && (\n" +
      "        <AnnouncementsManagementTab profile={profile} gymInfo={gymInfo} />\n" +
      "      )}\n" +
      "\n" +
      "      " +
      content.substring(endIdx);
      
    if (!newContent.includes('AnnouncementsManagementTab')) {
        newContent = importStatement + newContent;
    }
      
    fs.writeFileSync('src/pages/AdminPage.tsx', newContent, 'utf8');
    console.log("Replaced successfully!");
} else {
    console.log("Could not find targets");
}
