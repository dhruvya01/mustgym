const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminPage.tsx', 'utf8');

const replaceSection = (startMarker, endMarker, replacement) => {
    const startIdx = content.indexOf(startMarker);
    const endIdx = content.indexOf(endMarker);
    if (startIdx !== -1 && endIdx !== -1) {
        content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
        console.log(`Replaced section between ${startMarker.trim()} and ${endMarker.substring(0,20).trim()}`);
    } else {
        console.log(`Could not find markers.`);
    }
}

replaceSection("{activeTab === 'equipment' && (", "{/* Payment Management */}", "{activeTab === 'equipment' && (\n        <section>\n          <MachineManagementTab profile={profile} gymInfo={gymInfo} />\n        </section>\n      )}\n\n      ");
replaceSection("{/* Payment Management */}", "{/* Attendance History */}", "{/* Payment Management */}\n      {activeTab === 'payments' && (\n        <section>\n          <PaymentsManagementTab profile={profile} gymInfo={gymInfo} exportToCSV={exportToCSV} />\n        </section>\n      )}\n\n      ");

const importPayment = "import PaymentsManagementTab from '../components/PaymentsManagementTab';\n";
if (!content.includes('PaymentsManagementTab')) {
    content = importPayment + content;
}

fs.writeFileSync('src/pages/AdminPage.tsx', content, 'utf8');
